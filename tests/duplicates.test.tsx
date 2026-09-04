/**
 * Duplicate protection for the inventory. Run with: npm run test:dupes
 *
 * Two ways the same item used to end up in the shop twice:
 *   1. Grouping colourways into one product left the other colours behind as
 *      standalone products.
 *   2. Adding a product by hand always minted a fresh id, so entering the same
 *      dealer code twice created two products.
 */
import { validateRows, idForSku } from '../src/components/admin/ProductImportDialog';
import ungrouped from '../imports/nexon-cross.json';

/** Mirrors the dialog's supersededIds. */
function superseded(rows: { id: string; data: Record<string, unknown> }[], existing: Set<string>) {
  const out = new Set<string>();
  for (const row of rows) {
    for (const v of ((row.data.variants as { sku?: string }[]) || [])) {
      const id = idForSku(v.sku || '');
      if (id && id !== row.id && existing.has(id)) out.add(id);
    }
  }
  return [...out];
}

const { ok: grouped, errors } = validateRows(ungrouped, true);

// The inventory as it stands after importing the ungrouped, 36-line catalog:
// every colourway is its own product.
const everyColourway = new Set<string>();
for (const row of grouped) {
  everyColourway.add(row.id);
  for (const v of ((row.data.variants as { sku?: string }[]) || [])) {
    const id = idForSku(v.sku || '');
    if (id) everyColourway.add(id);
  }
}

const dupes = superseded(grouped, everyColourway);
const totalColours = grouped.reduce((n, r) => n + (((r.data.variants as unknown[]) || []).length), 0);
const grouping = grouped.filter(r => ((r.data.variants as unknown[]) || []).length > 0);

// Re-importing the same file into the tidied inventory must find nothing to do.
const afterCleanup = new Set([...everyColourway].filter(id => !dupes.includes(id)));
const secondPass = superseded(grouped, afterCleanup);

const checks: [string, boolean][] = [
  ['the catalog validates', errors.length === 0 && grouped.length === 22],
  ['leftover colourways are found', dupes.length === totalColours - grouping.length],
  ['14 duplicates found for this catalog', dupes.length === 14],
  ['a product never supersedes itself', grouped.every(r => !dupes.includes(r.id))],
  ['re-importing finds nothing to remove', secondPass.length === 0],
  ['nothing to remove on a clean inventory', superseded(grouped, new Set()).length === 0],
  ['ids are stable, so a re-import updates', idForSku('ACP14435759-1') === idForSku('acp14435759-1')],
  ['a code with punctuation still maps to one id',
   idForSku('AC018121-1 & AC990003-1') === 'ac018121-1-ac990003-1'],
  ['a blank code maps to no id', idForSku('') === '' && idForSku('  &  ') === ''],
  ['the same file imported twice creates no new rows',
   validateRows(ungrouped, true).ok.every(r => grouped.some(g => g.id === r.id))],
  ['every id in the catalog is distinct', new Set(grouped.map(r => r.id)).size === grouped.length],
];

let bad = 0;
for (const [n, okc] of checks) { console.log(`${okc ? 'ok  ' : 'FAIL'} ${n}`); if (!okc) bad++; }
console.log(`\n${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
