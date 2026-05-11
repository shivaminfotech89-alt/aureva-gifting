import React, { useEffect, useState, useRef } from 'react';
import { collection, query, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, Search, Eye, MessageCircle, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';

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
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
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
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    }
  };

  const downloadCSV = () => {
    let csvContent = "Order ID,Date,Customer Name,Email,Phone,Total Amount,Payment Method,Status,UTR Number\n";
    
    orders.forEach(function(rowArray) {
      const row = [
        rowArray.id,
        rowArray.createdAt?.toDate ? rowArray.createdAt.toDate().toLocaleDateString() : 'N/A',
        `"${rowArray.deliveryDetails?.firstName || ''} ${rowArray.deliveryDetails?.lastName || ''}"`,
        `"${rowArray.deliveryDetails?.email || ''}"`,
        `"${rowArray.deliveryDetails?.phone || ''}"`,
        rowArray.grandTotal,
        rowArray.paymentMethod,
        rowArray.status,
        `"${rowArray.paymentUtr || ''}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "aureva_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.deliveryDetails?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.deliveryDetails?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.deliveryDetails?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <div className="flex items-center gap-4">
          <div className="flex bg-background border border-border rounded-md px-3 py-2 w-full sm:w-64">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              className="bg-transparent border-none outline-none text-sm w-full" 
              placeholder="Search orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={downloadCSV}>Export Excel</Button>
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
                <th className="px-6 py-4 font-medium">Status</th>
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
                    #{order.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{order.deliveryDetails?.firstName} {order.deliveryDetails?.lastName}</span>
                      <span className="text-xs text-muted-foreground">{order.deliveryDetails?.email}</span>
                      <span className="text-xs text-muted-foreground">{order.deliveryDetails?.phone}</span>
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
                      className="bg-transparent text-sm font-medium outline-none p-1 rounded capitalize"
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
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => setSelectedOrder(order)}>
                       <Eye className="h-4 w-4" /> View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => {
                        if(order.deliveryDetails?.phone) {
                           const phone = order.deliveryDetails.phone.replace(/[^0-9]/g, '');
                           const text = encodeURIComponent(`Hi ${order.deliveryDetails.firstName},\n\nUpdate regarding your Aureva order #${order.id.slice(-8)} (Total: ${formatCurrency(order.grandTotal)}).\n\nThe current status is: *${order.status.replace('_', ' ').toUpperCase()}*.\n\nLet us know if you have any questions!`);
                           window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
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

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Summary - #{selectedOrder?.id?.slice(-8)}</DialogTitle>
            <DialogDescription>
              Placed on {selectedOrder?.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : 'Unknown Date'}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                   <CardContent className="p-4 space-y-4">
                     <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="h-5 w-5"/> Customer Details</h3>
                     <div className="text-sm space-y-1">
                       <p><span className="font-medium text-muted-foreground">Name:</span> {selectedOrder.deliveryDetails?.firstName} {selectedOrder.deliveryDetails?.lastName}</p>
                       <p><span className="font-medium text-muted-foreground">Email:</span> {selectedOrder.deliveryDetails?.email}</p>
                       <p><span className="font-medium text-muted-foreground">Phone:</span> {selectedOrder.deliveryDetails?.phone}</p>
                       <p><span className="font-medium text-muted-foreground">Address:</span> {selectedOrder.deliveryDetails?.address}</p>
                       <p><span className="font-medium text-muted-foreground">Location:</span> {selectedOrder.deliveryDetails?.city}, {selectedOrder.deliveryDetails?.state} {selectedOrder.deliveryDetails?.pincode}</p>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardContent className="p-4 space-y-4">
                     <h3 className="font-semibold text-lg">Payment Info</h3>
                     <div className="text-sm space-y-1">
                       <p><span className="font-medium text-muted-foreground">Method:</span> <span className="uppercase">{selectedOrder.paymentMethod}</span></p>
                       <p><span className="font-medium text-muted-foreground">Status:</span> <span className="capitalize">{selectedOrder.status.replace('_', ' ')}</span></p>
                       <p><span className="font-medium text-muted-foreground">Subtotal:</span> {formatCurrency(selectedOrder.subTotal)}</p>
                       <p><span className="font-medium text-muted-foreground">GST:</span> {formatCurrency(selectedOrder.gstTotal)}</p>
                       <p className="font-bold text-base pt-2"><span className="font-medium text-muted-foreground">Grand Total:</span> {formatCurrency(selectedOrder.grandTotal)}</p>
                       
                       {selectedOrder.paymentMethod === 'upi' && selectedOrder.paymentUtr && (
                         <div className="mt-4 pt-4 border-t">
                           <p><span className="font-medium text-muted-foreground">UPI Ref / UTR:</span></p>
                           <p className="font-mono bg-muted p-2 mt-1 rounded text-sm">{selectedOrder.paymentUtr}</p>
                         </div>
                       )}
                     </div>
                   </CardContent>
                 </Card>
               </div>

               <Card>
                 <CardHeader className="py-4">
                   <CardTitle className="text-lg">Items Ordered</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                   <table className="w-full text-sm">
                     <thead className="bg-muted/50">
                       <tr>
                         <th className="text-left py-2 px-4 font-medium">Product</th>
                         <th className="text-center py-2 px-4 font-medium">Qty</th>
                         <th className="text-right py-2 px-4 font-medium">Price</th>
                         <th className="text-right py-2 px-4 font-medium">Total</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y">
                       {selectedOrder.items?.map((item, idx) => (
                         <tr key={idx}>
                           <td className="py-3 px-4 flex items-center gap-3">
                             <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                               {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                             </div>
                             <div>
                               <p className="font-medium">{item.name}</p>
                               <p className="text-xs text-muted-foreground">{item.basePrice && item.gstPercent ? `Base: ${formatCurrency(item.basePrice)} + ${item.gstPercent}% GST` : ''}</p>
                             </div>
                           </td>
                           <td className="py-3 px-4 text-center">{item.quantity}</td>
                           <td className="py-3 px-4 text-right">
                             {formatCurrency(item.priceWithGst || (item.basePrice * (1 + (item.gstPercent || 0)/100)))}
                           </td>
                           <td className="py-3 px-4 text-right font-medium">
                             {formatCurrency((item.priceWithGst || (item.basePrice * (1 + (item.gstPercent || 0)/100))) * item.quantity)}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </CardContent>
               </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
