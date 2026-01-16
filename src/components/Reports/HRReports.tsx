import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, UserCheck, UserX, Calendar, Download, Filter } from 'lucide-react';

interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  suspendedEmployees: number;
  terminatedEmployees: number;
  gardesCount: number;
  roteursCount: number;
  administrationCount: number;
  newHiresThisMonth: number;
  terminationsThisMonth: number;
  averageTenure: number;
  employeesByCategorie: { categorie: string; count: number }[];
  employeesByPoste: { poste: string; count: number }[];
  employeesBySite: { site_nom: string; count: number }[];
}

export default function HRReports() {
  const [stats, setStats] = useState<HRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadHRStats();
  }, [dateRange]);

  const loadHRStats = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const data = await window.electronAPI.getHRReportStats(dateRange);
      setStats(data);
    } catch (error) {
      console.error('Error loading HR stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // TODO: Implement Excel export
    alert('Export fonctionnalité à venir');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            onClick={exportReport}
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
              <p className="text-sm text-gray-600">Total Employés</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employés Actifs</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeEmployees}</p>
            </div>
            <UserCheck className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nouvelles Embauches</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.newHiresThisMonth}</p>
              <p className="text-xs text-gray-500 mt-1">Ce mois</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Départs</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.terminationsThisMonth}</p>
              <p className="text-xs text-gray-500 mt-1">Ce mois</p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Statut</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Actifs</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(stats.activeEmployees / stats.totalEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.activeEmployees}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Inactifs</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${(stats.inactiveEmployees / stats.totalEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.inactiveEmployees}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Suspendus</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${(stats.suspendedEmployees / stats.totalEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.suspendedEmployees}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Terminés</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(stats.terminatedEmployees / stats.totalEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.terminatedEmployees}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Catégorie</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gardes</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(stats.gardesCount / stats.totalEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.gardesCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rôteurs</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(stats.roteursCount / stats.totalEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.roteursCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Administration</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(stats.administrationCount / stats.totalEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{stats.administrationCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employés par Poste</h3>
          <div className="space-y-2">
            {stats.employeesByPoste.map((item) => (
              <div key={item.poste} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">{item.poste.replace('_', ' ')}</span>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employés par Site</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.employeesBySite.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">{item.site_nom || 'Non affecté'}</span>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques Additionnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Ancienneté Moyenne</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.averageTenure} mois</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Taux de Rotation</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalEmployees > 0 ? ((stats.terminationsThisMonth / stats.totalEmployees) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Ce mois</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Taux de Croissance</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.totalEmployees > 0 ? (((stats.newHiresThisMonth - stats.terminationsThisMonth) / stats.totalEmployees) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Ce mois</p>
          </div>
        </div>
      </div>
    </div>
  );
}
