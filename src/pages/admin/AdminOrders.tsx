import React, { useEffect, useState, useRef } from 'react';
import { collection, query, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, Search, Eye, MessageCircle, X, Clock, ShieldCheck, Truck, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Textarea } from '../../components/ui/textarea';
import * as XLSX from 'xlsx';

const ORDER_STATUSES = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'admin_approval', label: 'Under Review', icon: ShieldCheck },
  { id: 'payment_verified', label: 'Payment Verified', icon: ShieldCheck },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: MapPin },
];

interface Order {
  id: string;
  userId: string;
  items: any[];
  subTotal: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: string;
  paymentUtr?: string;
  status: string;
  createdAt: any;
  deliveryDetails: any;
  notes?: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  
  // Use a ref to track if this is the initial load vs a real-time update
  const isInitialLoad = useRef(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      
      // Look for new orders
      if (!isInitialLoad.current && orders.length > 0 && ordersData.length > orders.length) {
        toast.success("New order received!", {
          description: "The order list has been updated automatically."
        });
        // Play a simple notification sound (short high-pitched beep)
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(100).join('U'));
        audio.play().catch(e => console.log('Audio play prevented by browser'));
      }
      
      setOrders(ordersData);
      
      // Update selected order if open
      setSelectedOrder(current => {
        if (!current) return null;
        return ordersData.find(o => o.id === current.id) || current;
      });
      
