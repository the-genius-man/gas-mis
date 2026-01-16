import { useApp } from '../../contexts/AppContext';
import { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  MapPin, 
  AlertTriangle,
  Bell,
  Shield,
  Car,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Package,
  Truck,
  UserCheck,
  FileText,
  Clock
} from 'lucide-react';
import { AlerteSysteme, HRStats, FleetStats, InventoryStats, DisciplinaryStats } from '../../types';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const appContext = useApp();
  const [alerts, setAlerts] = useState<AlerteSysteme[]>([]);
  const [alertCounts, setAlertCounts] = useState<any>(null);
  const [hrStats, setHrStats] = useState<HRStats | null>(null);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [disciplinaryStats, setDisciplinaryStats] = useState<DisciplinaryStats | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Get stats
  const dashboardStats = appContext?.state.dashboardStats;

  // Load all stats
  useEffect(() => {
    const loadAllStats = async () => {
      if (window.electronAPI) {
        setLoadingStats(true);
        setLoadingAlerts(true);
        try {
          const [alertsData, countsData, hr, fleet, inventory, disciplinary] = await Promise.all([
            window.electronAPI.getAlerts?.({ statut: 'ACTIVE' }) || Promise.resolve([]),
            window.electronAPI.getAlertCounts?.() || Promise.resolve(null),
            window.electronAPI.getHRStats?.() || Promise.resolve(null),
            window.electronAPI.getFleetStats?.() || Promise.resolve(null),
            window.electronAPI.getInventoryStats?.() || Promise.resolve(null),
            window.electronAPI.getDisciplinaryStats?.() || Promise.resolve(null),
          ]);
          
          setAlerts(alertsData.slice(0, 5));
          setAlertCounts(countsData);
          setHrStats(hr);
          setFleetStats(fleet);
          setInventoryStats(inventory);
          setDisciplinaryStats(disciplinary);
        } catch (error) {
          console.error('Error loading stats:', error);
        } finally {
          setLoadingStats(false);
          setLoadingAlerts(false);
        }
      }
    };

    loadAllStats();
  }, []);

  if (appContext?.state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const recentActivities = [
    {
      id: 1,
      type: 'employee',
      message: 'Nouvel employé John Smith ajouté au système',
      time: 'il y a 2 heures',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 2,
      type: 'client',
      message: 'Contrat client renouvelé pour Centre Commercial Downtown',
      time: 'il y a 4 heures',
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      id: 3,
      type: 'alert',
      message: 'Certificat de sécurité expirant bientôt pour 3 gardes',
      time: 'il y a 6 heures',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      id: 4,
      type: 'site',
      message: 'Nouveau site ajouté : Plaza Corporative',
      time: 'il y a 1 jour',
      icon: <MapPin className="h-4 w-4" />,
    },
  ];

  const upcomingTasks = [
    {
      id: 1,
      task: 'Examiner les rapports de performance mensuels',
      dueDate: 'Aujourd\'hui',
      priority: 'élevée',
    },
    {
      id: 2,
      task: 'Traiter la paie du personnel de garde',
      dueDate: 'Demain',
      priority: 'élevée',
    },
    {
      id: 3,
      task: 'Réunion client : Centre Commercial Metro',
      dueDate: '15 Déc',
      priority: 'moyenne',
    },
    {
      id: 4,
      task: 'Mettre à jour la documentation des protocoles de sécurité',
      dueDate: '18 Déc',
      priority: 'faible',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Go Ahead Security MIS</h2>
        <p className="text-blue-100">Système de gestion intégré pour opérations de sécurité</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employés"
          value={dashboardStats?.totalEmployees || 0}
          color="blue"
        />
        <StatCard
          title="Gardes Actifs"
          value={dashboardStats?.activeGuards || 0}
          color="green"
        />
        <StatCard
          title="Total Clients"
          value={dashboardStats?.totalClients || 0}
          color="purple"
        />
        <StatCard
          title="Sites Actifs"
          value={dashboardStats?.activeSites || 0}
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenus Mensuels"
          value={`${(dashboardStats?.monthlyRevenue || 0).toLocaleString('fr-FR')} USD`}
          color="green"
        />
        <StatCard
          title="Incidents en Attente"
          value={dashboardStats?.pendingIncidents || 0}
          color="red"
        />
        <StatCard
          title="Certifications Expirant"
          value={dashboardStats?.expiringCertifications || 0}
          color="yellow"
        />
        <StatCard
          title="Équipes à Venir"
          value={dashboardStats?.upcomingShifts || 0}
          color="blue"
        />
      </div>

      {/* Activity and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité Récente</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Alertes Système</h3>
              {alertCounts?.active > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {alertCounts.active}
                </span>
              )}
            </div>
          </div>
          
          {loadingAlerts ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune alerte active</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.priorite === 'CRITIQUE' ? 'bg-red-50 border-red-500' :
                    alert.priorite === 'HAUTE' ? 'bg-orange-50 border-orange-500' :
                    alert.priorite === 'MOYENNE' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {alert.type_alerte === 'ASSURANCE' ? <Shield className="w-4 h-4 mt-0.5" /> :
                     alert.type_alerte === 'CONTROLE_TECHNIQUE' ? <Car className="w-4 h-4 mt-0.5" /> :
                     <AlertTriangle className="w-4 h-4 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.titre}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {alert.date_echeance && `Échéance: ${new Date(alert.date_echeance).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      alert.priorite === 'CRITIQUE' ? 'bg-red-600 text-white' :
                      alert.priorite === 'HAUTE' ? 'bg-orange-600 text-white' :
                      alert.priorite === 'MOYENNE' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {alert.priorite}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Alert Summary */}
          {alertCounts && (
            <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-red-600">{alertCounts.byPriority.critique}</div>
                <div className="text-xs text-gray-500">Critiques</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{alertCounts.byPriority.haute}</div>
                <div className="text-xs text-gray-500">Hautes</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">{alertCounts.byPriority.moyenne}</div>
                <div className="text-xs text-gray-500">Moyennes</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">{alertCounts.byPriority.basse}</div>
                <div className="text-xs text-gray-500">Basses</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tâches à Venir</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{task.task}</p>
                <p className="text-xs text-gray-500 mt-1">Échéance : {task.dueDate}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                task.priority === 'élevée' 
                  ? 'bg-red-100 text-red-800'
                  : task.priority === 'moyenne'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}