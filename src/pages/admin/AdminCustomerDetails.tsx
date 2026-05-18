import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

export default function AdminCustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          setCustomer({ id: userDoc.id, ...userDoc.data() });
        }

        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const ordersSnap = await getDocs(ordersQuery);
        setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading customer details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center p-8 text-slate-500">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white/80 rounded-2xl border">
         <h2 className="text-xl font-bold font-serif mb-2 text-[#0F172A]">Customer not found</h2>
         <Button asChild variant="outline" className="mt-4"><Link to="/admin/customers">Back to Customers</Link></Button>
      </div>
    );
  }

  const totalSpent = orders.filter(o => o.status !== 'cancelled' && o.status !== 'payment_failed').reduce((sum, order) => sum + (order.grandTotal || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back to Dashboard</Link>
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 bg-[#0F172A]/5 text-[#d4af37] flex items-center justify-center rounded-full text-3xl font-bold font-serif border border-slate-100 mb-4 shadow-inner">
               {customer.name?.charAt(0) || customer.email?.charAt(0)?.toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">{customer.name || 'Anonymous User'}</h2>
            <p className="text-sm text-slate-500 mb-6">{customer.email}</p>

            <div className="w-full space-y-4">
              <a href={`mailto:${customer.email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100 text-sm font-medium text-slate-700 group">
                <Mail className="w-4 h-4 text-slate-400 group-hover:text-[#d4af37]" /> {customer.email}
              </a>
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100 text-sm font-medium text-slate-700 group">
                  <Phone className="w-4 h-4 text-slate-400 group-hover:text-[#d4af37]" /> {customer.phone}
                </a>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm">
             <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
               <CreditCard className="w-4 h-4 text-slate-400" /> Lifetime Value
             </h3>
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-3xl font-bold font-serif text-[#0F172A]">{formatCurrency(totalSpent)}</p>
                   <p className="text-xs text-slate-500 mt-1 font-medium">{orders.length} total orders</p>
                </div>
             </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden flex flex-col h-full">
            <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider bg-slate-50/50 -mt-6 -mx-6 p-6 border-b border-slate-100">
               <ShoppingBag className="w-4 h-4 text-slate-400" /> Order History
            </h3>
            
            <div className="flex-1 overflow-auto -mx-6 px-6">
               <div className="space-y-4">
                  {orders.length > 0 ? orders.map(order => (
                    <div key={order.id} className="p-4 border rounded-xl hover:border-slate-300 transition-all bg-white group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div>
                         <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-[#0F172A]">Order #{order.id.slice(-8)}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${
                              order.status === 'delivered' ? 'bg-[#10B981]/10 text-[#10B981]' : 
                              order.status === 'cancelled' ? 'bg-red-500/10 text-red-600' :
                              order.status === 'shipped' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' :
                              'bg-[#d4af37]/10 text-[#b49124]'
                            }`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                         </div>
                         <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PPP') : 'Unknown date'}
                         </p>
                       </div>
                       
                       <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                          <div className="text-right">
                             <p className="font-bold text-[#0F172A]">{formatCurrency(order.grandTotal)}</p>
                             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total</p>
                          </div>
                          <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                             <Link to={`/admin/orders/${order.id}`}><ChevronRight className="w-5 h-5"/></Link>
                          </Button>
                       </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                       <ShoppingBag className="w-12 h-12 text-slate-200 mb-3" />
                       <p>This customer hasn't placed any orders yet.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
