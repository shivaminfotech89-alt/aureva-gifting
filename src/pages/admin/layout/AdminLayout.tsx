import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Menu, X, ArrowLeft, Settings, Tag, Grid, Calendar, Warehouse, BarChart3, MessageCircle, Mail, Ticket, Star, Bell, FileText, Shield, Palette, CreditCard, Truck, Receipt, Search, Database, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '../../../store/authStore';

import { NotificationBell } from '../../../components/admin/NotificationBell';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check local storage for persistent state
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const getFilteredMenuGroups = () => {
    const adminRole = profile?.adminRole || 'Super Admin';
    const isSuperAdmin = adminRole === 'Super Admin' || adminRole === 'admin'; // fallback

    const allGroups = [
      {
        title: "Main",
        items: [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['Super Admin', 'Project Manager', 'Admin', 'Order Manager', 'Marketing Manager'] },
          { name: 'Orders', path: '/admin/orders', icon: ShoppingBag, roles: ['Super Admin', 'Admin', 'Order Manager'] },
          { name: 'Products', path: '/admin/products', icon: Package, roles: ['Super Admin', 'Project Manager', 'Admin'] },
        ]
      },
      {
        title: "Catalog & Content",
        items: [
          { name: 'Categories', path: '/admin/categories', icon: Grid, roles: ['Super Admin', 'Admin'] },
          { name: 'Image Management', path: '/admin/banners', icon: Palette, roles: ['Super Admin', 'Project Manager', 'Marketing Manager'] },
          { name: 'Inventory', path: '/admin/inventory', icon: Warehouse, roles: ['Super Admin', 'Admin'] },
          { name: 'Coupon Management', path: '/admin/coupons', icon: Ticket, roles: ['Super Admin', 'Admin', 'Marketing Manager'] },
        ]
      },
      {
        title: "Customers & Analytics",
        items: [
          { name: 'Customers', path: '/admin/customers', icon: Users, roles: ['Super Admin', 'Admin', 'Order Manager'] },
          { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, roles: ['Super Admin', 'Project Manager'] },
          { name: 'Reviews', path: '/admin/reviews', icon: Star, roles: ['Super Admin', 'Marketing Manager'] },
          { name: 'Reports', path: '/admin/reports', icon: FileText, roles: ['Super Admin', 'Order Manager', 'Project Manager'] },
        ]
      },
      {
        title: "Marketing",
        items: [
          { name: 'WhatsApp Leads', path: '/admin/whatsapp-leads', icon: MessageCircle, roles: ['Super Admin', 'Marketing Manager'] },
          { name: 'Email Campaigns', path: '/admin/email-campaigns', icon: Mail, roles: ['Super Admin', 'Project Manager', 'Marketing Manager'] },
          { name: 'Notifications', path: '/admin/notifications', icon: Bell, roles: ['Super Admin', 'Marketing Manager'] },
        ]
      },
      {
        title: "System",
        items: [
          { name: 'Admin Settings', path: '/admin/settings', icon: Settings, roles: ['Super Admin'] },
          { name: 'Roles', path: '/admin/roles', icon: Shield, roles: ['Super Admin'] },
          { name: 'Appearance', path: '/admin/appearance', icon: Palette, roles: ['Super Admin'] },
        ]
      },
      {
        title: "Operations",
        items: [
          { name: 'Payments', path: '/admin/payments', icon: CreditCard, roles: ['Super Admin'] },
          { name: 'Shipping', path: '/admin/shipping', icon: Truck, roles: ['Super Admin', 'Order Manager'] },
          { name: 'Tax', path: '/admin/tax', icon: Receipt, roles: ['Super Admin'] },
        ]
      },
      {
        title: "Advanced",
        items: [
          { name: 'SEO', path: '/admin/seo', icon: Search, roles: ['Super Admin', 'Marketing Manager'] },
          { name: 'Backup', path: '/admin/backup', icon: Database, roles: ['Super Admin'] },
          { name: 'Logs', path: '/admin/logs', icon: Activity, roles: ['Super Admin'] },
        ]
      }
    ];

    if (isSuperAdmin) return allGroups;

    const filtered = allGroups.map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(adminRole))
    })).filter(group => group.items.length > 0);

    return filtered;
  };

  const menuGroups = getFilteredMenuGroups();

  useEffect(() => {
    // Collect all allowed paths + base route + IDs (like orders/:id)
    if (profile?.role === 'admin') {
       const allowedPaths = new Set(
         menuGroups.flatMap(group => group.items.map(item => item.path))
       );
       
       let currentPath = location.pathname;
       // Quick regex for paths with ids
       const isOrderDetails = currentPath.match(/^\/admin\/orders\/[^/]+$/);
       const isCustomerDetails = currentPath.match(/^\/admin\/customers\/[^/]+$/);

       if (currentPath !== '/admin') {
          // Normalise path (if it's /admin/orders/123 -> check if /admin/orders is allowed)
          let categoryPath = currentPath;
          if (isOrderDetails) categoryPath = '/admin/orders';
          else if (isCustomerDetails) categoryPath = '/admin/customers';

          if (!allowedPaths.has(categoryPath) && !allowedPaths.has(currentPath)) {
             toast.error('Access Denied');
             navigate('/admin');
          }
       }
    }
  }, [location.pathname, profile?.adminRole]);

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = isMobile ? false : isCollapsed;
    return (
      <div className="flex flex-col h-full w-full">
        <div className={`h-20 flex items-center border-b border-white/5 bg-[#0F172A] text-white shrink-0 ${collapsed ? 'justify-center px-0' : 'px-6 justify-between'}`}>
          {!collapsed ? (
             <span className="font-serif font-bold text-xl tracking-widest uppercase text-[#d4af37]">Aureva Admin</span>
          ) : (
             <span className="font-serif font-bold text-2xl tracking-widest text-[#d4af37]">A</span>
          )}
          {isMobile ? (
            <button className="text-white" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          ) : (
            <button 
               className={`text-slate-400 hover:text-white transition-colors bg-white/5 p-1 rounded-md ${collapsed ? 'hidden' : 'block'}`}
               onClick={() => setIsCollapsed(true)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto bg-[#0F172A] border-r border-[#0F172A] custom-scrollbar pb-4 pt-4">
          {collapsed && !isMobile && (
             <div className="flex justify-center mb-6 px-2">
                <button 
                  className="w-full flex justify-center text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-md"
                  onClick={() => setIsCollapsed(false)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
             </div>
          )}

          {menuGroups.map((group, idx) => (
             <div key={idx} className="mb-6">
                {!collapsed && (
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]/60 mb-3 px-6 whitespace-nowrap overflow-hidden">{group.title}</h4>
                )}
                {collapsed && <div className="h-px bg-white/5 mx-4 mb-3" />}
                
                <ul className={`space-y-1 ${collapsed ? 'px-3' : 'px-4'}`}>
                   {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <NavLink
                            to={item.path}
                            end={item.path === '/admin'}
                            onClick={() => { if(isMobile) setMobileMenuOpen(false); }}
                            className={({ isActive }) =>
                              `flex items-center rounded-lg text-sm font-medium transition-all duration-200 group ${
                                collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
                              } ${
                                isActive
                                  ? 'bg-[#d4af37]/10 text-[#d4af37] shadow-sm'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`
                            }
                            title={collapsed ? item.name : undefined}
                          >
                            <Icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 shrink-0'}`} />
                            {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                          </NavLink>
                        </li>
                      );
                   })}
                </ul>
             </div>
          ))}
          
          <div className={`pt-4 mt-4 border-t border-white/5 ${collapsed ? 'px-3' : 'px-4'}`}>
            <NavLink
              to="/"
              className={`flex items-center rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors group ${
                collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
              }`}
              title={collapsed ? "Back to Store" : undefined}
            >
              <ArrowLeft className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4 shrink-0'}`} />
              {!collapsed && <span className="whitespace-nowrap">Back to Store</span>}
            </NavLink>
          </div>
        </nav>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC]">
      {/* Mobile Header (visible only on small screens) */}
      <header className="md:hidden h-16 border-b border-border bg-[#0F172A] flex items-center justify-between px-4 sticky top-0 z-20">
        <span className="font-serif font-bold text-lg tracking-widest uppercase text-[#d4af37]">Aureva Admin</span>
        <div className="flex gap-2 items-center text-white">
          <div className="invert brightness-0 mt-1">
             <NotificationBell />
          </div>
          <button onClick={handleLogout} className="p-2 text-red-400">
            <LogOut className="h-5 w-5" />
          </button>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-10 shadow-2xl transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[80px]' : 'w-[280px]'
        }`}
      >
        <SidebarContent isMobile={false} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-[300px] max-w-[80vw] bg-[#0F172A] h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent isMobile={true} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-8 min-h-screen overflow-x-hidden">
        <header className="hidden md:flex h-20 bg-white/80 backdrop-blur-md items-center px-8 border-b border-slate-200 justify-between sticky top-0 z-10 w-full transition-all">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block text-slate-500" title="Go Back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold font-serif text-[#0F172A] capitalize">
               {location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').pop()?.replace(/-/g, ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                 <NotificationBell />
             </div>
             <div className="flex items-center gap-3 text-sm font-medium pr-6 border-l pl-6 border-r border-slate-200">
                <div className="w-10 h-10 rounded-full bg-[#0F172A] text-[#d4af37] flex items-center justify-center font-bold shadow-sm">
                   {profile?.name?.charAt(0) || 'A'}
                </div>
                <div>
                   <p className="text-[#0F172A] font-bold">{profile?.name}</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest">{profile?.role}</p>
                </div>
             </div>
             <button
               onClick={handleLogout}
               className="text-sm font-bold flex items-center gap-2 transition-colors bg-white text-red-500 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-lg shadow-sm border border-slate-200"
             >
               <LogOut className="h-4 w-4" /> Logout
             </button>
          </div>
        </header>

        {/* Mobile top spacer to match desktop behavior roughly, or just rely on padding */}
        <div className="p-4 md:p-8 max-w-[1600px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <Outlet />
        </div>
      </main>

      {/* Global CSS for custom scrollbar in sidebar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  );
}
