import React, { useState } from 'react';
import { Button, buttonVariants } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Briefcase, Building2, CheckCircle2, Handshake, Mail, MessageSquare } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

export default function CorporateBulkPage() {
  const [loading, setLoading] = useState(false);
  const { settings } = useSettingsStore();

  const whatsappNumber = settings?.adminWhatsApp || '919825622421';
  const cleanNumber = String(whatsappNumber).replace(/[^0-9]/g, '');
  const salesEmail = settings?.salesEmail || 'aurevagifts@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const form = e.target as HTMLFormElement;
      const data = {
        firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
        lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
        company: (form.elements.namedItem('company') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
        quantity: (form.elements.namedItem('quantity') as HTMLInputElement).value,
        budget: (form.elements.namedItem('budget') as HTMLInputElement).value,
        message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
        status: 'new',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'inquiries'), data);

      toast.success("Inquiry Submitted successfully!", {
        description: "Our corporate gifting expert will contact you within 24 hours."
      });
      form.reset();
    } catch (error) {
       console.error("Error submitting inquiry", error);
       toast.error("Failed to submit inquiry. Please try again or contact us directly via WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Premium Hero Section */}
      <div className="bg-zinc-950 text-white relative py-24 md:py-32 overflow-hidden border-b border-amber-500/20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=2640" 
            alt="Corporate Meeting" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
        </div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <span className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-4 block">B2B Solutions</span>
            <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6 text-white leading-tight">
              Corporate & <br/><span className="text-zinc-400 italic">Bulk Gifting</span>
            </h1>
            <p className="text-zinc-300 text-lg md:text-xl font-light leading-relaxed">
              Elevate your corporate relationships with bespoke gifting solutions. From onboarding kits to festive hampers, leave a lasting impression that reflects your brand's excellence.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 max-w-7xl -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Information Side (Left) */}
          <div className="lg:col-span-5 space-y-12 lg:pt-16">
            <div className="bg-white rounded-2xl p-8 border border-zinc-200 shadow-sm">
               <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-6 flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-amber-500" />
                  Why Choose Aureva?
               </h3>
               <ul className="space-y-5">
                 {[
                   { title: "End-to-End Fulfilment", desc: "We manage sourcing, branding, packing, and direct shipping to recipients." },
                   { title: "Custom Brand Integration", desc: "Your logo flawlessly embossed, printed, or engraved on premium products." },
                   { title: "Discounted Bulk Pricing", desc: "Exclusive B2B pricing tiers for large-scale orders." },
                   { title: "Dedicated Account Manager", desc: "A single point of contact for seamless execution." },
                   { title: "GST Input Credit", desc: "100% compliant B2B tax invoices provided for accounting." }
                 ].map((feature, idx) => (
                   <li key={idx} className="flex gap-4 items-start">
                     <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                       <CheckCircle2 className="h-4 w-4 text-green-600" />
                     </div>
                     <div>
                        <span className="font-bold text-zinc-900 block">{feature.title}</span>
                        <span className="text-sm text-zinc-500">{feature.desc}</span>
                     </div>
                   </li>
                 ))}
               </ul>
            </div>
            
            <div className="bg-zinc-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Building2 className="w-32 h-32" />
              </div>
              <h3 className="font-serif font-bold text-2xl mb-3 text-amber-400 relative z-10">Direct Connect</h3>
              <p className="text-zinc-400 mb-6 relative z-10 text-sm">Have urgent requirements? Reach out to our corporate sales team directly.</p>
              <div className="flex flex-col gap-4 relative z-10">
                <a href={`mailto:${salesEmail}`} className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-xl flex items-center gap-3 transition-colors text-sm font-medium border border-zinc-700">
                  <Mail className="w-5 h-5 text-amber-500" /> {salesEmail}
                </a>
                <a href={`https://wa.me/${cleanNumber}`} target="_blank" rel="noreferrer" className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 py-3 px-4 rounded-xl flex items-center gap-3 transition-colors text-sm font-medium">
                  <MessageSquare className="w-5 h-5" /> WhatsApp Business Support
                </a>
              </div>
            </div>
          </div>

          {/* Inquiry Form (Right) */}
          <div className="lg:col-span-7">
            <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white">
              <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-8 px-8 pt-10">
                <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                   <Handshake className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle className="text-3xl font-serif font-bold text-zinc-900">Request a Custom Quote</CardTitle>
                <CardDescription className="text-base text-zinc-500 mt-2">Fill out the form below. A dedicated corporate manager will get back to you within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label htmlFor="firstName" className="text-zinc-700 font-medium">First Name <span className="text-red-500">*</span></Label>
                      <Input id="firstName" name="firstName" required placeholder="Jane" className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500" />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="lastName" className="text-zinc-700 font-medium">Last Name <span className="text-red-500">*</span></Label>
                      <Input id="lastName" name="lastName" required placeholder="Doe" className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="company" className="text-zinc-700 font-medium">Company Name <span className="text-red-500">*</span></Label>
                    <Input id="company" name="company" required placeholder="Acme Corporation Ltd." className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label htmlFor="email" className="text-zinc-700 font-medium">Work Email <span className="text-red-500">*</span></Label>
                      <Input id="email" name="email" type="email" required placeholder="jane@company.com" className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500" />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="phone" className="text-zinc-700 font-medium">Phone Number <span className="text-red-500">*</span></Label>
                      <Input id="phone" name="phone" required placeholder="+91 9876543210" className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label htmlFor="quantity" className="text-zinc-700 font-medium">Estimated Quantity <span className="text-red-500">*</span></Label>
                      <Input id="quantity" name="quantity" type="number" required placeholder="50" min="10" className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500" />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="budget" className="text-zinc-700 font-medium">Budget per Gift (₹)</Label>
                      <Input id="budget" name="budget" type="number" placeholder="2500" className="h-12 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="message" className="text-zinc-700 font-medium">Event Details / Specific Requirements</Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      placeholder="Tell us about the occasion, preferred delivery dates, and any specific products you have in mind..." 
                      className="h-32 resize-none bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500 text-base"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full text-lg font-bold h-14 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl mt-4" disabled={loading}>
                    {loading ? (
                       <div className="flex items-center gap-2">
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Submitting...
                       </div>
                    ) : "Submit Inquiry"}
                  </Button>
                  <p className="text-xs text-center text-zinc-400 font-medium pt-2">By submitting this form, you agree to our privacy policy. Your data is secure.</p>
                </form>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
}
