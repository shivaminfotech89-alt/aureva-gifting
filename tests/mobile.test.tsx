/**
 * Mobile reachability of admin controls. Run with: npm run test:mobile
 *
 * The Edit and Delete buttons on every banner, category and campaign lived
 * inside `opacity-0 group-hover:opacity-100` overlays. A phone has no hover,
 * so on a phone they were invisible and could not be tapped at all — which is
 * a control that does not exist, not a styling nicety.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function sources(dir = 'src'): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sources(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}
const files = sources().map(f => ({ f, text: readFileSync(f, 'utf8') }));

/** Hidden at every width, revealed only by a pointer that a phone lacks. */
const hoverOnly = files.filter(({ text }) => /(^|\s)opacity-0\s+group-hover:opacity-100/.test(text));

/** Visible by default, hover-revealed only where a pointer exists. */
const guarded = files.filter(({ text }) =>
  text.includes('opacity-100 md:opacity-0 md:group-hover:opacity-100'));

const admin = files.filter(({ f }) => f.includes('/admin/'));

// A flex child will not shrink below its content unless told to, which is how
// four nowrap tab labels pushed the whole admin page to 815px on a 360px phone.
const contentPage = files.find(({ f }) => f.endsWith('AdminHomepageContent.tsx'))!;

const checks: [string, boolean][] = [
  ['no control is reachable by hover alone', hoverOnly.length === 0],
  ['the controls that were hover-only are now visible by default', guarded.length >= 4],
  ['image management guards its tab strip against overflow',
   contentPage.text.includes('min-w-0') && contentPage.text.includes('overflow-x-auto')],
  ['the tab strip can shrink so it scrolls instead of stretching the page',
   /w-max min-w-full/.test(contentPage.text)],
  ['tabs stack above their panel rather than sitting beside it',
   contentPage.text.includes('flex w-full min-w-0 flex-col')],
  ['the edit dialog fits a phone and scrolls',
   contentPage.text.includes('w-[calc(100vw-2rem)]') && contentPage.text.includes('max-h-[90vh]')],
  ['uploads are capped so a Firestore document cannot overflow',
   contentPage.text.includes('MAX_DATA_URL')],
  ['an oversized upload says so instead of failing silently',
   contentPage.text.includes('too large even after compressing')],
  // A width is only a trap when it applies at every size: "sm:max-w-[700px]"
  // caps a dialog on desktop and leaves it full width on a phone.
  ['no admin page pins an unbreakable width wider than a phone',
   admin.every(({ text }) =>
     [...text.matchAll(/(?<![\w:-])w-\[(\d{3,})px\]/g)]
       .every(m => Number(m[1]) <= 320 || /max-w-\[|:w-\[/.test(text.slice(Math.max(0, m.index - 12), m.index + 4))))],
];

let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
if (hoverOnly.length) console.log('hover-only in:', hoverOnly.map(x => x.f).join(', '));
console.log(`\n${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
