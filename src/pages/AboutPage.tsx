import React from 'react';
import { buttonVariants } from '../components/ui/button';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-24 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-sans tracking-tight mb-6 text-primary">Our Story</h1>
          <p className="text-lg md:text-xl text-secondary-foreground/80 max-w-2xl mx-auto">
            Aureva was founded on a simple principle: corporate gifting should be as meaningful and sophisticated as the relationships it celebrates.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-sans">Elevating Business Relationships</h2>
              <p className="text-muted-foreground leading-relaxed">
                We understand that in the corporate world, every interaction matters. A thoughtfully chosen gift is more than just an item; it's a statement of appreciation, a reflection of your brand's values, and a bridge to stronger connections.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                At Aureva, we curate premium, meticulously crafted gifts that leave a lasting impression. From artisanal hampers to high-end tech accessories, our collections are designed to impress.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-video md:aspect-square bg-muted shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
                alt="Corporate Meeting" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl font-bold mb-16">Why Choose Aureva</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary">01</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Premium Quality</h3>
              <p className="text-muted-foreground">Every item in our collection goes through strict quality checks to ensure luxury and durability.</p>
            </div>
            <div>
              <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary">02</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Bespoke Curation</h3>
              <p className="text-muted-foreground">We offer tailored solutions, allowing you to curate gifts that perfectly align with your brand identity.</p>
            </div>
            <div>
              <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary">03</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Seamless Logistics</h3>
              <p className="text-muted-foreground">From packaging to doorstep delivery across India, we handle the entire process effortlessly.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 text-center">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Experience Aureva?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Leave a lasting impression on your clients and employees with our premium gifting collections.</p>
          <div className="flex justify-center gap-4">
            <Link to="/shop" className={buttonVariants({ size: "lg" })}>
              Shop Now
            </Link>
            <Link to="/corporate" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Corporate Inquiry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
