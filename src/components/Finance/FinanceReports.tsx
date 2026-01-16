import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Download, 
  Filter,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface FinanceReportData {
  revenue: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  expenses: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    partiallyPaid: number;
    paid: number;
    cancelled: number;
  };
  cashFlow: {
    inflow: number;
    outflow: number;
    balance: number;
  };
  topClients: { client: string; amount: number }[];
}

export default function FinanceReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<FinanceReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<'overview' | 'invoices' | 'payments' | 'cashflow'>('overview');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      // Load all necessary data
      const [invoices, payments, depenses, entrees] = await Promise.all([
        window.electronAPI.getFacturesGAS(),
        window.electronAPI.getPaiements ? window.electronAPI.getPaiements() : Promise.resolve([]),
        window.electronAPI.getDepenses(),
        window.electronAPI.getEntrees ? window.electronAPI.getEntrees() : Promise.resolve([])
      ]);

      // Filter by date range
      const filteredInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.date_emission);
        return invDate >= new Date(dateRange.startDate) && invDate <= new Date(dateRange.endDate);
      });

      const filteredPayments = payments.filter((pay: any) => {
        const payDate = new Date(pay.date_paiement);
        return payDate >= new Date(dateRange.startDate) && payDate <= new Date(dateRange.endDate);
      });

      const filteredDepenses = depenses.filter((dep: any) => {
        const depDate = new Date(dep.date_depense);
        return depDate >= new Date(dateRange.startDate) && depDate <= new Date(dateRange.endDate);
      });

      const filteredEntrees = entrees.filter((ent: any) => {
        const entDate = new Date(ent.date_entree);
        return entDate >= new Date(dateRange.startDate) && entDate <= new Date(dateRange.endDate);
      });

      // Calculate statistics
      const totalRevenue = filteredInvoices.reduce((sum: number, inv: any) => sum + (inv.montant_total_du_client || 0), 0);
      const paidRevenue = filteredPayments.reduce((sum: number, pay: any) => sum + (pay.montant_paye || 0), 0);
      const pendingRevenue = filteredInvoices
        .filter((inv: any) => inv.statut_paiement === 'ENVOYE' || inv.statut_paiement === 'PAYE_PARTIEL')
        .reduce((sum: number, inv: any) => sum + (inv.montant_total_du_client || 0) - (inv.montant_paye || 0), 0);

      const totalExpenses = filteredDepenses.reduce((sum: number, dep: any) => sum + (dep.montant || 0), 0);
      
      // Group expenses by category
      const expensesByCategory = filteredDepenses.reduce((acc: any, dep: any) => {
        const category = dep.categorie || 'Autre';
        if (!acc[category]) acc[category] = 0;
        acc[category] += dep.montant || 0;
        return acc;
      }, {});

      // Invoice status counts
      const invoiceStats = {
        total: filteredInvoices.length,
        draft: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'BROUILLON').length,
        sent: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'ENVOYE').length,
        partiallyPaid: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'PAYE_PARTIEL').length,
        paid: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'PAYE_TOTAL').length,
        cancelled: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'ANNULE').length
      };

      // Cash flow
      const totalInflow = filteredEntrees.reduce((sum: number, ent: any) => sum + (ent.montant || 0), 0);
      const totalOutflow = filteredDepenses.reduce((sum: number, dep: any) => sum + (dep.montant || 0), 0);

      // Top clients
      const clientRevenue = filteredInvoices.reduce((acc: any, inv: any) => {
        const client = inv.client_nom || 'Client Inconnu';
        if (!acc[client]) acc[client] = 0;
        acc[client] += inv.montant_total_du_client || 0;
        return acc;
      }, {});

      const topClients = Object.entries(clientRevenue)
        .map(([client, amount]) => ({ client, amount: amount as number }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setReportData({
        revenue: {
          total: totalRevenue,
          paid: paidRevenue,
          pending: pendingRevenue,
          overdue: 0 // TODO: Calculate overdue
        },
        expenses: {
          total: totalExpenses,
          byCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
            category,
            amount: amount as number
          }))
        },
        invoices: invoiceStats,
        cashFlow: {
          inflow: totalInflow,
          outflow: totalOutflow,
          balance: totalInflow - totalOutflow
        },
        topClients
      });
    } catch (error) {
      console.error('Error loading finance report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = [
      ['Rapport Financier'],
      ['Période', `${dateRange.startDate} - ${dateRange.endDate}`],
      [''],
      ['REVENUS'],
      ['Total Facturé', reportData.revenue.total],
      ['Payé', reportData.revenue.paid],
      ['En Attente', reportData.revenue.pending],
      [''],
      ['DÉPENSES'],
      ['Total', reportData.expenses.total],
      [''],
      ['FLUX DE TRÉSORERIE'],
      ['Entrées', reportData.cashFlow.inflow],
      ['Sorties', reportData.cashFlow.outflow],
      ['Solde', reportData.cashFlow.balance]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Vue d\'ensemble');

    // Expenses by category sheet
    const expensesData = [
      ['Catégorie', 'Montant'],
      ...reportData.expenses.byCategory.map(item => [item.category, item.amount])
    ];
    const wsExpenses = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Dépenses par Catégorie');

    // Top clients sheet
    const clientsData = [
      ['Client', 'Montant'],
      ...reportData.topClients.map(item => [item.client, item.amount])
    ];
    const wsClients = XLSX.utils.aoa_to_sheet(clientsData);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Top Clients');

    XLSX.writeFile(wb, `Rapport_Financier_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Rapports Financiers</h2>
            <p className="text-sm text-gray-600 mt-1">Analyse des revenus, dépenses et flux de trésorerie</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Exporter Excel
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Période:</label>
          </div>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">à</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: FileText },
              { id: 'invoices', label: 'Factures', icon: FileText },
              { id: 'payments', label: 'Paiements', icon: CreditCard },
              { id: 'cashflow', label: 'Flux de Trésorerie', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedReport === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {selectedReport === 'overview' && reportData && (
            <div className="space-y-6">
              {/* Revenue Cards */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenus</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Total Facturé</span>
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      ${reportData.revenue.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Payé</span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      ${reportData.revenue.paid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-yellow-700">En Attente</span>
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">
                      ${reportData.revenue.pending.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-700">En Retard</span>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-900">
                      ${reportData.revenue.overdue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Flow */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Flux de Trésorerie</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Entrées</span>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${reportData.cashFlow.inflow.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sorties</span>
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${reportData.cashFlow.outflow.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className={`rounded-lg p-4 ${reportData.cashFlow.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${reportData.cashFlow.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        Solde
                      </span>
                      <DollarSign className={`w-5 h-5 ${reportData.cashFlow.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <p className={`text-2xl font-bold ${reportData.cashFlow.balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                      ${reportData.cashFlow.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expenses by Category */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dépenses par Catégorie</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% du Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.expenses.byCategory.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            ${item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {((item.amount / reportData.expenses.total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${reportData.expenses.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Clients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Clients</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.topClients.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.client}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            ${item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'invoices' && reportData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Statistiques des Factures</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.invoices.total}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Brouillon</p>
                  <p className="text-2xl font-bold text-gray-600">{reportData.invoices.draft}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-700 mb-1">Envoyé</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.invoices.sent}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-700 mb-1">Partiel</p>
                  <p className="text-2xl font-bold text-yellow-900">{reportData.invoices.partiallyPaid}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 mb-1">Payé</p>
                  <p className="text-2xl font-bold text-green-900">{reportData.invoices.paid}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-700 mb-1">Annulé</p>
                  <p className="text-2xl font-bold text-red-900">{reportData.invoices.cancelled}</p>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'payments' && (
            <div className="text-center py-12 text-gray-500">
              Rapport des paiements en cours de développement...
            </div>
          )}

          {selectedReport === 'cashflow' && reportData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Analyse du Flux de Trésorerie</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-green-900">Entrées Totales</h4>
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    ${reportData.cashFlow.inflow.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-700 mt-2">Paiements clients et autres revenus</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-red-900">Sorties Totales</h4>
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-900">
                    ${reportData.cashFlow.outflow.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-red-700 mt-2">Dépenses opérationnelles</p>
                </div>

                <div className={`border rounded-lg p-6 ${reportData.cashFlow.balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-sm font-medium ${reportData.cashFlow.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                      Solde Net
                    </h4>
                    <DollarSign className={`w-6 h-6 ${reportData.cashFlow.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  </div>
                  <p className={`text-3xl font-bold ${reportData.cashFlow.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                    ${reportData.cashFlow.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-sm mt-2 ${reportData.cashFlow.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {reportData.cashFlow.balance >= 0 ? 'Flux positif' : 'Flux négatif'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