      setLoading(false);
      isInitialLoad.current = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orders.length]);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      
      // Get order details to notify customer
      const orderToUpdate = orders.find(o => o.id === id);
      if (orderToUpdate && orderToUpdate.deliveryDetails?.phone) {
        if (window.confirm(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}.\nDo you want to notify the customer via WhatsApp?`)) {
           const phone = orderToUpdate.deliveryDetails.phone.replace(/[^0-9]/g, '');
           const text = encodeURIComponent(`Hi ${orderToUpdate.deliveryDetails.firstName},\n\nGood news! Your Aureva order #${orderToUpdate.id.slice(-8)} status has been updated to: *${newStatus.replace('_', ' ').toUpperCase()}*.\n\nThank you for shopping with us!`);
           window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
        }
      }
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    }
  };

  const saveFollowUpNote = async () => {
    if (!selectedOrder) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), { notes: followUpNote });
      toast.success('Follow-up note saved');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
      toast.error('Failed to save follow-up note');
    } finally {
      setSavingNote(false);
    }
  };

  const exportToExcel = () => {
    const excelData = filteredOrders.map(o => ({
      'Order ID': o.id,
      'Customer Name': `${o.deliveryDetails?.firstName || ''} ${o.deliveryDetails?.lastName || ''}`,
      'Email': o.deliveryDetails?.email || '',
      'Phone': o.deliveryDetails?.phone || '',
      'City': o.deliveryDetails?.city || '',
      'Total Amount': o.grandTotal,
      'Payment Method': o.paymentMethod.toUpperCase(),
      'UTR Number': o.paymentUtr || 'N/A',
      'Status': o.status.replace('_', ' ').toUpperCase(),
      'Date': o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : 'N/A',
      'Notes': o.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "Aureva_Orders.xlsx");
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.deliveryDetails?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.deliveryDetails?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.deliveryDetails?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.deliveryDetails?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back</Link>
         </Button>
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-background border border-border rounded-md px-3 py-2 w-full sm:w-64">
            <Search className="h-4 w-4 text-muted-foreground mr-2 mt-1" />
            <input 
              className="bg-transparent border-none outline-none text-sm w-full" 
              placeholder="Search by ID, name, city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="bg-[#107c41] text-white hover:bg-[#185c37] border-none" onClick={exportToExcel}>
            Export to Excel
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Items Ordered</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Status & Timeline</th>
                <th className="px-6 py-4 font-medium">UTR</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 border-dashed border-2 border-border m-4 text-center rounded-lg">
                    <Package className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">No orders found.</p>
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium text-foreground">
                    <Link 
                      to={`/admin/orders/${order.id}`}
                      className="text-primary hover:underline font-bold flex items-center gap-1 group"
                    >
                      #{order.id.slice(-8)}
                      <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{order.deliveryDetails?.firstName} {order.deliveryDetails?.lastName}</span>
                      <span className="text-xs text-muted-foreground">{order.deliveryDetails?.email}</span>
                      <span className="text-xs text-muted-foreground">{order.deliveryDetails?.phone}</span>
                      <span className="text-xs text-primary font-medium mt-1">{order.deliveryDetails?.city}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 max-w-[200px]">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="text-xs font-medium text-foreground bg-muted/50 px-2 py-1 rounded truncate">
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                     {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatCurrency(order.grandTotal)}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className="bg-transparent text-sm font-bold border rounded outline-none p-1.5 capitalize text-primary mb-2 shadow-sm"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="admin_approval">Admin Approval</option>
                      <option value="pending">Pending</option>
                      <option value="payment_verified">Payment Verified</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 font-medium font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {order.paymentMethod === 'upi' ? (order.paymentUtr || 'N/A') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right flex flex-col items-center justify-end gap-2">
                    <Button variant="default" size="sm" className="h-9 gap-2 w-full font-bold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                       <Link to={`/admin/orders/${order.id}`}>
                         <Eye className="h-4 w-4" /> Track & View
                       </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10 w-full md:w-auto"
                      onClick={() => {
                        if(order.deliveryDetails?.phone) {
                           const phone = order.deliveryDetails.phone.replace(/[^0-9]/g, '');
                           const text = encodeURIComponent(`Hi ${order.deliveryDetails.firstName},\n\nUpdate regarding your Aureva order #${order.id.slice(-8)} (Total: ${formatCurrency(order.grandTotal)}).\n\nThe current status is: *${order.status.replace('_', ' ').toUpperCase()}*.\n\nLet us know if you have any questions!`);
                           window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
                        }
                      }}
                    >
                       <MessageCircle className="h-4 w-4" /> Notify
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Details & Tracking Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-11/12">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Package className="h-6 w-6"/> Tracking & Order Details #{selectedOrder?.id?.slice(-8)}
            </DialogTitle>
            <DialogDesc>
              Below is the comprehensive view for tracking, processing, and following up on order #{selectedOrder?.id}.
            </DialogDesc>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Left Column: Tracking and Notes */}
               <div className="space-y-6">
                 
                 <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">Status Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <select 
                          className="w-full bg-primary/10 text-primary font-bold border-2 border-primary rounded-lg outline-none p-3 capitalize"
                          value={selectedOrder.status}
                          onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                        >
                          <option value="pending_payment">Pending Payment</option>
                          <option value="admin_approval">Admin Approval</option>
                          <option value="pending">Pending</option>
                          <option value="payment_verified">Payment Verified</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="flex flex-col space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent pt-2">
                        {ORDER_STATUSES.map((status, index) => {
                          const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.id === selectedOrder.status);
                          const isCompleted = index <= currentStatusIndex;
                          const isCurrent = index === currentStatusIndex;
                          const Icon = status.icon;
                          const isCancelled = selectedOrder.status === 'cancelled';

                          if (isCancelled) {
                            if (index === 0) {
                              return (
                                <div key={status.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-destructive text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    <X className="w-5 h-5" />
                                  </div>
                                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded border border-destructive/20 bg-destructive/5 shadow">
                                    <div className="font-bold text-destructive">Cancelled</div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }

                          return (
                            <div key={status.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${isCompleted ? 'is-active' : ''}`}>
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10 ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border shadow-sm transition-all ${isCurrent ? 'bg-primary/5 border-primary shadow-md' : 'bg-background'} ${isCompleted && !isCurrent ? 'opacity-70' : ''}`}>
                                <div className={`font-bold ${isCurrent ? 'text-primary' : (isCompleted ? 'text-foreground' : 'text-muted-foreground')}`}>
                                  {status.label}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader className="pb-2">
                       <CardTitle>Follow-up Notes</CardTitle>
                       <CardDescription>Log private notes about this order</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Textarea 
                          placeholder="e.g. Called customer, will delay shipment by 2 days..."
                          value={followUpNote}
                          onChange={e => setFollowUpNote(e.target.value)}
                          className="min-h-[100px] bg-muted/30"
                       />
                       <Button 
                         onClick={saveFollowUpNote} 
                         disabled={savingNote}
                         className="w-full mt-4"
                       >
                         {savingNote ? 'Saving...' : 'Save Follow-up Note'}
                       </Button>
                    </CardContent>
                 </Card>

               </div>

               {/* Right Column: Order Details */}
               <div className="space-y-6">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="h-5 w-5"/> Customer Details</h3>
                    <div className="text-sm space-y-2 bg-muted/30 p-4 rounded-xl border">
                      <p><span className="font-medium text-muted-foreground">Name:</span> {selectedOrder.deliveryDetails?.firstName} {selectedOrder.deliveryDetails?.lastName}</p>
                      <p><span className="font-medium text-muted-foreground">Email:</span> {selectedOrder.deliveryDetails?.email}</p>
                      <p><span className="font-medium text-muted-foreground w-16 inline-block">Phone:</span> 
                        <a href={`tel:${selectedOrder.deliveryDetails?.phone}`} className="text-primary hover:underline font-bold bg-primary/10 px-2 py-0.5 rounded ml-1">{selectedOrder.deliveryDetails?.phone}</a>
                        <a href={`https://wa.me/91${selectedOrder.deliveryDetails?.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-[#25D366] ml-2 text-xs font-bold border border-[#25D366] px-2 py-0.5 rounded hover:bg-[#25D366]/10">WhatsApp</a>
                      </p>
                      <p className="pt-2"><span className="font-medium text-muted-foreground">Address:</span> {selectedOrder.deliveryDetails?.address}</p>
                      <p><span className="font-medium text-muted-foreground">Location:</span> {selectedOrder.deliveryDetails?.city}, {selectedOrder.deliveryDetails?.state} {selectedOrder.deliveryDetails?.pincode}</p>
                      <p><span className="font-medium text-muted-foreground">Landmark:</span> {selectedOrder.deliveryDetails?.landmark || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg">Payment Summary</h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium text-muted-foreground">Method:</span> 
                        <span className="uppercase font-bold bg-muted px-2 py-1 rounded text-xs">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-medium text-muted-foreground">Subtotal:</span> 
                        <span>{formatCurrency(selectedOrder.subTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-medium text-muted-foreground">GST:</span> 
                        <span>{formatCurrency(selectedOrder.gstTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-1 border-t text-base">
                        <span className="font-bold text-lg text-primary">Grand Total:</span> 
                        <span className="font-bold text-lg">{formatCurrency(selectedOrder.grandTotal)}</span>
                      </div>
                      
                      {selectedOrder.paymentMethod === 'upi' && selectedOrder.paymentUtr && (
                        <div className="mt-4 pt-4 border-t">
                          <p><span className="font-medium text-muted-foreground">UPI Ref / UTR:</span></p>
                          <p className="font-mono bg-green-50 text-green-700 p-3 mt-2 rounded-lg font-bold text-center border shadow-sm select-all">{selectedOrder.paymentUtr}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg">Items Ordered</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-y">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Product</th>
                          <th className="text-center py-3 px-4 font-medium">Qty</th>
                          <th className="text-right py-3 px-4 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedOrder.items?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0 border shadow-sm">
                                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                              </div>
                              <div>
                                <p className="font-medium line-clamp-2">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(item.priceWithGst || (item.basePrice * (1 + (item.gstPercent || 0)/100)))} each</p>
                                {item.customization?.enabled && (
                                  <div className="mt-1 flex flex-col gap-1 text-xs">
                                     <span className="bg-primary/10 text-primary w-fit px-1.5 rounded font-semibold uppercase tracking-wider text-[10px]">Customized</span>
                                     {item.customization.logoUrl && (
                                       <a href={item.customization.logoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Logo</a>
                                     )}
                                     {item.customization.customText && (
                                       <span className="text-muted-foreground">Text: <span className="font-medium">"{item.customization.customText}"</span></span>
                                     )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                            <td className="py-3 px-4 text-right font-medium text-primary">
                              {formatCurrency((item.priceWithGst || (item.basePrice * (1 + (item.gstPercent || 0)/100))) * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

