/**
 * Security rules tests. Run with:
 *   npm run test:rules
 *
 * Every case below mirrors something the app actually does, or something the
 * old rules wrongly allowed. Assertions run against the Firestore emulator, so
 * a failure here is a real rules failure, not a guess.
 */
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection,
  serverTimestamp, increment, getDocs, query, where,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const SUPER_ADMIN = 'shivaminfotech89@gmail.com';
const STAFF_ADMIN = 'staff@aureva.test';
const CUSTOMER = 'customer@example.com';
const OTHER = 'other@example.com';

const testEnv = await initializeTestEnvironment({
  projectId: 'aureva-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

const asSuperAdmin = () => testEnv.authenticatedContext('uid-super', { email: SUPER_ADMIN }).firestore();
const asStaffAdmin = () => testEnv.authenticatedContext('uid-staff', { email: STAFF_ADMIN }).firestore();
const asCustomer = () => testEnv.authenticatedContext('uid-cust', { email: CUSTOMER }).firestore();
const asOther = () => testEnv.authenticatedContext('uid-other', { email: OTHER }).firestore();
const asAnon = () => testEnv.unauthenticatedContext().firestore();

let passed = 0, failed = 0;
const results = [];
async function it(name, fn) {
  try { await fn(); passed++; results.push(`  ok   ${name}`); }
  catch (e) { failed++; results.push(`  FAIL ${name}\n         ${String(e.message).split('\n')[0].slice(0, 160)}`); }
}

/** An order exactly as CheckoutPage writes it. */
const newOrder = (userId = 'uid-cust', over = {}) => ({
  userId,
  items: [{ productId: 'p1', name: 'Mug', basePrice: 500, gstPercent: 18, quantity: 25 }],
  subTotal: 12500, gstTotal: 2250, discount: 0, grandTotal: 14750,
  couponCode: null, paymentMethod: 'pending_request',
  deliveryDetails: { firstName: 'A', lastName: 'B', city: 'Ahmedabad' },
  status: 'inquiry_received',
  createdAt: serverTimestamp(),
  ...over,
});

async function seed(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

await testEnv.clearFirestore();
await seed(async (db) => {
  // An active staff admin and a revoked one.
  await setDoc(doc(db, 'admin_settings', STAFF_ADMIN), { role: 'Product Manager', status: 'Active' });
  await setDoc(doc(db, 'admin_settings', 'revoked@aureva.test'), { role: 'Product Manager', status: 'Disabled' });
  await setDoc(doc(db, 'users', 'uid-cust'), { email: CUSTOMER, role: 'customer', createdAt: Date.now() });
  await setDoc(doc(db, 'coupons', 'c1'), {
    code: 'SAVE10', discountType: 'percentage', discountValue: 10,
    isActive: true, usageCount: 3, totalRevenue: 1000,
  });
  await setDoc(doc(db, 'orders', 'o-cust'), { ...newOrder(), createdAt: new Date() });
  await setDoc(doc(db, 'orders', 'o-other'), { ...newOrder('uid-other'), createdAt: new Date() });
  // Its own document: the UPI test above moves o-cust past the cancellable window.
  await setDoc(doc(db, 'orders', 'o-cancel'), { ...newOrder(), createdAt: new Date() });
});

console.log('\n--- orders: the payment flow that was broken ---');
await it('customer submits UPI reference for verification (was denied by the old rules)', () =>
  assertSucceeds(updateDoc(doc(asCustomer(), 'orders', 'o-cust'), {
    status: 'payment_verification_pending', paymentMethod: 'upi',
    utrNumber: '123456789012', paymentSubmittedAt: serverTimestamp(),
  })));

await it('customer CANNOT mark their own order paid (the old rules allowed this)', () =>
  assertFails(updateDoc(doc(asCustomer(), 'orders', 'o-cust'), {
    status: 'paid', paymentId: 'x', updatedAt: serverTimestamp(),
  })));

await it('customer cancels their own unpaid order', () =>
  assertSucceeds(updateDoc(doc(asCustomer(), 'orders', 'o-cancel'), {
    status: 'cancelled', updatedAt: serverTimestamp(),
  })));

await it('customer cannot cancel once payment is awaiting verification', () =>
  assertFails(updateDoc(doc(asCustomer(), 'orders', 'o-cust'), {
    status: 'cancelled', updatedAt: serverTimestamp(),
  })));

await it('customer cannot touch someone else\'s order', () =>
  assertFails(updateDoc(doc(asCustomer(), 'orders', 'o-other'), {
    status: 'cancelled', updatedAt: serverTimestamp(),
  })));

await it('customer cannot rewrite the total on an existing order', () =>
  assertFails(updateDoc(doc(asCustomer(), 'orders', 'o-cust'), { grandTotal: 1 })));

console.log('\n--- orders: creation ---');
await it('customer creates an order for themselves', () =>
  assertSucceeds(setDoc(doc(asCustomer(), 'orders', 'o-new'), newOrder())));

await it('order cannot be created already paid', () =>
  assertFails(setDoc(doc(asCustomer(), 'orders', 'o-paid'), newOrder('uid-cust', { status: 'paid' }))));

await it('order cannot be created for another user', () =>
  assertFails(setDoc(doc(asCustomer(), 'orders', 'o-forged'), newOrder('uid-other'))));

await it('order with a total exceeding its parts is rejected', () =>
  assertFails(setDoc(doc(asCustomer(), 'orders', 'o-inflated'), newOrder('uid-cust', { grandTotal: 99999 }))));

await it('order with a negative total is rejected', () =>
  assertFails(setDoc(doc(asCustomer(), 'orders', 'o-neg'), newOrder('uid-cust', { grandTotal: -5 }))));

await it('anonymous visitor cannot create an order', () =>
  assertFails(setDoc(doc(asAnon(), 'orders', 'o-anon'), newOrder('uid-cust'))));

console.log('\n--- orders: reads ---');
await it('customer reads their own order', () =>
  assertSucceeds(getDoc(doc(asCustomer(), 'orders', 'o-cust'))));

await it('customer cannot read another customer\'s order', () =>
  assertFails(getDoc(doc(asCustomer(), 'orders', 'o-other'))));

await it('customer can list only their own orders', () =>
  assertSucceeds(getDocs(query(collection(asCustomer(), 'orders'), where('userId', '==', 'uid-cust')))));

await it('customer cannot list the whole orders collection', () =>
  assertFails(getDocs(collection(asCustomer(), 'orders'))));

await it('admin lists all orders', () =>
  assertSucceeds(getDocs(collection(asStaffAdmin(), 'orders'))));

await it('admin moves an order to paid', () =>
  assertSucceeds(updateDoc(doc(asStaffAdmin(), 'orders', 'o-other'), { status: 'paid' })));

console.log('\n--- admin access control ---');
await it('super admin writes admin_settings', () =>
  assertSucceeds(setDoc(doc(asSuperAdmin(), 'admin_settings', 'new@aureva.test'), {
    role: 'Product Manager', status: 'Active',
  })));

await it('staff admin CANNOT grant admin to anyone', () =>
  assertFails(setDoc(doc(asStaffAdmin(), 'admin_settings', 'sneaky@aureva.test'), {
    role: 'Super Admin', status: 'Active',
  })));

await it('customer cannot grant themselves admin', () =>
  assertFails(setDoc(doc(asCustomer(), 'admin_settings', CUSTOMER), { role: 'Super Admin', status: 'Active' })));

await it('a signed-in user may read their own admin_settings record', () =>
  assertSucceeds(getDoc(doc(asCustomer(), 'admin_settings', CUSTOMER))));

await it('a user cannot read someone else\'s admin_settings record', () =>
  assertFails(getDoc(doc(asCustomer(), 'admin_settings', STAFF_ADMIN))));

await it('a DISABLED admin has no write access (the old rules ignored status)', async () => {
  const revoked = testEnv.authenticatedContext('uid-revoked', { email: 'revoked@aureva.test' }).firestore();
  await assertFails(setDoc(doc(revoked, 'products', 'p-revoked'), {
    name: 'X', basePrice: 1, gstPercent: 18, stock: 1, enabled: true,
  }));
});

await it('customer cannot promote themselves in their user document', () =>
  assertFails(updateDoc(doc(asCustomer(), 'users', 'uid-cust'), { role: 'admin' })));

await it('customer updates their own profile fields', () =>
  assertSucceeds(updateDoc(doc(asCustomer(), 'users', 'uid-cust'), {
    name: 'New Name', phone: '9999999999', updatedAt: Date.now(),
  })));

await it('customer cannot read another user\'s profile', () =>
  assertFails(getDoc(doc(asOther(), 'users', 'uid-cust'))));

console.log('\n--- coupons ---');
await it('anonymous visitor can no longer enumerate coupon codes', () =>
  assertFails(getDocs(collection(asAnon(), 'coupons'))));

await it('signed-in shopper can look up a coupon at checkout', () =>
  assertSucceeds(getDocs(query(collection(asCustomer(), 'coupons'), where('code', '==', 'SAVE10')))));

await it('shopper may increment usage by exactly one', () =>
  assertSucceeds(updateDoc(doc(asCustomer(), 'coupons', 'c1'), {
    usageCount: increment(1), totalRevenue: increment(14750),
  })));

await it('shopper cannot set usage to an arbitrary value (the old rules allowed this)', () =>
  assertFails(updateDoc(doc(asCustomer(), 'coupons', 'c1'), { usageCount: 0, totalRevenue: 0 })));

await it('shopper cannot flip a coupon active or change its value', () =>
  assertFails(updateDoc(doc(asCustomer(), 'coupons', 'c1'), { discountValue: 99, isActive: true })));

console.log('\n--- write-open collections ---');
await it('anonymous visitor can still submit a catalog lead (the funnel needs this)', () =>
  assertSucceeds(addDoc(collection(asAnon(), 'catalogLeads'), {
    name: 'Lead', company: 'Acme', email: 'lead@acme.test', phone: '9876543210',
    category: 'MASTER CATEGORY CATALOG', method: 'email', status: 'new',
    userId: null, createdAt: serverTimestamp(),
  })));

await it('a catalog lead with a huge payload is rejected', () =>
  assertFails(addDoc(collection(asAnon(), 'catalogLeads'), {
    name: 'x'.repeat(5000), email: 'a@b.c', phone: '1', category: 'c', status: 'new',
    createdAt: serverTimestamp(),
  })));

await it('anonymous visitor cannot read catalog leads', () =>
  assertFails(getDocs(collection(asAnon(), 'catalogLeads'))));

await it('anonymous visitor can no longer spam admin notifications', () =>
  assertFails(addDoc(collection(asAnon(), 'admin_notifications'), {
    type: 'NEW_ORDER', title: 'spam', createdAt: serverTimestamp(),
  })));

await it('a signed-in customer placing an order can create the admin notification', () =>
  assertSucceeds(addDoc(collection(asCustomer(), 'admin_notifications'), {
    type: 'NEW_ORDER', title: 'New Order Request Received', message: 'm',
    read: false, createdAt: serverTimestamp(),
  })));

await it('anonymous visitor cannot write email logs', () =>
  assertFails(addDoc(collection(asAnon(), 'email_logs'), { to: 'x@y.z', subject: 's' })));

await it('customer cannot read email logs', () =>
  assertFails(getDocs(collection(asCustomer(), 'email_logs'))));

console.log('\n--- catalog and public content ---');
await it('anonymous visitor reads products', () =>
  assertSucceeds(getDocs(collection(asAnon(), 'products'))));

await it('anonymous visitor reads settings (footer, WhatsApp number)', () =>
  assertSucceeds(getDoc(doc(asAnon(), 'settings', 'admin'))));

await it('customer cannot write products', () =>
  assertFails(setDoc(doc(asCustomer(), 'products', 'p-evil'), {
    name: 'X', basePrice: 1, gstPercent: 18, stock: 1, enabled: true,
  })));

await it('admin writes a product', () =>
  assertSucceeds(setDoc(doc(asStaffAdmin(), 'products', 'p-ok'), {
    name: 'Mug', basePrice: 500, gstPercent: 18, stock: 10, enabled: true,
  })));

await it('a product with a negative price is rejected', () =>
  assertFails(setDoc(doc(asStaffAdmin(), 'products', 'p-bad'), {
    name: 'Mug', basePrice: -5, gstPercent: 18, stock: 10, enabled: true,
  })));

// Dealer names and buying costs. Products are world-readable, so these must
// not be reachable from a product document at all.
await it('a product carrying supplierInfo is rejected', () =>
  assertFails(setDoc(doc(asStaffAdmin(), 'products', 'p-leak'), {
    name: 'Wallet', basePrice: 1999, gstPercent: 18, stock: 10, enabled: true,
    supplierInfo: { supplierName: 'Nexon Gifts', notes: 'cost 450' },
  })));

await it('an update that leaves supplierInfo in place is rejected', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'products', 'p-legacy'), {
      name: 'Wallet', basePrice: 1999, gstPercent: 18, stock: 10, enabled: true,
      supplierInfo: { supplierName: 'Nexon Gifts' },
    });
  });
  // A merging update that does not clear the field keeps it on the document.
  await assertFails(updateDoc(doc(asStaffAdmin(), 'products', 'p-legacy'), { enabled: false }));
});

