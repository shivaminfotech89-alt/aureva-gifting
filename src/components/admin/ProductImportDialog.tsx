import React, { useState } from 'react';
import { collection, doc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Bulk product import.
 *
 * Writes through the signed-in admin's own session, so it works under the
 * existing Firestore rules with no service account and nothing to install.
 *
 * The shape below matches what firestore.rules validates for a product
 * (name, basePrice, gstPercent, stock, enabled), plus the optional fields the
 * catalog carries. Rows that fail validation are reported rather than written,
 * so a single bad row cannot abort an otherwise good import.
 */

export interface ImportRow {
  name?: unknown;
  description?: unknown;
  sku?: unknown;
  categoryId?: unknown;
  basePrice?: unknown;
  mrp?: unknown;
  gstPercent?: unknown;
  stock?: unknown;
  enabled?: unknown;
  minOrderQuantity?: unknown;
  availabilityStatus?: unknown;
  images?: unknown;
  variants?: unknown;
}

type Prepared = { id: string; data: Record<string, unknown> };

const SLUG_MAX = 100;

/** Stable, readable document id, so re-importing updates rather than duplicates. */
function makeId(row: ImportRow): string {
  const basis = String(row.sku || row.name || '').toLowerCase();
  const slug = basis.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, SLUG_MAX);
  return slug || `product-${Math.random().toString(36).slice(2, 10)}`;
}

export function validateRows(rows: unknown, publish = false): { ok: Prepared[]; errors: string[] } {
  const ok: Prepared[] = [];
  const errors: string[] = [];

  if (!Array.isArray(rows)) {
    return { ok, errors: ['The file must contain a JSON array of products, for example [ { "name": "..." } ].'] };
  }

  const seen = new Set<string>();
  rows.forEach((raw, i) => {
    const row = (raw ?? {}) as ImportRow;
    const label = `Row ${i + 1}`;

    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) { errors.push(`${label}: "name" is required.`); return; }

    const num = (v: unknown, fallback: number) => {
      if (v === undefined || v === null || v === '') return fallback;
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    };

    const basePrice = num(row.basePrice, 0);
    const gstPercent = num(row.gstPercent, 18);
    const stock = num(row.stock, 0);
    const mrp = num(row.mrp, 0);

    if (Number.isNaN(basePrice) || basePrice < 0) { errors.push(`${label} (${name}): "basePrice" must be a number of 0 or more.`); return; }
    if (Number.isNaN(gstPercent) || gstPercent < 0) { errors.push(`${label} (${name}): "gstPercent" must be a number of 0 or more.`); return; }
    if (Number.isNaN(stock)) { errors.push(`${label} (${name}): "stock" must be a number.`); return; }
    if (Number.isNaN(mrp) || mrp < 0) { errors.push(`${label} (${name}): "mrp" must be a number of 0 or more.`); return; }

    const id = makeId(row);
    if (seen.has(id)) { errors.push(`${label} (${name}): duplicate of an earlier row — give it a distinct "sku".`); return; }
    seen.add(id);

    const images = Array.isArray(row.images) ? row.images.filter(u => typeof u === 'string' && u.trim() !== '') : [];

    // Colour options. A variant with no colour name cannot be chosen, so it is
    // dropped rather than written as an unlabelled button.
    const variants = Array.isArray(row.variants)
      ? row.variants
          .filter((v: any) => v && typeof v.color === 'string' && v.color.trim() !== '')
          .map((v: any) => ({
            color: String(v.color).trim(),
            sku: typeof v.sku === 'string' ? v.sku : '',
            stock: Number.isFinite(Number(v.stock)) ? Number(v.stock) : 0,
            image: typeof v.image === 'string' ? v.image : '',
          }))
      : [];
    if (Array.isArray(row.variants) && variants.length !== row.variants.length) {
      errors.push(`${label} (${name}): ${row.variants.length - variants.length} color option(s) had no color name and were skipped.`);
    }

    ok.push({
      id,
      data: {
        name,
        description: typeof row.description === 'string' ? row.description : '',
        sku: typeof row.sku === 'string' ? row.sku : '',
        categoryId: typeof row.categoryId === 'string' ? row.categoryId : '',
        basePrice,
        mrp,
        gstPercent,
        stock,
        // The shop only lists enabled products, and categories are derived from
        // what the shop can see, so importing hidden means nothing appears at
        // all. The caller decides — except for rows with no price, which stay
        // hidden either way. A supplier sheet with a gap in the price column
        // must not put a product on sale at zero rupees.
        enabled: basePrice > 0 && (row.enabled === true || publish),
        minOrderQuantity: Number.isFinite(Number(row.minOrderQuantity)) ? Number(row.minOrderQuantity) : 1,
        availabilityStatus: typeof row.availabilityStatus === 'string' ? row.availabilityStatus : 'available_on_request',
        images,
        variants,
      },
    });
  });

  return { ok, errors };
}

