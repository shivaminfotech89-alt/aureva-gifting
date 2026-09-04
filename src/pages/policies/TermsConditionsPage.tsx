import React from 'react';

export default function TermsConditionsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 pb-16 pt-28 md:pt-32">
      <h1 className="text-[1.75rem] md:text-[2rem] font-display font-bold tracking-tight mb-8">Terms & Conditions</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-display">
        <p className="lead text-lg mb-8">
          Welcome to AUREVA Corporate Gifting. These terms and conditions outline the rules and regulations for the use of our enterprise B2B website and our bulk-order sourcing model.
        </p>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-10 flex items-start gap-3">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
           <p className="text-sm text-amber-800 font-medium">
             <strong className="font-bold">IMPORTANT:</strong> AUREVA specializes in bulk corporate gifting orders. Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.
           </p>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Business Model & Order Requests</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Bulk Corporate Gifting:</strong> AUREVA operates as a bulk corporate gifting and sourcing supplier. We fulfill orders based on Minimum Order Quantity (MOQ) requirements.</li>
          <li><strong>Inquiry-Based Ordering:</strong> Placing an order on our website acts as an "Order Request" or "Inquiry." It does NOT guarantee order acceptance, product availability, or final pricing.</li>
          <li><strong>Supplier Dependency:</strong> All products are subject to supplier availability and stock confirmation. We reserve the right to reject, modify, or cancel orders if the items are unavailable.</li>
          <li><strong>Alternative Suggestions:</strong> If a requested product is unavailable, our team holds the right to suggest alternative products of similar quality and value.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. Payment & Invoicing</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Admin Confirmation Required:</strong> Payment is requested ONLY after our team verifies stock availability, customization feasibility, and delivery timelines.</li>
          <li><strong>Manual Verification:</strong> Payments made via UPI or bank transfer are manually verified. Processing will only begin after successful verification.</li>
          <li><strong>Invoice Generation:</strong> Tax Invoices are generated and provided ONLY after successful payment verification. An order request is not an invoice.</li>
          <li><strong>Pricing Variations:</strong> Listed prices are indicative. Final pricing may vary based on quantity, customization complexity, and supplier rate changes.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. Customization & Branding</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Customer Responsibility:</strong> You are fully responsible for providing accurate, high-resolution logos and correct customization details.</li>
          <li><strong>Limitations:</strong> Custom branding is subject to material constraints and supplier feasibility. Certain complex logos may require modifications to be printable.</li>
          <li><strong>Proofing:</strong> A digital mockup will usually be shared. Production begins only after formal approval. AUREVA is not liable for errors in the approved mockup.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Product Images & Delivery</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Reference Only:</strong> Product images on the website and catalog are for reference purposes. Actual products may vary slightly in color, texture, or finish.</li>
          <li><strong>Approximate Timelines:</strong> All delivery timelines provided are estimates. Due to our supplier-dependent model, unexpected shipping or manufacturing delays may occur.</li>
          <li><strong>Inspection &amp; Evidence:</strong> You must inspect each consignment on arrival and record a continuous, unedited unboxing video beginning before the parcel seal is broken. Damage, defect, shortage and wrong-item claims must be raised within 48 hours of delivery and are assessed against that recording, as set out in our <a href="/refund" className="underline">Return, Exchange &amp; Refund Policy</a>.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Governing Law</h2>
        <p>These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Ahmedabad, Gujarat.</p>
      </div>
    </div>
  );
}
