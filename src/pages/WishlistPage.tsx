import React, { useEffect, useState } from 'react';
import { useWishlistStore } from '../store/wishlistStore';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ProductCard, ProductData } from '../components/shop/ProductCard';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function WishlistPage() {
  const { items } = useWishlistStore();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlistProducts() {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'products'),
          where('__name__', 'in', items),
          where('enabled', '==', true)
        );
        const snapshot = await getDocs(q);
        const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductData));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchWishlistProducts();
  }, [items]);

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-10">
        <Heart className="w-8 h-8 text-primary" />
        <h1 className="text-3xl md:text-5xl font-bold font-sans tracking-tight text-primary">Your Wishlist</h1>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-sm">
          <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-8">Save your favorite premium items here while you decide.</p>
          <Link to="/shop">
            <Button size="lg" className="font-bold uppercase tracking-wider px-8">Explore Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