export function ProductImportDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Prepared[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [publish, setPublish] = useState(false);
  const [parsedRaw, setParsedRaw] = useState<unknown>(null);

  const unpriced = rows.filter(r => Number(r.data.basePrice) === 0).length;

  const reset = () => { setRows([]); setErrors([]); setFileName(''); setProgress(0); setPublish(false); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const parsed = JSON.parse(await file.text());
      const result = validateRows(parsed, publish);
      setParsedRaw(parsed);
      setRows(result.ok);
      setErrors(result.errors);
    } catch {
      setRows([]);
      setErrors(['That file is not valid JSON. Export it again, or open it in a text editor to check.']);
    }
  };

  const togglePublish = (next: boolean) => {
    setPublish(next);
    if (parsedRaw !== null) {
      const result = validateRows(parsedRaw, next);
      setRows(result.ok);
      setErrors(result.errors);
    }
  };

  const runImport = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    setProgress(0);
    try {
      // Firestore caps a batch at 500 writes.
      const CHUNK = 400;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const batch = writeBatch(db);
        for (const r of slice) {
          batch.set(doc(db, 'products', r.id), { ...r.data, createdAt: serverTimestamp() }, { merge: true });
        }
        await batch.commit();
        setProgress(Math.min(i + slice.length, rows.length));
      }
      toast.success(`Imported ${rows.length} product${rows.length === 1 ? '' : 's'}.`);
      onImported();
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(`Import failed: ${err?.message || 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  const existingWarning = async () => {
    const snap = await getDocs(collection(db, 'products'));
    return snap.size;
  };
  void existingWarning;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger render={<Button variant="outline" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-10 shadow-sm" />}>
        <Upload className="h-4 w-4" /> Import
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Import products from a file</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-500">
            Choose a <strong>.json</strong> file of products. Importing the same file again updates those
            products rather than creating duplicates.
          </p>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => togglePublish(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--gold-500)]"
            />
            <span className="text-sm">
              <strong className="text-slate-800">Show these products in the shop straight away</strong>
              <span className="mt-0.5 block text-slate-500">
                Leave unticked to import them hidden, then add prices and publish them yourself.
                Hidden products do not appear in the shop at all, so their categories will not appear either.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-[var(--gold-500)]">
            <Upload className="h-6 w-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">{fileName || 'Click to choose a .json file'}</span>
            <input type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
          </label>

          {rows.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span><strong>{rows.length}</strong> product{rows.length === 1 ? '' : 's'} ready to import.</span>
            </div>
          )}

          {publish && unpriced > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>
                <strong>{unpriced}</strong> product{unpriced === 1 ? ' has' : 's have'} no price in this file, so
                {unpriced === 1 ? ' it stays' : ' they stay'} hidden. Add a price in the product list, then use
                Show in shop.
              </span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" /> {errors.length} row{errors.length === 1 ? '' : 's'} skipped
              </div>
              <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-[13px]">
                {errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}
                {errors.length > 50 && <li>…and {errors.length - 50} more.</li>}
              </ul>
            </div>
          )}

          {busy && (
            <p className="text-sm text-slate-500">Importing {progress} of {rows.length}…</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button
            onClick={runImport}
            disabled={busy || rows.length === 0}
            className="bg-[var(--gold-500)] font-semibold text-[var(--navy-900)] hover:bg-[var(--gold-400)]"
          >
            {busy ? 'Importing…' : `Import ${rows.length || ''} product${rows.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
