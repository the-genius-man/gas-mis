import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Building2,
  MapPin,
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'slate';
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardStats {
  totalClients: number;
  activeSites: number;
  inactiveSites: number;
  totalRevenuePotential: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeSites: 0,
    inactiveSites: 0,
    totalRevenuePotential: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Bienvenue sur Guardian Command</h2>
        <p className="text-blue-100">Système de gestion pour GO AHEAD SECURITY</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={<Building2 className="h-7 w-7" />}
          color="blue"
          subtitle="Clients enregistrés"
        />
        <StatCard
          title="Sites Actifs"
          value={stats.activeSites}
          icon={<MapPin className="h-7 w-7" />}
          color="green"
          subtitle="Sites en service"
        />
        <StatCard
          title="Sites Inactifs"
          value={stats.inactiveSites}
          icon={<MapPin className="h-7 w-7" />}
          color="slate"
          subtitle="Sites suspendus"
        />
        <StatCard
          title="Revenu Mensuel"
          value={`$${stats.totalRevenuePotential.toLocaleString()}`}
          icon={<DollarSign className="h-7 w-7" />}
          color="green"
          subtitle="Chiffre d'affaires actif"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}