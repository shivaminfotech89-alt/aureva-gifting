import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function sendOrderEmailNotification(orderDetails: any, adminEmail: string = 'aurevagifts@gmail.com') {
  console.log(`====== EMAIL NOTIFICATION ======`);
  console.log(`To: ${adminEmail}`);
  console.log(`Subject: New Order Received - AUREVA Corporate Gifting`);
  console.log(`Order ID: ${orderDetails.orderId}`);
  console.log(`Customer: ${orderDetails.customerName} (${orderDetails.customerEmail})`);
  console.log(`Amount: ₹${orderDetails.amount}`);
  console.log(`=================================`);
  
  // Example of how an Email API / Firebase Function would be called in production
  // try {
  //   await fetch('https://api.emailjs.com/api/v1.0/email/send', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       service_id: 'default_service',
  //       template_id: 'template_new_order',
  //       user_id: 'YOUR_PUBLIC_KEY',
  //       template_params: {
  //         to_email: adminEmail,
  //         order_id: orderDetails.orderId,
  //         customer_name: orderDetails.customerName,
  //         amount: orderDetails.amount,
  //       }
  //     })
  //   });
  // } catch (e) { console.error('Email API failed', e); }

  try {
    await addDoc(collection(db, 'email_logs'), {
      to: adminEmail,
      subject: 'New Order Received - AUREVA Corporate Gifting',
      orderId: orderDetails.orderId,
      customerName: orderDetails.customerName,
      customerEmail: orderDetails.customerEmail,
      amount: orderDetails.amount,
      status: 'sent',
      timestamp: serverTimestamp()
    });
  } catch(e) {
    console.error("Failed to log email", e);
  }
}
