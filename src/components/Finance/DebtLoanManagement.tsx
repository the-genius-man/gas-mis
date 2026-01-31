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
  Eye
} from 'lucide-react';
import DebtLoanForm from './DebtLoanForm';
import DebtLoanPaymentForm from './DebtLoanPaymentForm';

interface DebtLoan {
  id: string;
  type: 'DETTE' | 'PRET'; // DETTE = money we owe, PRET = money owed to us
  reference_number: string;
  creditor_debtor_name: string;
  creditor_debtor_type: 'PERSONNE' | 'ENTREPRISE' | 'BANQUE' | 'EMPLOYE';
  contact_info?: string;
  principal_amount: number;
  current_balance: number;
  interest_rate?: number;
  interest_type?: 'SIMPLE' | 'COMPOSE' | 'FIXE';
  start_date: string;
  due_date?: string;
  status: 'ACTIF' | 'REMBOURSE' | 'EN_RETARD' | 'ANNULE';
  payment_frequency?: 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL' | 'UNIQUE';
  description: string;
  currency: string;
  guarantees?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DebtLoanPayment {
  id: string;
  debt_loan_id: string;
  payment_date: string;
  amount: number;
  payment_type: 'CAPITAL' | 'INTERET' | 'MIXTE';
  payment_method: 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY';
  reference: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

interface DebtLoanStats {
  totalDebts: number;
  totalLoans: number;
  overdueDebts: number;
  overdueLoans: number;
  totalDebtAmount: number;
  totalLoanAmount: number;
  monthlyDebtPayments: number;
  monthlyLoanPayments: number;
}

type TabType = 'dashboard' | 'debts' | 'loans' | 'payments' | 'reports';

export default function DebtLoanManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [debtsLoans, setDebtsLoans] = useState<DebtLoan[]>([]);
  const [payments, setPayments] = useState<DebtLoanPayment[]>([]);
  const [stats, setStats] = useState<DebtLoanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DebtLoan | null>(null);
  const [selectedDebtLoan, setSelectedDebtLoan] = useState<DebtLoan | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DETTE' | 'PRET'>('ALL');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      // Mock data for now - in real implementation, these would be API calls
      const mockDebtsLoans: DebtLoan[] = [
        {
          id: '1',
          type: 'DETTE',
          reference_number: 'DT-2025-001',
          creditor_debtor_name: 'Banque Centrale',
          creditor_debtor_type: 'BANQUE',
          contact_info: '+243 123 456 789',
          principal_amount: 50000,
          current_balance: 35000,
          interest_rate: 12,
          interest_type: 'SIMPLE',
          start_date: '2024-01-15',
          due_date: '2025-01-15',
          status: 'ACTIF',
          payment_frequency: 'MENSUEL',
          description: 'Prêt pour équipement de sécurité',
          currency: 'USD',
          guarantees: 'Équipements de sécurité',
          created_by: 'admin',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          type: 'PRET',
          reference_number: 'PR-2025-001',
          creditor_debtor_name: 'Jean Mukendi',
          creditor_debtor_type: 'EMPLOYE',
          contact_info: 'jean.mukendi@company.com',
          principal_amount: 5000,
          current_balance: 3000,
          interest_rate: 5,
          interest_type: 'SIMPLE',
          start_date: '2024-12-01',
          due_date: '2025-06-01',
          status: 'ACTIF',
          payment_frequency: 'MENSUEL',
          description: 'Avance sur salaire',
          currency: 'USD',
          created_by: 'admin',
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z'
        },
        {
          id: '3',
          type: 'DETTE',
          reference_number: 'DT-2025-002',
          creditor_debtor_name: 'Fournisseur ABC',
          creditor_debtor_type: 'ENTREPRISE',
          contact_info: 'contact@abc.com',
          principal_amount: 15000,
          current_balance: 0,
          start_date: '2024-06-01',
          due_date: '2024-12-01',
          status: 'REMBOURSE',
          payment_frequency: 'UNIQUE',
          description: 'Achat de véhicules',
          currency: 'USD',
          created_by: 'admin',
          created_at: '2024-06-01T10:00:00Z',
          updated_at: '2024-12-15T10:00:00Z'
        }
      ];

      const mockPayments: DebtLoanPayment[] = [
        {
          id: '1',
          debt_loan_id: '1',
          payment_date: '2024-12-15',
          amount: 5000,
          payment_type: 'MIXTE',
          payment_method: 'VIREMENT',
          reference: 'VIR-2024-001',
          notes: 'Paiement mensuel décembre',
          created_by: 'admin',
          created_at: '2024-12-15T10:00:00Z'
        }
      ];

      const mockStats: DebtLoanStats = {
        totalDebts: mockDebtsLoans.filter(d => d.type === 'DETTE' && d.status === 'ACTIF').length,
        totalLoans: mockDebtsLoans.filter(d => d.type === 'PRET' && d.status === 'ACTIF').length,
        overdueDebts: mockDebtsLoans.filter(d => 
          d.type === 'DETTE' && 
          d.status === 'ACTIF' && 
          d.due_date && 
          new Date(d.due_date) < new Date()
        ).length,
        overdueLoans: mockDebtsLoans.filter(d => 
          d.type === 'PRET' && 
          d.status === 'ACTIF' && 
          d.due_date && 
          new Date(d.due_date) < new Date()
        ).length,
        totalDebtAmount: mockDebtsLoans
          .filter(d => d.type === 'DETTE' && d.status === 'ACTIF')
          .reduce((sum, d) => sum + d.current_balance, 0),
        totalLoanAmount: mockDebtsLoans
          .filter(d => d.type === 'PRET' && d.status === 'ACTIF')
          .reduce((sum, d) => sum + d.current_balance, 0),
        monthlyDebtPayments: 8500,
        monthlyLoanPayments: 1200
      };

      setDebtsLoans(mockDebtsLoans);
      setPayments(mockPayments);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading debt/loan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      'ACTIF': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'REMBOURSE': { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle },
      'EN_RETARD': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
      'ANNULE': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    const config = styles[status] || styles['ACTIF'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status === 'ACTIF' ? 'Actif' : 
         status === 'REMBOURSE' ? 'Remboursé' :
         status === 'EN_RETARD' ? 'En retard' : 'Annulé'}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'DETTE' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        <ArrowUpCircle className="w-3 h-3" />
        Dette
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        <ArrowDownCircle className="w-3 h-3" />
        Prêt
      </span>
    );
  };

  const getCreditorDebtorIcon = (type: string) => {
    switch (type) {
      case 'PERSONNE': return <User className="w-4 h-4" />;
      case 'ENTREPRISE': return <Building2 className="w-4 h-4" />;
      case 'BANQUE': return <CreditCard className="w-4 h-4" />;
      case 'EMPLOYE': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const filteredDebtsLoans = debtsLoans.filter(item => {
    const matchesSearch = !searchTerm || 
      item.creditor_debtor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' || item.type === filterType;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesDateStart = !filterDateStart || item.start_date >= filterDateStart;
    const matchesDateEnd = !filterDateEnd || (item.due_date && item.due_date <= filterDateEnd);
    
    return matchesSearch && matchesType && matchesStatus && matchesDateStart && matchesDateEnd;
  });

  const debts = filteredDebtsLoans.filter(item => item.type === 'DETTE');
  const loans = filteredDebtsLoans.filter(item => item.type === 'PRET');

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
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Dettes & Prêts</h2>
          <p className="text-sm text-gray-500">
            Suivi des dettes et prêts de l'entreprise
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Tableau de bord', icon: HandCoins },
            { id: 'debts', label: 'Dettes', icon: TrendingUp },
            { id: 'loans', label: 'Prêts', icon: TrendingDown },
            { id: 'payments', label: 'Paiements', icon: DollarSign },
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-500">Dettes</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Dettes Actives</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDebts}</p>
              <p className="text-sm text-red-600 font-medium">
                {stats.totalDebtAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-500">Prêts</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Prêts Actifs</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLoans}</p>
              <p className="text-sm text-blue-600 font-medium">
                {stats.totalLoanAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
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
                {stats.overdueDebts + stats.overdueLoans}
              </p>
              <p className="text-sm text-orange-600">
                {stats.overdueDebts} dettes, {stats.overdueLoans} prêts
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-500">Mensuel</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Paiements Mensuels</h3>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.monthlyDebtPayments + stats.monthlyLoanPayments).toLocaleString('fr-FR')}
              </p>
              <p className="text-sm text-gray-600">
                Sortie: {stats.monthlyDebtPayments.toLocaleString('fr-FR')} | 
                Entrée: {stats.monthlyLoanPayments.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Recent Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dettes Récentes</h3>
              <div className="space-y-3">
                {debts.slice(0, 5).map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getCreditorDebtorIcon(debt.creditor_debtor_type)}
                      <div>
                        <p className="font-medium text-gray-900">{debt.creditor_debtor_name}</p>
                        <p className="text-sm text-gray-500">{debt.reference_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        {debt.current_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debt.currency}
                      </p>
                      {getStatusBadge(debt.status)}
                    </div>
                  </div>
                ))}
                {debts.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Aucune dette active</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prêts Récents</h3>
              <div className="space-y-3">
                {loans.slice(0, 5).map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getCreditorDebtorIcon(loan.creditor_debtor_type)}
                      <div>
                        <p className="font-medium text-gray-900">{loan.creditor_debtor_name}</p>
                        <p className="text-sm text-gray-500">{loan.reference_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">
                        {loan.current_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {loan.currency}
                      </p>
                      {getStatusBadge(loan.status)}
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
                placeholder="Rechercher..."
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
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

          {/* Debts Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créancier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
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
                        {getCreditorDebtorIcon(debt.creditor_debtor_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{debt.creditor_debtor_name}</p>
                          <p className="text-xs text-gray-500">{debt.creditor_debtor_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{debt.description}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {debt.principal_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debt.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                      {debt.current_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debt.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {debt.due_date ? new Date(debt.due_date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(debt.status)}</td>
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
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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
                placeholder="Rechercher..."
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
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

          {/* Loans Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Débiteur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
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
                        {getCreditorDebtorIcon(loan.creditor_debtor_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{loan.creditor_debtor_name}</p>
                          <p className="text-xs text-gray-500">{loan.creditor_debtor_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{loan.description}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {loan.principal_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {loan.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                      {loan.current_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {loan.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {loan.due_date ? new Date(loan.due_date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(loan.status)}</td>
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
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.reference}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{payment.payment_type}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {payment.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{payment.payment_method}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rapports Dettes & Prêts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <FileText className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-900">Rapport de Position</h4>
                <p className="text-sm text-gray-500">État des dettes et prêts actifs</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Calendar className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium text-gray-900">Échéancier</h4>
                <p className="text-sm text-gray-500">Calendrier des paiements à venir</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
                <h4 className="font-medium text-gray-900">Éléments en Retard</h4>
                <p className="text-sm text-gray-500">Dettes et prêts en retard de paiement</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forms would go here - DebtLoanForm and PaymentForm components */}
      {/* These would be separate modal components for creating/editing debts/loans and recording payments */}
      
      {/* Debt/Loan Form Modal */}
      {showForm && (
        <DebtLoanForm
          debtLoan={editingItem}
          onSave={(debtLoan) => {
            // Handle save logic here
            console.log('Saving debt/loan:', debtLoan);
            setShowForm(false);
            setEditingItem(null);
            loadData(); // Reload data
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && selectedDebtLoan && (
        <DebtLoanPaymentForm
          debtLoan={selectedDebtLoan}
          onSave={(payment) => {
            // Handle payment save logic here
            console.log('Saving payment:', payment);
            setShowPaymentForm(false);
            setSelectedDebtLoan(null);
            loadData(); // Reload data
          }}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedDebtLoan(null);
          }}
        />
      )}
    </div>
  );
}