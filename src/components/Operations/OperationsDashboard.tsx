import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Shield, 
  Activity,
  CheckCircle,
  XCircle,
  Calendar,
  Truck,
  RefreshCw
} from 'lucide-react';

interface DashboardMetrics {
  siteCoverage: {
    totalSites: number;
    coveredSites: number;
    uncoveredSites: number;
    coveragePercentage: number;
    criticalGaps: number;
  };
  guardStatus: {
    totalGuards: number;
    onDuty: number;
    offDuty: number;
    available: number;
    unavailable: number;
  };
  roteurUtilization: {
    totalRoteurs: number;
    activeRoteurs: number;
    utilizationRate: number;
    weeklyAssignments: number;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'deployment' | 'incident' | 'rotation' | 'maintenance';
    message: string;
    timestamp: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

const OperationsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      if (!window.electronAPI) return;
      
      const [sites, employees, deployments, roteurAssignments] = await Promise.all([
        window.electronAPI.getSitesGAS(),
        window.electronAPI.getEmployeesGAS(),
        window.electronAPI.getDeploymentHistory(),
        window.electronAPI.getRoteurAssignments()
      ]);

      // Calculate site coverage
      const activeSites = sites?.filter((s: any) => s.est_actif) || [];
      const activeDeployments = deployments?.filter((d: any) => !d.date_fin) || [];
      const coveredSiteIds = new Set(activeDeployments.map((d: any) => d.site_id));
      const uncoveredSites = activeSites.filter((s: any) => !coveredSiteIds.has(s.id));
      
      // Calculate guard status
      const guards = employees?.filter((e: any) => e.categorie === 'GARDE' && e.poste === 'GARDE') || [];
      const onDutyGuards = activeDeployments.length;
      const availableGuards = guards.filter((g: any) => g.statut === 'ACTIF').length - onDutyGuards;

      // Calculate roteur utilization
      const roteurs = employees?.filter((e: any) => e.categorie === 'GARDE' && e.poste === 'ROTEUR') || [];
      const activeRoteurAssignments = roteurAssignments?.filter((r: any) => r.statut === 'EN_COURS' || r.statut === 'PLANIFIE') || [];
      const weeklyAssignments = activeRoteurAssignments.reduce((total: number, assignment: any) => {
        return total + (assignment.weekly_assignments?.length || 1);
      }, 0);

      // Generate alerts
      const criticalGaps = uncoveredSites.filter((s: any) => s.effectif_jour_requis + s.effectif_nuit_requis > 0).length;
      const alerts = {
        critical: criticalGaps,
        warning: Math.max(0, guards.filter((g: any) => g.statut !== 'ACTIF').length),
        info: activeRoteurAssignments.length,
        total: criticalGaps + Math.max(0, guards.filter((g: any) => g.statut !== 'ACTIF').length) + activeRoteurAssignments.length
      };

      // Generate recent activity (mock data for now)
      const recentActivity = [
        {
          id: '1',
          type: 'deployment' as const,
          message: 'Nouveau déploiement: Agent Smith affecté au Site Alpha',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          priority: 'medium' as const
        },
        {
          id: '2',
          type: 'rotation' as const,
          message: 'Rotation programmée: Rôteur Johnson pour 3 sites cette semaine',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          priority: 'low' as const
        },
        {
          id: '3',
          type: 'incident' as const,
          message: 'Alerte: Site Beta sans couverture depuis 2 heures',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          priority: 'high' as const
        }
      ];

      setMetrics({
        siteCoverage: {
          totalSites: activeSites.length,
          coveredSites: coveredSiteIds.size,
          uncoveredSites: uncoveredSites.length,
          coveragePercentage: activeSites.length > 0 ? Math.round((coveredSiteIds.size / activeSites.length) * 100) : 0,
          criticalGaps
        },
        guardStatus: {
          totalGuards: guards.length,
          onDuty: onDutyGuards,
          offDuty: guards.length - onDutyGuards,
          available: availableGuards,
          unavailable: guards.filter((g: any) => g.statut !== 'ACTIF').length
        },
        roteurUtilization: {
          totalRoteurs: roteurs.length,
          activeRoteurs: activeRoteurAssignments.length,
          utilizationRate: roteurs.length > 0 ? Math.round((activeRoteurAssignments.length / roteurs.length) * 100) : 0,
          weeklyAssignments
        },
        alerts,
        recentActivity
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deployment': return <Users className="w-4 h-4" />;
      case 'rotation': return <RefreshCw className="w-4 h-4" />;
      case 'incident': return <AlertTriangle className="w-4 h-4" />;
      case 'maintenance': return <Truck className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Impossible de charger les données du tableau de bord</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord Opérations</h2>
          <p className="text-sm text-gray-500">
            Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Actualisation auto
          </label>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Site Coverage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Couverture Sites</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.siteCoverage.coveragePercentage}%</p>
              <p className="text-xs text-gray-500">
                {metrics.siteCoverage.coveredSites}/{metrics.siteCoverage.totalSites} sites couverts
              </p>
            </div>
            <div className={`p-3 rounded-full ${metrics.siteCoverage.criticalGaps > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <MapPin className={`w-6 h-6 ${metrics.siteCoverage.criticalGaps > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
          {metrics.siteCoverage.criticalGaps > 0 && (
            <div className="mt-3 flex items-center gap-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{metrics.siteCoverage.criticalGaps} gap(s) critique(s)</span>
            </div>
          )}
        </div>

        {/* Guard Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gardes Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.guardStatus.onDuty}</p>
              <p className="text-xs text-gray-500">
                {metrics.guardStatus.available} disponible(s)
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>{metrics.guardStatus.onDuty} en service</span>
            </div>
            {metrics.guardStatus.unavailable > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" />
                <span>{metrics.guardStatus.unavailable} indispo.</span>
              </div>
            )}
          </div>
        </div>

        {/* Roteur Utilization */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisation Rôteurs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.roteurUtilization.utilizationRate}%</p>
              <p className="text-xs text-gray-500">
                {metrics.roteurUtilization.activeRoteurs}/{metrics.roteurUtilization.totalRoteurs} rôteurs actifs
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <span>{metrics.roteurUtilization.weeklyAssignments} affectations/semaine</span>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes Actives</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.alerts.total}</p>
              <p className="text-xs text-gray-500">Nécessitent attention</p>
            </div>
            <div className={`p-3 rounded-full ${metrics.alerts.critical > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${metrics.alerts.critical > 0 ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            {metrics.alerts.critical > 0 && (
              <span className="text-red-600">{metrics.alerts.critical} critique(s)</span>
            )}
            {metrics.alerts.warning > 0 && (
              <span className="text-yellow-600">{metrics.alerts.warning} attention</span>
            )}
            {metrics.alerts.info > 0 && (
              <span className="text-blue-600">{metrics.alerts.info} info</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Activité Récente</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="w-4 h-4" />
              <span>Temps réel</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          {metrics.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {metrics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                    {activity.priority === 'high' ? 'Urgent' : activity.priority === 'medium' ? 'Normal' : 'Info'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex items-center gap-2 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Déployer Agent</p>
              <p className="text-xs text-gray-500">Affecter à un site</p>
            </div>
          </button>
          <button className="flex items-center gap-2 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Rotation Rôteur</p>
              <p className="text-xs text-gray-500">Programmer rotation</p>
            </div>
          </button>
          <button className="flex items-center gap-2 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Signaler Incident</p>
              <p className="text-xs text-gray-500">Nouveau rapport</p>
            </div>
          </button>
          <button className="flex items-center gap-2 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Calendar className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Planning</p>
              <p className="text-xs text-gray-500">Voir calendrier</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;