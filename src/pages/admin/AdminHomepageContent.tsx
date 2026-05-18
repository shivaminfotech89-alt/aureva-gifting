import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, Image as ImageIcon, Check, X, GripVertical, ArrowLeft, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

function ImageUploadDropzone({ value, onChange, recommended }: { value?: string, onChange: (url: string) => void, recommended?: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
       toast.error('Only image files are allowed');
       return;
    }
    setProgress(10);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProgress(40);
      const img = new Image();
      img.onload = () => {
        setProgress(60);
        const canvas = document.createElement('canvas');
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
        setProgress(80);
        setTimeout(async () => {
           const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
           onChange(dataUrl);
           
           try {
             const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
             const { db } = await import('../../lib/firebase');
             await addDoc(collection(db, 'mediaLibrary'), { url: dataUrl, name: file.name, createdAt: serverTimestamp() });
           } catch (err) {
             console.error("Failed to save to media library", err);
           }
           
           setProgress(100);
           setTimeout(() => setProgress(0), 1000);
        }, 100);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-3">
       <div 
         onDragOver={onDragOver} 
         onDragLeave={onDragLeave} 
         onDrop={onDrop}
         onClick={() => fileInputRef.current?.click()}
         className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
       >
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
              e.target.value = '';
            }} 
          />
          {value ? (
             <div className="relative w-full max-h-40 overflow-hidden rounded-lg group">
                <img src={value} className="w-full h-full object-contain" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-4">
                   <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg text-white font-medium hover:bg-white/20">
                     <Edit3 className="w-4 h-4"/> Replace
                   </div>
                   <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      onClick={(e) => { 
                         e.preventDefault(); 
                         e.stopPropagation(); 
                         onChange(''); 
                      }}
                   >
                     <Trash2 className="w-4 h-4 mr-2"/> Delete
                   </Button>
                </div>
             </div>
          ) : (
             <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border mb-3">
                   <UploadCloud className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP. {recommended}</p>
             </div>
          )}
          {progress > 0 && progress < 100 && (
             <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200 overflow-hidden rounded-b-xl">
                <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
             </div>
          )}
       </div>
    </div>
  );
}

