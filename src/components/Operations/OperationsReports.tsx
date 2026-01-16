import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  Download, 
  Calendar,
  Shield,
  Truck,
  AlertTriangle,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface OperationsReportData {
  siteCoverage: {
    totalSites: number;
    activeSites: number;
    totalGuards: number;
    averageGuardsPerSite: number;
    bySite: { site: string; guards: number }[];
  };
  guardPerformance: {
    totalGuards: number;
    onDuty: number;
    offDuty: number;
    byStatus: { status: string; count: number }[];
  };
  roteurUtilization: {
    totalRoteurs: number;
    activeRoteurs: number;
    utilizationRate: number;
    averageAssignments: number;
  };
  fleet: {
    totalVehicles: number;
    operational: number;
    maintenance: number;
    byType: { type: string; count: number }[];
  };
  incidents: {
    total: number;
    resolved: number;
    pending: number;
    bySeverity: { severity: string; count: number }[];
  };
}

export default function OperationsReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<OperationsReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<'coverage' | 'guards' | 'roteurs' | 'fleet' | 'incidents'>('coverage');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const [employees, sites, deployments, vehicles] = await Promise.all([
        window.electronAPI.getEmployeesGAS(),
        window.electronAPI.getSites(),
        window.electronAPI.getDeployments ? window.electronAPI.getDeployments() : Promise.resolve([]),
        window.electronAPI.getVehicles ? window.electronAPI.getVehicles() : Promise.resolve([])
      ]);

      // Filter guards and roteurs
      const guards = employees.filter((emp: any) => emp.categorie === 'GARDE' && emp.poste === 'GARDE');
      const roteurs = employees.filter((emp: any) => emp.categorie === 'GARDE' && emp.poste === 'ROTEUR');

      // Filter active deployments
      const activeDeployments = deployments.filter((dep: any) => !dep.date_fin);

      // Site coverage
      const activeSites = sites.filter((site: any) => site.statut === 'ACTIF').length;
      const guardsBySite = activeDeployments.reduce((acc: any, dep: any) => {
        const site = dep.site_nom || 'Non défini';
        if (!acc[site]) acc[site] = 0;
        acc[site]++;
        return acc;
      }, {});

      const averageGuardsPerSite = activeSites > 0 ? activeDeployments.length / activeSites : 0;

      // Guard performance
      const onDutyGuards = activeDeployments.length;
      const offDutyGuards = guards.length - onDutyGuards;

      const guardsByStatus = guards.reduce((acc: any, guard: any) => {
        const status = guard.statut || 'Autre';
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
      }, {});

      // Roteur utilization
      const activeRoteurs = roteurs.filter((r: any) => r.statut === 'ACTIF').length;
      const utilizationRate = roteurs.length > 0 ? (activeRoteurs / roteurs.length) * 100 : 0;
      const averageAssignments = roteurs.length > 0 ? activeDeployments.length / roteurs.length : 0;

      // Fleet statistics
      const operationalVehicles = vehicles.filter((v: any) => v.statut === 'OPERATIONNEL').length;
      const maintenanceVehicles = vehicles.filter((v: any) => v.statut === 'EN_MAINTENANCE').length;

      const vehiclesByType = vehicles.reduce((acc: any, vehicle: any) => {
        const type = vehicle.type || 'Autre';
        if (!acc[type]) acc[type] = 0;
        acc[type]++;
        return acc;
      }, {});

      // Incidents (placeholder - would need incidents table)
      const incidents = {
        total: 0,
        resolved: 0,
        pending: 0,
        bySeverity: []
      };

      setReportData({
        siteCoverage: {
          totalSites: sites.length,
          activeSites,
          totalGuards: activeDeployments.length,
          averageGuardsPerSite,
          bySite: Object.entries(guardsBySite).map(([site, guards]) => ({ site, guards: guards as number }))
        },
        guardPerformance: {
          totalGuards: guards.length,
          onDuty: onDutyGuards,
          offDuty: offDutyGuards,
          byStatus: Object.entries(guardsByStatus).map(([status, count]) => ({ status, count: count as number }))
        },
        roteurUtilization: {
          totalRoteurs: roteurs.length,
          activeRoteurs,
          utilizationRate,
          averageAssignments
        },
        fleet: {
          totalVehicles: vehicles.length,
          operational: operationalVehicles,
          maintenance: maintenanceVehicles,
          byType: Object.entries(vehiclesByType).map(([type, count]) => ({ type, count: count as number }))
        },
        incidents
      });
    } catch (error) {
      console.error('Error loading operations report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Site Coverage sheet
    const coverageData = [
      ['Rapport Opérations - Couverture des Sites'],
      ['Période', `${dateRange.startDate} - ${dateRange.endDate}`],
      [''],
      ['STATISTIQUES GÉNÉRALES'],
      ['Total Sites', reportData.siteCoverage.totalSites],
      ['Sites Actifs', reportData.siteCoverage.activeSites],
      ['Total Gardes Déployés', reportData.siteCoverage.totalGuards],
      ['Moyenne Gardes/Site', reportData.siteCoverage.averageGuardsPerSite.toFixed(2)],
      [''],
      ['PAR SITE'],
      ['Site', 'Nombre de Gardes'],
      ...reportData.siteCoverage.bySite.map(item => [item.site, item.guards])
    ];
    const wsCoverage = XLSX.utils.aoa_to_sheet(coverageData);
    XLSX.utils.book_append_sheet(wb, wsCoverage, 'Couverture Sites');

    // Guard Performance sheet
    const guardsData = [
      ['Performance des Gardes'],
      ['Total Gardes', reportData.guardPerformance.totalGuards],
      ['En Service', reportData.guardPerformance.onDuty],
      ['Hors Service', reportData.guardPerformance.offDuty],
      [''],
      ['PAR STATUT'],
      ['Statut', 'Nombre'],
      ...reportData.guardPerformance.byStatus.map(item => [item.status, item.count])
    ];
    const wsGuards = XLSX.utils.aoa_to_sheet(guardsData);
    XLSX.utils.book_append_sheet(wb, wsGuards, 'Gardes');

    // Roteur Utilization sheet
    const roteursData = [
      ['Utilisation des Rôteurs'],
      ['Total Rôteurs', reportData.roteurUtilization.totalRoteurs],
      ['Rôteurs Actifs', reportData.roteurUtilization.activeRoteurs],
      ['Taux d\'Utilisation', `${reportData.roteurUtilization.utilizationRate.toFixed(1)}%`],
      ['Moyenne Affectations', reportData.roteurUtilization.averageAssignments.toFixed(2)]
    ];
    const wsRoteurs = XLSX.utils.aoa_to_sheet(roteursData);
    XLSX.utils.book_append_sheet(wb, wsRoteurs, 'Rôteurs');

    // Fleet sheet
    const fleetData = [
      ['Parc Automobile'],
      ['Total Véhicules', reportData.fleet.totalVehicles],
      ['Opérationnels', reportData.fleet.operational],
      ['En Maintenance', reportData.fleet.maintenance],
      [''],
      ['PAR TYPE'],
      ['Type', 'Nombre'],
      ...reportData.fleet.byType.map(item => [item.type, item.count])
    ];
    const wsFleet = XLSX.utils.aoa_to_sheet(fleetData);
    XLSX.utils.book_append_sheet(wb, wsFleet, 'Parc Auto');

    XLSX.writeFile(wb, `Rapport_Operations_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
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
            <h2 className="text-xl font-bold text-gray-900">Rapports Opérations</h2>
            <p className="text-sm text-gray-600 mt-1">Analyse de la couverture, performance et ressources</p>
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
              { id: 'coverage', label: 'Couverture Sites', icon: MapPin },
              { id: 'guards', label: 'Performance Gardes', icon: Shield },
              { id: 'roteurs', label: 'Utilisation Rôteurs', icon: Users },
              { id: 'fleet', label: 'Parc Automobile', icon: Truck },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle }
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
          {selectedReport === 'coverage' && reportData && (
            <div className="space-y-6">
              {/* Coverage Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Sites</span>
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.siteCoverage.totalSites}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Sites Actifs</span>
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.siteCoverage.activeSites}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Gardes Déployés</span>
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{reportData.siteCoverage.totalGuards}</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700">Moy. Gardes/Site</span>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {reportData.siteCoverage.averageGuardsPerSite.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* By Site */}
              {reportData.siteCoverage.bySite.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gardes par Site</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre de Gardes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.siteCoverage.bySite.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.site}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.guards}
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

          {selectedReport === 'guards' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance des Gardes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Gardes</span>
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.guardPerformance.totalGuards}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">En Service</span>
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.guardPerformance.onDuty}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Hors Service</span>
                    <Shield className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{reportData.guardPerformance.offDuty}</p>
                </div>
              </div>

              {reportData.guardPerformance.byStatus.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Statut</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.guardPerformance.byStatus.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.status}
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

          {selectedReport === 'roteurs' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Utilisation des Rôteurs</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Rôteurs</span>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.roteurUtilization.totalRoteurs}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Actifs</span>
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.roteurUtilization.activeRoteurs}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Taux d'Utilisation</span>
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportData.roteurUtilization.utilizationRate.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700">Moy. Affectations</span>
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {reportData.roteurUtilization.averageAssignments.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Le taux d'utilisation représente le pourcentage de rôteurs actuellement actifs. 
                  La moyenne d'affectations indique le nombre moyen de déploiements par rôteur.
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'fleet' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Parc Automobile</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Véhicules</span>
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.fleet.totalVehicles}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Opérationnels</span>
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.fleet.operational}</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700">En Maintenance</span>
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{reportData.fleet.maintenance}</p>
                </div>
              </div>

              {reportData.fleet.byType.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Type de Véhicule</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.fleet.byType.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.type}
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

          {selectedReport === 'incidents' && (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Rapport des incidents en cours de développement...</p>
              <p className="text-sm mt-2">Nécessite l'ajout d'une table d'incidents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
