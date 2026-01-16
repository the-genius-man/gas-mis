import { useApp } from '../../contexts/AppContext';
import { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
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
  Clock,
  MapPin,
  BarChart3,
  CalendarCheck
} from 'lucide-react';
import { AlerteSysteme, HRStats, FleetStats, InventoryStats, DisciplinaryStats } from '../../types';

interface EnhancedDashboardProps {
  onNavigate?: (module: string) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  module: string;
  color: string;
  roles: string[];
}

const iconMap: Record<string, any> = {
  Users,
  Building2,
  FileText,
  Calendar,
  MapPin,
  DollarSign,
  Truck,
  Package,
  Bell,
  BarChart3,
  CalendarCheck,
  AlertTriangle
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 hover:bg-blue-100',
  green: 'bg-green-50 hover:bg-green-100',
  purple: 'bg-purple-50 hover:bg-purple-100',
  orange: 'bg-orange-50 hover:bg-orange-100',
  teal: 'bg-teal-50 hover:bg-teal-100',
  emerald: 'bg-emerald-50 hover:bg-emerald-100',
  indigo: 'bg-indigo-50 hover:bg-indigo-100',
  pink: 'bg-pink-50 hover:bg-pink-100',
  red: 'bg-red-50 hover:bg-red-100',
  violet: 'bg-violet-50 hover:bg-violet-100',
  amber: 'bg-amber-50 hover:bg-amber-100',
  rose: 'bg-rose-50 hover:bg-rose-100'
};

const iconColorMap: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  teal: 'text-teal-600',
  emerald: 'text-emerald-600',
  indigo: 'text-indigo-600',
  pink: 'text-pink-600',
  red: 'text-red-600',
  violet: 'text-violet-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600'
};

interface StatCardProps {
  title: string;
  value: string | number;
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

export default function EnhancedDashboard({ onNavigate }: EnhancedDashboardProps) {
  const appContext = useApp();
  const [alerts, setAlerts] = useState<AlerteSysteme[]>([]);
  const [alertCounts, setAlertCounts] = useState<any>(null);
  const [hrStats, setHrStats] = useState<HRStats | null>(null);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [disciplinaryStats, setDisciplinaryStats] = useState<DisciplinaryStats | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);

  const dashboardStats = appContext?.state.dashboardStats;

  // For demo purposes, using a default user. In production, get from auth context
  const currentUserId = 'admin-user-1';

  useEffect(() => {
    loadAllStats();
    loadQuickActions();
  }, []);

