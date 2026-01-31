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
  Clock,
  Building2,
  MapPin,
  BarChart3,
  PieChart,
  Users,
  Target,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface FinanceReportData {
  revenue: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    byClient: { client: string; amount: number; percentage: number }[];
    bySite: { site: string; client: string; amount: number; percentage: number }[];
  };
  expenses: {
    total: number;
    byCategory: { category: string; amount: number; percentage: number }[];
    byMonth: { month: string; amount: number }[];
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    partiallyPaid: number;
    paid: number;
    cancelled: number;
    averageValue: number;
    totalValue: number;
  };
  cashFlow: {
    inflow: number;
    outflow: number;
    balance: number;
    netMargin: number;
    monthlyTrend: { month: string; inflow: number; outflow: number; balance: number }[];
  };
  profitLoss: {
    grossRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    operatingExpenses: number;
    administrativeExpenses: number;
    otherExpenses: number;
  };
  topClients: { client: string; amount: number; percentage: number }[];
  kpis: {
    averageInvoiceValue: number;
    collectionRate: number;
    expenseRatio: number;
    growthRate: number;
  };
}

export default function FinanceReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<FinanceReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<'overview' | 'profitloss' | 'revenue' | 'expenses' | 'cashflow' | 'kpis'>('overview');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      // Load all necessary data
      const [invoices, payments, depenses, entrees, clients, sites] = await Promise.all([
        window.electronAPI.getFacturesGAS(),
        window.electronAPI.getPaiements ? window.electronAPI.getPaiements() : Promise.resolve([]),
        window.electronAPI.getDepenses(),
        window.electronAPI.getEntrees ? window.electronAPI.getEntrees() : Promise.resolve([]),
        window.electronAPI.getClientsGAS(),
        window.electronAPI.getSitesGAS()
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

      // Calculate revenue statistics
      const totalRevenue = filteredInvoices.reduce((sum: number, inv: any) => sum + (inv.montant_total_du_client || 0), 0);
      const paidRevenue = filteredPayments.reduce((sum: number, pay: any) => sum + (pay.montant_paye || 0), 0);
      const pendingRevenue = filteredInvoices
        .filter((inv: any) => inv.statut_paiement === 'ENVOYE' || inv.statut_paiement === 'PAYE_PARTIEL')
        .reduce((sum: number, inv: any) => sum + (inv.montant_total_du_client || 0) - (inv.montant_paye || 0), 0);

      // Revenue by client
      const clientRevenue = filteredInvoices.reduce((acc: any, inv: any) => {
        const client = inv.client_nom || 'Client Inconnu';
        if (!acc[client]) acc[client] = 0;
        acc[client] += inv.montant_total_du_client || 0;
        return acc;
      }, {});

      const revenueByClient = Object.entries(clientRevenue)
        .map(([client, amount]) => ({
          client,
          amount: amount as number,
          percentage: totalRevenue > 0 ? ((amount as number) / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      // Revenue by site
      const siteRevenue = filteredInvoices.reduce((acc: any, inv: any) => {
        const site = inv.site_nom || 'Site Inconnu';
        const client = inv.client_nom || 'Client Inconnu';
        if (!acc[site]) acc[site] = { amount: 0, client };
        acc[site].amount += inv.montant_total_du_client || 0;
        return acc;
      }, {});

      const revenueBySite = Object.entries(siteRevenue)
        .map(([site, data]: [string, any]) => ({
          site,
          client: data.client,
          amount: data.amount,
          percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      // Enhanced expense analysis
      const totalExpenses = filteredDepenses.reduce((sum: number, dep: any) => sum + (dep.montant || 0), 0);
      
      const expensesByCategory = filteredDepenses.reduce((acc: any, dep: any) => {
        const category = dep.nom_categorie || dep.categorie || 'Autre';
        if (!acc[category]) acc[category] = 0;
        acc[category] += dep.montant || 0;
        return acc;
      }, {});

      const expensesByCategoryArray = Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount: amount as number,
        percentage: totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0
      }));

      // Monthly expense trend
      const expensesByMonth = filteredDepenses.reduce((acc: any, dep: any) => {
        const month = new Date(dep.date_depense).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
        if (!acc[month]) acc[month] = 0;
        acc[month] += dep.montant || 0;
        return acc;
      }, {});

      // Invoice statistics
      const invoiceStats = {
        total: filteredInvoices.length,
        draft: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'BROUILLON').length,
        sent: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'ENVOYE').length,
        partiallyPaid: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'PAYE_PARTIEL').length,
        paid: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'PAYE_TOTAL').length,
        cancelled: filteredInvoices.filter((inv: any) => inv.statut_paiement === 'ANNULE').length,
        averageValue: filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0,
        totalValue: totalRevenue
      };

      // Enhanced cash flow analysis
      const totalInflow = filteredEntrees.reduce((sum: number, ent: any) => sum + (ent.montant || 0), 0);
      const totalOutflow = filteredDepenses.reduce((sum: number, dep: any) => sum + (dep.montant || 0), 0);
      const netBalance = totalInflow - totalOutflow;
      const netMargin = totalInflow > 0 ? (netBalance / totalInflow) * 100 : 0;

      // Monthly cash flow trend
      const monthlyTrend = [];
      const months = [...new Set([
        ...filteredEntrees.map((e: any) => new Date(e.date_entree).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })),
        ...filteredDepenses.map((d: any) => new Date(d.date_depense).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }))
      ])].sort();

      for (const month of months) {
        const monthInflow = filteredEntrees
          .filter((e: any) => new Date(e.date_entree).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }) === month)
          .reduce((sum: number, e: any) => sum + (e.montant || 0), 0);
        
        const monthOutflow = filteredDepenses
          .filter((d: any) => new Date(d.date_depense).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }) === month)
          .reduce((sum: number, d: any) => sum + (d.montant || 0), 0);

        monthlyTrend.push({
          month,
          inflow: monthInflow,
          outflow: monthOutflow,
          balance: monthInflow - monthOutflow
        });
      }

      // Profit & Loss calculation
      const operatingExpenses = filteredDepenses
        .filter((dep: any) => ['SALAIRES', 'LOYER', 'UTILITIES', 'TRANSPORT'].includes(dep.nom_categorie))
        .reduce((sum: number, dep: any) => sum + (dep.montant || 0), 0);
      
      const administrativeExpenses = filteredDepenses
        .filter((dep: any) => ['ADMINISTRATION', 'LEGAL', 'COMPTABILITE'].includes(dep.nom_categorie))
        .reduce((sum: number, dep: any) => sum + (dep.montant || 0), 0);
      
      const otherExpenses = totalExpenses - operatingExpenses - administrativeExpenses;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // KPIs calculation
      const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;
      const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

      // Top clients (top 10)
      const topClients = revenueByClient.slice(0, 10);

      setReportData({
        revenue: {
          total: totalRevenue,
          paid: paidRevenue,
          pending: pendingRevenue,
          overdue: 0, // TODO: Calculate overdue based on invoice due dates
          byClient: revenueByClient,
          bySite: revenueBySite
        },
        expenses: {
          total: totalExpenses,
          byCategory: expensesByCategoryArray,
          byMonth: Object.entries(expensesByMonth).map(([month, amount]) => ({ month, amount: amount as number }))
        },
        invoices: invoiceStats,
        cashFlow: {
          inflow: totalInflow,
          outflow: totalOutflow,
          balance: netBalance,
          netMargin,
          monthlyTrend
        },
        profitLoss: {
          grossRevenue: totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
          operatingExpenses,
          administrativeExpenses,
          otherExpenses
        },
        topClients,
        kpis: {
          averageInvoiceValue: invoiceStats.averageValue,
          collectionRate,
          expenseRatio,
          growthRate: 0 // TODO: Calculate growth rate with historical data
        }
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
      ['RAPPORT FINANCIER - VUE D\'ENSEMBLE'],
      ['Période', `${dateRange.startDate} - ${dateRange.endDate}`],
      ['Généré le', new Date().toLocaleDateString('fr-FR')],
      [''],
      ['REVENUS'],
      ['Total Facturé', reportData.revenue.total],
      ['Payé', reportData.revenue.paid],
      ['En Attente', reportData.revenue.pending],
      ['En Retard', reportData.revenue.overdue],
      [''],
      ['DÉPENSES'],
      ['Total', reportData.expenses.total],
      [''],
      ['PROFIT & LOSS'],
      ['Revenus Bruts', reportData.profitLoss.grossRevenue],
      ['Dépenses Totales', reportData.profitLoss.totalExpenses],
      ['Profit Net', reportData.profitLoss.netProfit],
      ['Marge Bénéficiaire', `${reportData.profitLoss.profitMargin.toFixed(2)}%`],
      [''],
      ['INDICATEURS CLÉS'],
      ['Valeur Moyenne Facture', reportData.kpis.averageInvoiceValue],
      ['Taux de Recouvrement', `${reportData.kpis.collectionRate.toFixed(2)}%`],
      ['Ratio Dépenses', `${reportData.kpis.expenseRatio.toFixed(2)}%`]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Vue d\'ensemble');

    // Revenue by client sheet
    const revenueByClientData = [
      ['REVENUS PAR CLIENT'],
      ['Client', 'Montant', 'Pourcentage'],
      ...reportData.revenue.byClient.map(item => [item.client, item.amount, `${item.percentage.toFixed(2)}%`])
    ];
    const wsRevenueClient = XLSX.utils.aoa_to_sheet(revenueByClientData);
    XLSX.utils.book_append_sheet(wb, wsRevenueClient, 'Revenus par Client');

    // Revenue by site sheet
    const revenueBySiteData = [
      ['REVENUS PAR SITE'],
      ['Site', 'Client', 'Montant', 'Pourcentage'],
      ...reportData.revenue.bySite.map(item => [item.site, item.client, item.amount, `${item.percentage.toFixed(2)}%`])
    ];
    const wsRevenueSite = XLSX.utils.aoa_to_sheet(revenueBySiteData);
    XLSX.utils.book_append_sheet(wb, wsRevenueSite, 'Revenus par Site');

    // Expenses by category sheet
    const expensesData = [
      ['DÉPENSES PAR CATÉGORIE'],
      ['Catégorie', 'Montant', 'Pourcentage'],
      ...reportData.expenses.byCategory.map(item => [item.category, item.amount, `${item.percentage.toFixed(2)}%`])
    ];
    const wsExpenses = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Dépenses par Catégorie');

    // Profit & Loss sheet
    const profitLossData = [
      ['COMPTE DE RÉSULTAT'],
      ['Revenus Bruts', reportData.profitLoss.grossRevenue],
      [''],
      ['DÉPENSES'],
      ['Dépenses Opérationnelles', reportData.profitLoss.operatingExpenses],
      ['Dépenses Administratives', reportData.profitLoss.administrativeExpenses],
      ['Autres Dépenses', reportData.profitLoss.otherExpenses],
      ['Total Dépenses', reportData.profitLoss.totalExpenses],
      [''],
      ['RÉSULTAT'],
      ['Profit Net', reportData.profitLoss.netProfit],
      ['Marge Bénéficiaire', `${reportData.profitLoss.profitMargin.toFixed(2)}%`]
    ];
    const wsProfitLoss = XLSX.utils.aoa_to_sheet(profitLossData);
    XLSX.utils.book_append_sheet(wb, wsProfitLoss, 'Compte de Résultat');

    // Cash flow sheet
    const cashFlowData = [
      ['FLUX DE TRÉSORERIE'],
      ['Mois', 'Entrées', 'Sorties', 'Solde'],
      ...reportData.cashFlow.monthlyTrend.map(item => [item.month, item.inflow, item.outflow, item.balance])
    ];
    const wsCashFlow = XLSX.utils.aoa_to_sheet(cashFlowData);
    XLSX.utils.book_append_sheet(wb, wsCashFlow, 'Flux de Trésorerie');

    XLSX.writeFile(wb, `Rapport_Financier_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT FINANCIER', pageWidth / 2, 30, { align: 'center' });

    // Period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période: ${dateRange.startDate} - ${dateRange.endDate}`, pageWidth / 2, 45, { align: 'center' });
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 55, { align: 'center' });

    let yPosition = 75;

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ EXÉCUTIF', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
      ['Métrique', 'Valeur'],
      ['Revenus Totaux', `$${reportData.revenue.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`],
      ['Dépenses Totales', `$${reportData.expenses.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`],
      ['Profit Net', `$${reportData.profitLoss.netProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`],
      ['Marge Bénéficiaire', `${reportData.profitLoss.profitMargin.toFixed(2)}%`],
      ['Taux de Recouvrement', `${reportData.kpis.collectionRate.toFixed(2)}%`]
    ];

    (doc as any).autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Revenue by Client
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REVENUS PAR CLIENT', margin, yPosition);
    yPosition += 15;

    const clientData = [
      ['Client', 'Montant', '%'],
      ...reportData.revenue.byClient.slice(0, 10).map(item => [
        item.client.substring(0, 30),
        `$${item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
        `${item.percentage.toFixed(1)}%`
      ])
    ];

    (doc as any).autoTable({
      head: [clientData[0]],
      body: clientData.slice(1),
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [92, 184, 92] }
    });

    // Add new page for expenses
    doc.addPage();
    yPosition = 30;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉPENSES PAR CATÉGORIE', margin, yPosition);
    yPosition += 15;

    const expenseData = [
      ['Catégorie', 'Montant', '%'],
      ...reportData.expenses.byCategory.slice(0, 10).map(item => [
        item.category.substring(0, 25),
        `$${item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
        `${item.percentage.toFixed(1)}%`
      ])
    ];

    (doc as any).autoTable({
      head: [expenseData[0]],
      body: expenseData.slice(1),
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 83, 79] }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
      doc.text('Rapport Financier - Confidentiel', margin, doc.internal.pageSize.height - 10);
    }

    doc.save(`Rapport_Financier_${dateRange.startDate}_${dateRange.endDate}.pdf`);
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
            <p className="text-sm text-gray-600 mt-1">Analyse complète des revenus, dépenses et performances financières</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadReportData()}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
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
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3, description: 'Résumé général' },
              { id: 'profitloss', label: 'Compte de Résultat', icon: TrendingUp, description: 'Profit & Loss' },
              { id: 'revenue', label: 'Analyse Revenus', icon: DollarSign, description: 'Par client et site' },
              { id: 'expenses', label: 'Analyse Dépenses', icon: TrendingDown, description: 'Par catégorie' },
              { id: 'cashflow', label: 'Flux de Trésorerie', icon: RefreshCw, description: 'Mouvements mensuels' },
              { id: 'kpis', label: 'Indicateurs Clés', icon: Target, description: 'KPIs financiers' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id as any)}
                  className={`flex flex-col items-center gap-1 py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                    selectedReport === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  <span className="text-xs text-gray-400">{tab.description}</span>
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

          {selectedReport === 'profitloss' && reportData && (
            <div className="space-y-6">
              {/* Profit & Loss Statement */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Compte de Résultat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Revenus</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenus Bruts</span>
                        <span className="font-medium text-green-600">
                          ${reportData.profitLoss.grossRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Dépenses</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dépenses Opérationnelles</span>
                        <span className="font-medium text-red-600">
                          ${reportData.profitLoss.operatingExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dépenses Administratives</span>
                        <span className="font-medium text-red-600">
                          ${reportData.profitLoss.administrativeExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Autres Dépenses</span>
                        <span className="font-medium text-red-600">
                          ${reportData.profitLoss.otherExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-700">Total Dépenses</span>
                        <span className="font-bold text-red-600">
                          ${reportData.profitLoss.totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-blue-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${reportData.profitLoss.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <h4 className={`text-lg font-semibold mb-2 ${reportData.profitLoss.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        Profit Net
                      </h4>
                      <p className={`text-3xl font-bold ${reportData.profitLoss.netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        ${reportData.profitLoss.netProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${reportData.profitLoss.profitMargin >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                      <h4 className={`text-lg font-semibold mb-2 ${reportData.profitLoss.profitMargin >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                        Marge Bénéficiaire
                      </h4>
                      <p className={`text-3xl font-bold ${reportData.profitLoss.profitMargin >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                        {reportData.profitLoss.profitMargin.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'revenue' && reportData && (
            <div className="space-y-6">
              {/* Revenue Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse des Revenus</h3>
                
                {/* Revenue Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Total Revenus</span>
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      ${reportData.revenue.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Revenus Payés</span>
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

                {/* Revenue by Client */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Revenus par Client
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.revenue.byClient.slice(0, 10).map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.client}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                ${item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-500">
                                {item.percentage.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Revenue by Site */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Revenus par Site
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.revenue.bySite.slice(0, 10).map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {item.site}
                                <div className="text-xs text-gray-500">{item.client}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                ${item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-500">
                                {item.percentage.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'expenses' && reportData && (
            <div className="space-y-6">
              {/* Expense Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse des Dépenses</h3>
                
                {/* Total Expenses Card */}
                <div className="bg-red-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-red-800">Total des Dépenses</h4>
                      <p className="text-3xl font-bold text-red-900 mt-2">
                        ${reportData.expenses.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <TrendingDown className="w-12 h-12 text-red-600" />
                  </div>
                </div>

                {/* Expenses by Category */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Dépenses par Catégorie</h4>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.expenses.byCategory.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.category}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                ${item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-500">
                                {item.percentage.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Monthly Expense Trend */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Tendance Mensuelle</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="space-y-3">
                        {reportData.expenses.byMonth.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{item.month}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-red-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min((item.amount / Math.max(...reportData.expenses.byMonth.map(m => m.amount))) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-20 text-right">
                                ${item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'kpis' && reportData && (
            <div className="space-y-6">
              {/* KPIs Dashboard */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicateurs Clés de Performance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-blue-900">Valeur Moyenne Facture</h4>
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-900">
                      ${reportData.kpis.averageInvoiceValue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-blue-700 mt-2">Par facture émise</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-green-900">Taux de Recouvrement</h4>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-900">
                      {reportData.kpis.collectionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-green-700 mt-2">Factures payées</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-orange-900">Ratio Dépenses</h4>
                      <TrendingDown className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-orange-900">
                      {reportData.kpis.expenseRatio.toFixed(1)}%
                    </p>
                    <p className="text-sm text-orange-700 mt-2">Des revenus totaux</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-purple-900">Marge Nette</h4>
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-900">
                      {reportData.cashFlow.netMargin.toFixed(1)}%
                    </p>
                    <p className="text-sm text-purple-700 mt-2">Flux de trésorerie</p>
                  </div>
                </div>

                {/* Performance Analysis */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Analyse de Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-md font-medium text-gray-700 mb-3">Santé Financière</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Liquidité</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            reportData.cashFlow.balance > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {reportData.cashFlow.balance > 0 ? 'Positive' : 'Négative'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Rentabilité</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            reportData.profitLoss.profitMargin > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {reportData.profitLoss.profitMargin > 0 ? 'Profitable' : 'Déficitaire'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Recouvrement</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            reportData.kpis.collectionRate > 80 ? 'bg-green-100 text-green-800' : 
                            reportData.kpis.collectionRate > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {reportData.kpis.collectionRate > 80 ? 'Excellent' : 
                             reportData.kpis.collectionRate > 60 ? 'Bon' : 'À améliorer'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-md font-medium text-gray-700 mb-3">Recommandations</h5>
                      <div className="space-y-2">
                        {reportData.kpis.collectionRate < 80 && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <span className="text-sm text-gray-600">Améliorer le suivi des paiements clients</span>
                          </div>
                        )}
                        {reportData.kpis.expenseRatio > 70 && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                            <span className="text-sm text-gray-600">Optimiser la structure des coûts</span>
                          </div>
                        )}
                        {reportData.profitLoss.profitMargin < 10 && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                            <span className="text-sm text-gray-600">Réviser la stratégie de pricing</span>
                          </div>
                        )}
                        {reportData.cashFlow.balance < 0 && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                            <span className="text-sm text-gray-600">Améliorer la gestion de trésorerie</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
