import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  Users, 
  Building2, 
  MapPin, 
  DollarSign, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
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
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state } = useApp();
  const { dashboardStats } = state;

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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employés"
          value={dashboardStats.totalEmployees}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Gardes Actifs"
          value={dashboardStats.activeGuards}
          icon={<Shield className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Total Clients"
          value={dashboardStats.totalClients}
          icon={<Building2 className="h-6 w-6" />}
          trend={{ value: 5, isPositive: true }}
          color="purple"
        />
        <StatCard
          title="Sites Actifs"
          value={dashboardStats.activeSites}
          icon={<MapPin className="h-6 w-6" />}
          trend={{ value: 3, isPositive: false }}
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenus Mensuels"
          value={`${dashboardStats.monthlyRevenue.toLocaleString('fr-FR')} €`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Incidents en Attente"
          value={dashboardStats.pendingIncidents}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Certifications Expirant"
          value={dashboardStats.expiringCertifications}
          icon={<Shield className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Équipes à Venir"
          value={dashboardStats.upcomingShifts}
          icon={<Calendar className="h-6 w-6" />}
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
      </div>
    </div>
  );
}