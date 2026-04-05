import { useState, useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle, ChevronDown, ChevronRight, Filter, Search, FileText, Download } from 'lucide-react';
import { EcritureComptable, LigneEcriture } from '../../types';
import jsPDF from 'jspdf';

type StatutFilter = 'ALL' | 'BROUILLON' | 'VALIDE' | 'CLOTURE';
type TypeFilter = 'ALL' | 'RECETTE' | 'DEPENSE' | 'PAIE' | 'PAIEMENT_SALAIRE' | 'PAIEMENT_CHARGES' | 'AUTRE';

const TYPE_LABELS: Record<string, string> = {
  RECETTE: 'Recette',
  DEPENSE: 'Dépense',
  PAIE: 'Paie',
  PAIEMENT_SALAIRE: 'Paiement Salaire',
  PAIEMENT_CHARGES: 'Charges Sociales',
  CREATION_DETTE: 'Création Dette',
  CREATION_PRET: 'Création Prêt',
  PAIEMENT_DETTE_PRET: 'Paiement Dette/Prêt',
  AUTRE: 'Autre',
};

const STATUT_COLORS: Record<string, string> = {
  BROUILLON: 'bg-yellow-100 text-yellow-800',
  VALIDE: 'bg-green-100 text-green-800',
  CLOTURE: 'bg-gray-100 text-gray-700',
};

