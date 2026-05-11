import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Menu, X, ArrowLeft, Settings } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '../../../store/authStore';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center px-6 border-b border-border justify-between">
        <span className="font-sans font-bold text-xl tracking-tighter uppercase text-primary">Aureva Admin</span>
        <button className="md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
        <div className="pt-4 mt-4 border-t border-border">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Store
          </NavLink>
        </div>
      </nav>
      
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
            {profile?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{profile?.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{profile?.role}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Mobile Header (visible only on small screens) */}
      <header className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-20">
        <span className="font-sans font-bold text-lg tracking-tighter uppercase text-primary">Aureva Admin</span>
        <div className="flex gap-2 items-center">
          <button onClick={handleLogout} className="p-2 text-destructive">
            <LogOut className="h-5 w-5" />
          </button>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col shrink-0 min-h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 max-w-[80vw] bg-card h-full flex flex-col shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-muted/20 pb-8">
        <header className="hidden md:flex h-20 border-b border-border bg-background items-center px-8 justify-between sticky top-0 z-10 w-full">
          <h2 className="text-xl font-semibold">Overview</h2>
          <div className="flex items-center gap-4">
             <NavLink to="/" className="text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors bg-secondary px-4 py-2 rounded-lg text-secondary-foreground shadow-sm">
               <ArrowLeft className="h-4 w-4" /> Go to Website
             </NavLink>
             <button
               onClick={handleLogout}
               className="text-sm font-medium flex items-center gap-2 transition-colors bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2 rounded-lg shadow-sm"
             >
               <LogOut className="h-4 w-4" /> Logout
             </button>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
