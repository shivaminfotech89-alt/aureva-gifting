import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export const generateCatalogPDF = async (
  products: ProductData[], 
  title: string = "AUREVA Corporate Gifting Catalog", 
  categoryFilter?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper to draw AUREVA logo
  const drawAurevaLogo = (x: number, y: number, scale = 1, r = 212, g = 175, b = 55) => {
    // Elegant diamond icon
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.8 * scale);
    
    const w = 6 * scale; 
    const h = 8 * scale;  
    
    // Outer Diamond
    doc.line(x, y - h, x - w, y);
    doc.line(x - w, y, x, y + h);
    doc.line(x, y + h, x + w, y);
    doc.line(x + w, y, x, y - h);

    // Inner Diamond
    doc.setLineWidth(0.4 * scale);
    const innerW = 3.5 * scale;
    const innerH = 5 * scale;
    doc.line(x, y - innerH, x - innerW, y);
    doc.line(x - innerW, y, x, y + innerH);
    doc.line(x, y + innerH, x + innerW, y);
    doc.line(x + innerW, y, x, y - innerH);

    // Center filled diamond
    doc.setFillColor(r, g, b);
    const centerW = 1.5 * scale;
    const centerH = 2 * scale;
    doc.triangle(
      x, y - centerH,
      x - centerW, y,
      x + centerW, y,
      'F'
    );
    doc.triangle(
      x, y + centerH,
      x - centerW, y,
      x + centerW, y,
      'F'
    );
  };

  // COVER PAGE
  // Premium corporate navy blue background
  doc.setFillColor(10, 25, 47); // Dark navy
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative borders
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  doc.setLineWidth(0.2);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Draw large center logo
  drawAurevaLogo(pageWidth / 2, pageHeight / 3 - 35, 2.5);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.setFont("times", "bold");
  // Spaced text manually to avoid charSpace centering bug
  doc.text("A U R E V A", pageWidth / 2, pageHeight / 3 + 15, { align: 'center' });
  
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("C O R P O R A T E   G I F T I N G", pageWidth / 2, pageHeight / 3 + 28, { align: 'center' });
  
  // Decorative dividing line under brand
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 25, pageHeight / 3 + 40, pageWidth / 2 + 25, pageHeight / 3 + 40);

  // Middle Section
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("CORPORATE GIFTING CATALOG", pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
  
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Customized Corporate Gifting Solutions", pageWidth / 2, pageHeight / 2 + 22, { align: 'center' });

  if (categoryFilter) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(`C A T E G O R Y :  ${categoryFilter.toUpperCase()}`, pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });
  }

  // BOTTOM SECTION
  const startY = pageHeight - 65;
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("www.aurevagifts.com", pageWidth / 2, startY, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Email: aurevagifts@gmail.com   |   WhatsApp: +91 7990878248", pageWidth / 2, startY + 8, { align: 'center' });
  doc.text("Headquarters: Ahmedabad, Gujarat, India", pageWidth / 2, startY + 16, { align: 'center' });
  
  // Footer Note
  doc.setFillColor(15, 30, 55); // Slightly lighter navy block for footer disclaimer
  doc.rect(20, startY + 26, pageWidth - 40, 18, 'F');
  
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("IMPORTANT NOTICE", pageWidth / 2, startY + 32, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AUREVA specializes in bulk corporate gifting orders.", pageWidth / 2, startY + 36, { align: 'center' });
  doc.text("Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.", pageWidth / 2, startY + 40, { align: 'center' });

  // PRODUCTS PAGES
  doc.addPage();
  
  let pageNumber = 1;

  // Header on each page
  const addHeader = () => {
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
    doc.text("Corporate Catalog", pageWidth - 15, 12, { align: 'right' });
    
    // Watermark
    // A faint large logo/text to give a premium feel to the page background
    doc.setTextColor(248, 248, 248);
    doc.setFontSize(80);
    doc.setFont("times", "bold");
    // jsPDF rotation support using standard text with angle
    doc.text("AUREVA", pageWidth / 2, pageHeight / 2, { align: 'center', angle: -45, charSpace: 10 } as any);
    
    // reset colors for other elements
    doc.setTextColor(15, 23, 42); 
    doc.setFontSize(14);
  };

  let yPosition = 30;
  
  // Group products by category
  const productsByCategory: { [key: string]: ProductData[] } = {};
  
  products.forEach(p => {
    const cat = p.categoryId || 'Uncategorized';
    if (!productsByCategory[cat]) {
      productsByCategory[cat] = [];
    }
    productsByCategory[cat].push(p);
  });
  
  const categories = Object.keys(productsByCategory).sort();

  addHeader();

  let isFirstCategory = true;
  for (const cat of categories) {
    // If not the first category, and we're too far down the page, start a new page
    if (!isFirstCategory) {
      if (yPosition > 200) {
        doc.addPage();
        addHeader();
        yPosition = 30;
      } else {
        yPosition += 10;
      }
    }
    isFirstCategory = false;
    
    // Category Section Header
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition, pageWidth - 30, 15, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.line(15, yPosition, 15, yPosition + 15);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`SECTION: ${cat.toUpperCase()}`, 25, yPosition + 10);
    
    yPosition += 25;
    
    // Render Products for this category
    for (let i = 0; i < productsByCategory[cat].length; i++) {
      const product = productsByCategory[cat][i];
      
      // Check if we need a new page for product
      if (yPosition > 230) {
        doc.addPage();
        addHeader();
        yPosition = 30;
      }
      
      // Product Container styling
      doc.setDrawColor(220, 220, 220); // soft border
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.2);
      doc.roundedRect(15, yPosition, pageWidth - 30, 60, 2, 2, 'FD');
      
      // Image container bg
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(15, yPosition, 60, 60, 2, 2, 'F');
      
      // Product Image
      let imgBase64 = '';
      if (product.images && product.images.length > 0) {
        imgBase64 = await getBase64ImageFromUrl(product.images[0]);
      }
      
      if (imgBase64) {
        try {
           doc.addImage(imgBase64, 'JPEG', 20, yPosition + 5, 50, 50);
        } catch (e) {
           console.warn("Failed to add image to PDF for product:", product.name);
           doc.setDrawColor(200, 200, 200);
           doc.rect(20, yPosition + 5, 50, 50);
           doc.setFontSize(8);
           doc.setTextColor(150, 150, 150);
           doc.text("Image Unavailable", 45, yPosition + 30, { align: 'center' });
        }
      } else {
         doc.setDrawColor(200, 200, 200);
         doc.rect(20, yPosition + 5, 50, 50);
         doc.setFontSize(8);
         doc.setTextColor(150, 150, 150);
         doc.text("No Image", 45, yPosition + 30, { align: 'center' });
      }
      
      // Vertical divider
      doc.setDrawColor(230, 230, 230);
      doc.line(75, yPosition, 75, yPosition + 60);

      // Product Info
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      
      const textLines = doc.splitTextToSize(product.name, pageWidth - 145);
      doc.text(textLines, 82, yPosition + 12);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(product.description || '', pageWidth - 145);
      doc.text(descLines.slice(0, 3), 82, yPosition + 25);
      
      // Procurement Timeline
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text(`Procurement Timeline: ${product.estimatedProcurementTime === 'ready' ? 'Ready to Ship' : (product.estimatedProcurementTime || 'Volume Dependent')}`, 82, yPosition + 45);

      // Customization tags
      if (product.smallLogoCharge !== undefined || product.nameEngravingCharge !== undefined) {
         doc.setTextColor(212, 175, 55); // Gold
         doc.text("✓ Custom Branding Available", 82, yPosition + 52);
      }

      // Divider for Price Section
      doc.setDrawColor(230, 230, 230);
      doc.line(pageWidth - 55, yPosition, pageWidth - 55, yPosition + 60);
      
      // Price Section Background
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(pageWidth - 55, yPosition, 40, 60, 2, 2, 'F');

      // Price and MOQ
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Starting Price", pageWidth - 35, yPosition + 18, { align: 'center' });

      doc.setTextColor(15, 23, 42); 
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${formatCurrency(product.basePrice)}`, pageWidth - 35, yPosition + 28, { align: 'center' });
      
      doc.setTextColor(212, 175, 55); // Gold
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`MOQ: ${product.minOrderQuantity || 1} units`, pageWidth - 35, yPosition + 40, { align: 'center' });
      
      yPosition += 65;
    }
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Download
  let filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  if (categoryFilter) {
    filename += `_${categoryFilter.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  }
  doc.save(`${filename}.pdf`);
};
