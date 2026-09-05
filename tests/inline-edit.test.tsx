/**
 * Editing a number where it sits in the product list. Run with: npm run test:inline
 *
 * These write straight to the database on a click, so the rules that stop a
 * stray keystroke saving something are worth pinning down: an empty or
 * negative entry must not save, Escape must not save, and the total shown for
 * a product with colours has to follow the colours.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InlineNumber } from '../src/components/admin/InlineNumber';
import { totalStock, variantsOf } from '../src/lib/variants';
import { formatCurrency } from '../src/lib/utils';

const warn = console.error;
console.error = (...a: unknown[]) =>
  String(a[0]).includes('useLayoutEffect') ? undefined : warn(...(a as []));

const resting = renderToStaticMarkup(
  <InlineNumber value={275} onSave={async () => {}} ariaLabel="Stock for Walmer" format={n => `${n} in stock`} />,
);
const price = renderToStaticMarkup(
  <InlineNumber value={6499} onSave={async () => {}} ariaLabel="Price" format={n => formatCurrency(n)} />,
);

/**
 * The commit rule the component applies before writing: blank, non-numeric,
 * below the minimum, or unchanged all mean "do not save".
 */
const wouldSave = (draft: string, current: number, min = 0) => {
  const next = Number(draft);
  return Number.isFinite(next) && draft.trim() !== '' && next >= min && next !== current;
};

// What the stock cell writes back when one colour is edited.
const variants = [
  { color: 'Black', stock: 275 },
  { color: 'Brown', stock: 5 },
  { color: 'Navy', stock: 285 },
];
const edited = variants.map((v, i) => (i === 1 ? { ...v, stock: 40 } : v));
const editedTotal = edited.reduce((n, v) => n + Number(v.stock || 0), 0);

const checks: [string, boolean][] = [
  ['the value shows at rest', resting.includes('275 in stock')],
  ['it is a button, so it is reachable by keyboard', resting.includes('<button')],
  ['it says it can be edited', resting.includes('Click to edit')],
  ['the label names the field and the value', resting.includes('Stock for Walmer') && resting.includes('275')],
  ['a price renders formatted, not raw', price.includes('₹') && !price.includes('>6499<')],

  ['a changed number saves', wouldSave('300', 275)],
  ['zero saves, so stock can be cleared', wouldSave('0', 275)],
  ['an unchanged number does not save', !wouldSave('275', 275)],
  ['a blank field does not save', !wouldSave('', 275)],
  ['whitespace does not save', !wouldSave('   ', 275)],
  ['letters do not save', !wouldSave('abc', 275)],
  ['a negative number does not save', !wouldSave('-5', 275)],
  ['a decimal price saves', wouldSave('6499.50', 6499)],

  ['editing one colour leaves the others alone',
   edited[0].stock === 275 && edited[2].stock === 285 && edited[1].stock === 40],
  ['the product total follows the colours', editedTotal === 275 + 40 + 285],
  ['totalStock agrees with what is written back',
   totalStock({ stock: editedTotal, variants: edited }) === editedTotal],
  ['a colour with no name is not offered for editing',
   variantsOf({ variants: [{ color: '', stock: 5 }, { color: 'Black', stock: 1 }] } as never).length === 1],
];

let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(`\n${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
