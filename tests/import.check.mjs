// Validates every imports/*.json file against the live Firestore rules by
// writing it as an admin, exactly as the admin panel's Import button does.
import { initializeTestEnvironment, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, writeBatch, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { readFileSync, readdirSync } from 'node:fs';

const env = await initializeTestEnvironment({ projectId: 'aureva-import-check',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
await env.clearFirestore();
const admin = env.authenticatedContext('u', { email: 'shivaminfotech89@gmail.com' }).firestore();

// powerplus-ALL.json is the numbered files concatenated for a single import,
// so checking it alongside them would report every sku as a duplicate of
// itself. Verify the parts, then verify the aggregate matches them.
const files = readdirSync('imports')
  .filter(f => f.endsWith('.json') && f !== 'powerplus-ALL.json')
  .sort();
let total = 0;
const skus = new Map();

for (const f of files) {
  const rows = JSON.parse(readFileSync(`imports/${f}`, 'utf8'));
  const batch = writeBatch(admin);
  for (const r of rows) {
    if (!r.name) throw new Error(`${f}: a row is missing "name"`);
    const id = String(r.sku || r.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
    if (skus.has(id)) throw new Error(`${f}: sku "${r.sku}" already used in ${skus.get(id)}`);
    skus.set(id, f);
    batch.set(doc(admin, 'products', id), {
      name: r.name, description: r.description || '', sku: r.sku || '', categoryId: r.categoryId || '',
      basePrice: Number(r.basePrice ?? 0), gstPercent: Number(r.gstPercent ?? 18),
      stock: Number(r.stock ?? 0), enabled: r.enabled === true,
      minOrderQuantity: Number(r.minOrderQuantity ?? 1),
      availabilityStatus: r.availabilityStatus || 'available_on_request',
      images: r.images || [], createdAt: serverTimestamp(),
    }, { merge: true });
  }
  await assertSucceeds(batch.commit());
  total += rows.length;
  console.log(`  ${f}: ${rows.length} products`);
}

// The aggregate must equal the sum of the parts, or an import of ALL would
// silently ship something different from the files that were checked.
const combined = JSON.parse(readFileSync('imports/powerplus-ALL.json', 'utf8'));
const partSkus = new Set();
for (const f of files) JSON.parse(readFileSync(`imports/${f}`, 'utf8')).forEach(r => partSkus.add(r.sku));
const combinedSkus = new Set(combined.map(r => r.sku));
if (combined.length !== total) throw new Error(`powerplus-ALL.json has ${combined.length} rows, the parts have ${total}`);
for (const sku of partSkus) if (!combinedSkus.has(sku)) throw new Error(`powerplus-ALL.json is missing sku ${sku}`);
console.log(`\npowerplus-ALL.json matches the parts: ${combined.length} rows, ${combinedSkus.size} distinct skus`);

const snap = await getDocs(collection(admin, 'products'));
const cats = {};
snap.docs.forEach(d => { const c = d.data().categoryId || '(none)'; cats[c] = (cats[c] || 0) + 1; });
console.log(`\n${snap.size} products written (${total} rows, no id collisions)`);
console.log('hidden until priced:', snap.docs.filter(d => d.data().enabled === false).length, '/', snap.size);
console.log('categories:', Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(', '));
await env.cleanup(); process.exit(0);
