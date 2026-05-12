import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatCurrency } from '../../lib/utils';
import { 
  Package, ShoppingBag, Users, IndianRupee, AlertTriangle, ArrowRight,
  TrendingUp, Clock, Truck, MapPin, XCircle, Activity,
  ChevronRight, Calendar, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '../../components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfMonth, formatDistanceToNow } from 'date-fns';

export default function AdminDashboardIndex() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    dispatchedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
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
        let dispatched = 0;
        let delivered = 0;
        let cancelled = 0;
        
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

          if (data.status !== 'cancelled') {
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

          if (data.status === 'pending' || data.status === 'processing') pending++;
          if (data.status === 'shipped') dispatched++;
          if (data.status === 'delivered') delivered++;
          if (data.status === 'cancelled') cancelled++;
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
          dispatchedOrders: dispatched,
          deliveredOrders: delivered,
          cancelledOrders: cancelled,
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
        <div className="bg-card p-6 rounded-xl border shadow-sm outline outline-1 outline-transparent hover:outline-primary/20 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
               <h3 className="text-3xl font-bold text-primary">{formatCurrency(stats.totalSales)}</h3>
             </div>
             <div className="p-3 bg-primary/10 rounded-lg"><IndianRupee className="w-5 h-5 text-primary" /></div>
           </div>
        </div>

        <div className="bg-card p-6 rounded-xl border shadow-sm outline outline-1 outline-transparent hover:outline-primary/20 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
               <h3 className="text-3xl font-bold">{stats.totalOrders}</h3>
             </div>
             <div className="p-3 bg-blue-500/10 rounded-lg"><ShoppingBag className="w-5 h-5 text-blue-500" /></div>
           </div>
        </div>

        <div className="bg-card p-6 rounded-xl border shadow-sm outline outline-1 outline-transparent hover:outline-primary/20 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-muted-foreground mb-1">Total Customers</p>
               <h3 className="text-3xl font-bold">{stats.customers}</h3>
             </div>
             <div className="p-3 bg-green-500/10 rounded-lg"><Users className="w-5 h-5 text-green-500" /></div>
           </div>
        </div>

        <div className="bg-card p-6 rounded-xl border shadow-sm outline outline-1 outline-transparent hover:outline-primary/20 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-muted-foreground mb-1">Active Products</p>
               <h3 className="text-3xl font-bold">{stats.totalProducts}</h3>
             </div>
             <div className="p-3 bg-purple-500/10 rounded-lg"><Package className="w-5 h-5 text-purple-500" /></div>
           </div>
        </div>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
           <div className="p-3 bg-amber-500/10 text-amber-600 rounded-full"><Clock className="w-5 h-5" /></div>
           <div>
             <p className="text-xs font-medium text-muted-foreground uppercase">Pending</p>
             <p className="text-xl font-bold">{stats.pendingOrders}</p>
           </div>
        </div>
        <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
           <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-full"><Truck className="w-5 h-5" /></div>
           <div>
             <p className="text-xs font-medium text-muted-foreground uppercase">Dispatched</p>
             <p className="text-xl font-bold">{stats.dispatchedOrders}</p>
           </div>
        </div>
        <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
           <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full"><MapPin className="w-5 h-5" /></div>
           <div>
             <p className="text-xs font-medium text-muted-foreground uppercase">Delivered</p>
             <p className="text-xl font-bold">{stats.deliveredOrders}</p>
           </div>
        </div>
        <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
           <div className="p-3 bg-destructive/10 text-destructive rounded-full"><XCircle className="w-5 h-5" /></div>
           <div>
             <p className="text-xs font-medium text-muted-foreground uppercase">Cancelled</p>
             <p className="text-xl font-bold">{stats.cancelledOrders}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm p-6 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold">Revenue Analytics</h2>
              <p className="text-sm text-muted-foreground">Last 7 days performance</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/settings" className="text-primary gap-1">Detailed Report <ChevronRight className="w-4 h-4"/></Link>
            </Button>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 12 }} 
                   tickFormatter={(value) => `₹${value/1000}k`}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
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
           <div className="bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
             <div className="p-4 border-b bg-muted/20">
               <h2 className="font-bold flex items-center gap-2">
                 <AlertTriangle className="h-4 w-4 text-amber-500" />
                 Low Stock Alerts
               </h2>
             </div>
             <div className="p-0">
                {lowStockProducts.length > 0 ? (
                  <ul className="divide-y text-sm">
                    {lowStockProducts.map(p => (
                      <li key={p.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                            {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku || 'No SKU'}</p>
                          </div>
                        </div>
                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs">
                          {p.stock} left
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No low stock items!</div>
                )}
             </div>
           </div>

           <div className="bg-card rounded-xl border shadow-sm outline outline-1 outline-primary/20 p-5">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Best Selling Products
              </h2>
              <div className="space-y-4">
                 {bestSelling.map((p, i) => (
                   <div key={i} className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                           {i + 1}
                         </div>
                         <p className="text-sm font-medium line-clamp-1 flex-1">{p.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{p.count} sold</p>
                      </div>
                   </div>
                 ))}
                 {bestSelling.length === 0 && <p className="text-sm text-muted-foreground">No data available yet</p>}
              </div>
           </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Recent Orders</h2>
            <p className="text-sm text-muted-foreground">Latest transactions processed</p>
          </div>
          <Button variant="outline" size="sm" asChild>
             <Link to="/admin/orders">View All</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b text-left text-muted-foreground">
              <tr>
                <th className="p-4 font-medium min-w-[120px]">Order ID</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.length > 0 ? recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-primary">
                    <Link to={`/admin/orders/${order.id}`} className="hover:underline">
                      #{order.id.slice(-8)}
                    </Link>
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{order.deliveryDetails?.firstName} {order.deliveryDetails?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{order.deliveryDetails?.city}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {order.createdAt?.toDate ? formatDistanceToNow(order.createdAt.toDate(), {addSuffix: true}) : 'Just now'}
                  </td>
                  <td className="p-4 uppercase text-xs font-bold">
                    <span className={`px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium">{formatCurrency(order.grandTotal)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No recent orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions & Notifications Column */}
      <div className="space-y-6">
         {/* Quick Actions */}
         <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/10">
               <h2 className="font-bold">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 p-4 gap-3">
               <Link to="/admin/products#new" className="flex flex-col items-center justify-center p-4 bg-muted/40 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors border shadow-sm">
                  <Package className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-xs font-medium text-center">Add Product</span>
               </Link>
               <Link to="/admin/orders" className="flex flex-col items-center justify-center p-4 bg-muted/40 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors border shadow-sm">
                  <ShoppingBag className="w-6 h-6 mb-2 text-blue-500" />
                  <span className="text-xs font-medium text-center">Manage Orders</span>
               </Link>
               <Link to="/admin/customers" className="flex flex-col items-center justify-center p-4 bg-muted/40 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors border shadow-sm">
                  <Users className="w-6 h-6 mb-2 text-green-500" />
                  <span className="text-xs font-medium text-center">Customers</span>
               </Link>
               <Link to="/admin/settings" className="flex flex-col items-center justify-center p-4 bg-muted/40 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors border shadow-sm">
                  <Activity className="w-6 h-6 mb-2 text-purple-500" />
                  <span className="text-xs font-medium text-center">Settings</span>
               </Link>
            </div>
         </div>

         {/* Notifications */}
         <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
               <h2 className="font-bold">Notifications</h2>
               <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">2 New</span>
            </div>
            <div className="p-0">
               <ul className="divide-y text-sm">
                  {notifications.map(n => (
                     <li key={n.id} className={`p-4 hover:bg-muted/30 transition-colors ${n.unread ? 'bg-primary/5' : ''}`}>
                        <div className="flex gap-3">
                           <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-primary' : 'bg-transparent'}`} />
                           <div>
                              <p className={`font-medium ${n.unread ? 'text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                           </div>
                        </div>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
         
         {/* Recent Customer Activity */}
         <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
               <h2 className="font-bold">Recent Customers</h2>
            </div>
            <div className="p-0">
               {recentCustomers.length > 0 ? (
                 <ul className="divide-y text-sm">
                   {recentCustomers.map((user, idx) => (
                     <li key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                           </div>
                           <div>
                              <p className="font-medium line-clamp-1">{user.name || 'New User'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                           </div>
                        </div>
                        <Link to="/admin" className="text-xs text-primary font-medium hover:underline">View</Link>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <div className="p-6 text-center text-muted-foreground text-sm">No recent customers.</div>
               )}
            </div>
         </div>
      </div>
      
      </div>

    </div>
  );
}

