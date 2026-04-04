import React, { useMemo, useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { FactureWithPayments, ClientGAS } from '../../types';
import { exportToExcel } from '../../utils/excelExport';

interface InvoiceAgingReportProps {
  factures: FactureWithPayments[];
  clients: ClientGAS[];
  onClose: () => void;
  /** When true, renders as a full-page section instead of a modal overlay */
  inline?: boolean;
}

export function getBucket(facture: FactureWithPayments): '0-30' | '31-60' | '61-90' | '90+' {
  if (!facture.date_echeance) return '0-30';
  const days = Math.floor((Date.now() - new Date(facture.date_echeance).getTime()) / 86400000);
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

const BUCKET_LABELS: Record<string, string> = {
  '0-30': '0–30 jours',
  '31-60': '31–60 jours',
  '61-90': '61–90 jours',
  '90+': '90+ jours',
};

const BUCKET_COLORS: Record<string, string> = {
  '0-30': 'bg-green-50 border-green-200',
  '31-60': 'bg-yellow-50 border-yellow-200',
  '61-90': 'bg-orange-50 border-orange-200',
  '90+': 'bg-red-50 border-red-200',
};

const BUCKET_HEADER_COLORS: Record<string, string> = {
  '0-30': 'bg-green-100 text-green-800',
  '31-60': 'bg-yellow-100 text-yellow-800',
  '61-90': 'bg-orange-100 text-orange-800',
  '90+': 'bg-red-100 text-red-800',
};

function formatCurrency(amount: number, devise: string): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

const InvoiceAgingReport: React.FC<InvoiceAgingReportProps> = ({ factures, clients, onClose, inline = false }) => {
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  const uniqueClients = useMemo(() => {
    const outstanding = factures.filter(f => f.soldeRestant > 0 && f.statut_paiement !== 'ANNULE');
    const seen = new Set<string>();
    const result: { id: string; nom: string }[] = [];
    for (const f of outstanding) {
      if (!seen.has(f.client_id)) {
        seen.add(f.client_id);
        result.push({
          id: f.client_id,
          nom: clients.find(c => c.id === f.client_id)?.nom_entreprise || f.client_nom || 'Client inconnu',
        });
      }
    }
    return result.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [factures, clients]);

  const buckets = useMemo(() => {
    const outstanding = factures.filter(
      f => f.soldeRestant > 0 && f.statut_paiement !== 'ANNULE' &&
        (clientFilter === 'ALL' || f.client_id === clientFilter)
    );
    const grouped: Record<string, FactureWithPayments[]> = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
    for (const f of outstanding) grouped[getBucket(f)].push(f);
    return grouped;
  }, [factures, clientFilter]);

  const grandTotal = useMemo(
    () => Object.values(buckets).reduce((sum, inv) => sum + inv.reduce((s, f) => s + f.soldeRestant, 0), 0),
    [buckets]
  );

  const getClientName = (f: FactureWithPayments) =>
    clients.find(c => c.id === f.client_id)?.nom_entreprise || f.client_nom || 'Client inconnu';

  const getDaysOverdue = (f: FactureWithPayments) =>
    Math.max(0, Math.floor((Date.now() - new Date(f.date_echeance || Date.now()).getTime()) / 86400000));

  const handleExportExcel = () => {
    const rows: Record<string, any>[] = [];
    for (const bucketKey of ['0-30', '31-60', '61-90', '90+'] as const) {
      const invoices = buckets[bucketKey];
      if (!invoices.length) continue;
      for (const f of invoices) {
        rows.push({
          Tranche: BUCKET_LABELS[bucketKey],
          Client: getClientName(f),
          'N° Facture': f.numero_facture,
          "Date d'émission": formatDate(f.date_emission),
          'Montant total': f.montant_total_du_client,
          'Montant payé': f.totalPaye,
          'Solde restant': f.soldeRestant,
          'Jours de retard': getDaysOverdue(f),
          Devise: f.devise,
        });
      }
      rows.push({
        Tranche: `TOTAL ${BUCKET_LABELS[bucketKey]}`,
        Client: `${invoices.length} facture(s)`,
        'N° Facture': '', "Date d'émission": '', 'Montant total': '', 'Montant payé': '',
        'Solde restant': invoices.reduce((s, f) => s + f.soldeRestant, 0),
        'Jours de retard': '', Devise: '',
      });
    }
    rows.push({ Tranche: 'GRAND TOTAL', Client: '', 'N° Facture': '', "Date d'émission": '',
      'Montant total': '', 'Montant payé': '', 'Solde restant': grandTotal, 'Jours de retard': '', Devise: '' });
    exportToExcel(rows, 'Rapport_Anciennete', 'Ancienneté');
  };

  const totalInvoiceCount = Object.values(buckets).reduce((s, arr) => s + arr.length, 0);

  const headerBar = (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rapport d'Ancienneté des Créances</h2>
          <p className="text-sm text-gray-500">{totalInvoiceCount} facture(s) en attente</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          Exporter Excel
        </button>
        {!inline && (
          <button onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  const filterBar = (
    <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Filtrer par client :</label>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Tous les clients</option>
          {uniqueClients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>
    </div>
  );

  const body = (
    <div className="space-y-4 px-6 py-4">
      {totalInvoiceCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">Aucune créance en attente</p>
          <p className="text-sm">Toutes les factures sont réglées ou annulées.</p>
        </div>
      ) : (
        <>
          {(['0-30', '31-60', '61-90', '90+'] as const).map(bucketKey => {
            const invoices = buckets[bucketKey];
            const bucketTotal = invoices.reduce((s, f) => s + f.soldeRestant, 0);
            return (
              <div key={bucketKey} className={`border rounded-lg overflow-hidden ${BUCKET_COLORS[bucketKey]}`}>
                <div className={`flex items-center justify-between px-4 py-2.5 ${BUCKET_HEADER_COLORS[bucketKey]}`}>
                  <span className="font-semibold text-sm">{BUCKET_LABELS[bucketKey]} — {invoices.length} facture(s)</span>
                  {invoices.length > 0 && (
                    <span className="font-bold text-sm">Total : {formatCurrency(bucketTotal, invoices[0]?.devise || 'USD')}</span>
                  )}
                </div>
                {invoices.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 italic">Aucune facture dans cette tranche.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white bg-opacity-60 text-gray-600 text-xs uppercase tracking-wide">
                          <th className="px-4 py-2 text-left">Client</th>
                          <th className="px-4 py-2 text-left">N° Facture</th>
                          <th className="px-4 py-2 text-left">Date émission</th>
                          <th className="px-4 py-2 text-right">Montant total</th>
                          <th className="px-4 py-2 text-right">Montant payé</th>
                          <th className="px-4 py-2 text-right">Solde restant</th>
                          <th className="px-4 py-2 text-right">Jours retard</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(f => (
                          <tr key={f.id} className="border-t border-white border-opacity-60 hover:bg-white hover:bg-opacity-40 transition-colors">
                            <td className="px-4 py-2 font-medium text-gray-800">{getClientName(f)}</td>
                            <td className="px-4 py-2 text-gray-700 font-mono text-xs">{f.numero_facture}</td>
                            <td className="px-4 py-2 text-gray-600">{formatDate(f.date_emission)}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(f.montant_total_du_client, f.devise)}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(f.totalPaye, f.devise)}</td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(f.soldeRestant, f.devise)}</td>
                            <td className="px-4 py-2 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                getDaysOverdue(f) === 0 ? 'bg-gray-100 text-gray-600' :
                                getDaysOverdue(f) <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{getDaysOverdue(f)} j</span>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-white bg-white bg-opacity-50 font-semibold">
                          <td colSpan={4} className="px-4 py-2 text-gray-700">
                            Sous-total {BUCKET_LABELS[bucketKey]} ({invoices.length} facture{invoices.length > 1 ? 's' : ''})
                          </td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(bucketTotal, invoices[0]?.devise || 'USD')}</td>
                          <td className="px-4 py-2" />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          <div className="border-2 border-blue-300 rounded-lg bg-blue-50 px-6 py-3 flex items-center justify-between">
            <span className="font-bold text-blue-900 text-base">
              TOTAL GÉNÉRAL — {totalInvoiceCount} facture{totalInvoiceCount > 1 ? 's' : ''}
            </span>
            <span className="font-bold text-blue-900 text-lg">
              {formatCurrency(grandTotal, factures.find(f => f.soldeRestant > 0)?.devise || 'USD')}
            </span>
          </div>
        </>
      )}
    </div>
  );

  if (inline) {
    return (
      <div className="flex flex-col">
        {headerBar}
        {filterBar}
        {body}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {headerBar}
        {filterBar}
        <div className="flex-1 overflow-y-auto">{body}</div>
      </div>
    </div>
  );
};

export default InvoiceAgingReport;
