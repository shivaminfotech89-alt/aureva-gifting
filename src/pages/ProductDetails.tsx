import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductData } from '../components/shop/ProductCard';
import { useCartStore } from '../store/cartStore';
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

  // Customization State
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [customizationText, setCustomizationText] = useState('');
  const [customizationLogo, setCustomizationLogo] = useState<string | null>(null);
  const [customizationLogoName, setCustomizationLogoName] = useState<string | null>(null);
  const [logoChargeRate, setLogoChargeRate] = useState(150);
  const [textChargeRate, setTextChargeRate] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadConfig() {
       try {
         const docRef = doc(db, 'settings', 'admin');
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
           setLogoChargeRate(docSnap.data().logoCharge || 150);
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
  const currentCustomizationCharge = customizationEnabled ? 
    ((customizationLogo ? logoChargeRate : 0) + (customizationText.trim() ? textChargeRate : 0)) : 0;

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
        customText: customizationText.trim() || undefined,
        charge: currentCustomizationCharge
      } : undefined
    });
    toast.success(`${product.name} added to cart`);
  };

  const images = product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1581417478175-a9ef18abf5af?auto=format&fit=crop&q=80&w=600'];

  return (
    <div className="bg-background py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <button 
          onClick={() => navigate('/shop')} 
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden bg-muted aspect-square border shadow-sm relative group">
              {product.discountPercent && product.discountPercent > 0 && product.stock > 0 && (
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 font-bold tracking-wider uppercase text-sm rounded-full shadow-lg z-10">
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
                    className={`w-24 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImage === idx ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
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
              <Badge variant="outline" className="w-fit mb-4">{product.categoryId}</Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-bold font-sans tracking-tight mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
               <div className="flex text-yellow-400">
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
               </div>
               <span>(12+ Reviews)</span>
            </div>

            <div className="flex flex-col mb-8 p-6 bg-muted/30 rounded-2xl border">
              {product.discountPercent && product.discountPercent > 0 && (
                <span className="text-lg text-muted-foreground line-through decoration-destructive decoration-2 mb-1">
                  MRP {formatCurrency(product.basePrice + calculateGST(product.basePrice, product.gstPercent))}
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-primary">{formatCurrency(priceWithGst)}</p>
                <span className="text-sm text-muted-foreground font-medium">incl. taxes</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Base: {formatCurrency(discountedPrice)} + {product.gstPercent}% GST
              </p>
            </div>
            
            <div className="prose prose-sm md:prose-base dark:prose-invert mb-8 text-secondary-foreground">
               <p>{product.description}</p>
            </div>
            
            {/* Customization Section */}
            <div className={`mb-8 border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${customizationEnabled ? 'ring-2 ring-primary border-transparent' : 'border-border'}`}>
              <div 
                className="p-4 bg-muted/40 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors"
                onClick={() => setCustomizationEnabled(!customizationEnabled)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="enable-customization" 
                    checked={customizationEnabled} 
                    onCheckedChange={(c) => setCustomizationEnabled(!!c)} 
                    onClick={(e) => e.stopPropagation()} 
                  />
                  <Label htmlFor="enable-customization" className="font-semibold text-base cursor-pointer">
                    Add Logo / Name Customization
                  </Label>
                </div>
                <Badge variant={customizationEnabled ? "default" : "outline"} className={customizationEnabled ? "" : "text-muted-foreground"}>
                  Personalize
                </Badge>
              </div>

              {customizationEnabled && (
                <div className="p-6 bg-card space-y-6 animate-in slide-in-from-top-2">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label className="flex justify-between">
                        <span>Company Logo</span>
                        <span className="text-xs text-muted-foreground">+₹{logoChargeRate}</span>
                      </Label>
                      
                      {!customizationLogo ? (
                        <div 
                          className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-muted/20 transition-all cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="bg-primary/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Click to upload logo</span>
                          <span className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG or PDF (Max. 1MB)</span>
                        </div>
                      ) : (
                        <div className="border rounded-xl p-4 flex items-center gap-4 bg-muted/20">
                          <div className="w-16 h-16 rounded-lg bg-white border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                            {customizationLogo.startsWith('data:image/') || customizationLogo.startsWith('http') ? (
                              <img src={customizationLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                            ) : (
                              <Badge variant="outline">PDF</Badge>
                            )}
                          </div>
                          <div className="flex-1 truncate">
                            <p className="text-sm font-medium truncate">{customizationLogoName || 'Uploaded Logo'}</p>
                            <p className="text-xs text-primary font-medium mt-1">Ready for print</p>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setCustomizationLogo(null); setCustomizationLogoName(null); }}>
                             <XIcon className="w-4 h-4" />
                          </Button>
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
                      <Label htmlFor="custom-text" className="flex justify-between">
                        <span>Custom Text / Employee Name</span>
                        <span className="text-xs text-muted-foreground">+₹{textChargeRate}</span>
                      </Label>
                      <div className="relative">
                        <Edit3 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="custom-text" 
                          placeholder="e.g. John Doe / Best Employee" 
                          value={customizationText}
                          onChange={(e) => setCustomizationText(e.target.value)}
                          className="pl-9 h-12"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Will be engraved or printed cleanly on the product.</p>
                      
                      {currentCustomizationCharge > 0 && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20 flex justify-between items-center text-sm font-medium text-primary">
                          <span>Customization Total:</span>
                          <span>+ {formatCurrency(currentCustomizationCharge)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8 border-t py-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold w-24">Availability:</span>
                <span className={product.stock > 0 ? "text-green-600 font-medium px-3 py-1 bg-green-500/10 rounded-full" : "text-destructive font-medium px-3 py-1 bg-destructive/10 rounded-full"}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
              {product.stock > 0 && product.stock < 10 && (
                 <div className="text-sm text-yellow-600 font-medium flex items-center gap-2">
                   <span className="w-24"></span>
                   Hurry, only a few left!
                 </div>
              )}

              {product.stock > 0 && (
                <div className="flex items-center gap-2 text-sm mt-4">
                  <span className="font-semibold w-24">Quantity:</span>
                  <div className="flex items-center border rounded-lg h-10 w-32 border-border shadow-sm">
                    <button 
                      className="w-10 h-full flex items-center justify-center hover:bg-muted text-lg transition-colors border-r"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >-</button>
                    <span className="flex-1 text-center font-bold">{quantity}</span>
                    <button 
                      className="w-10 h-full flex items-center justify-center hover:bg-muted text-lg transition-colors border-l"
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
                className="flex-1 text-lg font-bold rounded-xl h-14 shadow-lg hover:shadow-primary/25 transition-all" 
                onClick={handleAddToCart} 
                disabled={product.stock <= 0}
               >
                 Add to Cart
               </Button>
               <Button size="icon" variant="outline" className="w-14 h-14 rounded-xl">
                 <Heart className="w-6 h-6 text-muted-foreground hover:text-red-500 transition-colors" />
               </Button>
            </div>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full mt-4 h-14 rounded-xl font-bold border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
              onClick={() => {
                const message = encodeURIComponent(`Hi Aureva,\n\nI want to order this product:\n\n*${product.name}*\nPrice: ${formatCurrency(priceWithGst)}\nLink: ${window.location.href}`);
                window.open(`https://wa.me/919825622421?text=${message}`, '_blank');
              }}
            >
              Order via WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t">
               <div className="flex items-start gap-3">
                 <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <Truck className="w-5 h-5" />
                 </div>
                 <div>
                   <h4 className="font-semibold text-sm">Free Delivery</h4>
                   <p className="text-xs text-muted-foreground">On orders over ₹5000</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div>
                   <h4 className="font-semibold text-sm">Secure Payment</h4>
                   <p className="text-xs text-muted-foreground">100% safe transaction</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
