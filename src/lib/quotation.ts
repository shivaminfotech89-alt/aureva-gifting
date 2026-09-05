import { BUSINESS, splitGst, TaxSplit } from './business';

/**
 * Quotations and delivery estimates.
 *
 * A corporate buyer cannot raise a purchase order from a shopping cart. They
 * need a document with a number, a validity date, the supplier's GSTIN and the
 * tax split — something to hand to their finance team. This builds that, and
 * the delivery window that goes on it.
 */

export interface QuoteLine {
  name: string;
  sku?: string;
  color?: string;
  quantity: number;
  /** Per unit, before tax. */
  rate: number;
  gstPercent: number;
}

export interface QuoteParty {
  company?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
}

/** How long a quotation is good for. Gifting prices move with the supplier. */
export const QUOTE_VALID_DAYS = 15;

/**
 * Delivery windows measured from Ahmedabad, where the goods ship from.
 *
 * Business days, and for stock items only: anything branded adds production
 * time on top, which is why that is stated separately rather than folded in.
 */
export interface DeliveryEstimate {
  zone: 'ahmedabad' | 'gujarat' | 'west' | 'india' | 'remote';
  minDays: number;
  maxDays: number;
  label: string;
  note: string;
}

const WEST_INDIA = ['maharashtra', 'rajasthan', 'madhya pradesh', 'goa', 'daman and diu', 'dadra and nagar haveli'];
const REMOTE = [
  'jammu and kashmir', 'ladakh', 'arunachal pradesh', 'assam', 'manipur', 'meghalaya',
  'mizoram', 'nagaland', 'sikkim', 'tripura', 'andaman and nicobar islands', 'lakshadweep',
];

const norm = (s?: string | null) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

export function deliveryEstimate(city?: string | null, state?: string | null): DeliveryEstimate {
  const c = norm(city);
  const s = norm(state);

  if (c === 'ahmedabad' || c === 'amdavad') {
    return {
      zone: 'ahmedabad', minDays: 1, maxDays: 2,
      label: '1–2 business days',
      note: 'Local delivery from our Ahmedabad warehouse. Same-day dispatch on confirmed orders placed before 2 PM.',
    };
  }
  if (s === 'gujarat' || s === BUSINESS.stateCode) {
    return {
      zone: 'gujarat', minDays: 2, maxDays: 3,
      label: '2–3 business days',
      note: 'Delivered across Gujarat from our Ahmedabad warehouse.',
    };
  }
  if (REMOTE.includes(s)) {
    return {
      zone: 'remote', minDays: 7, maxDays: 10,
      label: '7–10 business days',
      note: 'Extended transit time applies to this region.',
    };
  }
  if (WEST_INDIA.includes(s)) {
    return {
      zone: 'west', minDays: 3, maxDays: 4,
      label: '3–4 business days',
      note: 'Dispatched from Ahmedabad by surface courier.',
    };
  }
  return {
    zone: 'india', minDays: 4, maxDays: 7,
    label: '4–7 business days',
    note: 'Delivered anywhere in India from our Ahmedabad warehouse.',
  };
}

/** Extra production time before a branded order can ship. */
export const BRANDING_LEAD_DAYS = { min: 3, max: 5 };

export interface QuoteTotals {
  subTotal: number;
  tax: TaxSplit;
  grandTotal: number;
  units: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function quoteTotals(lines: QuoteLine[], placeOfSupply?: string | null): QuoteTotals {
  let subTotal = 0;
  let gst = 0;
  let units = 0;
  for (const l of lines) {
    const qty = Math.max(0, Math.trunc(Number(l.quantity) || 0));
    const amount = round2((Number(l.rate) || 0) * qty);
    subTotal = round2(subTotal + amount);
    gst = round2(gst + amount * ((Number(l.gstPercent) || 0) / 100));
    units += qty;
  }
  const tax = splitGst(gst, placeOfSupply);
  return { subTotal, tax, grandTotal: round2(subTotal + tax.total), units };
}

/**
 * A quotation number a buyer can quote back at us.
 *
 * Date-prefixed so it sorts and can be found later, with a short random tail
 * so two quotes raised in the same second do not collide.
 */
export function quoteNumber(now = new Date()): string {
  const d = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AQ-${d}-${tail}`;
}

export function validUntil(from = new Date(), days = QUOTE_VALID_DAYS): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
