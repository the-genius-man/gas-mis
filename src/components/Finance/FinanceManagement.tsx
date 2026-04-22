import { useState, useEffect } from 'react';
import { 
  Wallet, TrendingDown, TrendingUp, Plus, Search, Edit2, Trash2,
  DollarSign, Building2, Smartphone, ArrowDownCircle, ArrowUpCircle,
  RefreshCw, FileText, HandCoins, BookOpen
} from 'lucide-react';
import { 
  Depense, 
  CategorieDepense, 
  CompteTresorerie, 
  MouvementTresorerie,
  FinanceStats,
  Entree,
  FactureGAS
} from '../../types';
import DepenseForm from './DepenseForm';
import EntreeForm from './EntreeForm';
import TaxSettings from './TaxSettings';
import FinanceReports from './FinanceReports';
import DebtLoanManagement from './OhadaDebtLoanManagement';
import JournalComptable from './JournalComptable';
import GrandLivre from './GrandLivre';
import BilanOhada from './BilanOhada';
import PeriodClosing from './PeriodClosing';
import ComptabiliteModule from './ComptabiliteModule';

type TabType = 'dashboard' | 'entrees' | 'depenses' | 'debts';

export default function FinanceManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [entrees, setEntrees] = useState<Entree[]>([]);
  const [mouvements, setMouvements] = useState<MouvementTresorerie[]>([]);
  const [categories, setCategories] = useState<CategorieDepense[]>([]);
  const [comptes, setComptes] = useState<CompteTresorerie[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<FactureGAS[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [showEntreeForm, setShowEntreeForm] = useState(false);
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null);
  const [editingEntree, setEditingEntree] = useState<Entree | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [filterCompte, setFilterCompte] = useState('');
  const [filterSourceType, setFilterSourceType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const [statsData, categoriesData, comptesData, depensesData, mouvementsData, entreesData, facturesData] = await Promise.all([
        window.electronAPI.getFinanceStats(),
        window.electronAPI.getCategoriesDepenses(),
        window.electronAPI.getComptesTresorerie(),
        window.electronAPI.getDepenses(),
        window.electronAPI.getMouvementsTresorerie(),
        window.electronAPI.getEntrees ? window.electronAPI.getEntrees() : Promise.resolve([]),
        window.electronAPI.getFacturesGAS()
      ]);
      
      setStats(statsData);
      setCategories(categoriesData);
      setComptes(comptesData);
      setDepenses(depensesData);
      setMouvements(mouvementsData);
      setEntrees(entreesData);
      // Filter unpaid invoices
      setUnpaidInvoices(facturesData.filter((f: FactureGAS) => 
        f.statut_paiement !== 'PAYE_TOTAL' && f.statut_paiement !== 'ANNULE'
      ));
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDepense = async (depense: Depense) => {
    if (!window.electronAPI) return;
    
    try {
      if (editingDepense) {
        await window.electronAPI.updateDepense(depense);
      } else {
        await window.electronAPI.addDepense(depense);
      }
      setShowDepenseForm(false);
      setEditingDepense(null);
      loadData();
    } catch (error) {
      console.error('Error saving depense:', error);
      alert('Erreur lors de l\'enregistrement de la dépense');
    }
  };

  const handleDeleteDepense = async (id: string) => {
    if (!window.electronAPI) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;
    
    try {
      await window.electronAPI.deleteDepense(id);
      loadData();
    } catch (error) {
      console.error('Error deleting depense:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSaveEntree = async (entree: Entree) => {
    if (!window.electronAPI) return;
    
    try {
      if (editingEntree) {
        await window.electronAPI.updateEntree(entree);
      } else {
        await window.electronAPI.addEntree(entree);
      }
      setShowEntreeForm(false);
      setEditingEntree(null);
      loadData();
    } catch (error) {
      console.error('Error saving entree:', error);
      alert('Erreur lors de l\'enregistrement de l\'entrée');
    }
  };

  const handleDeleteEntree = async (id: string) => {
    if (!window.electronAPI) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;
    
    try {
      await window.electronAPI.deleteEntree(id);
      loadData();
    } catch (error) {
      console.error('Error deleting entree:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredDepenses = depenses.filter(d => {
    if (searchTerm && !d.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !d.beneficiaire?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategorie && d.categorie_id !== filterCategorie) return false;
    if (filterDateDebut && d.date_depense < filterDateDebut) return false;
    if (filterDateFin && d.date_depense > filterDateFin) return false;
    return true;
  });

  const filteredMouvements = mouvements.filter(m => {
    if (filterCompte && m.compte_tresorerie_id !== filterCompte) return false;
    if (filterDateDebut && m.date_mouvement < filterDateDebut) return false;
    if (filterDateFin && m.date_mouvement > filterDateFin) return false;
    return true;
  });

  const filteredEntrees = entrees.filter(e => {
    if (searchTerm && !e.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterSourceType && e.source_type !== filterSourceType) return false;
    if (filterDateDebut && e.date_entree < filterDateDebut) return false;
    if (filterDateFin && e.date_entree > filterDateFin) return false;
    return true;
  });

  const getSourceTypeBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'DEPOT':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Dépôt</span>;
      case 'PAIEMENT_CLIENT':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Paiement Client</span>;
      case 'AUTRE':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Autre</span>;
      default:
        return null;
    }
  };

  const getCompteIcon = (type: string) => {
    switch (type) {
      case 'CAISSE': return <Wallet className="w-5 h-5" />;
      case 'BANQUE': return <Building2 className="w-5 h-5" />;
      case 'MOBILE_MONEY': return <Smartphone className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'VALIDEE':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Validée</span>;
      case 'EN_ATTENTE':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">En attente</span>;
      case 'ANNULEE':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Annulée</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Tableau de bord', icon: Wallet },
            { id: 'entrees', label: 'Entrées', icon: TrendingUp },
            { id: 'depenses', label: 'Dépenses', icon: TrendingDown },
            { id: 'debts', label: 'Dettes & Prêts', icon: HandCoins },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6 p-6">
          {/* Header + Quick Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tableau de Bord Financier</h2>
              <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setEditingDepense(null); setShowDepenseForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm">
                <TrendingDown className="w-4 h-4" /> Nouvelle Dépense
              </button>
              <button onClick={() => { setEditingEntree(null); setShowEntreeForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm">
                <TrendingUp className="w-4 h-4" /> Nouveau Dépôt
              </button>
            </div>
          </div>

          {/* KPI Row */}
          {(() => {
            const now = new Date();
            const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const totalEntreesMois = entrees.filter(e => e.date_entree >= firstOfMonth).reduce((s, e) => s + e.montant, 0);
            const totalDepensesMois = stats.depensesMois;
            const totalSortiesMois = stats.totalSortiesMois || 0;
            const totalCreances = unpaidInvoices.reduce((s, f) => s + (f.montant_total_du_client || 0), 0);
            const totalTresorerie = comptes.reduce((s, c) => s + c.solde_actuel, 0);
            const netMois = totalEntreesMois - totalSortiesMois;
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><Wallet className="w-5 h-5 text-blue-600" /></div>
                    <span className="text-sm text-gray-500">Trésorerie totale</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalTresorerie.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</p>
                  <p className="text-xs text-gray-400 mt-1">{comptes.length} compte{comptes.length > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                    <span className="text-sm text-gray-500">Entrées ce mois</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">+{totalEntreesMois.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</p>
                  <p className="text-xs text-gray-400 mt-1">{entrees.filter(e => e.date_entree >= firstOfMonth).length} transaction{entrees.filter(e => e.date_entree >= firstOfMonth).length > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>
                    <span className="text-sm text-gray-500">Sorties ce mois</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">-{totalSortiesMois.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {totalDepensesMois > 0 ? `Dépenses: ${totalDepensesMois.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}` : ''}
                    {totalDepensesMois > 0 && (stats.paiementsSalairesMois || 0) > 0 ? ' · ' : ''}
                    {(stats.paiementsSalairesMois || 0) > 0 ? `Salaires: ${(stats.paiementsSalairesMois || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}` : ''}
                  </p>
                </div>
                <div className={`bg-white rounded-xl border p-5 ${totalCreances > 0 ? 'border-orange-200' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${totalCreances > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <FileText className={`w-5 h-5 ${totalCreances > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                    </div>
                    <span className="text-sm text-gray-500">Créances clients</span>
                  </div>
                  <p className={`text-2xl font-bold ${totalCreances > 0 ? 'text-orange-700' : 'text-gray-400'}`}>
                    {totalCreances.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{unpaidInvoices.length} facture{unpaidInvoices.length > 1 ? 's' : ''} impayée{unpaidInvoices.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            );
          })()}

          {/* Net result banner */}
          {(() => {
            const now = new Date();
            const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const totalEntreesMois = entrees.filter(e => e.date_entree >= firstOfMonth).reduce((s, e) => s + e.montant, 0);
            const totalSorties = stats.totalSortiesMois || 0;
            const net = totalEntreesMois - totalSorties;
            return (
              <div className={`rounded-xl px-6 py-4 flex items-center justify-between border ${net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                <span className={`font-semibold ${net >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  Résultat du mois : {net >= 0 ? '+' : ''}{net.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                </span>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            );
          })()}

          {/* Treasury accounts + Expense breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Treasury accounts */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Comptes de Trésorerie</h3>
              <div className="space-y-3">
                {comptes.map(compte => (
                  <div key={compte.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${compte.type_compte === 'CAISSE' ? 'bg-green-100 text-green-600' : compte.type_compte === 'BANQUE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {getCompteIcon(compte.type_compte)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{compte.nom_compte}</p>
                        <p className="text-xs text-gray-400">{compte.type_compte} · {compte.devise}</p>
                      </div>
                    </div>
                    <span className={`text-base font-bold ${compte.solde_actuel >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      {compte.solde_actuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                {comptes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun compte configuré</p>}
              </div>
            </div>

            {/* Expense by category */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dépenses par Catégorie (ce mois)</h3>
              <div className="space-y-3">
                {stats.depensesParCategorie.filter(c => c.total > 0).slice(0, 6).map((cat, idx) => {
                  const maxTotal = Math.max(...stats.depensesParCategorie.map(c => c.total));
                  const pct = maxTotal > 0 ? (cat.total / maxTotal) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{cat.nom_categorie}</span>
                        <span className="text-sm font-semibold text-gray-900">{cat.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {stats.depensesParCategorie.filter(c => c.total > 0).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Aucune dépense ce mois</p>
                )}
              </div>

              {/* Salary & charges outflows */}
              {((stats.paiementsSalairesMois || 0) > 0 || (stats.paiementsChargesMois || 0) > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Paiements Paie & Charges</h4>
                  <div className="space-y-2">
                    {(stats.paiementsSalairesMois || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Paiements salaires</span>
                        <span className="text-sm font-semibold text-purple-700">{(stats.paiementsSalairesMois || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</span>
                      </div>
                    )}
                    {(stats.paiementsChargesMois || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Charges sociales</span>
                        <span className="text-sm font-semibold text-orange-700">{(stats.paiementsChargesMois || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Transactions Récentes</h3>
              <span className="text-xs text-gray-400">10 dernières</span>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                ...entrees.slice(0, 5).map(e => ({ date: e.date_entree, label: e.description, montant: e.montant, type: 'entree' as const, devise: e.devise })),
                ...depenses.slice(0, 5).map(d => ({ date: d.date_depense, label: d.description, montant: d.montant, type: 'depense' as const, devise: d.devise })),
              ]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 10)
                .map((tx, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'entree' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.type === 'entree'
                          ? <TrendingUp className="w-4 h-4 text-green-600" />
                          : <TrendingDown className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tx.label}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'entree' ? 'text-green-700' : 'text-red-700'}`}>
                      {tx.type === 'entree' ? '+' : '-'}{tx.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {tx.devise}
                    </span>
                  </div>
                ))}
              {entrees.length === 0 && depenses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Aucune transaction enregistrée</p>
              )}
            </div>
          </div>

          {/* Unpaid invoices */}
          {unpaidInvoices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Factures Impayées</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{unpaidInvoices.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {unpaidInvoices.slice(0, 5).map(f => (
                  <div key={f.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{f.numero_facture}</p>
                      <p className="text-xs text-gray-400">{f.client_nom || 'Client'} · {f.date_echeance ? `Échéance: ${new Date(f.date_echeance).toLocaleDateString('fr-FR')}` : ''}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-700">
                      {f.montant_total_du_client.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {f.devise}
                    </span>
                  </div>
                ))}
                {unpaidInvoices.length > 5 && (
                  <p className="text-xs text-gray-400 text-center py-2">+{unpaidInvoices.length - 5} autres factures</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entrees Tab */}
      {activeTab === 'entrees' && (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select
                value={filterSourceType}
                onChange={(e) => setFilterSourceType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous types</option>
                <option value="DEPOT">Dépôt</option>
                <option value="PAIEMENT_CLIENT">Paiement Client</option>
                <option value="AUTRE">Autre</option>
              </select>
              <input
                type="date"
                value={filterDateDebut}
                onChange={(e) => setFilterDateDebut(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="date"
                value={filterDateFin}
                onChange={(e) => setFilterDateFin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={() => { setEditingEntree(null); setShowEntreeForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle entrée
            </button>
          </div>

          {/* Entrees Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntrees.map((entree) => (
                  <tr key={entree.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(entree.date_entree).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">{getSourceTypeBadge(entree.source_type)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {entree.description}
                      {entree.numero_facture && (
                        <span className="ml-2 text-xs text-gray-500">({entree.numero_facture})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entree.compte_tresorerie_nom}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                      +{entree.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {entree.devise}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditingEntree(entree); setShowEntreeForm(true); }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntree(entree.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEntrees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucune entrée trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Depenses Tab */}
      {activeTab === 'depenses' && (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterCategorie}
                onChange={(e) => setFilterCategorie(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes catégories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nom_categorie}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterDateDebut}
                onChange={(e) => setFilterDateDebut(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Date début"
              />
              <input
                type="date"
                value={filterDateFin}
                onChange={(e) => setFilterDateFin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Date fin"
              />
            </div>
            <button
              onClick={() => { setEditingDepense(null); setShowDepenseForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle dépense
            </button>
          </div>

          {/* Depenses Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénéficiaire</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDepenses.map((depense) => (
                  <tr key={depense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(depense.date_depense).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{depense.nom_categorie}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{depense.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{depense.beneficiaire || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                      -{depense.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {depense.devise}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatutBadge(depense.statut)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditingDepense(depense); setShowDepenseForm(true); }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepense(depense.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDepenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Aucune dépense trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Debts Tab */}
      {activeTab === 'debts' && <DebtLoanManagement />}

      {/* Depense Form Modal */}
      {showDepenseForm && (
        <DepenseForm
          depense={editingDepense}
          categories={categories}
          comptes={comptes}
          onSave={handleSaveDepense}
          onCancel={() => { setShowDepenseForm(false); setEditingDepense(null); }}
        />
      )}

      {/* Entree Form Modal */}
      {showEntreeForm && (
        <EntreeForm
          entree={editingEntree}
          comptes={comptes}
          unpaidInvoices={unpaidInvoices}
          onSave={handleSaveEntree}
          onCancel={() => { setShowEntreeForm(false); setEditingEntree(null); }}
        />
      )}
    </div>
  );
}
