import React, { useState } from 'react';
import { Button, buttonVariants } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

export default function CorporateBulkPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success("Inquiry Submitted successfully!", {
        description: "Our corporate gifting expert will contact you shortly."
      });
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-16 md:px-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        
        {/* Banner Data */}
        <div className="space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold font-sans tracking-tight text-primary">Corporate & Bulk Gifting</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Whether it's client appreciation, employee onboarding, festive holidays, or milestone celebrations, Aureva offers customized premium gifting solutions tailored to your unique brand requirements.
          </p>
          
          <ul className="space-y-4">
            {[
              "End-to-End Fulfilment",
              "Custom Brand Integration (Logos, Notes, Packaging)",
              "Discounted Bulk Pricing",
              "Dedicated Account Manager",
              "GST Invoices Provided"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium">{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="bg-muted p-6 rounded-xl border border-border">
            <h3 className="font-bold text-lg mb-2">Prefer to talk directly?</h3>
            <p className="text-muted-foreground mb-4">Reach out to our corporate sales team on WhatsApp or Email.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:aurevagifts@gmail.com" className={buttonVariants({ variant: "outline", className: "gap-2" })}>
                Email Us
              </a>
              <a href="https://wa.me/919825622421" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", className: "gap-2" })}>
                WhatsApp (+91 9825622421)
              </a>
            </div>
          </div>
        </div>

        {/* Inquiry Form */}
        <div>
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
              <CardTitle className="text-2xl">Request a Custom Quote</CardTitle>
              <CardDescription>Fill out the form below and we'll get back to you within 24 hours.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required placeholder="Jane" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" required placeholder="Acme Corp" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input id="email" type="email" required placeholder="jane@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" required placeholder="+91 9876543210" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Estimated Quantity</Label>
                    <Input id="quantity" type="number" required placeholder="50" min="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget per Gift (₹)</Label>
                    <Input id="budget" type="number" placeholder="2500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Event Details / Specific Requirements</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about the occasion, preferred delivery dates, and any specific products you have in mind..." 
                    className="h-32 resize-none"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full text-lg font-bold mt-4" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Inquiry"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Your details are secure. We do not spam.</p>
              </form>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
