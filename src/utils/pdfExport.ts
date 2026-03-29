import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { prepareInvoicePrintData, InvoicePrintData } from '../components/Finance/InvoicePrintTemplateNew';
import type { FactureGAS, ClientGAS, SiteGAS } from '../types';

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

// ============================================================================
// Native jsPDF bulk invoice export — no html2canvas, no UI freeze
// ============================================================================

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function fmtDate(d: string | undefined): string {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function fmtAmt(n: number): string {
  return n.toFixed(2);
}

function drawInvoicePage(doc: jsPDF, data: InvoicePrintData): void {
  const { invoice, client, priorUnpaidInvoices } = data;
  const L = 15; // left margin mm
  const R = 195; // right margin mm
  const W = R - L; // content width
  let y = 20;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GO AHEAD SARLU', R, y, { align: 'right' });
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Département de Sécurité et Gardiennage', R, y, { align: 'right' });
  y += 4;
  doc.text('RCCM: CD/GOM/RCCM/20-B-00414;  IMPOT: A2155845A;  ID NAT.: 19-H5300-N897290', R, y, { align: 'right' });
  y += 10;

  // ── Client / Invoice info grid ───────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Client', L, y);
  doc.text('Numéro Facture', 90, y, { align: 'center' });
  doc.text('Total à payer', R, y, { align: 'right' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(client?.nom_entreprise || 'Client inconnu', L, y);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.numero_facture, 90, y, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`${fmtAmt(invoice.montant_total_du_client)} ${invoice.devise}`, R, y, { align: 'right' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (client?.contact_nom) doc.text(client.contact_nom, L, y);
  doc.text('Date', 90, y, { align: 'center' });
  y += 4;
  if (client?.telephone) doc.text(client.telephone, L, y);
  doc.text(fmtDate(invoice.date_emission), 90, y, { align: 'center' });
  y += 10;

  // ── Main service table ───────────────────────────────────────────────────
  doc.setLineWidth(0.5);
  doc.line(L, y, R, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Service', L, y);
  doc.text('Période Facturée', 65, y);
  doc.text('Prix Unitaire', 120, y, { align: 'right' });
  doc.text('Agents', 150, y, { align: 'center' });
  doc.text('Montant', R, y, { align: 'right' });
  y += 4;
  doc.line(L, y, R, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  const periodLabel = invoice.periode_mois
    ? `${MONTHS_FR[(invoice.periode_mois || 1) - 1]} ${invoice.periode_annee}`
    : '-';
  const unitPrice = invoice.details && invoice.details.length > 0
    ? invoice.details[0].montant_forfaitaire_site / (invoice.details[0].nombre_gardiens_site || 1)
    : 0;
  doc.text('Gardiennage', L, y);
  doc.text(periodLabel, 65, y);
  doc.text(fmtAmt(unitPrice), 120, y, { align: 'right' });
  doc.text(String(invoice.total_gardiens_factures), 150, y, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(fmtAmt(invoice.montant_ht_prestation), R, y, { align: 'right' });
  y += 5;
  doc.line(L, y, R, y);
  y += 8;

  // ── Prior unpaid invoices table ──────────────────────────────────────────
  if (priorUnpaidInvoices.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('AUTRES FACTURES', 105, y, { align: 'center' });
    y += 5;
    doc.line(L, y, R, y);
    y += 4;
    doc.text('Période Impayée', L, y);
    doc.text('Date Facture', 70, y);
    doc.text('N° Facture', 115, y);
    doc.text('Montant', R, y, { align: 'right' });
    y += 4;
    doc.line(L, y, R, y);
    y += 5;
    doc.setFont('helvetica', 'normal');

    for (const prior of priorUnpaidInvoices) {
      const priorPeriod = prior.periode_mois
        ? `${MONTHS_FR[(prior.periode_mois || 1) - 1]} ${prior.periode_annee}`
        : '-';
      doc.text(priorPeriod, L, y);
      doc.text(fmtDate(prior.date_emission), 70, y);
      doc.text(prior.numero_facture, 115, y);
      doc.text(`${fmtAmt(prior.soldeRestant)} ${invoice.devise}`, R, y, { align: 'right' });
      y += 5;
    }
    doc.line(L, y, R, y);
    y += 4;
    const totalPrior = priorUnpaidInvoices.reduce((s, p) => s + p.soldeRestant, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Total créances antérieures', 115, y, { align: 'right' });
    doc.text(`${fmtAmt(totalPrior)} ${invoice.devise}`, R, y, { align: 'right' });
    y += 10;
  }

  // ── Totals ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total à payer', 140, y);
  doc.text(`${fmtAmt(invoice.montant_total_du_client)} ${invoice.devise}`, R, y, { align: 'right' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Pour Go Ahead,', R, y, { align: 'right' });
  y += 20;

  // ── Signature line ───────────────────────────────────────────────────────
  doc.line(R - 48, y, R, y);
  y += 4;
  doc.text('Facturation', R, y, { align: 'right' });
  y += 15;

  // ── Due date ─────────────────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cette facture est à payer avant le ${fmtDate(invoice.date_echeance)}`, L, y);
  y += 6;

  // ── Footer ───────────────────────────────────────────────────────────────
  const footerY = 280;
  doc.setLineWidth(0.5);
  doc.line(L, footerY, R, footerY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse: 70, Av Abattoir, Q Kyeshero, En Diagonal de la Cathédrale, Goma - RDC', 105, footerY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('+243 974 821 064; +243 855 307 832  |  gas@goahead.africa  |  www.goahead.africa', 105, footerY + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('BANK OF AFRICA;  Compte: 04530670005;  Intitulé: GO AHEAD SARL', 105, footerY + 12, { align: 'center' });
}

/**
 * Export invoices to PDF natively using jsPDF text rendering.
 * No html2canvas — no UI freeze, instant generation regardless of invoice count.
 */
export function exportInvoicesToPDF(
  invoices: (FactureGAS & { totalPaye?: number; soldeRestant?: number })[],
  clients: ClientGAS[],
  sites: SiteGAS[],
  allInvoices: (FactureGAS & { totalPaye?: number; soldeRestant?: number })[],
  filename: string
): void {
  if (invoices.length === 0) return;

  const printData = prepareInvoicePrintData(invoices, clients, sites, allInvoices);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  printData.forEach((data, index) => {
    if (index > 0) doc.addPage();
    drawInvoicePage(doc, data);
  });

  doc.save(filename);
}
