import React, { useEffect, useState, useMemo } from 'react';
import { useSeo } from '../hooks/useSeo';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductCard, ProductData } from '../components/shop/ProductCard';
import { Input } from '../components/ui/input';
import { Search, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedBudget = searchParams.get('budget') || 'All';
  const [sortBy, setSortBy] = useState<string>('featured');
  // How many cards are on screen. 544 products at once is a lot of DOM.
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filter Panel Mobile State
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const startCatalogDownloadProcess = () => {
    window.dispatchEvent(new Event('openCatalogModal'));
  };


  const setSearchQuery = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set('q', val);
    else params.delete('q');
    setSearchParams(params, { replace: true });
  };

  const setSelectedCategory = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val && val !== 'All') params.set('category', val);
    else params.delete('category');
    setSearchParams(params, { replace: true });
  };
  
  const setSelectedBudget = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val && val !== 'All') params.set('budget', val);
    else params.delete('budget');
    setSearchParams(params, { replace: true });
  };

  useSeo({
    title: selectedCategory !== 'All'
      ? `${selectedCategory} — Corporate Gifts in Bulk`
      : 'Shop Corporate Gifts in Bulk | Ahmedabad',
    description: selectedCategory !== 'All'
      ? `Bulk ${selectedCategory.toLowerCase()} for corporate gifting, branded with your logo. Shipped across India from Ahmedabad, with GST invoice and quotation on request.`
      : 'Browse corporate gifts in bulk — diaries, drinkware, bags, pens and premium gift sets, branded with your logo. Shipped across India from Ahmedabad.',
    // Must match the URL in the sitemap. Falling back to window.location.pathname
    // would canonicalise every category to plain /shop, and Google would drop
    // all 43 category pages as duplicates of it.
    path: selectedCategory !== 'All'
      ? `/shop?category=${encodeURIComponent(selectedCategory)}`
      : '/shop',
  });

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

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, selectedCategory, selectedBudget, sortBy]);

  const budgetRanges = [
    { label: 'All Budgets', value: 'All' },
    { label: 'Under ₹100', value: '0-100' },
    { label: '₹100 - ₹250', value: '100-250' },
    { label: '₹250 - ₹500', value: '250-500' },
    { label: '₹500 - ₹1000', value: '500-1000' },
    { label: 'Above ₹1000', value: '1000-9999999' }
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

    const createdMs = (p: any) => {
      const c = p.createdAt;
      if (!c) return 0;
      if (typeof c.toMillis === 'function') return c.toMillis();
      if (typeof c.seconds === 'number') return c.seconds * 1000;
      const n = Number(c);
      return Number.isFinite(n) ? n : 0;
    };

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
        // Newest first. Firestore returns documents in document-id order, so
        // without this a newly added product lands wherever its id happens to
        // sort - which with a large catalog means it is never seen.
        result.sort((a, b) => createdMs(b) - createdMs(a));
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedBudget, sortBy]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Premium Hero Banner */}
      <div className="bg-[var(--navy-800)] text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--navy-800)] via-[var(--navy-800)]/90 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2640&auto=format&fit=crop" 
            alt="Premium Gifts" 
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2640&auto=format&fit=crop";
            }}
          />
        </div>
        <div className="container relative z-10 mx-auto max-w-[80rem] px-4 pb-12 pt-28 md:pb-14 md:pt-32">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-[1.75rem] md:text-[2.25rem] font-bold font-display mb-6 text-white leading-tight">
              Curated Corporate <br/><span className="text-[var(--gold-500)] italic">Collections</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-xl font-light mb-8">
              Explore our range of premium gifting collections. Designed to impress, built to last, and customized to perfection.
            </p>
            <button 
              onClick={startCatalogDownloadProcess} 
              className="inline-flex items-center justify-center font-bold tracking-wide text-sm md:text-base px-6 py-3 rounded-md bg-[var(--gold-500)] text-[var(--navy-800)] hover:bg-[var(--gold-400)] transition-all duration-300 gap-2 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Download Catalog
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:px-8 max-w-[1600px]">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24">
              
              {/* Mobile Toggle */}
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between lg:hidden font-display font-bold text-lg text-[var(--navy-800)]"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[var(--gold-500)]" />
                  Filters & Categories
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Filter Content */}
              <div className={`mt-6 space-y-8 lg:block ${isFilterOpen ? 'block' : 'hidden'}`}>
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-[var(--navy-800)] flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Search className="w-4 h-4 text-[var(--gold-500)]" /> Find Gifts
                  </h3>
                  <Input 
                    placeholder="Search collections..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border-slate-200 focus-visible:ring-[var(--gold-500)] rounded-xl"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-[var(--navy-800)] flex items-center gap-2 border-b border-slate-100 pb-2">
                    <SlidersHorizontal className="w-4 h-4 text-[var(--gold-500)]" /> Categories
                  </h3>
                  <div className="space-y-1.5 flex flex-col">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsFilterOpen(false); // Close mobile menu on select
                        }}
                        className={`text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-between group ${
                          selectedCategory === cat 
                            ? 'bg-[var(--gold-500)]/10 text-[var(--navy-800)] font-bold border border-[var(--gold-500)]/20 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--navy-800)] border border-transparent'
                        }`}
                      >
                        <span>{cat}</span>
                        {selectedCategory === cat && <Check className="w-4 h-4 text-[var(--gold-500)]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-[var(--navy-800)] border-b border-slate-100 pb-2">Budget Range</h3>
                  <div className="space-y-1.5 flex flex-col">
                    {budgetRanges.map(range => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setSelectedBudget(range.value);
                          setIsFilterOpen(false); // Close mobile menu on select
                        }}
                        className={`text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
                          selectedBudget === range.value 
                            ? 'bg-[var(--gold-500)]/10 text-[var(--navy-800)] font-bold border border-[var(--gold-500)]/20 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--navy-800)] border border-transparent'
                        }`}
                      >
                        <span>{range.label}</span>
                        {selectedBudget === range.value && <Check className="w-4 h-4 text-[var(--gold-500)]" />}
                      </button>
                    ))}
                  </div>
                </div>
                
                {(selectedCategory !== 'All' || selectedBudget !== 'All' || searchQuery) && (
                  <div className="pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-slate-200 text-slate-600 hover:text-[var(--navy-800)] hover:bg-slate-50 shadow-sm h-11 font-bold"
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
          </div>

          {/* Product Grid Area */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-sm text-slate-500 font-medium">
                Showing <span className="text-[var(--navy-800)] font-bold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'result' : 'results'}
              </p>
              
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium tracking-wide">Sort by:</span>
                  <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 text-sm font-bold text-[var(--navy-800)] bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:border-[var(--gold-500)] focus:ring-2 focus:ring-[var(--gold-500)]/20 outline-none transition-all"
                  >
                    {sortOptions.find(o => o.value === sortBy)?.label}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {isSortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 p-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all font-medium ${
                          sortBy === option.value ? 'bg-[var(--gold-500)]/10 text-[var(--navy-800)] font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--navy-800)]'
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
                  <div key={n} className="h-[400px] rounded-xl bg-slate-100 animate-pulse border border-slate-200"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
                <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-100 shadow-sm">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3 text-[var(--navy-800)]">No products found</h2>
                <p className="text-slate-500 max-w-md text-lg">Try adjusting your filters or search query to find what you're looking for.</p>
                <Button 
                  className="mt-8 bg-[var(--navy-800)] text-white hover:bg-slate-800 rounded-xl h-12 px-8 font-bold shadow-md"
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
                {filteredProducts.slice(0, visibleCount).map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            
            {!loading && filteredProducts.length > 0 && (
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-sm text-slate-500">
                  Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} products
                </p>
                {visibleCount < filteredProducts.length && (
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    className="rounded-xl border-slate-200 px-8 py-6 font-bold text-[var(--navy-800)] shadow-sm hover:border-slate-300 hover:bg-slate-50"
                  >
                    Load more products
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
