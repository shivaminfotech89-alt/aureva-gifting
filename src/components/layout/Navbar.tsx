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
            : 'bg-white py-4 border-b border-slate-100 text-[#0F172A]'
      }`}
    >
      <div className="container flex items-center justify-between px-4 md:px-8 max-w-[90rem] mx-auto">
        
        {/* Mobile Menu Button - Using Sheet */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger render={
            <button className={`md:hidden p-2 -ml-2 ${scrolled || !isHome ? 'text-slate-900' : 'text-white'}`}>
              <Menu className="h-6 w-6" />
            </button>
          } />
          <SheetContent side="left" className="w-[85%] sm:max-w-md p-0 flex flex-col border-r-0 bg-white">
            <SheetHeader className="p-6 text-left border-b border-slate-100">
              <SheetTitle className="font-serif font-bold text-2xl tracking-widest uppercase text-[#0F172A]">
                Aureva
              </SheetTitle>
            </SheetHeader>
            <div className="p-6 flex-1 overflow-y-auto">
              <nav className="flex flex-col gap-6 text-lg font-medium text-slate-700">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] transition-colors">Home</Link>
                <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] transition-colors">Shop All Gifts</Link>
                <Link to="/corporate" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] transition-colors">Corporate Bulk</Link>
                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] flex items-center gap-2 transition-colors">Wishlist {wishlistItemsCount > 0 && <span className="bg-[#d4af37] text-[#0F172A] text-xs px-2 py-0.5 rounded-full font-bold">{wishlistItemsCount}</span>}</Link>
                <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] transition-colors">About Us</Link>
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] transition-colors">Contact</Link>
                <Link to={user ? (profile?.role === 'admin' ? '/admin' : '/account') : '/account/login'} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] pt-4 border-t border-slate-100 transition-colors">
                  {user ? (profile?.role === 'admin' ? 'Admin Dashboard' : 'My Account') : 'Sign In / Register'}
                </Link>
              </nav>
            </div>
            <div className="p-6 border-t border-slate-100 flex flex-col gap-4 bg-slate-50/50">
              <a href={`https://wa.me/${cleanNumber}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full text-sm font-bold border-2 border-[#25D366] text-[#25D366] px-5 py-3 rounded-xl hover:bg-[#25D366] hover:text-white transition-all">
                <MessageCircle className="w-5 h-5" /> WhatsApp Support
              </a>
              <Link to="/corporate" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center text-[#0F172A] bg-[#d4af37] border-2 border-[#d4af37] hover:bg-[#F4C542] hover:border-[#F4C542] py-3 rounded-xl font-bold transition-all shadow-sm">
                Get Custom Quote
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 shrink-0">
          <span className={`font-serif font-bold text-2xl tracking-widest uppercase ${scrolled || !isHome ? 'text-[#0F172A]' : 'text-white'}`}>
            Aureva
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={`hidden md:flex items-center gap-8 text-sm font-medium ${scrolled || !isHome ? 'text-slate-600' : 'text-white/90'}`}>
          <Link to="/" className={`transition-colors hover:text-[#d4af37] ${location.pathname === '/' ? 'text-[#d4af37]' : ''}`}>Home</Link>
          <div className="group relative">
            <Link to="/shop" className={`transition-colors hover:text-[#d4af37] flex items-center gap-1 ${location.pathname.includes('/shop') ? 'text-[#d4af37]' : ''}`}> Shop </Link>
            {/* Simple Mega Menu Hover */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
               <div className="w-[600px] bg-white rounded-xl shadow-2xl border border-slate-100 p-8 grid grid-cols-3 gap-6 text-slate-800">
                  <div>
                     <h4 className="font-bold text-[#d4af37] mb-4 uppercase tracking-widest text-xs">Categories</h4>
                     <ul className="space-y-3 text-sm">
                       <li><Link to="/shop?category=drinkware" className="hover:text-[#d4af37] transition-colors">Premium Drinkware</Link></li>
                       <li><Link to="/shop?category=office" className="hover:text-[#d4af37] transition-colors">Office Essentials</Link></li>
                       <li><Link to="/shop?category=tech" className="hover:text-[#d4af37] transition-colors">Tech Gifts</Link></li>
                       <li><Link to="/shop?category=eco" className="hover:text-[#d4af37] transition-colors">Eco-Friendly Gifts</Link></li>
                     </ul>
                  </div>
                  <div>
                     <h4 className="font-bold text-[#d4af37] mb-4 uppercase tracking-widest text-xs">Collections</h4>
                     <ul className="space-y-3 text-sm">
                       <li><Link to="/shop" className="hover:text-[#d4af37] transition-colors">Diwali Hampers</Link></li>
                       <li><Link to="/shop" className="hover:text-[#d4af37] transition-colors">New Year Kits</Link></li>
                       <li><Link to="/shop" className="hover:text-[#d4af37] transition-colors">Welcome Kits</Link></li>
                       <li><Link to="/shop" className="hover:text-[#d4af37] transition-colors">Executive Premium</Link></li>
                     </ul>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg flex flex-col justify-end relative overflow-hidden">
                     <span className="relative z-10 text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-2">New Arrival</span>
                     <span className="relative z-10 font-serif font-bold text-lg mb-2">The Executive Box</span>
                     <Link to="/shop" className="relative z-10 text-xs font-bold underline hover:text-[#d4af37]">Shop Now</Link>
                  </div>
               </div>
            </div>
          </div>
          <Link to="/corporate" className="transition-colors hover:text-[#d4af37]">Corporate Bulk</Link>
          <Link to="/about" className="transition-colors hover:text-[#d4af37]">About Us</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          <a href={`https://wa.me/${cleanNumber}`} target="_blank" rel="noreferrer" className="hidden lg:flex items-center gap-2 text-sm font-bold border border-current px-4 py-2 rounded-full hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all">
             <MessageCircle className="w-4 h-4" /> WhatsApp Us
          </a>

          <Link to="/corporate" className="hidden xl:flex items-center gap-2 text-sm font-bold bg-[#d4af37] text-[#0F172A] px-5 py-2 rounded-full hover:bg-[#F4C542] transition-colors shadow-sm cursor-pointer">
             Bulk Inquiry
          </Link>

          <div className="w-px h-6 bg-current opacity-20 hidden md:block mx-2"></div>

          {user ? (
            profile?.role === 'admin' ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="border-current hover:bg-[#d4af37] hover:text-[#0F172A] hover:border-[#d4af37]">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:text-red-500">
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/account">
                <button className="p-2 transition-colors hover:text-[#d4af37]">
                  <User className="h-5 w-5" />
                </button>
              </Link>
            )
          ) : (
            <Link to="/account/login">
              <button className="p-2 transition-colors hover:text-[#d4af37]">
                <User className="h-5 w-5" />
              </button>
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link to="/admin" className="md:hidden p-2 transition-colors hover:text-[#d4af37]">
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link to="/wishlist" className="hidden sm:flex relative p-2 transition-colors hover:text-[#d4af37]">
            <Heart className="h-5 w-5" />
            {wishlistItemsCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[#d4af37] text-[10px] font-bold text-[#0F172A] flex items-center justify-center">
                {wishlistItemsCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative p-2 transition-colors hover:text-[#d4af37]">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[#d4af37] text-[10px] font-bold text-[#0F172A] flex items-center justify-center">
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
