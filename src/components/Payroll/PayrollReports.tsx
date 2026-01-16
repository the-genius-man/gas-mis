import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Download, 
  Filter,
  Calendar,
  Users,
  PieChart,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface PayrollReportData {
  summary: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    totalSocialCharges: number;
    totalIPR: number;
  };
  byCategory: {
    category: string;
    count: number;
    grossSalary: number;
    netSalary: number;
  }[];
  socialCharges: {
    cnss: number;
    onem: number;
    inpp: number;
    total: number;
  };
  iprBreakdown: {
    totalTaxable: number;
    totalIPR: number;
    averageRate: number;
  };
  advances: {
    totalAdvances: number;
    totalRepaid: number;
    remaining: number;
  };
}

export default function PayrollReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<PayrollReportData | null>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<'summary' | 'social' | 'tax' | 'advances'>('summary');

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadReportData();
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    if (!window.electronAPI) return;
    
    try {
      const data = await window.electronAPI.getPayrollPeriods();
      setPeriods(data);
      if (data.length > 0) {
        setSelectedPeriod(data[0].id);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const loadReportData = async () => {
    if (!window.electronAPI || !selectedPeriod) return;
    
    setLoading(true);
    try {
      const payslips = await window.electronAPI.getPayslips(selectedPeriod);
      
      // Calculate summary
      const totalEmployees = payslips.length;
      const totalGrossSalary = payslips.reduce((sum: number, p: any) => sum + (p.salaire_brut || 0), 0);
      const totalDeductions = payslips.reduce((sum: number, p: any) => sum + (p.total_retenues || 0), 0);
      const totalNetSalary = payslips.reduce((sum: number, p: any) => sum + (p.salaire_net || 0), 0);
      const totalSocialCharges = payslips.reduce((sum: number, p: any) => sum + (p.total_retenues_sociales || 0), 0);
      const totalIPR = payslips.reduce((sum: number, p: any) => sum + (p.ipr || 0), 0);

      // Group by category
      const byCategory = payslips.reduce((acc: any, p: any) => {
        const cat = p.categorie || 'Autre';
        if (!acc[cat]) {
          acc[cat] = { category: cat, count: 0, grossSalary: 0, netSalary: 0 };
        }
        acc[cat].count++;
        acc[cat].grossSalary += p.salaire_brut || 0;
        acc[cat].netSalary += p.salaire_net || 0;
        return acc;
      }, {});

      // Social charges
      const cnss = payslips.reduce((sum: number, p: any) => sum + (p.cnss || 0), 0);
      const onem = payslips.reduce((sum: number, p: any) => sum + (p.onem || 0), 0);
      const inpp = payslips.reduce((sum: number, p: any) => sum + (p.inpp || 0), 0);

      // IPR breakdown
      const totalTaxable = payslips.reduce((sum: number, p: any) => sum + (p.salaire_imposable || 0), 0);
      const averageRate = totalTaxable > 0 ? (totalIPR / totalTaxable) * 100 : 0;

      // Advances
      const totalAdvances = payslips.reduce((sum: number, p: any) => sum + (p.avances || 0), 0);

      setReportData({
        summary: {
          totalEmployees,
          totalGrossSalary,
          totalDeductions,
          totalNetSalary,
          totalSocialCharges,
          totalIPR
        },
        byCategory: Object.values(byCategory),
        socialCharges: {
          cnss,
          onem,
          inpp,
          total: cnss + onem + inpp
        },
        iprBreakdown: {
          totalTaxable,
          totalIPR,
          averageRate
        },
        advances: {
          totalAdvances,
          totalRepaid: 0, // TODO: Calculate from repayments
          remaining: totalAdvances
        }
      });
    } catch (error) {
      console.error('Error loading payroll report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const selectedPeriodData = periods.find(p => p.id === selectedPeriod);
    const periodName = selectedPeriodData ? `${getMonthName(selectedPeriodData.mois)} ${selectedPeriodData.annee}` : 'Période';

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Rapport de Paie'],
      ['Période', periodName],
      [''],
      ['RÉSUMÉ'],
      ['Nombre d\'employés', reportData.summary.totalEmployees],
      ['Salaire Brut Total', reportData.summary.totalGrossSalary],
      ['Retenues Totales', reportData.summary.totalDeductions],
      ['Salaire Net Total', reportData.summary.totalNetSalary],
      [''],
      ['CHARGES SOCIALES'],
      ['CNSS', reportData.socialCharges.cnss],
      ['ONEM', reportData.socialCharges.onem],
      ['INPP', reportData.socialCharges.inpp],
      ['Total', reportData.socialCharges.total],
      [''],
      ['IMPÔT (IPR)'],
      ['Salaire Imposable Total', reportData.iprBreakdown.totalTaxable],
      ['IPR Total', reportData.iprBreakdown.totalIPR],
      ['Taux Moyen', `${reportData.iprBreakdown.averageRate.toFixed(2)}%`]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

    // By category sheet
    const categoryData = [
      ['Catégorie', 'Nombre', 'Salaire Brut', 'Salaire Net'],
      ...reportData.byCategory.map(item => [
        item.category,
        item.count,
        item.grossSalary,
        item.netSalary
      ])
    ];
    const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Par Catégorie');

    XLSX.writeFile(wb, `Rapport_Paie_${periodName.replace(' ', '_')}.xlsx`);
  };

  const getMonthName = (month: number) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month - 1];
  };

  if (loading && selectedPeriod) {
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
            <h2 className="text-xl font-bold text-gray-900">Rapports de Paie</h2>
            <p className="text-sm text-gray-600 mt-1">Analyse des salaires, cotisations et impôts</p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={!reportData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exporter Excel
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Période:</label>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {getMonthName(period.mois)} {period.annee}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPeriod ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Sélectionnez une période pour voir les rapports</p>
        </div>
      ) : (
        <>
          {/* Report Type Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'summary', label: 'Résumé', icon: FileText },
                  { id: 'social', label: 'Charges Sociales', icon: PieChart },
                  { id: 'tax', label: 'Impôts (IPR)', icon: DollarSign },
                  { id: 'advances', label: 'Avances', icon: Briefcase }
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
              {selectedReport === 'summary' && reportData && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Employés</span>
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{reportData.summary.totalEmployees}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">Salaire Brut Total</span>
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        ${reportData.summary.totalGrossSalary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700">Salaire Net Total</span>
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        ${reportData.summary.totalNetSalary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Retenues</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Charges Sociales</span>
                          <span className="text-sm font-medium text-gray-900">
                            ${reportData.summary.totalSocialCharges.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">IPR</span>
                          <span className="text-sm font-medium text-gray-900">
                            ${reportData.summary.totalIPR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-900">Total Retenues</span>
                          <span className="text-sm font-bold text-gray-900">
                            ${reportData.summary.totalDeductions.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Catégorie</h3>
                      <div className="space-y-3">
                        {reportData.byCategory.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{item.category}</span>
                              <span className="text-xs text-gray-500 ml-2">({item.count} employés)</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              ${item.netSalary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport === 'social' && reportData && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Charges Sociales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-700 mb-2">CNSS</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${reportData.socialCharges.cnss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-700 mb-2">ONEM</p>
                      <p className="text-2xl font-bold text-green-900">
                        ${reportData.socialCharges.onem.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-700 mb-2">INPP</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ${reportData.socialCharges.inpp.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-sm font-medium text-white mb-2">TOTAL</p>
                      <p className="text-2xl font-bold text-white">
                        ${reportData.socialCharges.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Ces montants représentent les cotisations sociales retenues sur les salaires des employés. 
                      Ils doivent être versés aux organismes concernés (CNSS, ONEM, INPP).
                    </p>
                  </div>
                </div>
              )}

              {selectedReport === 'tax' && reportData && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Impôt Professionnel sur les Rémunérations (IPR)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Salaire Imposable Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${reportData.iprBreakdown.totalTaxable.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">IPR Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${reportData.iprBreakdown.totalIPR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Taux Moyen</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.iprBreakdown.averageRate.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> L'IPR est calculé selon le barème progressif de la RDC. 
                      Le taux moyen représente le pourcentage effectif d'imposition sur l'ensemble des salaires imposables.
                    </p>
                  </div>
                </div>
              )}

              {selectedReport === 'advances' && reportData && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Avances sur Salaire</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-orange-700 mb-2">Total Retenu</p>
                      <p className="text-2xl font-bold text-orange-900">
                        ${reportData.advances.totalAdvances.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-700 mb-2">Remboursé</p>
                      <p className="text-2xl font-bold text-green-900">
                        ${reportData.advances.totalRepaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-700 mb-2">Restant</p>
                      <p className="text-2xl font-bold text-red-900">
                        ${reportData.advances.remaining.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
