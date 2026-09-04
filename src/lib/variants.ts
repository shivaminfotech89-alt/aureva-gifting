/**
 * Colour options for a product.
 *
 * The dealer sells one briefcase in black, brown and navy as three catalog
 * lines with three codes. Listing those as three products buries the range and
 * makes the shop look repetitive, so they become one product with three
 * options, each keeping its own dealer code, stock and photograph.
 */
export interface ProductVariant {
  /** Shown to the customer, e.g. "Navy Blue". */
  color: string;
  /** The dealer code for this colour. Sales reorder by it. */
  sku?: string;
  stock?: number;
  image?: string;
}

/** Swatch colours. Anything unknown falls back to a neutral chip. */
const SWATCH: Record<string, string> = {
  black: '#1c1c1e',
  brown: '#6b4423',
  'dark brown': '#4a2c17',
  tan: '#b5651d',
  navy: '#1f2d50',
  'navy blue': '#1f2d50',
  blue: '#2456a6',
  grey: '#8a8d91',
  gray: '#8a8d91',
  silver: '#c0c3c7',
  white: '#f2f2f0',
  red: '#a62226',
  green: '#2f5d3a',
  gold: '#c8a24a',
  maroon: '#5c1f26',
  beige: '#d8c8a8',
};

export function swatchColor(name: string): string {
  return SWATCH[name.trim().toLowerCase()] ?? '#b8bcc2';
}

/** Usable options only: a variant with no colour name is not selectable. */
export function variantsOf(product: { variants?: ProductVariant[] | null }): ProductVariant[] {
  if (!Array.isArray(product?.variants)) return [];
  return product.variants.filter(
    (v): v is ProductVariant => !!v && typeof v.color === 'string' && v.color.trim() !== '',
  );
}

/**
 * Every photo to show for a product: one per colour, then any images on the
 * product itself that a colour did not already contribute.
 */
export function galleryImages(product: {
  images?: string[] | null;
  variants?: ProductVariant[] | null;
}): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (u?: string | null) => {
    if (typeof u !== 'string') return;
    const v = u.trim();
    if (v === '' || seen.has(v)) return;
    seen.add(v);
    out.push(v);
  };
  variantsOf(product).forEach(v => push(v.image));
  (Array.isArray(product?.images) ? product.images : []).forEach(push);
  return out;
}

/** Total stock across colours, or the product's own when it has none. */
export function totalStock(product: { stock?: number; variants?: ProductVariant[] | null }): number {
  const variants = variantsOf(product);
  if (variants.length === 0) return Number(product?.stock ?? 0);
  return variants.reduce((sum, v) => sum + (Number.isFinite(Number(v.stock)) ? Number(v.stock) : 0), 0);
}
