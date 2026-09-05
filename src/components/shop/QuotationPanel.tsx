import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Loader2, Truck } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useCartStore } from '../../store/cartStore';
import { deliveryEstimate, QuoteLine, BRANDING_LEAD_DAYS } from '../../lib/quotation';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

/**
 * Lets a corporate buyer take a quotation away with them.
 *
 * A purchase order cannot be raised against a shopping cart: finance wants a
 * numbered document with a validity date, the supplier's GSTIN and the tax
 * split. The city and state are asked for because they decide both the
 * delivery window from Ahmedabad and whether the tax is CGST/SGST or IGST.
 */
export function QuotationPanel() {
  const items = useCartStore(state => state.items);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [busy, setBusy] = useState(false);

  const delivery = deliveryEstimate(city, state);

  const download = async () => {
    if (items.length === 0) return;
    setBusy(true);
    try {
      const lines: QuoteLine[] = items.map(i => ({
        name: i.name,
        sku: i.variantSku,
        color: i.variantColor,
        quantity: i.quantity,
        rate: i.basePrice + (i.customization?.charge || 0),
        gstPercent: i.gstPercent,
      }));
      const { generateQuotationPDF } = await import('../../lib/quotationPdf');
      const { number } = await generateQuotationPDF({
        lines,
        party: { company, contactName, email, city, state },
      });
      toast.success(`Quotation ${number} downloaded.`);
    } catch (err: unknown) {
      toast.error(`Could not generate the quotation: ${(err as Error)?.message || 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
      <h3 className="font-display text-base font-bold text-[var(--navy-800)]">Need a quotation?</h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
        Download a formal quotation with our GSTIN and the GST breakdown, ready for your
        purchase order. No account needed.
      </p>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="q-company" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Company name
          </Label>
          <Input id="q-company" placeholder="Your company" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="q-name" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Contact person
            </Label>
            <Input id="q-name" placeholder="Name" value={contactName} onChange={e => setContactName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="q-email" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Email
            </Label>
            <Input id="q-email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="q-city" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Delivery city
            </Label>
            <Input id="q-city" placeholder="Ahmedabad" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="q-state" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              State
            </Label>
            <select
              id="q-state"
              value={state}
              onChange={e => setState(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Shown as soon as there is somewhere to ship to, not only in the PDF. */}
      {(city.trim() !== '' || state !== '') && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.8} />
          <div className="text-[12.5px] leading-relaxed text-emerald-900">
            <strong>Estimated delivery: {delivery.label}</strong>
            <span className="mt-0.5 block text-emerald-800">{delivery.note}</span>
            <span className="mt-0.5 block text-emerald-800">
              Branding adds {BRANDING_LEAD_DAYS.min}–{BRANDING_LEAD_DAYS.max} business days.
            </span>
          </div>
        </div>
      )}

      <Button
        onClick={download}
        disabled={busy || items.length === 0}
        variant="outline"
        className="mt-4 h-11 w-full gap-2 rounded-xl border-[var(--navy-800)] font-bold text-[var(--navy-800)] hover:bg-[var(--navy-800)] hover:text-white"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {busy ? 'Preparing…' : 'Download quotation (PDF)'}
      </Button>
    </div>
  );
}
