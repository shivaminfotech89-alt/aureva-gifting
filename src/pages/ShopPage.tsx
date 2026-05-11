import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductCard, ProductData } from '../components/shop/ProductCard';
import { Input } from '../components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';

const FALLBACK_PRODUCTS: ProductData[] = [
  {
    id: 'sample-1',
    name: 'Executive Leather Briefcase',
    description: 'Premium full-grain leather briefcase perfect for executives.',
    basePrice: 12500,
    gstPercent: 18,
    categoryId: 'Bags',
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
    categoryId: 'Stationery',
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
    categoryId: 'Hampers',
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
    categoryId: 'Electronics',
    images: ['https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80&w=600'],
    stock: 200,
    enabled: true,
  }
];

export default function ShopPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBudget, setSelectedBudget] = useState<string>('All');

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

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.categoryId || 'Uncategorized'));
    return ['All', ...Array.from(cats)].sort();
  }, [products]);

  const budgetRanges = [
    { label: 'All Budgets', value: 'All' },
    { label: 'Under ₹1,000', value: '0-1000' },
    { label: '₹1,000 - ₹5,000', value: '1000-5000' },
    { label: '₹5,000 - ₹10,000', value: '5000-10000' },
    { label: 'Over ₹10,000', value: '10000-9999999' }
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || (product.categoryId || 'Uncategorized') === selectedCategory;
      
      let matchesBudget = true;
      if (selectedBudget !== 'All') {
        const [min, max] = selectedBudget.split('-').map(Number);
        matchesBudget = product.basePrice >= min && product.basePrice <= max;
      }

      return matchesSearch && matchesCategory && matchesBudget;
    });
  }, [products, searchQuery, selectedCategory, selectedBudget]);

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-7xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-sans tracking-tight mb-4 text-primary">Our Collections</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Explore our range of premium corporate gifting collections designed to leave a lasting impression.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 space-y-8 flex-shrink-0">
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Search className="w-4 h-4" /> Search
              </h3>
              <Input 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Categories
              </h3>
              <div className="space-y-2 flex flex-col">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Budget</h3>
              <div className="space-y-2 flex flex-col">
                {budgetRanges.map(range => (
                  <button
                    key={range.value}
                    onClick={() => setSelectedBudget(range.value)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedBudget === range.value 
                        ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            
            {(selectedCategory !== 'All' || selectedBudget !== 'All' || searchQuery) && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedBudget('All');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="h-96 rounded-xl bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed flex flex-col items-center">
              <div className="bg-muted p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No products found</h2>
              <p className="text-muted-foreground max-w-md">Try adjusting your filters or search query to find what you're looking for.</p>
              <Button 
                variant="default" 
                className="mt-6"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedBudget('All');
                  setSearchQuery('');
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex justify-between items-center text-sm text-muted-foreground">
                <p>Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {filteredProducts.map(product => (
                   <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
