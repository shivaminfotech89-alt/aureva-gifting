import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatCurrency } from '../../lib/utils';
import { Package, ShoppingBag, Users, IndianRupee, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ProductData } from '../../components/shop/ProductCard';

export default function AdminDashboardIndex() {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeOrders: 0,
    totalProducts: 0,
    customers: 0
  });
  
  const [lowStockProducts, setLowStockProducts] = useState<ProductData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        let sales = 0;
        let active = 0;
        ordersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status !== 'cancelled') {
            sales += data.grandTotal || 0;
          }
          if (data.status === 'pending' || data.status === 'processing') {
            active += 1;
          }
        });

        // Fetch Products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        
        // Fetch Customers
        const customersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));

        setStats({
          totalSales: sales,
          activeOrders: active,
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
        setLowStockProducts(lowStockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductData)));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(stats.totalSales), icon: IndianRupee },
    { title: 'Active Orders', value: stats.activeOrders.toString(), icon: ShoppingBag },
    { title: 'Total Products', value: stats.totalProducts.toString(), icon: Package },
    { title: 'Customers', value: stats.customers.toString(), icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome to the Aureva Admin Panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Alerts
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Products running low on inventory</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/products">Manage Inventory</Link>
            </Button>
          </div>
          <div className="p-0 flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                      All products have sufficient stock.
                    </td>
                  </tr>
                ) : (
                  lowStockProducts.map(product => (
                    <tr key={product.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-medium line-clamp-1">{product.name}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stock === 0 ? 'bg-destructive/10 text-destructive' : 'bg-yellow-100 text-yellow-800'}`}>
                          {product.stock} left
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Product Management
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Quick access to inventory tools</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center">
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <Button asChild className="w-full flex justify-between items-center group">
                <Link to="/admin/products">
                  View All Products
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="secondary" asChild className="w-full flex justify-between items-center group">
                <Link to="/admin/products">
                  Add New Product
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
