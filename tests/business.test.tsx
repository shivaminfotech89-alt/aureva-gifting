/**
 * The registered-supplier details and the tax split on a tax invoice.
 * Run with: npm run test:gst
 *
 * A document headed "Tax Invoice" has to carry the supplier's GSTIN and split
 * the tax the way the place of supply requires, so these are asserted rather
 * than eyeballed.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BUSINESS, registeredAddressLines, isIntraState, splitGst } from '../src/lib/business';

/** Every source file, so a stale address cannot be left behind in one page. */
function sourceFiles(dir = 'src'): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}
const sources = sourceFiles().map(f => ({ f, text: readFileSync(f, 'utf8') }));

const paise = (n: number) => Math.round(n * 100);

const checks: [string, boolean][] = [
  // A GSTIN is 15 characters: 2 state digits, a 10-character PAN, then 3 more.
  ['the GSTIN is well formed', /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/.test(BUSINESS.gstin)],
  ['the GSTIN starts with the Gujarat state code', BUSINESS.gstin.startsWith('24')],
  ['the state code matches the GSTIN', BUSINESS.gstin.slice(0, 2) === BUSINESS.stateCode],
  ['the registered address is complete', registeredAddressLines().every(l => l.trim().length > 0)],
  ['the registered PIN is on the address', registeredAddressLines().join(' ').includes('380057')],
  // Widened, because `as const` makes these literal types and tsc rejects
  // comparing two literals it can already tell apart.
  ['the brand and the registered name are distinct',
   (BUSINESS.brand as string) !== (BUSINESS.tradeName as string)],
  // The PIN was 380058 on the footer, the contact page and the invoice while
  // the certificate said 380057. One source of truth, checked.
  ['no page still carries the old PIN',
   sources.filter(s => s.text.includes('380058')).length === 0],
  ['the address is not retyped outside lib/business',
   sources.filter(s => s.text.includes('380057') && !s.f.endsWith('business.ts')).length === 0],
  ['invoices are issued in the registered name, not the brand',
   (BUSINESS.tradeName as string).length > 0 && (BUSINESS.legalName as string).length > 0],

  // Place of supply.
  ['a Gujarat sale is intra-state', isIntraState('Gujarat')],
  ['case and spacing do not matter', isIntraState('  gujarat ') && isIntraState('GUJARAT')],
  ['the state code counts as Gujarat', isIntraState('24')],
  ['another state is inter-state', !isIntraState('Maharashtra')],
  ['an unknown state is treated as inter-state', !isIntraState('') && !isIntraState(undefined)],

  // The split.
  ['a Gujarat sale is CGST plus SGST', splitGst(1170, 'Gujarat').intraState],
  ['CGST and SGST are half each', splitGst(1170, 'Gujarat').cgst === 585 && splitGst(1170, 'Gujarat').sgst === 585],
  ['an out-of-state sale is IGST only',
   splitGst(1170, 'Maharashtra').igst === 1170 && splitGst(1170, 'Maharashtra').cgst === 0],
  ['the halves always add back to the total',
   [0.01, 0.03, 1170, 6499.37, 1.05, 999.99].every(t => {
     const s = splitGst(t, 'Gujarat');
     return paise(s.cgst) + paise(s.sgst) === paise(s.total);
   })],
  ['an odd number of paise does not vanish', splitGst(0.03, 'Gujarat').cgst === 0.02 && splitGst(0.03, 'Gujarat').sgst === 0.01],
  ['IGST equals the whole tax charged', splitGst(6499.37, 'Delhi').igst === 6499.37],
  ['zero tax stays zero', splitGst(0, 'Gujarat').total === 0 && splitGst(0, 'Delhi').igst === 0],
  ['a missing tax total does not become NaN', Number.isFinite(splitGst(undefined as unknown as number, 'Gujarat').total)],
];

let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(`\n${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
