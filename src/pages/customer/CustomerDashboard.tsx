import React, { useEffect, useState } from 'react';
import { useAuthStore, SavedAddress } from '../../store/authStore';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button, buttonVariants } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Package, User, FileText, CheckCircle2, Clock, Truck, ShieldCheck, MapPin, X, ArrowRight, Settings, LogOut, Heart, ShoppingBag, RefreshCw, XCircle, Plus, Edit2, Trash2, Smartphone } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { upiPayLink, upiQrImageUrl } from '../../lib/upi';
import { BUSINESS, registeredAddressLines, splitGst } from '../../lib/business';
import { auth } from '../../lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  items: any[];
  subTotal: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  createdAt: any;
  deliveryDetails: any;
  dispatchDetails?: any;
}

// Address shape lives in the auth store so the checkout page and this page
// cannot drift apart.
type Address = SavedAddress;

const CUSTOMER_ORDER_STATUSES = [
  { id: 'inquiry_received', label: 'Inquiry Received', icon: Clock },
  { id: 'awaiting_payment', label: 'Awaiting Payment', icon: Clock },
  { id: 'payment_verification_pending', label: 'Payment Verification Pending', icon: ShieldCheck },
  { id: 'paid', label: 'Paid', icon: CheckCircle2 },
  { id: 'processing', label: 'Processing', icon: RefreshCw },
  { id: 'dispatched', label: 'Dispatched', icon: Truck },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const getCustomerStatus = (internalStatus: string) => {
  if (['pending_supplier_confirmation', 'supplier_confirmed', 'pending'].includes(internalStatus)) {
    return 'inquiry_received';
  }
  return internalStatus;
};

export default function CustomerDashboard() {
  const { user, profile } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [adminSettings, setAdminSettings] = useState<{adminWhatsApp?: string; upiId?: string; upiName?: string; qrCodeUrl?: string} | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    isDefault: false
  });

  useEffect(() => {
    if (profile?.savedAddresses) {
      setAddresses(profile.savedAddresses);
    }
  }, [profile]);

  useEffect(() => {
    import('firebase/firestore').then(({ doc, getDoc }) => {
      getDoc(doc(db, 'settings', 'admin')).then(s => {
        if(s.exists()) setAdminSettings(s.data() as any);
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    
    setLoadingOrders(true);
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(fetchedOrders);
      
      // Update selected order if it's currently open
      setSelectedOrder(current => {
        if (!current) return null;
        return fetchedOrders.find(o => o.id === current.id) || current;
      });
      
      setLoadingOrders(false);
    }, (error) => {
      setLoadingOrders(false);
      try {
         handleFirestoreError(error, OperationType.LIST, 'orders');
      } catch (e) {
         console.error(e);
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto p-12 text-center h-screen flex flex-col items-center justify-center gap-4">
        <div className="font-display text-2xl text-zinc-500">Please login to view your account.</div>
        <Link to="/account/login">
           <Button className="bg-[#0a192f] hover:bg-[#0a192f]/90 text-white font-bold h-12 px-8 rounded-xl">
             Go to Login Page
           </Button>
        </Link>
      </div>
    );
  }

  const handleSaveAddress = async () => {
    if (!addressForm.firstName || !addressForm.address || !addressForm.city || !addressForm.pincode || !addressForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      let updatedAddresses = [...addresses];
      
      if (addressForm.isDefault) {
        updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
      } else if (updatedAddresses.length === 0) {
        addressForm.isDefault = true;
      }

      if (editingAddressId) {
        updatedAddresses = updatedAddresses.map(a => a.id === editingAddressId ? { ...addressForm, id: editingAddressId } : a);
      } else {
        updatedAddresses.push({ ...addressForm, id: Date.now().toString() });
      }

      await updateDoc(doc(db, 'users', user.uid), {
        savedAddresses: updatedAddresses,
        updatedAt: serverTimestamp()
      });

      setAddresses(updatedAddresses);
      setIsAddressModalOpen(false);
      setEditingAddressId(null);
      setAddressForm({
        firstName: '', lastName: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', isDefault: false
      });
      toast.success(editingAddressId ? 'Address updated successfully' : 'Address added successfully');
      
    } catch (error: any) {
      toast.error('Failed to save address: ' + error.message);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const updatedAddresses = addresses.filter(a => a.id !== id);
      if (updatedAddresses.length > 0 && addresses.find(a => a.id === id)?.isDefault) {
         updatedAddresses[0].isDefault = true;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        savedAddresses: updatedAddresses,
        updatedAt: serverTimestamp()
      });

      setAddresses(updatedAddresses);
      toast.success('Address deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete address: ' + error.message);
    }
  };

  const handleFinishPayment = async (utrNumber: string) => {
    if (!paymentOrder) return;
    setIsUploadingPayment(true);
    try {
      await updateDoc(doc(db, 'orders', paymentOrder.id), {
         status: 'payment_verification_pending',
         paymentMethod: 'upi',
         utrNumber,
         paymentSubmittedAt: serverTimestamp()
      });
      toast.success('Your payment is under verification. Invoice and order confirmation will be generated after successful payment verification.');
      setPaymentOrder(null);
    } catch(err: any) {
      toast.error('Failed to submit payment verification: ' + err.message);
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e4e4e7;">${item.name}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e4e4e7; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e4e4e7; text-align: right;">₹${item.basePrice * item.quantity}</td>
      </tr>
    `).join('');

    const placeOfSupply = order.deliveryDetails?.state || '';
    const tax = splitGst(Number(order.gstTotal) || 0, placeOfSupply);
    const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const taxRow = (label: string, amount: number) =>
      `<div class="totals-row"><span>${label}</span><span>${money(amount)}</span></div>`;
    const taxLinesHtml = tax.intraState
      ? taxRow('CGST (9%)', tax.cgst) + taxRow('SGST (9%)', tax.sgst)
      : taxRow('IGST (18%)', tax.igst);

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #18181b; line-height: 1.6; background-color: #fafafa; margin: 0; padding: 40px; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 50px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 1px solid #f4f4f5; }
          .header { display: flex; justify-content: space-between; margin-bottom: 50px; border-bottom: 2px solid #e4e4e7; padding-bottom: 30px; }
          .logo-container { display: flex; align-items: center; gap: 12px; }
          .logo { font-size: 26px; font-weight: 900; color: var(--navy-800); letter-spacing: 0.15em; text-transform: uppercase; font-family: serif; line-height: 1; margin-bottom: 4px; }
          .logo-sub { color: var(--gold-500); font-size: 10px; letter-spacing: 0.3em; display: block; font-weight: 700; text-transform: uppercase; font-family: sans-serif; }
          .invoice-details { text-align: right; }
          .section-title { font-weight: 600; text-transform: uppercase; font-size: 11px; color: #71717a; letter-spacing: 0.05em; margin-bottom: 12px; }
          .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #f1f5f9; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 12px 16px; border-bottom: 2px solid #e4e4e7; font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
          td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; }
          .totals { margin-left: auto; width: 320px; background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #f1f5f9;}
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; color: #475569; font-size: 14px; }
          .totals-row.grand { font-weight: 700; color: var(--navy-800); font-size: 1.25em; border-top: 2px solid #e2e8f0; padding-top: 16px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="logo-container">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2L6 16L16 30L26 16L16 2Z" stroke="var(--gold-500)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 8L10 16L16 24L22 16L16 8Z" stroke="var(--gold-500)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 13L13.5 16L16 19L18.5 16L16 13Z" fill="var(--gold-500)"/>
                </svg>
                <div>
                  <div class="logo">AUREVA</div>
                  <span class="logo-sub">Corporate Gifting</span>
                </div>
              </div>
              <p style="color: #64748b; font-size: 13px; margin-top: 20px; line-height: 1.6;">
                <strong style="color:#27272a;">${BUSINESS.tradeName}</strong><br>
                <span style="color:#71717a;">Proprietor: ${BUSINESS.legalName}</span><br>
                ${registeredAddressLines().join('<br>')}<br>
                <strong style="color:#27272a;">GSTIN: ${BUSINESS.gstin}</strong><br>
                aurevagifts@gmail.com
              </p>
            </div>
            <div class="invoice-details">
              <h1 style="margin:0; font-size: 32px; font-weight: 800; color: var(--navy-800); letter-spacing: 0.05em; font-family: serif;">TAX INVOICE</h1>
              <p style="color: #71717a; font-size: 14px; margin-top: 16px;">
                <strong>Order ID:</strong> #${order.id.slice(-8).toUpperCase()}<br>
                <strong>Date:</strong> ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                ${placeOfSupply ? `<br><strong>Place of Supply:</strong> ${placeOfSupply}` : ''}</p>
            </div>
          </div>
          
          <div class="addresses">
            <div>
              <div class="section-title">Billed To</div>
              <p style="margin: 0;">
                <strong style="font-size: 16px; color: #09090b;">${order.deliveryDetails?.firstName || ''} ${order.deliveryDetails?.lastName || ''}</strong><br>
                <span style="color: #52525b;">
                  ${order.deliveryDetails?.address || ''}<br>
                  ${order.deliveryDetails?.city || ''}, ${order.deliveryDetails?.state || ''} ${order.deliveryDetails?.pincode || ''}<br>
                  ${order.deliveryDetails?.email || ''}<br>
                  ${order.deliveryDetails?.phone || ''}
                </span>
              </p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
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
            ${taxLinesHtml}
            <div class="totals-row">
              <span>Shipping</span>
              <span style="color: #10b981; font-weight: 500;">Free</span>
            </div>
            <div class="totals-row grand">
              <span>Total Amount</span>
              <span>₹${order.grandTotal}</span>
            </div>
          </div>
          
          <div style="margin-top: 80px; font-size: 14px; color: #a1a1aa; text-align: center; border-top: 1px dashed #e4e4e7; padding-top: 32px;">
            Thank you for choosing ${BUSINESS.brand}. We appreciate your business.<br/>
            ${BUSINESS.brand} is a brand of ${BUSINESS.tradeName}, GSTIN ${BUSINESS.gstin}.<br/>
            This is a computer-generated invoice and requires no signature.
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  // The payee comes from Admin -> Settings; the fallback in lib/upi covers a
  // site that has not set one.
  const upiLink = upiPayLink({
    upiId: adminSettings?.upiId,
    payeeName: adminSettings?.upiName,
    amount: paymentOrder?.grandTotal,
    orderId: paymentOrder?.id,
  });
  const upiQrUrl = upiQrImageUrl(upiLink);

  return (
    <div className="bg-zinc-50 min-h-screen pb-24">
      {/* Premium Header */}
      <div className="bg-zinc-950 text-white pt-24 pb-32">
        <div className="container mx-auto px-4 max-w-[80rem]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-xl border border-amber-300 transform rotate-3">
                 <div className="bg-zinc-950 w-full h-full rounded-xl flex items-center justify-center transform -rotate-3 text-amber-500 font-display text-3xl font-bold">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : user.phoneNumber?.slice(-1) || 'C'}
                 </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-[1.75rem] font-bold font-display">{profile?.name || 'Customer Dashboard'}</h1>
                <p className="text-zinc-400 text-lg">{user.email || user.phoneNumber}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active Account
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 max-w-[80rem] -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl overflow-hidden rounded-xl bg-white sticky top-24">
              <div className="p-2">
                 <button 
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-zinc-950 text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-600'}`}
                 >
                   <div className="flex items-center gap-3 font-medium">
                      <ShoppingBag className="w-5 h-5" /> Order History
                   </div>
                   {activeTab === 'orders' && <ArrowRight className="w-4 h-4 text-amber-500" />}
                 </button>
                 <button 
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeTab === 'addresses' ? 'bg-zinc-950 text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-600'}`}
                 >
                   <div className="flex items-center gap-3 font-medium">
                      <MapPin className="w-5 h-5" /> Saved Addresses
                   </div>
                   {activeTab === 'addresses' && <ArrowRight className="w-4 h-4 text-amber-500" />}
                 </button>
                 <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-zinc-950 text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-600'}`}
                 >
                   <div className="flex items-center gap-3 font-medium">
                      <Settings className="w-5 h-5" /> Account Settings
                   </div>
                   {activeTab === 'profile' && <ArrowRight className="w-4 h-4 text-amber-500" />}
                 </button>
              </div>
              <div className="border-t border-zinc-100 p-4">
                 <button 
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center gap-3 p-4 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
                 >
                    <LogOut className="w-5 h-5" /> Sign Out
                 </button>
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-8">
            
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold font-display text-zinc-900">Recent Orders</h2>
                  <Link to="/shop" className="text-sm font-bold text-amber-600 flex items-center gap-1 hover:text-amber-700 transition-colors uppercase tracking-wider">
                     Browse Shop <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {loadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="h-48 bg-zinc-200/50 animate-pulse rounded-xl"></div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <Card className="bg-white border-0 shadow-lg text-center p-16 rounded-xl">
                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                       <Package className="h-10 w-10 text-zinc-400" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-3 text-zinc-900">No Orders Yet</h3>
                    <p className="text-zinc-500 mb-8 max-w-md mx-auto">Discover our collection of premium corporate gifts and place your first order today.</p>
                    <Link to="/shop">
                       <Button className="h-12 px-8 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-base font-bold shadow-md">
                          Start Shopping
                       </Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => (
                      <Card key={order.id} className="overflow-hidden border-0 shadow-lg rounded-xl bg-white hover:shadow-xl transition-shadow duration-300">
                        {/* Order Header */}
                        <div className="bg-zinc-50 px-6 py-5 border-b border-zinc-100 flex flex-col sm:flex-row gap-5 justify-between sm:items-center">
                          <div className="flex flex-wrap gap-8 text-sm">
                            <div>
                              <div className="text-zinc-500 mb-1 uppercase tracking-wider text-[10px] font-bold">Order Placed</div>
                              <div className="font-semibold text-zinc-900">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-500 mb-1 uppercase tracking-wider text-[10px] font-bold">Total Amount</div>
                              <div className="font-semibold text-zinc-900">{formatCurrency(order.grandTotal)}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 mb-1 uppercase tracking-wider text-[10px] font-bold">Order ID</div>
                              <div className="font-mono font-medium text-zinc-600 bg-zinc-200/50 px-2 py-0.5 rounded">#{order.id.slice(-8).toUpperCase()}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                               ${getCustomerStatus(order.status) === 'delivered' ? 'bg-green-100 text-green-700' : ''}
                               ${getCustomerStatus(order.status) === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                               ${['pending', 'processing', 'paid', 'awaiting_payment', 'payment_verification_pending', 'inquiry_received'].includes(getCustomerStatus(order.status)) ? 'bg-amber-100 text-amber-700' : ''}
                               ${['dispatched', 'out_for_delivery'].includes(getCustomerStatus(order.status)) ? 'bg-blue-100 text-blue-700' : ''}
                            `}>
                               {getCustomerStatus(order.status).replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <CardContent className="p-0">
                          <div className="divide-y divide-zinc-100">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex gap-6 p-6">
                                <div className="h-24 w-24 bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden shrink-0 group">
                                  {item.image ? (
                                     <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                     <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                        <Package className="w-8 h-8" />
                                     </div>
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                  <h4 className="font-bold text-zinc-900 text-lg mb-1 line-clamp-1">{item.name}</h4>
                                  <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium">
                                     <span>Qty: {item.quantity}</span>
                                     <span>•</span>
                                     <span className="text-amber-600 font-bold">{formatCurrency(item.basePrice * item.quantity)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                               <div className="p-4 text-center bg-zinc-50/50 text-sm font-medium text-zinc-500">
                                  + {order.items.length - 3} more items in this order
                               </div>
                            )}
                          </div>
                        </CardContent>

                        {/* Order Actions */}
                        <div className="bg-white px-6 py-4 border-t border-zinc-100 flex justify-end gap-3 flex-wrap">
                            {getCustomerStatus(order.status) === 'awaiting_payment' && (
                               <Button size="sm" onClick={() => setPaymentOrder(order)} className="h-10 px-4 rounded-lg font-bold bg-[var(--gold-500)] text-[var(--navy-800)] hover:bg-[var(--gold-400)] shadow-sm">
                                 Pay Now
                               </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} className="h-10 px-4 rounded-lg font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                              Track Status
                            </Button>
                            
                            {['paid', 'processing', 'dispatched', 'out_for_delivery', 'delivered'].includes(getCustomerStatus(order.status)) ? (
                              <Button variant="outline" size="sm" onClick={() => handlePrintInvoice(order)} className="h-10 px-4 rounded-lg font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50 gap-2">
                                <FileText className="h-4 w-4 text-zinc-400" /> Download Invoice
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled className="h-10 px-4 rounded-lg font-bold border-zinc-200 text-zinc-400 opacity-60">
                                <FileText className="h-4 w-4 mr-2" /> Invoice Pending
                              </Button>
                            )}

                            {adminSettings?.adminWhatsApp && (
                              <Button 
                                size="sm" 
                                className="h-10 px-4 rounded-lg font-bold bg-[#25D366] text-white hover:bg-[#20bd5a] gap-2 shadow-md hover:shadow-lg transition-all"
                                onClick={() => {
                                   const phone = adminSettings.adminWhatsApp?.replace(/[^0-9]/g, '');
                                   const text = encodeURIComponent(`Hi Aureva Support,\n\nI need help with my order #${order.id.slice(-8).toUpperCase()}.\nStatus: ${getCustomerStatus(order.status).replace(/_/g, ' ').toUpperCase()}`);
                                   window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                                }}
                              >
                                Need Help?
                              </Button>
                            )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold font-display text-zinc-900">Saved Addresses</h2>
                  <Button 
                    onClick={() => {
                      setEditingAddressId(null);
                      setAddressForm({ firstName: '', lastName: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', isDefault: addresses.length === 0 });
                      setIsAddressModalOpen(true);
                    }}
                    className="bg-zinc-950 text-white hover:bg-zinc-800"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add New Address
                  </Button>
                </div>
                
                {addresses.length === 0 ? (
                  <Card className="bg-white border-0 shadow-sm text-center p-12 rounded-xl">
                    <MapPin className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-700 mb-2">No Saved Addresses</h3>
                    <p className="text-zinc-500 text-sm">Add addresses here to save time during checkout.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(address => (
                      <Card key={address.id} className="p-5 border-zinc-200 relative group">
                        {address.isDefault && (
                          <span className="absolute -top-3 -right-3 bg-amber-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-sm">
                            Default
                          </span>
                        )}
                        <h4 className="font-bold text-zinc-900 text-lg mb-1">{address.firstName} {address.lastName}</h4>
                        <p className="text-zinc-600 text-sm mb-3 h-10 overflow-hidden line-clamp-2">
                          {address.address}, {address.city}, {address.state} - {address.pincode}
                        </p>
                        <div className="text-zinc-500 text-sm space-y-1 mb-6">
                           <div className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> {address.phone}</div>
                        </div>
                        <div className="absolute bottom-5 right-5 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingAddressId(address.id);
                              setAddressForm(address);
                              setIsAddressModalOpen(true);
                            }}
                            className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-700 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 rounded-full text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-bold font-display text-zinc-900 mb-6">Account Settings</h2>
                  <Card className="border-0 shadow-lg rounded-xl p-8 bg-white">
                     <div className="max-w-md space-y-6">
                        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 text-amber-800">
                           <h4 className="font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-600" /> Secure Account</h4>
                           <p className="text-sm">Your account is secured via standard authentication. Contact support to change your registered email or phone.</p>
                        </div>
                        
                        <div>
                           <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
                           <input type="text" disabled value={profile?.name || ''} className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-600 font-medium cursor-not-allowed" />
                        </div>
                        
                        <div>
                           <label className="block text-sm font-bold text-zinc-700 mb-2">{user.phoneNumber ? 'Mobile Number' : 'Email Address'}</label>
                           <input type="text" disabled value={user.email || user.phoneNumber || ''} className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-600 font-medium cursor-not-allowed" />
                        </div>
                     </div>
                  </Card>
               </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">{editingAddressId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input 
                value={addressForm.firstName} 
                onChange={(e) => setAddressForm({...addressForm, firstName: e.target.value})} 
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                value={addressForm.lastName} 
                onChange={(e) => setAddressForm({...addressForm, lastName: e.target.value})} 
                placeholder="Doe"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address *</Label>
              <Input 
                value={addressForm.address} 
                onChange={(e) => setAddressForm({...addressForm, address: e.target.value})} 
                placeholder="123 Corporate Tower, Business Hub"
              />
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input 
                value={addressForm.city} 
                onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} 
                placeholder="Mumbai"
              />
            </div>
            <div className="space-y-2">
              <Label>Pincode *</Label>
              <Input 
                value={addressForm.pincode} 
                onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})} 
                placeholder="400001"
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <Input 
                value={addressForm.phone} 
                onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} 
                placeholder="9876543210"
              />
            </div>
             <div className="space-y-2">
              <Label>State</Label>
              <Input 
                value={addressForm.state} 
                onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} 
                placeholder="Maharashtra"
              />
            </div>
            
            <div className="col-span-2 flex items-center gap-2 mt-4">
              <input 
                type="checkbox" 
                id="isDefault" 
                className="w-4 h-4 text-amber-600 rounded"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                disabled={addresses.length === 0 && !addressForm.isDefault}
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-zinc-700">Set as default address</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddressModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress} className="bg-zinc-950 text-white hover:bg-zinc-800">Save Address</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Track Order Dialog - Premium Redesign */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 border-0 rounded-xl overflow-hidden [&>button]:hidden">
          <DialogHeader className="bg-zinc-950 p-8 text-white relative">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 hover:bg-zinc-900 p-2 rounded-full">
               <X className="w-5 h-5" />
            </button>
            <span className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2 block">Order Tracking</span>
            <DialogTitle className="text-2xl font-display font-bold text-white">Order #{selectedOrder?.id?.slice(-8).toUpperCase()}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="px-8 py-10 bg-white">
              <div className="flex flex-col space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-200">
                {CUSTOMER_ORDER_STATUSES.map((status, index) => {
                  const currentStatusIndex = CUSTOMER_ORDER_STATUSES.findIndex(s => s.id === getCustomerStatus(selectedOrder.status));
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const Icon = status.icon;
                  const isCancelled = selectedOrder.status === 'cancelled';

                  if (isCancelled) {
                    if (index === 0) {
                      return (
                        <div key={status.id} className="relative flex items-start group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 shadow-sm shrink-0 z-10 border-4 border-white mt-1">
                            <X className="w-5 h-5" />
                          </div>
                          <div className="ml-6 flex-1">
                             <div className="font-bold text-red-600 text-lg">Cancelled</div>
                             <div className="text-sm text-zinc-500 mt-1">This order has been cancelled and refunded if applicable.</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }

                  return (
                    <div key={status.id} className="relative flex items-start group">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full z-10 border-4 border-white shrink-0 mt-1 transition-all duration-500 ${
                         isCurrent ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 
                         isCompleted ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="ml-6 flex-1 pt-2 pb-6">
                        <div className={`font-bold text-lg leading-none mb-2 ${
                           isCurrent ? 'text-amber-600' : 
                           isCompleted ? 'text-zinc-900' : 'text-zinc-400'
                        }`}>
                          {status.label}
                        </div>
                        <div className={`text-sm ${
                           isCurrent ? 'text-zinc-600 font-medium' : 'text-zinc-500'
                        }`}>
                          {isCurrent ? 'Your order is currently at this stage.' : 
                           isCompleted ? 'Step completed successfully.' : 'Waiting for this step...'}
                        </div>
                        {status.id === 'dispatched' && isCompleted && selectedOrder.dispatchDetails && (
                          <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 text-sm text-zinc-700">
                             <p><span className="font-bold text-zinc-900">Courier:</span> {selectedOrder.dispatchDetails.courierName}</p>
                             <p><span className="font-bold text-zinc-900">Tracking Number:</span> <span className="font-mono bg-zinc-200 px-2 py-0.5 rounded select-all">{selectedOrder.dispatchDetails.trackingNumber}</span></p>
                             <p><span className="font-bold text-zinc-900">Dispatch Date:</span> {selectedOrder.dispatchDetails.dispatchDate}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Payment Dialog */}
      <Dialog open={!!paymentOrder} onOpenChange={(open) => {
        if (!open) {
          setPaymentOrder(null);
          toast.error('Payment not completed.');
        }
      }}>
        <DialogContent showCloseButton={false} className="w-[95vw] sm:max-w-[550px] md:max-w-[600px] text-center p-0 rounded-xl border-0 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden !fixed !top-1/2 !left-1/2 !-translate-y-1/2 !-translate-x-1/2 z-[100]">
          
          <div className="flex-1 overflow-y-auto w-full relative bg-white">
            <button 
               onClick={() => setPaymentOrder(null)}
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
              <DialogTitle className="text-center text-2xl font-bold text-white flex items-center justify-center gap-2 mt-4">
                 <ShieldCheck className="w-6 h-6" />
                 Secure UPI Payment
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex flex-col items-center">
               <span className="text-3xl font-bold font-display mb-1">
                 {paymentOrder && formatCurrency(paymentOrder.grandTotal)}
               </span>
               <span className="text-xs uppercase tracking-widest text-green-100 font-semibold">Order Amount</span>
            </div>
          </div>
          
          <div className="p-6 bg-white flex flex-col items-center flex-shrink-0">
            <div className="bg-white p-4 rounded-xl border shadow-sm relative group w-[220px] h-[220px] flex items-center justify-center mb-6">
                <img 
                  src={(adminSettings?.qrCodeUrl) || upiQrUrl}
                  alt="UPI QR Code" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
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
            <Button size="lg" disabled={isUploadingPayment} className="w-full text-base font-bold bg-[var(--navy-800)] hover:bg-black disabled:opacity-70 text-white h-11 rounded-xl shadow-md" onClick={() => {
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
              handleFinishPayment(utr);
            }}>
              {isUploadingPayment ? (
                <span className="flex items-center gap-2">
                   <RefreshCw className="h-5 w-5 animate-spin" />
                   Processing...
                </span>
              ) : "Submit Payment Confirmation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
