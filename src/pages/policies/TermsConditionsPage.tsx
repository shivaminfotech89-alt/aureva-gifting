import React from 'react';

export default function TermsConditionsPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12 md:py-20 lg:py-24">
      <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-8">Terms & Conditions</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-serif">
        <p className="lead text-lg mb-8">
          Welcome to AUREVA Corporate Gifting. These terms and conditions outline the rules and regulations for the use of our enterprise B2B website.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. General Overview</h2>
        <p>By accessing this website, we assume you accept these terms and conditions. Do not continue to use AUREVA Corporate Gifting if you do not agree to all of the terms and conditions stated on this page.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. Ordering & Contract</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Corporate & Bulk Orders:</strong> All customized and bulk orders are subject to stock availability and final confirmation by our team.</li>
          <li><strong>Customization Proofing:</strong> For custom logo printing, digital mockups will be shared. The order moves to processing only after written approval of the mockup. We are not liable for spelling or design errors once the mockup is approved.</li>
          <li><strong>Pricing:</strong> All prices displayed are subject to applicable GST as per the Indian government regulations. The GST amount will be calculated at checkout based on the HSN code of the products.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. User Responsibilities & Intellectual Property</h2>
        <p>When you upload a logo or artwork for customization, you warrant that you are the lawful owner of the intellectual property or have explicit permission to use it. AUREVA Corporate Gifting is not liable for any copyright or trademark infringements resulting from artwork provided by the customer.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Payment Terms</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>For online orders, full payment is required upfront unless a custom corporate credit arrangement has been established in writing.</li>
          <li>We use secure payment gateways. Any payment frauds or chargeback disputes will be subject to the jurisdiction of Ahmedabad, Gujarat courts.</li>
          <li>Invoices with a valid GSTIN will be provided for all B2B purchases to enable Input Tax Credit (ITC) claims.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Website Content & Use</h2>
        <p>Unless otherwise stated, AUREVA Corporate Gifting owns the intellectual property rights for all material on the website except for customer-provided logos. You may access this for your own personal use subjected to restrictions set in these terms.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">6. Governing Law</h2>
        <p>These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Ahmedabad, Gujarat.</p>
      </div>
    </div>
  );
}
