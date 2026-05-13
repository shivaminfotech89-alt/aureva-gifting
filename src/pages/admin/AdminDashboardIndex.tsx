import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatCurrency } from '../../lib/utils';
import { 
  Package, ShoppingBag, Users, IndianRupee, AlertTriangle, ArrowRight,
  TrendingUp, Clock, Truck, MapPin, XCircle, Activity,
  ChevronRight, Calendar, ArrowLeft, RefreshCw, AlertOctagon, CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, buttonVariants } from '../../components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfMonth, formatDistanceToNow } from 'date-fns';

export default function AdminDashboardIndex() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    dispatchedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    paymentFailedOrders: 0,
    totalProducts: 0,
    customers: 0
  });
  
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [bestSelling, setBestSelling] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'order', message: 'New order #3482 received', time: '10 mins ago', unread: true },
    { id: 2, type: 'stock', message: 'Product "Premium Watch" is running low on stock', time: '2 hours ago', unread: true },
    { id: 3, type: 'user', message: 'New customer registration: Riya Sharma', time: '5 hours ago', unread: false },
    { id: 4, type: 'system', message: 'Monthly database backup completed successfully', time: '1 day ago', unread: false },
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Orders
        const ordersSnapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        let sales = 0;
        let tOrders = 0;
        let pending = 0;
        let processing = 0;
        let dispatched = 0;
        let delivered = 0;
        let cancelled = 0;
        let paymentFailed = 0;
        
        const rOrders: any[] = [];
        const thirtyDaysAgo = subDays(new Date(), 30);
        
        // Setup initial chart data (last 7 days mapping)
        const dailyData: Record<string, number> = {};
        for(let i=6; i>=0; i--) {
          dailyData[format(subDays(new Date(), i), 'MMM dd')] = 0;
        }

        const productSales: Record<string, {name: string, count: number, rev: number}> = {};

        ordersSnapshot.forEach(doc => {
          const data = doc.data();
          tOrders++;
          
          if (tOrders <= 5) {
            rOrders.push({ id: doc.id, ...data });
          }

          if (data.status !== 'cancelled' && data.status !== 'payment_failed') {
            sales += data.grandTotal || 0;
            
            // Build chart data
            if (data.createdAt?.toDate) {
               const d = data.createdAt.toDate();
               const dayStr = format(d, 'MMM dd');
               if (dailyData[dayStr] !== undefined) {
                 dailyData[dayStr] += data.grandTotal || 0;
               }
            }
            
            // Build best sellers
            data.items?.forEach((item: any) => {
               if (!productSales[item.productId]) {
                  productSales[item.productId] = { name: item.name, count: 0, rev: 0 };
               }
               productSales[item.productId].count += item.quantity;
               productSales[item.productId].rev += (item.quantity * (item.priceWithGst || item.basePrice));
            });
          }

          if (data.status === 'pending') pending++;
          if (data.status === 'processing' || data.status === 'confirmed') processing++;
          if (data.status === 'shipped' || data.status === 'out_for_delivery' || data.status === 'dispatched') dispatched++;
          if (data.status === 'delivered') delivered++;
          if (data.status === 'cancelled') cancelled++;
          if (data.status === 'payment_failed' || (data.failedPaymentLogs && data.failedPaymentLogs.length > 0)) paymentFailed++;
        });

        // Format sales data
        const chartData = Object.keys(dailyData).map(key => ({
          name: key,
          total: dailyData[key]
        }));
        setSalesData(chartData);
        
        const topProducts = Object.values(productSales)
           .sort((a, b) => b.count - a.count)
           .slice(0, 5);
        setBestSelling(topProducts);

        setRecentOrders(rOrders);

        // Fetch Products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        
        // Fetch Customers
        const customersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
        
        const rCustomers: any[] = [];
        let i = 0;
        customersSnapshot.forEach(doc => {
          if (i < 5) {
             rCustomers.push({ id: doc.id, ...doc.data() });
          }
          i++;
        });
        setRecentCustomers(rCustomers);

        setStats({
          totalSales: sales,
          totalOrders: tOrders,
          pendingOrders: pending,
          processingOrders: processing,
          dispatchedOrders: dispatched,
          deliveredOrders: delivered,
          cancelledOrders: cancelled,
          paymentFailedOrders: paymentFailed,
          totalProducts: productsSnapshot.size,
          customers: customersSnapshot.size
        });

        // Fetch Low Stock Products
        const lowStockQuery = query(
          collection(db, 'products'),
          where('stock', '<', 10),
          orderBy('stock', 'asc'),
          limit(5)
        );
        const lowStockSnap = await getDocs(lowStockQuery);
        setLowStockProducts(lowStockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/"><ArrowLeft className="w-4 h-4"/> Back to Store</Link>
         </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Enterprise overview and business metrics</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="gap-2" asChild>
             <Link to="/admin/orders">
               <ShoppingBag className="w-4 h-4" /> View All Orders
             </Link>
           </Button>
           <Button className="gap-2" asChild>
             <Link to="/admin/products">
               <Package className="w-4 h-4" /> Manage Inventory
             </Link>
           </Button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] outline outline-1 outline-transparent hover:outline-[#d4af37]/30 transition-all duration-300">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
               <h3 className="text-3xl font-bold text-[#0F172A]">{formatCurrency(stats.totalSales)}</h3>
             </div>
             <div className="p-3 bg-[#d4af37]/10 rounded-xl"><IndianRupee className="w-5 h-5 text-[#d4af37]" /></div>
           </div>
        </div>

        <div onClick={() => navigate('/admin/orders')} className="cursor-pointer bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] outline outline-1 outline-transparent hover:outline-[#3b82f6]/30 transition-all duration-300">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500 mb-1">Total Orders</p>
               <h3 className="text-3xl font-bold text-[#0F172A]">{stats.totalOrders}</h3>
             </div>
             <div className="p-3 bg-[#3b82f6]/10 rounded-xl"><ShoppingBag className="w-5 h-5 text-[#3b82f6]" /></div>
           </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] outline outline-1 outline-transparent hover:outline-[#10B981]/30 transition-all duration-300">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500 mb-1">Total Customers</p>
               <h3 className="text-3xl font-bold text-[#0F172A]">{stats.customers}</h3>
             </div>
             <div className="p-3 bg-[#10B981]/10 rounded-xl"><Users className="w-5 h-5 text-[#10B981]" /></div>
           </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] outline outline-1 outline-transparent hover:outline-[#8b5cf6]/30 transition-all duration-300">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500 mb-1">Active Products</p>
               <h3 className="text-3xl font-bold text-[#0F172A]">{stats.totalProducts}</h3>
             </div>
             <div className="p-3 bg-[#8b5cf6]/10 rounded-xl"><Package className="w-5 h-5 text-[#8b5cf6]" /></div>
           </div>
        </div>
      </div>

      {/* Order Status Cards */}
      <h2 className="font-bold font-serif text-xl text-[#0F172A] mt-6 mb-2">Order Status Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div onClick={() => navigate('/admin/orders?status=pending')} className="cursor-pointer bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all outline outline-1 outline-transparent hover:outline-amber-300">
           <div className="flex justify-between items-center w-full">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500 border border-amber-100"><Clock className="w-5 h-5" /></div>
              <p className="text-3xl font-bold text-[#0F172A]">{stats.pendingOrders}</p>
           </div>
           <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Pending</p>
        </div>
        
        <div onClick={() => navigate('/admin/orders?status=processing')} className="cursor-pointer bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all outline outline-1 outline-transparent hover:outline-blue-400">
           <div className="flex justify-between items-center w-full">
             <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500 border border-blue-100"><RefreshCw className="w-5 h-5" /></div>
             <p className="text-3xl font-bold text-[#0F172A]">{stats.processingOrders}</p>
           </div>
           <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Processing</p>
        </div>

        <div onClick={() => navigate('/admin/orders?status=shipped')} className="cursor-pointer bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all outline outline-1 outline-transparent hover:outline-indigo-400">
           <div className="flex justify-between items-center w-full">
             <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-500 border border-indigo-100"><Truck className="w-5 h-5" /></div>
             <p className="text-3xl font-bold text-[#0F172A]">{stats.dispatchedOrders}</p>
           </div>
           <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Dispatched</p>
        </div>

        <div onClick={() => navigate('/admin/orders?status=delivered')} className="cursor-pointer bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all outline outline-1 outline-transparent hover:outline-emerald-400">
           <div className="flex justify-between items-center w-full">
             <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-500 border border-emerald-100"><CheckCircle2 className="w-5 h-5" /></div>
             <p className="text-3xl font-bold text-[#0F172A]">{stats.deliveredOrders}</p>
           </div>
           <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Delivered</p>
        </div>

        <div onClick={() => navigate('/admin/orders?status=cancelled')} className="cursor-pointer bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all outline outline-1 outline-transparent hover:outline-red-400">
           <div className="flex justify-between items-center w-full">
             <div className="p-2.5 bg-red-50 rounded-xl text-red-500 border border-red-100"><XCircle className="w-5 h-5" /></div>
             <p className="text-3xl font-bold text-[#0F172A]">{stats.cancelledOrders}</p>
           </div>
           <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Cancelled</p>
        </div>

        <div onClick={() => navigate('/admin/orders?status=payment_failed')} className="cursor-pointer bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center gap-3 hover:-translate-y-1 hover:shadow-xl transition-all outline outline-1 outline-transparent hover:outline-orange-500">
           <div className="flex justify-between items-center w-full">
             <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 border border-orange-100"><AlertOctagon className="w-5 h-5" /></div>
             <p className="text-3xl font-bold text-[#0F172A]">{stats.paymentFailedOrders}</p>
           </div>
           <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Payment Failed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#0F172A]">Revenue Analytics</h2>
              <p className="text-sm text-slate-500">Last 7 days performance</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-[#d4af37] hover:text-[#b49124] hover:bg-[#d4af37]/10">
              <Link to="/admin/settings" className="gap-1">Detailed Report <ChevronRight className="w-4 h-4"/></Link>
            </Button>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#64748b', fontSize: 12 }} 
                   tickFormatter={(value) => `₹${value/1000}k`}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#d4af37" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
           <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
             <div className="p-5 border-b border-slate-100 bg-slate-50/50">
               <h2 className="font-bold font-serif flex items-center gap-2 text-[#0F172A]">
                 <AlertTriangle className="h-5 w-5 text-amber-500" />
                 Low Stock Alerts
               </h2>
             </div>
             <div className="p-0">
                {lowStockProducts.length > 0 ? (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {lowStockProducts.map(p => (
                      <li key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                            {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <div>
                            <p className="font-medium text-[#0F172A] line-clamp-1">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.sku || 'No SKU'}</p>
                          </div>
                        </div>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs border border-amber-200 shadow-sm">
                          {p.stock} left
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">No low stock items!</div>
                )}
             </div>
           </div>

           <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline outline-1 outline-transparent hover:outline-[#10B981]/30 p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <h2 className="font-bold font-serif mb-5 flex items-center gap-2 text-[#0F172A]">
                <TrendingUp className="h-5 w-5 text-[#10B981]" />
                Best Selling Products
              </h2>
              <div className="space-y-4">
                 {bestSelling.map((p, i) => (
                   <div key={i} className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-[#10B981] group-hover:text-white transition-colors shadow-sm">
                           {i + 1}
                         </div>
                         <p className="text-sm font-medium line-clamp-1 flex-1 text-[#0F172A]">{p.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#10B981]">{p.count} sold</p>
                      </div>
                   </div>
                 ))}
                 {bestSelling.length === 0 && <p className="text-sm text-slate-500">No data available yet</p>}
              </div>
           </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="font-bold font-serif text-xl text-[#0F172A]">Recent Orders</h2>
            <p className="text-sm text-slate-500">Latest transactions processed</p>
          </div>
          <Button variant="outline" size="sm" asChild className="hover:bg-slate-100 border-slate-200 text-slate-700">
             <Link to="/admin/orders">View All</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-slate-100 text-left text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="p-5 min-w-[120px]">Order ID</th>
                <th className="p-5">Customer</th>
                <th className="p-5">Date</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentOrders.length > 0 ? recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-5 font-bold text-[#d4af37]">
                    <Link to={`/admin/orders/${order.id}`} className="hover:underline hover:text-[#b49124]">
                      #{order.id.slice(-8)}
                    </Link>
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-[#0F172A]">{order.deliveryDetails?.firstName} {order.deliveryDetails?.lastName}</p>
                    <p className="text-xs text-slate-500">{order.deliveryDetails?.city}</p>
                  </td>
                  <td className="p-5 text-slate-500 font-medium">
                    {order.createdAt?.toDate ? formatDistanceToNow(order.createdAt.toDate(), {addSuffix: true}) : 'Just now'}
                  </td>
                  <td className="p-5 uppercase text-[10px] tracking-widest font-bold">
                    <span className={`px-3 py-1.5 rounded-md border shadow-sm ${
                      order.status === 'delivered' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                      order.status === 'shipped' ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20' :
                      'bg-[#d4af37]/10 text-[#b49124] border-[#d4af37]/20'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-5 text-right font-bold text-[#0F172A]">{formatCurrency(order.grandTotal)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No recent orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions & Notifications Column */}
      <div className="space-y-6">
         {/* Quick Actions */}
         <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
               <h2 className="font-bold font-serif text-[#0F172A]">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 p-4 gap-3">
               <Link to="/admin/products#new" className="flex flex-col items-center justify-center p-5 bg-[#F8FAFC] hover:bg-white hover:shadow-md rounded-xl transition-all border border-slate-100 group">
                  <Package className="w-7 h-7 mb-3 text-[#0F172A] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-[#0F172A] text-center">Add Product</span>
               </Link>
               <Link to="/admin/orders" className="flex flex-col items-center justify-center p-5 bg-[#F8FAFC] hover:bg-white hover:shadow-md rounded-xl transition-all border border-slate-100 group">
                  <ShoppingBag className="w-7 h-7 mb-3 text-[#3b82f6] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-[#3b82f6] text-center">Manage Orders</span>
               </Link>
               <Link to="/admin/coupons" className="flex flex-col items-center justify-center p-5 bg-[#F8FAFC] hover:bg-white hover:shadow-md rounded-xl transition-all border border-slate-100 group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket w-7 h-7 mb-3 text-[#f59e0b] group-hover:scale-110 transition-transform"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/></svg>
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-[#f59e0b] text-center">Coupon Mgmt</span>
               </Link>
               <Link to="/admin/banners" className="flex flex-col items-center justify-center p-5 bg-[#F8FAFC] hover:bg-white hover:shadow-md rounded-xl transition-all border border-slate-100 group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-palette w-7 h-7 mb-3 text-[#ec4899] group-hover:scale-110 transition-transform"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-[#ec4899] text-center">Images</span>
               </Link>
            </div>
         </div>

         {/* Notifications */}
         <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="font-bold font-serif text-[#0F172A]">Notifications</h2>
               <span className="bg-[#d4af37] text-[#0F172A] text-[10px] tracking-widest uppercase px-3 py-1 rounded-md font-bold shadow-sm">2 New</span>
            </div>
            <div className="p-0">
               <ul className="divide-y divide-slate-100 text-sm">
                  {notifications.map(n => (
                     <li key={n.id} className={`p-5 hover:bg-slate-50 transition-colors ${n.unread ? 'bg-amber-50/30' : ''}`}>
                        <div className="flex gap-3">
                           <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-sm ${n.unread ? 'bg-[#d4af37]' : 'bg-slate-200'}`} />
                           <div>
                              <p className={`font-medium leading-snug ${n.unread ? 'text-[#0F172A]' : 'text-slate-500'}`}>{n.message}</p>
                              <p className="text-xs text-slate-400 mt-2 font-medium">{n.time}</p>
                           </div>
                        </div>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
         
         {/* Recent Customer Activity */}
         <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="font-bold font-serif text-[#0F172A]">Recent Customers</h2>
            </div>
            <div className="p-0">
               {recentCustomers.length > 0 ? (
                 <ul className="divide-y divide-slate-100 text-sm">
                   {recentCustomers.map((user, idx) => (
                     <li key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-[#0F172A]/5 text-[#0F172A] flex items-center justify-center font-bold border border-slate-200">
                              {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                           </div>
                           <div>
                              <p className="font-bold text-[#0F172A] line-clamp-1">{user.name || 'New User'}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                           </div>
                        </div>
                        <Link to="/admin" className="text-xs text-[#d4af37] font-bold hover:underline">View</Link>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <div className="p-6 text-center text-slate-500 text-sm">No recent customers.</div>
               )}
            </div>
         </div>
      </div>
      
      </div>

    </div>
  );
}

