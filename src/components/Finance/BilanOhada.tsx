import { useState, useEffect, useMemo } from 'react';
import { Scale, Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import jsPDF from 'jspdf';
import { BilanEntry } from '../../types';
import { drawPdfHeader, drawPdfFooter } from '../../utils/pdfCompanyHeader';

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// OHADA account classification
const ACTIF_CLASSES = ['2', '3', '4', '5']; // Immobilisations, Stocks, Tiers actif, Trésorerie
const PASSIF_CLASSES = ['1', '4', '6', '7']; // Capitaux, Tiers passif, Charges, Produits

const CLASS_LABELS: Record<string, string> = {
  '1': 'Ressources durables (Capitaux propres & Dettes LT)',
  '2': 'Actif immobilisé',
  '3': 'Actif circulant (Stocks)',
  '4': 'Tiers (Clients & Fournisseurs)',
  '5': 'Trésorerie',
  '6': 'Charges',
  '7': 'Produits',
};

interface AccountRow {
  compte_comptable: string;
  libelle: string;
  type_compte: string;
  total_debit: number;
  total_credit: number;
  solde: number; // debit - credit
}

export default function BilanOhada() {
  const [entries, setEntries] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFin, setDateFin] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const data = await window.electronAPI.getBilanOhada({ date_fin: dateFin });
      setEntries((data || []).map((e: any) => ({
        ...e,
        solde: (e.total_debit || 0) - (e.total_credit || 0),
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Group by first digit of account code
  const grouped = useMemo(() => {
    const map = new Map<string, AccountRow[]>();
    for (const e of entries) {
      const cls = e.compte_comptable.charAt(0);
      if (!map.has(cls)) map.set(cls, []);
      map.get(cls)!.push(e);
    }
    return map;
  }, [entries]);

  // Actif: accounts where solde > 0 for asset-type accounts
  const actifRows = useMemo(() => {
    const rows: AccountRow[] = [];
    for (const cls of ['2', '3', '4', '5']) {
      const accounts = grouped.get(cls) || [];
      for (const a of accounts) {
        if (a.type_compte === 'ACTIF' || (a.solde > 0 && ['4', '5'].includes(cls))) {
          rows.push(a);
        }
      }
    }
    return rows;
  }, [grouped]);

  // Passif: accounts where solde < 0 (credit balance) or class 1
  const passifRows = useMemo(() => {
    const rows: AccountRow[] = [];
    for (const cls of ['1', '4']) {
      const accounts = grouped.get(cls) || [];
      for (const a of accounts) {
        if (a.type_compte === 'PASSIF' || (a.solde < 0 && cls === '4')) {
          rows.push({ ...a, solde: Math.abs(a.solde) });
        }
      }
    }
    return rows;
  }, [grouped]);

  // Résultat: Produits (7) - Charges (6)
  const totalProduits = useMemo(() =>
    (grouped.get('7') || []).reduce((s, a) => s + Math.abs(a.solde), 0), [grouped]);
  const totalCharges = useMemo(() =>
    (grouped.get('6') || []).reduce((s, a) => s + Math.abs(a.solde), 0), [grouped]);
  const resultat = totalProduits - totalCharges;

  const totalActif = actifRows.reduce((s, a) => s + Math.abs(a.solde), 0);
  const totalPassif = passifRows.reduce((s, a) => s + a.solde, 0) + Math.max(0, resultat);

  const handleExportPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const year = new Date().getFullYear();
    const date = new Date().toISOString().slice(0, 10);
    const L = 15, R = 195;
    let y = await drawPdfHeader(doc, 'BILAN OHADA', `Au ${new Date(dateFin).toLocaleDateString('fr-FR')}`, L, R);

    const drawSection = (title: string, rows: AccountRow[], total: number, isActif: boolean) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFillColor(isActif ? 30 : 185, isActif ? 64 : 28, isActif ? 175 : 28);
      doc.rect(L, y - 3, R - L, 7, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
      doc.text(title, L + 2, y + 1);
      doc.text(fmt(total), R - 2, y + 1, { align: 'right' });
      y += 8; doc.setTextColor(17, 24, 39);

      doc.setFillColor(243, 244, 246); doc.rect(L, y - 3, R - L, 5.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(75, 85, 99);
      doc.text('Compte', L + 1, y); doc.text('Libellé', L + 20, y);
      doc.text('Débit', L + 120, y, { align: 'right' }); doc.text('Crédit', L + 150, y, { align: 'right' });
      doc.text('Solde net', R, y, { align: 'right' });
      y += 5; doc.setFont('helvetica', 'normal'); doc.setTextColor(17, 24, 39);

      for (let i = 0; i < rows.length; i++) {
        if (y > 270) { doc.addPage(); y = 20; }
        const r = rows[i];
        if (i % 2 === 1) { doc.setFillColor(249, 250, 251); doc.rect(L, y - 2.5, R - L, 5.5, 'F'); }
        doc.setFontSize(8);
        doc.text(r.compte_comptable, L + 1, y + 1);
        doc.text((r.libelle || '—').substring(0, 45), L + 20, y + 1);
        doc.text(fmt(r.total_debit), L + 120, y + 1, { align: 'right' });
        doc.text(fmt(r.total_credit), L + 150, y + 1, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(fmt(Math.abs(r.solde)), R, y + 1, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 5.5;
      }

      // Total row
      doc.setFillColor(isActif ? 239 : 254, isActif ? 246 : 242, isActif ? 255 : 242);
      doc.rect(L, y - 2, R - L, 6, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.setTextColor(isActif ? 30 : 185, isActif ? 64 : 28, isActif ? 175 : 28);
      doc.text(`Total ${title}`, L + 2, y + 2);
      doc.text(fmt(total), R, y + 2, { align: 'right' });
      doc.setTextColor(17, 24, 39);
      y += 10;
    };

    drawSection('ACTIF', actifRows, totalActif, true);
    drawSection('PASSIF', passifRows, totalPassif, false);

    // Résultat
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.setTextColor(resultat >= 0 ? 21 : 185, resultat >= 0 ? 128 : 28, resultat >= 0 ? 61 : 28);
    doc.text(`Résultat de l'exercice (Produits − Charges)`, L + 2, y);
    doc.text(`${resultat >= 0 ? '+' : ''}${fmt(resultat)}`, R, y, { align: 'right' });
    y += 8;

    drawPdfFooter(doc, 282, 105);
    doc.save(`GAS ${year} - Bilan-OHADA_${date}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Au :</label>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm font-medium ml-auto">
          <Download className="w-4 h-4" /> Exporter PDF
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Scale className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucune écriture validée</p>
          <p className="text-sm">Validez des écritures dans le Journal pour générer le bilan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACTIF */}
          <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
            <div className="bg-blue-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="font-bold text-white text-base">ACTIF</span>
              </div>
              <span className="font-bold text-white text-lg">{fmt(totalActif)}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="px-3 py-2 text-left w-16">Compte</th>
                  <th className="px-3 py-2 text-left">Libellé</th>
                  <th className="px-3 py-2 text-right">Solde net</th>
                </tr>
              </thead>
              <tbody>
                {actifRows.map((r, i) => (
                  <tr key={r.compte_comptable} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-3 py-2 font-mono text-xs text-blue-700 font-semibold">{r.compte_comptable}</td>
                    <td className="px-3 py-2 text-gray-800">{r.libelle || '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(Math.abs(r.solde))}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-blue-300 bg-blue-50 font-bold">
                  <td colSpan={2} className="px-3 py-2.5 text-blue-800">Total Actif</td>
                  <td className="px-3 py-2.5 text-right text-blue-800 text-base">{fmt(totalActif)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PASSIF */}
          <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
            <div className="bg-red-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-white" />
                <span className="font-bold text-white text-base">PASSIF</span>
              </div>
              <span className="font-bold text-white text-lg">{fmt(totalPassif)}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="px-3 py-2 text-left w-16">Compte</th>
                  <th className="px-3 py-2 text-left">Libellé</th>
                  <th className="px-3 py-2 text-right">Solde net</th>
                </tr>
              </thead>
              <tbody>
                {passifRows.map((r, i) => (
                  <tr key={r.compte_comptable} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-3 py-2 font-mono text-xs text-red-700 font-semibold">{r.compte_comptable}</td>
                    <td className="px-3 py-2 text-gray-800">{r.libelle || '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(r.solde)}</td>
                  </tr>
                ))}
                {/* Résultat */}
                <tr className="border-t border-gray-100">
                  <td className="px-3 py-2 font-mono text-xs text-gray-500 font-semibold">—</td>
                  <td className="px-3 py-2 text-gray-700 italic">Résultat de l'exercice</td>
                  <td className={`px-3 py-2 text-right font-semibold ${resultat >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {resultat >= 0 ? '+' : ''}{fmt(resultat)}
                  </td>
                </tr>
                <tr className="border-t-2 border-red-300 bg-red-50 font-bold">
                  <td colSpan={2} className="px-3 py-2.5 text-red-800">Total Passif</td>
                  <td className="px-3 py-2.5 text-right text-red-800 text-base">{fmt(totalPassif)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Balance check */}
      {entries.length > 0 && (
        <div className={`rounded-lg px-6 py-4 flex items-center justify-between border-2 ${
          Math.abs(totalActif - totalPassif) < 0.01
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <span className={`font-bold text-base ${Math.abs(totalActif - totalPassif) < 0.01 ? 'text-green-800' : 'text-red-800'}`}>
            {Math.abs(totalActif - totalPassif) < 0.01
              ? '✓ Bilan équilibré — Actif = Passif'
              : `⚠ Déséquilibre: ${fmt(Math.abs(totalActif - totalPassif))}`}
          </span>
          <div className="text-sm text-gray-600">
            Actif: <strong>{fmt(totalActif)}</strong> | Passif: <strong>{fmt(totalPassif)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
