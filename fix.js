const fs = require('fs');
function replaceInFile(path, search, replace) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content, 'utf8');
}

replaceInFile('src/pages/admin/AdminOrders.tsx', /admin_approval/g, 'payment_verification_pending');
replaceInFile('src/pages/admin/AdminOrders.tsx', /Admin Approval/g, 'Payment Verification Pending');
replaceInFile('src/pages/customer/CustomerDashboard.tsx', /admin_approval/g, 'payment_verification_pending');
replaceInFile('src/pages/customer/CustomerDashboard.tsx', /Under Review/g, 'Payment Verification Pending');
replaceInFile('src/pages/CheckoutPage.tsx', /admin_approval/g, 'payment_verification_pending');
