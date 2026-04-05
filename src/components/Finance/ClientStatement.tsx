import React, { useEffect, useMemo, useState } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
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
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .client-statement-print { display: block !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      {/* Modal overlay (screen only) */}
      <div className={inline ? 'flex flex-col' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print'}>
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
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Imprimer
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

      {/* Print-only full-page statement */}
      <div className="client-statement-print" style={{ display: 'none' }}>
        <div style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontFamily: 'Arial, sans-serif', fontSize: '10pt', margin: '0 auto', boxSizing: 'border-box' }}>
          {/* Company header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ width: '52mm' }}>
              <img src="/logo-goahead.png" alt="Go Ahead" style={{ height: '60px', width: 'auto', display: 'block' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '10pt' }}>
              <div style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '4px' }}>GO AHEAD SARLU</div>
              <div style={{ fontWeight: '600' }}>Département de Sécurité et Gardiennage</div>
              <div style={{ fontSize: '8pt', marginTop: '4px' }}>RCCM: CD/GOM/RCCM/20-B-00414</div>
              <div style={{ fontSize: '8pt' }}>ID NAT.: 19-H5300-N897290 &nbsp;|&nbsp; IMPOT: A2155845A</div>
            </div>
          </div>

          {/* Document title */}
          <div style={{ textAlign: 'center', marginBottom: '16px', borderTop: '2px solid black', borderBottom: '2px solid black', padding: '8px 0' }}>
            <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>RELEVÉ DE COMPTE</div>
            <div style={{ fontSize: '9pt', marginTop: '4px' }}>
              Période : {formatDate(dateDebut)} — {formatDate(dateFin)}
            </div>
          </div>

          {/* Client info */}
          <div style={{ marginBottom: '16px', fontSize: '10pt' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Client :</div>
            <div style={{ fontWeight: 'bold' }}>{client.nom_entreprise}</div>
            {client.contact_nom && <div>{client.contact_nom}</div>}
            {client.telephone && <div>{client.telephone}</div>}
            {client.adresse_facturation && <div>{client.adresse_facturation}</div>}
          </div>

          {/* Statement table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '16px' }}>
            <thead>
              <tr style={{ borderTop: '2px solid black', borderBottom: '1px solid black', backgroundColor: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '6px 4px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '6px 4px' }}>Référence</th>
                <th style={{ textAlign: 'left', padding: '6px 4px' }}>Type</th>
                <th style={{ textAlign: 'right', padding: '6px 4px' }}>Débit</th>
                <th style={{ textAlign: 'right', padding: '6px 4px' }}>Crédit</th>
                <th style={{ textAlign: 'right', padding: '6px 4px' }}>Solde</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance row */}
              <tr style={{ borderBottom: '1px solid #e5e7eb', fontStyle: 'italic', backgroundColor: '#f9fafb' }}>
                <td style={{ padding: '5px 4px' }}>{formatDate(dateDebut)}</td>
                <td style={{ padding: '5px 4px' }} colSpan={2}>Solde d'ouverture</td>
                <td style={{ padding: '5px 4px', textAlign: 'right' }}></td>
                <td style={{ padding: '5px 4px', textAlign: 'right' }}></td>
                <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(openingBalance, devise)}
                </td>
              </tr>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '12px 4px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                    Aucune transaction sur cette période
                  </td>
                </tr>
              ) : (
                lines.map((line, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '5px 4px' }}>{formatDate(line.date)}</td>
                    <td style={{ padding: '5px 4px', fontFamily: 'monospace', fontSize: '8pt' }}>{line.reference}</td>
                    <td style={{ padding: '5px 4px' }}>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '8pt',
                        fontWeight: '600',
                        backgroundColor: line.type === 'FACTURE' ? '#dbeafe' : line.type === 'PAIEMENT' ? '#dcfce7' : '#fef9c3',
                        color: line.type === 'FACTURE' ? '#1d4ed8' : line.type === 'PAIEMENT' ? '#15803d' : '#854d0e',
                      }}>
                        {line.type}
                      </span>
                    </td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                      {line.debit > 0 ? formatCurrency(line.debit, devise) : ''}
                    </td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                      {line.credit > 0 ? formatCurrency(line.credit, devise) : ''}
                    </td>
                    <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(line.balance, devise)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Summary section */}
          <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '12px', marginBottom: '24px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '10pt' }}>Récapitulatif</div>
            {[
              { label: 'Solde d\'ouverture', value: openingBalance },
              { label: 'Total facturé', value: totalInvoiced },
              { label: 'Total payé', value: -totalPaid },
              { label: 'Total crédité (avoirs)', value: -totalCredited },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '9pt' }}>
                <span>{label}</span>
                <span style={{ fontWeight: '600' }}>{formatCurrency(value, devise)}</span>
              </div>
            ))}
            <div style={{ borderTop: '2px solid black', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt' }}>
              <span>Solde de clôture</span>
              <span>{formatCurrency(closingBalance, devise)}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '2px solid black', paddingTop: '10px', textAlign: 'center', fontSize: '8pt', marginTop: 'auto' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              Adresse: 70, Av Abattoir, Q Kyeshero, En Diagonal de la Cathédrale, Goma - RDC
            </div>
            <div style={{ marginBottom: '4px' }}>
              +243 974 821 064; +243 855 307 832 | gas@goahead.africa | www.goahead.africa
            </div>
            <div style={{ fontWeight: '600' }}>
              BANK OF AFRICA; Compte: 04530670005; Intitulé: GO AHEAD SARL
            </div>
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
