import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, Image as ImageIcon, Check, X, GripVertical, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function AdminHomepageContent() {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [brandingSection, setBrandingSection] = useState<any>({ imageUrl: '' });

  const [isDialogOp, setIsDialogOp] = useState(false);
  const [dialogType, setDialogType] = useState<string>('');
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [formData, setFormData] = useState<any>({});

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
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
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFormData((prev: any) => ({ ...prev, [fieldName]: dataUrl }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Sliders
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      b.sort((x: any, y: any) => (x.order || 0) - (y.order || 0));
      setBanners(b);
    });

    // Categories
    const unsubCats = onSnapshot(collection(db, 'homepageCategories'), (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      c.sort((x: any, y: any) => (x.order || 0) - (y.order || 0));
      setCategories(c);
    });

    // Festival Collections
    const unsubCols = onSnapshot(collection(db, 'homepageCollections'), (snapshot) => {
      const col = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      col.sort((x: any, y: any) => (x.order || 0) - (y.order || 0));
      setCollections(col);
    });

    // Branding Section
    const unsubBranding = onSnapshot(doc(db, 'settings', 'brandingImage'), (docSnap) => {
       if (docSnap.exists()) {
          setBrandingSection(docSnap.data());
       }
    });

    return () => { unsubBanners(); unsubCats(); unsubCols(); unsubBranding(); };
  }, []);

  const openDialog = (type: string, item?: any) => {
     setDialogType(type);
     setEditingItem(item || null);
     if (type === 'banner') {
       setFormData(item || { imageUrl: '', title: '', subtitle: '', ctaText: '', ctaLink: '', enabled: true, order: banners.length });
     } else if (type === 'category') {
       setFormData(item || { name: '', url: '', description: '', order: categories.length });
     } else if (type === 'collection') {
       setFormData(item || { title: '', sub: '', img: '', order: collections.length });
     }
     setIsDialogOp(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (dialogType === 'banner') {
         const id = editingItem ? editingItem.id : `b_${Date.now()}`;
         await setDoc(doc(db, 'banners', id), { ...formData, updatedAt: serverTimestamp() }, { merge: true });
      } else if (dialogType === 'category') {
         const id = editingItem ? editingItem.id : `c_${Date.now()}`;
         await setDoc(doc(db, 'homepageCategories', id), { ...formData, updatedAt: serverTimestamp() }, { merge: true });
      } else if (dialogType === 'collection') {
         const id = editingItem ? editingItem.id : `fc_${Date.now()}`;
         await setDoc(doc(db, 'homepageCollections', id), { ...formData, updatedAt: serverTimestamp() }, { merge: true });
      }
      setIsDialogOp(false);
      toast.success('Saved successfully');
    } catch (err) {
       toast.error('Failed to save');
    }
  };

  const handleDelete = async (col: string, id: string) => {
    if(confirm('Are you sure?')) {
       await deleteDoc(doc(db, col, id));
       toast.success('Deleted');
    }
  };

   const updateBrandingImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
       await setDoc(doc(db, 'settings', 'brandingImage'), { 
         imageUrl: data.get('imageUrl'),
         heading: data.get('heading'),
         subTitle: data.get('subTitle'),
         body: data.get('body')
       }, {merge: true});
       toast.success('Branding update saved');
    } catch (err) {
       toast.error('Error saving branding image');
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back to Dashboard</Link>
         </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold font-serif text-[#0F172A] tracking-tight">Homepage Content Management</h1>
        <p className="text-slate-500 mt-2">Manage sliders, categories, and promotional banners for the homepage.</p>
      </div>

      <Tabs defaultValue="sliders" className="w-full">
        <TabsList className="mb-6 border border-slate-200">
          <TabsTrigger value="sliders">Hero Sliders</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="collections">Festival Campaigns</TabsTrigger>
          <TabsTrigger value="branding">Corporate Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="sliders">
           <div className="flex justify-end mb-4">
              <Button onClick={() => openDialog('banner')} className="bg-[#0F172A] text-white hover:bg-slate-800"><Plus className="w-4 h-4 mr-2"/> Add Slider</Button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map(b => (
                 <div key={b.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <img 
                      src={b.imageUrl} 
                      className="h-48 w-full object-cover bg-slate-100" 
                      alt="Slider" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80";
                        if (target.src !== fallback) target.src = fallback;
                      }}
                    />
                    <div className="p-4 bg-white">
                       <h3 className="font-bold text-lg">{b.title}</h3>
                       <p className="text-sm text-slate-500 mb-2">{b.subtitle}</p>
                       <div className="flex justify-between items-center mt-4 border-t pt-4">
                          <Switch checked={b.enabled} onCheckedChange={(val) => setDoc(doc(db, 'banners', b.id), {enabled: val}, {merge:true})} />
                          <div className="space-x-2">
                             <Button variant="ghost" size="icon" onClick={() => openDialog('banner', b)}><Edit3 className="w-4 h-4"/></Button>
                             <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete('banners', b.id)}><Trash2 className="w-4 h-4"/></Button>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="categories">
           <div className="flex justify-end mb-4">
              <Button onClick={() => openDialog('category')} className="bg-[#0F172A] text-white hover:bg-slate-800"><Plus className="w-4 h-4 mr-2"/> Add Category</Button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map(c => (
                 <div key={c.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="h-40 w-full relative group">
                        <img 
                          src={c.url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80'} 
                          className="h-full w-full object-cover bg-slate-100" 
                          alt={c.name} 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallback = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80";
                            if (target.src !== fallback) target.src = fallback;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Button variant="secondary" onClick={() => openDialog('category', c)} className="mr-2 text-xs">Edit</Button>
                            <Button variant="destructive" onClick={() => handleDelete('homepageCategories', c.id)} className="text-xs">Delete</Button>
                        </div>
                    </div>
                    <div className="p-4 text-center">
                       <h3 className="font-bold text-[#0F172A]">{c.name}</h3>
                    </div>
                 </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="collections">
           <div className="flex justify-end mb-4">
              <Button onClick={() => openDialog('collection')} className="bg-[#0F172A] text-white hover:bg-slate-800"><Plus className="w-4 h-4 mr-2"/> Add Festival Campaign</Button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {collections.map(c => (
                 <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm relative group h-48">
                    <img 
                      src={c.img || 'https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80'} 
                      className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform group-hover:scale-105" 
                      alt={c.title} 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = "https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80";
                        if (target.src !== fallback) target.src = fallback;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                       <p className="text-[#FFB347] font-bold text-[10px] uppercase tracking-widest">{c.sub}</p>
                       <h3 className="font-serif font-bold text-white text-lg">{c.title}</h3>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/30 text-white" onClick={() => openDialog('collection', c)}><Edit3 className="w-3 h-3"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/10 hover:bg-red-500/80 text-white" onClick={() => handleDelete('homepageCollections', c.id)}><Trash2 className="w-3 h-3"/></Button>
                    </div>
                 </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="branding">
           <Card className="p-8 mt-4 border border-slate-200 shadow-sm rounded-3xl">
              <form onSubmit={updateBrandingImage} className="space-y-6">
                 <div>
                    <h3 className="text-xl font-bold font-serif mb-2">Personalization / Branding Image</h3>
                    <p className="text-sm text-slate-500">This image appears in the "Make it truly yours" corporate branding section on the homepage.</p>
                 </div>
                 
                 <div className="flex gap-8 items-start">
                    <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                           <Label>Image URL (Supports JPG, PNG, WEBP)</Label>
                           <Input name="imageUrl" defaultValue={brandingSection?.imageUrl || 'https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200'} className="h-12 rounded-xl" placeholder="https://" />
                        </div>
                        <div className="space-y-2">
                           <Label>Or Upload Corporate Branding Image (Recommended: 1200x800)</Label>
                           <Input type="file" accept="image/*" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                 const img = new Image();
                                 img.onload = () => {
                                   const canvas = document.createElement('canvas');
                                   // Resize logic
                                   const MAX_WIDTH = 1200;
                                   const MAX_HEIGHT = 1200;
                                   let width = img.width;
                                   let height = img.height;

                                   if (width > height) {
                                     if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                                   } else {
                                     if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                                   }
                                   canvas.width = width;
                                   canvas.height = height;
                                   const ctx = canvas.getContext('2d');
                                   ctx?.drawImage(img, 0, 0, width, height);
                                   
                                   const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                   const input = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
                                   if (input) {
                                     input.value = dataUrl;
                                     // Dispatch a change event if needed
                                     const event = new Event('input', { bubbles: true });
                                     input.dispatchEvent(event);
                                     
                                     // Use a hidden form element or direct update if state is preferred
                                     // Here we update the DOM directly so it correctly picks up during form submission
                                     setBrandingSection((prev: any) => ({ ...prev, imageUrl: dataUrl }));
                                   }
                                 };
                                 img.src = reader.result as string;
                               };
                               reader.readAsDataURL(file);
                             }
                           }} className="h-12 rounded-xl text-slate-500 pt-3" />
                        </div>
                        <div className="space-y-2">
                           <Label>Section Subtitle (e.g. Personalization Engine)</Label>
                           <Input name="subTitle" defaultValue={brandingSection?.subTitle || 'Personalization Engine'} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                           <Label>Headline (use &lt;span className="text-[#d4af37] italic"&gt;yours.&lt;/span&gt; for golden text)</Label>
                           <Input name="heading" defaultValue={brandingSection?.heading || 'Make it truly <span className="text-[#d4af37] italic">yours.</span>'} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                           <Label>Body Text</Label>
                           <textarea name="body" defaultValue={brandingSection?.body || 'Upload your corporate logo during checkout and visualize exactly how your gifts will look. We offer state-of-the-art laser engraving, UV printing, and embossing on all premium items.'} className="w-full h-32 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                        </div>
                        <Button type="submit" className="bg-[#d4af37] text-[#0F172A] hover:bg-[#F4C542] px-8 h-12 font-bold rounded-xl mt-4">Save Changes</Button>
                    </div>
                    <div className="w-1/3 bg-slate-100 rounded-2xl h-48 border overflow-hidden">
                        <img 
                          src={brandingSection?.imageUrl || 'https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200'} 
                          className="w-full h-full object-cover" 
                          alt="Branding"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallback = "https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200";
                            if (target.src !== fallback) target.src = fallback;
                          }}
                        />
                    </div>
                 </div>
              </form>
           </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOp} onOpenChange={setIsDialogOp}>
        <DialogContent className="bg-white">
           <DialogHeader>
              <DialogTitle>
                 {dialogType === 'banner' ? 'Manage Hero Slider' : dialogType === 'category' ? 'Manage Category' : 'Manage Festival Campaign'}
              </DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSave} className="space-y-4 py-4">
               {dialogType === 'banner' && (
                 <>
                   <div className="space-y-2">
                      <Label>Image URL or Upload File (Recommended: 1200x500 banner)</Label>
                      <div className="flex flex-col gap-2">
                        <Input value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl: e.target.value})} placeholder="https://" required />
                        <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageUrl')} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input value={formData.subtitle} onChange={e=>setFormData({...formData, subtitle: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input value={formData.ctaText} onChange={e=>setFormData({...formData, ctaText: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <Label>Redirect URL</Label>
                      <Input value={formData.ctaLink} onChange={e=>setFormData({...formData, ctaLink: e.target.value})} />
                   </div>
                 </>
               )}

               {dialogType === 'category' && (
                  <>
                   <div className="space-y-2">
                      <Label>Category Title</Label>
                      <Input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required />
                   </div>
                   <div className="space-y-2">
                      <Label>Image URL or Upload File (Recommended: 800x800 square)</Label>
                      <div className="flex flex-col gap-2">
                        <Input value={formData.url} onChange={e=>setFormData({...formData, url: e.target.value})} placeholder="https://" required />
                        <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'url')} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={formData.description || ''} onChange={e=>setFormData({...formData, description: e.target.value})} />
                   </div>
                  </>
               )}

               {dialogType === 'collection' && (
                  <>
                   <div className="space-y-2">
                      <Label>Campaign Title</Label>
                      <Input value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} required />
                   </div>
                   <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input value={formData.sub} onChange={e=>setFormData({...formData, sub: e.target.value})} required />
                   </div>
                   <div className="space-y-2">
                      <Label>Image URL or Upload File (Recommended: 800x1200 portrait)</Label>
                      <div className="flex flex-col gap-2">
                        <Input value={formData.img} onChange={e=>setFormData({...formData, img: e.target.value})} placeholder="https://" required />
                        <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'img')} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={formData.description || ''} onChange={e=>setFormData({...formData, description: e.target.value})} />
                   </div>
                  </>
               )}

               <DialogFooter>
                  <Button type="button" variant="outline" onClick={()=>setIsDialogOp(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
               </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Card = ({ children, className }: any) => <div className={className}>{children}</div>;
