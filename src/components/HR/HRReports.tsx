import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Download, 
  UserCheck,
  UserX,
  Award,
  MapPin,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface HRReportData {
  employees: {
    total: number;
    byCategory: { category: string; count: number }[];
    byPoste: { poste: string; count: number }[];
    active: number;
    inactive: number;
  };
  leave: {
    totalRequests: number;
    approved: number;
    pending: number;
    rejected: number;
    byType: { type: string; count: number; days: number }[];
  };
  deployments: {
    totalActive: number;
    bySite: { site: string; count: number }[];
    averageDuration: number;
  };
  certifications: {
    total: number;
    expiringSoon: number;
    expired: number;
    byType: { type: string; count: number }[];
  };
}

export default function HRReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<HRReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<'employees' | 'leave' | 'deployments' | 'certifications'>('employees');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const [employees, leaveRequests, deployments] = await Promise.all([
        window.electronAPI.getEmployeesGAS(),
        window.electronAPI.getLeaveRequests ? window.electronAPI.getLeaveRequests() : Promise.resolve([]),
        window.electronAPI.getDeployments ? window.electronAPI.getDeployments() : Promise.resolve([])
      ]);

      // Filter leave requests by date range
      const filteredLeave = leaveRequests.filter((req: any) => {
        const reqDate = new Date(req.date_debut);
        return reqDate >= new Date(dateRange.startDate) && reqDate <= new Date(dateRange.endDate);
      });

      // Employee statistics
      const activeEmployees = employees.filter((emp: any) => emp.statut === 'ACTIF').length;
      const inactiveEmployees = employees.filter((emp: any) => emp.statut !== 'ACTIF').length;

      // Group by category
      const byCategory = employees.reduce((acc: any, emp: any) => {
        const cat = emp.categorie || 'Autre';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat]++;
        return acc;
      }, {});

      // Group by poste
      const byPoste = employees.reduce((acc: any, emp: any) => {
        const poste = emp.poste || 'Non défini';
        if (!acc[poste]) acc[poste] = 0;
        acc[poste]++;
        return acc;
      }, {});

      // Leave statistics
      const approvedLeave = filteredLeave.filter((req: any) => req.statut === 'APPROUVE').length;
      const pendingLeave = filteredLeave.filter((req: any) => req.statut === 'EN_ATTENTE').length;
      const rejectedLeave = filteredLeave.filter((req: any) => req.statut === 'REJETE').length;

      // Group leave by type
      const leaveByType = filteredLeave.reduce((acc: any, req: any) => {
        const type = req.type_conge || 'Autre';
        if (!acc[type]) acc[type] = { count: 0, days: 0 };
        acc[type].count++;
        acc[type].days += req.nombre_jours || 0;
        return acc;
      }, {});

      // Deployment statistics
      const activeDeployments = deployments.filter((dep: any) => !dep.date_fin).length;
      const deploymentsBySite = deployments.reduce((acc: any, dep: any) => {
        const site = dep.site_nom || 'Non défini';
        if (!acc[site]) acc[site] = 0;
        acc[site]++;
        return acc;
      }, {});

      // Calculate average deployment duration
      const completedDeployments = deployments.filter((dep: any) => dep.date_fin);
      const totalDuration = completedDeployments.reduce((sum: number, dep: any) => {
        const start = new Date(dep.date_debut);
        const end = new Date(dep.date_fin);
        return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      const averageDuration = completedDeployments.length > 0 ? totalDuration / completedDeployments.length : 0;

      // Certification statistics (placeholder - would need certifications table)
      const certifications = {
        total: 0,
        expiringSoon: 0,
        expired: 0,
        byType: []
      };

      setReportData({
        employees: {
          total: employees.length,
          byCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count: count as number })),
          byPoste: Object.entries(byPoste).map(([poste, count]) => ({ poste, count: count as number })),
          active: activeEmployees,
          inactive: inactiveEmployees
        },
        leave: {
          totalRequests: filteredLeave.length,
          approved: approvedLeave,
          pending: pendingLeave,
          rejected: rejectedLeave,
          byType: Object.entries(leaveByType).map(([type, data]: [string, any]) => ({
            type,
            count: data.count,
            days: data.days
          }))
        },
        deployments: {
          totalActive: activeDeployments,
          bySite: Object.entries(deploymentsBySite).map(([site, count]) => ({ site, count: count as number })),
          averageDuration
        },
        certifications
      });
    } catch (error) {
      console.error('Error loading HR report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Employees sheet
    const employeesData = [
      ['Rapport RH - Employés'],
      ['Période', `${dateRange.startDate} - ${dateRange.endDate}`],
      [''],
      ['STATISTIQUES GÉNÉRALES'],
      ['Total Employés', reportData.employees.total],
      ['Actifs', reportData.employees.active],
      ['Inactifs', reportData.employees.inactive],
      [''],
      ['PAR CATÉGORIE'],
      ['Catégorie', 'Nombre'],
      ...reportData.employees.byCategory.map(item => [item.category, item.count]),
      [''],
      ['PAR POSTE'],
      ['Poste', 'Nombre'],
      ...reportData.employees.byPoste.map(item => [item.poste, item.count])
    ];
    const wsEmployees = XLSX.utils.aoa_to_sheet(employeesData);
    XLSX.utils.book_append_sheet(wb, wsEmployees, 'Employés');

    // Leave sheet
    const leaveData = [
      ['Congés'],
      ['Total Demandes', reportData.leave.totalRequests],
      ['Approuvées', reportData.leave.approved],
      ['En Attente', reportData.leave.pending],
      ['Rejetées', reportData.leave.rejected],
      [''],
      ['PAR TYPE'],
      ['Type', 'Nombre', 'Jours'],
      ...reportData.leave.byType.map(item => [item.type, item.count, item.days])
    ];
    const wsLeave = XLSX.utils.aoa_to_sheet(leaveData);
    XLSX.utils.book_append_sheet(wb, wsLeave, 'Congés');

    // Deployments sheet
    const deploymentsData = [
      ['Déploiements'],
      ['Actifs', reportData.deployments.totalActive],
      ['Durée Moyenne (jours)', reportData.deployments.averageDuration.toFixed(1)],
      [''],
      ['PAR SITE'],
      ['Site', 'Nombre'],
      ...reportData.deployments.bySite.map(item => [item.site, item.count])
    ];
    const wsDeployments = XLSX.utils.aoa_to_sheet(deploymentsData);
    XLSX.utils.book_append_sheet(wb, wsDeployments, 'Déploiements');

    XLSX.writeFile(wb, `Rapport_RH_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
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
            <h2 className="text-xl font-bold text-gray-900">Rapports RH</h2>
            <p className="text-sm text-gray-600 mt-1">Analyse des employés, congés et déploiements</p>
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
              { id: 'employees', label: 'Employés', icon: Users },
              { id: 'leave', label: 'Congés', icon: Calendar },
              { id: 'deployments', label: 'Déploiements', icon: MapPin },
              { id: 'certifications', label: 'Certifications', icon: Award }
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
          {selectedReport === 'employees' && reportData && (
            <div className="space-y-6">
              {/* Employee Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Employés</span>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.employees.total}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Actifs</span>
                    <UserCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.employees.active}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Inactifs</span>
                    <UserX className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{reportData.employees.inactive}</p>
                </div>
              </div>

              {/* By Category */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Catégorie</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% du Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.employees.byCategory.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {item.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {((item.count / reportData.employees.total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Poste */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Poste</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poste</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% du Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.employees.byPoste.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.poste}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {item.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {((item.count / reportData.employees.total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'leave' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Statistiques des Congés</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.leave.totalRequests}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 mb-1">Approuvées</p>
                  <p className="text-2xl font-bold text-green-900">{reportData.leave.approved}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-700 mb-1">En Attente</p>
                  <p className="text-2xl font-bold text-yellow-900">{reportData.leave.pending}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-700 mb-1">Rejetées</p>
                  <p className="text-2xl font-bold text-red-900">{reportData.leave.rejected}</p>
                </div>
              </div>

              {reportData.leave.byType.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Type de Congé</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Demandes</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jours Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.leave.byType.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.days}
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

          {selectedReport === 'deployments' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Statistiques des Déploiements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Déploiements Actifs</span>
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.deployments.totalActive}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Durée Moyenne (jours)</span>
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportData.deployments.averageDuration.toFixed(1)}
                  </p>
                </div>
              </div>

              {reportData.deployments.bySite.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Site</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.deployments.bySite.map((item, index) => (
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

          {selectedReport === 'certifications' && (
            <div className="text-center py-12 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Rapport des certifications en cours de développement...</p>
              <p className="text-sm mt-2">Nécessite l'ajout d'une table de certifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
