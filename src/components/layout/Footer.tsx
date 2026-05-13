import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container px-4 py-12 md:py-16 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          <div className="space-y-4">
            <span className="font-sans font-bold text-2xl tracking-tighter uppercase text-primary">
              Aureva
            </span>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed max-w-xs">
              Premium Gifts for Lasting Business Impressions. We specialize in luxury corporate gifting that elevates your brand and nurtures key relationships.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-primary">Quick Links</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/shop" className="hover:text-primary transition-colors">Shop All</Link></li>
              <li><Link to="/corporate" className="hover:text-primary transition-colors">Corporate Orders</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">Our Story</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/track" className="hover:text-primary transition-colors">Track Order</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-primary">Legal</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link to="/cancellation" className="hover:text-primary transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-primary">Contact</h4>
            <ul className="space-y-3 text-sm text-secondary-foreground/80">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>Ahmedabad, Gujarat<br/>380058, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+91 9825622421</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>aurevagifts@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-secondary-foreground/10 flex flex-col md:flex-row items-center justify-between text-xs text-secondary-foreground/60">
          <p>© {new Date().getFullYear()} Aureva Corporate Gifting. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>GST Registered</span>
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
