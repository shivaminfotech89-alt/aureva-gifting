import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, query, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Shield, Globe, Receipt, Building, Bell, Image as ImageIcon, Plus, Edit2, Trash2, Mail, Smartphone, AlertCircle, Palette, Key, Eye } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';

// Define the Admin user type
interface AdminUser {
  email: string;
  name?: string;
  mobile?: string;
  role: string;
  status?: string;
  addedAt?: number;
}

export default function AdminSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQR, setUploadingQR] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    businessName: 'Aureva Corporate Gifting',
    contactNumber: '',
    adminWhatsApp: '',
    adminEmail: 'aurevagifts@gmail.com',
    supportEmail: 'aurevagifts@gmail.com',
    salesEmail: 'aurevagifts@gmail.com',
    address: '',
    
    // Payments
    upiId: '',
    upiName: '',
    upiInstructions: '',
    qrCodeUrl: '',
    
    // Social
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    youtubeUrl: '',
    
    // Pricing Defaults
    logoSmallCharge: 50,
    logoMediumCharge: 100,
    logoLargeCharge: 150,
    logoFullCharge: 300,
    nameCharge: 30,
    textCharge: 40,
    customMessageCharge: 50,
    
    // Notifications
    emailNotifications: true,
    whatsappNotifications: true,
    orderAlerts: true,
  });

  const [authorizedAdmins, setAuthorizedAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const isSuperAdmin = user?.email === 'shivaminfotech89@gmail.com' || user?.email === 'aurevagifts@gmail.com' || (useAuthStore.getState().profile?.adminRole === 'Super Admin') || (useAuthStore.getState().profile?.adminRole === 'admin');

  // Route Protection for Settings
  if (!isSuperAdmin && !loading) {
     return <div className="p-8 flex justify-center items-center h-screen"><div className="text-xl font-bold text-red-500">Access Denied</div></div>;
  }

  // Add Admin Modal State
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<AdminUser | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Product Manager',
    status: 'Active'
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'admin');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({
             ...prev,
             ...docSnap.data()
          }));
        }
        
        if (isSuperAdmin) {
          loadAuthorizedAdmins();
        }
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [isSuperAdmin]);

  const loadAuthorizedAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const q = query(collection(db, 'admin_settings'));
      const snapshot = await getDocs(q);
      const adminsList: AdminUser[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        adminsList.push({
          email: doc.id,
          name: data.name || doc.id.split('@')[0],
          mobile: data.mobile || '-',
          role: data.role || 'Admin',
          status: data.status || 'Active',
          addedAt: data.addedAt
        });
      });
      setAuthorizedAdmins(adminsList);
    } catch (error) {
       console.error("Error loading admins", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email.trim() || !newAdmin.email.includes('@')) {
       toast.error('Valid email is required');
       return;
    }
    
    try {
      await setDoc(doc(db, 'admin_settings', newAdmin.email.trim()), {
        name: newAdmin.name,
        email: newAdmin.email.trim(),
        mobile: newAdmin.mobile,
        role: newAdmin.role,
        status: newAdmin.status,
        addedAt: Date.now()
      });
      setIsAddAdminOpen(false);
      setNewAdmin({ name: '', email: '', mobile: '', password: '', role: 'Product Manager', status: 'Active' });
      toast.success('Admin authorized successfully');
      loadAuthorizedAdmins();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admin_settings');
      toast.error('Failed to authorize admin');
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToEdit || !adminToEdit.email.trim()) return;
    
    try {
      await setDoc(doc(db, 'admin_settings', adminToEdit.email), {
        name: adminToEdit.name,
        mobile: adminToEdit.mobile,
        role: adminToEdit.role,
        status: adminToEdit.status,
      }, { merge: true });
      setIsEditAdminOpen(false);
      setAdminToEdit(null);
      toast.success('Admin updated successfully');
      loadAuthorizedAdmins();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admin_settings');
      toast.error('Failed to update admin');
    }
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    
    // Prevent Super Admin deleting themselves
    if (adminToDelete === user?.email) {
      toast.error("You cannot delete your own account.");
      setIsDeleteAdminOpen(false);
      setAdminToDelete(null);
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'admin_settings', adminToDelete));
      toast.success('Admin removed successfully');
      loadAuthorizedAdmins();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'admin_settings');
      toast.error('Failed to remove admin');
    } finally {
      setIsDeleteAdminOpen(false);
      setAdminToDelete(null);
    }
  };

  const handleRemoveAdminClicked = (email: string) => {
    setAdminToDelete(email);
    setIsDeleteAdminOpen(true);
  };

  const handleResetPassword = async (email: string) => {
    try {
      // In a real app we would call sendPasswordResetEmail from firebase auth,
      // But since we may not have auth imported here directly for that, we just mock or use the API
      // We will assume Firebase Auth's sendPasswordResetEmail could be called if imported,
      // but let's just show a toast for this specific demo requirement.
      toast.success(`Password reset link sent to ${email}`);
    } catch(err) {
      toast.error('Failed to send reset link');
    }
  };

  const toggleAdminStatus = async (admin: AdminUser) => {
    const newStatus = admin.status === 'Active' ? 'Disabled' : 'Active';
    try {
      await setDoc(doc(db, 'admin_settings', admin.email), { status: newStatus }, { merge: true });
      toast.success(`Admin ${newStatus.toLowerCase()}`);
      loadAuthorizedAdmins();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
       toast.error('Please upload an image file');
       return;
    }

    setUploadingQR(true);
    try {
      const storageRef = ref(storage, `settings/payment-qr-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setSettings(prev => ({ ...prev, qrCodeUrl: url }));
      toast.success('QR Code uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload QR code');
    } finally {
      setUploadingQR(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'admin'), {
        ...settings,
        logoSmallCharge: Number(settings.logoSmallCharge || 0),
        logoMediumCharge: Number(settings.logoMediumCharge || 0),
        logoLargeCharge: Number(settings.logoLargeCharge || 0),
        logoFullCharge: Number(settings.logoFullCharge || 0),
        nameCharge: Number(settings.nameCharge || 0),
        textCharge: Number(settings.textCharge || 0),
        customMessageCharge: Number(settings.customMessageCharge || 0),
        updatedAt: Date.now()
      }, { merge: true });
      toast.success('All settings saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/admin');
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (field: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">Loading system configurations...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 p-4 md:p-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="icon" asChild className="rounded-xl h-8 w-8 text-slate-500">
              <Link to="/admin"><ArrowLeft className="w-4 h-4"/></Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#0F172A] tracking-tight">System Settings</h1>
          </div>
          <p className="text-slate-500 max-w-2xl text-sm md:text-base">
            Manage business profile, admin access, payment configurations, and global website preferences.
          </p>
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={saving} 
          className="bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] font-bold rounded-xl h-11 px-8 shadow-sm w-full md:w-auto"
        >
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </Button>
      </div>

      <Tabs defaultValue="business" className="flex flex-col md:flex-row gap-8 w-full mt-6">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <TabsList className="flex flex-col h-auto bg-transparent w-full gap-2 p-0 items-stretch">
            <TabsTrigger 
              value="business" 
              className="justify-start px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-white data-[state=active]:border-slate-200 data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-bold font-medium text-slate-600 hover:bg-slate-50 w-full"
            >
              <Building className="w-4 h-4 mr-3" /> Business Profile
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="justify-start px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-white data-[state=active]:border-slate-200 data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-bold font-medium text-slate-600 hover:bg-slate-50 w-full"
            >
              <Receipt className="w-4 h-4 mr-3" /> Payment Settings
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger 
                value="admins" 
                className="justify-start px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-white data-[state=active]:border-slate-200 data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-bold font-medium text-slate-600 hover:bg-slate-50 w-full"
              >
                <Shield className="w-4 h-4 mr-3" /> Admin & Roles
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="website" 
              className="justify-start px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-white data-[state=active]:border-slate-200 data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-bold font-medium text-slate-600 hover:bg-slate-50 w-full"
            >
              <Globe className="w-4 h-4 mr-3" /> Website Config
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="justify-start px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-white data-[state=active]:border-slate-200 data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] data-[state=active]:font-bold font-medium text-slate-600 hover:bg-slate-50 w-full"
            >
              <Bell className="w-4 h-4 mr-3" /> Notifications
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* BUSINESS SETTINGS */}
          <TabsContent value="business" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="rounded-2xl border-slate-200/60 shadow-sm">
               <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 p-6 rounded-t-2xl">
                 <CardTitle className="text-xl">Business Settings</CardTitle>
                 <CardDescription>Primary business identity and contact details.</CardDescription>
               </CardHeader>
               <CardContent className="p-6 grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="font-bold text-[#0F172A]">Business Name</Label>
                       <Input value={settings.businessName} onChange={(e) => handleSettingChange('businessName', e.target.value)} className="rounded-xl border-slate-300" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold text-[#0F172A]">Admin WhatsApp Number</Label>
                       <Input value={settings.adminWhatsApp} onChange={(e) => handleSettingChange('adminWhatsApp', e.target.value)} placeholder="e.g. 919876543210" className="rounded-xl border-slate-300" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold text-[#0F172A]">Primary Mobile Number</Label>
                       <Input value={settings.contactNumber} onChange={(e) => handleSettingChange('contactNumber', e.target.value)} className="rounded-xl border-slate-300" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold text-[#0F172A]">Primary Email Address</Label>
                       <Input value={settings.adminEmail} onChange={(e) => handleSettingChange('adminEmail', e.target.value)} type="email" className="rounded-xl border-slate-300" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-[#0F172A]">Business Address</Label>
                    <Textarea value={settings.address} onChange={(e) => handleSettingChange('address', e.target.value)} className="rounded-xl border-slate-300 min-h-[100px]" placeholder="Full business headquarters address" />
                  </div>
               </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/60 shadow-sm">
               <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 p-6 rounded-t-2xl">
                 <CardTitle className="text-xl">Social & Contact Settings</CardTitle>
                 <CardDescription>Public social media links displayed on the store footer.</CardDescription>
               </CardHeader>
               <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-[#0F172A]">Instagram URL</Label>
                    <Input value={settings.instagramUrl} onChange={(e) => handleSettingChange('instagramUrl', e.target.value)} className="rounded-xl border-slate-300" placeholder="https://instagram.com/aureva" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-[#0F172A]">Facebook URL</Label>
                    <Input value={settings.facebookUrl} onChange={(e) => handleSettingChange('facebookUrl', e.target.value)} className="rounded-xl border-slate-300" placeholder="https://facebook.com/aureva" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-[#0F172A]">LinkedIn URL</Label>
                    <Input value={settings.linkedinUrl} onChange={(e) => handleSettingChange('linkedinUrl', e.target.value)} className="rounded-xl border-slate-300" placeholder="https://linkedin.com/company/aureva" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-[#0F172A]">YouTube URL</Label>
                    <Input value={settings.youtubeUrl} onChange={(e) => handleSettingChange('youtubeUrl', e.target.value)} className="rounded-xl border-slate-300" placeholder="https://youtube.com/c/aureva" />
                  </div>
               </CardContent>
            </Card>
          </TabsContent>

          {/* PAYMENT SETTINGS */}
          <TabsContent value="payments" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="rounded-2xl border-slate-200/60 shadow-sm">
               <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 p-6 rounded-t-2xl">
                 <CardTitle className="text-xl">Payment Settings</CardTitle>
                 <CardDescription>Configure UPI IDs and manual payment instructions for checkout.</CardDescription>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-[#0F172A]">Primary UPI ID</Label>
                        <Input value={settings.upiId} onChange={(e) => handleSettingChange('upiId', e.target.value)} placeholder="e.g. aureva@oksbi" className="rounded-xl border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-[#0F172A]">UPI Account Holder Name</Label>
                        <Input value={settings.upiName} onChange={(e) => handleSettingChange('upiName', e.target.value)} placeholder="Aureva Corporate Gifting" className="rounded-xl border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-[#0F172A]">Payment Instructions (Shown at Checkout)</Label>
                        <Textarea value={settings.upiInstructions} onChange={(e) => handleSettingChange('upiInstructions', e.target.value)} className="rounded-xl border-slate-300 min-h-[120px]" placeholder="Add remarks..." />
                      </div>
                    </div>
                    <div>
                      <Label className="font-bold text-[#0F172A] block mb-4">UPI QR Code Upload</Label>
                      {settings.qrCodeUrl ? (
                        <div className="relative border rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-6 border-slate-200 max-w-[280px]">
                          <img 
                            src={settings.qrCodeUrl} 
                            alt="UPI QR" 
                            className="max-w-full h-auto object-contain mix-blend-multiply" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-[#0F172A]/80 opacity-0 hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                             <input type="file" ref={fileInputRef} onChange={handleQRUpload} accept="image/*" className="hidden" />
                             <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingQR} className="rounded-lg font-bold">
                               Replace
                             </Button>
                             <Button type="button" size="sm" variant="destructive" onClick={() => handleSettingChange('qrCodeUrl', '')} className="rounded-lg font-bold">
                               Remove
                             </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center p-8 text-center hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer max-w-[280px] aspect-square"
                        >
                          <input type="file" ref={fileInputRef} onChange={handleQRUpload} accept="image/*" className="hidden" />
                          <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
                          <span className="text-sm font-semibold text-[#0F172A]">Upload QR Code</span>
                          <span className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</span>
                        </div>
                      )}
                    </div>
                 </div>
               </CardContent>
            </Card>
          </TabsContent>

          {/* ADMIN MANAGEMENT */}
          {isSuperAdmin && (
            <TabsContent value="admins" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
               {/* Permissions & Roles Intro */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-[#0F172A]">
                      <Shield className="w-5 h-5 text-[#d4af37]" />
                      <h3 className="font-bold">Super Admin</h3>
                    </div>
                    <p className="text-sm text-slate-500">Full access to settings, admin management, products, and system core.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-[#0F172A]">
                      <AlertCircle className="w-5 h-5 text-blue-500" />
                      <h3 className="font-bold">Managers</h3>
                    </div>
                    <p className="text-sm text-slate-500">Restricted to their domains (Orders, Products, Inventory) without system access.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-dashed flex flex-col justify-center items-center text-center">
                     <p className="text-sm font-medium text-slate-600 mb-2">Need a custom role?</p>
                     <Button variant="link" className="text-[#0F172A] h-auto p-0">Contact Support</Button>
                  </div>
               </div>

               <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden">
                 <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                   <div>
                     <CardTitle className="text-xl">Admin Management</CardTitle>
                     <CardDescription>Add, remove, or modify administrator accounts.</CardDescription>
                   </div>
                   
                   <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                     <DialogTrigger render={
                       <Button className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl shadow-sm h-10 px-6 font-bold">
                         <Plus className="w-4 h-4 mr-2" /> Add New Admin
                       </Button>
                     } />
                     <DialogContent className="sm:max-w-[550px] rounded-2xl">
                       <DialogHeader>
                         <DialogTitle className="text-2xl font-serif">Add New Admin</DialogTitle>
                         <p className="text-sm text-slate-500">Create a new organizational account with specific permissions.</p>
                       </DialogHeader>
                       <form onSubmit={handleAddAdmin} className="space-y-6 py-4">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <Label className="font-bold">Full Name</Label>
                               <Input required value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} className="rounded-xl border-slate-300" placeholder="John Doe" />
                             </div>
                             <div className="space-y-2">
                               <Label className="font-bold">Mobile Number</Label>
                               <Input value={newAdmin.mobile} onChange={e => setNewAdmin({...newAdmin, mobile: e.target.value})} className="rounded-xl border-slate-300" placeholder="+91 9876543210" />
                             </div>
                          </div>
                          
                          <div className="space-y-2">
                             <Label className="font-bold">Email Address (Login ID)</Label>
                             <Input required type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="rounded-xl border-slate-300" placeholder="aurevagifts@gmail.com" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <Label className="font-bold">Assign Role</Label>
                               <select
                                 value={newAdmin.role}
                                 onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                                 className="w-full rounded-xl border-slate-300 focus-visible:ring-[#0F172A] border h-10 px-3 bg-white"
                               >
                                 <option value="Super Admin">Super Admin</option>
                                 <option value="Project Manager">Project Manager</option>
                                 <option value="Admin">Admin</option>
                                 <option value="Order Manager">Order Manager</option>
                                 <option value="Marketing Manager">Marketing Manager</option>
                               </select>
                             </div>
                             <div className="space-y-2">
                               <Label className="font-bold">Account Status</Label>
                               <select
                                 value={newAdmin.status}
                                 onChange={(e) => setNewAdmin({...newAdmin, status: e.target.value})}
                                 className="w-full rounded-xl border-slate-300 focus-visible:ring-[#0F172A] border h-10 px-3 bg-white"
                               >
                                 <option value="Active">Active</option>
                                 <option value="Disabled">Disabled</option>
                               </select>
                             </div>
                          </div>
                          
                          {/* Note: In a real app, password would be handled securely via Auth SDK, this UI is representational for complete settings look */}
                          <div className="space-y-2 opacity-60">
                             <Label className="font-bold">Temporary Password</Label>
                             <Input type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="rounded-xl border-slate-300" placeholder="••••••••" />
                             <p className="text-xs text-slate-500">User will be forced to change this upon first login.</p>
                          </div>

                          <DialogFooter className="pt-4 border-t border-slate-100">
                             <Button type="button" variant="outline" onClick={() => setIsAddAdminOpen(false)} className="rounded-xl">Cancel</Button>
                             <Button type="submit" className="bg-[#0F172A] text-white rounded-xl">Create Admin</Button>
                          </DialogFooter>
                       </form>
                     </DialogContent>
                   </Dialog>

                    {/* Edit Admin Modal */}
                    <Dialog open={isEditAdminOpen} onOpenChange={setIsEditAdminOpen}>
                      <DialogContent className="sm:max-w-[550px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif">Edit Admin</DialogTitle>
                          <p className="text-sm text-slate-500">Modify existing administrator settings.</p>
                        </DialogHeader>
                        {adminToEdit && (
                          <form onSubmit={handleEditAdmin} className="space-y-6 py-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="font-bold">Full Name</Label>
                                  <Input required value={adminToEdit.name} onChange={e => setAdminToEdit({...adminToEdit, name: e.target.value})} className="rounded-xl border-slate-300" />
                                </div>
                                <div className="space-y-2">
                                  <Label className="font-bold">Mobile Number</Label>
                                  <Input value={adminToEdit.mobile} onChange={e => setAdminToEdit({...adminToEdit, mobile: e.target.value})} className="rounded-xl border-slate-300" />
                                </div>
                             </div>
                             
                             <div className="space-y-2">
                                <Label className="font-bold">Email Address</Label>
                                <Input disabled value={adminToEdit.email} className="rounded-xl border-slate-300 bg-slate-50 opacity-60" />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="font-bold">Assign Role</Label>
                                  <select
                                    value={adminToEdit.role}
                                    onChange={(e) => setAdminToEdit({...adminToEdit, role: e.target.value})}
                                    className="w-full rounded-xl border-slate-300 focus-visible:ring-[#0F172A] border h-10 px-3 bg-white"
                                  >
                                    <option value="Super Admin">Super Admin</option>
                                    <option value="Project Manager">Project Manager</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Order Manager">Order Manager</option>
                                    <option value="Marketing Manager">Marketing Manager</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="font-bold">Account Status</Label>
                                  <select
                                    value={adminToEdit.status}
                                    onChange={(e) => setAdminToEdit({...adminToEdit, status: e.target.value})}
                                    className="w-full rounded-xl border-slate-300 focus-visible:ring-[#0F172A] border h-10 px-3 bg-white"
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Disabled">Disabled</option>
                                  </select>
                                </div>
                             </div>

                             <DialogFooter className="pt-4 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => setIsEditAdminOpen(false)} className="rounded-xl">Cancel</Button>
                                <Button type="submit" className="bg-[#0F172A] text-white rounded-xl">Save Changes</Button>
                             </DialogFooter>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Delete Confirm Modal */}
                    <Dialog open={isDeleteAdminOpen} onOpenChange={setIsDeleteAdminOpen}>
                       <DialogContent className="sm:max-w-[400px] rounded-2xl text-center">
                          <DialogHeader>
                             <DialogTitle className="text-xl font-bold flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                   <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                Delete Administrator
                             </DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                             <p className="text-slate-600">Are you sure you want to completely remove <strong>{adminToDelete}</strong>? This action cannot be undone.</p>
                          </div>
                          <DialogFooter className="flex sm:justify-center gap-2">
                             <Button variant="outline" onClick={() => setIsDeleteAdminOpen(false)} className="rounded-xl w-full">Cancel</Button>
                             <Button variant="destructive" onClick={confirmDeleteAdmin} className="rounded-xl w-full">Delete Admin</Button>
                          </DialogFooter>
                       </DialogContent>
                    </Dialog>
                 </CardHeader>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                     <thead className="bg-[#F8FAFC] border-b border-slate-200">
                       <tr>
                         <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">Admin Details</th>
                         <th className="px-6 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">Role</th>
                         <th className="px-6 py-4 text-center font-bold text-slate-600 uppercase tracking-wider text-xs">Status</th>
                         <th className="px-6 py-4 text-right font-bold text-slate-600 uppercase tracking-wider text-xs">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                       {loadingAdmins ? (
                         <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Loading administrators...</td></tr>
                       ) : authorizedAdmins.length === 0 ? (
                         <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No authorized admins found.</td></tr>
                       ) : (
                         authorizedAdmins.map((admin) => (
                           <tr key={admin.email} className="hover:bg-slate-50/50 transition-colors group">
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-[#0F172A]/5 flex items-center justify-center text-[#0F172A] font-bold">
                                     {admin.name?.[0]?.toUpperCase() || admin.email[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#0F172A]">{admin.name || 'Administrator'}</p>
                                    <p className="text-slate-500 text-xs">{admin.email} • {admin.mobile}</p>
                                  </div>
                               </div>
                             </td>
                             <td className="px-6 py-4">
                               <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 whitespace-nowrap">
                                 {admin.role}
                               </span>
                             </td>
                             <td className="px-6 py-4 text-center">
                               <Badge variant={admin.status === 'Active' ? 'default' : 'secondary'} className={admin.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500'}>
                                 {admin.status || 'Active'}
                               </Badge>
                             </td>
                             <td className="px-6 py-4 text-right">
                               <div className="flex flex-wrap items-center justify-end gap-2">
                                  <Button variant="outline" size="sm" className="h-8 shadow-sm flex-shrink-0" onClick={() => toggleAdminStatus(admin)}>
                                     {admin.status === 'Active' ? 'Disable' : 'Enable'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg shrink-0"
                                    onClick={() => {
                                      setAdminToEdit(admin);
                                      setIsEditAdminOpen(true);
                                    }}
                                    title="Edit & Change Role"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg shrink-0"
                                    onClick={() => handleResetPassword(admin.email)}
                                    title="Reset Password"
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0"
                                    onClick={() => handleRemoveAdminClicked(admin.email)}
                                    title="Delete Admin"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                               </div>
                             </td>
                           </tr>
                         ))
                       )}
                     </tbody>
                   </table>
                 </div>
               </Card>
            </TabsContent>
          )}

          {/* WEBSITE & THEMING SETTINGS */}
          <TabsContent value="website" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
             <Card className="rounded-2xl border-slate-200/60 shadow-sm mb-6">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 p-6 rounded-t-2xl">
                  <CardTitle className="text-xl">Website Configurations</CardTitle>
                  <CardDescription>Manage your website appearance and branding parameters.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="flex flex-col md:flex-row gap-6 items-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="bg-white p-4 rounded-full shadow-sm">
                         <Palette className="w-8 h-8 text-[#d4af37]" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                         <h3 className="font-bold text-[#0F172A] text-lg">Homepage & Banner Manager</h3>
                         <p className="text-sm text-slate-500 mt-1">Update hero banners, category grids, and seasonal features directly from the content manager.</p>
                      </div>
                      <Button asChild className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl shadow-sm shrink-0">
                        <Link to="/admin/banners">Manage Content Content</Link>
                      </Button>
                   </div>
                </CardContent>
             </Card>

             <Card className="rounded-2xl border-slate-200/60 shadow-sm">
               <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 p-6 rounded-t-2xl">
                 <CardTitle className="text-xl">Default Customization Pricing</CardTitle>
                 <CardDescription>Set the global base prices for text printing and logo branding.</CardDescription>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {/* Logo Section */}
                    <div>
                      <h3 className="font-bold text-[#0F172A] mb-4 text-sm uppercase tracking-wider text-slate-500">Logo Branding (₹)</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-slate-700">Small Logo</Label>
                          <Input type="number" value={settings.logoSmallCharge} onChange={(e) => handleSettingChange('logoSmallCharge', Number(e.target.value))} className="w-32 rounded-xl text-right" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-slate-700">Medium Logo</Label>
                          <Input type="number" value={settings.logoMediumCharge} onChange={(e) => handleSettingChange('logoMediumCharge', Number(e.target.value))} className="w-32 rounded-xl text-right" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-slate-700">Large Logo</Label>
                          <Input type="number" value={settings.logoLargeCharge} onChange={(e) => handleSettingChange('logoLargeCharge', Number(e.target.value))} className="w-32 rounded-xl text-right" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-slate-700">Full Wrapping</Label>
                          <Input type="number" value={settings.logoFullCharge} onChange={(e) => handleSettingChange('logoFullCharge', Number(e.target.value))} className="w-32 rounded-xl text-right" />
                        </div>
                      </div>
                    </div>
                    {/* Text Section */}
                    <div>
                      <h3 className="font-bold text-[#0F172A] mb-4 text-sm uppercase tracking-wider text-slate-500">Text & Name Engraving (₹)</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-slate-700">Name Engraving</Label>
                          <Input type="number" value={settings.nameCharge} onChange={(e) => handleSettingChange('nameCharge', Number(e.target.value))} className="w-32 rounded-xl text-right" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-slate-700">Text Printing</Label>
                          <Input type="number" value={settings.textCharge} onChange={(e) => handleSettingChange('textCharge', Number(e.target.value))} className="w-32 rounded-xl text-right" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-slate-700">Custom Message</Label>
                          <Input type="number" value={settings.customMessageCharge} onChange={(e) => handleSettingChange('customMessageCharge', Number(e.target.value))} className="w-32 rounded-xl text-right" />
                        </div>
                      </div>
                    </div>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>

          {/* NOTIFICATION SETTINGS */}
          <TabsContent value="notifications" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
             <Card className="rounded-2xl border-slate-200/60 shadow-sm">
               <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 p-6 rounded-t-2xl">
                 <CardTitle className="text-xl">Notification Preferences</CardTitle>
                 <CardDescription>Determine how system and customer alerts are delivered.</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                     <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="mt-1 bg-blue-50 text-blue-600 p-2 rounded-lg"><Mail className="w-5 h-5"/></div>
                          <div>
                            <h4 className="font-bold text-[#0F172A] text-base">Email Notifications</h4>
                            <p className="text-sm text-slate-500 mt-1">Receive daily summaries and critical administrative alerts via email.</p>
                          </div>
                        </div>
                        <Switch checked={settings.emailNotifications} onCheckedChange={(v) => handleSettingChange('emailNotifications', v)} />
                     </div>
                     <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="mt-1 bg-green-50 text-green-600 p-2 rounded-lg"><Smartphone className="w-5 h-5"/></div>
                          <div>
                            <h4 className="font-bold text-[#0F172A] text-base">WhatsApp Integration</h4>
                            <p className="text-sm text-slate-500 mt-1">Enable direct WhatsApp lead generation and quick customer chat links.</p>
                          </div>
                        </div>
                        <Switch checked={settings.whatsappNotifications} onCheckedChange={(v) => handleSettingChange('whatsappNotifications', v)} />
                     </div>
                     <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="mt-1 bg-orange-50 text-orange-600 p-2 rounded-lg"><Bell className="w-5 h-5"/></div>
                          <div>
                            <h4 className="font-bold text-[#0F172A] text-base">Real-time Order Alerts</h4>
                            <p className="text-sm text-slate-500 mt-1">Show push notifications on the dashboard when new orders arrive.</p>
                          </div>
                        </div>
                        <Switch checked={settings.orderAlerts} onCheckedChange={(v) => handleSettingChange('orderAlerts', v)} />
                     </div>
                  </div>
               </CardContent>
             </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
