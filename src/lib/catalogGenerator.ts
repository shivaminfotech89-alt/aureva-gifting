import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BUSINESS } from './business';
import { ProductData } from '../components/shop/ProductCard';
import { formatCurrency } from './utils';

// Helper to load image as base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to load image for PDF:', e);
    return '';
  }
};

let robotoRegularBase64: string | null = null;
let robotoBoldBase64: string | null = null;
/**
 * Whether the rupee-capable font actually arrived.
 *
 * Roboto is fetched from a CDN at generation time and the failure is caught
 * and logged, so a blocked or slow CDN left every price rendered in Helvetica
 * — which has no rupee glyph and silently prints a superscript one on a
 * document a customer keeps. When it is missing, say "Rs." instead.
 */
let rupeeFontReady = false;

/** The currency prefix the loaded font can actually draw. */
const rupee = () => (rupeeFontReady ? '\u20B9' : 'Rs. ');

const loadFonts = async (doc: jsPDF) => {
  try {
    if (!robotoRegularBase64) {
      const regRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf');
      if (regRes.ok) {
         const regBuf = await regRes.arrayBuffer();
         const regBytes = new Uint8Array(regBuf);
         let regBin = '';
         for (let i = 0; i < regBytes.byteLength; i++) {
           regBin += String.fromCharCode(regBytes[i]);
         }
         robotoRegularBase64 = window.btoa(regBin);
      }
    }
    if (robotoRegularBase64) {
      doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    }

    if (!robotoBoldBase64) {
      const boldRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf');
      if (boldRes.ok) {
         const boldBuf = await boldRes.arrayBuffer();
         const boldBytes = new Uint8Array(boldBuf);
         let boldBin = '';
         for (let i = 0; i < boldBytes.byteLength; i++) {
           boldBin += String.fromCharCode(boldBytes[i]);
         }
         robotoBoldBase64 = window.btoa(boldBin);
      }
    }
    if (robotoBoldBase64) {
       doc.addFileToVFS('Roboto-Medium.ttf', robotoBoldBase64);
       doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
    }
    rupeeFontReady = !!(robotoRegularBase64 && robotoBoldBase64);
  } catch(e) {
    rupeeFontReady = false;
    console.error("Failed to load custom fonts", e);
  }
};

