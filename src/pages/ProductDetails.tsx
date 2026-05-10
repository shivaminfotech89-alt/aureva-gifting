import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductData } from '../components/shop/ProductCard';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';
import { formatCurrency, calculateGST } from '../lib/utils';
import { toast } from 'sonner';

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
      <div className="container mx-auto p-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
      </div>
    );
  }

  const priceWithGst = product.basePrice + calculateGST(product.basePrice, product.gstPercent);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.basePrice,
      gstPercent: product.gstPercent,
      quantity: 1,
      image: product.images?.[0] || 'https://images.unsplash.com/photo-1581417478175-a9ef18abf5af?auto=format&fit=crop&q=80&w=600',
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-8">&larr; Back to Shop</Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="rounded-2xl overflow-hidden bg-muted aspect-square border border-border">
          {product.images?.[0] ? (
             <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image available</div>
          )}
        </div>
        
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-bold font-sans tracking-tight mb-4">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mb-2">{formatCurrency(priceWithGst)}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Includes {formatCurrency(calculateGST(product.basePrice, product.gstPercent))} GST ({product.gstPercent}%)
          </p>
          
          <div className="prose prose-sm dark:prose-invert mb-8 text-secondary-foreground">
             <p>{product.description}</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Availability:</span>
              <span className={product.stock > 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>
            {product.stock > 0 && product.stock < 10 && (
               <div className="text-sm text-yellow-600 font-medium">Hurry, only a few left!</div>
            )}
          </div>
          
          <div className="flex gap-4">
             <Button size="lg" className="flex-1 text-lg font-bold" onClick={handleAddToCart} disabled={product.stock <= 0}>
               Add to Cart
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
