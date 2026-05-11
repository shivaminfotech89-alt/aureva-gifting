import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductData } from '../components/shop/ProductCard';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';
import { formatCurrency, calculateGST } from '../lib/utils';
import { toast } from 'sonner';
import { ShieldCheck, Truck, ArrowLeft, Star, Heart } from 'lucide-react';
import { Badge } from '../components/ui/badge';

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
  const addItem = useCartStore(state => state.addItem);

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

  const priceWithGst = discountedPrice + calculateGST(discountedPrice, product.gstPercent);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: discountedPrice,
      gstPercent: product.gstPercent,
      quantity: 1,
      image: product.images?.[0] || 'https://images.unsplash.com/photo-1581417478175-a9ef18abf5af?auto=format&fit=crop&q=80&w=600',
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
