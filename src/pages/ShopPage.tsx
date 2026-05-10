import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductCard, ProductData } from '../components/shop/ProductCard';

const FALLBACK_PRODUCTS: ProductData[] = [
  {
    id: 'sample-1',
    name: 'Executive Leather Briefcase',
    description: 'Premium full-grain leather briefcase perfect for executives.',
    basePrice: 12500,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'],
    stock: 50,
    enabled: true,
  },
  {
    id: 'sample-2',
    name: 'Gold Plated Pen Set',
    description: 'Luxurious gold-plated pen set in a polished wooden box.',
    basePrice: 4500,
    gstPercent: 12,
    images: ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&q=80&w=600'],
    stock: 120,
    enabled: true,
  },
  {
    id: 'sample-3',
    name: 'Corporate Wellness Hamper',
    description: 'A curated selection of premium organic teas and wellness products.',
    basePrice: 3200,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1608248593842-8021c6a1d821?auto=format&fit=crop&q=80&w=600'],
    stock: 80,
    enabled: true,
  },
  {
    id: 'sample-4',
    name: 'Wireless Desk Charger Organizer',
    description: 'Modern desk organizer with an integrated wireless charging pad.',
    basePrice: 2800,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80&w=600'],
    stock: 200,
    enabled: true,
  }
];

export default function ShopPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const q = query(collection(db, 'products'), where('enabled', '==', true));
        const snapshot = await getDocs(q);
        const fetchedProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ProductData[];
        
        if (fetchedProducts.length === 0) {
          setProducts(FALLBACK_PRODUCTS);
        } else {
          setProducts(fetchedProducts);
        }
      } catch (error) {
        setProducts(FALLBACK_PRODUCTS);
        handleFirestoreError(error, OperationType.LIST, 'products');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-7xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-4 text-primary">All Collections</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Explore our range of premium corporate gifting collections designed to leave a lasting impression.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(n => (
            <div key={n} className="h-96 rounded-xl bg-muted animate-pulse"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-border mt-8">
          <h2 className="text-2xl font-bold mb-2">No products found</h2>
          <p className="text-muted-foreground">We are currently updating our collections. Please check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
          {products.map(product => (
             <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
