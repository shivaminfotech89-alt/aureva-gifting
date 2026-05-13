import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag, Percent, DollarSign, Activity, TrendingUp, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountType: 'fixed' as 'fixed' | 'percentage',
    discountValue: '',
    minPurchase: '',
    expiryDate: '',
    maxUsage: '',
    isActive: true
  });

  const fetchCoupons = async () => {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openNewDialog = () => {
    setEditingCoupon(null);
    setFormData({
      name: '',
      code: '',
      discountType: 'fixed',
      discountValue: '',
      minPurchase: '',
      expiryDate: '',
      maxUsage: '',
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      name: coupon.name || '',
      code: coupon.code,
      discountType: coupon.discountType || 'fixed',
      discountValue: coupon.discountValue?.toString() || '',
      minPurchase: coupon.minPurchase?.toString() || '',
      expiryDate: coupon.expiryDate || '',
      maxUsage: coupon.maxUsage?.toString() || '',
      isActive: coupon.isActive ?? true
    });
    setIsDialogOpen(true);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: `AUREVA${code}` }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue || !formData.minPurchase || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const dataToSave = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minPurchase: Number(formData.minPurchase),
        expiryDate: formData.expiryDate || null,
        maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
        isActive: formData.isActive,
      };

      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), {
          ...dataToSave,
          updatedAt: serverTimestamp()
        });
        toast.success('Coupon updated successfully');
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...dataToSave,
          usageCount: 0,
          totalRevenue: 0,
          createdAt: serverTimestamp()
        });
        toast.success('Coupon created successfully');
      }
      setIsDialogOpen(false);
      fetchCoupons();
    } catch (error) {
      handleFirestoreError(error, editingCoupon ? OperationType.UPDATE : OperationType.CREATE, 'coupons');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        toast.success('Coupon deleted');
        fetchCoupons();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'coupons');
      }
    }
  };

  const toggleStatus = async (coupon: any) => {
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'coupons');
    }
  };

  // Analytics Computation
  const currentDate = new Date();
  const expiredCoupons = coupons.filter(c => c.expiryDate && new Date(c.expiryDate) < currentDate);
  const totalRevenue = coupons.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  const mostUsed = coupons.length > 0 ? coupons.reduce((prev, current) => ((prev.usageCount || 0) > (current.usageCount || 0) ? prev : current), coupons[0]) : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back to Dashboard</Link>
         </Button>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#0F172A] tracking-tight">Coupon Management</h1>
          <p className="text-slate-500 mt-2">Generate and manage discount codes for your customers.</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2 bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] rounded-xl h-11 px-6 shadow-sm font-bold">
          <Plus className="w-5 h-5"/> Create Coupon
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
           <div className="flex items-center gap-2 text-slate-500"><Tag className="w-4 h-4"/><span className="text-xs font-bold uppercase">Total Created</span></div>
           <p className="text-2xl font-bold text-[#0F172A]">{coupons.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
           <div className="flex items-center gap-2 text-green-600"><Activity className="w-4 h-4"/><span className="text-xs font-bold uppercase">Active</span></div>
           <p className="text-2xl font-bold text-[#0F172A]">{coupons.filter(c => c.isActive).length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
           <div className="flex items-center gap-2 text-red-500"><AlertCircle className="w-4 h-4"/><span className="text-xs font-bold uppercase">Expired</span></div>
           <p className="text-2xl font-bold text-[#0F172A]">{expiredCoupons.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
           <div className="flex items-center gap-2 text-blue-600"><Percent className="w-4 h-4"/><span className="text-xs font-bold uppercase">Most Used</span></div>
           <p className="text-xl font-bold text-[#0F172A] truncate" title={mostUsed?.code || '-'}>{mostUsed?.code || '-'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
           <div className="flex items-center gap-2 text-[#d4af37]"><TrendingUp className="w-4 h-4"/><span className="text-xs font-bold uppercase">Revenue Generated</span></div>
           <p className="text-2xl font-bold text-[#0F172A]">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Coupon Name & Code</th>
                <th className="px-6 py-4 font-bold">Discount</th>
                <th className="px-6 py-4 font-bold">Min. Purchase</th>
                <th className="px-6 py-4 font-bold">Usage</th>
                <th className="px-6 py-4 font-bold">Expiry Date</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No coupons found. Create your first coupon!</td></tr>
              ) : coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="font-bold text-[#0F172A] mb-1">{coupon.name}</div>
                     <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 tracking-wider inline-block">{coupon.code}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{formatCurrency(coupon.minPurchase)}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                     {coupon.usageCount || 0} {coupon.maxUsage ? `/ ${coupon.maxUsage}` : ''}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                     <span className={coupon.expiryDate && new Date(coupon.expiryDate) < new Date() ? 'text-red-500 font-bold' : ''}>
                        {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No expiry'}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <Switch checked={coupon.isActive} onCheckedChange={() => toggleStatus(coupon)} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(coupon)} className="text-slate-400 hover:text-slate-700">
                      <Edit className="w-4 h-4"/>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4"/>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white rounded-[2rem]">
          <DialogHeader className="p-8 pb-4 bg-slate-50/50 border-b border-slate-100">
             <DialogTitle className="text-2xl font-bold font-serif text-[#0F172A]">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-8 pt-6">
             <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <Label className="text-slate-700 font-bold">Coupon Name</Label>
                   <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Diwali Special 100" required className="rounded-xl text-md h-12" />
                 </div>
                 <div className="space-y-3">
                   <Label className="text-slate-700 font-bold flex justify-between">Coupon Code <button type="button" onClick={generateRandomCode} className="text-[#d4af37] hover:underline flex items-center gap-1 text-xs"><RefreshCw className="w-3 h-3"/> Auto-Generate</button></Label>
                   <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. AUREVA100" required className="rounded-xl uppercase font-mono tracking-widest text-lg h-12" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <Label className="text-slate-700 font-bold">Discount Type</Label>
                   <Select value={formData.discountType} onValueChange={(v:any) => setFormData({...formData, discountType: v})}>
                     <SelectTrigger className="h-12 rounded-xl">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="fixed">Fixed Amount</SelectItem>
                       <SelectItem value="percentage">Percentage (e.g., 10%)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-3">
                   <Label className="text-slate-700 font-bold">Discount Value</Label>
                   <div className="relative">
                     {formData.discountType === 'fixed' ? <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /> : <Percent className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />}
                     <Input type="number" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} required className="pl-10 rounded-xl h-12" min="1" max={formData.discountType === 'percentage' ? 100 : undefined} />
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-6">
                 <div className="space-y-3">
                   <Label className="text-slate-700 font-bold">Minimum Purchase</Label>
                   <div className="relative">
                     <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                     <Input type="number" value={formData.minPurchase} onChange={e => setFormData({...formData, minPurchase: e.target.value})} required className="pl-10 rounded-xl h-12" min="0" placeholder="e.g. 500" />
                   </div>
                 </div>
                 <div className="space-y-3">
                   <Label className="text-slate-700 font-bold">Expiry Date</Label>
                   <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="rounded-xl h-12" />
                 </div>
                 <div className="space-y-3">
                   <Label className="text-slate-700 font-bold">Usage Limit</Label>
                   <Input type="number" value={formData.maxUsage} onChange={e => setFormData({...formData, maxUsage: e.target.value})} className="rounded-xl h-12" placeholder="Unlimited" min="1" />
                 </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl mt-4">
                 <Label className="font-bold text-slate-700">Coupon Active Status</Label>
                 <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({...formData, isActive: c})} />
               </div>

             </div>

             <DialogFooter className="mt-8 gap-3">
                <Button type="button" variant="outline" className="rounded-xl h-12 px-6" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="rounded-xl bg-[#d4af37] text-[#0F172A] hover:bg-[#F4C542] h-12 px-8 font-bold">{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
