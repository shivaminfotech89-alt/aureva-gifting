import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Compass, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminPlaceholderPage() {
  const location = useLocation();
  const titleName = location.pathname.split('/').pop()?.replace(/-/g, ' ');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
         <Button variant="outline" size="sm" asChild className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] rounded-xl h-10 shadow-sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4"/> Back to Dashboard</Link>
         </Button>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="flex flex-col items-center max-w-lg mx-auto">
          <div className="w-24 h-24 bg-[#0F172A]/5 border border-slate-100 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
             <Compass className="w-10 h-10 text-[#d4af37]" />
          </div>
          <h1 className="text-4xl font-bold font-serif text-[#0F172A] mb-4 capitalize">{titleName} Module</h1>
          <p className="text-slate-500 text-lg mb-8 leading-relaxed">
            This module is currently part of the enterprise upgrade road-map and will be activated in the next phase of the platform rollout.
          </p>
          <div className="flex gap-4">
             <Button asChild size="lg" className="rounded-xl px-8 h-12 bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] font-bold shadow-sm">
               <Link to="/admin">Return to Dashboard</Link>
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
