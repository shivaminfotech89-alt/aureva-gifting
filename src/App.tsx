import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { useAuthListener } from './hooks/useAuthListener';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import CorporateBulkPage from './pages/CorporateBulkPage';
import ContactPage from './pages/ContactPage';
import AdminLayout from './pages/admin/layout/AdminLayout';
import AdminDashboardIndex from './pages/admin/AdminDashboardIndex';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProtectedRoute from './components/layout/ProtectedRoute';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar />
      <main className="flex-grow w-full overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  useAuthListener();

  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="account/login" element={<AuthPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="corporate" element={<CorporateBulkPage />} />
          <Route path="contact" element={<ContactPage />} />
          
          <Route element={<ProtectedRoute requiredRole="customer" />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account/*" element={<CustomerDashboard />} />
          </Route>
        </Route>
        
        {/* Admin Routes with dedicated Layout */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
           <Route index element={<AdminDashboardIndex />} />
           <Route path="products" element={<AdminProducts />} />
           <Route path="orders" element={<AdminOrders />} />
           <Route path="customers" element={<AdminCustomers />} />
        </Route>
      </Routes>
    </Router>
  );
}
