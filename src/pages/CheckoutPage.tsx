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
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, where, getDocs, setDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthStore } from '../store/authStore';
import { X } from 'lucide-react';

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
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
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
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=aurevagifts@gmail.com`);
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

  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

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
      const newOrderRef = doc(collection(db, 'orders'));
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
        status: 'payment_verification_pending',
        createdAt: serverTimestamp(),
      };

      if (paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking') {
        setCreatedOrderId(newOrderRef.id);
        setPendingOrderData({ ref: newOrderRef, data: orderData });
        setIsProcessing(false);
        setShowQR(true);
        return;
      }

      await setDoc(newOrderRef, { ...orderData, status: 'pending' });
      setCreatedOrderId(newOrderRef.id);
      
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

      clearCart();
      setIsProcessing(false);
      setOrderProcessed(true);
      toast.success('Order placed successfully! We will contact you soon.');
      handleDownloadBill(newOrderRef.id);
      setShowSuccessDialog(true);
    } catch (error) {
      toast.error('An error occurred while placing order. Please try again.');
      try {
         handleFirestoreError(error, OperationType.CREATE, 'orders');
      } catch(e) {
         console.error(e);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishPayment = async (utrNumber?: string, file?: File | null) => {
    if (!pendingOrderData) return;
    setIsUploadingPayment(true);
    try {
      const finalData = { ...pendingOrderData.data };
      if (utrNumber) finalData.paymentUtr = utrNumber;
      
      let screenshotUrl = null;
      if (file) {
        const storageRef = ref(storage, `payment_screenshots/${pendingOrderData.ref.id}_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        screenshotUrl = await getDownloadURL(storageRef);
        finalData.paymentScreenshotUrl = screenshotUrl;
      }
      
      await setDoc(pendingOrderData.ref, finalData);
      
      if (appliedCoupon) {
         try {
           await updateDoc(doc(db, 'coupons', appliedCoupon.id), {
              usageCount: increment(1),
              totalRevenue: increment(finalData.grandTotal)
           });
         } catch (e) {
            console.error("Failed to update coupon usage:", e);
         }
      }
      
      clearCart();
      setOrderProcessed(true);
      setShowQR(false);
      toast.success('Payment submitted successfully. Your payment is under verification.');
      setShowSuccessDialog(true);
      setPendingOrderData(null);
    } catch (error) {
       toast.error('Something went wrong. Please try again.');
       handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
       setIsUploadingPayment(false);
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
    const customerCity = addressDetails.city.toLowerCase();
    
    // Default fallback
    let areaEmail = 'aurevagifts@gmail.com';
    let areaPhone = adminSettings?.adminWhatsApp || '919825622421'; // Main group/admin
    
    if (customerCity.includes('mumbai') || customerCity.includes('pune')) {
      areaEmail = 'aurevagifts@gmail.com';
      areaPhone = adminSettings?.adminWhatsApp || '919825622421'; // Would be Maharashtra specific group
    } else if (customerCity.includes('delhi') || customerCity.includes('ncr')) {
      areaEmail = 'aurevagifts@gmail.com';
      areaPhone = adminSettings?.adminWhatsApp || '919825622421'; // Would be North specific group
    } else if (customerCity.includes('bangalore') || customerCity.includes('chennai') || customerCity.includes('hyderabad')) {
      areaEmail = 'aurevagifts@gmail.com';
      areaPhone = adminSettings?.adminWhatsApp || '919825622421'; // Would be South specific group
    }
    
    // Format items list
    const itemsList = items.map(item => {
      let customTag = item.customization?.enabled ? ` (Customized)` : '';
      return `- ${item.quantity}x ${item.name}${customTag}`;
    }).join('\n');
    
    const text = encodeURIComponent(
      `🚨 *New Order Received!*\n\n` +
      `*Area/Territory:* ${addressDetails.city}\n` +
      `*Customer:* ${customerDetails.firstName} ${customerDetails.lastName}\n` +
      `*Phone:* ${customerDetails.phone}\n\n` +
      `*Items Ordered:*\n${itemsList}\n\n` +
      `*Total Value:* ${formatCurrency(getGrandTotal())}\n\n` +
      `Please check the admin panel for complete details.`
    );
    
    const emailSubject = encodeURIComponent(`New Order from ${addressDetails.city} - ${customerDetails.firstName} ${customerDetails.lastName}`);
    const emailBody = encodeURIComponent(`A new order has been placed in your territory.\n\nCustomer: ${customerDetails.firstName} ${customerDetails.lastName}\nCity: ${addressDetails.city}\nTotal: ${formatCurrency(getGrandTotal())}\n\nPlease check the Aureva Admin Dashboard.`);
       
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
              <CardDescription>We accept direct and secure UPI payments.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center space-x-3 space-y-0 border border-green-200 bg-green-50 rounded-lg p-4 cursor-pointer">
                 <div className="bg-green-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/><path d="M12 12h.01"/><path d="M12 7v5"/></svg>
                 </div>
                 <Label className="flex flex-col cursor-pointer w-full">
                   <span className="font-semibold block mb-1 text-green-800">Secure UPI Payment</span>
                   <span className="text-sm text-green-700 font-normal">Pay seamlessly using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.</span>
                 </Label>
               </div>
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
              {isProcessing ? "Processing..." : `Continue to Payment`}
            </Button>
            
            <div className="mt-6 text-center space-y-2">
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 Secure Checkout
               </p>
            </div>
          </div>
        </div>
      </form>

      <Dialog open={showQR} onOpenChange={(open) => {
        if (!open) {
          setShowQR(false);
          setPendingOrderData(null);
          toast.error('Payment not completed.');
        }
      }}>
        <DialogContent showCloseButton={false} className="w-[95vw] sm:max-w-[550px] md:max-w-[600px] text-center p-0 rounded-2xl border-0 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden !fixed !top-1/2 !left-1/2 !-translate-y-1/2 !-translate-x-1/2 z-[100]">
          
          <div className="flex-1 overflow-y-auto w-full relative bg-white">
            <button 
               onClick={() => setShowQR(false)}
               className="sticky top-3 right-3 float-right z-[110] flex h-8 w-8 items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all shadow-sm"
            >
               <X className="w-5 h-5" />
               <span className="sr-only">Close</span>
            </button>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 pt-10 text-white relative flex-shrink-0 -mt-11">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/><path d="M12 12h.01"/><path d="M12 7v5"/></svg>
              </div>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-bold text-white flex items-center justify-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                 Secure UPI Payment
              </DialogTitle>
              <DialogDescription className="text-center text-green-50">
                Scan QR using any UPI app to pay
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col items-center">
               <span className="text-3xl font-bold font-serif mb-1">
                 {formatCurrency(getGrandTotal())}
               </span>
               <span className="text-xs uppercase tracking-widest text-green-100 font-semibold">Order Amount</span>
            </div>
          </div>
          
          <div className="p-6 bg-white flex flex-col items-center flex-shrink-0">
            <div className="bg-white p-4 rounded-xl border shadow-sm relative group w-[220px] h-[220px] flex items-center justify-center mb-6">
                <img 
                  src={(adminSettings?.qrCodeUrl) || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${adminSettings?.upiId || '7990878248@ybl'}&pn=${adminSettings?.upiName || 'Aureva'}&mc=0000&tn=AurevaOrder_${createdOrderId || ''}&am=${getGrandTotal().toFixed(2)}&cu=INR`)}`} 
                  alt="UPI QR Code" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (adminSettings?.qrCodeUrl) {
                      (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${adminSettings?.upiId || '7990878248@ybl'}&pn=${adminSettings?.upiName || 'Aureva'}&mc=0000&tn=AurevaOrder_${createdOrderId || ''}&am=${getGrandTotal().toFixed(2)}&cu=INR`)}`;
                    } else {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }
                  }}
                />
            </div>
            
            <div className="space-y-1 text-center w-full mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{adminSettings?.upiName || 'Aureva Corporate Gifting'}</p>
              <div className="flex items-center justify-center gap-2 bg-slate-50 border py-2 px-4 rounded-lg">
                <p className="text-base font-bold font-mono text-slate-800">{adminSettings?.upiId || '7990878248@ybl'}</p>
                <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-8 w-8 p-0 text-slate-500 hover:text-[#d4af37]"
                   onClick={() => {
                     navigator.clipboard.writeText(adminSettings?.upiId || "7990878248@ybl");
                     toast.success("UPI ID copied to clipboard!");
                   }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </Button>
              </div>
            </div>

            <div className="w-full flex justify-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <Button variant="outline" size="sm" onClick={() => {
                     const link = document.createElement('a');
                     link.href = adminSettings?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`upi://pay?pa=${adminSettings?.upiId || '7990878248@ybl'}&pn=${adminSettings?.upiName || 'Aureva'}&mc=0000&tn=AurevaOrder_${createdOrderId || ''}&am=${getGrandTotal().toFixed(2)}&cu=INR`)}`;
                     link.download = `Aureva_UPI_QR_${createdOrderId}.png`;
                     document.body.appendChild(link);
                     link.click();
                     document.body.removeChild(link);
                }} className="text-slate-600 bg-white shadow-sm font-semibold rounded-full px-4 border-slate-200 hover:bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Download QR
                </Button>
                {isMobile && (
                  <a className={buttonVariants({ size: "sm", variant: "default", className: "bg-[#d4af37] text-[#0F172A] hover:bg-[#F4C542] rounded-full px-4 font-bold shadow-sm" })} href={`upi://pay?pa=7990878248@ybl&pn=Aureva&mc=0000&tn=AurevaOrder_${createdOrderId || ''}&am=${getGrandTotal().toFixed(2)}&cu=INR`}>
                    Pay Now Open App
                  </a>
                )}
            </div>

            <div className="w-full space-y-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left">
                <Label htmlFor="screenshot" className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-2">
                   <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                   Upload Screenshot (Optional)
                </Label>
                <Input 
                  id="screenshot" 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  className="bg-white border-slate-300 text-sm cursor-pointer file:cursor-pointer file:bg-slate-100 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:text-sm file:font-semibold"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left">
                <Label htmlFor="utr" className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-2">
                   <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                   Enter Transaction ID (UTR)
                </Label>
                <Input 
                  id="utr" 
                  placeholder="e.g. 412356789012" 
                  className="font-mono tracking-wider text-base h-12 bg-white border-slate-300"
                />
                <p className="text-[11px] text-slate-500 mt-2">After payment, enter the 12-digit UTR/Reference number.</p>
              </div>
            </div>
          </div>
          </div>
          
          <div className="bg-white p-4 border-t z-20 w-full flex-shrink-0">
            <Button size="lg" disabled={isUploadingPayment} className="w-full text-base font-bold bg-[#0F172A] hover:bg-black disabled:opacity-70 text-white h-14 rounded-xl shadow-md" onClick={() => {
              const utrInput = document.getElementById('utr') as HTMLInputElement;
              const utr = utrInput?.value?.trim();
              if (!utr) {
                toast.error('Please enter transaction ID.');
                return;
              }
              if (utr.length < 12) {
                toast.error('Please enter valid transaction ID.');
                return;
              }
              handleFinishPayment(utr, screenshotFile);
            }}>
              {isUploadingPayment ? (
                <span className="flex items-center gap-2">
                   <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Processing...
                </span>
              ) : "Submit Payment Confirmation"}
            </Button>
          </div>
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
