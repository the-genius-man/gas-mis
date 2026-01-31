import { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp,
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  DollarSign,
  Building2,
  Smartphone,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  FileText
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

type TabType = 'dashboard' | 'entrees' | 'depenses' | 'mouvements' | 'taxes' | 'reports';

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
            { id: 'mouvements', label: 'Journal de Caisse', icon: RefreshCw },
            { id: 'taxes', label: 'Paramètres Fiscaux', icon: DollarSign },
            { id: 'reports', label: 'Rapports', icon: FileText },
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
        <div className="space-y-6">
          {/* Quick Actions - Moved to Top */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Tableau de Bord Financier</h2>
            <div className="flex items-center gap-3">
              {/* New Expense Button */}
              <button
                onClick={() => { 
                  setEditingDepense(null); 
                  setShowDepenseForm(true); 
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <TrendingDown className="w-4 h-4" />
                Nouvelle Dépense
              </button>

              {/* New Deposit Button */}
              <button
                onClick={() => { 
                  setEditingEntree(null); 
                  setShowEntreeForm(true); 
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <TrendingUp className="w-4 h-4" />
                Nouveau Dépôt
              </button>
            </div>
          </div>

          {/* Treasury Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comptes.map((compte) => (
              <div key={compte.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    compte.type_compte === 'CAISSE' ? 'bg-green-100 text-green-600' :
                    compte.type_compte === 'BANQUE' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {getCompteIcon(compte.type_compte)}
                  </div>
                  <span className="text-xs font-medium text-gray-500">{compte.devise}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">{compte.nom_compte}</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {compte.solde_actuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>

          {/* Monthly Expenses Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dépenses du mois (USD)</h3>
              <p className="text-3xl font-bold text-red-600">
                {stats.depensesMois.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dépenses par catégorie</h3>
              <div className="space-y-3">
                {stats.depensesParCategorie
                  .filter(c => c.total > 0)
                  .slice(0, 5)
                  .map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{cat.nom_categorie}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {cat.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                      </span>
                    </div>
                  ))}
                {stats.depensesParCategorie.filter(c => c.total > 0).length === 0 && (
                  <p className="text-sm text-gray-500">Aucune dépense ce mois</p>
                )}
              </div>
            </div>
          </div>
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

      {/* Taxes Tab */}
      {activeTab === 'taxes' && <TaxSettings />}

      {/* Reports Tab */}
      {activeTab === 'reports' && <FinanceReports />}

      {/* Mouvements Tab */}
      {activeTab === 'mouvements' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <select
              value={filterCompte}
              onChange={(e) => setFilterCompte(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les comptes</option>
              {comptes.map((compte) => (
                <option key={compte.id} value={compte.id}>{compte.nom_compte}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterDateDebut}
              onChange={(e) => setFilterDateDebut(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filterDateFin}
              onChange={(e) => setFilterDateFin(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mouvements Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde après</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMouvements.map((mouvement) => (
                  <tr key={mouvement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(mouvement.date_mouvement).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mouvement.nom_compte}</td>
                    <td className="px-4 py-3 text-center">
                      {mouvement.type_mouvement === 'ENTREE' ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <ArrowDownCircle className="w-4 h-4" /> Entrée
                        </span>
                      ) : mouvement.type_mouvement === 'SORTIE' ? (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <ArrowUpCircle className="w-4 h-4" /> Sortie
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <RefreshCw className="w-4 h-4" /> Transfert
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{mouvement.libelle}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      mouvement.type_mouvement === 'ENTREE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mouvement.type_mouvement === 'ENTREE' ? '+' : '-'}
                      {mouvement.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {mouvement.devise}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {mouvement.solde_apres.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {mouvement.devise}
                    </td>
                  </tr>
                ))}
                {filteredMouvements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucun mouvement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
