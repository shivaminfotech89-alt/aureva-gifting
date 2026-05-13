import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../lib/utils';
import { Button, buttonVariants } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, where, getDocs, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { items, getSubTotal, getGstTotal, getGrandTotal, clearCart, appliedCoupon, setCoupon, getDiscount } = useCartStore();
  const { user } = useAuthStore();
  const [adminSettings, setAdminSettings] = useState<{adminWhatsApp?: string, adminEmail?: string} | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  React.useEffect(() => {
    if (appliedCoupon) {
      setCouponInput(appliedCoupon.code);
    }
  }, [appliedCoupon]);

  React.useEffect(() => {
    getDoc(doc(db, 'settings', 'admin')).then(s => {
      if(s.exists()) setAdminSettings(s.data() as any);
    }).catch(() => {});
  }, []);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [paymentUtr, setPaymentUtr] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [addressDetails, setAddressDetails] = useState({
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [customerDetails, setCustomerDetails] = useState({
    firstName: user?.displayName?.split(' ')[0] || '',
    lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
  });

  React.useEffect(() => {
    if (user) {
      setCustomerDetails(prev => ({
        ...prev,
        firstName: prev.firstName || user.displayName?.split(' ')[0] || '',
        lastName: prev.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponMessage('');

    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponInput.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setCouponMessage('Invalid coupon code.');
        setIsValidatingCoupon(false);
        return;
      }

      const couponDoc = snap.docs[0];
      const couponData = { id: couponDoc.id, ...couponDoc.data() } as any;

      if (!couponData.isActive) {
         setCouponMessage('This coupon is no longer active.');
         setIsValidatingCoupon(false);
         return;
      }

      if (couponData.expiryDate && new Date(couponData.expiryDate) < new Date()) {
         setCouponMessage('This coupon has expired.');
         setIsValidatingCoupon(false);
         return;
      }

      if (couponData.maxUsage && (couponData.usageCount || 0) >= Number(couponData.maxUsage)) {
         setCouponMessage('This coupon usage limit has been reached.');
         setIsValidatingCoupon(false);
         return;
      }

      const subtotal = getSubTotal();
      if (subtotal < (couponData.minPurchase || 0)) {
         setCouponMessage(`This coupon is valid only on minimum purchase of ${formatCurrency(couponData.minPurchase)}.`);
         setIsValidatingCoupon(false);
         return;
      }

      setCoupon(couponData);
      setCouponMessage(`Coupon applied successfully!`);
    } catch (error) {
       console.error("Error applying coupon", error);
       setCouponMessage("Failed to validate coupon.");
    } finally {
       setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponMessage('');
  };

  const [showQR, setShowQR] = useState(false);
  const [orderProcessed, setOrderProcessed] = useState(false);
  const navigate = useNavigate();

  const handleFetchLocation = () => {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast.error('Location services require a secure (HTTPS) connection');
      return;
    }
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=shivaminfotech89@gmail.com`);
          if (!res.ok) throw new Error('Failed to fetch location details');
          const data = await res.json();
          
          if (data && data.address) {
            setAddressDetails({
              address: data.display_name || '',
              city: data.address.city || data.address.town || data.address.village || data.address.county || '',
              state: data.address.state || '',
              pincode: data.address.postcode || ''
            });
            toast.success('Location fetched successfully!');
          }
        } catch (error) {
          toast.error('Could not determine address from location');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        toast.error('Location permission denied or unavailable');
      }
    );
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to place an order.');
      navigate('/account/login');
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const deliveryDetails = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
      };

      const totalAmount = getGrandTotal();
      const orderData = {
        userId: user.uid,
        items,
        subTotal: getSubTotal(),
        gstTotal: getGstTotal(),
        discount: getDiscount(),
        couponCode: appliedCoupon?.code || null,
        grandTotal: totalAmount,
        paymentMethod,
        deliveryDetails,
        status: paymentMethod === 'upi' ? 'pending_payment' : 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setCreatedOrderId(docRef.id);
      
      // Update coupon usage statistics
      if (appliedCoupon) {
         try {
           await updateDoc(doc(db, 'coupons', appliedCoupon.id), {
              usageCount: increment(1),
              totalRevenue: increment(totalAmount)
           });
         } catch (e) {
            console.error("Failed to update coupon usage:", e);
         }
      }

      if (paymentMethod === 'upi') {
        setIsProcessing(false);
        // Direct UPI Intents for Mobile - 100% reliable for GPay/PhonePe/Paytm
        if (isMobile) {
          setShowQR(true);
          return;
        }

        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if (!res) {
          toast.error("Payment Gateway failed to load. Fallback to manual QR.");
          setShowQR(true);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag", // Dummy test key for Demo
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          name: "Aureva Corporate Gifting",
          description: "Order Payment",
          handler: async function (response: any) {
            try {
              await updateDoc(doc(db, 'orders', docRef.id), {
                status: 'paid',
                paymentId: response.razorpay_payment_id,
                updatedAt: serverTimestamp()
              });
              toast.success('Payment successful!');
              clearCart();
              setOrderProcessed(true);
              setShowQR(false);
              setShowSuccessDialog(true);
            } catch (err) {
               console.error(err);
               toast.error('Failed to update order status');
               setShowQR(true);
            }
          },
          modal: {
            ondismiss: function() {
              toast.info("Payment window closed. Please try again or use the QR code.");
              setShowQR(true);
            }
          },
          prefill: {
            name: `${deliveryDetails.firstName} ${deliveryDetails.lastName}`,
            email: deliveryDetails.email,
            contact: deliveryDetails.phone,
          },
          theme: {
            color: "#0F172A",
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on('payment.failed', async function (response: any) {
          try {
            await updateDoc(doc(db, 'orders', docRef.id), {
               failedPaymentLogs: [
                 { reason: response.error.description || 'Payment Failed', code: response.error.code, time: new Date().toISOString() }
               ]
            });
          } catch(e){}
          toast.error("Payment failed. Please try again or use the QR code.");
          setShowQR(true);
        });
        paymentObject.open();
      } else {
        clearCart();
        setIsProcessing(false);
        setOrderProcessed(true);
        toast.success('Order placed successfully! We will contact you soon.');
        handleDownloadBill(docRef.id);
        setShowSuccessDialog(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      setIsProcessing(false);
    }
  };

  const handleFinishPayment = async (utrNumber?: string) => {
    try {
      if (createdOrderId && paymentMethod === 'upi') {
        const updateData: any = {
           status: 'admin_approval',
           updatedAt: serverTimestamp()
        };
        if (utrNumber) {
           updateData.paymentUtr = utrNumber;
        }
        await updateDoc(doc(db, 'orders', createdOrderId), updateData);
      }
      
      clearCart();
      setOrderProcessed(true);
      setShowQR(false);
      toast.success('Order placed! We will verify your payment details shortly.');
      setShowSuccessDialog(true);
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'orders');
    }
  };

  const handleDownloadBill = async (orderIdToFetch?: string | any) => {
    const targetOrderId = typeof orderIdToFetch === 'string' ? orderIdToFetch : createdOrderId;
    if (!targetOrderId) return;
    
    // Open window synchronously to avoid popup blockers
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download your bill.');
      return;
    }
    
    printWindow.document.write('<html><head><title>Loading Bill...</title></head><body><h2>Generating Invoice...</h2></body></html>');
    
    try {
      const orderSnap = await getDoc(doc(db, 'orders', targetOrderId));
      if (!orderSnap.exists()) {
        printWindow.close();
        return;
      }
      
      const order = { id: orderSnap.id, ...orderSnap.data() } as any;

      const itemsHtml = order.items.map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">
            ${item.name}
            ${item.customization?.enabled ? `<br><small style="color: #666; font-size: 11px;">+ Customization (${item.customization.customText ? `Text: ${item.customization.customText}` : ''} ${item.customization.logoUrl ? 'Logo' : ''})</small>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${((item.basePrice + (item.customization?.charge || 0))) * item.quantity}</td>
        </tr>
      `).join('');

      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #111; }
            .invoice-details { text-align: right; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666; margin-bottom: 8px; }
            .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; font-weight: bold; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.grand { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 12px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <div class="logo">AUREVA</div>
                <p>Ahmedabad, Gujarat<br>380058, India<br>aurevagifts@gmail.com</p>
              </div>
              <div class="invoice-details">
                <h1 style="margin:0; font-size: 28px;">INVOICE</h1>
                <p><strong>Order ID:</strong> ${order.id}<br>
                <strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt.toMillis()).toLocaleDateString() : new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="addresses">
              <div>
                <div class="section-title">Billed To:</div>
                <p>
                  <strong>${order.deliveryDetails?.firstName || ''} ${order.deliveryDetails?.lastName || ''}</strong><br>
                  ${order.deliveryDetails?.address || ''}<br>
                  ${order.deliveryDetails?.city || ''}, ${order.deliveryDetails?.state || ''} ${order.deliveryDetails?.pincode || ''}<br>
                  ${order.deliveryDetails?.email || ''}<br>
                  ${order.deliveryDetails?.phone || ''}
                </p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>₹${order.subTotal}</span>
              </div>
              <div class="totals-row">
                <span>GST</span>
                <span>₹${order.gstTotal}</span>
              </div>
              <div class="totals-row">
                <span>Delivery</span>
                <span>Free</span>
              </div>
              <div class="totals-row grand">
                <span>Grand Total</span>
                <span>₹${order.grandTotal}</span>
              </div>
            </div>
            
            <div style="margin-top: 60px; font-size: 14px; color: #666; text-align: center;">
              Thank you for shopping with Aureva!
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `;
      printWindow.document.open();
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
    } catch (err) {
      console.error('Error generating bill:', err);
      printWindow.close();
    }
  };

  const notifyAdminWhatsApp = () => {
    // Area Group Routing Logic
    const customerCity = customerDetails.city.toLowerCase();
    
    // Default fallback
    let areaEmail = 'orders@aureva.com';
    let areaPhone = adminSettings?.adminWhatsApp || '919825622421'; // Main group/admin
    
    if (customerCity.includes('mumbai') || customerCity.includes('pune')) {
      areaEmail = 'maharashtra_admin@aureva.com';
      areaPhone = adminSettings?.adminWhatsApp || '919825622421'; // Would be Maharashtra specific group
    } else if (customerCity.includes('delhi') || customerCity.includes('ncr')) {
      areaEmail = 'north_admin@aureva.com';
      areaPhone = adminSettings?.adminWhatsApp || '919825622421'; // Would be North specific group
    } else if (customerCity.includes('bangalore') || customerCity.includes('chennai') || customerCity.includes('hyderabad')) {
      areaEmail = 'south_admin@aureva.com';
      areaPhone = adminSettings?.adminWhatsApp || '919825622421'; // Would be South specific group
    }
    
    // Format items list
    const itemsList = items.map(item => {
      let customTag = item.customization?.enabled ? ` (Customized)` : '';
      return `- ${item.quantity}x ${item.name}${customTag}`;
    }).join('\n');
    
    const text = encodeURIComponent(
      `🚨 *New Order Received!*\n\n` +
      `*Area/Territory:* ${customerDetails.city}\n` +
      `*Customer:* ${customerDetails.firstName} ${customerDetails.lastName}\n` +
      `*Phone:* ${customerDetails.phone}\n\n` +
      `*Items Ordered:*\n${itemsList}\n\n` +
      `*Total Value:* ${formatCurrency(getGrandTotal())}\n\n` +
      `Please check the admin panel for complete details.`
    );
    
    const emailSubject = encodeURIComponent(`New Order from ${customerDetails.city} - ${customerDetails.firstName} ${customerDetails.lastName}`);
    const emailBody = encodeURIComponent(`A new order has been placed in your territory.\n\nCustomer: ${customerDetails.firstName} ${customerDetails.lastName}\nCity: ${customerDetails.city}\nTotal: ${formatCurrency(getGrandTotal())}\n\nPlease check the Aureva Admin Dashboard.`);
       
    // Trigger Email to Area Admin
    window.location.href = `mailto:${areaEmail}?subject=${emailSubject}&body=${emailBody}`;
    
    // Trigger WhatsApp
    setTimeout(() => {
      window.open(`https://wa.me/${areaPhone}?text=${text}`, '_blank');
      navigate('/account');
    }, 500);
  };

  if (items.length === 0 && !orderProcessed) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <Button onClick={() => navigate('/shop')}>Go to Shop</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-7xl">
      <h1 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-10 text-primary">Checkout</h1>
      
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
              <CardDescription>Where should we deliver your order?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" required placeholder="John" value={customerDetails.firstName} onChange={e => setCustomerDetails(p => ({...p, firstName: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required placeholder="Doe" value={customerDetails.lastName} onChange={e => setCustomerDetails(p => ({...p, lastName: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="john@company.com" value={customerDetails.email} onChange={e => setCustomerDetails(p => ({...p, email: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" required placeholder="+91 9876543210" value={customerDetails.phone} onChange={e => setCustomerDetails(p => ({...p, phone: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="address">Address</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleFetchLocation} disabled={isFetchingLocation} className="text-xs h-7 text-primary hover:text-primary/80">
                    {isFetchingLocation ? "Fetching..." : "📍 Use current location"}
                  </Button>
                </div>
                <Input id="address" name="address" required placeholder="Company Building, Floor 4" value={addressDetails.address} onChange={e => setAddressDetails({ ...addressDetails, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" required placeholder="Ahmedabad" value={addressDetails.city} onChange={e => setAddressDetails({ ...addressDetails, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" required placeholder="Gujarat" value={addressDetails.state} onChange={e => setAddressDetails({ ...addressDetails, state: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" required placeholder="380058" value={addressDetails.pincode} onChange={e => setAddressDetails({ ...addressDetails, pincode: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select how you would like to pay.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                <div className="flex items-center space-x-3 space-y-0 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="upi" id="payment-upi" />
                  <Label htmlFor="payment-upi" className="flex flex-col cursor-pointer w-full">
                    <span className="font-semibold block mb-1">UPI / QR Code</span>
                    <span className="text-sm text-muted-foreground font-normal">Pay seamlessly by scanning our QR Code or via UPI ID.</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 space-y-0 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="card" id="payment-card" />
                  <Label htmlFor="payment-card" className="flex flex-col cursor-pointer w-full">
                    <span className="font-semibold block mb-1">Credit / Debit Card</span>
                    <span className="text-sm text-muted-foreground font-normal">We accept all major credit and debit cards.</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 space-y-0 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="netbanking" id="payment-netbanking" />
                  <Label htmlFor="payment-netbanking" className="flex flex-col cursor-pointer w-full">
                    <span className="font-semibold block mb-1">Net Banking</span>
                    <span className="text-sm text-muted-foreground font-normal">Transfer directly from your bank's portal.</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

        </div>

        <div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit sticky top-28">
            <h2 className="text-2xl font-bold font-serif mb-6 text-[#0F172A]">Order Summary</h2>

            <div className="mb-6 pb-6 border-b border-slate-100">
               <Label className="font-bold text-slate-700 text-sm mb-2 block">Have a coupon code?</Label>
               <div className="flex gap-2">
                 <Input 
                   value={couponInput}
                   onChange={e => setCouponInput(e.target.value.toUpperCase())}
                   placeholder="Enter code" 
                   className="rounded-xl uppercase font-mono tracking-wider h-11"
                   disabled={!!appliedCoupon || isValidatingCoupon}
                 />
                 {appliedCoupon ? (
                   <Button type="button" variant="outline" onClick={handleRemoveCoupon} className="rounded-xl h-11 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 border-slate-200">
                     Remove
                   </Button>
                 ) : (
                   <Button type="button" onClick={handleApplyCoupon} disabled={!couponInput.trim() || isValidatingCoupon} className="bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] rounded-xl h-11 px-6 font-bold shadow-sm transition-all">
                     {isValidatingCoupon ? "Validating..." : "Apply"}
                   </Button>
                 )}
               </div>
               {couponMessage && (
                 <p className={`text-xs font-bold mt-2 ${couponMessage.includes('Invalid') || couponMessage.includes('expired') || couponMessage.includes('minimum') ? 'text-red-500' : 'text-green-600'}`}>
                   {couponMessage}
                 </p>
               )}
            </div>

            <div className="space-y-4 mb-8 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Subtotal ({items.length} items)</span>
                <span className="font-bold text-[#0F172A] text-base">{formatCurrency(getSubTotal())}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">GST Estimate</span>
                <span className="font-bold text-[#0F172A] text-base">{formatCurrency(getGstTotal())}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-bold uppercase tracking-wider text-[11px]">Discount ({appliedCoupon.code})</span>
                  <span className="font-bold text-base">-{formatCurrency(getDiscount())}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Delivery</span>
                <span className="font-bold text-[#d4af37] text-[11px] uppercase tracking-wider">Free</span>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-6 mb-8 flex justify-between items-end">
              <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Total</span>
              <span className="font-bold font-serif text-4xl text-[#0F172A]">{formatCurrency(getGrandTotal())}</span>
            </div>

            <Button size="lg" className="w-full text-base font-bold bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] rounded-xl h-14 shadow-sm transition-all" type="submit" disabled={isProcessing}>
              {isProcessing ? "Processing..." : `Pay ${formatCurrency(getGrandTotal())}`}
            </Button>
            
            {paymentMethod === 'upi' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Razorpay UPI Payment</div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Redirecting securely via payment gateway...</p>
              </div>
            )}
            
            <div className="mt-6 text-center space-y-2">
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 Secure Checkout
               </p>
            </div>
          </div>
        </div>
      </form>

      <Dialog open={showQR} onOpenChange={(open) => !open && handleFinishPayment()}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Scan to Pay</DialogTitle>
            <DialogDescription className="text-center text-base">
              Please pay {formatCurrency(getGrandTotal())} to complete your order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              {isMobile ? (
                  <a className={buttonVariants({ size: "lg", className: "w-full h-16 text-lg" })} href={`upi://pay?pa=7990878248@ybl&pn=Aureva&mc=0000&tn=AurevaOrder_${createdOrderId || ''}&am=${getGrandTotal().toFixed(2)}&cu=INR`}>
                    Pay with UPI App
                  </a>
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=7990878248@ybl&pn=Aureva&mc=0000&tn=AurevaOrder_${createdOrderId || ''}&am=${getGrandTotal().toFixed(2)}&cu=INR`)}`} 
                  alt="UPI QR Code" 
                  className="w-56 h-56"
                />
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Company UPI ID</p>
              <p className="text-xl font-bold font-mono bg-muted py-2 px-6 rounded-lg select-all">7990878248@ybl</p>
            </div>

            <div className="w-full space-y-2 mt-4 text-left">
              <Label htmlFor="utr" className="font-bold">Enter UTR / Reference ID</Label>
              <Input 
                id="utr" 
                placeholder="e.g. 412345678901" 
                className="font-mono text-center tracking-widest text-lg h-12"
              />
              <p className="text-xs text-muted-foreground text-center">Please enter the 12-digit UTR number from your payment app.</p>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button size="lg" className="w-full text-lg" onClick={() => {
              const utrInput = document.getElementById('utr') as HTMLInputElement;
              if (utrInput && utrInput.value.trim() !== '') {
                handleFinishPayment(utrInput.value.trim());
              } else {
                toast.error('Please enter the UTR number to proceed.');
              }
            }}>
              Verify Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={(open) => !open && navigate('/account')}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-green-600">Order Placed Successfully!</DialogTitle>
            <DialogDescription className="text-center text-base">
              Your order has been recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <p className="text-sm text-muted-foreground mb-4">Would you like to notify us immediately on WhatsApp for faster processing?</p>
             <div className="flex flex-col gap-3">
               <Button onClick={notifyAdminWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white">
                 Notify Admin via WhatsApp
               </Button>
               {paymentMethod !== 'upi' && (
                 <Button onClick={handleDownloadBill} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                   Download Bill / Invoice
                 </Button>
               )}
               <Button variant="outline" onClick={() => navigate('/account')} className="w-full">
                 Go to Dashboard
               </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
