import React from 'react';

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12 md:py-20 lg:py-24">
      <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-8">Shipping Policy</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-serif">
        <p className="lead text-lg mb-8">
          AUREVA Corporate Gifting partners with premium logistics services to ensure your corporate gifts reach safely and on time, nationwide across India.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Processing Timelines</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Non-Customized Orders:</strong> Dispatched within 2-3 business days.</li>
          <li><strong>Customized / Logo Printed Orders:</strong> Standard processing time is 7-10 business days after the digital mockup is approved and payment is confirmed. Processing time may vary depending on the order volume and customization complexity.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. Delivery Timelines</h2>
        <p>Once dispatched, standard delivery times within India are:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Metro Cities: 3-5 business days</li>
          <li>Tier II & Tier III Cities: 5-7 business days</li>
          <li>Remote Locations: 7-10 business days</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. Shipping Charges</h2>
        <p>Shipping charges are calculated based on the volumetric weight of your bulk order and the destination pin code. These charges are quoted during checkout or finalized by your dedicated account manager for custom bulk orders. We offer free shipping on select premium enterprise hampers.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Multi-Location Dispatch</h2>
        <p>For corporate / employee welcome kits or festival gifting, we offer direct-to-employee fulfillment (multi-location shipping). You must provide an Excel/CSV sheet of valid delivery addresses. Additional packaging and individual dispatch fees will apply per location.</p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Customer Tracking</h2>
        <p>A master tracking link or a tracking sheet will be provided via email and WhatsApp upon dispatch, allowing you to monitor the delivery status of all your shipments in real-time.</p>
      </div>
    </div>
  );
}
