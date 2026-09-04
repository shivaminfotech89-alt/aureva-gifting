/**
 * Placeholder for products that have no photograph yet.
 *
 * Previously every image-less product fell back to the same stock photo of a
 * mug, so an entire imported catalog looked like it was all the same item and
 * a missing image was indistinguishable from a real one. This is neutral and
 * obviously a placeholder, and it is an inline data URI, so it costs no
 * request and cannot fail to load.
 */
const PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#f4f4f1"/>
  <g fill="none" stroke="#c9c4b4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M200 132L160 200L200 268L240 200L200 132Z"/>
    <path d="M200 164L180 200L200 236L220 200L200 164Z"/>
  </g>
  <text x="200" y="312" fill="#a8a293" font-family="system-ui,sans-serif"
        font-size="17" letter-spacing="2.5" text-anchor="middle">IMAGE COMING SOON</text>
</svg>`,
)}`;

/** First usable image for a product, or the placeholder. */
export function productImage(images?: string[] | null): string {
  const first = Array.isArray(images) ? images.find(u => typeof u === 'string' && u.trim() !== '') : undefined;
  return first || PLACEHOLDER;
}

export { PLACEHOLDER as PRODUCT_IMAGE_PLACEHOLDER };
