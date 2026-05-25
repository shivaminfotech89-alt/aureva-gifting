import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12 md:py-20 lg:py-24">
      <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-8">Privacy Policy</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-serif">
        <p className="lead text-lg mb-8">
          At AUREVA Corporate Gifting, we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information when you engage with our bulk-order and supplier sourcing services.
        </p>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-10 flex items-start gap-3">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
           <p className="text-sm text-amber-800 font-medium">
             <strong className="font-bold">IMPORTANT:</strong> AUREVA specializes in bulk corporate gifting orders. Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.
           </p>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Information We Collect</h2>
        <p>We collect personal information that you voluntarily provide to us when submitting an inquiry, placing an order request, or communicating with our team. This includes:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Personal Details:</strong> Names, phone numbers, email addresses, delivery addresses, GST numbers, and corporate entity names.</li>
          <li><strong>Payment Verification Data:</strong> For processing payments, we may collect UTR/transaction reference numbers, UPI details, and payment verification receipts. All payment gateways used are secure third-party platforms.</li>
          <li><strong>Customization Elements:</strong> Logos, artwork, custom text, and brand identity guidelines provided for product customization.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. Communication & Consent</h2>
        <p>By registering on our website or submitting an inquiry, you consent to our communication channels:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>WhatsApp & Mobile:</strong> We use WhatsApp and mobile channels explicitly for communicating order status updates, stock confirmations, payment requests, and dispatch details.</li>
          <li><strong>Email:</strong> Emails are used to send formal order summaries, approved invoices after payment verification, and digital mockup approvals.</li>
          <li><strong>Marketing:</strong> You may opt-out of marketing communications at any time. Operational updates regarding active requests cannot be opted out of.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. How We Use Your Information</h2>
        <p>We process your data strictly to facilitate our bulk corporate gifting workflow:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>To verify product availability, MOQ feasibility, and customization queries with our suppliers.</li>
          <li>To process manual payment verifications and generate invoices.</li>
          <li>To fulfill dispatch and multi-location delivery requirements.</li>
          <li>To ensure secure Authentication via Firebase and session management.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Information Sharing & Third Parties</h2>
        <p>We do not sell your personal data. We only share information when necessary to fulfill your bulk orders:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Suppliers & Logistics:</strong> Your delivery details and customization requirements are shared with trusted logistics partners and manufacturing facilities.</li>
          <li><strong>Legal Obligations:</strong> When legally required to comply with Indian GST/tax audits or legal inquiries.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Data Retention & Security</h2>
        <p>We retain your order histories, transaction references, and customized artwork models only as long as necessary for administrative, legal, and operational purposes. We employ robust security measures across our platform.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">6. Contact Us</h2>
        <p>If you have questions about our data practices, please email us at <strong>aurevagifts@gmail.com</strong>.</p>
      </div>
    </div>
  );
}
