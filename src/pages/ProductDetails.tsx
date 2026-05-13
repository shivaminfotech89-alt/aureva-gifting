import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductData } from '../components/shop/ProductCard';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { Button } from '../components/ui/button';
import { formatCurrency, calculateGST } from '../lib/utils';
import { toast } from 'sonner';
import { ShieldCheck, Truck, ArrowLeft, Star, Heart, Upload, X as XIcon, Edit3 } from 'lucide-react';
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

  const isWishlisted = product ? hasItem(product.id) : false;

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
  const [textChargeRate, setTextChargeRate] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadConfig() {
       try {
         const docRef = doc(db, 'settings', 'admin');
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
           setTextChargeRate(docSnap.data().textCharge || 50);
         }
       } catch (e) {
         // ignore
       }
    }
    loadConfig();
  }, []);

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
          setProduct({ id: docSnap.id, ...docSnap.data() } as ProductData);
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
        <h1 className="text-4xl font-bold mb-4 font-sans tracking-tight">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The product you are looking for might have been removed or is temporarily unavailable.</p>
        <Button size="lg" onClick={() => navigate('/shop')}>Explore Collections</Button>
      </div>
    );
  }

  const discountedPrice = product.discountPercent 
    ? product.basePrice * (1 - product.discountPercent / 100) 
    : product.basePrice;

  // Calculate customized charges
  let logoCharge = 0;
  if (customizationLogo) {
     if (logoSize === 'small') logoCharge = product.smallLogoCharge || 50;
     else if (logoSize === 'medium') logoCharge = product.mediumLogoCharge || 100;
     else if (logoSize === 'large') logoCharge = product.largeLogoCharge || 150;
     else if (logoSize === 'full') logoCharge = product.fullWrapCharge || 250;
  }

  const currentCustomizationCharge = customizationEnabled ? 
    (logoCharge + (customizationText.trim() ? textChargeRate : 0)) : 0;

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
    if (quantity > product.stock) {
      toast.error('Requested quantity exceeds available stock.');
      return;
    }
    
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: discountedPrice,
      gstPercent: product.gstPercent,
      quantity: quantity,
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
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <button 
          onClick={() => navigate('/shop')} 
          className="flex items-center text-sm font-bold text-slate-500 hover:text-[#0F172A] transition-colors mb-8 group tracking-wide"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Shop
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl overflow-hidden bg-white aspect-square border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative group">
              {product.discountPercent && product.discountPercent > 0 && product.stock > 0 && (
                <div className="absolute top-4 left-4 bg-[#0F172A] text-white px-5 py-2.5 font-bold tracking-widest uppercase text-xs rounded-xl shadow-lg z-10 border border-[#0F172A]/80">
                  {product.discountPercent}% OFF
                </div>
              )}
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-24 h-24 rounded-2xl overflow-hidden border bg-white shadow-sm flex-shrink-0 transition-all ${
                      activeImage === idx ? 'border-[#d4af37] ring-2 ring-[#d4af37] ring-offset-2 opacity-100' : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
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
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-[#0F172A] tracking-tight mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6 text-sm text-slate-500 font-medium">
               <div className="flex text-[#d4af37]">
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
               </div>
               <span>(12+ Reviews)</span>
            </div>

            <div className="flex flex-col mb-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              {product.discountPercent && product.discountPercent > 0 && (
                <span className="text-lg text-slate-400 line-through decoration-red-500 decoration-2 mb-1">
                  MRP {formatCurrency(product.basePrice + calculateGST(product.basePrice, product.gstPercent))}
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-[#d4af37]">{formatCurrency(priceWithGst)}</p>
                <span className="text-sm text-slate-500 font-bold tracking-wide uppercase">incl. taxes</span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-3 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                Base: {formatCurrency(discountedPrice)} + {product.gstPercent}% GST
              </p>
            </div>
            
            <div className="prose prose-sm md:prose-base dark:prose-invert mb-8 text-slate-600 leading-relaxed">
               <p>{product.description}</p>
            </div>
            
            {/* Customization Section */}
            <div className={`mb-8 bg-white rounded-3xl overflow-hidden transition-all duration-300 border ${customizationEnabled ? 'ring-2 ring-[#d4af37] border-transparent shadow-[0_8px_30px_rgba(212,175,55,0.15)]' : 'border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
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
                    className="w-5 h-5 border-slate-300 data-[state=checked]:bg-[#d4af37] data-[state=checked]:border-[#d4af37]"
                  />
                  <Label htmlFor="enable-customization" className="font-bold text-[#0F172A] text-base cursor-pointer">
                    Add Logo / Name Customization
                  </Label>
                </div>
                <Badge variant={customizationEnabled ? "default" : "outline"} className={customizationEnabled ? "bg-[#0F172A] hover:bg-slate-800 text-white border-transparent" : "text-slate-500 border-slate-200 bg-white"}>
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
                          className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#d4af37] bg-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="bg-[#d4af37]/10 p-3 rounded-xl mb-3 group-hover:scale-110 group-hover:bg-[#d4af37]/20 transition-all">
                            <Upload className="w-6 h-6 text-[#d4af37]" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">Click to upload logo</span>
                          <span className="text-xs text-slate-500 mt-1">PNG, JPG, SVG or PDF (Max. 1MB)</span>
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 bg-slate-50">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                              {customizationLogo.startsWith('data:image/') || customizationLogo.startsWith('http') ? (
                                <img src={customizationLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                              ) : (
                                <Badge variant="outline">PDF</Badge>
                              )}
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-sm font-bold text-[#0F172A] truncate">{customizationLogoName || 'Uploaded Logo'}</p>
                              <p className="text-[10px] uppercase tracking-wider text-[#d4af37] font-bold mt-1">Ready for print</p>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl bg-white border shadow-sm border-slate-200" onClick={() => { setCustomizationLogo(null); setCustomizationLogoName(null); }}>
                               <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="border-t border-slate-200 pt-4">
                            <Label className="mb-3 block font-bold text-slate-700">Logo Print Size</Label>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-colors ${logoSize === 'small' ? 'bg-[#d4af37]/10 border-[#d4af37] font-bold text-[#0F172A]' : 'bg-white border-slate-200 hover:border-[#d4af37]/50 font-medium text-slate-600'}`}>
                                <input type="radio" className="hidden" name="logosize" checked={logoSize === 'small'} onChange={() => setLogoSize('small')} />
                                Small (+₹{product.smallLogoCharge || 50})
                              </label>
                              <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-colors ${logoSize === 'medium' ? 'bg-[#d4af37]/10 border-[#d4af37] font-bold text-[#0F172A]' : 'bg-white border-slate-200 hover:border-[#d4af37]/50 font-medium text-slate-600'}`}>
                                <input type="radio" className="hidden" name="logosize" checked={logoSize === 'medium'} onChange={() => setLogoSize('medium')} />
                                Medium (+₹{product.mediumLogoCharge || 100})
                              </label>
                              <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-colors ${logoSize === 'large' ? 'bg-[#d4af37]/10 border-[#d4af37] font-bold text-[#0F172A]' : 'bg-white border-slate-200 hover:border-[#d4af37]/50 font-medium text-slate-600'}`}>
                                <input type="radio" className="hidden" name="logosize" checked={logoSize === 'large'} onChange={() => setLogoSize('large')} />
                                Large (+₹{product.largeLogoCharge || 150})
                              </label>
                              <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-colors ${logoSize === 'full' ? 'bg-[#d4af37]/10 border-[#d4af37] font-bold text-[#0F172A]' : 'bg-white border-slate-200 hover:border-[#d4af37]/50 font-medium text-slate-600'}`}>
                                <input type="radio" className="hidden" name="logosize" checked={logoSize === 'full'} onChange={() => setLogoSize('full')} />
                                Full Wrap (+₹{product.fullWrapCharge || 250})
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
                        <span className="text-xs text-[#d4af37] font-bold">+₹{textChargeRate}</span>
                      </Label>
                      <div className="relative">
                        <Edit3 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                        <Input 
                          id="custom-text" 
                          placeholder="e.g. John Doe / Best Employee" 
                          value={customizationText}
                          onChange={(e) => setCustomizationText(e.target.value)}
                          className="pl-12 h-12 rounded-xl border-slate-200 focus-visible:ring-[#d4af37] text-base"
                        />
                      </div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Will be engraved or printed cleanly on the product.</p>
                      
                      {currentCustomizationCharge > 0 && (
                        <div className="mt-6 p-4 bg-[#0F172A] rounded-xl border border-[#0F172A] flex justify-between items-center text-sm font-bold text-[#d4af37] shadow-xl">
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
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-slate-700 w-24 tracking-wide uppercase text-[11px]">Availability:</span>
                <span className={product.stock > 0 ? "text-[#10B981] font-bold px-3 py-1.5 bg-[#10B981]/10 border border-[#10B981]/20 rounded-md uppercase tracking-wider text-[10px]" : "text-red-600 font-bold px-3 py-1 bg-red-500/10 border border-red-200 rounded-md uppercase tracking-wider text-[10px]"}>
                  {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                </span>
              </div>
              {product.stock > 0 && product.stock < 10 && (
                 <div className="text-xs uppercase tracking-widest text-[#d4af37] font-bold flex items-center gap-2">
                   <span className="w-24"></span>
                   Hurry, only a few left!
                 </div>
              )}

              {product.stock > 0 && (
                <div className="flex items-center gap-2 text-sm mt-6">
                  <span className="font-bold text-slate-700 w-24 tracking-wide uppercase text-[11px]">Quantity:</span>
                  <div className="flex items-center border border-slate-200 bg-white rounded-xl h-12 w-32 shadow-sm focus-within:ring-2 focus-within:ring-[#d4af37]/20 focus-within:border-[#d4af37] transition-all">
                    <button 
                      className="w-10 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold transition-colors rounded-l-xl text-lg hover:text-[#0F172A]"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >-</button>
                    <span className="flex-1 text-center font-bold text-[#0F172A] text-lg">{quantity}</span>
                    <button 
                      className="w-10 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold transition-colors rounded-r-xl text-lg hover:text-[#0F172A]"
                      onClick={() => {
                        if (quantity >= product.stock) {
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
                className="flex-1 text-[15px] font-bold rounded-xl h-14 bg-[#0F172A] hover:bg-slate-800 text-white shadow-[0_8px_30px_rgb(15,23,42,0.2)] hover:shadow-[0_8px_30px_rgb(15,23,42,0.3)] transition-all uppercase tracking-widest" 
                onClick={handleAddToCart} 
                disabled={product.stock <= 0}
               >
                 Add to Cart
               </Button>
               <Button size="icon" variant="outline" className={`w-14 h-14 rounded-xl border-slate-200 bg-white shadow-sm hover:border-red-200 hover:bg-red-50 transition-colors ${isWishlisted ? 'border-red-200 bg-red-50 shadow-inner' : ''}`} onClick={handleToggleWishlist}>
                 <Heart className={`w-6 h-6 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-500'}`} />
               </Button>
            </div>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full mt-4 h-14 rounded-xl font-bold uppercase tracking-widest text-[#10B981] border-[#10B981] hover:bg-[#10B981] hover:text-white transition-colors shadow-sm"
              onClick={() => {
                const message = encodeURIComponent(`Hi Aureva,\n\nI want to order this product:\n\n*${product.name}*\nPrice: ${formatCurrency(priceWithGst)}\nLink: ${window.location.href}`);
                window.open(`https://wa.me/919825622421?text=${message}`, '_blank');
              }}
            >
              Order via WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-200">
               <div className="flex items-start gap-4">
                 <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-700">
                    <Truck className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-bold text-[#0F172A] tracking-tight">Free Delivery</h4>
                   <p className="text-[12px] font-medium text-slate-500 mt-0.5">On orders over ₹5000</p>
                 </div>
               </div>
               <div className="flex items-start gap-4">
                 <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-700">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-bold text-[#0F172A] tracking-tight">Secure Payment</h4>
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
