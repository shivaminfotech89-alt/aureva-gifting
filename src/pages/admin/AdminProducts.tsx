import React, { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, deleteDoc, updateDoc, setDoc, deleteField, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { ProductData } from '../../components/shop/ProductCard';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, Image as ImageIcon, Database, Search, Download, Lock } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { ProductImportDialog, idForSku } from '../../components/admin/ProductImportDialog';
import { Link } from 'react-router-dom';

import { generateCatalogPDF } from '../../lib/catalogGenerator';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../lib/productImage';
import { ProductVariant, variantsOf, swatchColor, totalStock } from '../../lib/variants';

const EMPTY_FORM = {
  name: '', description: '', sku: '', basePrice: '', mrp: '', discountPercent: '', gstPercent: '18',
  stock: '', imageUrl: '', categoryId: '',
  smallLogoCharge: '', mediumLogoCharge: '', largeLogoCharge: '', fullWrapCharge: '',
  nameEngravingCharge: '', textPrintingCharge: '', customMessageCharge: '',
  minOrderQuantity: '', availabilityStatus: 'in_stock', estimatedProcurementTime: 'ready',
  supplierName: '', supplierContact: '', supplierNotes: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const setVariant = (i: number, patch: Partial<ProductVariant>) =>
    setVariants(vs => vs.map((v, n) => (n === i ? { ...v, ...patch } : v)));

  useEffect(() => {
    loadProducts();
    if (window.location.hash === '#new') {
      setIsDialogOpen(true);
    }
  }, []);

  /**
   * product_private is a new collection. Until firestore.rules is deployed
   * there is no rule for it, so every write is denied — which says nothing
   * useful to whoever is looking at the screen.
   */
  function supplierWriteHelp(error: any): string {
    if (error?.code === 'permission-denied') {
      return 'Supplier details could not be saved because the database rules are out of date. '
           + 'Run: firebase deploy --only firestore:rules';
    }
    return `Supplier details could not be saved: ${error?.message || 'unknown error'}`;
  }

  async function loadProducts() {

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      await moveSupplierDetailsOffPublicProducts(snapshot.docs);
      setProducts(snapshot.docs.map(d => {
        // The snapshot predates the migration above, so drop the field here
        // too rather than holding supplier data in the page's state.
        const { supplierInfo, ...rest } = d.data() as Record<string, unknown>;
        void supplierInfo;
        return { id: d.id, ...rest } as ProductData;
      }));
    } catch (error: any) {
      toast.error(`Could not load products: ${error?.message || 'unknown error'}`);
      console.error('product load failed', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Earlier versions of this form wrote supplierInfo onto the product itself,
   * and products are readable by anyone — so dealer names and costs were
   * public. Move any that remain into product_private the first time an admin
   * opens this page. Products no longer accept the field, so leaving one in
   * place would also make that product un-editable.
   */
  async function moveSupplierDetailsOffPublicProducts(docs: any[]) {
    const stale = docs.filter(d => d.data().supplierInfo);
    if (stale.length === 0) return;
    try {
      const CHUNK = 200; // two writes per product, and a batch caps at 500.
      for (let i = 0; i < stale.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const d of stale.slice(i, i + CHUNK)) {
          const info = d.data().supplierInfo || {};
          batch.set(doc(db, 'product_private', d.id), {
            supplierName: info.supplierName || '',
            contact: info.contact || '',
            notes: info.notes || '',
            lastPrice: typeof info.lastPrice === 'number' ? info.lastPrice : null,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          batch.update(doc(db, 'products', d.id), { supplierInfo: deleteField() });
        }
        await batch.commit();
      }
      toast.success(`Supplier details for ${stale.length} product${stale.length === 1 ? '' : 's'} are now admin-only.`);
    } catch (error: any) {
      toast.error(supplierWriteHelp(error));
      console.error('supplier migration failed', error);
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDownloadCatalog = async () => {
    setIsGeneratingCatalog(true);
    toast.info("Generating full catalog PDF...", { duration: 3000 });
    try {
      const activeProducts = products.filter(p => p.enabled);
      await generateCatalogPDF(activeProducts, "AUREVA CORPORATE CATALOG");
      toast.success("Catalog generated successfully!");
    } catch(e) {
      console.error(e);
      toast.error("Failed to generate catalog");
    } finally {
      setIsGeneratingCatalog(false);
    }
  };

  const downloadCSV = () => {
    let csvContent = "Product ID,Name,Description,Category,Base Price,Discount %,GST %,Stock,Status\n";
    
    products.forEach(function(p) {
      const row = [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.description.replace(/"/g, '""')}"`,
        `"${p.categoryId || 'Uncategorized'}"`,
        p.basePrice,
        p.discountPercent || 0,
        p.gstPercent,
        p.stock,
        p.enabled ? 'Active' : 'Disabled'
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "aureva_products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /**
   * Bulk publish, hide or delete. Writes go in batches of 400, under
   * Firestore's 500-per-batch limit, so a large selection cannot half-apply.
   */
  const applyBulk = async (action: 'publish' | 'hide' | 'delete') => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (action === 'delete' && !window.confirm(
      `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return;

    setBulkBusy(true);
    try {
      const CHUNK = 400;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const id of ids.slice(i, i + CHUNK)) {
          const ref = doc(db, 'products', id);
          if (action === 'delete') batch.delete(ref);
          else batch.update(ref, { enabled: action === 'publish', updatedAt: serverTimestamp() });
        }
        await batch.commit();
      }
      const verb = action === 'delete' ? 'Deleted' : action === 'publish' ? 'Published' : 'Hidden';
      toast.success(`${verb} ${ids.length} product${ids.length === 1 ? '' : 's'}.`);
      setSelectedIds(new Set());
      loadProducts();
    } catch (error: any) {
      toast.error(`Bulk ${action} failed: ${error?.message || 'unknown error'}`);
      console.error('bulk action failed', error);
    } finally {
      setBulkBusy(false);
    }
  };

  /**
   * The same item entered twice is two products in the shop and two answers to
   * "how many do we have". Adding by hand always minted a fresh id, so nothing
   * stopped it. Match on the product code first, since that is the dealer's own
   * identifier, then on the name.
   */
  const duplicateOf = (): ProductData | null => {
    const sku = formData.sku.trim().toLowerCase();
    const name = formData.name.trim().toLowerCase();
    for (const p of products) {
      if (p.id === editingId) continue;
      if (sku && (p.sku || '').trim().toLowerCase() === sku) return p;
      if (sku && variantsOf(p).some(v => (v.sku || '').trim().toLowerCase() === sku)) return p;
      if (!sku && name && p.name.trim().toLowerCase() === name) return p;
    }
    return null;
  };

  /**
   * Extra copies already sitting in the inventory: products sharing a dealer
   * code, or sharing a name when they have no code. The first of each group is
   * kept, the rest are the copies. Nothing is deleted here — this only selects
   * them, so they can be looked at before the bulk delete.
   */
  const duplicateIds = React.useMemo(() => {
    const firstSeen = new Map<string, string>();
    const extras: string[] = [];
    for (const p of products) {
      const key = (p.sku || '').trim().toLowerCase() || `name:${p.name.trim().toLowerCase()}`;
      if (key === 'name:') continue;
      if (firstSeen.has(key)) extras.push(p.id);
      else firstSeen.set(key, p.id);
    }
    return extras;
  }, [products]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const clash = duplicateOf();
    if (clash) {
      const why = formData.sku.trim()
        ? `Product code "${formData.sku.trim()}" already belongs to "${clash.name}".`
        : `A product named "${clash.name}" already exists.`;
      toast.error(`${why} Edit that product instead of adding it again.`);
      return;
    }

    try {
      const productPayload = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku.trim(),
        basePrice: Number(formData.basePrice),
        mrp: formData.mrp ? Number(formData.mrp) : 0,
        discountPercent: formData.discountPercent ? Number(formData.discountPercent) : 0,
        gstPercent: Number(formData.gstPercent),
        stock: Number(formData.stock),
        images: formData.imageUrl ? [formData.imageUrl] : [],
        categoryId: formData.categoryId || 'Uncategorized',
        smallLogoCharge: formData.smallLogoCharge ? Number(formData.smallLogoCharge) : 0,
        mediumLogoCharge: formData.mediumLogoCharge ? Number(formData.mediumLogoCharge) : 0,
        largeLogoCharge: formData.largeLogoCharge ? Number(formData.largeLogoCharge) : 0,
        fullWrapCharge: formData.fullWrapCharge ? Number(formData.fullWrapCharge) : 0,
        nameEngravingCharge: formData.nameEngravingCharge ? Number(formData.nameEngravingCharge) : 0,
        textPrintingCharge: formData.textPrintingCharge ? Number(formData.textPrintingCharge) : 0,
        customMessageCharge: formData.customMessageCharge ? Number(formData.customMessageCharge) : 0,
        minOrderQuantity: formData.minOrderQuantity ? Number(formData.minOrderQuantity) : 1,
        availabilityStatus: formData.availabilityStatus || 'in_stock',
        estimatedProcurementTime: formData.estimatedProcurementTime || 'ready',
        // Colour options. Blank rows are dropped rather than saved as
        // unlabelled buttons in the shop.
        variants: variants
          .filter(v => v.color.trim() !== '')
          .map(v => ({
            color: v.color.trim(),
            sku: (v.sku || '').trim(),
            stock: Number(v.stock) || 0,
            image: (v.image || '').trim(),
          })),
        // Who we buy from and at what price is deliberately absent: products
        // are readable by anyone. It goes to product_private below.
        enabled: true,
      };

      const supplierPayload = {
        supplierName: formData.supplierName.trim(),
        contact: formData.supplierContact.trim(),
        notes: formData.supplierNotes.trim(),
        updatedAt: serverTimestamp(),
      };

      // Give a hand-added product the same id an import would give it, so the
      // two paths agree on identity and importing the dealer's file later
      // updates this product rather than adding a second copy of it.
      const fromSku = idForSku(formData.sku);
      const productId = editingId
        || (fromSku && !products.some(p => p.id === fromSku) ? fromSku : `prod-${Date.now()}`);
      if (editingId) {
        await updateDoc(doc(db, 'products', productId), {
          ...productPayload,
          // Clears the copy older versions of this form wrote onto the public
          // document. deleteField needs update or a merging set, so it cannot
          // sit in the payload the create path uses.
          supplierInfo: deleteField(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'products', productId), {
          ...productPayload,
          createdAt: serverTimestamp(),
        });
      }
      // The product itself is saved by this point. A rules deploy that has not
      // happened yet must not read as "the product did not save".
      try {
        await setDoc(doc(db, 'product_private', productId), supplierPayload, { merge: true });
      } catch (error: any) {
        toast.warning(supplierWriteHelp(error));
      }
      toast.success(editingId ? 'Product updated successfully' : 'Product created successfully');
      
      setFormData(EMPTY_FORM);
      setVariants([]);
      setEditingId(null);
      setIsDialogOpen(false);
      loadProducts();
    } catch (error: any) {
      // Surface the reason. handleFirestoreError throws, so calling it bare
      // from a catch block loses the error entirely.
      const why = error?.code === 'permission-denied'
        ? 'You do not have permission, or a field failed validation. Check that name, price, GST and stock are filled in.'
        : (error?.message || 'Unknown error');
      toast.error(`Could not save the product: ${why}`);
      console.error('product save failed', error);
    }
  };

  const openEditDialog = async (product: ProductData) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      sku: product.sku || '',
      basePrice: product.basePrice.toString(),
      mrp: product.mrp ? product.mrp.toString() : '',
      discountPercent: product.discountPercent ? product.discountPercent.toString() : '',
      gstPercent: product.gstPercent.toString(),
      stock: product.stock.toString(),
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : '',
      categoryId: product.categoryId || '',
      smallLogoCharge: product.smallLogoCharge ? product.smallLogoCharge.toString() : '',
      mediumLogoCharge: product.mediumLogoCharge ? product.mediumLogoCharge.toString() : '',
      largeLogoCharge: product.largeLogoCharge ? product.largeLogoCharge.toString() : '',
      fullWrapCharge: product.fullWrapCharge ? product.fullWrapCharge.toString() : '',
      nameEngravingCharge: product.nameEngravingCharge ? product.nameEngravingCharge.toString() : '',
      textPrintingCharge: product.textPrintingCharge ? product.textPrintingCharge.toString() : '',
      customMessageCharge: product.customMessageCharge ? product.customMessageCharge.toString() : '',
      minOrderQuantity: product.minOrderQuantity ? product.minOrderQuantity.toString() : '',
      availabilityStatus: product.availabilityStatus || 'in_stock',
      estimatedProcurementTime: product.estimatedProcurementTime || 'ready',
      supplierName: '', supplierContact: '', supplierNotes: '',
    });
    setVariants(variantsOf(product).map(v => ({ ...v })));
    setIsDialogOpen(true);

    // Supplier details live in a collection customers cannot read, so they
    // arrive a moment after the rest of the form.
    try {
      const snap = await getDoc(doc(db, 'product_private', product.id));
      if (!snap.exists()) return;
      const info = snap.data() as { supplierName?: string; contact?: string; notes?: string };
      setFormData(current => ({
        ...current,
        supplierName: info.supplierName || '',
        supplierContact: info.contact || '',
        supplierNotes: info.notes || '',
      }));
    } catch (error: any) {
      toast.error(`Could not load supplier details: ${error?.message || 'unknown error'}`);
    }
  };


  const toggleEnabled = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { enabled: !current });
      setProducts(products.map(p => p.id === id ? { ...p, enabled: !current } : p));
      toast.success(current ? 'Product disabled' : 'Product enabled');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const seedProducts = async () => {
    const sampleProducts = [
      {
        id: 'sample-1',
        name: 'Executive Leather Briefcase',
        description: 'Premium full-grain leather briefcase perfect for executives.',
        basePrice: 12500,
        gstPercent: 18,
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'],
        stock: 50,
        enabled: true,
        categoryId: 'Bags',
        createdAt: serverTimestamp(),
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
        categoryId: 'Stationery',
        createdAt: serverTimestamp(),
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
        categoryId: 'Hampers',
        createdAt: serverTimestamp(),
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
        categoryId: 'Electronics',
        createdAt: serverTimestamp(),
      }
    ];

    try {
      setLoading(true);
      for (const p of sampleProducts) {
        await setDoc(doc(db, 'products', p.id), p);
      }
      toast.success('Sample products seeded successfully!');
      loadProducts();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back</Link>
         </Button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-serif text-[#0F172A]">Inventory & Products</h1>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-white border border-slate-200 rounded-xl px-4 py-2 w-full md:w-72 shadow-sm focus-within:border-[#d4af37] focus-within:ring-1 focus-within:ring-[#d4af37] transition-all">
             <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
             <input 
               className="bg-transparent border-none outline-none text-sm w-full text-[#0F172A] placeholder:text-slate-400" 
               placeholder="Search products..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <Button variant="outline" onClick={downloadCSV} className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={handleDownloadCatalog} disabled={isGeneratingCatalog} className="gap-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 hover:text-amber-700 rounded-xl h-10 shadow-sm font-bold">
            {isGeneratingCatalog ? (
              <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            )}
            Download PDF
          </Button>
          <ProductImportDialog onImported={loadProducts} />
          <Button variant="outline" onClick={seedProducts} className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
            <Database className="h-4 w-4" /> Seed Products
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData(EMPTY_FORM);
              setVariants([]);
            }
          }}>
            <DialogTrigger render={<Button className="gap-2 bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] font-bold rounded-xl h-10 shadow-sm" />}>
              <Plus className="h-5 w-5" /> Add Product
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProduct} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Input id="categoryId" placeholder="e.g. Hampers, Electronics" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sku">Product Code</Label>
                  <Input id="sku" placeholder="e.g. AC15948121-1" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  <p className="text-[11px] text-slate-500">
                    The dealer's catalog code. Shown to customers and included in every WhatsApp inquiry.
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="basePrice">Corporate Price (₹)</Label>
                    <Input id="basePrice" type="number" min="0" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} required />
                    <p className="text-[11px] text-slate-500">What you charge. This is the price customers pay.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input id="mrp" type="number" min="0" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} />
                    <p className="text-[11px] text-slate-500">Printed list price. Shown struck through when higher than the corporate price. Leave blank to hide it.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discountPercent">Discount (%)</Label>
                    <Input id="discountPercent" type="number" min="0" max="100" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gstPercent">GST (%)</Label>
                    <Input id="gstPercent" type="number" min="0" max="100" value={formData.gstPercent} onChange={e => setFormData({...formData, gstPercent: e.target.value})} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock Qty</Label>
                    <Input id="stock" type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                  </div>
                </div>
                
                <Label className="mt-2 text-sm font-semibold border-b pb-1">Logo Printing Customization Charges</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/30 p-3 rounded-lg border">
                  <div className="grid gap-2">
                    <Label htmlFor="smallLogoCharge">Small Logo (₹)</Label>
                    <Input id="smallLogoCharge" type="number" min="0" placeholder="e.g. 50" value={formData.smallLogoCharge} onChange={e => setFormData({...formData, smallLogoCharge: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mediumLogoCharge">Medium Logo (₹)</Label>
                    <Input id="mediumLogoCharge" type="number" min="0" placeholder="e.g. 100" value={formData.mediumLogoCharge} onChange={e => setFormData({...formData, mediumLogoCharge: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="largeLogoCharge">Large Logo (₹)</Label>
                    <Input id="largeLogoCharge" type="number" min="0" placeholder="e.g. 150" value={formData.largeLogoCharge} onChange={e => setFormData({...formData, largeLogoCharge: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fullWrapCharge">Full Wrap (₹)</Label>
                    <Input id="fullWrapCharge" type="number" min="0" placeholder="e.g. 250" value={formData.fullWrapCharge} onChange={e => setFormData({...formData, fullWrapCharge: e.target.value})} />
                  </div>
                </div>

                <Label className="mt-2 text-sm font-semibold border-b pb-1">Text/Name Branding Charges</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-3 rounded-lg border">
                  <div className="grid gap-2">
                    <Label htmlFor="nameEngravingCharge">Name Engraving (₹)</Label>
                    <Input id="nameEngravingCharge" type="number" min="0" placeholder="e.g. 60" value={formData.nameEngravingCharge} onChange={e => setFormData({...formData, nameEngravingCharge: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="textPrintingCharge">Text Printing (₹)</Label>
                    <Input id="textPrintingCharge" type="number" min="0" placeholder="e.g. 40" value={formData.textPrintingCharge} onChange={e => setFormData({...formData, textPrintingCharge: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customMessageCharge">Custom Message (₹)</Label>
                    <Input id="customMessageCharge" type="number" min="0" placeholder="e.g. 20" value={formData.customMessageCharge} onChange={e => setFormData({...formData, customMessageCharge: e.target.value})} />
                  </div>
                </div>

                <Label className="mt-2 text-sm font-semibold border-b pb-1">Color Options</Label>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[11px] text-slate-500">
                    Use these when the same item comes in several colors. Customers see one product
                    and pick a color; each color keeps its own dealer code, stock and photo.
                    Leave empty for a single-color product.
                  </p>
                  {variants.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {variants.map((v, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr_1fr_90px_auto] items-center gap-2">
                          <span
                            className="h-6 w-6 shrink-0 rounded-full border border-slate-300"
                            style={{ backgroundColor: swatchColor(v.color || '') }}
                            title={v.color || 'No color name'}
                          />
                          <Input
                            aria-label={`Color name ${i + 1}`}
                            placeholder="Color, e.g. Navy Blue"
                            value={v.color}
                            onChange={e => setVariant(i, { color: e.target.value })}
                          />
                          <Input
                            aria-label={`Product code for color ${i + 1}`}
                            placeholder="Product code"
                            value={v.sku || ''}
                            onChange={e => setVariant(i, { sku: e.target.value })}
                          />
                          <Input
                            aria-label={`Stock for color ${i + 1}`}
                            type="number"
                            min="0"
                            placeholder="Stock"
                            value={v.stock ?? 0}
                            onChange={e => setVariant(i, { stock: Number(e.target.value) })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove color ${v.color || i + 1}`}
                            className="h-9 w-9 text-red-500 hover:bg-red-50"
                            onClick={() => setVariants(vs => vs.filter((_, n) => n !== i))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <span />
                          <Input
                            aria-label={`Photo for color ${i + 1}`}
                            className="col-span-3"
                            placeholder="Photo URL for this color, e.g. /products/nexon/code.jpg"
                            value={v.image || ''}
                            onChange={e => setVariant(i, { image: e.target.value })}
                          />
                          <span />
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={() => setVariants(vs => [...vs, { color: '', sku: '', stock: 0, image: '' }])}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add a color
                  </Button>
                </div>

                <Label className="mt-2 text-sm font-semibold border-b pb-1">Supplier &amp; MOQ Settings</Label>
                <p className="-mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="h-3 w-3" />
                  Dealer name, contact and notes are visible to admins only. Customers never see them.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border">
                  <div className="grid gap-2">
                    <Label htmlFor="minOrderQuantity">Min Order Quantity</Label>
                    <Input id="minOrderQuantity" type="number" min="1" placeholder="e.g. 10" value={formData.minOrderQuantity} onChange={e => setFormData({...formData, minOrderQuantity: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="availabilityStatus">Availability</Label>
                    <select id="availabilityStatus" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.availabilityStatus} onChange={e => setFormData({...formData, availabilityStatus: e.target.value})}>
                      <option value="in_stock">In Stock</option>
                      <option value="available_on_request">Available on Request</option>
                      <option value="bulk_only">Bulk Order Only</option>
                      <option value="custom_production">Custom Production</option>
                      <option value="temporarily_unavailable">Temporarily Unavailable</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedProcurementTime">Procurement Time</Label>
                    <select id="estimatedProcurementTime" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.estimatedProcurementTime} onChange={e => setFormData({...formData, estimatedProcurementTime: e.target.value})}>
                      <option value="ready">Ready to Dispatch</option>
                      <option value="2_3_days">2-3 Days</option>
                      <option value="5_7_days">5-7 Days</option>
                      <option value="7_10_days">7-10 Days</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplierName">Dealer / Supplier Name</Label>
                    <Input id="supplierName" placeholder="e.g. Nexon Gifts" value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplierContact">Supplier Contact</Label>
                    <Input id="supplierContact" placeholder="Contact Details" value={formData.supplierContact} onChange={e => setFormData({...formData, supplierContact: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplierNotes">Procurement Notes</Label>
                    <Input id="supplierNotes" placeholder="Your buying cost, backup dealer..." value={formData.supplierNotes} onChange={e => setFormData({...formData, supplierNotes: e.target.value})} />
                  </div>
                </div>

                <div className="grid gap-2 mt-2">
                  <Label htmlFor="imageFile">Upload Image</Label>
                  <Input 
                    id="imageFile" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 800;
                            const MAX_HEIGHT = 800;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);
                            // Compress image
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            setFormData({...formData, imageUrl: dataUrl});
                          };
                          img.src = reader.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  <div className="relative flex items-center py-2">
                    <span className="flex-grow border-t border-border"></span>
                    <span className="flex-shrink-0 mx-2 text-muted-foreground text-xs uppercase">Or use URL</span>
                    <span className="flex-grow border-t border-border"></span>
                  </div>
                  <Input 
                    id="imageUrl" 
                    placeholder="https://images.unsplash.com/..." 
                    value={formData.imageUrl && !formData.imageUrl.startsWith('data:') ? formData.imageUrl : ''} 
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                  />
                  {formData.imageUrl && (
                     <div className="mt-2 h-20 w-20 rounded-md overflow-hidden border border-border">
                       <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                     </div>
                  )}
                </div>
                <Button type="submit" className="mt-4">Save Product</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
        <div className="overflow-x-auto">
          {duplicateIds.length > 0 && selectedIds.size === 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3">
              <span className="text-sm text-amber-900">
                <strong>{duplicateIds.length} possible duplicate{duplicateIds.length === 1 ? '' : 's'}</strong>
                {' '}— more than one product shares the same product code or name.
              </span>
              <button
                onClick={() => setSelectedIds(new Set(duplicateIds))}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
              >
                Select them
              </button>
            </div>
          )}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-[#d4af37]/10 px-6 py-3">
              <span className="text-sm font-bold text-[#0F172A]">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-semibold text-slate-500 underline hover:text-[#0F172A]"
              >
                Clear
              </button>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={bulkBusy}
                  onClick={() => applyBulk('publish')}
                  className="rounded-lg border-slate-300 bg-white font-semibold">
                  Show in shop
                </Button>
                <Button size="sm" variant="outline" disabled={bulkBusy}
                  onClick={() => applyBulk('hide')}
                  className="rounded-lg border-slate-300 bg-white font-semibold">
                  Hide
                </Button>
                <Button size="sm" variant="outline" disabled={bulkBusy}
                  onClick={() => applyBulk('delete')}
                  className="rounded-lg border-red-200 bg-white font-semibold text-red-600 hover:bg-red-50">
                  {bulkBusy ? 'Working...' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC] border-b border-slate-100">
              <tr>
                <th className="px-4 py-5 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all products shown"
                    className="h-4 w-4 accent-[#d4af37] cursor-pointer"
                    checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id))}
                    onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredProducts.map(p => p.id)) : new Set())}
                  />
                </th>
                <th className="px-6 py-5 font-medium">Product</th>
                <th className="px-6 py-5 font-medium">Category</th>
                <th className="px-6 py-5 font-medium">Base Price</th>
                <th className="px-6 py-5 font-medium">Stock</th>
                <th className="px-6 py-5 font-medium">Status</th>
                <th className="px-6 py-5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No products found.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className={`transition-colors ${selectedIds.has(product.id) ? 'bg-[#d4af37]/5' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-4 py-5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${product.name}`}
                        className="h-4 w-4 accent-[#d4af37] cursor-pointer"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelected(product.id)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name} 
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              onError={(e) => {
                                // Falling back to a stock photo made a broken
                                // image look like a real product.
                                (e.target as HTMLImageElement).src = PRODUCT_IMAGE_PLACEHOLDER;
                              }}
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="max-w-[200px]">
                          <div className="font-bold text-[#0F172A] line-clamp-2 leading-snug">{product.name}</div>
                          {product.sku && (
                            <div className="mt-0.5 text-[11px] text-slate-500">Code {product.sku}</div>
                          )}
                          {variantsOf(product).length > 1 && (
                            <div className="mt-1 flex items-center gap-1">
                              {variantsOf(product).slice(0, 5).map(v => (
                                <span
                                  key={v.color}
                                  title={v.color}
                                  className="h-2.5 w-2.5 rounded-full border border-slate-300"
                                  style={{ backgroundColor: swatchColor(v.color) }}
                                />
                              ))}
                              <span className="ml-0.5 text-[10px] text-slate-500">
                                {variantsOf(product).length} colors
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-[#0F172A]/5 text-[#0F172A] border border-slate-200 font-medium px-3 py-1.5 rounded-md text-xs">{product.categoryId || 'Uncategorized'}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap font-bold text-[#0F172A]">{formatCurrency(product.basePrice)}</td>
                    <td className="px-6 py-5">
                      {(() => {
                        // With colours, the row shows the total across them.
                        const s = totalStock(product);
                        return (
                          <span className={`px-3 py-1.5 rounded-md text-xs font-bold border shadow-sm ${s > 10 ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : s > 0 ? 'bg-amber-100/50 text-amber-700 border-amber-200' : 'bg-red-500/10 text-red-600 border-red-200'}`}>
                            {s} in stock
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5">
                       <button onClick={() => toggleEnabled(product.id, product.enabled)} className={`px-3 py-1.5 rounded-md border shadow-sm text-xs font-bold tracking-wider uppercase transition-colors ${product.enabled ? 'bg-[#d4af37]/10 text-[#b49124] border-[#d4af37]/20 hover:bg-[#d4af37]/20' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
                        {product.enabled ? 'Visible in shop' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#0F172A]" onClick={() => openEditDialog(product)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 hover:border hover:border-red-100" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
