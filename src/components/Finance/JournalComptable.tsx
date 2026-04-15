import { useState, useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle, ChevronDown, ChevronRight, Search, FileText, Download, Edit2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { EcritureComptable, LigneEcriture } from '../../types';
import jsPDF from 'jspdf';
import { drawPdfHeader } from '../../utils/pdfCompanyHeader';

type StatutFilter = 'ALL' | 'BROUILLON' | 'VALIDE' | 'CLOTURE';
type TypeFilter = 'ALL' | 'RECETTE' | 'DEPENSE' | 'PAIE' | 'PAIEMENT_SALAIRE' | 'PAIEMENT_CHARGES' | 'AUTRE';

const TYPE_LABELS: Record<string, string> = {
  RECETTE: 'Recette', DEPENSE: 'Dépense', PAIE: 'Paie',
  PAIEMENT_SALAIRE: 'Paiement Salaire', PAIEMENT_CHARGES: 'Charges Sociales',
  CREATION_DETTE: 'Création Dette', CREATION_PRET: 'Création Prêt',
  PAIEMENT_DETTE_PRET: 'Paiement Dette/Prêt', AUTRE: 'Autre',
};

const STATUT_COLORS: Record<string, string> = {
  BROUILLON: 'bg-yellow-100 text-yellow-800',
  VALIDE: 'bg-green-100 text-green-800',
  CLOTURE: 'bg-gray-100 text-gray-700',
};

function formatCurrency(amount: number, devise: string) {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
}
function formatDate(d: string) { return new Date(d).toLocaleDateString('fr-FR'); }

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditLine {
  compte_comptable: string;
  libelle_compte: string;
  sens: 'DEBIT' | 'CREDIT';
  montant: string;
  tiers_nom: string;
}

interface EditModalProps {
  ecriture: EcritureComptable;
  lignes: LigneEcriture[];
  planComptable: { code_compte: string; libelle: string }[];
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ ecriture, lignes, planComptable, onClose, onSaved }: EditModalProps) {
  const [libelle, setLibelle] = useState(ecriture.libelle);
  const [numeroPiece, setNumeroPiece] = useState(ecriture.numero_piece || '');
  const [dateEcriture, setDateEcriture] = useState(ecriture.date_ecriture);
  const [devise, setDevise] = useState(ecriture.devise);
  const [lines, setLines] = useState<EditLine[]>(
    lignes.map(l => ({
      compte_comptable: l.compte_comptable,
      libelle_compte: l.libelle_compte || l.compte_libelle_complet || '',
      sens: l.sens as 'DEBIT' | 'CREDIT',
      montant: l.montant.toString(),
      tiers_nom: l.tiers_nom || '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalDebit = lines.filter(l => l.sens === 'DEBIT').reduce((s, l) => s + (parseFloat(l.montant) || 0), 0);
  const totalCredit = lines.filter(l => l.sens === 'CREDIT').reduce((s, l) => s + (parseFloat(l.montant) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const updateLine = (idx: number, field: keyof EditLine, value: string) => {
    setLines(prev => {
      const updated = prev.map((l, i) => i === idx ? { ...l, [field]: value } : l);
      if (field === 'compte_comptable') {
        const found = planComptable.find(p => p.code_compte === value);
        if (found) return updated.map((l, i) => i === idx ? { ...l, libelle_compte: found.libelle } : l);
      }
      return updated;
    });
  };

  const addLine = () => setLines(prev => [...prev, { compte_comptable: '', libelle_compte: '', sens: 'DEBIT', montant: '', tiers_nom: '' }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setError('');
    if (!libelle.trim()) { setError('Le libellé est obligatoire'); return; }
    if (lines.some(l => !l.compte_comptable || !l.montant)) { setError('Tous les comptes et montants sont obligatoires'); return; }
    if (!balanced) { setError(`Écriture déséquilibrée: Débit ${totalDebit.toFixed(2)} ≠ Crédit ${totalCredit.toFixed(2)}`); return; }
    setSaving(true);
    try {
      const result = await window.electronAPI.updateEcritureComptable({
        ecriture: { id: ecriture.id, libelle, numero_piece: numeroPiece, date_ecriture: dateEcriture, devise },
        lignes: lines.map(l => ({
          compte_comptable: l.compte_comptable, libelle_compte: l.libelle_compte,
          sens: l.sens, montant: parseFloat(l.montant), tiers_nom: l.tiers_nom || null,
        })),
      });
      if (result?.error) { setError(result.error); return; }
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="bg-blue-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-white">Modifier l'écriture</h2>
            <p className="text-blue-200 text-xs mt-0.5">Brouillon uniquement — verrouillée après validation</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Libellé *</label>
              <input value={libelle} onChange={e => setLibelle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Pièce</label>
              <input value={numeroPiece} onChange={e => setNumeroPiece(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" value={dateEcriture} onChange={e => setDateEcriture(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Devise</label>
              <select value={devise} onChange={e => setDevise(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="USD">USD</option><option value="CDF">CDF</option>
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Lignes d'écriture</label>
              <button onClick={addLine} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-3 h-3" /> Ajouter une ligne
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="px-3 py-2 text-left w-28">Compte</th>
                    <th className="px-3 py-2 text-left">Libellé</th>
                    <th className="px-3 py-2 text-left w-24">Sens</th>
                    <th className="px-3 py-2 text-right w-28">Montant</th>
                    <th className="px-3 py-2 text-left">Tiers</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <input list={`comptes-${idx}`} value={l.compte_comptable}
                          onChange={e => updateLine(idx, 'compte_comptable', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-blue-500" />
                        <datalist id={`comptes-${idx}`}>
                          {planComptable.map(p => <option key={p.code_compte} value={p.code_compte}>{p.libelle}</option>)}
                        </datalist>
                      </td>
                      <td className="px-3 py-2">
                        <input value={l.libelle_compte} onChange={e => updateLine(idx, 'libelle_compte', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.sens} onChange={e => updateLine(idx, 'sens', e.target.value)}
                          className={`w-full border rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-blue-500 ${l.sens === 'DEBIT' ? 'border-green-300 text-green-700 bg-green-50' : 'border-red-300 text-red-700 bg-red-50'}`}>
                          <option value="DEBIT">DÉBIT</option>
                          <option value="CREDIT">CRÉDIT</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={l.montant} onChange={e => updateLine(idx, 'montant', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-right focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={l.tiers_nom} onChange={e => updateLine(idx, 'tiers_nom', e.target.value)}
                          placeholder="Optionnel"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        {lines.length > 2 && (
                          <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
                    <td colSpan={3} className="px-3 py-2 text-gray-600">Totaux</td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-green-700">{totalDebit.toFixed(2)}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-700">{totalCredit.toFixed(2)}</span>
                    </td>
                    <td colSpan={2} className="px-3 py-2">
                      {balanced
                        ? <span className="text-green-600 text-xs">✓ Équilibrée</span>
                        : <span className="text-red-600 text-xs">⚠ {Math.abs(totalDebit - totalCredit).toFixed(2)}</span>}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100">Annuler</button>
          <button onClick={handleSave} disabled={saving || !balanced}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function JournalComptable() {
  const [ecritures, setEcritures] = useState<EcritureComptable[]>([]);
  const [planComptable, setPlanComptable] = useState<{ code_compte: string; libelle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lignesMap, setLignesMap] = useState<Record<string, LigneEcriture[]>>({});
  const [loadingLignes, setLoadingLignes] = useState<string | null>(null);
  const [editingEcriture, setEditingEcriture] = useState<EcritureComptable | null>(null);

  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    loadEcritures();
    window.electronAPI?.getPlanComptable().then(d => setPlanComptable(d || []));
  }, []);

  const loadEcritures = async () => {
    if (!window.electronAPI) { setLoading(false); return; }
    setLoading(true);
    try { const data = await window.electronAPI.getEcrituresComptables({}); setEcritures(data || []); }
    finally { setLoading(false); }
  };

  const loadLignes = async (ecritureId: string) => {
    if (lignesMap[ecritureId]) return;
    setLoadingLignes(ecritureId);
    try { const data = await window.electronAPI.getLignesEcriture(ecritureId); setLignesMap(prev => ({ ...prev, [ecritureId]: data || [] })); }
    finally { setLoadingLignes(null); }
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

  const handleEdit = async (e: EcritureComptable, ev: React.MouseEvent) => {
    ev.stopPropagation();
    await loadLignes(e.id);
    setEditingEcriture(e);
  };

  const handleEditSaved = () => {
    setEditingEcriture(null);
    setLignesMap({}); // force reload of lines
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
    let y = await drawPdfHeader(doc, `Journal des Écritures Comptables — ${date}`, undefined, L, R);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setFillColor(243, 244, 246);
    doc.rect(L, y - 3, R - L, 6, 'F');
    doc.text('Date', L + 1, y); doc.text('N° Pièce', L + 22, y); doc.text('Libellé', L + 50, y);
    doc.text('Type', L + 140, y); doc.text('Montant', L + 175, y); doc.text('Devise', L + 205, y); doc.text('Statut', L + 225, y);
    y += 6; doc.setFont('helvetica', 'normal');
    for (const e of filtered) {
      if (y > 195) { doc.addPage(); y = 18; }
      doc.text(formatDate(e.date_ecriture), L + 1, y); doc.text(e.numero_piece || '—', L + 22, y);
      doc.text(e.libelle.substring(0, 55), L + 50, y); doc.text(TYPE_LABELS[e.type_operation] || e.type_operation, L + 140, y);
      doc.text(e.montant_total.toFixed(2), L + 175, y); doc.text(e.devise, L + 205, y); doc.text(e.statut, L + 225, y);
      y += 5;
    }
    doc.save(`GAS ${year} - Journal-Comptable_${date}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <div><p className="text-xs text-gray-500">Total écritures</p><p className="text-2xl font-bold text-gray-900">{ecritures.length}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-4 flex items-center gap-3">
          <FileText className="w-8 h-8 text-yellow-500" />
          <div><p className="text-xs text-gray-500">En brouillon</p><p className="text-2xl font-bold text-yellow-700">{totals.brouillon}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div><p className="text-xs text-gray-500">Validées</p><p className="text-2xl font-bold text-green-700">{totals.valide}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher libellé ou pièce..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value as StatutFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Tous statuts</option><option value="BROUILLON">Brouillon</option>
          <option value="VALIDE">Validé</option><option value="CLOTURE">Clôturé</option>
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
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Aucune écriture trouvée</p>
              </td></tr>
            ) : filtered.map((e, i) => (
              <>
                <tr key={e.id}
                  className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                  onClick={() => handleToggle(e.id)}>
                  <td className="px-3 py-3 text-gray-400">
                    {expandedId === e.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(e.date_ecriture)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.numero_piece || '—'}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{e.libelle}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[e.type_operation] || e.type_operation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(e.montant_total, e.devise)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[e.statut] || 'bg-gray-100 text-gray-700'}`}>
                      {e.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={ev => ev.stopPropagation()}>
                    {e.statut === 'BROUILLON' && (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={ev => handleEdit(e, ev)}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium">
                          <Edit2 className="w-3 h-3" /> Modifier
                        </button>
                        <button onClick={() => handleValidate(e.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Valider
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {expandedId === e.id && (
                  <tr key={`${e.id}-lines`} className="bg-blue-50/40">
                    <td colSpan={8} className="px-8 py-3">
                      {loadingLignes === e.id ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" /> Chargement...
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
                            {(lignesMap[e.id] || []).length > 0 && (() => {
                              const td = (lignesMap[e.id] || []).filter(l => l.sens === 'DEBIT').reduce((s, l) => s + l.montant, 0);
                              const tc = (lignesMap[e.id] || []).filter(l => l.sens === 'CREDIT').reduce((s, l) => s + l.montant, 0);
                              const ok = Math.abs(td - tc) < 0.01;
                              return (
                                <tr className="border-t-2 border-blue-200 font-semibold">
                                  <td colSpan={3} className="py-1 pr-4 text-xs text-gray-500">
                                    {ok ? <span className="text-green-600">✓ Équilibrée</span> : <span className="text-red-600">⚠ Déséquilibre: {Math.abs(td - tc).toFixed(2)}</span>}
                                  </td>
                                  <td className="py-1 pr-4 text-right text-green-700">{formatCurrency(td, e.devise)}</td>
                                  <td className="py-1 text-right text-red-700">{formatCurrency(tc, e.devise)}</td>
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

      {editingEcriture && (
        <EditModal
          ecriture={editingEcriture}
          lignes={lignesMap[editingEcriture.id] || []}
          planComptable={planComptable}
          onClose={() => setEditingEcriture(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
