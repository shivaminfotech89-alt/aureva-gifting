/**
 * Where a homepage tile sends a customer. Run with: npm run test:tiles
 *
 * Every festival campaign opened an empty shop, because the tile linked to
 * /shop?q=<its own title> — a text search of product names, and no product is
 * called "Diwali Hampers". These pin down that a tile pointed at a real
 * category lands on products.
 */
import powerplus from '../imports/powerplus-ALL.json';
import nexon from '../imports/nexon-cross.json';

/** Mirrors homeTileLink in HomePage. */
function homeTileLink(linkCategory: string | undefined, label: string, fallback: 'category' | 'search' = 'category') {
  const chosen = String(linkCategory || '').trim();
  if (chosen) return `/shop?category=${encodeURIComponent(chosen)}`;
  return fallback === 'search'
    ? `/shop?q=${encodeURIComponent(label)}`
    : `/shop?category=${encodeURIComponent(label)}`;
}

const products = [...(powerplus as any[]), ...(nexon as any[])];
const categories = [...new Set(products.map(p => p.categoryId).filter(Boolean))];

/** What the shop finds for a link, using the same filters ShopPage applies. */
function productsFor(link: string): number {
  const qs = new URLSearchParams(link.slice(link.indexOf('?') + 1));
  const category = qs.get('category');
  const q = (qs.get('q') || '').toLowerCase();
  return products.filter(p => {
    if (category && (p.categoryId || 'Uncategorized') !== category) return false;
    if (q && !(`${p.name} ${p.description || ''}`.toLowerCase().includes(q))) return false;
    return true;
  }).length;
}

// The three campaigns that used to write themselves into the database.
const OLD_CAMPAIGNS = ['Diwali Hampers', 'New Year Kits', 'Welcome Kits'];
const OLD_CATEGORY_TILES = ['Executive Drinkware', 'Office Essentials', 'Tech Gadgets', 'Eco-friendly'];

const checks: [string, boolean][] = [
  ['the catalog has categories a tile can point at', categories.length > 40],

  // The old behaviour, kept as evidence of what was wrong.
  ['every old festival campaign found nothing',
   OLD_CAMPAIGNS.every(t => productsFor(homeTileLink(undefined, t, 'search')) === 0)],
  ['every old category tile found nothing',
   OLD_CATEGORY_TILES.every(t => productsFor(homeTileLink(undefined, t)) === 0)],

  // The fix.
  ['a campaign pointed at a real category finds products',
   productsFor(homeTileLink('Briefcases', 'Diwali Hampers', 'search')) > 0],
  ['the chosen category wins over the title',
   homeTileLink('Wallets', 'Diwali Hampers', 'search') === '/shop?category=Wallets'],
  ['every real category yields products when chosen',
   categories.every(c => productsFor(homeTileLink(c, 'anything', 'search')) > 0)],
  ['a category name with an ampersand survives the link',
   productsFor(homeTileLink('Bags & Backpacks', 'x')) > 0],
  ['a blank choice falls back rather than linking to nothing',
   homeTileLink('   ', 'Briefcases') === '/shop?category=Briefcases'],
  ['an untouched category tile that names a real category still works',
   productsFor(homeTileLink(undefined, 'Briefcases')) > 0],
];

let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(`\n${categories.length} categories available to point a tile at`);
console.log(`${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
