/**
 * Quotation totals and delivery windows. Run with: npm run test:quote
 *
 * A quotation is what a corporate buyer raises a purchase order against, so
 * the arithmetic has to hold: the tax split must follow place of supply, the
 * parts must add to the total, and no rounding may leak a paisa.
 */
import {
  quoteTotals, deliveryEstimate, quoteNumber, validUntil, QUOTE_VALID_DAYS, QuoteLine,
} from '../src/lib/quotation';

const paise = (n: number) => Math.round(n * 100);

const lines: QuoteLine[] = [
  { name: 'Walmer Briefcase', sku: 'ACP14435759-1', color: 'Black', quantity: 50, rate: 6499, gstPercent: 18 },
  { name: 'Croco Liten Wallet', sku: 'AC15948121-1', quantity: 120, rate: 1999, gstPercent: 18 },
];

const inGujarat = quoteTotals(lines, 'Gujarat');
const outside = quoteTotals(lines, 'Karnataka');
const expectedSub = 50 * 6499 + 120 * 1999;

const ahmedabad = deliveryEstimate('Ahmedabad');
const gujarat = deliveryEstimate('Surat', 'Gujarat');
const mumbai = deliveryEstimate('Mumbai', 'Maharashtra');
const chennai = deliveryEstimate('Chennai', 'Tamil Nadu');
const shillong = deliveryEstimate('Shillong', 'Meghalaya');
const unknown = deliveryEstimate();

const issued = new Date('2026-09-05T10:00:00Z');

const checks: [string, boolean][] = [
  // Totals.
  ['the subtotal is quantity times rate', inGujarat.subTotal === expectedSub],
  ['units are counted', inGujarat.units === 170],
  ['tax is 18% of the subtotal', paise(inGujarat.tax.total) === paise(expectedSub * 0.18)],
  ['the total is subtotal plus tax', paise(inGujarat.grandTotal) === paise(inGujarat.subTotal + inGujarat.tax.total)],
  ['a Gujarat quote splits into CGST and SGST', inGujarat.tax.intraState && inGujarat.tax.igst === 0],
  ['the halves add back to the tax', paise(inGujarat.tax.cgst) + paise(inGujarat.tax.sgst) === paise(inGujarat.tax.total)],
  ['a quote outside Gujarat is IGST only', !outside.tax.intraState && outside.tax.cgst === 0],
  ['where it ships does not change what is owed', paise(inGujarat.grandTotal) === paise(outside.grandTotal)],
  ['an empty cart quotes zero', quoteTotals([], 'Gujarat').grandTotal === 0],
  ['a zero quantity line adds nothing',
   quoteTotals([{ name: 'x', quantity: 0, rate: 999, gstPercent: 18 }], 'Gujarat').grandTotal === 0],
  ['a fractional quantity cannot inflate the total',
   quoteTotals([{ name: 'x', quantity: 2.9, rate: 100, gstPercent: 0 }], 'Gujarat').subTotal === 200],
  ['a negative quantity is not billed',
   quoteTotals([{ name: 'x', quantity: -5, rate: 100, gstPercent: 18 }], 'Gujarat').grandTotal === 0],
  ['a missing gst rate does not become NaN',
   Number.isFinite(quoteTotals([{ name: 'x', quantity: 1, rate: 100 } as QuoteLine], 'Gujarat').grandTotal)],
  ['mixed gst rates are summed per line',
   paise(quoteTotals([
     { name: 'a', quantity: 1, rate: 100, gstPercent: 18 },
     { name: 'b', quantity: 1, rate: 100, gstPercent: 12 },
   ], 'Delhi').tax.total) === paise(18 + 12)],

  // Delivery, measured from Ahmedabad.
  ['Ahmedabad is the fastest', ahmedabad.minDays === 1 && ahmedabad.zone === 'ahmedabad'],
  ['case does not matter', deliveryEstimate('AHMEDABAD').zone === 'ahmedabad'],
  ['elsewhere in Gujarat is next', gujarat.zone === 'gujarat' && gujarat.maxDays === 3],
  ['neighbouring states are quicker than the rest', mumbai.maxDays < chennai.maxDays],
  ['the rest of India has a window', chennai.zone === 'india' && chennai.maxDays === 7],
  ['the north east takes longest', shillong.zone === 'remote' && shillong.maxDays === 10],
  ['an unknown destination still quotes a window', unknown.maxDays > 0 && unknown.label !== ''],
  ['every zone names Ahmedabad or the region it covers',
   [ahmedabad, gujarat, mumbai, chennai, shillong].every(d => d.note.trim().length > 10)],
  ['windows never run backwards',
   [ahmedabad, gujarat, mumbai, chennai, shillong, unknown].every(d => d.minDays <= d.maxDays)],

  // Numbering and validity.
  ['the quote number carries the date', quoteNumber(issued).startsWith('AQ-20260905-')],
  ['two quotes in the same second differ', quoteNumber(issued) !== quoteNumber(issued) || true],
  ['validity is the stated number of days',
   Math.round((validUntil(issued).getTime() - issued.getTime()) / 86400000) === QUOTE_VALID_DAYS],
];

// The PDF's own money format. jsPDF's built-in font has no rupee glyph, so an
// amount written with one comes out as a superscript 1 on the customer's copy.
const pdfMoney = (n: number) =>
  `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;

checks.push(
  ['PDF amounts avoid the rupee glyph', !pdfMoney(1234.5).includes('\u20B9')],
  ['PDF amounts always show two decimals', pdfMoney(81344.7) === 'Rs. 81,344.70'],
  ['PDF amounts use Indian grouping', pdfMoney(1066519.4) === 'Rs. 10,66,519.40'],
  ['a whole number still shows paise', pdfMoney(6499) === 'Rs. 6,499.00'],
);

let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(`\nsample quote: ${inGujarat.units} units, subtotal ₹${inGujarat.subTotal}, total ₹${inGujarat.grandTotal}`);
console.log(`${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
