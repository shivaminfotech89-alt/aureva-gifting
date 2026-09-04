import React from 'react';

export default function CancellationPolicyPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12 md:py-12 lg:py-12">
      <h1 className="text-[1.75rem] md:text-[2rem] font-display font-bold tracking-tight mb-8">Cancellation Policy</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-display">
        <p className="lead text-lg mb-8">
          We understand that business requirements change. However, as AUREVA Corporate Gifting specializes in bulk-order operations and direct manufacturer sourcing, order cancellations are strictly monitored.
        </p>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-10 flex items-start gap-3">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
           <p className="text-sm text-amber-800 font-medium">
             <strong className="font-bold">IMPORTANT:</strong> AUREVA specializes in bulk corporate gifting orders. Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.
           </p>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Cancellation of Order Requests</h2>
        <p>Before payment verification, your submission is considered an "order request." You may cancel or modify this request at any time prior to making the payment.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. Customized Products (Logo/Branding Applied)</h2>
        <p>Because customization involves sourcing, preparing printing screens, and allocating inventory:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Pre-Mockup Approval:</strong> If payment is made but the digital mockup has NOT been approved, you may request a cancellation for a full refund (subject to payment verification).</li>
          <li><strong>Post-Mockup Approval:</strong> Once the mockup is approved and production begins with the manufacturer, the order <strong>cannot be cancelled</strong>. If you must forcibly terminate, NO refund will be issued, and you remain liable for any costs incurred.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. Non-Customized / Blank Orders</h2>
        <p>For items without any bulk custom printing:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>If the order has NOT been dispatched from our supplier warehouse, you may cancel it. Any verified payments will be fully refunded.</li>
          <li>If the order HAS been dispatched, you must follow the standard Returns process. A restocking fee and return logistics cost will be borne by the customer.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. How to Cancel</h2>
        <p>To request a cancellation for a paid real order, please email your order number and company name to <strong className="font-medium text-foreground">aurevagifts@gmail.com</strong> or contact your dedicated account manager. Cancellations are only valid once confirmed via email by our team.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Our Right to Cancel (Supplier Limitations)</h2>
        <p>AUREVA Corporate Gifting reserves the right to cancel any order request or confirmed order under the following circumstances:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Unavailability of stock from our suppliers to fulfill the bulk MOQ.</li>
          <li>Inability to process or verify the UPI/Bank payment.</li>
          <li>Failure to provide necessary high-resolution logos/artwork within a reasonable time frame.</li>
        </ul>
        <p>In the event of an AUREVA-initiated cancellation on a paid order, a full refund will be processed immediately post-verification.</p>
      </div>
    </div>
  );
}
