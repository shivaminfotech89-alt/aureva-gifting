import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { InlineNumber } from './InlineNumber';
import { ProductData } from '../shop/ProductCard';
import { ProductVariant, variantsOf, swatchColor, totalStock } from '../../lib/variants';

/**
 * Stock in the product list, edited where it sits.
 *
 * A single-colour product edits in place. A product with colours has no single
 * stock number to edit — the total is the sum of its colours — so it opens a
 * short list and each colour is edited on its own line.
 */
export function StockCell({
  product,
  onSaveStock,
  onSaveVariantStock,
}: {
  product: ProductData;
  onSaveStock: (next: number) => Promise<void>;
  onSaveVariantStock: (variants: ProductVariant[]) => Promise<void>;
}) {
  const variants = variantsOf(product);
  const stock = totalStock(product);

  const tone =
    stock > 10 ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
    : stock > 0 ? 'bg-amber-100/50 text-amber-700 border-amber-200'
    : 'bg-red-500/10 text-red-600 border-red-200';

  if (variants.length === 0) {
    return (
      <InlineNumber
        value={stock}
        onSave={onSaveStock}
        ariaLabel={`Stock for ${product.name}`}
        format={n => `${n} in stock`}
        className={`rounded-md border text-xs font-bold shadow-sm ${tone}`}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            title="Click to edit stock by color"
            aria-label={`Stock for ${product.name}, ${stock} across ${variants.length} colors. Click to edit.`}
            className={`rounded-md border px-3 py-1.5 text-xs font-bold shadow-sm transition-colors hover:brightness-95 ${tone}`}
          />
        }
      >
        {stock} in stock · {variants.length} colors
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Stock by color
        </p>
        <div className="space-y-1.5">
          {variants.map((v, i) => (
            <div key={v.color} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300"
                  style={{ backgroundColor: swatchColor(v.color) }}
                />
                <span className="truncate text-sm text-slate-700">{v.color}</span>
              </span>
              <InlineNumber
                value={Number(v.stock ?? 0)}
                ariaLabel={`Stock for ${product.name} in ${v.color}`}
                className="text-sm font-semibold text-[#0F172A]"
                onSave={async next => {
                  const updated = variants.map((x, n) => (n === i ? { ...x, stock: next } : x));
                  await onSaveVariantStock(updated);
                }}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
          Total <strong className="text-[#0F172A]">{stock}</strong> across {variants.length} colors
        </p>
      </PopoverContent>
    </Popover>
  );
}
