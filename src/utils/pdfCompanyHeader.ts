/**
 * Shared jsPDF company header and footer for all GAS PDF exports.
 * Keeps branding consistent — change once, applies everywhere.
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
 * Tries to load the company logo.
 * In Electron dev: fetches from the Vite dev server (localhost:5173).
 * In Electron prod: reads from disk via Node fs.
 * Returns base64 data URI or null if unavailable.
 */
async function loadLogoData(): Promise<string | null> {
  // Try fetching from the renderer's origin first (works in both dev and prod)
  try {
    const response = await fetch('/logo-goahead.png');
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (_) { /* fall through to fs approach */ }

  // Fallback: Node fs (packaged Electron)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path');
    const candidates = [
      path.join(process.resourcesPath || '', 'logo-goahead.png'),
      path.join(process.cwd(), 'public', 'logo-goahead.png'),
      path.join(__dirname || '', '..', 'public', 'logo-goahead.png'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
      }
    }
  } catch (_) { /* not available */ }

  return null;
}

/**
 * Draws the full company header — logo left, company details right,
 * document title + subtitle right, blue separator line.
 *
 * Portrait A4:  L=15, R=195
 * Landscape A4: L=10, R=287
 *
 * @returns y position immediately after the separator line (ready for content)
 */
export async function drawPdfHeader(
  doc: jsPDF,
  docTitle: string,
  subtitle?: string,
  L = 15,
  R = 195
): Promise<number> {
  const startY = 14;

  // ── Logo (left) ──────────────────────────────────────────────────────────
  const logoData = await loadLogoData();
  if (logoData) {
    doc.addImage(logoData, 'PNG', L, startY, 40, 20);
  }

  // ── Company details (right) ───────────────────────────────────────────────
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(GAS_COMPANY.name, R, startY + 5, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(GAS_COMPANY.department, R, startY + 10, { align: 'right' });
  doc.text(GAS_COMPANY.rccm, R, startY + 14, { align: 'right' });
  doc.text(`${GAS_COMPANY.idNat}  |  ${GAS_COMPANY.impot}`, R, startY + 18, { align: 'right' });

  // ── Document title + subtitle (below logo area) ───────────────────────────
  let y = startY + 26;

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(L, y, R, y);
  y += 5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(docTitle, L, y);

  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(subtitle, R, y, { align: 'right' });
  }

  y += 7;
  doc.setTextColor(17, 24, 39);
  return y;
}

/**
 * Draws the company footer (address, phone/email, bank details).
 *
 * @param footerY  Y position of the separator line
 * @param centerX  Center X for text (105 portrait, 148 landscape)
 */
export function drawPdfFooter(
  doc: jsPDF,
  footerY = 280,
  centerX = 105
): void {
  const lineL = footerY > 250 ? 15 : 10;
  const lineR = footerY > 250 ? 195 : 287;

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.4);
  doc.line(lineL, footerY, lineR, footerY);

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
