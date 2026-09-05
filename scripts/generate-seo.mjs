/**
 * Writes robots.txt and sitemap.xml into public/ before the build.
 *
 * Without a sitemap Google has to discover product pages by following links,
 * and the shop only renders them after JavaScript runs. The URLs are taken
 * from the import files, which are the same ids the shop uses.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://www.aurevagift.com';
const PUBLIC = 'public';
const SLUG_MAX = 100;

const idForSku = sku => String(sku || '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, SLUG_MAX);

const STATIC = ['/', '/shop', '/corporate', '/about', '/contact',
                '/privacy', '/terms', '/refund', '/shipping', '/cancellation'];

const products = [];
const categories = new Set();
for (const f of readdirSync('imports').filter(f => f.endsWith('.json') && f !== 'powerplus-ALL.json')) {
  for (const row of JSON.parse(readFileSync(join('imports', f), 'utf8'))) {
    const id = idForSku(row.sku || row.name);
    if (id) products.push(id);
    if (row.categoryId) categories.add(row.categoryId);
  }
}

const today = new Date().toISOString().slice(0, 10);
const url = (loc, priority, freq) =>
  `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
  `    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const body = [
  ...STATIC.map(p => url(p, p === '/' ? '1.0' : '0.7', 'weekly')),
  ...[...categories].sort().map(c => url(`/shop?category=${encodeURIComponent(c)}`, '0.8', 'weekly')),
  ...[...new Set(products)].sort().map(id => url(`/product/${escape(id)}`, '0.6', 'monthly')),
].join('\n');

if (!existsSync(PUBLIC)) mkdirSync(PUBLIC, { recursive: true });
writeFileSync(join(PUBLIC, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);

writeFileSync(join(PUBLIC, 'robots.txt'),
  `User-agent: *\nAllow: /\n\n# The admin panel is behind a login; there is nothing there to index.\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nDisallow: /cart\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`sitemap.xml: ${STATIC.length} pages, ${categories.size} categories, ${new Set(products).size} products`);
