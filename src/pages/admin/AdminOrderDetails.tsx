import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, ArrowLeft, Clock, ShieldCheck, Truck, MapPin, X } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const ORDER_STATUSES = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'awaiting_payment', label: 'Awaiting Payment', icon: Clock },
  { id: 'payment_verification_pending', label: 'Payment Verification Pending', icon: ShieldCheck },
  { id: 'paid', label: 'Paid', icon: ShieldCheck },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'dispatched', label: 'Dispatched', icon: Truck },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { id: 'delivered', label: 'Delivered', icon: MapPin },
];

export default function AdminOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followUpNote, setFollowUpNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [dispatchDetails, setDispatchDetails] = useState({ courierName: '', trackingNumber: '', dispatchDate: '' });
  const [savingDispatch, setSavingDispatch] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'orders', id));
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
          setFollowUpNote(docSnap.data().notes || '');
          if (docSnap.data().dispatchDetails) setDispatchDetails(docSnap.data().dispatchDetails);
        } else {
          toast.error('Order not found');
          navigate('/admin/orders');
        }
      } catch (error) {
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id, navigate]);

  const saveDispatchDetails = async () => {
    if (!id) return;
    setSavingDispatch(true);
    try {
      await updateDoc(doc(db, 'orders', id), {
        dispatchDetails,
        status: 'dispatched', // automatically update status
        updatedAt: serverTimestamp()
      });
      setOrder((prev: any) => ({ ...prev, dispatchDetails, status: 'dispatched' }));
      toast.success('Dispatch details saved and order dispatched');
    } catch (e) {
      toast.error('Failed to save dispatch details');
    } finally {
      setSavingDispatch(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id!), { status: newStatus });
      setOrder({ ...order, status: newStatus });
      toast.success('Status updated');
      
      if (order.deliveryDetails?.phone) {
        if (window.confirm(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}.\nDo you want to notify the customer via WhatsApp?`)) {
           const phone = String(order.deliveryDetails.phone).replace(/[^0-9]/g, '');
           const text = encodeURIComponent(`Hi ${order.deliveryDetails.firstName},\n\nGood news! Your Aureva order #${order.id.slice(-8)} status has been updated to: *${newStatus.replace('_', ' ').toUpperCase()}*.\n\nThank you for shopping with us!`);
           window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    }
  };

  const saveFollowUpNote = async () => {
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'orders', id!), { notes: followUpNote });
      toast.success('Follow-up note saved');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
      toast.error('Failed to save follow-up note');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/admin/orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Tracking & Order Details</h1>
          <p className="text-muted-foreground mt-1">Order #{order.id.slice(-8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Tracking and Notes */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-xl">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <select 
                  className="w-full bg-primary/10 text-primary font-bold border-2 border-primary rounded-lg outline-none p-3 capitalize"
                  value={order.status}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="awaiting_payment">Awaiting Payment</option>
                  <option value="payment_verification_pending">Payment Verification Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent pt-2">
                {ORDER_STATUSES.map((status, index) => {
                  const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.id === order.status);
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const Icon = status.icon;
                  const isCancelled = order.status === 'cancelled';

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

          <Card className="shadow-md">
            <CardHeader className="pb-2 border-b">
              <CardTitle>Follow-up Notes</CardTitle>
              <CardDescription>Log private notes about this order</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
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

          <Card className="shadow-md">
             <CardHeader className="pb-2 border-b">
                <CardTitle>Dispatch Management</CardTitle>
                <CardDescription>Enter courier details for tracking</CardDescription>
             </CardHeader>
             <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                   <Label>Courier Name</Label>
                   <Input value={dispatchDetails.courierName} onChange={e => setDispatchDetails({...dispatchDetails, courierName: e.target.value})} placeholder="e.g. BlueDart" />
                </div>
                <div className="space-y-2">
                   <Label>Tracking Number</Label>
                   <Input value={dispatchDetails.trackingNumber} onChange={e => setDispatchDetails({...dispatchDetails, trackingNumber: e.target.value})} placeholder="e.g. BD12345678" />
                </div>
                <div className="space-y-2">
                   <Label>Dispatch Date</Label>
                   <Input type="date" value={dispatchDetails.dispatchDate} onChange={e => setDispatchDetails({...dispatchDetails, dispatchDate: e.target.value})} />
                </div>
                <Button onClick={saveDispatchDetails} disabled={savingDispatch} className="w-full bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] font-bold">
                   {savingDispatch ? 'Saving...' : 'Update Dispatch Info'}
                </Button>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Details */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="h-5 w-5"/> Customer Details</h3>
              <div className="text-sm space-y-2 bg-muted/30 p-4 rounded-xl border">
                <p><span className="font-medium text-muted-foreground">Name:</span> {order.deliveryDetails?.firstName} {order.deliveryDetails?.lastName}</p>
                <p><span className="font-medium text-muted-foreground">Email:</span> {order.deliveryDetails?.email}</p>
                <p><span className="font-medium text-muted-foreground w-16 inline-block">Phone:</span> 
                  <a href={`tel:${order.deliveryDetails?.phone}`} className="text-primary hover:underline font-bold bg-primary/10 px-2 py-0.5 rounded ml-1">{order.deliveryDetails?.phone}</a>
                  <a href={`https://wa.me/91${String(order.deliveryDetails?.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-[#25D366] ml-2 text-xs font-bold border border-[#25D366] px-2 py-0.5 rounded hover:bg-[#25D366]/10">WhatsApp</a>
                </p>
                <p className="pt-2"><span className="font-medium text-muted-foreground">Address:</span> {order.deliveryDetails?.address}</p>
                <p><span className="font-medium text-muted-foreground">Location:</span> {order.deliveryDetails?.city}, {order.deliveryDetails?.state} {order.deliveryDetails?.pincode}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Payment Summary</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium text-muted-foreground">Method:</span> 
                  <span className="uppercase font-bold bg-muted px-2 py-1 rounded text-xs">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-medium text-muted-foreground">Subtotal:</span> 
                  <span>{formatCurrency(order.subTotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center py-1 text-green-600">
                    <span className="font-bold">Discount ({order.couponCode}):</span> 
                    <span className="font-bold">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="font-medium text-muted-foreground">GST:</span> 
                  <span>{formatCurrency(order.gstTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-1 border-t text-base">
                  <span className="font-bold text-lg text-primary">Grand Total:</span> 
                  <span className="font-bold text-lg">{formatCurrency(order.grandTotal)}</span>
                </div>
                
                {order.paymentId && (
                  <div className="mt-4 pt-4 border-t">
                    <p><span className="font-medium text-muted-foreground">Gateway Payment ID:</span></p>
                    <p className="font-mono bg-blue-50 text-blue-700 p-3 mt-2 rounded-lg font-bold text-center border shadow-sm select-all">{order.paymentId}</p>
                  </div>
                )}

                {order.paymentMethod === 'upi' && order.paymentUtr && (
                  <div className="mt-4 pt-4 border-t">
                    <p><span className="font-medium text-muted-foreground">Manual UPI UTR:</span></p>
                    <p className="font-mono bg-green-50 text-green-700 p-3 mt-2 rounded-lg font-bold text-center border shadow-sm select-all">{order.paymentUtr}</p>
                  </div>
                )}
                
                {order.refundStatus && (
                  <div className="mt-4 pt-4 border-t">
                    <p><span className="font-medium text-muted-foreground">Refund Status:</span></p>
                    <p className="font-bold text-red-600 bg-red-50 p-2 mt-2 rounded-lg text-center border shadow-sm">{order.refundStatus}</p>
                  </div>
                )}
                
                {order.failedPaymentLogs && order.failedPaymentLogs.length > 0 && (
                   <div className="mt-4 pt-4 border-t">
                     <p className="text-sm text-red-500 font-bold uppercase mb-2">Failed Payment Logs</p>
                     <div className="space-y-2">
                       {order.failedPaymentLogs.map((log: any, idx: number) => (
                         <div key={idx} className="text-xs bg-red-50 border border-red-100 text-red-700 p-2 rounded flex flex-col">
                            <span className="font-bold">{log.reason || 'Payment failed/cancelled'}</span>
                            <span className="font-mono text-[10px] text-red-500 mt-1">{new Date(log.time).toLocaleString()}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="py-4 border-b">
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
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0 border shadow-sm">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400';
                              }}
                            />
                          )}
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
    </div>
  );
}
