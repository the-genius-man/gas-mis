import React, { useState, useEffect } from 'react';
import { 
  HandCoins, 
  TrendingDown, 
  TrendingUp,
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Building2,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Download,
  FileText,
  Eye,
  BookOpen,
  Calculator
} from 'lucide-react';
import OhadaDebtLoanForm from './OhadaDebtLoanForm';
import OhadaDebtLoanPaymentForm from './OhadaDebtLoanPaymentForm';

interface OhadaDebtLoan {
  id: string;
  type: 'DETTE' | 'PRET';
  reference_number: string;
  compte_comptable_principal: string;
  compte_comptable_interet?: string;
  sous_compte?: string;
  tiers_nom: string;
  tiers_type: 'PERSONNE' | 'ENTREPRISE' | 'BANQUE' | 'EMPLOYE' | 'ETAT' | 'COLLECTIVITE';
  tiers_numero_compte?: string;
  contact_info?: string;
  montant_principal: number;
  solde_actuel: number;
  taux_interet?: number;
  type_interet?: 'SIMPLE' | 'COMPOSE' | 'FIXE';
  date_debut: string;
  date_echeance?: string;
  statut: 'ACTIF' | 'REMBOURSE' | 'EN_RETARD' | 'PROVISIONNE' | 'ANNULE';
  frequence_paiement?: 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL' | 'UNIQUE';
  nature_garantie?: string;
  valeur_garantie?: number;
  provision_constituee: number;
  objet: string;
  conditions_particulieres?: string;
  pieces_justificatives?: string;
  devise: string;
  cree_par: string;
  cree_le: string;
  modifie_le: string;
  compte_libelle?: string;
}

interface OhadaDebtLoanPayment {
  id: string;
  dette_pret_id: string;
  date_paiement: string;
  montant_paye: number;
  montant_principal: number;
  montant_interet: number;
  mode_paiement: 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY' | 'COMPENSATION';
  reference_paiement: string;
  numero_piece?: string;
  ecriture_comptable_id?: string;
  compte_tresorerie_id?: string;
  penalites: number;
  frais_bancaires: number;
  notes?: string;
  devise: string;
  cree_par: string;
  cree_le: string;
  ecriture_numero?: string;
}

interface OhadaDebtLoanStats {
  debts: {
    total: number;
    active: number;
    total_balance: number;
    overdue: number;
    overdue_balance: number;
  };
  loans: {
    total: number;
    active: number;
    total_balance: number;
    overdue: number;
    overdue_balance: number;
  };
}

type TabType = 'dashboard' | 'debts' | 'loans' | 'payments' | 'reports';

