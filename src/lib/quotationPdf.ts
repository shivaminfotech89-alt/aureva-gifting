import { BUSINESS, registeredAddressLines } from './business';
import {
  QuoteLine, QuoteParty, deliveryEstimate, quoteNumber, quoteTotals,
  validUntil, formatDate, QUOTE_VALID_DAYS, BRANDING_LEAD_DAYS,
} from './quotation';

/**
 * Money as it appears on the quotation.
 *
 * Not the site's formatCurrency: that emits the rupee sign, and jsPDF's built
 * in Helvetica has no glyph for it, so every amount came out as a superscript
 * one. Writing "Rs." needs no embedded font and cannot silently corrupt a
 * document a customer is holding. Two decimals throughout, because a
 * quotation that says 81,344.7 looks like a typo.
 */
function money(n: number): string {
  const v = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(n) || 0);
  return `Rs. ${v}`;
}

/**
 * Builds the quotation PDF a corporate buyer raises a purchase order against.
 *
 * jsPDF is loaded on demand: this runs when a button is pressed, and the
 * library is 380 KB that no other page needs.
 */
export async function generateQuotationPDF(opts: {
  lines: QuoteLine[];
  party: QuoteParty;
  /** Overridable so the same quote can be regenerated with its own number. */
  number?: string;
  issuedAt?: Date;
}): Promise<{ number: string; fileName: string }> {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const issued = opts.issuedAt ?? new Date();
  const number = opts.number ?? quoteNumber(issued);
  const totals = quoteTotals(opts.lines, opts.party.state);
  const delivery = deliveryEstimate(opts.party.city, opts.party.state);

  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();
  const M = 15;
  const navy: [number, number, number] = [15, 30, 55];
  const gold: [number, number, number] = [212, 175, 55];

  // Header band.
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AUREVA', M, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.text('CORPORATE GIFTING', M, 20.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('QUOTATION', W - M, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(number, W - M, 21, { align: 'right' });

  // Supplier and buyer.
  let y = 44;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', M, y);
  doc.text('QUOTATION FOR', W / 2, y);
  doc.setFont('helvetica', 'normal');
  y += 5;

  const fromLines = [
    BUSINESS.tradeName,
    `Proprietor: ${BUSINESS.legalName}`,
    ...registeredAddressLines(),
    `GSTIN: ${BUSINESS.gstin}`,
  ];
  const p = opts.party;
  const toLines = [
    p.company || p.contactName || 'Prospective customer',
    ...(p.company && p.contactName ? [`Attn: ${p.contactName}`] : []),
    ...(p.city || p.state ? [[p.city, p.state].filter(Boolean).join(', ')] : []),
    ...(p.email ? [p.email] : []),
    ...(p.phone ? [p.phone] : []),
  ];
  const rows = Math.max(fromLines.length, toLines.length);
  doc.setFontSize(9);
  for (let i = 0; i < rows; i++) {
    if (fromLines[i]) doc.text(fromLines[i], M, y + i * 4.6);
    if (toLines[i]) doc.text(toLines[i], W / 2, y + i * 4.6);
  }
  y += rows * 4.6 + 4;

  doc.setFontSize(9);
  doc.text(`Date: ${formatDate(issued)}`, M, y);
  doc.text(`Valid until: ${formatDate(validUntil(issued))}  (${QUOTE_VALID_DAYS} days)`, W / 2, y);
  y += 6;

  // Lines.
  autoTable(doc, {
    startY: y,
    head: [['#', 'Product', 'Code', 'Qty', 'Rate', 'Amount']],
    body: opts.lines.map((l, i) => [
      String(i + 1),
      l.color ? `${l.name}\n(${l.color})` : l.name,
      l.sku || '—',
      String(l.quantity),
      money(l.rate),
      money(l.rate * l.quantity),
    ]),
    theme: 'grid',
    headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: 40 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 34 },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: M, right: M },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Totals. The tax split follows place of supply, as on the invoice.
  const totalRows: [string, string][] = [
    ['Subtotal', money(totals.subTotal)],
    ...(totals.tax.intraState
      ? ([['CGST (9%)', money(totals.tax.cgst)],
          ['SGST (9%)', money(totals.tax.sgst)]] as [string, string][])
      : ([['IGST (18%)', money(totals.tax.igst)]] as [string, string][])),
  ];
  doc.setFontSize(9);
  for (const [label, value] of totalRows) {
    doc.setTextColor(80, 80, 80);
    doc.text(label, W - M - 60, y);
    doc.setTextColor(30, 30, 30);
    doc.text(value, W - M, y, { align: 'right' });
    y += 5.4;
  }
  doc.setDrawColor(220, 220, 220);
  doc.line(W - M - 62, y - 2, W - M, y - 2);
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...navy);
  doc.text('Total', W - M - 60, y);
  doc.text(money(totals.grandTotal), W - M, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 10;

  // Delivery, from Ahmedabad.
  doc.setFillColor(248, 248, 245);
  doc.rect(M, y - 4, W - M * 2, 20, 'F');
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Estimated delivery: ${delivery.label}`, M + 4, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(delivery.note, M + 4, y + 7);
  doc.text(
    `Branded or personalised orders add ${BRANDING_LEAD_DAYS.min}–${BRANDING_LEAD_DAYS.max} business days for production.`,
    M + 4, y + 11.5,
  );
  y += 24;

  // Terms.
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Terms', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  y += 5;
  const terms = [
    `This quotation is valid for ${QUOTE_VALID_DAYS} days from the date above and is subject to stock confirmation.`,
    'All amounts are in Indian Rupees (INR). Prices are exclusive of GST, which is shown separately, and freight is extra unless stated otherwise.',
    'Branding, logo printing and engraving are charged separately and confirmed against an approved mockup.',
    'Minimum order quantities apply per product and are confirmed at the time of order.',
    `Goods are supplied by ${BUSINESS.tradeName}, GSTIN ${BUSINESS.gstin}, from Ahmedabad, Gujarat.`,
    'This is a quotation, not an invoice, and does not constitute a demand for payment.',
  ];
  for (const t of terms) {
    const wrapped = doc.splitTextToSize(t, W - M * 2 - 4) as string[];
    for (const line of wrapped) { doc.text(`•  ${line}`, M, y); y += 4.2; }
  }

  // Footer on every page.
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();
    doc.setDrawColor(230, 230, 230);
    doc.line(M, H - 16, W - M, H - 16);
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `${BUSINESS.brand} — a brand of ${BUSINESS.tradeName}  |  GSTIN ${BUSINESS.gstin}  |  Ahmedabad, Gujarat`,
      M, H - 11,
    );
    doc.text(`${number}   Page ${i} of ${pages}`, W - M, H - 11, { align: 'right' });
  }

  const fileName = `Aureva-Quotation-${number}.pdf`;
  doc.save(fileName);
  return { number, fileName };
}
