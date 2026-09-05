import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { Download, Search, Mail, Smartphone, RefreshCw, FileText, Copy, UserCheck, User } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function AdminCatalogLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [userTypeFilter, setUserTypeFilter] = useState('All'); // All, Logged In, Guest

  useEffect(() => {
    const q = query(collection(db, 'catalogLeads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Failed to load catalog leads");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const q = searchQuery.toLowerCase();
    const searchMatch = lead.name?.toLowerCase().includes(q) || 
                       lead.email?.toLowerCase().includes(q) || 
                       lead.phone?.toLowerCase().includes(q) ||
                       lead.company?.toLowerCase().includes(q);
    const categoryMatch = categoryFilter === 'All' || lead.category === categoryFilter;
    
    let userTypeMatch = true;
    if (userTypeFilter === 'Logged In') {
      userTypeMatch = lead.method === 'authenticated';
    } else if (userTypeFilter === 'Guest') {
      userTypeMatch = lead.method !== 'authenticated';
    }

    return searchMatch && categoryMatch && userTypeMatch;
  });

  const categories = ['All', ...Array.from(new Set(leads.map(l => l.category).filter(Boolean)))];

  const exportToExcel = () => {
    if (filteredLeads.length === 0) return toast.info("No data to export");
    
    const ws = XLSX.utils.json_to_sheet(filteredLeads.map(lead => ({
      'Date': lead.createdAt ? format(lead.createdAt.toDate(), 'dd MMM yyyy, hh:mm a') : 'N/A',
      'Name': lead.name || '-',
      'Company': lead.company || '-',
      'Email': lead.email || '-',
      'Mobile Number': lead.phone || '-',
      'User Type': lead.method === 'authenticated' ? 'Logged In (Google)' : 'Guest',
      'Request Method': lead.method === 'email' ? 'Email' : lead.method === 'whatsapp' ? 'WhatsApp' : 'Direct',
      'Requested Category': lead.category || '-',
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalog Leads");
    XLSX.writeFile(wb, `AUREVA_Catalog_Leads_${format(new Date(), 'dd_MMM_yyyy')}.xlsx`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Catalog Leads</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track catalog download requests</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none gap-2 bg-[#d4af37] hover:bg-[#b5952f] text-[#0F172A] font-bold rounded-xl h-11"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search leads by name, email, phone or company..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 rounded-xl max-w-full h-11"
          />
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <select 
            className="h-11 px-4 border rounded-xl bg-slate-50 border-slate-200 text-sm font-medium text-slate-700 outline-none w-full md:w-48 appearance-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c: any) => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
          <select 
            className="h-11 px-4 border rounded-xl bg-slate-50 border-slate-200 text-sm font-medium text-slate-700 outline-none w-full md:w-40 appearance-none"
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
          >
            <option value="All">All Users</option>
            <option value="Logged In">Google Logged In</option>
            <option value="Guest">Guest Users</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Requested Catalog</th>
                <th className="px-6 py-4">Login Type</th>
                <th className="px-6 py-4 text-right min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    No catalog leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.createdAt ? format(lead.createdAt.toDate(), 'dd MMM yyyy, hh:mm a') : 'Just now'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A]">{lead.name || 'Unknown'}</div>
                      <div className="text-slate-500 text-xs mt-0.5 max-w-[200px] truncate" title={lead.company}>
                        {lead.company && lead.company !== 'Not Provided' ? lead.company : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                       {lead.email && (
                          <div className="flex items-center gap-2 group">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-600">{lead.email}</span>
                            <button onClick={() => copyToClipboard(lead.email, 'Email')} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500 transition-opacity">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2 group">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-600">{lead.phone}</span>
                            <button onClick={() => copyToClipboard(lead.phone, 'Mobile Number')} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500 transition-opacity">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-[#d4af37]/10 text-[#0F172A] border-[#d4af37]/30 tracking-tight font-medium rounded-lg">
                        {lead.category || 'Master Catalog'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {lead.method === 'authenticated' ? (
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 py-1 flex items-center gap-1 w-fit">
                           <UserCheck className="w-3 h-3" /> Google Auth
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 py-1 flex items-center gap-1 w-fit">
                           <User className="w-3 h-3" /> Guest ({lead.method === 'email' ? 'Email' : 'WhatsApp'})
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       {lead.phone && (
                          <a 
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.name || ''},\n\nThank you for your interest in AUREVA Corporate Gifting.\n\nWe received your request for the ${lead.category || 'catalog'}.\n\nPlease find our latest product catalog below.\n\nWebsite:\nhttps://aurevagift.com\n\n(Attach catalog PDF here)`)}`}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#25D366] hover:text-[#20bd5a] bg-[#25D366]/10 hover:bg-[#25D366]/20 px-3 py-1.5 rounded-lg transition-colors border border-[#25D366]/20"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                       )}
                       {lead.email && (
                          <a 
                            href={`mailto:${lead.email}?subject=AUREVA Corporate Gifting - ${lead.category || 'Catalog'}&body=Hi ${lead.name || ''},`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </a>
                       )}
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
