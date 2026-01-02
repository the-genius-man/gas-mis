import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Building2, 
  MapPin, 
  DollarSign, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate';
  subtitle?: string;
}

function StatCard({ title, value, icon, trend, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend.value)}% par rapport au mois dernier</span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardStats {
  totalEmployees?: number;
  activeGuards?: number;
  totalClients: number;
  activeSites: number;
  inactiveSites?: number;
  monthlyRevenue?: number;
  totalRevenuePotential?: number;
  pendingIncidents?: number;
  expiringCertifications?: number;
  upcomingShifts?: number;
}

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true;

export default function Dashboard() {
  const appContext = isElectron ? useApp() : null;
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeSites: 0,
    inactiveSites: 0,
    totalRevenuePotential: 0,
  });
  const [loading, setLoading] = useState(!isElectron);

  // Handle Electron mode
  const handleSeedDatabase = async () => {
    if (window.confirm('This will replace all existing data with sample data. Continue?')) {
      await appContext?.actions.seedDatabase();
    }
  };

  // Load data for Supabase mode
  const loadDashboardData = async () => {
    if (isElectron) return;
    
    try {
      const [clientsResult, sitesResult] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('sites').select('statut, tarif_mensuel_client'),
      ]);

      const activeSites = sitesResult.data?.filter(s => s.statut === 'ACTIF') || [];
      const inactiveSites = sitesResult.data?.filter(s => s.statut === 'INACTIF') || [];
      const totalRevenue = activeSites.reduce((sum, site) => sum + (site.tarif_mensuel_client || 0), 0);

      setStats({
        totalClients: clientsResult.count || 0,
        activeSites: activeSites.length,
        inactiveSites: inactiveSites.length,
        totalRevenuePotential: totalRevenue,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isElectron) {
      loadDashboardData();
    }
  }, []);

  // Get stats based on mode
  const dashboardStats = isElectron ? appContext?.state.dashboardStats : stats;

  if (loading || (isElectron && appContext?.state.loading)) {
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
        <h2 className="text-2xl font-bold mb-2">
          {isElectron ? 'Go Ahead Security MIS' : 'Bienvenue sur Guardian Command'}
        </h2>
        <p className="text-blue-100">
          {isElectron ? 'Système de gestion intégré pour opérations de sécurité' : 'Système de gestion pour GO AHEAD SECURITY'}
        </p>
      </div>

      {/* Temporary Seed Button - Electron only */}
      {isElectron && window.electronAPI?.isElectron && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Base de Données Vide</h3>
              <p className="text-sm text-yellow-700 mt-1">Charger des données d'exemple pour tester l'application</p>
            </div>
            <button
              onClick={handleSeedDatabase}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Charger Données d'Exemple
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isElectron ? (
          <>
            <StatCard
              title="Total Employés"
              value={dashboardStats?.totalEmployees || 0}
              icon={<Users className="h-6 w-6" />}
              trend={{ value: 12, isPositive: true }}
              color="blue"
            />
            <StatCard
              title="Gardes Actifs"
              value={dashboardStats?.activeGuards || 0}
              icon={<Shield className="h-6 w-6" />}
              trend={{ value: 8, isPositive: true }}
              color="green"
            />
            <StatCard
              title="Total Clients"
              value={dashboardStats?.totalClients || 0}
              icon={<Building2 className="h-6 w-6" />}
              trend={{ value: 5, isPositive: true }}
              color="purple"
            />
            <StatCard
              title="Sites Actifs"
              value={dashboardStats?.activeSites || 0}
              icon={<MapPin className="h-6 w-6" />}
              trend={{ value: 3, isPositive: false }}
              color="yellow"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Clients"
              value={dashboardStats?.totalClients || 0}
              icon={<Building2 className="h-7 w-7" />}
              color="blue"
              subtitle="Clients enregistrés"
            />
            <StatCard
              title="Sites Actifs"
              value={dashboardStats?.activeSites || 0}
              icon={<MapPin className="h-7 w-7" />}
              color="green"
              subtitle="Sites en service"
            />
            <StatCard
              title="Sites Inactifs"
              value={dashboardStats?.inactiveSites || 0}
              icon={<MapPin className="h-7 w-7" />}
              color="slate"
              subtitle="Sites suspendus"
            />
            <StatCard
              title="Revenu Mensuel"
              value={`${(dashboardStats?.totalRevenuePotential || 0).toLocaleString()}`}
              icon={<DollarSign className="h-7 w-7" />}
              color="green"
              subtitle="Chiffre d'affaires actif"
            />
          </>
        )}
      </div>

      {/* Secondary Stats for Electron */}
      {isElectron && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Revenus Mensuels"
            value={`${(dashboardStats?.monthlyRevenue || 0).toLocaleString('fr-FR')} €`}
            icon={<DollarSign className="h-6 w-6" />}
            trend={{ value: 15, isPositive: true }}
            color="green"
          />
          <StatCard
            title="Incidents en Attente"
            value={dashboardStats?.pendingIncidents || 0}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
          />
          <StatCard
            title="Certifications Expirant"
            value={dashboardStats?.expiringCertifications || 0}
            icon={<Shield className="h-6 w-6" />}
            color="yellow"
          />
          <StatCard
            title="Équipes à Venir"
            value={dashboardStats?.upcomingShifts || 0}
            icon={<Calendar className="h-6 w-6" />}
            color="blue"
          />
        </div>
      )}

      {/* Activity and Tasks / Module Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isElectron ? (
          <>
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

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tâches à Venir</h3>
              <div className="space-y-3">
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
          </>
        ) : (
          <>
            {/* Module Finance Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Module Finance - Phases 1 & 2</h3>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Gestion des Clients</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Actif</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Gestion des Sites</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Actif</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Facturation</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Actif</span>
                </div>
              </div>
            </div>

            {/* Next Phases */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Prochaines Phases</h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Phase 3 - Ressources Humaines</p>
                  <p className="text-xs text-gray-500 mt-1">Gestion employés et calcul de paie</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Phase 4 - Opérations</p>
                  <p className="text-xs text-gray-500 mt-1">Planning, flotte, et matériel</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Phase 5 - Paie & Discipline</p>
                  <p className="text-xs text-gray-500 mt-1">Moteur de paie automatique et actions disciplinaires</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}