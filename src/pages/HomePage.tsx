import React from 'react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Gift, Star, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80" 
            alt="Luxury Gift Box" 
            className="w-full h-full object-cover opacity-40 scale-105 transform transition-transform duration-[20s] hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container text-center px-4 md:px-8 max-w-5xl">
          <motion.div
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-6 uppercase tracking-widest"
          >
            Welcome to Aureva
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-sans font-bold text-white mb-6 tracking-tighter"
          >
            The Art of <span className="text-primary italic">Gifting</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-2xl text-white/80 mb-10 max-w-3xl mx-auto font-light"
          >
            Elevate your corporate relationships with bespoke, luxury gifting solutions tailored for your esteemed clients and high-performing teams.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/shop" className="w-full sm:w-auto">
              <Button size="lg" className="w-full font-bold text-primary-foreground text-lg px-8 py-6 rounded-full shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] transition-all">
                Explore Collections
              </Button>
            </Link>
            <Link to="/corporate" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full font-bold text-lg px-8 py-6 rounded-full bg-transparent border-white/30 text-white hover:bg-white hover:text-black transition-all">
                Bulk / Corporate Events
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="font-medium text-sm md:text-base">Premium Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              <span className="font-medium text-sm md:text-base">Pan-India Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              <span className="font-medium text-sm md:text-base">Custom Branding</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 font-sans tracking-tight">Curated Excellence</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl">
              Discover our handpicked selections designed to express gratitude and ultimate sophistication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Executive Hampers", desc: "Premium assortments for key stakeholders", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800" },
              { title: "Tech Accessories", desc: "Modern utility wrapped in luxury", img: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800" },
              { title: "Wellness Focus", desc: "Mindful gifting for your team's well-being", img: "https://images.unsplash.com/photo-1608248593842-8021c6a1d821?auto=format&fit=crop&q=80&w=800" }
            ].map((collection, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="group relative h-[400px] overflow-hidden rounded-3xl cursor-pointer shadow-xl"
              >
                <img src={collection.img} alt={collection.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 text-left transition-opacity duration-300">
                  <h3 className="text-3xl font-bold text-white mb-2">{collection.title}</h3>
                  <p className="text-white/80 font-medium transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">{collection.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works (Corporate) */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">The Corporate Process</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Seamless gifting from inquiry to delivery.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Consultation", desc: "Share your requirements and vision with our experts." },
              { step: "02", title: "Curation", desc: "We handpick items that align with your brand identity." },
              { step: "03", title: "Branding", desc: "Customizing gifts with your logo and unique message." },
              { step: "04", title: "Delivery", desc: "Secure and timely dispatch to multiple locations." },
            ].map((item, id) => (
              <div key={id} className="bg-card p-8 rounded-3xl border shadow-sm relative overflow-hidden group hover:border-primary transition-colors">
                <div className="text-6xl font-bold text-primary/10 absolute -top-4 -right-2 group-hover:text-primary/20 transition-colors">{item.step}</div>
                <h3 className="text-xl font-bold mb-3 mt-4 relative z-10">{item.title}</h3>
                <p className="text-muted-foreground relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Bulk Order Banner */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white justify-center items-center"></div>
        <div className="container px-4 md:px-8 max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Planning for the Holidays?</h2>
          <p className="text-xl text-primary-foreground/90 mb-10 max-w-3xl mx-auto">
            Partner with Aureva for your large-scale gifting needs. From custom branding with your logo to personalized notes and dedicated account management.
          </p>
          <Link to="/corporate">
            <Button size="lg" variant="secondary" className="font-bold text-lg px-10 py-6 text-primary hover:bg-white rounded-full shadow-2xl hover:scale-105 transition-transform">
              Get a Custom Quote
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