function formatCurrency(amount: number, devise: string) {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function JournalComptable() {
  const [ecritures, setEcritures] = useState<EcritureComptable[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lignesMap, setLignesMap] = useState<Record<string, LigneEcriture[]>>({});
  const [loadingLignes, setLoadingLignes] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => { loadEcritures(); }, []);

  const loadEcritures = async () => {
    if (!window.electronAPI) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await window.electronAPI.getEcrituresComptables({});
      setEcritures(data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadLignes = async (ecritureId: string) => {
    if (lignesMap[ecritureId]) return;
    setLoadingLignes(ecritureId);
    try {
      const data = await window.electronAPI.getLignesEcriture(ecritureId);
      setLignesMap(prev => ({ ...prev, [ecritureId]: data || [] }));
    } finally {
      setLoadingLignes(null);
    }
  };

  const handleToggle = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await loadLignes(id);
  };

  const handleValidate = async (id: string) => {
    if (!confirm('Valider cette écriture ? Elle ne pourra plus être modifiée.')) return;
    await window.electronAPI.validerEcriture({ ecritureId: id, valide_par: 'Finance' });
    loadEcritures();
  };

  const filtered = useMemo(() => ecritures.filter(e => {
    if (statutFilter !== 'ALL' && e.statut !== statutFilter) return false;
    if (typeFilter !== 'ALL' && e.type_operation !== typeFilter) return false;
    if (dateDebut && e.date_ecriture < dateDebut) return false;
    if (dateFin && e.date_ecriture > dateFin) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.libelle.toLowerCase().includes(q) && !(e.numero_piece || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [ecritures, statutFilter, typeFilter, dateDebut, dateFin, search]);

  const totals = useMemo(() => ({
    brouillon: ecritures.filter(e => e.statut === 'BROUILLON').length,
    valide: ecritures.filter(e => e.statut === 'VALIDE').length,
  }), [ecritures]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const year = new Date().getFullYear();
    const date = new Date().toISOString().slice(0, 10);
    const L = 10, R = 287;
    let y = 18;

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('GO AHEAD SARLU', L, y);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(`Journal des Écritures Comptables — ${date}`, R, y, { align: 'right' });
    y += 6;
    doc.setDrawColor(30, 64, 175); doc.setLineWidth(0.5);
    doc.line(L, y, R, y); y += 6;

    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.setFillColor(243, 244, 246);
    doc.rect(L, y - 3, R - L, 6, 'F');
    doc.text('Date', L + 1, y);
    doc.text('N° Pièce', L + 22, y);
    doc.text('Libellé', L + 50, y);
    doc.text('Type', L + 140, y);
    doc.text('Montant', L + 175, y);
    doc.text('Devise', L + 205, y);
    doc.text('Statut', L + 225, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    for (const e of filtered) {
      if (y > 195) { doc.addPage(); y = 18; }
      doc.text(formatDate(e.date_ecriture), L + 1, y);
      doc.text(e.numero_piece || '—', L + 22, y);
      doc.text(e.libelle.substring(0, 55), L + 50, y);
      doc.text(TYPE_LABELS[e.type_operation] || e.type_operation, L + 140, y);
      doc.text(e.montant_total.toFixed(2), L + 175, y);
      doc.text(e.devise, L + 205, y);
      doc.text(e.statut, L + 225, y);
      y += 5;
    }

    doc.save(`GAS ${year} - Journal-Comptable_${date}.pdf`);
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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Total écritures</p>
            <p className="text-2xl font-bold text-gray-900">{ecritures.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-4 flex items-center gap-3">
          <FileText className="w-8 h-8 text-yellow-500" />
          <div>
            <p className="text-xs text-gray-500">En brouillon</p>
            <p className="text-2xl font-bold text-yellow-700">{totals.brouillon}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-xs text-gray-500">Validées</p>
            <p className="text-2xl font-bold text-green-700">{totals.valide}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Rechercher libellé ou pièce..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value as StatutFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Tous statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="VALIDE">Validé</option>
          <option value="CLOTURE">Clôturé</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Tous types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium ml-auto">
          <Download className="w-4 h-4" /> Exporter PDF
        </button>
      </div>

      {/* Journal table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide border-b border-gray-200">
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">N° Pièce</th>
              <th className="px-4 py-3 text-left">Libellé</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Aucune écriture trouvée</p>
                </td>
              </tr>
            ) : filtered.map((e, i) => (
              <>
                <tr key={e.id}
                  className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                  onClick={() => handleToggle(e.id)}>
                  <td className="px-3 py-3 text-gray-400">
                    {expandedId === e.id
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(e.date_ecriture)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.numero_piece || '—'}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{e.libelle}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[e.type_operation] || e.type_operation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(e.montant_total, e.devise)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[e.statut] || 'bg-gray-100 text-gray-700'}`}>
                      {e.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={ev => ev.stopPropagation()}>
                    {e.statut === 'BROUILLON' && (
                      <button onClick={() => handleValidate(e.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium mx-auto">
                        <CheckCircle className="w-3 h-3" /> Valider
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === e.id && (
                  <tr key={`${e.id}-lines`} className="bg-blue-50/40">
                    <td colSpan={8} className="px-8 py-3">
                      {loadingLignes === e.id ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          Chargement des lignes...
                        </div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500 uppercase tracking-wide">
                              <th className="text-left py-1 pr-4">Compte</th>
                              <th className="text-left py-1 pr-4">Libellé</th>
                              <th className="text-left py-1 pr-4">Tiers</th>
                              <th className="text-right py-1 pr-4 text-green-700">Débit</th>
                              <th className="text-right py-1 text-red-700">Crédit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(lignesMap[e.id] || []).map(l => (
                              <tr key={l.id} className="border-t border-blue-100">
                                <td className="py-1 pr-4 font-mono font-semibold text-blue-800">{l.compte_comptable}</td>
                                <td className="py-1 pr-4 text-gray-700">{l.compte_libelle_complet || l.libelle_compte || '—'}</td>
                                <td className="py-1 pr-4 text-gray-500">{l.tiers_nom || '—'}</td>
                                <td className="py-1 pr-4 text-right font-semibold text-green-700">
                                  {l.sens === 'DEBIT' ? formatCurrency(l.montant, l.devise) : ''}
                                </td>
                                <td className="py-1 text-right font-semibold text-red-700">
                                  {l.sens === 'CREDIT' ? formatCurrency(l.montant, l.devise) : ''}
                                </td>
                              </tr>
                            ))}
                            {/* Balance check row */}
                            {(lignesMap[e.id] || []).length > 0 && (() => {
                              const totalDebit = (lignesMap[e.id] || []).filter(l => l.sens === 'DEBIT').reduce((s, l) => s + l.montant, 0);
                              const totalCredit = (lignesMap[e.id] || []).filter(l => l.sens === 'CREDIT').reduce((s, l) => s + l.montant, 0);
                              const balanced = Math.abs(totalDebit - totalCredit) < 0.01;
                              return (
                                <tr className="border-t-2 border-blue-200 font-semibold">
                                  <td colSpan={3} className="py-1 pr-4 text-xs text-gray-500">
                                    {balanced
                                      ? <span className="text-green-600">✓ Écriture équilibrée</span>
                                      : <span className="text-red-600">⚠ Déséquilibre: {Math.abs(totalDebit - totalCredit).toFixed(2)}</span>}
                                  </td>
                                  <td className="py-1 pr-4 text-right text-green-700">{formatCurrency(totalDebit, e.devise)}</td>
                                  <td className="py-1 text-right text-red-700">{formatCurrency(totalCredit, e.devise)}</td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
