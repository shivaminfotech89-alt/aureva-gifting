import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Trash2, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

export default function AdminSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    adminEmail: '',
    adminWhatsApp: '',
    logoCharge: 150,
    textCharge: 50,
  });

  const [authorizedAdmins, setAuthorizedAdmins] = useState<{email: string}[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const isSuperAdmin = user?.email === 'shivaminfotech89@gmail.com' || user?.email === 'aurevagiftingsolution@gmail.com';

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'admin');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({
             adminEmail: docSnap.data().adminEmail || '',
             adminWhatsApp: docSnap.data().adminWhatsApp || '',
             logoCharge: docSnap.data().logoCharge || 150,
             textCharge: docSnap.data().textCharge || 50,
          });
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
      setAuthorizedAdmins(snapshot.docs.map(doc => ({ email: doc.id })));
    } catch (error) {
       console.error("Error loading admins", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
       toast.error('Valid email is required');
       return;
    }
    
    try {
      await setDoc(doc(db, 'admin_settings', newAdminEmail.trim()), { addedAt: Date.now() });
      setNewAdminEmail('');
      toast.success('Admin authorized successfully');
      loadAuthorizedAdmins();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admin_settings');
      toast.error('Failed to authorize admin');
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if(!window.confirm(`Remove admin access for ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'admin_settings', email));
      toast.success('Admin removed successfully');
      loadAuthorizedAdmins();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'admin_settings');
      toast.error('Failed to remove admin');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'admin'), {
        adminEmail: settings.adminEmail,
        adminWhatsApp: settings.adminWhatsApp,
        logoCharge: Number(settings.logoCharge),
        textCharge: Number(settings.textCharge),
        updatedAt: Date.now()
      }, { merge: true });
      toast.success('Admin settings updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/admin');
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back</Link>
         </Button>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#0F172A]">System Settings</h1>
          <p className="text-slate-500 mt-2">Manage your administrative preferences and system access.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold font-serif text-xl text-[#0F172A]">Notification Preferences</h2>
            <p className="text-sm text-slate-500 mt-1">Configure where you want to receive order updates.</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-slate-700 font-bold">Admin Email ID</Label>
                <Input 
                  id="adminEmail" 
                  type="email" 
                  placeholder="admin@aureva.com" 
                  value={settings.adminEmail} 
                  onChange={(e) => setSettings({...settings, adminEmail: e.target.value})} 
                  className="rounded-xl border-slate-200 focus-visible:ring-[#d4af37]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminWhatsApp" className="text-slate-700 font-bold">Admin WhatsApp Number</Label>
                <Input 
                  id="adminWhatsApp" 
                  type="tel" 
                  placeholder="e.g. 919876543210" 
                  value={settings.adminWhatsApp} 
                  onChange={(e) => setSettings({...settings, adminWhatsApp: e.target.value})} 
                  className="rounded-xl border-slate-200 focus-visible:ring-[#d4af37]"
                />
                <p className="text-xs text-slate-400">Used for the floating action button and checkout alerts.</p>
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-100">
                 <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Customization Pricing</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="logoCharge" className="text-slate-700 font-bold">Logo Printing (₹)</Label>
                   <Input 
                     id="logoCharge" 
                     type="number" 
                     min="0"
                     value={settings.logoCharge} 
                     onChange={(e) => setSettings({...settings, logoCharge: Number(e.target.value)})} 
                     className="rounded-xl border-slate-200 focus-visible:ring-[#d4af37]"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="textCharge" className="text-slate-700 font-bold">Name/Text (₹)</Label>
                   <Input 
                     id="textCharge" 
                     type="number" 
                     min="0"
                     value={settings.textCharge} 
                     onChange={(e) => setSettings({...settings, textCharge: Number(e.target.value)})} 
                     className="rounded-xl border-slate-200 focus-visible:ring-[#d4af37]"
                   />
                 </div>
              </div>
              
              <Button type="submit" disabled={saving} className="w-full bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] font-bold rounded-xl h-12 shadow-sm">
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold font-serif text-xl text-[#0F172A]">Authorized Admins</h2>
              <p className="text-sm text-slate-500 mt-1">System access control for administrators.</p>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={handleAddAdmin} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="admin_member@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#0F172A]"
                />
                <Button type="submit" className="gap-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl h-10 px-6">
                  <UserPlus className="h-4 w-4" /> Add
                </Button>
              </form>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8FAFC] border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-left font-bold text-[11px] uppercase tracking-wider text-slate-500">Email</th>
                      <th className="px-5 py-3 text-right font-bold text-[11px] uppercase tracking-wider text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingAdmins ? (
                      <tr>
                        <td colSpan={2} className="px-5 py-6 text-center text-slate-500">Loading admins...</td>
                      </tr>
                    ) : authorizedAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-5 py-6 text-center text-slate-500">No authorized admins added yet.</td>
                      </tr>
                    ) : (
                      authorizedAdmins.map((admin) => (
                        <tr key={admin.email} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-medium text-[#0F172A]">{admin.email}</td>
                          <td className="px-5 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                              onClick={() => handleRemoveAdmin(admin.email)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
