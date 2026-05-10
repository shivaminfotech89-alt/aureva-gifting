import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { ProductData } from '../../components/shop/ProductCard';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Plus, Edit, Trash2, Image as ImageIcon, Database, Search } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', basePrice: '', gstPercent: '18', stock: '', imageUrl: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductData)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productPayload = {
        name: formData.name,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        gstPercent: Number(formData.gstPercent),
        stock: Number(formData.stock),
        images: formData.imageUrl ? [formData.imageUrl] : [],
        enabled: true,
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), { 
          ...productPayload, 
          updatedAt: serverTimestamp() 
        });
        toast.success('Product updated successfully');
      } else {
        const newId = `prod-${Date.now()}`;
        await setDoc(doc(db, 'products', newId), {
          ...productPayload,
          createdAt: serverTimestamp(),
        });
        toast.success('Product created successfully');
      }
      
      setFormData({ name: '', description: '', basePrice: '', gstPercent: '18', stock: '', imageUrl: '' });
      setEditingId(null);
      setIsDialogOpen(false);
      loadProducts();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const openEditDialog = (product: ProductData) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      basePrice: product.basePrice.toString(),
      gstPercent: product.gstPercent.toString(),
      stock: product.stock.toString(),
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : ''
    });
    setIsDialogOpen(true);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Products</h1>
        
        <div className="flex bg-background border border-border rounded-md px-3 py-2 w-full md:w-64">
           <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
           <input 
             className="bg-transparent border-none outline-none text-sm w-full" 
             placeholder="Search products..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={seedProducts} className="gap-2">
            <Database className="h-4 w-4" /> Seed Products
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({ name: '', description: '', basePrice: '', gstPercent: '18', stock: '', imageUrl: '' });
            }
          }}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" /> Add Product
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProduct} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="basePrice">Base Price (₹)</Label>
                    <Input id="basePrice" type="number" min="0" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} required />
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
                <div className="grid gap-2">
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

      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Base Price</th>
                <th className="px-6 py-4 font-medium">GST %</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No products found.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="font-medium text-foreground line-clamp-2">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(product.basePrice)}</td>
                    <td className="px-6 py-4">{product.gstPercent}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-destructive/10 text-destructive'}`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <button onClick={() => toggleEnabled(product.id, product.enabled)} className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${product.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                        {product.enabled ? 'Active' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(product)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
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