await it('admin writes supplier details to product_private', () =>
  assertSucceeds(setDoc(doc(asStaffAdmin(), 'product_private', 'p-ok'), {
    supplierName: 'Nexon Gifts', contact: '+91 99999 99999', notes: 'B2B cost 1400',
  })));

await it('admin reads supplier details back', () =>
  assertSucceeds(getDoc(doc(asStaffAdmin(), 'product_private', 'p-ok'))));

await it('customer cannot read supplier details', () =>
  assertFails(getDoc(doc(asCustomer(), 'product_private', 'p-ok'))));

await it('anonymous visitor cannot read supplier details', () =>
  assertFails(getDoc(doc(asAnon(), 'product_private', 'p-ok'))));

await it('anonymous visitor cannot list supplier details', () =>
  assertFails(getDocs(collection(asAnon(), 'product_private'))));

await it('customer cannot write supplier details', () =>
  assertFails(setDoc(doc(asCustomer(), 'product_private', 'p-ok'), { supplierName: 'x' })));

await it('customer cannot read the media library', () =>
  assertFails(getDocs(collection(asCustomer(), 'mediaLibrary'))));

console.log(results.join('\n'));
console.log(`\n${passed} passed, ${failed} failed\n`);
await testEnv.cleanup();
process.exit(failed === 0 ? 0 : 1);
