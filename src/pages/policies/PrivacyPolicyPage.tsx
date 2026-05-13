import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12 md:py-20 lg:py-24">
      <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-8">Privacy Policy</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-serif">
        <p className="lead text-lg mb-8">
          At AUREVA Corporate Gifting, we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information when you visit our website or make a purchase from us.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Information We Collect</h2>
        <p>We collect personal information that you voluntarily provide to us when registering on our website, expressing an interest in obtaining information about us or our products, or otherwise contacting us. This includes:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Personal Details:</strong> Names, phone numbers, email addresses, mailing addresses, GST numbers, and company names.</li>
          <li><strong>Payment Information:</strong> We collect data necessary to process your payment if you make purchases, such as payment instrument number and security code associated with your payment instrument. All payment data is handled securely by our payment gateway providers.</li>
          <li><strong>Customization Elements:</strong> Logos, artwork, custom text, and specific brand guidelines provided for product customization.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. How We Use Your Information</h2>
        <p>We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent. We use the information we collect or receive to:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Fulfill and manage your customized printing and bulk orders.</li>
          <li>Send administrative information to you, including order confirmations, shipping updates, and invoices.</li>
          <li>Post testimonials with your consent.</li>
          <li>Protect our services and keep them safe and secure.</li>
          <li>Send marketing and promotional communications, which you can opt-out of at any time.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. Sharing Your Information</h2>
        <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may share your data with:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Service Providers:</strong> Third-party vendors such as shipping partners and payment gateways.</li>
          <li><strong>Legal Obligations:</strong> When legally required to do so in order to comply with applicable laws and GST/tax audits.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Intellectual Property & Custom Logos</h2>
        <p>Any logos, brand assets, or custom artwork provided by you for printing on corporate gifts remain your intellectual property. We only use these assets for the sole purpose of fulfilling your specific order. We will never reuse, resell, or distribute your corporate assets to third parties.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Data Retention & Security</h2>
        <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless otherwise required by law. We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">6. Contact Us</h2>
        <p>If you have questions or comments about this policy, you may email us at <strong>aurevagifts@gmail.com</strong>.</p>
      </div>
    </div>
  );
}
