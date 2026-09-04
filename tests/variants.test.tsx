/**
 * Renders the real ProductCard and asserts what a customer sees for a product
 * with colour options. Run with: npm run test:ui
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '../src/components/shop/ProductCard';
import { variantsOf, galleryImages, totalStock, swatchColor } from '../src/lib/variants';
import products from '../imports/nexon-cross.json';

const walmer: any = (products as any[]).find(p => p.name.startsWith('Walmer'));
const single: any = (products as any[]).find(p => !p.variants);

// react-router's useLayoutEffect warns under renderToStaticMarkup and says
// nothing about this component.
const warn = console.error;
console.error = (...a: unknown[]) =>
  String(a[0]).includes('useLayoutEffect') ? undefined : warn(...(a as []));

const walmerHtml = renderToStaticMarkup(
  <MemoryRouter><ProductCard product={{ ...walmer, id: 'w', description: 'd', enabled: true }} /></MemoryRouter>,
);
const singleHtml = renderToStaticMarkup(
  <MemoryRouter><ProductCard product={{ ...single, id: 's', description: 'd', enabled: true }} /></MemoryRouter>,
);

const checks: [string, boolean][] = [
  ['card renders', walmerHtml.length > 500],
  ['says how many colors', walmerHtml.includes('3 colors')],
  ['a swatch per color', (walmerHtml.match(/rounded-full border border-slate-300/g) || []).length === 3],
  ['swatches use the mapped colors', walmerHtml.includes('#1c1c1e') && walmerHtml.includes('#1f2d50')],
  ['leads with the first color photo', walmerHtml.includes('/products/nexon/acp14435759-1.jpg')],
  ["shows that color's dealer code", walmerHtml.includes('ACP14435759-1')],
  // "colors" also occurs in Tailwind's transition-colors, so match the count.
  ['single-color product shows no color row', !/\d+ colors/.test(singleHtml)],
  // React escapes the & in codes like "AC018121-1 & AC990003-1".
  ['single-color product still shows its code',
   singleHtml.includes(String(single.sku).replace(/&/g, '&amp;'))],
  ['variantsOf finds 3', variantsOf(walmer).length === 3],
  ['gallery has one photo per color', galleryImages(walmer).length === 3],
  ['stock is summed across colors', totalStock(walmer) === 275 + 5 + 285],
  ['stock falls back for single-color', totalStock(single) === Number(single.stock)],
  ['unknown color still gets a swatch', swatchColor('Chartreuse') === '#b8bcc2'],
  ['a variant with no color name is ignored', variantsOf({ variants: [{ color: '  ' }, { color: 'Black' }] } as any).length === 1],
];
let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(`\n${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
