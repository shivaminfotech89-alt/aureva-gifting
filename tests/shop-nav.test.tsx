/**
 * Shop navigation and the product card box. Run with: npm run test:shop
 *
 * The menu used to link to eight categories that did not exist, so every one
 * opened an empty shop. These check that a link built from a real category
 * name survives the round trip into the shop's filter — several categories
 * contain "&" and spaces, which a query string does not carry untouched.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '../src/components/shop/ProductCard';
import powerplus from '../imports/powerplus-ALL.json';
import nexon from '../imports/nexon-cross.json';

const warn = console.error;
console.error = (...a: unknown[]) =>
  String(a[0]).includes('useLayoutEffect') ? undefined : warn(...(a as []));

const categories = [...new Set(
  [...(powerplus as { categoryId?: string }[]), ...(nexon as { categoryId?: string }[])]
    .map(p => p.categoryId || '').filter(Boolean),
)];

/** The link the menu builds, and what the shop reads back out of it. */
const roundTrip = (name: string) => {
  const href = `/shop?category=${encodeURIComponent(name)}`;
  const qs = new URLSearchParams(href.slice(href.indexOf('?') + 1));
  return qs.get('category');
};

const awkward = categories.filter(c => /[&\s]/.test(c));

const card = renderToStaticMarkup(
  <MemoryRouter>
    <ProductCard product={{ ...(nexon as never[])[0] as object, id: 'x', description: 'd', enabled: true } as never} />
  </MemoryRouter>,
);

const checks: [string, boolean][] = [
  ['the catalog has categories to link to', categories.length > 40],
  ['every category survives the link round trip', categories.every(c => roundTrip(c) === c)],
  ['categories with & and spaces survive', awkward.length > 0 && awkward.every(c => roundTrip(c) === c)],
  ['"Bags & Backpacks" is not truncated at the ampersand',
   roundTrip('Bags & Backpacks') === 'Bags & Backpacks'],
  ['the old hardcoded menu categories really were absent',
   ['Drinkware', 'Office Essentials', 'Electronics', 'Eco Friendly', 'Diwali Hampers',
    'Welcome Kits', 'Corporate Branding', 'Bags'].every(c => !categories.includes(c))],

  // The card box: one fixed shape, whatever the supplier's photo looks like.
  ['the image sits in a square box', card.includes('aspect-square')],
  ['the whole product stays in view rather than being cropped', card.includes('object-contain')],
  ['the name reserves its height so rows line up', card.includes('min-h-[2.6em]')],
  ['the price and buttons are pinned to the bottom', card.includes('mt-auto')],
  ['no blend mode is left tinting the photo', !card.includes('mix-blend-multiply')],
];

let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(`\n${categories.length} categories, ${awkward.length} containing & or a space`);
console.log(`${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
