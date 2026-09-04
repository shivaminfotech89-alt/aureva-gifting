import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { useAuthListener } from './hooks/useAuthListener';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { useSettingsStore } from './store/settingsStore';
import { CatalogLeadModal } from './components/shop/CatalogLeadModal';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CorporateBulkPage = lazy(() => import('./pages/CorporateBulkPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AdminLayout = lazy(() => import('./pages/admin/layout/AdminLayout'));
const AdminDashboardIndex = lazy(() => import('./pages/admin/AdminDashboardIndex'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminHomepageContent = lazy(() => import('./pages/admin/AdminHomepageContent'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetails = lazy(() => import('./pages/admin/AdminOrderDetails'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCustomerDetails = lazy(() => import('./pages/admin/AdminCustomerDetails'));
const AdminCatalogLeads = lazy(() => import('./pages/admin/AdminCatalogLeads'));
const AdminBudgetCatalogs = lazy(() => import('./pages/admin/AdminBudgetCatalogs'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminPlaceholderPage = lazy(() => import('./pages/admin/AdminPlaceholderPage'));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
import ProtectedRoute from './components/layout/ProtectedRoute';

function Layout() {
  const { settings } = useSettingsStore();
  const whatsappNumber = settings?.adminWhatsApp || '919825622421';
  const cleanNumber = String(whatsappNumber).replace(/[^0-9]/g, '');
  
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  useEffect(() => {
    const handleOpenCatalog = () => setIsCatalogOpen(true);
    window.addEventListener('openCatalogModal', handleOpenCatalog);
    return () => window.removeEventListener('openCatalogModal', handleOpenCatalog);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30 relative">
      <Navbar />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
      
      {/* WhatsApp FAB */}
      <a 
        href={`https://wa.me/${cleanNumber}`}
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[40] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-xl hover:bg-[#20bd5a] hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/50"
        aria-label="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </a>
      
      <CatalogLeadModal 
        isOpen={isCatalogOpen} 
        onClose={() => setIsCatalogOpen(false)} 
      />
    </div>
  );
}

const PrivacyPolicyPage = lazy(() => import('./pages/policies/PrivacyPolicyPage'));
const TermsConditionsPage = lazy(() => import('./pages/policies/TermsConditionsPage'));
const ReturnRefundPolicyPage = lazy(() => import('./pages/policies/ReturnRefundPolicyPage'));
const ShippingPolicyPage = lazy(() => import('./pages/policies/ShippingPolicyPage'));
const CancellationPolicyPage = lazy(() => import('./pages/policies/CancellationPolicyPage'));

/** Shown for the moment a route's code is being fetched. */
function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--gold-500)]" />
    </div>
  );
}

export default function App() {
  useAuthListener();
  const initSettings = useSettingsStore(state => state.initSettings);

  useEffect(() => {
    const unsub = initSettings();
    return () => {
      unsub && unsub();
    };
  }, [initSettings]);

  return (
    <Router>
      <Toaster position="top-center" richColors />
      {/* Each route is its own download, so a customer never fetches the admin
          panel and the charting and PDF libraries that come with it. */}
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="account/login" element={<AuthPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="corporate" element={<CorporateBulkPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsConditionsPage />} />
          <Route path="refund" element={<ReturnRefundPolicyPage />} />
          <Route path="shipping" element={<ShippingPolicyPage />} />
          <Route path="cancellation" element={<CancellationPolicyPage />} />
          
          <Route element={<ProtectedRoute requiredRole="customer" />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account/*" element={<CustomerDashboard />} />
          </Route>
        </Route>
        
        {/* Admin Routes with dedicated Layout */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
             <Route index element={<AdminDashboardIndex />} />
             <Route path="products" element={<AdminProducts />} />
             <Route path="banners" element={<AdminHomepageContent />} />
             <Route path="orders" element={<AdminOrders />} />
             <Route path="orders/:id" element={<AdminOrderDetails />} />
             <Route path="customers" element={<AdminCustomers />} />
             <Route path="customers/:id" element={<AdminCustomerDetails />} />
             <Route path="catalog-leads" element={<AdminCatalogLeads />} />
             <Route path="budget-catalogs" element={<AdminBudgetCatalogs />} />
             <Route path="settings" element={<AdminSettings />} />
             
             {/* Placeholder Routes */}
             <Route path="categories" element={<AdminPlaceholderPage />} />
             <Route path="inventory" element={<AdminProducts />} />
             <Route path="coupons" element={<AdminCoupons />} />
             <Route path="analytics" element={<AdminPlaceholderPage />} />
             <Route path="reviews" element={<AdminPlaceholderPage />} />
             <Route path="reports" element={<AdminPlaceholderPage />} />
             <Route path="whatsapp-leads" element={<AdminPlaceholderPage />} />
             <Route path="email-campaigns" element={<AdminPlaceholderPage />} />
             <Route path="notifications" element={<AdminPlaceholderPage />} />
             <Route path="roles" element={<AdminPlaceholderPage />} />
             <Route path="appearance" element={<AdminPlaceholderPage />} />
             <Route path="payments" element={<AdminPlaceholderPage />} />
             <Route path="shipping" element={<AdminPlaceholderPage />} />
             <Route path="tax" element={<AdminPlaceholderPage />} />
             <Route path="seo" element={<AdminPlaceholderPage />} />
             <Route path="backup" element={<AdminPlaceholderPage />} />
             <Route path="logs" element={<AdminPlaceholderPage />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </Router>
  );
}