export default function OhadaDebtLoanManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [debtsLoans, setDebtsLoans] = useState<OhadaDebtLoan[]>([]);
  const [payments, setPayments] = useState<OhadaDebtLoanPayment[]>([]);
  const [stats, setStats] = useState<OhadaDebtLoanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingItem, setEditingItem] = useState<OhadaDebtLoan | null>(null);
  const [selectedDebtLoan, setSelectedDebtLoan] = useState<OhadaDebtLoan | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DETTE' | 'PRET'>('ALL');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTiersType, setFilterTiersType] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      // Load debts and loans
      const filters = {
        type: filterType !== 'ALL' ? filterType : undefined,
        statut: filterStatus || undefined,
        tiers_type: filterTiersType || undefined,
        date_debut: filterDateStart || undefined,
        date_fin: filterDateEnd || undefined,
        search: searchTerm || undefined
      };
      
      const [debtsLoansData, statsData] = await Promise.all([
        window.electronAPI.getDettesPretsOhada(filters),
        window.electronAPI.getOhadaDettePretSummary()
      ]);
      
      setDebtsLoans(debtsLoansData || []);
      setStats(statsData);
      
      // Load payments for current tab
      if (activeTab === 'payments') {
        const allPayments = [];
        for (const debtLoan of debtsLoansData || []) {
          const debtLoanPayments = await window.electronAPI.getPaiementsDettePretOhada(debtLoan.id);
          allPayments.push(...debtLoanPayments);
        }
        setPayments(allPayments);
      }
    } catch (error) {
      console.error('Error loading OHADA debt/loan data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, filterStatus, filterTiersType, filterDateStart, filterDateEnd, searchTerm, activeTab]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      'ACTIF': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'REMBOURSE': { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle },
      'EN_RETARD': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
      'PROVISIONNE': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'ANNULE': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    const config = styles[status] || styles['ACTIF'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status === 'ACTIF' ? 'Actif' : 
         status === 'REMBOURSE' ? 'Remboursé' :
         status === 'EN_RETARD' ? 'En retard' : 
         status === 'PROVISIONNE' ? 'Provisionné' : 'Annulé'}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'DETTE' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        <ArrowUpCircle className="w-3 h-3" />
        Dette (Passif)
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        <ArrowDownCircle className="w-3 h-3" />
        Prêt (Actif)
      </span>
    );
  };

  const getTiersIcon = (type: string) => {
    switch (type) {
      case 'PERSONNE': return <User className="w-4 h-4" />;
      case 'ENTREPRISE': return <Building2 className="w-4 h-4" />;
      case 'BANQUE': return <CreditCard className="w-4 h-4" />;
      case 'EMPLOYE': return <User className="w-4 h-4" />;
      case 'ETAT': return <Building2 className="w-4 h-4" />;
      case 'COLLECTIVITE': return <Building2 className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const filteredDebtsLoans = debtsLoans.filter(item => {
    const matchesSearch = !searchTerm || 
      item.tiers_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.compte_comptable_principal.includes(searchTerm);
    
    const matchesType = filterType === 'ALL' || item.type === filterType;
    const matchesStatus = !filterStatus || item.statut === filterStatus;
    const matchesTiersType = !filterTiersType || item.tiers_type === filterTiersType;
    const matchesDateStart = !filterDateStart || item.date_debut >= filterDateStart;
    const matchesDateEnd = !filterDateEnd || (item.date_echeance && item.date_echeance <= filterDateEnd);
    
    return matchesSearch && matchesType && matchesStatus && matchesTiersType && matchesDateStart && matchesDateEnd;
  });

  const debts = filteredDebtsLoans.filter(item => item.type === 'DETTE');
  const loans = filteredDebtsLoans.filter(item => item.type === 'PRET');

  const handleSaveDebtLoan = async (debtLoan: any) => {
    try {
      if (editingItem) {
        // Update logic would go here
        console.log('Updating debt/loan:', debtLoan);
      } else {
        await window.electronAPI.createDettePretOhada(debtLoan);
      }
      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving debt/loan:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleSavePayment = async (payment: any) => {
    try {
      await window.electronAPI.createPaiementDettePretOhada(payment);
      setShowPaymentForm(false);
      setSelectedDebtLoan(null);
      loadData();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Dettes & Prêts OHADA
          </h2>
          <p className="text-sm text-gray-500">
            Suivi conforme aux normes OHADA avec comptabilité en partie double
          </p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Dette/Prêt
        </button>
      </div>

      {/* OHADA Compliance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Calculator className="w-5 h-5" />
          <span className="font-medium">Conformité OHADA</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Ce module respecte les normes OHADA avec intégration au plan comptable, 
          écritures automatiques en partie double et classification selon les comptes 161-168 (dettes) et 261-268 (prêts).
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Tableau de bord', icon: HandCoins },
            { id: 'debts', label: 'Dettes (Passif)', icon: TrendingUp },
            { id: 'loans', label: 'Prêts (Actif)', icon: TrendingDown },
            { id: 'payments', label: 'Paiements', icon: DollarSign },
            { id: 'reports', label: 'Rapports OHADA', icon: FileText },
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-500">Passif</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Dettes Actives</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.debts.active}</p>
              <p className="text-sm text-red-600 font-medium">
                {stats.debts.total_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-500">Actif</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Prêts Actifs</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.loans.active}</p>
              <p className="text-sm text-blue-600 font-medium">
                {stats.loans.total_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-500">En retard</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Éléments en retard</h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats.debts.overdue + stats.loans.overdue}
              </p>
              <p className="text-sm text-orange-600">
                {stats.debts.overdue} dettes, {stats.loans.overdue} prêts
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <Calculator className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-500">Position nette</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Position Financière</h3>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.loans.total_balance - stats.debts.total_balance).toLocaleString('fr-FR')}
              </p>
              <p className="text-sm text-gray-600">
                {stats.loans.total_balance >= stats.debts.total_balance ? 'Position créditrice' : 'Position débitrice'}
              </p>
            </div>
          </div>

          {/* Recent Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                Dettes Récentes (Passif)
              </h3>
              <div className="space-y-3">
                {debts.slice(0, 5).map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTiersIcon(debt.tiers_type)}
                      <div>
                        <p className="font-medium text-gray-900">{debt.tiers_nom}</p>
                        <p className="text-xs text-gray-500">
                          {debt.reference_number} • Compte {debt.compte_comptable_principal}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        {debt.solde_actuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debt.devise}
                      </p>
                      {getStatusBadge(debt.statut)}
                    </div>
                  </div>
                ))}
                {debts.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Aucune dette active</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                Prêts Récents (Actif)
              </h3>
              <div className="space-y-3">
                {loans.slice(0, 5).map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTiersIcon(loan.tiers_type)}
                      <div>
                        <p className="font-medium text-gray-900">{loan.tiers_nom}</p>
                        <p className="text-xs text-gray-500">
                          {loan.reference_number} • Compte {loan.compte_comptable_principal}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">
                        {loan.solde_actuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {loan.devise}
                      </p>
                      {getStatusBadge(loan.statut)}
                    </div>
                  </div>
                ))}
                {loans.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun prêt actif</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debts Tab */}
      {activeTab === 'debts' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, référence, compte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="REMBOURSE">Remboursé</option>
              <option value="EN_RETARD">En retard</option>
              <option value="PROVISIONNE">Provisionné</option>
              <option value="ANNULE">Annulé</option>
            </select>
            <select
              value={filterTiersType}
              onChange={(e) => setFilterTiersType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les tiers</option>
              <option value="BANQUE">Banque</option>
              <option value="ENTREPRISE">Entreprise</option>
              <option value="EMPLOYE">Employé</option>
              <option value="ETAT">État</option>
              <option value="PERSONNE">Personne</option>
              <option value="COLLECTIVITE">Collectivité</option>
            </select>
          </div>

          {/* Debts Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créancier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte OHADA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objet</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant Initial</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde Restant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Échéance</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{debt.reference_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTiersIcon(debt.tiers_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{debt.tiers_nom}</p>
                          <p className="text-xs text-gray-500">{debt.tiers_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{debt.compte_comptable_principal}</p>
                        <p className="text-xs text-gray-500">{debt.compte_libelle}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{debt.objet}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {debt.montant_principal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debt.devise}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                      {debt.solde_actuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debt.devise}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {debt.date_echeance ? new Date(debt.date_echeance).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(debt.statut)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedDebtLoan(debt); setShowPaymentForm(true); }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Enregistrer paiement"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingItem(debt); setShowForm(true); }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {debts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      Aucune dette trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, référence, compte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="REMBOURSE">Remboursé</option>
              <option value="EN_RETARD">En retard</option>
              <option value="PROVISIONNE">Provisionné</option>
              <option value="ANNULE">Annulé</option>
            </select>
            <select
              value={filterTiersType}
              onChange={(e) => setFilterTiersType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les tiers</option>
              <option value="EMPLOYE">Employé</option>
              <option value="ENTREPRISE">Entreprise</option>
              <option value="ETAT">État</option>
              <option value="PERSONNE">Personne</option>
              <option value="COLLECTIVITE">Collectivité</option>
            </select>
          </div>

          {/* Loans Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Débiteur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte OHADA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objet</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant Initial</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde Restant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Échéance</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.reference_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTiersIcon(loan.tiers_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{loan.tiers_nom}</p>
                          <p className="text-xs text-gray-500">{loan.tiers_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{loan.compte_comptable_principal}</p>
                        <p className="text-xs text-gray-500">{loan.compte_libelle}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{loan.objet}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {loan.montant_principal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {loan.devise}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                      {loan.solde_actuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {loan.devise}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {loan.date_echeance ? new Date(loan.date_echeance).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(loan.statut)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedDebtLoan(loan); setShowPaymentForm(true); }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Enregistrer paiement"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingItem(loan); setShowForm(true); }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loans.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      Aucun prêt trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des Paiements</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiers</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Écriture</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(payment.date_paiement).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.reference_paiement}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {debtsLoans.find(dl => dl.id === payment.dette_pret_id)?.tiers_nom || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {payment.montant_paye.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {payment.devise}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{payment.mode_paiement}</td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        {payment.ecriture_numero || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Aucun paiement enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Rapports OHADA - Dettes & Prêts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Calculator className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-900">Bilan OHADA</h4>
                <p className="text-sm text-gray-500">Position des dettes (Passif) et prêts (Actif)</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <BookOpen className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium text-gray-900">Grand Livre</h4>
                <p className="text-sm text-gray-500">Mouvements par compte OHADA</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Calendar className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className="font-medium text-gray-900">Échéancier</h4>
                <p className="text-sm text-gray-500">Calendrier des paiements à venir</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
                <h4 className="font-medium text-gray-900">Éléments en Retard</h4>
                <p className="text-sm text-gray-500">Dettes et prêts en retard de paiement</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <DollarSign className="w-8 h-8 text-yellow-600 mb-2" />
                <h4 className="font-medium text-gray-900">Analyse des Intérêts</h4>
                <p className="text-sm text-gray-500">Produits et charges d'intérêts</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Download className="w-8 h-8 text-gray-600 mb-2" />
                <h4 className="font-medium text-gray-900">Export Excel</h4>
                <p className="text-sm text-gray-500">Export des données pour analyse</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      {showForm && (
        <OhadaDebtLoanForm
          debtLoan={editingItem}
          onSave={handleSaveDebtLoan}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showPaymentForm && selectedDebtLoan && (
        <OhadaDebtLoanPaymentForm
          debtLoan={selectedDebtLoan}
          onSave={handleSavePayment}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedDebtLoan(null);
          }}
        />
      )}
    </div>
  );
}