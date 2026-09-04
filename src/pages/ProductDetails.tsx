import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductData } from '../components/shop/ProductCard';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useSettingsStore } from '../store/settingsStore';
import { Button } from '../components/ui/button';
import { formatCurrency, calculateGST } from '../lib/utils';
import { openWhatsApp, productInquiryMessage } from '../lib/whatsapp';
import { toast } from 'sonner';
import { ShieldCheck, Truck, ArrowLeft, Star, Heart, Upload, X as XIcon, Edit3, AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';

const FALLBACK_PRODUCTS: Record<string, ProductData> = {
  'sample-1': { id: 'sample-1', name: 'Executive Leather Briefcase', description: 'Premium full-grain leather briefcase perfect for executives.', basePrice: 12500, gstPercent: 18, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'], stock: 50, enabled: true },
  'sample-2': { id: 'sample-2', name: 'Gold Plated Pen Set', description: 'Luxurious gold-plated pen set in a polished wooden box.', basePrice: 4500, gstPercent: 12, images: ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&q=80&w=600'], stock: 120, enabled: true },
  'sample-3': { id: 'sample-3', name: 'Corporate Wellness Hamper', description: 'A curated selection of premium organic teas and wellness products.', basePrice: 3200, gstPercent: 18, images: ['https://images.unsplash.com/photo-1608248593842-8021c6a1d821?auto=format&fit=crop&q=80&w=600'], stock: 80, enabled: true },
  'sample-4': { id: 'sample-4', name: 'Wireless Desk Charger Organizer', description: 'Modern desk organizer with an integrated wireless charging pad.', basePrice: 2800, gstPercent: 18, images: ['https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80&w=600'], stock: 200, enabled: true }
};

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);
  const { hasItem, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const { settings } = useSettingsStore();

  const isWishlisted = product ? hasItem(product.id) : false;

  const handleBuyNow = () => {
    if (!product) return;
    const moq = product.minOrderQuantity || 1;
    if (quantity < moq) {
      toast.error(`This product requires minimum order quantity of ${moq} units.`);
      return;
    }
    if (product.availabilityStatus === 'temporarily_unavailable') {
      return;
    }
    if (product.availabilityStatus === 'in_stock' && quantity > product.stock) {
      toast.error('Requested quantity exceeds available stock.');
      return;
    }

    handleAddToCart();
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  // Customization State
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [customizationText, setCustomizationText] = useState('');
  const [customizationLogo, setCustomizationLogo] = useState<string | null>(null);
  const [customizationLogoName, setCustomizationLogoName] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large' | 'full'>('small');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        if (id.startsWith('sample-')) {
          setProduct(FALLBACK_PRODUCTS[id] || null);
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const loadedProduct = { id: docSnap.id, ...docSnap.data() } as ProductData;
          setProduct(loadedProduct);
          if (loadedProduct.minOrderQuantity && loadedProduct.minOrderQuantity > 1) {
            setQuantity(loadedProduct.minOrderQuantity);
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `products/${id}`);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
     return <div className="container mx-auto p-8"><div className="h-96 rounded-xl bg-muted animate-pulse max-w-4xl mx-auto"></div></div>;
  }

  if (!product) {
    return (
      <div className="container flex flex-col items-center justify-center p-20 min-h-[60vh] text-center">
        <h1 className="text-[1.75rem] font-bold mb-4 font-sans tracking-tight">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The product you are looking for might have been removed or is temporarily unavailable.</p>
        <Button size="lg" onClick={() => navigate('/shop')}>Explore Collections</Button>
      </div>
    );
  }

  const discountedPrice = product.discountPercent 
    ? product.basePrice * (1 - product.discountPercent / 100) 
    : product.basePrice;

  const getCharge = (pVal: number | undefined, sVal: number | undefined, def: number) => {
    if (pVal !== undefined && pVal > 0) return pVal;
    if (sVal !== undefined && sVal > 0) return sVal;
    return def;
  };

  const pSmallLogo = getCharge(product.smallLogoCharge, settings?.logoSmallCharge, 50);
  const pMedLogo = getCharge(product.mediumLogoCharge, settings?.logoMediumCharge, 100);
  const pLargeLogo = getCharge(product.largeLogoCharge, settings?.logoLargeCharge, 150);
  const pFullWrap = getCharge(product.fullWrapCharge, settings?.logoFullCharge, 250);
  const pTextPrint = getCharge(product.textPrintingCharge, settings?.textCharge, 50);

  // Calculate customized charges
  let logoCharge = 0;
  if (customizationLogo) {
     if (logoSize === 'small') logoCharge = pSmallLogo;
     else if (logoSize === 'medium') logoCharge = pMedLogo;
     else if (logoSize === 'large') logoCharge = pLargeLogo;
     else if (logoSize === 'full') logoCharge = pFullWrap;
  }

  const currentCustomizationCharge = customizationEnabled ? 
    (logoCharge + (customizationText.trim() ? pTextPrint : 0)) : 0;

  const mrpInclusive = (() => {
    const gross = (n: number) => n + calculateGST(n, product.gstPercent);
    if (typeof product.mrp === 'number' && product.mrp > discountedPrice) return gross(product.mrp);
    if ((product.discountPercent ?? 0) > 0) return gross(product.basePrice);
    return null;
  })();

  const priceWithGst = (discountedPrice + currentCustomizationCharge) + calculateGST(discountedPrice + currentCustomizationCharge, product.gstPercent);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'].includes(file.type)) {
      toast.error('Please upload a valid logo file (JPG, PNG, SVG, PDF).');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('File size exceeds maximum allowed limit (1MB).');
      return;
    }

    setCustomizationLogoName(file.name);
    
    // For demo/simplicity, we read it as a DataURL to show preview
    // In production, we'd upload directly to Firebase Storage here
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomizationLogo(e.target?.result as string);
      toast.success('Logo uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    const moq = product.minOrderQuantity || 1;
    if (quantity < moq) {
      toast.error(`This product requires minimum order quantity of ${moq} units.`);
      return;
    }
    if (product.availabilityStatus !== 'temporarily_unavailable' && quantity > product.stock) {
       // Only block if we truly track stock, else this might be pre-order. 
       // We can just warn, but allow it for inquiry based. Actually, it's an inquiry, so stock limit can be bypassed or just warned. 
       // Let's keep it but change logic for inquiry. The stock constraint could be removed if it's an inquiry, but let's keep it and let user know. 
       // For a sourcing startup, stock may not be exact. We'll let them add up to stock or ignore stock if it's 'bulk_only'
    }
    if (product.availabilityStatus === 'temporarily_unavailable') {
      toast.error('This product is temporarily unavailable and cannot be requested right now.');
      return;
    }

    if (quantity > product.stock && product.availabilityStatus === 'in_stock') {
      toast.error('Requested quantity exceeds available stock.');
      return;
    }
    
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: discountedPrice,
      gstPercent: product.gstPercent,
      quantity: quantity,
      minOrderQuantity: product.minOrderQuantity || 1,
      image: product.images?.[0] || 'https://images.unsplash.com/photo-1581417478175-a9ef18abf5af?auto=format&fit=crop&q=80&w=600',
      customization: customizationEnabled ? {
        enabled: true,
        logoUrl: customizationLogo || undefined,
        logoSize: customizationLogo ? logoSize : undefined,
        customText: customizationText.trim() || undefined,
        charge: currentCustomizationCharge
      } : undefined
    });
    toast.success(`${product.name} added to cart`);
  };

  const images = product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1581417478175-a9ef18abf5af?auto=format&fit=crop&q=80&w=600'];

  return (
    <div className="bg-slate-50 py-8 md:py-12 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 md:px-8 max-w-[80rem]">
        <button 
          onClick={() => navigate('/shop')} 
          className="flex items-center text-sm font-bold text-slate-500 hover:text-[var(--navy-800)] transition-colors mb-8 group tracking-wide"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Shop
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl overflow-hidden bg-white aspect-square border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative group">
              {(product.discountPercent ?? 0) > 0 && product.stock > 0 && (
                <div className="absolute top-4 left-4 bg-[var(--navy-800)] text-white px-5 py-2.5 font-bold tracking-widest uppercase text-xs rounded-xl shadow-lg z-10 border border-[var(--navy-800)]/80">
                  {product.discountPercent}% OFF
                </div>
              )}
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581417478175-a9ef18abf5af?auto=format&fit=crop&q=80&w=600';
                }}
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-24 h-24 rounded-xl overflow-hidden border bg-white shadow-sm flex-shrink-0 transition-all ${
                      activeImage === idx ? 'border-[var(--gold-500)] ring-2 ring-[var(--gold-500)] ring-offset-2 opacity-100' : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-[var(--gold-500)]/50'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx}`} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581417478175-a9ef18abf5af?auto=format&fit=crop&q=80&w=600';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex flex-col justify-start">
            {product.categoryId && (
              <Badge variant="outline" className="w-fit mb-4 bg-slate-100/50 text-slate-600 border-slate-200">{product.categoryId}</Badge>
            )}
            <h1 className="text-[1.75rem] md:text-[2rem] font-bold font-display text-[var(--navy-800)] tracking-tight mb-2 leading-tight">{product.name}</h1>
            {/* Buyers quote this code back to us, so it belongs on the page. */}
            {product.sku && (
              <p className="mb-4 text-[12px] uppercase tracking-[0.14em] text-slate-400">
                Product code <span className="font-semibold text-slate-600">{product.sku}</span>
              </p>
            )}
            
            <div className="flex items-center gap-4 mb-6 text-sm text-slate-500 font-medium">
               <div className="flex text-[var(--gold-500)]">
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
               </div>
               <span>(12+ Reviews)</span>
            </div>

            <div className="flex flex-col mb-8 p-6 bg-white rounded-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              {mrpInclusive !== null && (
                <span className="text-lg text-slate-400 line-through decoration-red-500 decoration-2 mb-1">
                  MRP {formatCurrency(mrpInclusive)}
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <p className="text-[1.75rem] font-bold text-[var(--gold-500)]">{formatCurrency(priceWithGst)}</p>
                <span className="text-sm text-slate-500 font-bold tracking-wide uppercase">incl. taxes</span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-3 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                Base: {formatCurrency(discountedPrice)} {currentCustomizationCharge > 0 ? `+ Customization: ${formatCurrency(currentCustomizationCharge)} ` : ''}+ {product.gstPercent}% GST
              </p>
            </div>
            
            <div className="prose prose-sm md:prose-base dark:prose-invert mb-8 text-slate-600 leading-relaxed">
               <p>{product.description}</p>
            </div>
            
            {/* Customization Section */}
            <div className={`mb-8 bg-white rounded-xl overflow-hidden transition-all duration-300 border ${customizationEnabled ? 'ring-2 ring-[var(--gold-500)] border-transparent shadow-[0_8px_30px_rgba(212,175,55,0.15)]' : 'border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
              <div 
                className="p-5 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setCustomizationEnabled(!customizationEnabled)}
              >
                <div className="flex items-center gap-4">
                  <Checkbox 
                    id="enable-customization" 
                    checked={customizationEnabled} 
                    onCheckedChange={(c) => setCustomizationEnabled(!!c)} 
                    onClick={(e) => e.stopPropagation()} 
                    className="w-5 h-5 border-slate-300 data-[state=checked]:bg-[var(--gold-500)] data-[state=checked]:border-[var(--gold-500)]"
                  />
                  <Label htmlFor="enable-customization" className="font-bold text-[var(--navy-800)] text-base cursor-pointer">
                    Add Logo / Name Customization
                  </Label>
                </div>
                <Badge variant={customizationEnabled ? "default" : "outline"} className={customizationEnabled ? "bg-[var(--navy-800)] hover:bg-slate-800 text-white border-transparent" : "text-slate-500 border-slate-200 bg-white"}>
                  Personalize
                </Badge>
              </div>

              {customizationEnabled && (
                <div className="p-6 bg-white space-y-6 animate-in slide-in-from-top-2">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label className="flex justify-between font-bold text-slate-700">
                        <span>Company Logo / Artwork</span>
                      </Label>
                      
                      {!customizationLogo ? (
                        <div 
                          className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[var(--gold-500)] bg-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="bg-[var(--gold-500)]/10 p-3 rounded-xl mb-3 group-hover:scale-110 group-hover:bg-[var(--gold-500)]/20 transition-all">
                            <Upload className="w-6 h-6 text-[var(--gold-500)]" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">Click to upload logo</span>
                          <span className="text-xs text-slate-500 mt-1">PNG, JPG, SVG or PDF (Max. 1MB)</span>
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl p-5 flex flex-col gap-4 bg-slate-50">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                              {customizationLogo.startsWith('data:image/') || customizationLogo.startsWith('http') ? (
                                <img src={customizationLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                              ) : (
                                <Badge variant="outline">PDF</Badge>
                              )}
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-sm font-bold text-[var(--navy-800)] truncate">{customizationLogoName || 'Uploaded Logo'}</p>
                              <p className="text-[10px] uppercase tracking-wider text-[var(--gold-500)] font-bold mt-1">Ready for print</p>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl bg-white border shadow-sm border-slate-200" onClick={() => { setCustomizationLogo(null); setCustomizationLogoName(null); }}>
                               <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="border-t border-slate-200 pt-4">
                            <Label className="mb-3 block font-bold text-slate-700">Logo Print Size</Label>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-colors ${logoSize === 'small' ? 'bg-[var(--gold-500)]/10 border-[var(--gold-500)] font-bold text-[var(--navy-800)]' : 'bg-white border-slate-200 hover:border-[var(--gold-500)]/50 font-medium text-slate-600'}`}>
                                <input type="radio" className="hidden" name="logosize" checked={logoSize === 'small'} onChange={() => setLogoSize('small')} />
                                Small (+₹{pSmallLogo})
                              </label>
                              <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-colors ${logoSize === 'medium' ? 'bg-[var(--gold-500)]/10 border-[var(--gold-500)] font-bold text-[var(--navy-800)]' : 'bg-white border-slate-200 hover:border-[var(--gold-500)]/50 font-medium text-slate-600'}`}>
                                <input type="radio" className="hidden" name="logosize" checked={logoSize === 'medium'} onChange={() => setLogoSize('medium')} />
                                Medium (+₹{pMedLogo})
                              </label>
                              <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-colors ${logoSize === 'large' ? 'bg-[var(--gold-500)]/10 border-[var(--gold-500)] font-bold text-[var(--navy-800)]' : 'bg-white border-slate-200 hover:border-[var(--gold-500)]/50 font-medium text-slate-600'}`}>
                                <input type="radio" className="hidden" name="logosize" checked={logoSize === 'large'} onChange={() => setLogoSize('large')} />
                                Large (+₹{pLargeLogo})
                              </label>
                              <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-colors ${logoSize === 'full' ? 'bg-[var(--gold-500)]/10 border-[var(--gold-500)] font-bold text-[var(--navy-800)]' : 'bg-white border-slate-200 hover:border-[var(--gold-500)]/50 font-medium text-slate-600'}`}>
                                <input type="radio" className="hidden" name="logosize" checked={logoSize === 'full'} onChange={() => setLogoSize('full')} />
                                Full Wrap (+₹{pFullWrap})
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".png,.jpg,.jpeg,.svg,.pdf" 
                        onChange={handleFileUpload} 
                      />
                    </div>

                    {/* Custom Text/Name */}
                    <div className="space-y-3 flex flex-col justify-start">
                      <Label htmlFor="custom-text" className="flex justify-between font-bold text-slate-700">
                        <span>Custom Text / Employee Name</span>
                        <span className="text-xs text-[var(--gold-500)] font-bold">+₹{pTextPrint}</span>
                      </Label>
                      <div className="relative">
                        <Edit3 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                        <Input 
                          id="custom-text" 
                          placeholder="e.g. John Doe / Best Employee" 
                          value={customizationText}
                          onChange={(e) => setCustomizationText(e.target.value)}
                          className="pl-12 h-12 rounded-xl border-slate-200 focus-visible:ring-[var(--gold-500)] text-base"
                        />
                      </div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Will be engraved or printed cleanly on the product.</p>
                      
                      {currentCustomizationCharge > 0 && (
                        <div className="mt-6 p-4 bg-[var(--navy-800)] rounded-xl border border-[var(--navy-800)] flex justify-between items-center text-sm font-bold text-[var(--gold-500)] shadow-xl">
                          <span>Customization Total:</span>
                          <span>+ {formatCurrency(currentCustomizationCharge)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8 border-t border-slate-200 py-6">
              
              {/* Product Disclaimer & Notice */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Important Notice
                </p>
                <p className="text-xs text-amber-900 font-medium tracking-tight">
                  <strong className="font-bold">IMPORTANT:</strong> AUREVA specializes in bulk corporate gifting orders. Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 w-32 tracking-wide uppercase text-[11px]">Availability:</span>
                  <span className={
                    product.availabilityStatus === 'in_stock' ? "text-emerald-700 font-semibold px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md uppercase tracking-[0.12em] text-[10px]" : 
                    product.availabilityStatus === 'temporarily_unavailable' ? "text-red-600 font-bold px-3 py-1 bg-red-500/10 border border-red-200 rounded-md uppercase tracking-wider text-[10px]" : 
                    "text-[var(--navy-800)] font-bold px-3 py-1.5 bg-slate-200/50 border border-slate-300 rounded-md uppercase tracking-wider text-[10px]"
                  }>
                    {product.availabilityStatus === 'in_stock' ? 'In Stock (Check Details)' : 
                     product.availabilityStatus === 'available_on_request' ? 'Available on Request' : 
                     product.availabilityStatus === 'bulk_only' ? 'Bulk Order Only' : 
                     product.availabilityStatus === 'custom_production' ? 'Custom Production' : 
                     product.availabilityStatus === 'temporarily_unavailable' ? 'Temporarily Unavailable' :
                     product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 w-32 tracking-wide uppercase text-[11px]">Est. Procurement:</span>
                  <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    {product.estimatedProcurementTime === 'ready' ? 'Ready to Dispatch' :
                     product.estimatedProcurementTime === '2_3_days' ? '2-3 Days' :
                     product.estimatedProcurementTime === '5_7_days' ? '5-7 Days' :
                     product.estimatedProcurementTime === '7_10_days' ? '7-10 Days' : 'Confirm with Admin'}
                  </span>
                </div>
                
                {product.minOrderQuantity && product.minOrderQuantity > 1 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-slate-700 w-32 tracking-wide uppercase text-[11px]">Min Order:</span>
                    <span className="text-[var(--gold-500)] font-bold text-[11px] bg-[var(--gold-500)]/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {product.minOrderQuantity} Units Required
                    </span>
                  </div>
                )}
              </div>

              {product.availabilityStatus !== 'temporarily_unavailable' && (
                <div className="flex items-center gap-2 text-sm mt-6">
                  <span className="font-bold text-slate-700 w-32 tracking-wide uppercase text-[11px]">Quantity:</span>
                  <div className="flex items-center border border-slate-200 bg-white rounded-xl h-12 w-32 shadow-sm focus-within:ring-2 focus-within:ring-[var(--gold-500)]/20 focus-within:border-[var(--gold-500)] transition-all">
                    <button 
                      className="w-10 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold transition-colors rounded-l-xl text-lg hover:text-[var(--navy-800)]"
                      onClick={() => setQuantity(Math.max(product.minOrderQuantity || 1, quantity - 1))}
                      disabled={quantity <= (product.minOrderQuantity || 1)}
                    >-</button>
                    <span className="flex-1 text-center font-bold text-[var(--navy-800)] text-lg">{quantity}</span>
                    <button 
                      className="w-10 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold transition-colors rounded-r-xl text-lg hover:text-[var(--navy-800)]"
                      onClick={() => {
                        if (product.availabilityStatus === 'in_stock' && quantity >= product.stock) {
                          toast.error('Requested quantity exceeds available stock.');
                        } else {
                          setQuantity(quantity + 1);
                        }
                      }}
                    >+</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-4 mt-auto">
               <Button 
                size="lg" 
                variant="outline"
                className="flex-1 text-[15px] font-bold rounded-xl h-11 text-slate-700 transition-all uppercase tracking-widest bg-white border-slate-200 shadow-sm" 
                onClick={handleAddToCart} 
                disabled={product.availabilityStatus === 'temporarily_unavailable'}
               >
                 Add to Cart
               </Button>
               <Button 
                size="lg" 
                className="flex-1 text-[15px] font-bold rounded-xl h-11 bg-[var(--gold-500)] hover:bg-[var(--gold-400)] text-[var(--navy-800)] shadow-sm transition-all uppercase tracking-widest" 
                onClick={handleBuyNow} 
                disabled={product.availabilityStatus === 'temporarily_unavailable'}
               >
                 Request Order
               </Button>
               <Button size="icon" variant="outline" className={`w-14 h-11 shrink-0 rounded-xl border-slate-200 bg-white shadow-sm hover:border-red-200 hover:bg-red-50 transition-colors ${isWishlisted ? 'border-red-200 bg-red-50 shadow-inner' : ''}`} onClick={handleToggleWishlist}>
                 <Heart className={`w-6 h-6 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-500'}`} />
               </Button>
            </div>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full mt-3 h-11 rounded-lg font-semibold uppercase tracking-[0.12em] text-[13px] bg-[#25D366] text-white border-transparent hover:bg-[#1eb457] transition-colors"
              onClick={() => openWhatsApp(settings?.adminWhatsApp, productInquiryMessage({
                name: product.name,
                sku: product.sku,
                price: priceWithGst,
                minOrderQuantity: product.minOrderQuantity,
                images: product.images,
              }))}
            >
              Inquire on WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-200">
               <div className="flex items-start gap-4">
                 <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-700">
                    <Truck className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-bold text-[var(--navy-800)] tracking-tight">Free Delivery</h4>
                   <p className="text-[12px] font-medium text-slate-500 mt-0.5">On orders over ₹5000</p>
                 </div>
               </div>
               <div className="flex items-start gap-4">
                 <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-700">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-bold text-[var(--navy-800)] tracking-tight">Secure Payment</h4>
                   <p className="text-[12px] font-medium text-slate-500 mt-0.5">100% safe transaction</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
