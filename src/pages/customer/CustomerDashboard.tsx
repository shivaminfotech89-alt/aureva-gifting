import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, User, FileText } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { auth } from '../../lib/firebase';

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

export default function CustomerDashboard() {
  const { user, profile } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(fetchedOrders);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [user]);

  if (!user) {
    return <div className="container mx-auto p-12 text-center">Please login to view your account.</div>;
  }

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.basePrice * item.quantity}</td>
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
              <strong>Date:</strong> ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
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

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-6xl">
      <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight mb-8">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{profile?.name || user.email}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm mt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Account Status</span>
                  <span className="font-medium bg-green-100 text-green-800 w-max px-2 py-0.5 rounded-full text-xs">Active</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6" onClick={() => auth.signOut()}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-8">
          
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" /> Order History
            </h2>
            
            {loadingOrders ? (
              <div className="space-y-4">
                <div className="h-40 bg-muted animate-pulse rounded-xl"></div>
                <div className="h-40 bg-muted animate-pulse rounded-xl"></div>
              </div>
            ) : orders.length === 0 ? (
              <Card className="bg-muted/30 border-dashed text-center p-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-bold mb-2">No orders yet</h3>
                <p className="text-muted-foreground">You haven't placed any orders with us. Explore our collection to find the perfect gift.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <Card key={order.id} className="overflow-hidden">
                    <div className="bg-muted px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between sm:items-center text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1">
                        <div>
                          <div className="text-muted-foreground mb-1 uppercase text-xs font-semibold">Order Placed</div>
                          <div className="font-medium">
                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1 uppercase text-xs font-semibold">Total</div>
                          <div className="font-medium">{formatCurrency(order.grandTotal)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1 uppercase text-xs font-semibold">Status</div>
                          <div className="font-medium capitalize text-primary">{order.status}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1 uppercase text-xs font-semibold">Order ID</div>
                          <div className="font-medium truncate" title={order.id}>#{order.id.slice(-8)}</div>
                        </div>
                      </div>
                      <div>
                        <Button variant="outline" size="sm" onClick={() => handlePrintInvoice(order)} className="gap-2">
                          <FileText className="h-4 w-4" /> Invoice
                        </Button>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="h-20 w-20 bg-muted rounded-md border border-border overflow-hidden shrink-0">
                              {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <div className="font-bold flex items-center">
                              {formatCurrency(item.basePrice * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
