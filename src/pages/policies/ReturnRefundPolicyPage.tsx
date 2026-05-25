import React from 'react';

export default function ReturnRefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12 md:py-20 lg:py-24">
      <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-8">Return & Refund Policy</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-serif">
        <p className="lead text-lg mb-8">
          AUREVA Corporate Gifting stands behind the quality of every product we deliver. However, due to the nature of corporate gifting and customized printing, our return and refund policy is strictly structured.
        </p>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-10 flex items-start gap-3">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
           <p className="text-sm text-amber-800 font-medium">
             <strong className="font-bold">IMPORTANT:</strong> AUREVA specializes in bulk corporate gifting orders. Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.
           </p>
        </div>

        <div className="bg-destructive/10 border-l-4 border-destructive p-4 my-8 rounded-r-lg">
          <p className="text-destructive font-semibold m-0">
            IMPORTANT: Customized and logo-printed products are strictly non-returnable and non-refundable unless they arrive damaged or defective.
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Customized & Printed Products</h2>
        <p>Because customized products (containing logos, custom text, or specific brand colors) cannot be resold, we do not accept returns or provide refunds for these items for reasons such as "change of mind" or "incorrect logo uploaded by user". By approving the digital mockup, you accept full responsibility for the final design.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. Damaged or Defective Goods</h2>
        <p>If you receive items that are damaged during transit or suffer from a manufacturing defect, you must report it within <strong>48 hours of delivery</strong>. Please provide:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Your order number, payment verification details, and company details.</li>
          <li>Clear photographic or video evidence of the damage/defect.</li>
          <li>Detailed description of the issue.</li>
        </ul>
        <p>Upon verification, we will either provide a free replacement or initiate a refund for the affected quantity.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. Non-Customized Inventory</h2>
        <p>If you purchased pure blank items (no logo or customization applied), you may return them within 7 days of delivery. The items must be unused, in their original packaging, and in resalable condition. A 10% restocking fee may apply, and the buyer bears the return shipping cost.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Refund Timelines & Payment Verification</h2>
        <p>Approved refunds will be processed only after internal payment verification is completed. They are typically processed within 5-7 business days back to the original method of payment or corporate bank account. NEFT/RTGS refunds for bulk corporate orders may take up to 10 business days to reflect.</p>
      </div>
    </div>
  );
}
