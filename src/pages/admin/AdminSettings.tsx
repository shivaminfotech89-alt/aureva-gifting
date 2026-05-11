import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Trash2, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function AdminSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    adminEmail: '',
    adminWhatsApp: '',
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
        updatedAt: Date.now()
      });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your administrative preferences and system access.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Configure where you want to receive order updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email ID</Label>
                <Input 
                  id="adminEmail" 
                  type="email" 
                  placeholder="admin@aureva.com" 
                  value={settings.adminEmail} 
                  onChange={(e) => setSettings({...settings, adminEmail: e.target.value})} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminWhatsApp">Admin WhatsApp Number</Label>
                <Input 
                  id="adminWhatsApp" 
                  type="tel" 
                  placeholder="e.g. 919876543210" 
                  value={settings.adminWhatsApp} 
                  onChange={(e) => setSettings({...settings, adminWhatsApp: e.target.value})} 
                />
                <p className="text-xs text-muted-foreground">Used for the floating action button and checkout alerts.</p>
              </div>
              
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Authorized Admins (Emergency Access)</CardTitle>
              <CardDescription>System access control for administrators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddAdmin} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="admin_member@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <Button type="submit" className="gap-2">
                  <UserPlus className="h-4 w-4" /> Add
                </Button>
              </form>

              <div className="mt-6 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Email</th>
                      <th className="px-4 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAdmins ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-4 text-center">Loading admins...</td>
                      </tr>
                    ) : authorizedAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-4 text-center text-muted-foreground">No authorized admins added yet.</td>
                      </tr>
                    ) : (
                      authorizedAdmins.map((admin) => (
                        <tr key={admin.email} className="border-t">
                          <td className="px-4 py-3">{admin.email}</td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive h-8 w-8 p-0"
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
