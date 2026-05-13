import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductCard, ProductData } from '../components/shop/ProductCard';
import { Input } from '../components/ui/input';
import { Search, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { Button } from '../components/ui/button';

const FALLBACK_PRODUCTS: ProductData[] = [
  // Keeping fallback products for preview resilience
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
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isSortOpen, setIsSortOpen] = useState(false);

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

  const sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Alphabetical: A-Z', value: 'name_asc' },
  ];

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
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

    switch(sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price_desc':
        result.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // KEEP original order or fallback
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedBudget, sortBy]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Premium Hero Banner */}
      <div className="bg-[#0F172A] text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2640&auto=format&fit=crop" 
            alt="Premium Gifts" 
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 max-w-7xl relative z-10">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6 text-white leading-tight">
              Curated Corporate <br/><span className="text-[#d4af37] italic">Collections</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-xl font-light">
              Explore our range of premium gifting collections. Designed to impress, built to last, and customized to perfection.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:px-8 max-w-[1600px]">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24 space-y-8">
              
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#0F172A] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Search className="w-4 h-4 text-[#d4af37]" /> Find Gifts
                </h3>
                <Input 
                  placeholder="Search collections..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 focus-visible:ring-[#d4af37] rounded-xl"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#0F172A] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#d4af37]" /> Categories
                </h3>
                <div className="space-y-1.5 flex flex-col">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-between group ${
                        selectedCategory === cat 
                          ? 'bg-[#d4af37]/10 text-[#0F172A] font-bold border border-[#d4af37]/20 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A] border border-transparent'
                      }`}
                    >
                      <span>{cat}</span>
                      {selectedCategory === cat && <Check className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#0F172A] border-b border-slate-100 pb-2">Budget Range</h3>
                <div className="space-y-1.5 flex flex-col">
                  {budgetRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => setSelectedBudget(range.value)}
                      className={`text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
                        selectedBudget === range.value 
                          ? 'bg-[#d4af37]/10 text-[#0F172A] font-bold border border-[#d4af37]/20 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A] border border-transparent'
                      }`}
                    >
                      <span>{range.label}</span>
                      {selectedBudget === range.value && <Check className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  ))}
                </div>
              </div>
              
              {(selectedCategory !== 'All' || selectedBudget !== 'All' || searchQuery) && (
                <div className="pt-4 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl border-slate-200 text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 shadow-sm h-11 font-bold"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedBudget('All');
                      setSearchQuery('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-sm text-slate-500 font-medium">
                Showing <span className="text-[#0F172A] font-bold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'result' : 'results'}
              </p>
              
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium tracking-wide">Sort by:</span>
                  <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 text-sm font-bold text-[#0F172A] bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none transition-all"
                  >
                    {sortOptions.find(o => o.value === sortBy)?.label}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {isSortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 p-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all font-medium ${
                          sortBy === option.value ? 'bg-[#d4af37]/10 text-[#0F172A] font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4,5,6,7,8].map(n => (
                  <div key={n} className="h-[400px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 flex flex-col items-center">
                <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100 shadow-sm">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-serif font-bold mb-3 text-[#0F172A]">No products found</h2>
                <p className="text-slate-500 max-w-md text-lg">Try adjusting your filters or search query to find what you're looking for.</p>
                <Button 
                  className="mt-8 bg-[#0F172A] text-white hover:bg-slate-800 rounded-xl h-12 px-8 font-bold shadow-md"
                  size="lg"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            
            {/* Optional pagination could go here */}
            {!loading && filteredProducts.length > 0 && (
              <div className="mt-16 flex justify-center">
                <Button variant="outline" className="text-[#0F172A] border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-8 py-6 rounded-xl font-bold shadow-sm">
                  Load More Products
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
