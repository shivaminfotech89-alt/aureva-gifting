import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, Search, User, X, Heart, MessageCircle } from 'lucide-react';
import { Button, buttonVariants } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore';

import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

import { AurevaLogo } from '../ui/AurevaLogo';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const totalItems = useCartStore(state => state.getTotalItems());
  const wishlistItemsCount = useWishlistStore(state => state.items.length);
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettingsStore();

  const whatsappNumber = settings?.adminWhatsApp || '919825622421';
  const cleanNumber = String(whatsappNumber).replace(/[^0-9]/g, '');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-2' 
          : isHome 
            ? 'bg-transparent py-4 text-white' 
            : 'bg-white py-4 border-b border-slate-100 text-[var(--navy-800)]'
      }`}
    >
      <div className="container flex items-center justify-between px-4 md:px-8 max-w-[80rem] mx-auto">
        
        {/* Mobile Menu Button - Using Sheet */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger render={
            <button className={`md:hidden p-2 -ml-2 ${scrolled || !isHome ? 'text-slate-900' : 'text-white'}`}>
              <Menu className="h-6 w-6" />
            </button>
          } />
          <SheetContent side="left" className="w-[85%] sm:max-w-md p-0 flex flex-col border-r-0 bg-white">
            <SheetHeader className="p-6 text-left border-b border-slate-100">
              <SheetTitle>
                <AurevaLogo variant="dark" className="scale-90 origin-left" />
              </SheetTitle>
            </SheetHeader>
            <div className="p-6 flex-1 overflow-y-auto">
              <nav className="flex flex-col gap-6 text-lg font-medium text-slate-700">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[var(--gold-500)] transition-colors">Home</Link>
                
                <button 
                  onClick={() => { 
                    setIsMobileMenuOpen(false); 
                    window.dispatchEvent(new Event('openCatalogModal')); 
                  }} 
                  className="text-left hover:text-[var(--gold-500)] transition-colors font-medium"
                >
                  Catalog
                </button>

                <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[var(--gold-500)] transition-colors">Shop All Gifts</Link>
                <Link to="/corporate" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[var(--gold-500)] transition-colors">Corporate Bulk</Link>
                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[var(--gold-500)] flex items-center gap-2 transition-colors">Wishlist {wishlistItemsCount > 0 && <span className="bg-[var(--gold-500)] text-[var(--navy-800)] text-xs px-2 py-0.5 rounded-full font-bold">{wishlistItemsCount}</span>}</Link>
                <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[var(--gold-500)] transition-colors">About Us</Link>
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[var(--gold-500)] transition-colors">Contact</Link>
                <Link to={user ? (profile?.role === 'admin' ? '/admin' : '/account') : '/account/login'} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[var(--gold-500)] pt-4 border-t border-slate-100 transition-colors">
                  {user ? (profile?.role === 'admin' ? 'Admin Dashboard' : 'My Account') : 'Sign In / Register'}
                </Link>
              </nav>
            </div>
            <div className="p-6 border-t border-slate-100 flex flex-col gap-4 bg-slate-50/50">
              <a href={`https://wa.me/${cleanNumber}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full text-sm font-bold border-2 border-[#25D366] text-[#25D366] px-5 py-3 rounded-xl hover:bg-[#25D366] hover:text-white transition-all">
                <MessageCircle className="w-5 h-5" /> WhatsApp Support
              </a>
              <Link to="/corporate" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center text-[var(--navy-800)] bg-[var(--gold-500)] border-2 border-[var(--gold-500)] hover:bg-[var(--gold-400)] hover:border-[var(--gold-400)] py-3 rounded-xl font-bold transition-all shadow-sm">
                Get Custom Quote
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 shrink-0">
          <AurevaLogo variant={scrolled || !isHome ? 'dark' : 'light'} />
        </Link>

        {/* Desktop Navigation */}
        <nav className={`hidden md:flex items-center gap-8 text-sm font-medium ${scrolled || !isHome ? 'text-slate-600' : 'text-white/90'}`}>
          <Link to="/" className={`transition-colors hover:text-[var(--gold-500)] ${location.pathname === '/' ? 'text-[var(--gold-500)]' : ''}`}>Home</Link>
          
          <button 
            onClick={() => window.dispatchEvent(new Event('openCatalogModal'))}
            className={`transition-colors hover:text-[var(--gold-500)] flex items-center gap-1`}
          > 
            Catalog 
          </button>
          
          <div className="group relative z-[50]">
            <Link to="/shop" className={`transition-colors hover:text-[var(--gold-500)] flex items-center gap-1 ${location.pathname.includes('/shop') ? 'text-[var(--gold-500)]' : ''}`}> Shop </Link>
            {/* Simple Mega Menu Hover */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
               <div className="w-[600px] bg-white rounded-xl shadow-2xl border border-slate-100 p-8 grid grid-cols-3 gap-6 text-slate-800">
                  <div>
                     <h4 className="font-bold text-[var(--gold-500)] mb-4 uppercase tracking-widest text-xs">Categories</h4>
                     <ul className="space-y-3 text-sm">
                       <li><Link to="/shop?category=Drinkware" className="hover:text-[var(--gold-500)] transition-colors">Premium Drinkware</Link></li>
                       <li><Link to="/shop?category=Office Essentials" className="hover:text-[var(--gold-500)] transition-colors">Office Essentials</Link></li>
                       <li><Link to="/shop?category=Electronics" className="hover:text-[var(--gold-500)] transition-colors">Tech Gifts</Link></li>
                       <li><Link to="/shop?category=Eco Friendly" className="hover:text-[var(--gold-500)] transition-colors">Eco-Friendly Gifts</Link></li>
                     </ul>
                  </div>
                  <div>
                     <h4 className="font-bold text-[var(--gold-500)] mb-4 uppercase tracking-widest text-xs">Collections</h4>
                     <ul className="space-y-3 text-sm">
                       <li><Link to="/shop?category=Diwali Hampers" className="hover:text-[var(--gold-500)] transition-colors">Diwali Hampers</Link></li>
                       <li><Link to="/shop?category=Welcome Kits" className="hover:text-[var(--gold-500)] transition-colors">Welcome Kits</Link></li>
                       <li><Link to="/shop?category=Corporate Branding" className="hover:text-[var(--gold-500)] transition-colors">Corporate Branding</Link></li>
                       <li><Link to="/shop?category=Bags" className="hover:text-[var(--gold-500)] transition-colors">Executive Premium</Link></li>
                     </ul>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg flex flex-col justify-end relative overflow-hidden">
                     <span className="relative z-10 text-xs font-bold uppercase tracking-widest text-[var(--gold-500)] mb-2">New Arrival</span>
                     <span className="relative z-10 font-display font-bold text-lg mb-2">The Executive Box</span>
                     <Link to="/shop" className="relative z-10 text-xs font-bold underline hover:text-[var(--gold-500)]">Shop Now</Link>
                  </div>
               </div>
            </div>
          </div>
          <Link to="/corporate" className="transition-colors hover:text-[var(--gold-500)]">Corporate Bulk</Link>
          <Link to="/about" className="transition-colors hover:text-[var(--gold-500)]">About Us</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          <a href={`https://wa.me/${cleanNumber}`} target="_blank" rel="noreferrer" className="hidden lg:flex items-center gap-2 text-sm font-bold border border-current px-4 py-2 rounded-full hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all">
             <MessageCircle className="w-4 h-4" /> WhatsApp Us
          </a>

          <Link to="/corporate" className="hidden xl:flex items-center gap-2 text-sm font-bold bg-[var(--gold-500)] text-[var(--navy-800)] px-5 py-2 rounded-full hover:bg-[var(--gold-400)] transition-colors shadow-sm cursor-pointer">
             Bulk Inquiry
          </Link>

          <div className="w-px h-6 bg-current opacity-20 hidden md:block mx-2"></div>

          {user ? (
            profile?.role === 'admin' ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="border-current hover:bg-[var(--gold-500)] hover:text-[var(--navy-800)] hover:border-[var(--gold-500)]">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:text-red-500">
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/account">
                <button className="p-2 transition-colors hover:text-[var(--gold-500)]">
                  <User className="h-5 w-5" />
                </button>
              </Link>
            )
          ) : (
            <Link to="/account/login">
              <button className="p-2 transition-colors hover:text-[var(--gold-500)]">
                <User className="h-5 w-5" />
              </button>
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link to="/admin" className="md:hidden p-2 transition-colors hover:text-[var(--gold-500)]">
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link to="/wishlist" className="hidden sm:flex relative p-2 transition-colors hover:text-[var(--gold-500)]">
            <Heart className="h-5 w-5" />
            {wishlistItemsCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[var(--gold-500)] text-[10px] font-bold text-[var(--navy-800)] flex items-center justify-center">
                {wishlistItemsCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative p-2 transition-colors hover:text-[var(--gold-500)]">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[var(--gold-500)] text-[10px] font-bold text-[var(--navy-800)] flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
      </header>
    </>
  );
}
