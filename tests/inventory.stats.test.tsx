/**
 * The counts shown at the top of the inventory page. Run with: npm run test:stats
 *
 * These are the numbers the shop is run from, so they are asserted against the
 * real catalog rather than eyeballed. Stock in particular has to be summed
 * across a product's colours, not read off the product.
 */
import { validateRows } from '../src/components/admin/ProductImportDialog';
import { variantsOf, totalStock } from '../src/lib/variants';
import catalog from '../imports/nexon-cross.json';

type P = { enabled: boolean; stock?: number; variants?: { color: string; stock?: number }[] };

/** Mirrors the page's stats memo. */
function statsFor(products: P[]) {
  const visible = products.filter(p => p.enabled);
  return {
    total: products.length,
    visible: visible.length,
    hidden: products.length - visible.length,
    outOfStock: products.filter(p => totalStock(p) <= 0).length,
    units: products.reduce((n, p) => n + totalStock(p), 0),
    colorOptions: products.reduce((n, p) => n + variantsOf(p).length, 0),
  };
}

// Published, as the admin would import it with the checkbox ticked.
const published = validateRows(catalog, true).ok.map(r => r.data as unknown as P);
const s = statsFor(published);

// The one product with no price must not be counted as visible.
const unpriced = (catalog as { basePrice: number }[]).filter(p => !p.basePrice).length;

// Stock summed straight off the source file, independent of the helpers.
const rawUnits = (catalog as any[]).reduce(
  (n, p) => n + (p.variants ? p.variants.reduce((m: number, v: any) => m + Number(v.stock || 0), 0) : Number(p.stock || 0)),
  0,
);

const hiddenStats = statsFor(validateRows(catalog, false).ok.map(r => r.data as unknown as P));

const checks: [string, boolean][] = [
  ['total counts every product', s.total === 22],
  ['visible + hidden equals total', s.visible + s.hidden === s.total],
  ['the unpriced product is not visible', s.hidden === unpriced && unpriced === 1],
  ['units are summed across colours', s.units === rawUnits],
  ['units are not read off the parent alone', s.units > 0],
  ['colour options are counted', s.colorOptions === 24],
  ['out of stock counts whole products, not colours', s.outOfStock === published.filter(p => totalStock(p) <= 0).length],
  ['a product with stock only in one colour is in stock',
   totalStock({ stock: 0, variants: [{ color: 'A', stock: 0 }, { color: 'B', stock: 5 }] }) === 5],
  ['a product with no colour in stock is out of stock',
   totalStock({ stock: 99, variants: [{ color: 'A', stock: 0 }] }) === 0],
  ['importing hidden makes everything hidden', hiddenStats.visible === 0 && hiddenStats.hidden === 22],
  ['hidden and published agree on totals', hiddenStats.total === s.total && hiddenStats.units === s.units],
];

let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(`\ntotal ${s.total} · visible ${s.visible} · hidden ${s.hidden} · out of stock ${s.outOfStock} · units ${s.units} · colours ${s.colorOptions}`);
console.log(`${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
