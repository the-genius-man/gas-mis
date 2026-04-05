/**
 * Central export filename generator for GAS exports.
 *
 * Format: GAS YYYY - [Object]_YYYY-MM-DD[.ext]
 *
 * Examples:
 *   gasFilename('Facture', 'FAC-26-03-001')        → "GAS 2026 - Facture_FAC-26-03-001_2026-03-15"
 *   gasFilename('Factures', '12 factures')          → "GAS 2026 - Factures_12-factures_2026-03-15"
 *   gasFilename('Rapport Créances')                 → "GAS 2026 - Rapport-Créances_2026-03-15"
 */
export function gasFilename(
  object: string,
  detail?: string,
  ext: 'pdf' | 'xlsx' = 'pdf'
): string {
  const year = new Date().getFullYear();
  const date = new Date().toISOString().slice(0, 10);
  const safeObject = object.replace(/\s+/g, '-');
  const safeDetail = detail ? `_${detail.replace(/\s+/g, '-').replace(/[/\\:*?"<>|]/g, '')}` : '';
  return `GAS ${year} - ${safeObject}${safeDetail}_${date}.${ext}`;
}