export const generateCatalogPDF = async (
  products: ProductData[], 
  title: string = "AUREVA Corporate Gifting Catalog",
  catalogType: 'category' | 'budget' = 'category',
  specificFilter?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Load custom fonts for unicode support (₹)
  await loadFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper to draw AUREVA logo
  const drawAurevaLogo = (x: number, y: number, scale = 1, r = 212, g = 175, b = 55) => {
    // Elegant diamond icon
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.8 * scale);
    
    const w = 6 * scale; 
    const h = 8 * scale;  
    
    doc.line(x, y - h, x - w, y);
    doc.line(x - w, y, x, y + h);
    doc.line(x, y + h, x + w, y);
    doc.line(x + w, y, x, y - h);

    doc.setLineWidth(0.4 * scale);
    const innerW = 3.5 * scale;
    const innerH = 5 * scale;
    doc.line(x, y - innerH, x - innerW, y);
    doc.line(x - innerW, y, x, y + innerH);
    doc.line(x, y + innerH, x + innerW, y);
    doc.line(x + innerW, y, x, y - innerH);

    doc.setFillColor(r, g, b);
    const centerW = 1.5 * scale;
    const centerH = 2 * scale;
    doc.triangle(x, y - centerH, x - centerW, y, x + centerW, y, 'F');
    doc.triangle(x, y + centerH, x - centerW, y, x + centerW, y, 'F');
  };

  // COVER PAGE
  doc.setFillColor(10, 25, 47); // Dark navy
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  doc.setLineWidth(0.2);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  drawAurevaLogo(pageWidth / 2, pageHeight / 3 - 35, 2.5);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.setFont("times", "bold");
  doc.text("A U R E V A", pageWidth / 2, pageHeight / 3 + 15, { align: 'center' });
  
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("C O R P O R A T E   G I F T I N G", pageWidth / 2, pageHeight / 3 + 28, { align: 'center' });
  
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 25, pageHeight / 3 + 40, pageWidth / 2 + 25, pageHeight / 3 + 40);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  const mainTitle = catalogType === 'budget' ? "MASTER BUDGET CATALOG" : "CORPORATE GIFTING CATALOG";
  doc.text(mainTitle, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
  
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Customized Corporate Gifting Solutions", pageWidth / 2, pageHeight / 2 + 22, { align: 'center' });

  if (catalogType === 'category' && specificFilter && specificFilter !== 'All') {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("Roboto", "bold");
    doc.text(`C A T E G O R Y :  ${specificFilter.toUpperCase()}`, pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });
  }

  // BOTTOM SECTION
  const startY = pageHeight - 65;
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(BUSINESS.site.replace(/^https?:\/\//, ''), pageWidth / 2, startY, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Email: ${BUSINESS.email}   |   WhatsApp: ${BUSINESS.whatsapp}`, pageWidth / 2, startY + 8, { align: 'center' });
  doc.text(
    `${BUSINESS.registeredAddress.locality}, ${BUSINESS.registeredAddress.city}, ` +
    `${BUSINESS.registeredAddress.state} ${BUSINESS.registeredAddress.pin}, ${BUSINESS.registeredAddress.country}`,
    pageWidth / 2, startY + 16, { align: 'center' },
  );
  // Smaller than the lines above it: this sits just under the notice box and
  // is the longest line on the cover.
  doc.setFontSize(8);
  doc.text(
    `${BUSINESS.brand} is a brand of ${BUSINESS.tradeName}   |   GSTIN: ${BUSINESS.gstin}`,
    pageWidth / 2, startY + 22, { align: 'center' },
  );
  
  doc.setFillColor(15, 30, 55); 
  doc.rect(20, startY + 26, pageWidth - 40, 18, 'F');
  
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("IMPORTANT NOTICE", pageWidth / 2, startY + 32, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AUREVA specializes in bulk corporate gifting orders.", pageWidth / 2, startY + 36, { align: 'center' });
  doc.text("Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.", pageWidth / 2, startY + 40, { align: 'center' });

  // Add Index Page placeholder
  doc.addPage();
  const indexPageNumber = 2;
  
  // Header function
  const addHeader = (pageNum: number) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 22, 'F');
    drawAurevaLogo(20, 10, 0.7);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("AUREVA", 33, 12, { charSpace: 2 } as any);
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${pageNum}`, pageWidth - 15, 12, { align: 'right' });
    doc.setTextColor(248, 248, 248);
    doc.setFontSize(80);
    doc.setFont("times", "bold");
    doc.text("AUREVA", pageWidth / 2, pageHeight / 2, { align: 'center', angle: -45, charSpace: 10 } as any);
    doc.setTextColor(15, 23, 42); 
  };

  // Grouping Products
  const groups: { name: string; products: ProductData[] }[] = [];
  
  if (catalogType === 'budget') {
     const slabs = [
       { name: "Products Under ₹250", min: 0, max: 250 },
       { name: "Products ₹250 – ₹1000", min: 250, max: 1000 },
       { name: "Products ₹1000 – ₹2500", min: 1000, max: 2500 },
       { name: "Premium Gifts (Above ₹2500)", min: 2500, max: 9999999 }
     ];
     slabs.forEach(slab => {
        const slabProducts = products.filter(p => p.basePrice >= slab.min && p.basePrice < slab.max);
        if (slabProducts.length > 0) {
           groups.push({ name: slab.name, products: slabProducts.sort((a,b) => a.basePrice - b.basePrice) });
        }
     });
  } else {
     // Category Logic
     const catMap: { [key: string]: ProductData[] } = {};
     products.forEach(p => {
       const cat = p.categoryId || 'Uncategorized';
       if (specificFilter && specificFilter !== 'All' && cat !== specificFilter) return;
       if (!catMap[cat]) catMap[cat] = [];
       catMap[cat].push(p);
     });
     Object.keys(catMap).sort().forEach(cat => {
       groups.push({ name: cat, products: catMap[cat] });
     });
  }

  const indexEntries: { name: string, startPage: number, endPage: number }[] = [];
  let currentActualPage = 3; 

  doc.addPage();
  addHeader(currentActualPage);
  let yPosition = 30;

  for (const group of groups) {
    if (yPosition > 200 && groups.indexOf(group) !== 0) {
      doc.addPage();
      currentActualPage++;
      addHeader(currentActualPage);
      yPosition = 30;
    }
    
    // Record index
    const entry = { name: group.name, startPage: currentActualPage, endPage: currentActualPage };
    indexEntries.push(entry);
    
    // Section Header
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition, pageWidth - 30, 20, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.5);
    doc.line(15, yPosition, 15, yPosition + 20);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    // Use Roboto for group titles to support ₹ symbol properly
    doc.setFont("Roboto", "bold");
    doc.text(`${group.name.toUpperCase()}`, 25, yPosition + 13);
    
    yPosition += 30;
    
    // Render Products
    for (let i = 0; i < group.products.length; i++) {
      const product = group.products[i];
      if (yPosition > 230) {
        doc.addPage();
        currentActualPage++;
        addHeader(currentActualPage);
        entry.endPage = currentActualPage; // Update end page
        yPosition = 30;
      }
      
      doc.setDrawColor(220, 220, 220); 
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.2);
      doc.roundedRect(15, yPosition, pageWidth - 30, 60, 2, 2, 'FD');
      
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(15, yPosition, 60, 60, 2, 2, 'F');
      
      let imgBase64 = '';
      if (product.images && product.images.length > 0) {
         imgBase64 = await getBase64ImageFromUrl(product.images[0]);
      }
      
      if (imgBase64) {
        try { doc.addImage(imgBase64, 'JPEG', 20, yPosition + 5, 50, 50); }
        catch (e) {
           doc.setDrawColor(200, 200, 200); doc.rect(20, yPosition + 5, 50, 50);
        }
      } else {
         doc.setDrawColor(200, 200, 200); doc.rect(20, yPosition + 5, 50, 50);
      }
      
      doc.setDrawColor(230, 230, 230);
      doc.line(75, yPosition, 75, yPosition + 60);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      const textLines = doc.splitTextToSize(product.name, pageWidth - 145);
      doc.text(textLines, 82, yPosition + 12);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(product.description || '', pageWidth - 145);
      doc.text(descLines.slice(0, 3), 82, yPosition + 25);
      
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text(`Procurement Timeline: ${product.estimatedProcurementTime === 'ready' ? 'Ready to Ship' : (product.estimatedProcurementTime || 'Volume Dependent')}`, 82, yPosition + 45);

      if (product.smallLogoCharge !== undefined || product.nameEngravingCharge !== undefined) {
         doc.setTextColor(212, 175, 55); 
         doc.text("✓ Custom Branding Available", 82, yPosition + 52);
      }

      doc.setDrawColor(230, 230, 230);
      doc.line(pageWidth - 55, yPosition, pageWidth - 55, yPosition + 60);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(pageWidth - 55, yPosition, 40, 60, 2, 2, 'F');

      const formattedPrice = formatCurrency(product.basePrice)
        .replace(/[\s\u00A0\u202F]+/g, '')
        .replace('\u20B9', rupee());
      
      doc.setTextColor(15, 23, 42); 
      doc.setFontSize(11);
      doc.setFont("Roboto", "bold");
      doc.text(`Starting Price: \n${formattedPrice}`, pageWidth - 35, yPosition + 25, { align: 'center' });
      
      doc.setTextColor(212, 175, 55); 
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`MOQ: ${product.minOrderQuantity || 1} units`, pageWidth - 35, yPosition + 42, { align: 'center' });
      
      yPosition += 65;
    }
  }

  // Draw Index Page
  doc.setPage(indexPageNumber);
  addHeader(indexPageNumber);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("AUREVA CORPORATE GIFTING", pageWidth / 2, 35, { align: 'center', charSpace: 1 } as any);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const indexTitle = catalogType === 'budget' ? "BUDGET CATALOG INDEX" : "CATEGORY CATALOG INDEX";
  doc.text(indexTitle, pageWidth / 2, 45, { align: 'center' });
  
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 25, 50, pageWidth / 2 + 25, 50);

  let idxY = 65;
  for (const entry of indexEntries) {
    if (idxY > 260) {
      break;
    }
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold"); // Use Roboto to render ₹ symbol properly in indices
    doc.text(entry.name, 30, idxY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    // Rough width calculation since Roboto and Helvetica differ slightly
    const textWidth = doc.getTextWidth(entry.name);
    // Draw dots
    const dotsCount = Math.floor((pageWidth - 75 - textWidth - 20) / 2);
    const dotStr = ".".repeat(Math.max(dotsCount, 1));
    doc.text(dotStr, 30 + textWidth + 3, idxY);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const pageText = entry.startPage === entry.endPage ? `Page ${entry.startPage}` : `Page ${entry.startPage}–${entry.endPage}`;
    doc.text(pageText, pageWidth - 30, idxY, { align: 'right' });
    
    idxY += 16;
  }

  // Footer on index
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.setPage(doc.getNumberOfPages()); 

  const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${filename}.pdf`);
};