  const loadQuickActions = async () => {
    try {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getUserSettings(currentUserId);
        setQuickActions(settings.quick_actions || []);
      }
    } catch (error) {
      console.error('Error loading quick actions:', error);
    }
  };
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

  if (appContext?.state.loading || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions - Top of Dashboard */}
      {quickActions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map(action => {
              const Icon = iconMap[action.icon] || FileText;
              const colorClass = colorMap[action.color] || colorMap.blue;
              const iconColor = iconColorMap[action.color] || iconColorMap.blue;
              
              return (
                <button
                  key={action.id}
                  onClick={() => onNavigate?.(action.module)}
                  className={`p-4 rounded-lg text-left transition-colors ${colorClass}`}
                >
                  <Icon className={`w-6 h-6 ${iconColor} mb-2`} />
                  <p className="text-sm font-medium text-gray-900">{action.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Go Ahead Security MIS</h2>
            <p className="text-blue-100">Système de gestion intégré pour opérations de sécurité</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Aujourd'hui</p>
            <p className="text-lg font-semibold">{new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vue d'Ensemble</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Revenus Mensuels"
            value={`${(dashboardStats?.monthlyRevenue || 0).toLocaleString('fr-FR')} USD`}
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
            subtitle="Facturation du mois"
          />
          <StatCard
            title="Total Clients"
            value={dashboardStats?.totalClients || 0}
            icon={<Building2 className="w-6 h-6 text-blue-600" />}
            subtitle={`${dashboardStats?.activeSites || 0} sites actifs`}
          />
          <StatCard
            title="Total Employés"
            value={hrStats?.totalEmployees || dashboardStats?.totalEmployees || 0}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            subtitle={`${hrStats?.activeEmployees || dashboardStats?.activeGuards || 0} actifs`}
          />
          <StatCard
            title="Alertes Actives"
            value={alertCounts?.active || 0}
            icon={<Bell className="w-6 h-6 text-orange-600" />}
            subtitle={`${alertCounts?.byPriority?.critique || 0} critiques`}
          />
        </div>
      </div>

      {/* HR Stats */}
      {hrStats && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ressources Humaines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Gardiens"
              value={hrStats.guardsCount}
              icon={<Shield className="w-6 h-6 text-green-600" />}
              subtitle="Personnel de terrain"
            />
            <StatCard
              title="Rôteurs"
              value={hrStats.roteursCount}
              icon={<UserCheck className="w-6 h-6 text-purple-600" />}
              subtitle="Remplaçants disponibles"
            />
            <StatCard
              title="En Congé"
              value={hrStats.onLeaveCount}
              icon={<Calendar className="w-6 h-6 text-yellow-600" />}
              subtitle={`${hrStats.pendingLeaveRequests} demandes en attente`}
            />
            <StatCard
              title="Administration"
              value={hrStats.adminCount + hrStats.supervisorsCount}
              icon={<Users className="w-6 h-6 text-blue-600" />}
              subtitle="Personnel administratif"
            />
          </div>
        </div>
      )}

      {/* Operations & Logistics Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Opérations & Logistique</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Flotte Active"
            value={fleetStats?.activeVehicles || 0}
            icon={<Truck className="w-6 h-6 text-blue-600" />}
            subtitle={`${fleetStats?.totalVehicles || 0} véhicules total`}
          />
          <StatCard
            title="En Réparation"
            value={fleetStats?.inRepairVehicles || 0}
            icon={<Car className="w-6 h-6 text-orange-600" />}
            subtitle="Véhicules indisponibles"
          />
          <StatCard
            title="Équipements"
            value={inventoryStats?.totalEquipment || 0}
            icon={<Package className="w-6 h-6 text-purple-600" />}
            subtitle={`${inventoryStats?.assignedEquipment || 0} affectés`}
          />
          <StatCard
            title="Disponibles"
            value={inventoryStats?.availableEquipment || 0}
            icon={<Package className="w-6 h-6 text-green-600" />}
            subtitle="Équipements en stock"
          />
        </div>
      </div>

      {/* Compliance & Discipline */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conformité & Discipline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Assurances Expirantes"
            value={fleetStats?.expiringInsurance || 0}
            icon={<Shield className="w-6 h-6 text-red-600" />}
            subtitle="Véhicules à renouveler"
          />
          <StatCard
            title="Contrôles Techniques"
            value={fleetStats?.expiringTechnicalInspection || 0}
            icon={<FileText className="w-6 h-6 text-yellow-600" />}
            subtitle="À planifier"
          />
          <StatCard
            title="Actions Disciplinaires"
            value={disciplinaryStats?.thisMonthActions || 0}
            icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
            subtitle="Ce mois"
          />
          <StatCard
            title="En Attente Validation"
            value={disciplinaryStats?.pendingValidations || 0}
            icon={<Clock className="w-6 h-6 text-blue-600" />}
            subtitle="Actions à traiter"
          />
        </div>
      </div>

      {/* Activity and Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Alertes Prioritaires</h3>
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
              <div className="text-lg font-bold text-red-600">{alertCounts.byPriority?.critique || 0}</div>
              <div className="text-xs text-gray-500">Critiques</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{alertCounts.byPriority?.haute || 0}</div>
              <div className="text-xs text-gray-500">Hautes</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">{alertCounts.byPriority?.moyenne || 0}</div>
              <div className="text-xs text-gray-500">Moyennes</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{alertCounts.byPriority?.basse || 0}</div>
              <div className="text-xs text-gray-500">Basses</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
