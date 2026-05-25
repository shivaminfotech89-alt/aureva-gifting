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
import { sendOrderEmailNotification } from '../lib/notifications';
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
      const cleanData = JSON.parse(JSON.stringify({
        userId: user.uid,
        items,
        subTotal: getSubTotal(),
        gstTotal: getGstTotal(),
        discount: getDiscount(),
        couponCode: appliedCoupon?.code || null,
        grandTotal: totalAmount,
        paymentMethod: 'pending_request',
        deliveryDetails,
        status: 'inquiry_received',
      }));

      const orderData = {
        ...cleanData,
        createdAt: serverTimestamp(),
      };

      await setDoc(newOrderRef, orderData);
      setCreatedOrderId(newOrderRef.id);
      
      const adminEmail = adminSettings?.adminEmail || 'aurevagifts@gmail.com';
      await addDoc(collection(db, 'admin_notifications'), {
        type: 'NEW_ORDER',
        title: 'New Order Request Received',
        message: `Order Inquiry #${newOrderRef.id} received from ${deliveryDetails.firstName} ${deliveryDetails.lastName}`,
        orderId: newOrderRef.id,
        customerName: `${deliveryDetails.firstName} ${deliveryDetails.lastName}`,
        amount: totalAmount,
        status: 'pending',
        read: false,
        createdAt: serverTimestamp()
      });
      await sendOrderEmailNotification({
        orderId: newOrderRef.id,
        customerName: `${deliveryDetails.firstName} ${deliveryDetails.lastName}`,
        customerEmail: deliveryDetails.email,
        amount: totalAmount
      }, adminEmail);
      
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
      toast.success('Order request submitted successfully! We will contact you soon.');
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
      <h1 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-6 text-primary">Checkout</h1>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-10 flex items-start gap-3">
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
         <p className="text-sm text-amber-800 font-medium">
           <strong className="font-bold">IMPORTANT:</strong> AUREVA specializes in bulk corporate gifting orders. Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.
         </p>
      </div>

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

            <Button size="lg" className="w-full text-base font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl h-14 shadow-xl transition-all" type="submit" disabled={isProcessing}>
              {isProcessing ? "Processing..." : `Place Order Request`}
            </Button>
            
            <div className="mt-6 text-center space-y-2 text-slate-500 mb-2">
               <p className="text-xs font-medium px-4">
                 Our team will verify product availability, customization requirements, and delivery timeline. You will receive payment instructions after confirmation.
               </p>
            </div>
          </div>
        </div>
      </form>

      <Dialog open={showSuccessDialog} onOpenChange={(open) => !open && navigate('/account')}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-green-600">Order Request Submitted!</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-left space-y-4 text-sm text-slate-700">
             <p className="font-semibold text-center text-base text-green-700">Your order request has been submitted successfully.</p>
             <p>Our team will review:</p>
             <ul className="list-disc pl-5 space-y-1">
               <li>Product availability</li>
               <li>Quantity requirements</li>
               <li>Branding feasibility</li>
               <li>Delivery timeline</li>
             </ul>
             <p className="font-semibold text-center mt-4 text-[#d4af37]">Payment instructions will be shared after confirmation.</p>
          </div>
          <div className="py-4 border-t border-slate-100 mt-2">
             <p className="text-sm text-muted-foreground mb-4">Would you like to notify us immediately on WhatsApp for faster processing?</p>
             <div className="flex flex-col gap-3">
               <Button onClick={notifyAdminWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white">
                 Notify Admin via WhatsApp
               </Button>
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