function ImageSelectionField({ value, onChange, recommended, mediaLibrary, defaultTab = 'upload' }: { value?: string, onChange: (url: string) => void, recommended?: string, mediaLibrary: any[], defaultTab?: string }) {
  const [deletePending, setDeletePending] = useState<(() => Promise<void>) | null>(null);
  
  const handleDeleteMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      await deleteDoc(doc(db, 'mediaLibrary', id));
      toast.success('Image removed from library');
    } catch (err) {
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="border rounded-2xl p-1 bg-slate-50 shadow-inner">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="upload">Upload New</TabsTrigger>
          <TabsTrigger value="library">Recent Images ({mediaLibrary.length})</TabsTrigger>
        </TabsList>
        <div className="p-3 bg-white rounded-xl border">
          <TabsContent value="upload" className="space-y-4 m-0">
            <ImageUploadDropzone value={value} onChange={onChange} recommended={recommended} />
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 uppercase">OR PASTE URL:</span>
               <Input className="flex-1 h-9 text-sm" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="https://" />
            </div>
          </TabsContent>
          <TabsContent value="library" className="m-0">
            {mediaLibrary.length === 0 ? (
               <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                 <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                 <p className="text-sm">No recent images found</p>
                 <p className="text-xs">Upload an image first to see it here</p>
               </div>
            ) : (
               <div className="space-y-4">
                 <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                   {mediaLibrary.map(m => (
                      <div 
                        key={m.id} 
                        className={`relative aspect-square border-2 rounded-xl cursor-pointer overflow-hidden group transition-all ${value === m.url ? 'border-[#F4C542] shadow-sm transform scale-[0.98]' : 'border-slate-200 hover:border-slate-300'}`}
                        onClick={() => onChange(m.url)}
                      >
                         <img src={m.url} className="w-full h-full object-cover" />
                         {value === m.url && (
                            <div className="absolute top-2 right-2 bg-[#F4C542] text-[#0F172A] p-1 rounded-full shadow-sm"><Check className="w-3 h-3"/></div>
                         )}
                         <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 p-1.5 text-[10px] text-white truncate text-center transition-opacity">
                           {m.name || 'Image'}
                         </div>
                         <button type="button" onClick={(e) => handleDeleteMedia(m.id, e)} className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity">
                            <Trash2 className="w-3 h-3"/>
                         </button>
                      </div>
                   ))}
                 </div>
                 <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-xs font-bold text-slate-400 uppercase">OR PASTE URL:</span>
                    <Input className="flex-1 h-9 text-sm" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="https://" />
                 </div>
               </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default function AdminHomepageContent() {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [brandingSection, setBrandingSection] = useState<any>({ imageUrl: '' });
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);

  const [isDialogOp, setIsDialogOp] = useState(false);
  const [dialogType, setDialogType] = useState<string>('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [defaultImageTab, setDefaultImageTab] = useState<string>('upload');

  const [formData, setFormData] = useState<any>({});
  const [deletePending, setDeletePending] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Sliders
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      b.sort((x: any, y: any) => (x.order || 0) - (y.order || 0));
      setBanners(b);
    }, (err) => console.error("banners error", err));

    // Categories
    const unsubCats = onSnapshot(collection(db, 'homepageCategories'), async (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      c.sort((x: any, y: any) => (x.order || 0) - (y.order || 0));
      
      if (snapshot.empty) {
         const { setDoc, doc } = await import('firebase/firestore');
         const defaults = [
           { id: 'cat_default_1', name: "Executive Drinkware", url: "https://images.unsplash.com/photo-1517260739337-6799d239ce83?auto=format&fit=crop&q=80", order: 1 },
           { id: 'cat_default_2', name: "Office Essentials", url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80", order: 2 },
           { id: 'cat_default_3', name: "Tech Gadgets", url: "https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80", order: 3 },
           { id: 'cat_default_4', name: "Eco-friendly", url: "https://images.unsplash.com/photo-1536766768582-1dd38f32acab?auto=format&fit=crop&q=80", order: 4 }
         ];
         setCategories(defaults); // Optimistic UI
         defaults.forEach(d => setDoc(doc(db, 'homepageCategories', d.id), d));
      } else {
         setCategories(c);
      }
    }, (err) => console.error("homepageCategories error", err));

    // Festival Collections
    const unsubCols = onSnapshot(collection(db, 'homepageCollections'), async (snapshot) => {
      const col = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      col.sort((x: any, y: any) => (x.order || 0) - (y.order || 0));
      if (snapshot.empty) {
         const { setDoc, doc } = await import('firebase/firestore');
         const defaults = [
          { id: 'col_default_1', title: "Diwali Hampers", sub: "Premium Dry Fruits & Essentials", img: "https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80&w=800", order: 1 },
          { id: 'col_default_2', title: "New Year Kits", sub: "Planners, Pens & Tech", img: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800", order: 2 },
          { id: 'col_default_3', title: "Welcome Kits", sub: "Onboarding Essentials", img: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=800", order: 3 }
         ];
         setCollections(defaults);
         defaults.forEach(d => setDoc(doc(db, 'homepageCollections', d.id), d));
      } else {
         setCollections(col);
      }
    }, (err) => console.error("homepageCollections error", err));

    // Branding Section
    const unsubBranding = onSnapshot(doc(db, 'settings', 'brandingImage'), (docSnap) => {
       if (docSnap.exists()) {
          setBrandingSection(docSnap.data());
       }
    }, (err) => console.error("brandingImage error", err));

    // Media Library
    const unsubMedia = onSnapshot(collection(db, 'mediaLibrary'), (snapshot) => {
       const m = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       m.sort((x: any, y: any) => (y.createdAt?.toMillis?.() || 0) - (x.createdAt?.toMillis?.() || 0));
       setMediaLibrary(m);
    }, (err) => console.error("mediaLibrary error", err));

    return () => { unsubBanners(); unsubCats(); unsubCols(); unsubBranding(); unsubMedia(); };
  }, []);

  const openDialog = (type: string, item?: any, tab?: string) => {
     setDialogType(type);
     setEditingItem(item || null);
     setDefaultImageTab(tab || 'upload');
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

  const handleDeleteContentImage = async (col: string, id: string, fieldName: string) => {
    setDeletePending(() => async () => {
       try {
          await setDoc(doc(db, col, id), { [fieldName]: '', updatedAt: serverTimestamp() }, { merge: true });
          toast.success("Image removed successfully. Placeholder will be shown.");
       } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, col);
          toast.error("Failed to delete image.");
       }
    });
  };

  const handleDelete = async (col: string, id: string) => {
    setDeletePending(() => async () => {
       try {
          await deleteDoc(doc(db, col, id));
          toast.success('Item deleted successfully.');
       } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, col);
          toast.error('Failed to delete item.');
       }
    });
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
    <div className="space-y-6 w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
         <div>
            <div className="flex items-center gap-4 mb-2">
               <Button variant="outline" size="sm" asChild className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
                  <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back to Dashboard</Link>
               </Button>
            </div>
            <h1 className="text-3xl font-bold font-serif text-[#0F172A] tracking-tight">Homepage Content Management</h1>
            <p className="text-slate-500 mt-2">Manage sliders, categories, and promotional banners for the homepage.</p>
         </div>
      </div>

      <Tabs defaultValue="sliders" className="w-full">
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex flex-nowrap w-full overflow-x-auto justify-start border-none bg-slate-100 p-1.5 rounded-2xl md:inline-flex md:w-auto snap-x">
             <TabsTrigger value="sliders" className="rounded-xl px-5 py-2.5 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-semibold snap-start transition-all">Hero Sliders</TabsTrigger>
             <TabsTrigger value="categories" className="rounded-xl px-5 py-2.5 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-semibold snap-start transition-all">Categories</TabsTrigger>
             <TabsTrigger value="collections" className="rounded-xl px-5 py-2.5 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-semibold snap-start transition-all">Festival Campaigns</TabsTrigger>
             <TabsTrigger value="branding" className="rounded-xl px-5 py-2.5 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-semibold snap-start transition-all">Corporate Branding</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sliders" className="mt-6">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-bold text-slate-800">Hero Sliders</h2>
              <Button onClick={() => openDialog('banner')} className="bg-[#0F172A] text-white hover:bg-slate-800 rounded-xl px-4 py-2 h-auto"><Plus className="w-5 h-5 mr-2"/> Add Slider</Button>
           </div>
           <div className="grid grid-cols-1 gap-6">
              {banners.map((b, idx) => (
                 <div key={b.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row p-5 gap-8 group">
                    <div className="w-full md:w-1/3 flex flex-col gap-2 relative">
                       <div className="absolute top-2 left-2 z-10 bg-white/90 px-2 py-1 rounded-md text-[10px] font-extrabold text-slate-800 tracking-wider uppercase shadow-sm">SLIDER {idx + 1}</div>
                       <div className="relative group rounded-xl overflow-hidden border bg-slate-100 h-48 sm:h-56">
                         <img 
                           src={b.imageUrl || 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80'} 
                           className={`h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ${!b.imageUrl && 'opacity-30'}`} 
                           alt="Slider"
                           onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80'; }}
                         />
                         {/* Edit Overlay */}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity backdrop-blur-sm z-20 gap-3">
                            <div className="flex gap-2">
                              <Button onClick={() => openDialog('banner', b, 'upload')} variant="secondary" className="rounded-xl shadow-lg border-0 bg-white/90 hover:bg-white text-slate-800 font-semibold" size="sm">
                                <ImageIcon className="w-4 h-4 mr-2"/> Replace Image
                              </Button>
                              <Button onClick={() => openDialog('banner', b, 'library')} variant="secondary" className="rounded-xl shadow-lg border-0 bg-white/90 hover:bg-white text-slate-800 font-semibold" size="sm" title="Library">
                                <UploadCloud className="w-4 h-4"/> 
                              </Button>
                            </div>
                            {b.imageUrl && (
                              <Button variant="link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteContentImage('banners', b.id, 'imageUrl'); }} size="sm" className="text-red-400 hover:text-red-300 drop-shadow-sm">
                                <Trash2 className="w-4 h-4 mr-2"/> Delete Image
                              </Button>
                            )}
                         </div>
                         {!b.imageUrl && (
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <span className="bg-white/90 text-slate-700 px-3 py-1 rounded-md text-sm font-semibold shadow-sm">No Image Uploaded</span>
                           </div>
                         )}
                       </div>
                    </div>
                    
                    <div className="w-full md:w-2/3 flex flex-col justify-center">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <h3 className="font-bold text-2xl text-[#0F172A] mb-1">{b.title || "No Title"}</h3>
                             <p className="text-slate-500 text-sm max-w-xl">{b.subtitle || "No Subtitle"}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex-shrink-0">
                             <span className="text-sm font-medium text-slate-600">Active</span>
                             <Switch checked={b.enabled} onCheckedChange={(val) => setDoc(doc(db, 'banners', b.id), {enabled: val}, {merge:true})} />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 text-sm mb-4 mt-2">
                          <div className="bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100">
                             <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Button Text</span>
                             <span className="font-medium text-[#0F172A] truncate block">{b.ctaText || 'None'}</span>
                          </div>
                          <div className="bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100">
                             <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Redirect URL</span>
                             <span className="font-medium text-[#0F172A] truncate block">{b.ctaLink || 'None'}</span>
                          </div>
                       </div>
                       
                       <div className="flex items-center border-t border-slate-100 pt-4 mt-auto">
                          {b.updatedAt && (
                             <div className="text-[11px] text-slate-400 font-medium">Updated: {new Date(b.updatedAt?.toDate()).toLocaleString()}</div>
                          )}
                          <div className="ml-auto flex items-center gap-3">
                             <Button onClick={() => openDialog('banner', b)} variant="outline" size="sm" className="rounded-xl border-slate-200">
                               <Edit3 className="w-4 h-4 mr-2 text-slate-500"/> Edit Details
                             </Button>
                             <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete('banners', b.id); }}>
                               <Trash2 className="w-4 h-4 mr-2"/> Delete Section
                             </Button>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-bold text-slate-800">Category Images</h2>
              <Button onClick={() => openDialog('category')} className="bg-[#0F172A] text-white hover:bg-slate-800 rounded-xl px-4 py-2 h-auto"><Plus className="w-5 h-5 mr-2"/> Add Category</Button>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((c, idx) => (
                 <div key={c.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full relative group">
                    <div className="h-56 w-full relative overflow-hidden bg-slate-100 flex-shrink-0">
                        <img 
                          src={c.url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80'} 
                          className={`h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ${!c.url && 'opacity-30'}`} 
                          alt={c.name} 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80'; }}
                        />
                        
                        {/* Image Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm gap-3">
                           <Button onClick={() => openDialog('category', c, 'upload')} variant="secondary" className="rounded-xl shadow-lg border-0 bg-white/90 hover:bg-white text-slate-800 font-semibold" size="sm">
                             <ImageIcon className="w-4 h-4 mr-2"/> Replace Image
                           </Button>
                           <Button onClick={() => openDialog('category', c, 'library')} variant="secondary" className="rounded-xl shadow-lg border-0 bg-white/90 hover:bg-white text-slate-800 font-semibold" size="sm" title="Library">
                             <UploadCloud className="w-4 h-4"/> 
                           </Button>
                           {c.url && (
                             <Button variant="destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteContentImage('homepageCategories', c.id, 'url'); }} size="icon" className="rounded-xl shadow-lg" title="Delete Image">
                               <Trash2 className="w-4 h-4"/>
                             </Button>
                           )}
                        </div>
                        {!c.url && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <span className="bg-white/90 text-slate-700 px-3 py-1 rounded-md text-sm font-semibold shadow-sm">No Image Uploaded</span>
                          </div>
                        )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                       <div className="text-[10px] font-extrabold text-amber-500 tracking-wider mb-2 uppercase">CATEGORY</div>
                       <h3 className="font-bold text-xl text-[#0F172A] line-clamp-1 mb-1">{c.name || "No Title"}</h3>
                       <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">{c.description || "No description provided."}</p>
                       
                       {c.updatedAt && (
                          <div className="text-[11px] text-slate-400 font-medium mb-4">Updated: {new Date(c.updatedAt?.toDate()).toLocaleString()}</div>
                       )}
                       
                       <div className="flex border-t border-slate-100 pt-4 mt-auto items-center">
                           <Button onClick={() => openDialog('category', c)} variant="ghost" size="sm" className="text-[#0F172A] hover:bg-slate-50 font-semibold px-0 mr-auto">
                             <Edit3 className="w-4 h-4 mr-2 text-slate-400"/> Edit Details
                           </Button>
                           
                           <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete('homepageCategories', c.id); }} title="Delete Category">
                             <Trash2 className="w-5 h-5"/>
                           </Button>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-bold text-slate-800">Festival Campaigns</h2>
              <Button onClick={() => openDialog('collection')} className="bg-[#0F172A] text-white hover:bg-slate-800 rounded-xl px-4 py-2 h-auto"><Plus className="w-5 h-5 mr-2"/> Add Campaign</Button>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collections.map((c, idx) => (
                 <div key={c.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full relative group">
                    <div className="h-64 w-full relative overflow-hidden bg-slate-900 flex-shrink-0">
                        <img 
                          src={c.img || 'https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80'} 
                          className={`absolute inset-0 h-full w-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 ${!c.img && 'opacity-30'}`} 
                          alt={c.title}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80'; }}
                        />
                        
                        {/* Floating Content overlay for Festival feel */}
                        <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-0 z-10">
                           <p className="text-[#FFB347] font-bold text-[10px] uppercase tracking-widest drop-shadow-sm mb-1 line-clamp-1">{c.sub}</p>
                           <h3 className="font-serif font-bold text-white text-2xl drop-shadow-md line-clamp-1">{c.title || 'No Title'}</h3>
                        </div>

                        {/* Edit Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity backdrop-blur-sm z-20">
                           <div className="flex gap-3">
                             <Button onClick={() => openDialog('collection', c, 'upload')} variant="secondary" className="rounded-xl shadow-lg border-0 bg-white/90 hover:bg-white text-slate-800 font-semibold" size="sm">
                               <ImageIcon className="w-4 h-4 mr-2"/> Replace Image
                             </Button>
                             <Button onClick={() => openDialog('collection', c, 'library')} variant="secondary" className="rounded-xl shadow-lg border-0 bg-white/90 hover:bg-white text-slate-800 font-semibold" size="sm" title="Library">
                               <UploadCloud className="w-4 h-4"/> 
                             </Button>
                           </div>
                           {c.img && (
                             <Button variant="link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteContentImage('homepageCollections', c.id, 'img'); }} size="sm" className="text-red-400 hover:text-red-300 mt-2 drop-shadow-sm">
                               <Trash2 className="w-4 h-4 mr-2"/> Delete Image
                             </Button>
                           )}
                        </div>
                        {!c.img && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                             <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1 rounded-md text-sm font-semibold border border-white/20">No Image Uploaded</span>
                          </div>
                        )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                       <div className="text-[10px] font-extrabold text-[#F4C542] tracking-wider mb-2 uppercase">FESTIVAL CAMPAIGN</div>
                       <h3 className="font-bold text-xl text-[#0F172A] line-clamp-1 mb-1">{c.title || "No Title"}</h3>
                       <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">{c.description || c.sub || "No description provided."}</p>
                       
                       {c.updatedAt && (
                          <div className="text-[11px] text-slate-400 font-medium mb-4">Updated: {new Date(c.updatedAt?.toDate()).toLocaleString()}</div>
                       )}
                       
                       <div className="flex border-t border-slate-100 pt-4 mt-auto items-center">
                           <Button onClick={() => openDialog('collection', c)} variant="ghost" size="sm" className="text-[#0F172A] hover:bg-slate-50 font-semibold px-0 mr-auto">
                             <Edit3 className="w-4 h-4 mr-2 text-slate-400"/> Edit Details
                           </Button>
                           
                           <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete('homepageCollections', c.id); }} title="Delete Campaign">
                             <Trash2 className="w-5 h-5"/>
                           </Button>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-bold text-slate-800">Corporate Branding Section</h2>
           </div>
           <Card className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm p-6 lg:p-8">
              <div className="text-[10px] uppercase font-extrabold tracking-widest text-[#F4C542] mb-6">CORPORATE BRANDING CONFIGURATION</div>
              
              <form onSubmit={updateBrandingImage} className="flex flex-col md:flex-row gap-8 lg:gap-12">
                 <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col gap-2">
                    <div className="relative group rounded-2xl overflow-hidden border bg-slate-100 h-64 lg:h-80 shadow-md">
                        <img 
                          src={brandingSection?.imageUrl || 'https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200'} 
                          className={`h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ${!brandingSection?.imageUrl && 'opacity-30'}`} 
                          alt="Branding"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200'; }}
                        />
                        {brandingSection?.imageUrl ? (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm z-20">
                              <Button type="button" variant="destructive" onClick={async (e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 setDeletePending(() => async () => {
                                    try {
                                       await setDoc(doc(db, 'settings', 'brandingImage'), { imageUrl: '' }, { merge: true });
                                       toast.success("Image removed successfully. Showing placeholder.");
                                    } catch (err) {
                                       handleFirestoreError(err, OperationType.UPDATE, 'settings');
                                       toast.error("Failed to delete image");
                                    }
                                 });
                              }} size="sm" className="rounded-xl shadow-lg font-semibold">
                                <Trash2 className="w-4 h-4 mr-2"/> Delete Image
                              </Button>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                             <span className="bg-white/90 text-slate-700 px-3 py-1 rounded-md text-sm font-semibold shadow-sm">No Image Uploaded</span>
                          </div>
                        )}
                    </div>
                    <div className="mt-4">
                       <Label className="block mb-2 text-sm font-semibold text-slate-600">Replace Image (Recommended: 1200x800)</Label>
                       <ImageSelectionField value={brandingSection?.imageUrl} onChange={(val) => setBrandingSection((prev: any) => ({ ...prev, imageUrl: val }))} recommended="1200x800" mediaLibrary={mediaLibrary} />
                       <Input name="imageUrl" type="hidden" value={brandingSection?.imageUrl || ''} />
                    </div>
                 </div>

                 <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col gap-6">
                    <div className="space-y-6 flex-1">
                        <div className="space-y-2">
                           <Label className="text-sm font-semibold text-slate-700">Section Subtitle</Label>
                           <Input name="subTitle" defaultValue={brandingSection?.subTitle || 'Personalization Engine'} className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors" placeholder="e.g., Personalization Engine" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-sm font-semibold text-slate-700">Headline</Label>
                           <p className="text-xs text-slate-500 mb-2">Use <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded">&lt;span className="text-[#d4af37] italic"&gt;...&lt;/span&gt;</code> for golden italic text.</p>
                           <Input name="heading" defaultValue={brandingSection?.heading || 'Make it truly <span className="text-[#d4af37] italic">yours.</span>'} className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-sm font-semibold text-slate-700">Body Text</Label>
                           <textarea name="body" defaultValue={brandingSection?.body || 'Upload your corporate logo during checkout and visualize exactly how your gifts will look.'} className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-4 py-3 text-sm transition-colors resize-none placeholder:text-slate-400" placeholder="Description goes here..." />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                       <Button type="submit" className="bg-[#0F172A] text-white hover:bg-[#F4C542] hover:text-[#0F172A] px-8 h-12 font-bold rounded-xl transition-colors shadow-sm w-full sm:w-auto">
                          <Check className="w-4 h-4 mr-2"/> Save Configuration
                       </Button>
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
                       <Label>Banner Image (Recommended: 1200x500 banner)</Label>
                       <ImageSelectionField value={formData.imageUrl} onChange={(val) => setFormData({...formData, imageUrl: val})} recommended="1200x500 banner" mediaLibrary={mediaLibrary} defaultTab={defaultImageTab} />
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
                       <Label>Category Image (Recommended: 800x800 square)</Label>
                       <ImageSelectionField value={formData.url} onChange={(val) => setFormData({...formData, url: val})} recommended="800x800 square" mediaLibrary={mediaLibrary} defaultTab={defaultImageTab} />
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
                       <Label>Campaign Image (Recommended: 800x1200 portrait)</Label>
                       <ImageSelectionField value={formData.img} onChange={(val) => setFormData({...formData, img: val})} recommended="800x1200 portrait" mediaLibrary={mediaLibrary} defaultTab={defaultImageTab} />
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

      <Dialog open={!!deletePending} onOpenChange={(open) => !open && setDeletePending(null)}>
         <DialogContent className="max-w-md p-6 border-slate-100 shadow-xl rounded-2xl">
            <DialogHeader>
               <DialogTitle className="text-xl font-bold text-slate-800">Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-slate-600">
               Are you sure you want to delete this? This action cannot be undone.
            </div>
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setDeletePending(null)}>Cancel</Button>
               <Button variant="destructive" onClick={async () => {
                  if(deletePending) {
                    await deletePending();
                  }
                  setDeletePending(null);
               }}>Delete</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}

const Card = ({ children, className }: any) => <div className={className}>{children}</div>;
