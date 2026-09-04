import { formatCurrency } from './utils';

/** Used only when the admin has not set a number in Settings. */
export const DEFAULT_WHATSAPP = '919825622421';

/** wa.me accepts digits only — strip spaces, plus signs and punctuation. */
export function toWhatsAppNumber(adminWhatsApp?: string | null): string {
  return String(adminWhatsApp || DEFAULT_WHATSAPP).replace(/[^0-9]/g, '');
}

/**
 * Opens a WhatsApp chat with the message prefilled.
 *
 * Must be called directly from a click handler: browsers block window.open
 * from timers and async continuations, which is why the checkout handoff
 * used to silently fail.
 */
export function openWhatsApp(adminWhatsApp: string | null | undefined, message: string) {
  const url = `https://wa.me/${toWhatsAppNumber(adminWhatsApp)}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** The enquiry a customer sends from a product card or product page. */
export function productEnquiryMessage(product: {
  name: string;
  price?: number;
  minOrderQuantity?: number;
  /** Product page path, e.g. "/product/abc123". Lets the sales team open the
      exact item instead of guessing from the name. */
  path?: string;
}): string {
  const lines = [
    'Hi Aureva,',
    '',
    'I would like to enquire about this product:',
    '',
    `*${product.name}*`,
  ];
  if (typeof product.price === 'number') lines.push(`Price: ${formatCurrency(product.price)}`);
  if (product.minOrderQuantity && product.minOrderQuantity > 1) {
    lines.push(`Minimum order: ${product.minOrderQuantity} units`);
  }
  lines.push('', `Link: ${window.location.origin}${product.path ?? window.location.pathname}`);
  return lines.join('\n');
}
