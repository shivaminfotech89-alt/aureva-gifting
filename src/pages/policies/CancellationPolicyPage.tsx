import React from 'react';

export default function CancellationPolicyPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12 md:py-20 lg:py-24">
      <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-8">Cancellation Policy</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-serif">
        <p className="lead text-lg mb-8">
          We understand that business requirements change. However, as AUREVA Corporate Gifting specializes in customized logistics and printing, order cancellations are strictly monitored.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Customized Products (Logo/Branding Applied)</h2>
        <p>Because customization involves sourcing, preparing printing screens, and allocating inventory:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Pre-Mockup Approval:</strong> You may cancel the order and receive a full refund as long as the digital mockup has NOT been approved.</li>
          <li><strong>Post-Mockup Approval:</strong> Once the mockup is approved and production begins, the order <strong>cannot be cancelled</strong>. If you must forcibly terminate, NO refund will be issued, and you may be billed for printing costs already incurred.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. Non-Customized / Blank Orders</h2>
        <p>For items without any custom printing:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>If the order has NOT been dispatched from our warehouse, you may cancel it for a full refund.</li>
          <li>If the order HAS been dispatched, you must follow the standard Returns process. A restocking fee and return logistics cost will be borne by the customer.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. How to Cancel</h2>
        <p>To request a cancellation, please email your order number and company name to <strong>aurevagifts@gmail.com</strong> or contact your dedicated account manager. Cancellations are only valid once confirmed via email by our team.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Our Right to Cancel</h2>
        <p>AUREVA Corporate Gifting reserves the right to cancel any order under the following circumstances:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Unavailability of stock required to fulfill bulk quantities.</li>
          <li>Inability to process payment or fraud suspicion.</li>
          <li>Failure to provide necessary high-resolution logos/artwork within a reasonable time frame.</li>
        </ul>
        <p>In the event of an AUREVA-initiated cancellation, a full refund will be processed immediately.</p>
      </div>
    </div>
  );
}
