import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Card } from '../../components/ui/card';
import { Button, buttonVariants } from '../../components/ui/button';
import { Users, Search, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Customer {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: string;
  createdAt: any;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'customer'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];
      setCustomers(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back</Link>
         </Button>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-serif text-[#0F172A]">Customers</h1>
        <div className="flex bg-white border border-slate-200 rounded-xl px-4 py-2 w-full sm:w-72 shadow-sm focus-within:border-[#d4af37] focus-within:ring-1 focus-within:ring-[#d4af37] transition-all">
          <Search className="h-4 w-4 text-slate-400 mr-2 mt-0.5" />
          <input 
            className="bg-transparent border-none outline-none text-sm w-full text-[#0F172A] placeholder:text-slate-400" 
            placeholder="Search customers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC] border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-medium">Customer Name</th>
                <th className="px-6 py-5 font-medium">Email Address</th>
                <th className="px-6 py-5 font-medium">Joined</th>
                <th className="px-6 py-5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 border-dashed border-2 border-slate-200 m-4 text-center rounded-2xl">
                    <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No customers found.</p>
                  </td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500">
                        {customer.name?.charAt(0) || customer.email?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-bold text-[#0F172A]">{customer.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                     {customer.email}
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium whitespace-nowrap">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <a href={`mailto:${customer.email}`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-9 gap-2 rounded-lg border-slate-200 text-slate-700 hover:text-[#0F172A]" })}>
                       <Mail className="h-4 w-4 text-slate-400" /> Email
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
