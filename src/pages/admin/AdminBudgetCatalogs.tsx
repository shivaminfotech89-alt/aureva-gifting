import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Download, RefreshCw, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { generateCatalogPDF } from '../../lib/catalogGenerator';
import { toast } from 'sonner';

export default function AdminBudgetCatalogs() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const budgetRanges = [
    { label: 'Under ₹100', value: '0-100', min: 0, max: 100 },
    { label: '₹100 - ₹250', value: '100-250', min: 100, max: 250 },
    { label: '₹250 - ₹500', value: '250-500', min: 250, max: 500 },
    { label: '₹500 - ₹1000', value: '500-1000', min: 500, max: 1000 },
    { label: 'Above ₹1000', value: '1000-9999999', min: 1000, max: 9999999 }
  ];

  useEffect(() => {
    async function loadProducts() {
      try {
        const q = query(collection(db, 'products'), where('enabled', '==', true));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products for catalog", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleGenerate = async (range: any) => {
    setIsGenerating(true);
    toast.info(`Generating catalog for ${range.label}...`);
    try {
      const filtered = products.filter(p => p.basePrice >= range.min && p.basePrice <= range.max);
      if (filtered.length === 0) {
        toast.error(`No products found in budget range ${range.label}`);
        return;
      }
      await generateCatalogPDF(filtered, "AUREVA CORPORATE CATALOG", undefined, range.label);
      toast.success("Catalog generated successfully!");
    } catch(e) {
      console.error(e);
      toast.error("Failed to generate catalog");
    } finally {
      setIsGenerating(false);
    }
  };

  const productCounts = budgetRanges.map(range => ({
    ...range,
    count: products.filter(p => p.basePrice >= range.min && p.basePrice <= range.max).length
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Budget Catalogs</h1>
        <p className="text-slate-500 text-sm mt-1">Configure and generate catalogs based on budget slabs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center text-slate-500">
             <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading catalogs...
          </div>
        ) : (
          productCounts.map(range => (
            <div key={range.value} className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]"></div>
              
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{range.label}</h2>
                  <p className="text-sm text-slate-500 mt-1">Standalone budget catalog</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">Products in Range</div>
                <div className="text-2xl font-bold text-slate-900">
                  {range.count} <span className="text-sm text-slate-500 font-normal ml-1">items available</span>
                </div>
              </div>

              <div className="mt-auto">
                <Button 
                  onClick={() => handleGenerate(range)}
                  disabled={isGenerating || range.count === 0}
                  className="w-full h-11 bg-slate-900 text-white hover:bg-[#d4af37] hover:text-slate-900 font-bold tracking-wide rounded-xl transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate PDF"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
