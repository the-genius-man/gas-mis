import React, { useEffect, useMemo, useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { ClientGAS, FactureWithPayments, PaiementGAS, AvoirGAS, StatementLine } from '../../types';
import { exportToExcel } from '../../utils/excelExport';

interface ClientStatementProps {
  client: ClientGAS;
  allFactures: FactureWithPayments[];
  onClose: () => void;
  /** When true, renders as a full-page section instead of a modal overlay */
  inline?: boolean;
}

function formatCurrency(amount: number, devise: string): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function firstDayOfMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

const ClientStatement: React.FC<ClientStatementProps> = ({ client, allFactures, onClose, inline = false }) => {
  const [dateDebut, setDateDebut] = useState<string>(firstDayOfMonthISO());
  const [dateFin, setDateFin] = useState<string>(todayISO());
  const [paiementsMap, setPaiementsMap] = useState<Record<string, PaiementGAS[]>>({});
  const [avoirs, setAvoirs] = useState<AvoirGAS[]>([]);
  const [loading, setLoading] = useState(false);

  // Factures for this client
  const clientFactures = useMemo(
    () => allFactures.filter(f => f.client_id === client.id),
    [allFactures, client.id]
  );

  // In-range factures
  const inRangeFactures = useMemo(
    () =>
      clientFactures.filter(
        f => f.date_emission >= dateDebut && f.date_emission <= dateFin
      ),
    [clientFactures, dateDebut, dateFin]
  );

  // Opening balance: sum of soldeRestant for invoices with date_emission < dateDebut
  const openingBalance = useMemo(
    () =>
      clientFactures
        .filter(f => f.date_emission < dateDebut)
        .reduce((sum, f) => sum + f.soldeRestant, 0),
    [clientFactures, dateDebut]
  );

  // Fetch paiements for in-range factures and avoirs for client
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch paiements for each in-range facture
        const newPaiementsMap: Record<string, PaiementGAS[]> = {};
        await Promise.all(
          inRangeFactures.map(async f => {
            try {
              const result = await window.electronAPI.getPaiementsGAS(f.id);
              if (!cancelled && Array.isArray(result)) {
                newPaiementsMap[f.id] = result;
              }
            } catch {
              newPaiementsMap[f.id] = [];
            }
          })
        );

        // Fetch avoirs for client filtered by date range
        let avoirsResult: AvoirGAS[] = [];
        try {
          avoirsResult = await window.electronAPI.getAvoirsForClient(client.id, {
            dateDebut,
            dateFin,
          });
          if (!Array.isArray(avoirsResult)) avoirsResult = [];
        } catch {
          avoirsResult = [];
        }

        if (!cancelled) {
          setPaiementsMap(newPaiementsMap);
          setAvoirs(avoirsResult);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [inRangeFactures, client.id, dateDebut, dateFin]);

  // Build statement lines and compute running balance
  const { lines, totalInvoiced, totalPaid, totalCredited, closingBalance } = useMemo(() => {
    const devise = client.devise_preferee || 'USD';
    const rawLines: Omit<StatementLine, 'balance'>[] = [];

    // Invoice lines
    for (const f of inRangeFactures) {
      rawLines.push({
        date: f.date_emission,
        reference: f.numero_facture,
        type: 'FACTURE',
        debit: f.montant_total_du_client,
        credit: 0,
      });
    }

    // Payment lines (only those within date range)
    for (const [, paiements] of Object.entries(paiementsMap)) {
      for (const p of paiements) {
        if (p.date_paiement >= dateDebut && p.date_paiement <= dateFin) {
          rawLines.push({
            date: p.date_paiement,
            reference: p.reference_paiement || `PAY-${p.id.slice(0, 8)}`,
            type: 'PAIEMENT',
            debit: 0,
            credit: p.montant_paye,
          });
        }
      }
    }

    // Avoir lines
    for (const a of avoirs) {
      rawLines.push({
        date: a.date_avoir,
        reference: a.numero_avoir,
        type: 'AVOIR',
        debit: 0,
        credit: a.montant_avoir,
      });
    }

    // Sort chronologically
    rawLines.sort((a, b) => a.date.localeCompare(b.date));

    // Compute running balance
    let balance = openingBalance;
    const lines: StatementLine[] = rawLines.map(l => {
      balance = balance + l.debit - l.credit;
      return { ...l, balance };
    });

    const totalInvoiced = inRangeFactures.reduce((s, f) => s + f.montant_total_du_client, 0);
    const totalPaid = Object.values(paiementsMap)
      .flat()
      .filter(p => p.date_paiement >= dateDebut && p.date_paiement <= dateFin)
      .reduce((s, p) => s + p.montant_paye, 0);
    const totalCredited = avoirs.reduce((s, a) => s + a.montant_avoir, 0);
    const closingBalance = openingBalance + totalInvoiced - totalPaid - totalCredited;

    return { lines, totalInvoiced, totalPaid, totalCredited, closingBalance, devise };
  }, [inRangeFactures, paiementsMap, avoirs, openingBalance, dateDebut, dateFin, client.devise_preferee]);

  const devise = client.devise_preferee || 'USD';

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const year = new Date().getFullYear();
    const date = new Date().toISOString().slice(0, 10);
    const L = 15, R = 195, W = R - L;
    let y = 18;

    // Header
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175);
    doc.text('GO AHEAD SARLU', L, y);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
    doc.text('Département de Sécurité et Gardiennage  |  RCCM: CD/GOM/RCCM/20-B-00414', L, y + 5);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
    doc.text('RELEVÉ DE COMPTE', R, y, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
    doc.text(`Période : ${formatDate(dateDebut)} — ${formatDate(dateFin)}`, R, y + 5, { align: 'right' });
    y += 10;
    doc.setDrawColor(30, 64, 175); doc.setLineWidth(0.5); doc.line(L, y, R, y); y += 6;

    // Client info
    doc.setTextColor(17, 24, 39); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(client.nom_entreprise, L, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    if (client.contact_nom) { doc.text(client.contact_nom, L, y); y += 4; }
    if (client.telephone) { doc.text(client.telephone, L, y); y += 4; }
    if (client.adresse_facturation) { doc.text(client.adresse_facturation, L, y); y += 4; }
    y += 4;

    // Table header
    doc.setFillColor(243, 244, 246); doc.rect(L, y - 3, W, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(75, 85, 99);
    doc.text('Date', L + 1, y); doc.text('Référence', L + 22, y); doc.text('Type', L + 65, y);
    doc.text('Débit', L + 105, y, { align: 'right' }); doc.text('Crédit', L + 135, y, { align: 'right' });
    doc.text('Solde', R, y, { align: 'right' });
    y += 5; doc.setDrawColor(209, 213, 219); doc.setLineWidth(0.3); doc.line(L, y - 1, R, y - 1);

    // Opening balance row
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(107, 114, 128);
    doc.setFillColor(249, 250, 251); doc.rect(L, y - 2, W, 5.5, 'F');
    doc.text(formatDate(dateDebut), L + 1, y + 1.5);
    doc.text("Solde d'ouverture", L + 22, y + 1.5);
    doc.setFont('helvetica', 'bold');
    doc.text(openingBalance.toFixed(2), R, y + 1.5, { align: 'right' });
    y += 6;

    // Transaction rows
    doc.setFont('helvetica', 'normal'); doc.setTextColor(17, 24, 39);
    for (let i = 0; i < lines.length; i++) {
      if (y > 260) {
        doc.addPage(); y = 18;
        doc.setFillColor(243, 244, 246); doc.rect(L, y - 3, W, 6, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(75, 85, 99);
        doc.text('Date', L + 1, y); doc.text('Référence', L + 22, y); doc.text('Type', L + 65, y);
        doc.text('Débit', L + 105, y, { align: 'right' }); doc.text('Crédit', L + 135, y, { align: 'right' });
        doc.text('Solde', R, y, { align: 'right' });
        y += 5; doc.setFont('helvetica', 'normal'); doc.setTextColor(17, 24, 39);
      }
      const line = lines[i];
      if (i % 2 === 1) { doc.setFillColor(249, 250, 251); doc.rect(L, y - 2, W, 5.5, 'F'); }
      doc.setFontSize(8);
      doc.text(formatDate(line.date), L + 1, y + 1.5);
      doc.text(line.reference.substring(0, 25), L + 22, y + 1.5);
      // Type badge text
      if (line.type === 'FACTURE') doc.setTextColor(29, 78, 216);
      else if (line.type === 'PAIEMENT') doc.setTextColor(21, 128, 61);
      else doc.setTextColor(133, 77, 14);
      doc.text(line.type, L + 65, y + 1.5);
      doc.setTextColor(17, 24, 39);
      if (line.debit > 0) doc.text(line.debit.toFixed(2), L + 105, y + 1.5, { align: 'right' });
      if (line.credit > 0) { doc.setTextColor(21, 128, 61); doc.text(line.credit.toFixed(2), L + 135, y + 1.5, { align: 'right' }); doc.setTextColor(17, 24, 39); }
      doc.setFont('helvetica', 'bold');
      doc.text(line.balance.toFixed(2), R, y + 1.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 6;
    }

    // Summary
    y += 4;
    if (y > 240) { doc.addPage(); y = 18; }
    doc.setDrawColor(30, 64, 175); doc.setLineWidth(0.5); doc.line(L, y, R, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Récapitulatif', L, y); y += 5;
    const summaryRows = [
      { label: "Solde d'ouverture", value: openingBalance, color: [17, 24, 39] as [number,number,number] },
      { label: 'Total facturé', value: totalInvoiced, color: [29, 78, 216] as [number,number,number] },
      { label: 'Total payé', value: -totalPaid, color: [21, 128, 61] as [number,number,number] },
      { label: 'Total crédité (avoirs)', value: -totalCredited, color: [133, 77, 14] as [number,number,number] },
    ];
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    for (const row of summaryRows) {
      doc.setTextColor(75, 85, 99); doc.text(row.label, L + 2, y);
      doc.setTextColor(...row.color); doc.setFont('helvetica', 'bold');
      doc.text(row.value.toFixed(2) + ' ' + devise, R, y, { align: 'right' });
      doc.setFont('helvetica', 'normal'); y += 5;
    }
    doc.setLineWidth(0.8); doc.setDrawColor(30, 64, 175); doc.line(L + 80, y - 1, R, y - 1);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 64, 175);
    doc.text('Solde de clôture', L + 2, y + 4);
    doc.text(closingBalance.toFixed(2) + ' ' + devise, R, y + 4, { align: 'right' });

    // Footer
    const footerY = 282;
    doc.setDrawColor(209, 213, 219); doc.setLineWidth(0.3); doc.line(L, footerY, R, footerY);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
    doc.text('70, Av Abattoir, Q Kyeshero, Goma - RDC  |  +243 974 821 064  |  gas@goahead.africa', 105, footerY + 4, { align: 'center' });
    doc.text('BANK OF AFRICA  |  Compte: 04530670005  |  Intitulé: GO AHEAD SARL', 105, footerY + 8, { align: 'center' });

    doc.save(`GAS ${year} - Relevé-Client_${client.nom_entreprise.replace(/\s+/g, '-')}_${date}.pdf`);
  };

  const handleExportExcel = () => {
    const rows = lines.map(l => ({
      Date: formatDate(l.date),
      Référence: l.reference,
      Type: l.type,
      Débit: l.debit || '',
      Crédit: l.credit || '',
      Solde: l.balance,
      Devise: devise,
    }));
    rows.push(
      { Date: '', Référence: '', Type: '', Débit: '', Crédit: '', Solde: '', Devise: '' },
      {
        Date: 'Solde d\'ouverture',
        Référence: '',
        Type: '',
        Débit: '',
        Crédit: '',
        Solde: openingBalance,
        Devise: devise,
      },
      {
        Date: 'Total facturé',
        Référence: '',
        Type: '',
        Débit: totalInvoiced,
        Crédit: '',
        Solde: '',
        Devise: devise,
      },
      {
        Date: 'Total payé',
        Référence: '',
        Type: '',
        Débit: '',
        Crédit: totalPaid,
        Solde: '',
        Devise: devise,
      },
      {
        Date: 'Total crédité (avoirs)',
        Référence: '',
        Type: '',
        Débit: '',
        Crédit: totalCredited,
        Solde: '',
        Devise: devise,
      },
      {
        Date: 'Solde de clôture',
        Référence: '',
        Type: '',
        Débit: '',
        Crédit: '',
        Solde: closingBalance,
        Devise: devise,
      }
    );
    exportToExcel(rows, `GAS ${new Date().getFullYear()} - Relevé-Client_${client.nom_entreprise.replace(/\s+/g, '-')}`, 'Relevé');
  };

  return (
    <>
      {/* Modal overlay (screen only) */}
      <div className={inline ? 'flex flex-col' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'}>
        <div className={inline ? 'flex flex-col' : 'bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col'}>
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 no-print">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Relevé de Compte</h2>
                <p className="text-sm text-gray-500">{client.nom_entreprise}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Exporter PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Exporter Excel
              </button>
              {!inline && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Date range picker */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 no-print">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Du :</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Au :</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={e => setDateFin(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {loading && (
                <span className="text-sm text-gray-400 italic">Chargement...</span>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <StatementContent
              client={client}
              dateDebut={dateDebut}
              dateFin={dateFin}
              lines={lines}
              openingBalance={openingBalance}
              totalInvoiced={totalInvoiced}
              totalPaid={totalPaid}
              totalCredited={totalCredited}
              closingBalance={closingBalance}
              devise={devise}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Screen statement content (reused inside modal) ──────────────────────────

interface StatementContentProps {
  client: ClientGAS;
  dateDebut: string;
  dateFin: string;
  lines: StatementLine[];
  openingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
  totalCredited: number;
  closingBalance: number;
  devise: string;
}

function StatementContent({
  client,
  dateDebut,
  dateFin,
  lines,
  openingBalance,
  totalInvoiced,
  totalPaid,
  totalCredited,
  closingBalance,
  devise,
}: StatementContentProps) {
  return (
    <div className="space-y-4">
      {/* Client info */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
        <div className="font-semibold text-gray-900">{client.nom_entreprise}</div>
        {client.contact_nom && <div className="text-gray-600">{client.contact_nom}</div>}
        {client.telephone && <div className="text-gray-600">{client.telephone}</div>}
        <div className="text-gray-500 mt-1 text-xs">
          Période : {formatDate(dateDebut)} — {formatDate(dateFin)}
        </div>
      </div>

      {/* Statement table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-2.5 text-left">Date</th>
              <th className="px-4 py-2.5 text-left">Référence</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-right">Débit</th>
              <th className="px-4 py-2.5 text-right">Crédit</th>
              <th className="px-4 py-2.5 text-right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {/* Opening balance row */}
            <tr className="border-t border-gray-200 bg-gray-50 italic text-gray-500">
              <td className="px-4 py-2">{formatDate(dateDebut)}</td>
              <td className="px-4 py-2" colSpan={2}>Solde d'ouverture</td>
              <td className="px-4 py-2" />
              <td className="px-4 py-2" />
              <td className="px-4 py-2 text-right font-semibold text-gray-700">
                {formatCurrency(openingBalance, devise)}
              </td>
            </tr>

            {lines.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                  Aucune transaction sur cette période
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => (
                <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-gray-700">{formatDate(line.date)}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-700">{line.reference}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      line.type === 'FACTURE'
                        ? 'bg-blue-100 text-blue-700'
                        : line.type === 'PAIEMENT'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {line.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    {line.debit > 0 ? formatCurrency(line.debit, devise) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    {line.credit > 0 ? formatCurrency(line.credit, devise) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {formatCurrency(line.balance, devise)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2.5 font-semibold text-gray-800 text-sm">Récapitulatif</div>
        <div className="divide-y divide-gray-100">
          {[
            { label: "Solde d'ouverture", value: openingBalance, color: 'text-gray-700' },
            { label: 'Total facturé', value: totalInvoiced, color: 'text-blue-700' },
            { label: 'Total payé', value: totalPaid, color: 'text-green-700', negative: true },
            { label: 'Total crédité (avoirs)', value: totalCredited, color: 'text-yellow-700', negative: true },
          ].map(({ label, value, color, negative }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-600">{label}</span>
              <span className={`font-semibold ${color}`}>
                {negative ? '− ' : ''}{formatCurrency(value, devise)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-50">
            <span className="font-bold text-blue-900 text-sm">Solde de clôture</span>
            <span className="font-bold text-blue-900 text-base">{formatCurrency(closingBalance, devise)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientStatement;
