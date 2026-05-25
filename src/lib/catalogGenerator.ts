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

  // COVER PAGE
  doc.setFillColor(15, 23, 42); // slate-900 background
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(212, 175, 55); // #d4af37 (Gold)
  doc.setFontSize(40);
  doc.setFont("times", "bold");
  doc.text("AUREVA", pageWidth / 2, pageHeight / 3 - 20, { align: 'center' });
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("CORPORATE GIFTING EXCELLENCE", pageWidth / 2, pageHeight / 3, { align: 'center' });
  
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), pageWidth / 2, pageHeight / 2, { align: 'center' });
  
  if (categoryFilter) {
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(18);
    doc.text(`Category: ${categoryFilter}`, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });
  }

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(11);
  doc.text("Premium Bulk Order Partner", pageWidth / 2, pageHeight - 65, { align: 'center' });
  doc.text("WhatsApp: +91 7990878248 | Email: aurevagifts@gmail.com", pageWidth / 2, pageHeight - 55, { align: 'center' });
  doc.text("www.aurevagifts.com", pageWidth / 2, pageHeight - 45, { align: 'center' });
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text("IMPORTANT: AUREVA specializes in bulk corporate gifting orders.", pageWidth / 2, pageHeight - 25, { align: 'center' });
  doc.text("Product availability, pricing, and customization are subject to stock confirmation and minimum order quantity requirements.", pageWidth / 2, pageHeight - 20, { align: 'center' });

  // PRODUCTS PAGES
  doc.addPage();
  
  // Header on each page
  const addHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("AUREVA", 15, 13);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Corporate Catalog", pageWidth - 15, 13, { align: 'right' });
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
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(250, 250, 250);
      doc.setLineWidth(0.2);
      doc.roundedRect(15, yPosition, pageWidth - 30, 60, 3, 3, 'FD');
      
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
      
      // Product Info
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      
      const textLines = doc.splitTextToSize(product.name, pageWidth - 90);
      doc.text(textLines, 75, yPosition + 12);
      
      const titleHeight = textLines.length * 6;
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(product.description || '', pageWidth - 90);
      doc.text(descLines.slice(0, 3), 75, yPosition + 12 + titleHeight); // Show max 3 lines of desc
      
      // Price and MOQ
      doc.setTextColor(212, 175, 55); // Gold
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${formatCurrency(product.basePrice)}`, 75, yPosition + 45);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`MOQ: ${product.minOrderQuantity || 1} units`, 140, yPosition + 45);
      
      // Details strings
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Procurement Time: ${product.estimatedProcurementTime === 'ready' ? 'Ready to Ship' : (product.estimatedProcurementTime || 'Depends on Volume')}`, 140, yPosition + 40);
      
      // Customization tags
      if (product.smallLogoCharge !== undefined || product.nameEngravingCharge !== undefined) {
         doc.setFillColor(230, 230, 230);
         doc.roundedRect(75, yPosition + 50, 45, 6, 1, 1, 'F');
         doc.setTextColor(80, 80, 80);
         doc.setFontSize(7);
         doc.text("Custom Branding Available", 97.5, yPosition + 54, { align: 'center' });
      }
      
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
