/**
 * The registered business behind the Aureva brand.
 *
 * Aureva Corporate Gifting is a brand; the registered supplier is MSD
 * Corporation, a proprietorship. A tax invoice has to name the registered
 * entity and carry its GSTIN, so those details live here rather than being
 * retyped into a page, an invoice and a policy separately.
 *
 * Taken from GST registration certificate REG-06, GSTIN 24DHHPP9291K1ZM.
 */
export const BUSINESS = {
  /** What customers know us as. */
  brand: 'Aureva Corporate Gifting',
  /** The registered trade name. Invoices are issued in this name. */
  tradeName: 'MSD Corporation',
  /** A proprietorship's legal name is the proprietor. Required on a tax invoice. */
  legalName: 'Megha Hasmukhbhai Panchal',
  constitution: 'Proprietorship',
  gstin: '24DHHPP9291K1ZM',
  /** The live site. The catalog PDF printed aurevagifts.com, with an s, which
      is not this domain — every catalog sent out carried a dead address. */
  site: 'https://www.aurevagift.com',
  email: 'aurevagifts@gmail.com',
  phone: '+919825622421',
  whatsapp: '+917990878248',
  /** First two digits of the GSTIN. 24 is Gujarat. */
  stateCode: '24',
  state: 'Gujarat',
  registeredAddress: {
    line1: '1203, Block B, Floor 12',
    line2: 'S Bopal Road, near Swapneel Elysium',
    locality: 'South Bopal',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pin: '380057',
    country: 'India',
  },
} as const;

/** Registered address as lines, for an invoice or a footer. */
export function registeredAddressLines(): string[] {
  const a = BUSINESS.registeredAddress;
  return [a.line1, a.line2, `${a.locality}, ${a.city}`, `${a.state} ${a.pin}, ${a.country}`];
}

/**
 * Whether a sale is inside Gujarat.
 *
 * Place of supply decides whether the tax is CGST plus SGST or IGST. The total
 * a customer pays is the same either way, but a customer claiming input tax
 * credit needs it split correctly on the invoice.
 */
export function isIntraState(placeOfSupply?: string | null): boolean {
  const s = String(placeOfSupply || '').trim().toLowerCase();
  if (!s) return false;
  return s === BUSINESS.stateCode || s.replace(/[^a-z]/g, '') === 'gujarat';
}

export interface TaxSplit {
  intraState: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

/**
 * Splits a GST total for display. Halves are rounded to paise and the second
 * half takes the remainder, so CGST + SGST always equals the total charged
 * rather than drifting by a paisa.
 */
export function splitGst(gstTotal: number, placeOfSupply?: string | null): TaxSplit {
  const total = Math.round((Number(gstTotal) || 0) * 100) / 100;
  if (!isIntraState(placeOfSupply)) {
    return { intraState: false, cgst: 0, sgst: 0, igst: total, total };
  }
  const cgst = Math.round((total / 2) * 100) / 100;
  const sgst = Math.round((total - cgst) * 100) / 100;
  return { intraState: true, cgst, sgst, igst: 0, total };
}
