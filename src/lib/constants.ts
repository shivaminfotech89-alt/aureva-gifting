/**
 * Values that must stay in step with firestore.rules.
 *
 * These lists previously existed in three or four places at once and drifted
 * apart, which silently broke both admin access and customer payments. Keep
 * this file and firestore.rules in sync — nothing enforces it automatically.
 */

/**
 * Accounts that always hold admin rights, independent of the admin_settings
 * collection. Mirrors isSuperAdmin() in firestore.rules.
 */
export const SUPER_ADMIN_EMAILS = [
  'shivaminfotech89@gmail.com',
  'aurevagiftingsolution@gmail.com',
] as const;

export function isSuperAdminEmail(email?: string | null): boolean {
  return !!email && (SUPER_ADMIN_EMAILS as readonly string[]).includes(email);
}

/**
 * The order lifecycle, in the order the admin UI presents it. Mirrors
 * orderStatuses() in firestore.rules.
 */
export const ORDER_STATUS_IDS = [
  'inquiry_received',
  'pending_supplier_confirmation',
  'supplier_confirmed',
  'pending',
  'awaiting_payment',
  'payment_verification_pending',
  'paid',
  'processing',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_IDS)[number];

/** The status every order starts in. Enforced on create by firestore.rules. */
export const INITIAL_ORDER_STATUS: OrderStatus = 'inquiry_received';

/**
 * Statuses a customer may move their own order out of. Past this point only an
 * admin can change the status.
 */
export const CUSTOMER_MUTABLE_STATUSES: OrderStatus[] = [
  'inquiry_received',
  'pending',
  'awaiting_payment',
];
