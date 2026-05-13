import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Gift, Star, Clock, ChevronRight, MessageCircle, Heart, ChevronLeft, Check, TrendingUp, Users, Building, Mail } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductCard, ProductData } from '../components/shop/ProductCard';

export interface BannerData {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  enabled: boolean;
  order: number;
}

const GoldGradientText = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <span className={`bg-gradient-to-r from-[#d4af37] via-[#f9e596] to-[#b5952f] bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

export default function HomePage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<ProductData[]>([]);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [collectionsData, setCollectionsData] = useState<any[]>([]);
  const [brandingSection, setBrandingSection] = useState<any>(null);

  useEffect(() => {
    // Fetch active banners
    const qBanners = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const unsubBanners = onSnapshot(qBanners, (snapshot) => {
      const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BannerData)).filter(b => b.enabled !== false);
      if (b.length > 0) {
        setBanners(b);
      } else {
        setBanners([
           { id: 'f1', title: 'The Art of Corporate Gifting', subtitle: 'Elevate your business relationships with our bespoke luxury gifting solutions.', ctaText: 'Explore Collections', ctaLink: '/shop', imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80', enabled: true, order: 0 },
           { id: 'f2', title: 'Curated Festival Hampers', subtitle: 'Spread joy this festive season with our exclusive premium hampers designed for enterprises.', ctaText: 'Shop Festive', ctaLink: '/shop', imageUrl: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80', enabled: true, order: 1 }
        ]);
      }
    });

    // Fetch featured products
    const qProducts = query(
      collection(db, 'products'),
      where('enabled', '==', true),
      limit(4)
    );
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductData)).filter(p => p.enabled);
      if(p.length > 0) {
        setFeaturedProducts(p);
      } else {
         setFeaturedProducts([
          { id: 'sample-1', name: 'Executive Leather Briefcase', description: 'Premium full-grain leather briefcase perfect for executives.', basePrice: 12500, gstPercent: 18, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'], stock: 50, enabled: true },
          { id: 'sample-2', name: 'Luxury Pen Set', description: 'Gold-plated fountain pen with custom engraving options.', basePrice: 4500, gstPercent: 18, images: ['https://images.unsplash.com/photo-1585336261022-680e294ce8b9?auto=format&fit=crop&q=80&w=600'], stock: 100, enabled: true },
          { id: 'sample-4', name: 'Premium Coffee Blend & Mug', description: 'Artisan roasted coffee beans with an insulated ceramic mug.', basePrice: 2800, gstPercent: 18, images: ['https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&q=80&w=600'], stock: 150, enabled: true },
          { id: 'sample-5', name: 'Smart Desk Organizer', description: 'Minimalist wooden organizer with built-in wireless charging.', basePrice: 6500, gstPercent: 18, images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600'], stock: 75, enabled: true }
         ]);
      }
    });

    // Categories
    const unsubCats = onSnapshot(query(collection(db, 'homepageCategories'), orderBy('order', 'asc')), (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (c.length > 0) { setCategories(c); }
      else {
         setCategories([
           { name: "Executive Drinkware", url: "https://images.unsplash.com/photo-1517260739337-6799d239ce83?auto=format&fit=crop&q=80" },
           { name: "Office Essentials", url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80" },
           { name: "Tech Gadgets", url: "https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80" },
           { name: "Eco-friendly", url: "https://images.unsplash.com/photo-1536766768582-1dd38f32acab?auto=format&fit=crop&q=80" }
         ]);
      }
    });

    // Festival Collections
    const unsubCols = onSnapshot(query(collection(db, 'homepageCollections'), orderBy('order', 'asc')), (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (c.length > 0) { setCollectionsData(c); }
      else {
         setCollectionsData([
          { title: "Diwali Hampers", sub: "Premium Dry Fruits & Essentials", img: "https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80&w=800" },
          { title: "New Year Kits", sub: "Planners, Pens & Tech", img: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800" },
          { title: "Welcome Kits", sub: "Onboarding Essentials", img: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=800" }
         ]);
      }
    });

    // Branding Image
    const unsubBranding = onSnapshot(doc(db, 'settings', 'brandingImage'), (docSnap) => {
       if (docSnap.exists() && docSnap.data().imageUrl) {
          setBrandingSection(docSnap.data());
       } else {
          setBrandingSection({ imageUrl: "https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200" });
       }
    });

    return () => { unsubBanners(); unsubProducts(); unsubCats(); unsubCols(); unsubBranding(); };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="w-full bg-background overflow-hidden selection:bg-primary/20">
      
      {/* 1. Dynamic Hero Slider - Premium Luxury Look */}
      <section className="relative w-full h-[85vh] md:h-[95vh] flex items-center justify-center overflow-hidden bg-zinc-950">
        <AnimatePresence mode="wait">
          {banners.map((banner, index) => index === currentSlide && (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 z-0"
            >
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const fallback = "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80";
                    if (target.src !== fallback) target.src = fallback;
                  }}
                  loading="lazy"
                />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent"></div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div className="relative z-10 container px-4 xl:px-8 max-w-[90rem] mx-auto flex flex-col justify-center h-full">
          {banners.length > 0 && (
            <div className="max-w-3xl lg:max-w-4xl mt-20">
               <motion.div
                 key={`badge-${currentSlide}`}
                 initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                 animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                 transition={{ duration: 0.8, ease: "easeOut" }}
                 className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/90 text-sm font-medium mb-8 tracking-[0.2em] uppercase shadow-2xl"
               >
                 <SparklesIcon className="w-4 h-4 text-[#d4af37]" /> AUREVA Enterprise
               </motion.div>
               
               <motion.h1 
                 key={`title-${currentSlide}`}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                 className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif font-bold text-white mb-6 tracking-tight leading-[1.05]"
               >
                 {banners[currentSlide].title.split(' ').map((word, i) => (
                    i % 3 === 0 && i > 0 ? <GoldGradientText key={i}>{word} </GoldGradientText> : <span key={i}>{word} </span>
                 ))}
               </motion.h1>
               
               <motion.p 
                 key={`sub-${currentSlide}`}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                 className="text-xl md:text-2xl text-white/70 mb-12 font-light max-w-2xl leading-relaxed"
               >
                 {banners[currentSlide].subtitle}
               </motion.p>
               
               <motion.div 
                 key={`btn-${currentSlide}`}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                 className="flex flex-col sm:flex-row gap-5"
               >
                 <Link to={banners[currentSlide].ctaLink} className="w-full sm:w-auto">
                   <Button size="lg" className="w-full font-bold tracking-wide text-lg px-12 py-7 rounded-sm bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:bg-[#f9e596] hover:text-slate-900 transition-all duration-300">
                     {banners[currentSlide].ctaText}
                   </Button>
                 </Link>
                 <Link to="/corporate" className="w-full sm:w-auto">
                   <button className="inline-flex items-center justify-center w-full sm:w-auto font-bold tracking-wide text-lg px-12 py-[1.1rem] rounded-sm bg-black/40 backdrop-blur-md border-2 border-[#d4af37] text-white hover:bg-[#d4af37] hover:text-slate-900 transition-all duration-300">
                     Request Quotation
                   </button>
                 </Link>
               </motion.div>
            </div>
          )}
        </div>

        {/* Carousel Indicators - Refined */}
        {banners.length > 1 && (
          <div className="absolute bottom-12 left-8 md:left-auto md:right-12 z-20 flex gap-4">
             {banners.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1 transition-all duration-500 ease-in-out ${idx === currentSlide ? 'bg-white w-12' : 'bg-white/30 hover:bg-white/50 w-6'}`}
                />
             ))}
          </div>
        )}
      </section>

      {/* Trust Badges - Monolithic Corporate */}
      <section className="bg-zinc-900 border-y border-white/5 relative z-20">
        <div className="container max-w-[90rem] mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-wrap justify-between gap-8 items-center text-white/80">
            {[
              { icon: ShieldCheck, text: "Premium Quality Guaranteed" },
              { icon: Truck, text: "Secure Pan-India Delivery" },
              { icon: Gift, text: "Bespoke Custom Branding" },
              { icon: Users, text: "Dedicated Account Manager" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <item.icon className="w-5 h-5 text-[#d4af37] group-hover:text-yellow-400 transition-colors" />
                <span className="font-medium text-sm md:text-base tracking-wide uppercase text-white/60 group-hover:text-white transition-colors">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Shop by Category */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="container max-w-[90rem] mx-auto px-4 md:px-8">
           <div className="text-center mb-16 md:mb-20">
              <span className="text-[#10B981] font-bold text-xs tracking-[0.2em] uppercase mb-4 block">Our Catalog</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#0F172A]">Shop by Category</h2>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
             {categories.map((cat, idx) => (
                <Link to="/shop" key={idx} className="group relative h-64 md:h-80 overflow-hidden rounded-[1.5rem]">
                  <img 
                    src={cat.url} 
                    alt={cat.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80";
                      if (target.src !== fallback) target.src = fallback;
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                     <h3 className="text-white font-bold text-lg md:text-xl font-serif">{cat.name}</h3>
                     {cat.description && (
                        <p className="text-white/70 text-xs md:text-sm mt-1 mb-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 line-clamp-2">{cat.description}</p>
                     )}
                     <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mt-2 flex items-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-100">
                        Explore <ChevronRight className="w-3 h-3 ml-1" />
                     </span>
                  </div>
                </Link>
             ))}
           </div>
        </div>
      </section>

      {/* 3. Festival Collections - Premium */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-[#0F172A]">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B6B]/10 to-[#FFB347]/10 opacity-30 mix-blend-color-dodge"></div>
        <div className="container max-w-[90rem] mx-auto px-4 md:px-8 relative z-10">
           <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-3xl">
                 <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-white mb-6">Festival <GoldGradientText>Collections</GoldGradientText></h2>
                 <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed">Exclusive curations designed to celebrate milestones, festivals, and the spirit of enterprise. Beautifully packaged and ready for your brand logo.</p>
              </div>
              <Link to="/shop">
                <Button className="rounded-sm border-2 border-transparent bg-[#d4af37] text-slate-900 hover:bg-[#F4C542] hover:text-slate-900 px-8 py-6 uppercase tracking-widest text-xs font-bold transition-all duration-300">
                  View All Collections
                </Button>
              </Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {collectionsData.map((collection, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="group relative h-[450px] md:h-[550px] overflow-hidden rounded-[2rem] bg-slate-900 cursor-pointer shadow-2xl"
              >
                <img 
                  src={collection.img} 
                  alt={collection.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const fallback = "https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80&w=800";
                    if (target.src !== fallback) target.src = fallback;
                  }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end">
                   <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-[#FFB347] font-bold tracking-widest uppercase text-xs mb-3">{collection.sub}</p>
                      <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">{collection.title}</h3>
                      {collection.description && (
                         <p className="text-white/80 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{collection.description}</p>
                      )}
                      <div className="h-1 w-0 group-hover:w-16 bg-[#d4af37] transition-all duration-500 mt-4"></div>
                   </div>
                </div>
              </motion.div>
            ))}
           </div>
        </div>
      </section>

      {/* 4. Featured Products */}
      <section className="py-24 md:py-32 bg-[#F8FAFC]">
        <div className="container max-w-[90rem] mx-auto px-4 md:px-8 text-center mb-16 md:mb-20">
            <span className="text-[#d4af37] text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Handpicked Selections</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#0F172A]">Featured Products</h2>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto">Discover our most sought-after corporate gifts, combining utility with premium aesthetics to leave a lasting impression.</p>
        </div>
        <div className="container max-w-[90rem] mx-auto px-4 md:px-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {featuredProducts.map((product, idx) => (
                 <motion.div 
                   key={product.id}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-100px" }}
                   transition={{ delay: idx * 0.1, duration: 0.6 }}
                 >
                    <ProductCard product={product} />
                 </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* 5. Product Customization Section */}
      <section className="py-0 relative overflow-hidden bg-[#0F172A]">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
           <div className="flex-1 relative order-2 lg:order-1">
              <img 
                src={brandingSection?.imageUrl || "https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200"} 
                alt="Corporate Branding" 
                className="w-full h-full object-cover min-h-[400px] lg:min-h-full" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallback = "https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200";
                  if (target.src !== fallback) target.src = fallback;
                }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-[#0F172A]/40 mix-blend-multiply"></div>
           </div>
           <div className="flex-1 p-10 md:p-20 lg:p-32 flex flex-col justify-center bg-[#0F172A] order-1 lg:order-2 border-l border-white/5 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 blur-3xl rounded-full"></div>
              <span className="text-[#d4af37] font-bold text-xs tracking-[0.2em] uppercase shadow-sm mb-6 block relative z-10">{brandingSection?.subTitle || 'Personalization Engine'}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white mb-8 relative z-10" dangerouslySetInnerHTML={{__html: brandingSection?.heading || 'Make it truly <span className="italic font-light text-[#d4af37]">yours.</span>'}}></h2>
              <p className="text-lg text-white/70 leading-relaxed mb-10 font-light max-w-xl relative z-10">
                 {brandingSection?.body || 'Upload your corporate logo during checkout and visualize exactly how your gifts will look. We offer state-of-the-art laser engraving, UV printing, and embossing on all premium items.'}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 relative z-10">
                 <div className="border border-white/10 p-6 bg-white/5 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <h4 className="text-white font-bold mb-2">1. Select Product</h4>
                    <p className="text-sm text-white/50">Choose from thousands of premium items.</p>
                 </div>
                 <div className="border border-white/10 p-6 bg-white/5 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <h4 className="text-white font-bold mb-2">2. Upload Logo</h4>
                    <p className="text-sm text-white/50">Preview your brand identity instantly.</p>
                 </div>
                 <div className="border border-white/10 p-6 bg-white/5 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <h4 className="text-white font-bold mb-2">3. Approve Mockup</h4>
                    <p className="text-sm text-white/50">Get a digital proof before production.</p>
                 </div>
                 <div className="border border-white/10 p-6 bg-white/5 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <h4 className="text-white font-bold mb-2">4. Dispatched</h4>
                    <p className="text-sm text-white/50">Fast, secure pan-India multi-location shipping.</p>
                 </div>
              </div>

              <div className="relative z-10">
                <Link to="/corporate">
                  <Button size="lg" className="rounded-sm px-10 py-7 text-sm font-bold tracking-widest uppercase bg-[#d4af37] text-slate-900 border-2 border-transparent hover:bg-transparent hover:border-[#d4af37] hover:text-[#d4af37] transition-all duration-300">
                     Learn More
                  </Button>
                </Link>
              </div>
           </div>
        </div>
      </section>



      {/* 6. Corporate Bulk Order CTA & Newsletter side-by-side */}
      <section className="py-24 bg-[#F8FAFC] text-slate-900 relative overflow-hidden border-t border-slate-200">
        <div className="container max-w-[90rem] mx-auto px-4 md:px-8 relative z-10">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
              
              {/* Bulk CTA */}
              <div className="space-y-8 bg-white p-10 md:p-14 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 blur-3xl rounded-full transition-transform duration-700 group-hover:scale-150"></div>
                 <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#0F172A] relative z-10">Enterprise Scale. <br/>Boutique Care.</h2>
                 <p className="text-xl text-slate-500 max-w-md leading-relaxed relative z-10">
                    Planning a large corporate event or employee wide gifting? Connect with our enterprise sales team for custom quotations and dedicated support.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 pt-4 relative z-10">
                    <a href="https://wa.me/919825622421" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                       <Button size="lg" className="w-full font-bold px-8 py-7 bg-white text-slate-900 border-2 border-slate-200 hover:border-[#10B981] hover:bg-slate-50 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-transform hover:-translate-y-1">
                          <MessageCircle className="w-5 h-5 text-[#10B981]" /> Chat on WhatsApp
                       </Button>
                    </a>
                    <Link to="/corporate" className="w-full sm:w-auto">
                       <button className="inline-flex items-center justify-center w-full sm:w-auto font-bold tracking-wide px-8 py-[1.1rem] border-2 border-transparent bg-[#0F172A] text-white hover:bg-[#d4af37] hover:text-[#0F172A] rounded-xl transition-all duration-300">
                          Request Quotation
                       </button>
                    </Link>
                 </div>
              </div>

              {/* Newsletter */}
              <div className="bg-[#0F172A] text-white p-10 md:p-14 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col justify-center group">
                 <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#d4af37]/20 blur-3xl rounded-full transition-transform duration-700 group-hover:scale-110"></div>
                 <div className="mb-8 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <Mail className="w-6 h-6 text-[#d4af37]" />
                       <h3 className="text-3xl font-serif font-bold">Stay Updated</h3>
                    </div>
                    <p className="text-white/70 max-w-sm text-lg">Subscribe to receive exclusive corporate gifting catalogs, festival updates, and special B2B pricing offers.</p>
                 </div>
                 <form className="flex flex-col sm:flex-row gap-3 relative z-10" onSubmit={(e) => { e.preventDefault(); alert("Subscribed successfully!"); }}>
                    <input 
                      type="email" 
                      placeholder="Enter your corporate email" 
                      className="flex-1 bg-white/5 border border-white/20 text-white px-5 py-4 placeholder:text-white/40 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl transition-colors"
                      required
                    />
                    <Button type="submit" size="lg" className="bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] px-8 py-7 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                       Subscribe
                    </Button>
                 </form>
                 <p className="text-xs text-white/40 mt-6 relative z-10">We respect your privacy. Unsubscribe at any time.</p>
              </div>

           </div>
        </div>
      </section>

    </div>
  );
}

// Sparkles icon for hero badge
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

