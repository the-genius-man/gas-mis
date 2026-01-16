import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export HTML element to PDF
 * @param element - The HTML element to convert to PDF
 * @param filename - The name of the PDF file
 * @param options - Additional options for PDF generation
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string = 'document.pdf',
  options: {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
    quality?: number;
  } = {}
): Promise<void> {
  const {
    orientation = 'portrait',
    format = 'a4',
    quality = 0.95
  } = options;

  try {
    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        // Ensure all styles are applied in the cloned document
        const clonedElement = clonedDoc.querySelector('.invoice-page') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.display = 'block';
          clonedElement.style.visibility = 'visible';
        }
      }
    });

    // Calculate PDF dimensions
    const imgWidth = format === 'a4' ? 210 : 216; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Export multiple HTML elements to a single PDF (multi-page)
 * @param elements - Array of HTML elements to convert
 * @param filename - The name of the PDF file
 * @param options - Additional options for PDF generation
 */
export async function exportMultipleToPDF(
  elements: HTMLElement[],
  filename: string = 'document.pdf',
  options: {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
    quality?: number;
  } = {}
): Promise<void> {
  const {
    orientation = 'portrait',
    format = 'a4',
    quality = 0.95
  } = options;

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const imgWidth = format === 'a4' ? 210 : 216; // mm

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.body.querySelector('.invoice-page') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.display = 'block';
            clonedElement.style.visibility = 'visible';
          }
        }
      });

      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', quality);

      // Add new page for subsequent elements
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Print HTML element using browser print dialog
 * @param element - The HTML element to print
 */
export function printElement(element: HTMLElement): void {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour imprimer');
    return;
  }

  // Clone the element
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Create print document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Impression</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          .invoice-page {
            page-break-after: always;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            background: white;
          }
          
          .invoice-page:last-child {
            page-break-after: auto;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .invoice-page {
              margin: 0;
              border: none;
              box-shadow: none;
            }
          }
        </style>
        ${document.head.querySelector('style')?.outerHTML || ''}
      </head>
      <body>
        ${clonedElement.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 250);
  };
}
