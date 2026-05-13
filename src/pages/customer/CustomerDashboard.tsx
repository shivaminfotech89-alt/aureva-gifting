import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, User, FileText, CheckCircle2, Clock, Truck, ShieldCheck, MapPin, X, ArrowRight, Settings, LogOut, Heart, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { auth } from '../../lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
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
}

const ORDER_STATUSES = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'admin_approval', label: 'Under Review', icon: ShieldCheck },
  { id: 'payment_verified', label: 'Payment Verified', icon: ShieldCheck },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: MapPin },
];

export default function CustomerDashboard() {
  const { user, profile } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [adminSettings, setAdminSettings] = useState<{adminWhatsApp?: string} | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

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
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return <div className="container mx-auto p-12 text-center h-screen flex items-center justify-center font-serif text-2xl text-zinc-500">Please login to view your account.</div>;
  }

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

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #18181b; line-height: 1.6; background-color: #fafafa; margin: 0; padding: 40px; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 50px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 1px solid #f4f4f5; }
          .header { display: flex; justify-content: space-between; margin-bottom: 50px; border-bottom: 2px solid #e4e4e7; padding-bottom: 30px; }
          .logo { font-size: 28px; font-weight: 800; color: #09090b; letter-spacing: -0.025em; text-transform: uppercase; font-family: serif; }
          .logo-sub { color: #f59e0b; font-size: 14px; letter-spacing: 0.1em; display: block; margin-top: -5px; }
          .invoice-details { text-align: right; }
          .section-title { font-weight: 600; text-transform: uppercase; font-size: 11px; color: #71717a; letter-spacing: 0.05em; margin-bottom: 12px; }
          .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f4f4f5; padding: 24px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 12px 16px; border-bottom: 2px solid #e4e4e7; font-weight: 600; color: #71717a; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
          .totals { margin-left: auto; width: 320px; background: #fafafa; padding: 24px; border-radius: 8px; border: 1px solid #f4f4f5;}
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; color: #52525b; }
          .totals-row.grand { font-weight: 700; color: #09090b; font-size: 1.25em; border-top: 2px solid #e4e4e7; padding-top: 16px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="logo">AUREVA <span class="logo-sub">CORPORATE GIFTING</span></div>
              <p style="color: #71717a; font-size: 14px; margin-top: 16px;">Ahmedabad, Gujarat<br>380058, India<br>aurevagifts@gmail.com</p>
            </div>
            <div class="invoice-details">
              <h1 style="margin:0; font-size: 36px; font-weight: 800; color: #09090b; letter-spacing: -0.025em;">INVOICE</h1>
              <p style="color: #71717a; font-size: 14px; margin-top: 16px;">
                <strong>Order ID:</strong> #${order.id.slice(-8).toUpperCase()}<br>
                <strong>Date:</strong> ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
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
            <div class="totals-row">
              <span>GST (18%)</span>
              <span>₹${order.gstTotal}</span>
            </div>
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
            Thank you for choosing Aureva Corporate Gifting. We appreciate your business. <br/>
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

  return (
    <div className="bg-zinc-50 min-h-screen pb-24">
      {/* Premium Header */}
      <div className="bg-zinc-950 text-white pt-24 pb-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl border border-amber-300 transform rotate-3">
                 <div className="bg-zinc-950 w-full h-full rounded-2xl flex items-center justify-center transform -rotate-3 text-amber-500 font-serif text-3xl font-bold">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                 </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">{profile?.name || 'Customer Dashboard'}</h1>
                <p className="text-zinc-400 text-lg">{user.email}</p>
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
      
      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl overflow-hidden rounded-2xl bg-white sticky top-24">
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
                  <h2 className="text-2xl font-bold font-serif text-zinc-900">Recent Orders</h2>
                  <Link to="/shop" className="text-sm font-bold text-amber-600 flex items-center gap-1 hover:text-amber-700 transition-colors uppercase tracking-wider">
                     Browse Shop <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {loadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="h-48 bg-zinc-200/50 animate-pulse rounded-2xl"></div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <Card className="bg-white border-0 shadow-lg text-center p-16 rounded-2xl">
                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                       <Package className="h-10 w-10 text-zinc-400" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-3 text-zinc-900">No Orders Yet</h3>
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
                      <Card key={order.id} className="overflow-hidden border-0 shadow-lg rounded-2xl bg-white hover:shadow-xl transition-shadow duration-300">
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
                               ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : ''}
                               ${order.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                               ${['pending', 'processing', 'payment_verified', 'admin_approval'].includes(order.status) ? 'bg-amber-100 text-amber-700' : ''}
                               ${order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : ''}
                            `}>
                               {order.status.replace('_', ' ')}
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
                        <div className="bg-white px-6 py-4 border-t border-zinc-100 flex justify-end gap-3">
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} className="h-10 px-4 rounded-lg font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                              Track Status
                            </Button>
                            
                            {(order.paymentMethod !== 'upi' || ['payment_verified', 'processing', 'shipped', 'delivered'].includes(order.status)) ? (
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
                                   const text = encodeURIComponent(`Hi Aureva Support,\n\nI need help with my order #${order.id.slice(-8).toUpperCase()}.\nStatus: ${order.status.replace('_', ' ').toUpperCase()}`);
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

            {activeTab === 'profile' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-bold font-serif text-zinc-900 mb-6">Account Settings</h2>
                  <Card className="border-0 shadow-lg rounded-2xl p-8 bg-white">
                     <div className="max-w-md space-y-6">
                        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 text-amber-800">
                           <h4 className="font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-600" /> Secure Account</h4>
                           <p className="text-sm">Your account is secured via Google Authentication. Email changes must be managed through your Google Account settings.</p>
                        </div>
                        
                        <div>
                           <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
                           <input type="text" disabled value={profile?.name || ''} className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-600 font-medium cursor-not-allowed" />
                        </div>
                        
                        <div>
                           <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
                           <input type="text" disabled value={user.email || ''} className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-600 font-medium cursor-not-allowed" />
                        </div>
                     </div>
                  </Card>
               </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Track Order Dialog - Premium Redesign */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 border-0 rounded-3xl overflow-hidden [&>button]:hidden">
          <DialogHeader className="bg-zinc-950 p-8 text-white relative">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 hover:bg-zinc-900 p-2 rounded-full">
               <X className="w-5 h-5" />
            </button>
            <span className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2 block">Order Tracking</span>
            <DialogTitle className="text-2xl font-serif font-bold text-white">Order #{selectedOrder?.id?.slice(-8).toUpperCase()}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="px-8 py-10 bg-white">
              <div className="flex flex-col space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-200">
                {ORDER_STATUSES.map((status, index) => {
                  const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.id === selectedOrder.status);
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
