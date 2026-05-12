import React, { useState } from 'react';
import { ShoppingCart, Menu, Search, User, X } from 'lucide-react';
import { Button, buttonVariants } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const totalItems = useCartStore(state => state.getTotalItems());
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 -ml-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-sans font-bold text-2xl tracking-tighter uppercase text-primary">
            Aureva
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="transition-colors hover:text-primary">Home</Link>
          <Link to="/shop" className="transition-colors hover:text-primary">Shop</Link>
          <Link to="/corporate" className="transition-colors hover:text-primary">Corporate Bulk</Link>
          <Link to="/about" className="transition-colors hover:text-primary">About Us</Link>
          <Link to="/contact" className="transition-colors hover:text-primary">Contact</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {user ? (
            profile?.role === 'admin' ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Dashboard
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/account">
                <button className="p-2 text-foreground hover:text-primary transition-colors">
                  <User className="h-5 w-5" />
                </button>
              </Link>
            )
          ) : (
            <Link to="/account/login">
              <button className="p-2 text-foreground hover:text-primary transition-colors">
                <User className="h-5 w-5" />
              </button>
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link to="/admin" className="md:hidden p-2 text-foreground hover:text-primary transition-colors">
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link to="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9990] md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white dark:bg-[#09090b] shadow-2xl border-r border-border z-[9999] p-6 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-2xl tracking-tighter uppercase text-primary">
                  Aureva
                </span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-col gap-6 text-lg font-medium text-foreground">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary">Home</Link>
                <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary">Shop</Link>
                <Link to="/corporate" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary">Corporate Bulk</Link>
                <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary">About Us</Link>
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary">Contact</Link>
                <Link to={user ? (profile?.role === 'admin' ? '/admin' : '/account') : '/account/login'} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary">
                  {user ? (profile?.role === 'admin' ? 'Admin Dashboard' : 'My Account') : 'Sign In'}
                </Link>
              </nav>
              <div className="mt-auto pb-4">
                <Link to="/corporate" onClick={() => setIsMobileMenuOpen(false)} className={buttonVariants({ className: "w-full text-primary-foreground" })}>Get Custom Quote</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
