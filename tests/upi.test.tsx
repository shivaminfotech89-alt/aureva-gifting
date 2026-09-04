/**
 * The UPI link behind the payment QR. Run with: npm run test:upi
 *
 * This decides which account a customer's money goes to, so the payee must
 * come from settings and the amount must be exact.
 */
import { upiPayLink, upiQrImageUrl, FALLBACK_UPI_ID } from '../src/lib/upi';

const params = (link: string) => new URLSearchParams(link.replace('upi://pay?', ''));

const configured = params(upiPayLink({
  upiId: 'aureva@oksbi', payeeName: 'Aureva Corporate Gifting', amount: 6499.5, orderId: 'ord123',
}));
const unset = params(upiPayLink({ amount: 100, orderId: 'x' }));
const blank = params(upiPayLink({ upiId: '   ', amount: 100, orderId: 'x' }));
const noAmount = params(upiPayLink({ upiId: 'aureva@oksbi' }));
const zero = params(upiPayLink({ upiId: 'aureva@oksbi', amount: 0, orderId: 'x' }));

const checks: [string, boolean][] = [
  ['the configured UPI ID is the payee', configured.get('pa') === 'aureva@oksbi'],
  ['the configured payee name is used', configured.get('pn') === 'Aureva Corporate Gifting'],
  ['the amount is exact to paise', configured.get('am') === '6499.50'],
  ['the order is named in the note', configured.get('tn') === 'AurevaOrder_ord123'],
  ['currency is rupees', configured.get('cu') === 'INR'],
  ['an unset UPI ID falls back', unset.get('pa') === FALLBACK_UPI_ID],
  ['a blank UPI ID falls back rather than paying nobody', blank.get('pa') === FALLBACK_UPI_ID],
  ['an unset payee name falls back', unset.get('pn') === 'Aureva'],
  ['no amount means no am, so the app asks', !noAmount.has('am')],
  ['a zero amount is not sent as an amount', !zero.has('am')],
  ['a payee with an @ survives encoding', params(upiPayLink({ upiId: 'a.b-c@okhdfcbank' })).get('pa') === 'a.b-c@okhdfcbank'],
  ['a payee name with spaces survives encoding',
   params(upiPayLink({ upiId: 'x@y', payeeName: 'Aureva Corporate Gifting' })).get('pn') === 'Aureva Corporate Gifting'],
  ['the QR encodes the link', upiQrImageUrl('upi://pay?pa=x@y').includes(encodeURIComponent('upi://pay?pa=x@y'))],
];

let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(`\n${checks.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
