import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  Download, 
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Wrench,
  DollarSign,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryReportData {
  equipment: {
    total: number;
    available: number;
    assigned: number;
    damaged: number;
    byType: { type: string; count: number }[];
    byStatus: { status: string; count: number }[];
  };
  assignments: {
    totalActive: number;
    byEmployee: { employee: string; count: number }[];
    bySite: { site: string; count: number }[];
  };
  maintenance: {
    totalCost: number;
    totalInterventions: number;
    averageCost: number;
    byType: { type: string; cost: number; count: number }[];
  };
  lifecycle: {
    newEquipment: number;
    retired: number;
    averageAge: number;
  };
}

export default function InventoryReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<InventoryReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<'equipment' | 'assignments' | 'maintenance' | 'lifecycle'>('equipment');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const equipment = await window.electronAPI.getEquipment();

      // Equipment statistics
      const available = equipment.filter((eq: any) => eq.statut === 'DISPONIBLE').length;
      const assigned = equipment.filter((eq: any) => eq.statut === 'AFFECTE').length;
      const damaged = equipment.filter((eq: any) => eq.statut === 'ENDOMMAGE').length;

      // Group by type
      const byType = equipment.reduce((acc: any, eq: any) => {
        const type = eq.type || 'Autre';
        if (!acc[type]) acc[type] = 0;
        acc[type]++;
        return acc;
      }, {});

      // Group by status
      const byStatus = equipment.reduce((acc: any, eq: any) => {
        const status = eq.statut || 'Autre';
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
      }, {});

      // Assignment statistics
      const assignedEquipment = equipment.filter((eq: any) => eq.employe_id);
      const byEmployee = assignedEquipment.reduce((acc: any, eq: any) => {
        const employee = eq.employe_nom || 'Non défini';
        if (!acc[employee]) acc[employee] = 0;
        acc[employee]++;
        return acc;
      }, {});

      const bySite = assignedEquipment.reduce((acc: any, eq: any) => {
        const site = eq.site_nom || 'Non défini';
        if (!acc[site]) acc[site] = 0;
        acc[site]++;
        return acc;
      }, {});

      // Maintenance statistics (placeholder - would need maintenance records)
      const maintenance = {
        totalCost: 0,
        totalInterventions: 0,
        averageCost: 0,
        byType: []
      };

      // Lifecycle statistics
      const now = new Date();
      const startOfPeriod = new Date(dateRange.startDate);
      const endOfPeriod = new Date(dateRange.endDate);

      const newEquipment = equipment.filter((eq: any) => {
        const acqDate = new Date(eq.date_acquisition);
        return acqDate >= startOfPeriod && acqDate <= endOfPeriod;
      }).length;

      const retired = equipment.filter((eq: any) => eq.statut === 'RETIRE').length;

      // Calculate average age
      const totalAge = equipment.reduce((sum: number, eq: any) => {
        if (eq.date_acquisition) {
          const acqDate = new Date(eq.date_acquisition);
          const ageInDays = Math.floor((now.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + ageInDays;
        }
        return sum;
      }, 0);
      const averageAge = equipment.length > 0 ? totalAge / equipment.length : 0;

      setReportData({
        equipment: {
          total: equipment.length,
          available,
          assigned,
          damaged,
          byType: Object.entries(byType).map(([type, count]) => ({ type, count: count as number })),
          byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count: count as number }))
        },
        assignments: {
          totalActive: assignedEquipment.length,
          byEmployee: Object.entries(byEmployee)
            .map(([employee, count]) => ({ employee, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          bySite: Object.entries(bySite).map(([site, count]) => ({ site, count: count as number }))
        },
        maintenance,
        lifecycle: {
          newEquipment,
          retired,
          averageAge: averageAge / 365 // Convert to years
        }
      });
    } catch (error) {
      console.error('Error loading inventory report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Equipment sheet
    const equipmentData = [
      ['Rapport Inventaire - Équipements'],
      ['Période', `${dateRange.startDate} - ${dateRange.endDate}`],
      [''],
      ['STATISTIQUES GÉNÉRALES'],
      ['Total Équipements', reportData.equipment.total],
      ['Disponibles', reportData.equipment.available],
      ['Affectés', reportData.equipment.assigned],
      ['Endommagés', reportData.equipment.damaged],
      [''],
      ['PAR TYPE'],
      ['Type', 'Nombre'],
      ...reportData.equipment.byType.map(item => [item.type, item.count]),
      [''],
      ['PAR STATUT'],
      ['Statut', 'Nombre'],
      ...reportData.equipment.byStatus.map(item => [item.status, item.count])
    ];
    const wsEquipment = XLSX.utils.aoa_to_sheet(equipmentData);
    XLSX.utils.book_append_sheet(wb, wsEquipment, 'Équipements');

    // Assignments sheet
    const assignmentsData = [
      ['Affectations'],
      ['Total Actives', reportData.assignments.totalActive],
      [''],
      ['PAR EMPLOYÉ (Top 10)'],
      ['Employé', 'Nombre'],
      ...reportData.assignments.byEmployee.map(item => [item.employee, item.count]),
      [''],
      ['PAR SITE'],
      ['Site', 'Nombre'],
      ...reportData.assignments.bySite.map(item => [item.site, item.count])
    ];
    const wsAssignments = XLSX.utils.aoa_to_sheet(assignmentsData);
    XLSX.utils.book_append_sheet(wb, wsAssignments, 'Affectations');

    // Lifecycle sheet
    const lifecycleData = [
      ['Cycle de Vie'],
      ['Nouveaux Équipements', reportData.lifecycle.newEquipment],
      ['Retirés', reportData.lifecycle.retired],
      ['Âge Moyen (années)', reportData.lifecycle.averageAge.toFixed(1)]
    ];
    const wsLifecycle = XLSX.utils.aoa_to_sheet(lifecycleData);
    XLSX.utils.book_append_sheet(wb, wsLifecycle, 'Cycle de Vie');

    XLSX.writeFile(wb, `Rapport_Inventaire_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
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
            <h2 className="text-xl font-bold text-gray-900">Rapports Inventaire</h2>
            <p className="text-sm text-gray-600 mt-1">Analyse des équipements, affectations et maintenance</p>
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
              { id: 'equipment', label: 'Équipements', icon: Package },
              { id: 'assignments', label: 'Affectations', icon: FileText },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench },
              { id: 'lifecycle', label: 'Cycle de Vie', icon: TrendingUp }
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
          {selectedReport === 'equipment' && reportData && (
            <div className="space-y-6">
              {/* Equipment Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total</span>
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.equipment.total}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Disponibles</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.equipment.available}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Affectés</span>
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{reportData.equipment.assigned}</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">Endommagés</span>
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">{reportData.equipment.damaged}</p>
                </div>
              </div>

              {/* By Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Type d'Équipement</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% du Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.equipment.byType.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {item.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {((item.count / reportData.equipment.total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Statut</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% du Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.equipment.byStatus.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {item.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {((item.count / reportData.equipment.total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'assignments' && reportData && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Affectations Actives</span>
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">{reportData.assignments.totalActive}</p>
              </div>

              {reportData.assignments.byEmployee.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Employé (Top 10)</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Équipements</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.assignments.byEmployee.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.employee}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportData.assignments.bySite.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Site</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Équipements</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.assignments.bySite.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.site}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedReport === 'maintenance' && (
            <div className="text-center py-12 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Rapport de maintenance en cours de développement...</p>
              <p className="text-sm mt-2">Nécessite l'ajout d'un historique de maintenance</p>
            </div>
          )}

          {selectedReport === 'lifecycle' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Cycle de Vie des Équipements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Nouveaux (Période)</span>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.lifecycle.newEquipment}</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">Retirés</span>
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">{reportData.lifecycle.retired}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Âge Moyen (années)</span>
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {reportData.lifecycle.averageAge.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> L'âge moyen est calculé à partir de la date d'acquisition de chaque équipement. 
                  Les nouveaux équipements sont ceux acquis pendant la période sélectionnée.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
