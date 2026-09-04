/**
 * The UPI payment link a customer's app opens from the QR code.
 *
 * The payee VPA used to be a constant written into the page twice, on both
 * sides of a ternary, so the UPI ID set in Admin → Settings was ignored and
 * every payment was addressed to the same account regardless. It comes from
 * settings now, and the constant remains only as the fallback for a site that
 * has not set one yet.
 */
export const FALLBACK_UPI_ID = '7990878248@ybl';

export function upiPayLink(opts: {
  upiId?: string | null;
  payeeName?: string | null;
  amount?: number | null;
  orderId?: string | null;
}): string {
  const params = new URLSearchParams({
    pa: (opts.upiId || '').trim() || FALLBACK_UPI_ID,
    pn: (opts.payeeName || '').trim() || 'Aureva',
    cu: 'INR',
  });
  // A zero or missing amount would have the customer type it in themselves.
  if (typeof opts.amount === 'number' && opts.amount > 0) params.set('am', opts.amount.toFixed(2));
  if (opts.orderId) params.set('tn', `AurevaOrder_${opts.orderId}`);
  return `upi://pay?${params.toString()}`;
}

/** QR image for that link, for sites with no uploaded QR of their own. */
export function upiQrImageUrl(link: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}`;
}
