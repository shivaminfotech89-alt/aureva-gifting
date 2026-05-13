import React from 'react';
import { buttonVariants } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Gift } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-full bg-zinc-50 min-h-screen">
      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-zinc-950/80 mix-blend-multiply z-10" />
          <img 
            src="https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?auto=format&fit=crop&q=80&w=2640" 
            alt="Premium Gifts" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="container max-w-5xl mx-auto px-4 relative z-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-6 block">Our Legacy</span>
          <h1 className="text-5xl md:text-7xl font-bold font-serif mb-8 text-white leading-tight">
            The Art of <br />
            <span className="text-amber-400 italic">Corporate Gifting</span>
          </h1>
          <p className="text-lg md:text-2xl text-zinc-300 max-w-3xl mx-auto font-light leading-relaxed">
            Aureva was founded on a simple principle: corporate gifting should be as meaningful and sophisticated as the relationships it celebrates.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-white relative z-30 -mt-8 rounded-t-[3rem] shadow-xl">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl font-bold font-serif leading-tight text-zinc-900">
                Elevating Business <br className="hidden md:block"/>
                <span className="text-amber-600">Relationships</span>
              </h2>
              <div className="w-20 h-1 bg-amber-500 rounded-full" />
              <p className="text-zinc-600 leading-relaxed text-lg">
                We understand that in the corporate world, every interaction matters. A thoughtfully chosen gift is more than just an item; it's a statement of appreciation, a reflection of your brand's values, and a bridge to stronger connections.
              </p>
              <p className="text-zinc-600 leading-relaxed text-lg">
                At Aureva, we curate premium, meticulously crafted gifts that leave a lasting impression. From artisanal hampers to high-end tech accessories, our collections are designed to impress the most discerning clients and reward your highest-performing teams.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                 <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex flex-col items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Star className="w-5 h-5" /></div>
                    <h4 className="text-xl font-bold text-zinc-900">Brand Mission</h4>
                    <p className="text-sm font-medium text-zinc-600 leading-relaxed">To elevate corporate relationships through thoughtful, high-quality gifting experiences.</p>
                 </div>
                 <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex flex-col items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Shield className="w-5 h-5" /></div>
                    <h4 className="text-xl font-bold text-zinc-900">Company Vision</h4>
                    <p className="text-sm font-medium text-zinc-600 leading-relaxed">To become the most trusted partner for bespoke corporate branding and premium gifting.</p>
                 </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/10 rounded-3xl transform translate-x-6 translate-y-6" />
                <div className="rounded-3xl overflow-hidden aspect-[4/5] bg-zinc-100 shadow-2xl relative z-10 border border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" 
                    alt="Corporate Meeting" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 bg-zinc-950 text-white border-y border-zinc-800">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-white">Why Choose Aureva</h2>
            <p className="text-zinc-400 text-lg">We deliver excellence at every step of the gifting journey.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            <div className="text-center group">
              <div className="h-20 w-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-amber-500 group-hover:border-amber-400 transition-all duration-300 shadow-xl">
                <Star className="w-8 h-8 text-amber-500 group-hover:text-zinc-950 transition-colors" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-4 text-white">Premium Quality</h3>
              <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">Every item in our collection goes through strict quality checks to ensure luxury and durability. We partner with the finest brands.</p>
            </div>
            <div className="text-center group">
              <div className="h-20 w-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-amber-500 group-hover:border-amber-400 transition-all duration-300 shadow-xl">
                <Gift className="w-8 h-8 text-amber-500 group-hover:text-zinc-950 transition-colors" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-4 text-white">Bespoke Curation</h3>
              <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">We offer tailored solutions, allowing you to curate gifts that perfectly align with your brand identity, down to the ribbon.</p>
            </div>
            <div className="text-center group">
              <div className="h-20 w-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-amber-500 group-hover:border-amber-400 transition-all duration-300 shadow-xl">
                <Shield className="w-8 h-8 text-amber-500 group-hover:text-zinc-950 transition-colors" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-4 text-white">Seamless Logistics</h3>
              <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">From multi-point packaging to white-glove doorstep delivery across India, we handle the entire process effortlessly.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-zinc-50 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 text-zinc-900">Ready to Experience Aureva?</h2>
          <p className="text-zinc-600 mb-12 text-xl font-light leading-relaxed">Leave a lasting impression on your clients and employees with our premium gifting collections tailored for modern enterprises.</p>
          <div className="flex justify-center gap-6">
            <Link to="/shop" className={buttonVariants({ size: "lg", className: "h-14 px-8 text-lg rounded-xl shadow-xl hover:shadow-amber-500/25 transition-all bg-amber-500 hover:bg-amber-600 text-white" })}>
              Explore Collections <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link to="/corporate" className={buttonVariants({ size: "lg", variant: "outline", className: "h-14 px-8 text-lg rounded-xl border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-all" })}>
              Corporate Inquiry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
