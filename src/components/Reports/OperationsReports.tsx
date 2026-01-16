import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Users, Clock, Download, Filter } from 'lucide-react';

interface OperationsStats {
  totalSites: number;
  activeSites: number;
  totalGuardsDeployed: number;
  sitesFullyCovered: number;
  sitesUnderstaffed: number;
  roteursActive: number;
  averageGuardsPerSite: number;
  deploymentsBySite: { site_nom: string; guards_count: number; required: number }[];
  roteurAssignments: { roteur_nom: string; site_nom: string; days: number }[];
}

export default function OperationsReports() {
  const [stats, setStats] = useState<OperationsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadOperationsStats();
  }, [dateRange]);

  const loadOperationsStats = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const data = await window.electronAPI.getOperationsReportStats(dateRange);
      setStats(data);
    } catch (error) {
      console.error('Error loading operations stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Du:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Au:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => alert('Export fonctionnalité à venir')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Exporter Excel
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sites Actifs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeSites}</p>
              <p className="text-xs text-gray-500 mt-1">sur {stats.totalSites} total</p>
            </div>
            <MapPin className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gardes Déployés</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalGuardsDeployed}</p>
            </div>
            <Shield className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Couverture Complète</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.sitesFullyCovered}</p>
              <p className="text-xs text-gray-500 mt-1">sites</p>
            </div>
            <Users className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rôteurs Actifs</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.roteursActive}</p>
            </div>
            <Clock className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Site Coverage */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Couverture par Site</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Gardes Déployés</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Requis</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.deploymentsBySite.map((site, index) => {
                const isFull = site.guards_count >= site.required;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{site.site_nom}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">{site.guards_count}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">{site.required}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isFull ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isFull ? 'Complet' : 'Sous-effectif'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roteur Activity */}
      {stats.roteurAssignments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité des Rôteurs</h3>
          <div className="space-y-2">
            {stats.roteurAssignments.map((assignment, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{assignment.roteur_nom}</p>
                  <p className="text-xs text-gray-500">{assignment.site_nom}</p>
                </div>
                <span className="text-sm text-gray-600">{assignment.days} jours</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
