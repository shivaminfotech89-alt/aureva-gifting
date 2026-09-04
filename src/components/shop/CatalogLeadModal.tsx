import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Mail, Smartphone, Download, CheckCircle2, ChevronLeft, BookOpen, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AurevaLogo } from '../ui/AurevaLogo';
import { useAuthStore } from '../../store/authStore';

interface CatalogLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CatalogLeadModal({ isOpen, onClose }: CatalogLeadModalProps) {
  const [step, setStep] = useState<'type' | 'category' | 'auth_method' | 'email' | 'whatsapp' | 'generating' | 'success'>('type');
  const [loading, setLoading] = useState(false);
  const [catalogType, setCatalogType] = useState<'budget' | 'category'>('category');
  const [specificCategory, setSpecificCategory] = useState<string>('All');
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Form Data
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const { user, profile } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      async function loadProducts() {
        try {
          const q = query(collection(db, 'products'), where('enabled', '==', true));
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => doc.data() as any);
          setProducts(data);
          
          const uniqueCats = Array.from(new Set(data.map(p => p.categoryId || 'Uncategorized')));
          setCategories(uniqueCats.sort());
        } catch(e) {
          console.error("Failed to load products for catalog", e);
        }
      }
      loadProducts();
    }
  }, [isOpen]);

  const handleReset = () => {
    setStep('type');
    setName(profile?.name || '');
    setCompany(profile?.company || '');
    setEmail(user?.email || profile?.email || '');
    setPhone(profile?.phone || '');
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
       setName(profile?.name || '');
       setCompany(profile?.company || '');
       setEmail(user?.email || profile?.email || '');
       setPhone(user?.phoneNumber || profile?.phone || '');
    }
  }, [isOpen, user, profile]);

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleBack = () => {
    if (step === 'category') setStep('type');
    else if (step === 'auth_method') {
      if (catalogType === 'category') setStep('category');
      else setStep('type');
    }
    else if (step === 'email' || step === 'whatsapp') setStep('auth_method');
  };

  const submitLead = async (authType?: 'email' | 'whatsapp' | 'authenticated') => {
    if (authType !== 'authenticated') {
      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      
      if (authType === 'email' && !email.trim()) {
        toast.error("Please enter your email");
        return;
      }

      if (authType === 'whatsapp') {
        if (!phone.trim()) {
          toast.error("Please enter your mobile number");
          return;
        }
        if (phone.replace(/[^0-9]/g, '').length < 10) {
          toast.error("Please enter a valid mobile number");
          return;
        }
      }
    }

    const lastRequest = localStorage.getItem('lastCatalogRequest');
    if (lastRequest) {
      const timeDiff = Date.now() - parseInt(lastRequest);
      if (timeDiff < 30000) { 
        toast.error("Please wait a moment before requesting another catalog.");
        return;
      }
    }

    setStep('generating');
    try {
      const catalogName = catalogType === 'budget' ? 'MASTER BUDGET CATALOG' : 
        (specificCategory === 'All' ? 'MASTER CATEGORY CATALOG' : `${specificCategory.toUpperCase()} CATALOG`);

      const currentEmail = user?.email || email;
      const currentPhone = user?.phoneNumber || profile?.phone || phone;

      const leadData = {
        name: name || profile?.name || 'Authenticated User',
        company: company || profile?.company || 'Not Provided',
        email: currentEmail || '',
        phone: currentPhone || '',
        category: catalogName,
        method: user ? 'authenticated' : (authType || 'unknown'),
        createdAt: serverTimestamp(),
        status: 'new',
        userId: user?.uid || null
      };

      await addDoc(collection(db, 'catalogLeads'), leadData);
      localStorage.setItem('lastCatalogRequest', Date.now().toString());

      // Fetched only when someone actually asks for the catalog. This modal is
      // mounted on every page, so a static import put the whole PDF library
      // (~380 KB) into the first load for every visitor.
      const { generateCatalogPDF } = await import('../../lib/catalogGenerator');
      await generateCatalogPDF(products, "AUREVA Corporate Gifting", catalogType, specificCategory);

      setStep('success');
      toast.success("Catalog Downloaded Successfully!");
      
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate catalog. Please try again.");
      setStep(user ? 'type' : 'email'); // revert on error
    }
  };

  const handleSelection = (type: 'budget' | 'category', catSpec: string = 'All') => {
    setCatalogType(type);
    setSpecificCategory(catSpec);
    if (user) {
      // Direct download if authenticated over asking details
      submitLead('authenticated');
    } else {
      setStep('auth_method');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 p-0 overflow-hidden shadow-2xl rounded-2xl">
        <div className="bg-[#0a192f] p-6 text-center text-white relative">
          {step !== 'type' && step !== 'generating' && step !== 'success' && (
            <button 
              onClick={handleBack}
              className="absolute left-4 top-4 hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex justify-center mb-4">
            <AurevaLogo variant="light" className="scale-75 origin-center" />
          </div>
          <DialogTitle className="text-xl font-serif tracking-widest uppercase mt-2">
            Catalog Access
          </DialogTitle>
          <DialogDescription className="text-slate-300 mt-2 text-sm max-w-sm mx-auto">
            {user ? "Your details are verified. Select a catalog to download instantly." : "Select your preferred catalog style and enter details to download."}
          </DialogDescription>
        </div>

        <div className="p-6">
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-center text-slate-600 mb-6 font-medium text-sm">
                How would you like to browse our products?
              </p>
              
              <button 
                onClick={() => { setCatalogType('category'); setStep('category'); }}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-100 hover:border-[#d4af37] rounded-xl transition-all group hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#0a192f]/5 p-3 rounded-full group-hover:bg-[#d4af37]/10 transition-colors">
                    <Layers className="w-5 h-5 text-[#0a192f] group-hover:text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[#0a192f]">Category Wise Catalog</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Browse products organized by category type</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => { handleSelection('budget'); }}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-100 hover:border-[#d4af37] rounded-xl transition-all group hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#0a192f]/5 p-3 rounded-full group-hover:bg-[#d4af37]/10 transition-colors">
                    <BookOpen className="w-5 h-5 text-[#0a192f] group-hover:text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[#0a192f]">Budget Wise Master Catalog</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Master catalog organized by budget slabs</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 'category' && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              <p className="text-center text-slate-600 mb-4 font-medium text-sm">
                Select a specific category or download master catalog
              </p>
              
              <button 
                onClick={() => { handleSelection('category', 'All'); }}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-[#d4af37] hover:bg-slate-50 transition-colors font-bold text-[#0a192f]"
              >
                Master Category Catalog (All)
              </button>
              
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => { handleSelection('category', cat); }}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-[#d4af37] hover:bg-slate-50 transition-colors font-medium text-slate-700"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {step === 'auth_method' && !user && (
            <div className="space-y-4">
              <p className="text-center text-slate-600 mb-6 font-medium text-sm">
                Choose a verification method to access the catalog
              </p>
              
              <button 
                onClick={() => setStep('email')}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-100 hover:border-[#d4af37] rounded-xl transition-all group hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#0a192f]/5 p-3 rounded-full group-hover:bg-[#d4af37]/10 transition-colors">
                    <Mail className="w-5 h-5 text-[#0a192f] group-hover:text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[#0a192f]">Email Verification</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Receive copy to email</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setStep('whatsapp')}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-100 hover:border-[#25D366] rounded-xl transition-all group hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#0a192f]/5 p-3 rounded-full group-hover:bg-[#25D366]/10 transition-colors">
                    <Smartphone className="w-5 h-5 text-[#0a192f] group-hover:text-[#25D366]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[#0a192f]">WhatsApp Verification</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Quick access via mobile</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 'email' && !user && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name (Optional)</Label>
                <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Enter company name" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com" className="rounded-xl" />
              </div>
              <Button onClick={() => submitLead('email')} className="w-full h-12 bg-[#0a192f] hover:bg-[#0a192f]/90 text-white rounded-xl font-bold tracking-widest uppercase mt-4">
                Verify & Download
              </Button>
            </div>
          )}

          {step === 'whatsapp' && !user && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name (Optional)</Label>
                <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Enter company name" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Number *</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="rounded-xl" />
              </div>
              <Button onClick={() => submitLead('whatsapp')} className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold tracking-widest uppercase mt-4">
                Verify & Download
              </Button>
            </div>
          )}
          
          {step === 'generating' && (
             <div className="text-center py-10 animate-in zoom-in-95 duration-300">
               <div className="w-16 h-16 border-4 border-slate-200 border-t-[#d4af37] rounded-full animate-spin mx-auto mb-6"></div>
               <h3 className="text-xl font-bold text-[#0a192f] mb-2">Generating Master PDF...</h3>
               <p className="text-slate-500 text-sm">Please wait while we build your customized catalog. This may take a moment.</p>
             </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-300">
               <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle2 className="w-8 h-8 text-[#25D366]" />
               </div>
               <h3 className="text-xl font-bold text-[#0a192f] mb-2">Downloaded Successfully!</h3>
               <p className="text-slate-500 text-sm mb-6">
                 Your catalog download has started.
               </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
