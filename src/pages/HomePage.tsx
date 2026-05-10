import React from 'react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden bg-secondary">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80" alt="Luxury Gift Box" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container text-center px-4 md:px-8 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl font-sans font-bold text-primary mb-6 tracking-tight"
          >
            Premium Gifts for Lasting Business Impressions
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-secondary-foreground/80 mb-10 max-w-2xl mx-auto"
          >
            Elevate your corporate relationships with bespoke, luxury gifting solutions tailored for your esteem clients and high-performing teams.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/shop" className="w-full sm:w-auto">
              <Button size="lg" className="w-full font-medium text-primary-foreground text-lg px-8 py-6">
                Shop Collections
              </Button>
            </Link>
            <Link to="/corporate" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full font-medium text-lg px-8 py-6 bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Corporate Orders
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-sans tracking-tight">Curated Excellence</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-16 text-lg">
            Discover our handpicked selections designed to express gratitude and sophistication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Executive Hampers", desc: "Premium assortments for key stakeholders", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800" },
              { title: "Tech Accessories", desc: "Modern utility wrapped in luxury", img: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800" },
              { title: "Wellness Focus", desc: "Mindful gifting for your team's well-being", img: "https://images.unsplash.com/photo-1608248593842-8021c6a1d821?auto=format&fit=crop&q=80&w=800" }
            ].map((collection, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="group relative h-96 overflow-hidden rounded-2xl cursor-pointer"
              >
                <img src={collection.img} alt={collection.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">{collection.title}</h3>
                  <p className="text-white/80">{collection.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Bulk Order Banner */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="container px-4 md:px-8 max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Planning for the Holidays or an Event?</h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-3xl mx-auto">
            Partner with Aureva for your large-scale gifting needs. From custom branding with your logo to personalized notes and dedicated account management.
          </p>
          <Link to="/corporate">
            <Button size="lg" variant="secondary" className="font-bold text-lg px-10 py-6 text-primary hover:bg-white">
              Get a Custom Quote
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
