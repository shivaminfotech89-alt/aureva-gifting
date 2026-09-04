import React from 'react';

export default function ReturnRefundPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 pb-16 pt-28 md:pt-32">
      <h1 className="text-[1.75rem] md:text-[2rem] font-display font-bold tracking-tight mb-8">Return, Exchange & Refund Policy</h1>

      <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-display">
        <p className="lead text-lg mb-8">
          AUREVA Corporate Gifting stands behind the quality of every product we deliver. Because our orders are bulk,
          customized and produced to order, returns and exchanges are accepted only in the specific circumstances set
          out below, and only where the required evidence is provided.
        </p>

        <div className="bg-destructive/10 border-l-4 border-destructive p-4 my-8 rounded-r-lg">
          <p className="text-destructive font-semibold m-0">
            A continuous, unedited unboxing video is mandatory for every return, exchange or replacement claim.
            Claims submitted without one cannot be processed. Please record the opening of every parcel before you
            break the seal.
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Mandatory Unboxing Video</h2>
        <p>
          Bulk consignments pass through multiple handlers, so we require a single unbroken recording of the parcel
          being opened. This is the primary evidence we use to establish whether an issue occurred in transit, in
          production, or after delivery. Your video must:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Be one continuous recording, without cuts, edits, pauses or speed changes.</li>
          <li>Begin <strong>before the outer packaging is opened</strong>, showing the parcel fully sealed.</li>
          <li>Clearly show the shipping label, the courier seal, and all sides of the outer box.</li>
          <li>Show the complete opening of the parcel and every item inside, unpacked one at a time.</li>
          <li>Show the specific damage, defect, shortage or incorrect item you are claiming for.</li>
          <li>Be well lit and in focus, with the product and packaging clearly identifiable.</li>
        </ul>
        <p>
          For multi-box consignments, record each box separately. Keep the original packaging, inner padding, tags and
          any damaged items until your claim is closed &mdash; we may need to arrange a pickup or inspection.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. Valid Reasons for a Return or Exchange</h2>
        <p>Subject to the video requirement above, we accept claims for:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Transit damage</strong> &mdash; items broken, crushed, stained or leaking on arrival.</li>
          <li><strong>Manufacturing defect</strong> &mdash; items that do not function or are faulty on arrival.</li>
          <li><strong>Wrong item or variant</strong> &mdash; a product, color or size other than the one confirmed.</li>
          <li><strong>Short shipment</strong> &mdash; fewer units delivered than the confirmed quantity.</li>
          <li><strong>Branding not matching the approved mockup</strong> &mdash; where the applied logo, text or placement differs from the digital proof you approved in writing.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. Reasons We Cannot Accept</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Change of mind, over-ordering, a cancelled internal event, or a revised budget.</li>
          <li>Incorrect logo, artwork, spelling or details supplied by you, or errors present in a mockup you approved.</li>
          <li>Minor variation in color, grain, texture or finish from website or catalog images, which are indicative only.</li>
          <li>Items used, washed, distributed to recipients, or removed from their original packaging beyond normal inspection.</li>
          <li>Damage caused after delivery, including in your own storage or onward distribution.</li>
          <li>Claims raised after the window in section 6, or without the unboxing video described in section 1.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Customized &amp; Logo-Printed Products</h2>
        <p>
          Customized products carrying your logo, brand colors or custom text cannot be resold and are therefore
          <strong> not returnable or refundable</strong> except under the valid reasons listed in section 2. By approving
          the digital mockup you accept responsibility for the artwork, spelling and placement shown in it.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Non-Customized / Blank Stock</h2>
        <p>
          Plain items with no branding applied may be returned within <strong>7 days of delivery</strong>, provided they are
          unused, undistributed, in original packaging and in resalable condition, and the unboxing video is available.
          A restocking fee of up to 10% may apply and return shipping is borne by the buyer.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">6. How and When to Raise a Claim</h2>
        <p>
          Report the issue within <strong>48 hours of delivery</strong> for damage, defects, shortages and wrong items.
          Send the following to your account manager, or to the email address on our Contact page:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Your order number and company name.</li>
          <li>The unedited unboxing video meeting the requirements in section 1.</li>
          <li>Clear photographs of the affected items and the outer packaging.</li>
          <li>The affected quantity and a description of the issue.</li>
        </ul>
        <p>
          We acknowledge claims within 2 business days and complete our assessment, including checks with the supplier
          or courier where needed, within 7 business days. A claim is only confirmed once we have said so in writing.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">7. Resolution</h2>
        <p>
          Where a claim is accepted we will, at our discretion and in discussion with you, replace the affected quantity,
          send the shortfall, or refund the affected quantity. Replacement is generally offered first, since bulk gifting
          orders are usually tied to an event date. Accepted claims are settled on the affected units, not the whole order.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">8. Refund Timelines</h2>
        <p>
          Approved refunds are processed only after internal payment verification is complete, typically within 5&ndash;7
          business days, to the original payment method or corporate bank account. NEFT/RTGS refunds on bulk orders may
          take up to 10 business days to reflect.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">9. Your Statutory Rights</h2>
        <p>
          Nothing in this policy limits any right you have under the Consumer Protection Act, 2019 or other applicable
          Indian law in respect of goods that are defective, damaged or not as described. The evidence requirements
          above exist so that we can assess claims quickly and fairly, not to exclude those rights.
        </p>
      </div>
    </div>
  );
}
