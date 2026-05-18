import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { MapPin, Phone, Mail, MessageSquare, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = e.target as HTMLFormElement;
      const data = {
        name: (form.elements.namedItem('name') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
        message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
        status: 'new',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'contacts'), data);
      
      toast.success("Message sent successfully!", { description: "We will get back to you shortly." });
      form.reset();
    } catch (error) {
      console.error("Error submitting contact form", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Premium Banner */}
      <div className="bg-zinc-950 text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2569&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <span className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-4 block">Get in Touch</span>
          <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6 leading-tight">
            Contact <span className="text-amber-400 italic">Aureva</span>
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto font-light leading-relaxed">
            We are here to help piece together the perfect gifting experience for your business. Let's start a conversation.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          
          {/* Contact Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col gap-8">
              <div className="flex items-start gap-5">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                  <MapPin className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-zinc-900 mb-1">Our Office</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">Ahmedabad, Gujarat<br/>380058, India</p>
                </div>
              </div>

              <div className="w-full h-[1px] bg-zinc-100" />

              <div className="flex items-start gap-5">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                  <Phone className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-zinc-900 mb-1">Phone</h3>
                  <a href="tel:+919825622421" className="text-zinc-500 hover:text-amber-600 transition-colors block text-sm mb-1">+91 9825622421</a>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 text-xs font-medium">Mon-Fri, 9am to 6pm</span>
                </div>
              </div>

              <div className="w-full h-[1px] bg-zinc-100" />

              <div className="flex items-start gap-5">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                  <Mail className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-zinc-900 mb-1">Email</h3>
                  <a href="mailto:aurevagifts@gmail.com" className="text-zinc-500 hover:text-amber-600 transition-colors block text-sm mb-1">aurevagifts@gmail.com</a>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">We reply within 24hrs</span>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-[#25D366] text-white p-8 rounded-3xl shadow-lg relative overflow-hidden group hover:shadow-[#25D366]/30 transition-all cursor-pointer" onClick={() => window.open('https://wa.me/919825622421', '_blank')}>
              <div className="absolute -right-6 -top-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <MessageSquare className="w-40 h-40" />
              </div>
              <h3 className="font-serif font-bold text-2xl mb-2 relative z-10">Chat with us</h3>
              <p className="text-[#25D366] text-white/90 mb-6 relative z-10 text-sm">Get instant support for bulk orders on WhatsApp.</p>
              <div className="inline-flex items-center gap-2 bg-white text-[#25D366] font-bold py-3 px-6 rounded-xl text-sm relative z-10">
                Open WhatsApp <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 p-8 md:p-12 h-full">
              <div className="mb-10 border-b border-zinc-100 pb-6">
                 <h2 className="text-3xl font-serif font-bold text-zinc-900">Send a Message</h2>
                 <p className="text-zinc-500 mt-2">Fill out the form below and our team will get back to you promptly.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-zinc-700 font-medium">Your Name <span className="text-red-500">*</span></Label>
                    <Input id="name" name="name" required placeholder="Jane Doe" className="h-14 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500 rounded-xl" />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-zinc-700 font-medium">Email Address <span className="text-red-500">*</span></Label>
                    <Input id="email" name="email" type="email" required placeholder="jane@company.com" className="h-14 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="subject" className="text-zinc-700 font-medium">Subject <span className="text-red-500">*</span></Label>
                  <Input id="subject" name="subject" required placeholder="What is this regarding?" className="h-14 bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500 rounded-xl" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="message" className="text-zinc-700 font-medium">Message <span className="text-red-500">*</span></Label>
                  <Textarea id="message" name="message" required placeholder="Please provide details about your inquiry..." className="min-h-[180px] resize-none bg-zinc-50 border-zinc-200 focus-visible:ring-amber-500 rounded-xl text-base p-4" />
                </div>
                <Button type="submit" size="lg" className="w-full md:w-auto h-14 px-10 text-lg font-bold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                       Sending...
                    </div>
                  ) : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
