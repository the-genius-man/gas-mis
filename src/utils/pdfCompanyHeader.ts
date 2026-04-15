/**
 * Shared jsPDF company header and footer for all GAS PDF exports.
 * Keeps branding consistent and changes in one place.
 */
import jsPDF from 'jspdf';

export const GAS_COMPANY = {
  name: 'GO AHEAD SARLU',
  department: 'Département de Sécurité et Gardiennage',
  rccm: 'RCCM: CD/GOM/RCCM/20-B-00414',
  idNat: 'ID NAT.: 19-H5300-N897290',
  impot: 'IMPOT: A2155845A',
  address: '70, Av Abattoir, Q Kyeshero, En Diagonal de la Cathédrale, Goma - RDC',
  phone: '+243 974 821 064; +243 855 307 832',
  email: 'gas@goahead.africa',
  website: 'www.goahead.africa',
  bank: 'BANK OF AFRICA',
  bankAccount: '04530670005',
  bankIntitule: 'GO AHEAD SARL',
};

/**
 * Draws the company header on the current page.
 *
 * Portrait (A4): L=15, R=195, pageWidth=210
 * Landscape (A4): L=10, R=287, pageWidth=297
 *
 * @param doc       jsPDF instance
 * @param docTitle  Document title shown on the right (e.g. "RELEVÉ DE COMPTE")
 * @param subtitle  Optional subtitle below the title (e.g. date range)
 * @param L         Left margin in mm (default 15)
 * @param R         Right margin in mm (default 195 for portrait)
 * @returns         The y position after the header (ready for content)
 */
export function drawPdfHeader(
  doc: jsPDF,
  docTitle: string,
  subtitle?: string,
  L = 15,
  R = 195
): number {
  let y = 18;

  // Company name (left, blue)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(GAS_COMPANY.name, L, y);

  // Department + RCCM (left, gray)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`${GAS_COMPANY.department}  |  ${GAS_COMPANY.rccm}`, L, y + 5);

  // Document title (right, dark)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(docTitle, R, y, { align: 'right' });

  // Subtitle (right, gray)
  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(subtitle, R, y + 5, { align: 'right' });
  }

  // Separator line
  y += 12;
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(L, y, R, y);
  y += 6;

  // Reset text color
  doc.setTextColor(17, 24, 39);

  return y;
}

/**
 * Draws the company footer at the bottom of the current page.
 *
 * @param doc       jsPDF instance
 * @param footerY   Y position for the footer line (default 280 for portrait, 200 for landscape)
 * @param centerX   Center X for centered text (default 105 for portrait, 148 for landscape)
 */
export function drawPdfFooter(
  doc: jsPDF,
  footerY = 280,
  centerX = 105
): void {
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(footerY > 250 ? 15 : 10, footerY, footerY > 250 ? 195 : 287, footerY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text(GAS_COMPANY.address, centerX, footerY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text(
    `${GAS_COMPANY.phone}  |  ${GAS_COMPANY.email}  |  ${GAS_COMPANY.website}`,
    centerX, footerY + 8, { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.text(
    `${GAS_COMPANY.bank};  Compte: ${GAS_COMPANY.bankAccount};  Intitulé: ${GAS_COMPANY.bankIntitule}`,
    centerX, footerY + 12, { align: 'center' }
  );
}
