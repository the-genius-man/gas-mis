import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { GrandLivreEntry } from '../../types';
import jsPDF from 'jspdf';
import { drawPdfHeader, drawPdfFooter } from '../../utils/pdfCompanyHeader';

function formatCurrency(amount: number, devise: string) {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function GrandLivre() {
  const [entries, setEntries] = useState<GrandLivreEntry[]>([]);
  const [planComptable, setPlanComptable] = useState<{ code_compte: string; libelle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [compteFilter, setCompteFilter] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!window.electronAPI) { setLoading(false); return; }
      try {
        const [entriesData, planData] = await Promise.all([
          window.electronAPI.getGrandLivre({}),
          window.electronAPI.getPlanComptable(),
        ]);
        setEntries(entriesData || []);
        setPlanComptable(planData || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const reload = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const data = await window.electronAPI.getGrandLivre({
        compte_comptable: compteFilter || undefined,
        date_debut: dateDebut || undefined,
        date_fin: dateFin || undefined,
      });
      setEntries(data || []);
    } finally {
      setLoading(false);
    }
  };

  // Group entries by account
  const grouped = useMemo(() => {
    const filtered = entries.filter(e => {
      if (search) {
        const q = search.toLowerCase();
        if (!e.compte_comptable.includes(q) && !e.compte_libelle?.toLowerCase().includes(q) && !(e.tiers_nom || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const map = new Map<string, { libelle: string; type: string; entries: GrandLivreEntry[]; totalDebit: number; totalCredit: number; solde: number }>();
    for (const e of filtered) {
      if (!map.has(e.compte_comptable)) {
        map.set(e.compte_comptable, { libelle: e.compte_libelle || e.compte_comptable, type: e.type_compte || '', entries: [], totalDebit: 0, totalCredit: 0, solde: 0 });
      }
      const acc = map.get(e.compte_comptable)!;
      acc.entries.push(e);
      if (e.sens === 'DEBIT') acc.totalDebit += e.montant;
      else acc.totalCredit += e.montant;
    }
    // Compute solde
    for (const acc of map.values()) {
      acc.solde = acc.totalDebit - acc.totalCredit;
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [entries, search]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const year = new Date().getFullYear();
    const date = new Date().toISOString().slice(0, 10);
    const L = 10, R = 287;
    let y = await drawPdfHeader(doc, `Grand Livre — ${date}`, undefined, L, R);

    for (const [compte, acc] of grouped) {
      if (y > 185) { doc.addPage(); y = 18; }
      // Account header
      doc.setFillColor(30, 64, 175);
      doc.rect(L, y - 3, R - L, 7, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`${compte} — ${acc.libelle}`, L + 2, y + 1);
      doc.text(`Débit: ${acc.totalDebit.toFixed(2)}  Crédit: ${acc.totalCredit.toFixed(2)}  Solde: ${acc.solde.toFixed(2)}`, R - 2, y + 1, { align: 'right' });
      y += 8;
      doc.setTextColor(17, 24, 39);

      // Column headers
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.setFillColor(243, 244, 246);
      doc.rect(L, y - 3, R - L, 5.5, 'F');
      doc.text('Date', L + 1, y); doc.text('Libellé', L + 22, y);
      doc.text('Tiers', L + 120, y); doc.text('Débit', L + 195, y, { align: 'right' });
      doc.text('Crédit', L + 225, y, { align: 'right' });
      y += 5;

      doc.setFont('helvetica', 'normal');
      for (const e of acc.entries) {
        if (y > 195) { doc.addPage(); y = 18; }
        doc.text(formatDate(e.date_ecriture), L + 1, y);
        doc.text(e.ecriture_libelle.substring(0, 55), L + 22, y);
        doc.text((e.tiers_nom || '').substring(0, 30), L + 120, y);
        if (e.sens === 'DEBIT') { doc.setTextColor(21, 128, 61); doc.text(e.montant.toFixed(2), L + 195, y, { align: 'right' }); doc.setTextColor(17, 24, 39); }
        else { doc.setTextColor(185, 28, 28); doc.text(e.montant.toFixed(2), L + 225, y, { align: 'right' }); doc.setTextColor(17, 24, 39); }
        y += 5;
      }
      y += 4;
    }

    doc.save(`GAS ${year} - Grand-Livre_${date}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Compte ou tiers..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={compteFilter} onChange={e => setCompteFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]">
          <option value="">Tous les comptes</option>
          {planComptable.map(c => <option key={c.code_compte} value={c.code_compte}>{c.code_compte} — {c.libelle}</option>)}
        </select>
        <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
        <button onClick={reload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          Filtrer
        </button>
        <button onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm font-medium ml-auto">
          <Download className="w-4 h-4" /> Exporter PDF
        </button>
      </div>

      {/* Account sections */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucune écriture validée</p>
          <p className="text-sm">Validez des écritures dans le Journal pour les voir ici.</p>
        </div>
      ) : grouped.map(([compte, acc]) => (
        <div key={compte} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Account header */}
          <div className="bg-blue-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-white text-base">{compte}</span>
              <span className="text-blue-100 text-sm">{acc.libelle}</span>
              {acc.type && <span className="text-xs bg-blue-600 text-blue-100 px-2 py-0.5 rounded-full">{acc.type}</span>}
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1 text-green-300 font-semibold">
                <TrendingUp className="w-4 h-4" /> Débit: {acc.totalDebit.toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-red-300 font-semibold">
                <TrendingDown className="w-4 h-4" /> Crédit: {acc.totalCredit.toFixed(2)}
              </span>
              <span className={`font-bold text-base ${acc.solde >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                Solde: {acc.solde >= 0 ? '+' : ''}{acc.solde.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Entries table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">N° Pièce</th>
                <th className="px-4 py-2 text-left">Libellé</th>
                <th className="px-4 py-2 text-left">Tiers</th>
                <th className="px-4 py-2 text-right text-green-700">Débit</th>
                <th className="px-4 py-2 text-right text-red-700">Crédit</th>
              </tr>
            </thead>
            <tbody>
              {acc.entries.map((e, i) => (
                <tr key={i} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-4 py-2 text-gray-600">{formatDate(e.date_ecriture)}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{e.numero_piece || '—'}</td>
                  <td className="px-4 py-2 text-gray-800">{e.ecriture_libelle}</td>
                  <td className="px-4 py-2 text-gray-500">{e.tiers_nom || '—'}</td>
                  <td className="px-4 py-2 text-right font-semibold text-green-700">
                    {e.sens === 'DEBIT' ? formatCurrency(e.montant, e.devise) : ''}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-red-700">
                    {e.sens === 'CREDIT' ? formatCurrency(e.montant, e.devise) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
