import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { formatCurrency, calculateGST } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

export default function CheckoutPage() {
  const { items, getSubTotal, getGstTotal, getGrandTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

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

      const orderData = {
        userId: user.uid,
        items,
        subTotal: getSubTotal(),
        gstTotal: getGstTotal(),
        grandTotal: getGrandTotal(),
        paymentMethod,
        deliveryDetails,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      clearCart();
      toast.success('Order placed successfully! We will contact you soon.', {
        description: paymentMethod === 'upi' ? 'Please complete the UPI payment using the link sent to your email.' : ''
      });
      navigate('/account');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
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
                  <Input id="firstName" name="firstName" required placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="john@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" required placeholder="+91 9876543210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" required placeholder="Company Building, Floor 4" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" required placeholder="Ahmedabad" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" required placeholder="Gujarat" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" required placeholder="380058" />
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
                    <span className="font-semibold block mb-1">UPI (GPay, PhonePe, Paytm)</span>
                    <span className="text-sm text-muted-foreground font-normal">Pay directly from your bank account using UPI. Secure and fast.</span>
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
          <div className="bg-muted/30 p-8 rounded-xl border border-border h-fit sticky top-28">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span className="font-medium">{formatCurrency(getSubTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST Estimate</span>
                <span className="font-medium">{formatCurrency(getGstTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 mb-8 flex justify-between items-end">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-3xl text-primary">{formatCurrency(getGrandTotal())}</span>
            </div>

            <Button size="lg" className="w-full text-lg font-bold" type="submit" disabled={isProcessing}>
              {isProcessing ? "Processing..." : `Pay ${formatCurrency(getGrandTotal())}`}
            </Button>
            
            {paymentMethod === 'upi' && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                <div className="text-sm font-medium text-primary mb-1">UPI Payment Selected</div>
                <p className="text-xs text-muted-foreground">You will be redirected to complete your payment securely via our payment gateway.</p>
              </div>
            )}
            
            <div className="mt-6 text-center space-y-2">
               <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 Secure Checkout
               </p>
               <p className="text-[10px] text-muted-foreground/70">Your payment information is processed securely. We never store your credit card details.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
