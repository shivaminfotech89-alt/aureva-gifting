/**
 * Guards the built output against the bug that blanked every product page.
 *
 * vite's base was './', so index.html referenced ./assets/index.js. A relative
 * URL resolves against the current path, so /product/<id> asked for
 * /product/assets/index.js, got a 404, and rendered nothing. The homepage and
 * one-level routes worked, which is why it shipped.
 *
 * Runs on the build output, so it needs no browser and cannot flake.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const failures = [];
const pass = [];

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`No ${DIST}/index.html — run npm run build first.`);
  process.exit(1);
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(m => m[1])
  .filter(u => !u.startsWith('data:') && !u.startsWith('http') && !u.startsWith('//'));

const check = (name, ok, detail = '') => (ok ? pass : failures).push(`${name}${detail ? ` — ${detail}` : ''}`);

check('index.html references at least one asset', refs.length > 0);
for (const ref of refs) {
  check(`asset path is absolute: ${ref}`, ref.startsWith('/'),
        ref.startsWith('.') ? 'relative paths break on routes more than one level deep' : '');
}
check('every referenced asset exists',
      refs.every(r => existsSync(join(DIST, r.replace(/^\//, '').split('?')[0]))));

// Admin-only libraries must not be in the first load. Naming a chunk in
// manualChunks puts it in the entry's preload set, which is how 720 KB of
// charting and PDF code ended up on the homepage.
const preloaded = [...html.matchAll(/<link rel="modulepreload"[^>]*href="([^"]+)"/g)].map(m => m[1]);
const entryBytes = [...new Set([...refs, ...preloaded])]
  .map(r => join(DIST, r.replace(/^\//, '').split('?')[0]))
  .filter(existsSync)
  .reduce((n, f) => n + statSync(f).size, 0);
check(`first visit stays under 1.6 MB (currently ${Math.round(entryBytes / 1024)} KB)`,
      entryBytes < 1.6 * 1024 * 1024);

// The product photos are served as plain files, so a missing folder means every
// imported product silently falls back to the placeholder.
const photos = join(DIST, 'products', 'nexon');
check('product photos are in the build',
      existsSync(photos) && readdirSync(photos).length > 0,
      existsSync(photos) ? '' : 'dist/products/nexon is missing');

for (const p of pass) console.log(`ok   ${p}`);
for (const f of failures) console.log(`FAIL ${f}`);
console.log(`\n${pass.length} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
