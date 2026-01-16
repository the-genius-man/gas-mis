import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, Filter, Shield, Car, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';
import { AlerteSysteme } from '../../types';
import AlertCard from './AlertCard';

const AlertsManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<AlerteSysteme[]>([]);
  const [counts, setCounts] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [filters, setFilters] = useState({
    statut: 'ACTIVE' as string | null,
    typeAlerte: null as string | null,
    priorite: null as string | null
  });

  const loadAlerts = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const filterParams: any = {};
      if (filters.statut) filterParams.statut = filters.statut;
      if (filters.typeAlerte) filterParams.typeAlerte = filters.typeAlerte;
      if (filters.priorite) filterParams.priorite = filters.priorite;
      
      const [alertsData, countsData] = await Promise.all([
        window.electronAPI.getAlerts(filterParams),
        window.electronAPI.getAlertCounts()
      ]);
      
      setAlerts(alertsData);
      setCounts(countsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filters]);

  const handleAcknowledge = async (id: string) => {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.acknowledgeAlert({ id, acquitteePar: 'current-user' });
      loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleRunCheck = async () => {
    if (!window.electronAPI) return;
    
    setChecking(true);
    try {
      const result = await window.electronAPI.runAlertCheck();
      if (result.alertsCreated > 0) {
        alert(`${result.alertsCreated} nouvelle(s) alerte(s) créée(s)`);
      }
      loadAlerts();
    } catch (error) {
      console.error('Error running alert check:', error);
    } finally {
      setChecking(false);
    }
  };

  const typeOptions = [
    { value: 'ASSURANCE', label: 'Assurance', icon: Shield },
    { value: 'CONTROLE_TECHNIQUE', label: 'Contrôle Technique', icon: Car },
    { value: 'CERTIFICATION', label: 'Certification', icon: CheckCircle },
    { value: 'CONGE', label: 'Congé', icon: Calendar },
    { value: 'AUTRE', label: 'Autre', icon: AlertTriangle }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Alertes</h1>
            <p className="text-gray-500">Suivi des échéances et notifications système</p>
          </div>
        </div>
        <button
          onClick={handleRunCheck}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Vérifier maintenant
        </button>
      </div>

      {/* Stats Cards */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{counts.byPriority.critique}</div>
            <div className="text-sm text-red-800">Critiques</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{counts.byPriority.haute}</div>
            <div className="text-sm text-orange-800">Haute priorité</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{counts.byPriority.moyenne}</div>
            <div className="text-sm text-yellow-800">Moyenne</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{counts.byPriority.basse}</div>
            <div className="text-sm text-blue-800">Basse</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{counts.acquittee}</div>
            <div className="text-sm text-green-800">Acquittées</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">{counts.expiree}</div>
            <div className="text-sm text-gray-800">Expirées</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Filtres</span>
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Statut</label>
            <select
              value={filters.statut || ''}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value || null })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Tous</option>
              <option value="ACTIVE">Actives</option>
              <option value="ACQUITTEE">Acquittées</option>
              <option value="EXPIREE">Expirées</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              value={filters.typeAlerte || ''}
              onChange={(e) => setFilters({ ...filters, typeAlerte: e.target.value || null })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Tous</option>
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Priorité</label>
            <select
              value={filters.priorite || ''}
              onChange={(e) => setFilters({ ...filters, priorite: e.target.value || null })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Toutes</option>
              <option value="CRITIQUE">Critique</option>
              <option value="HAUTE">Haute</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="BASSE">Basse</option>
            </select>
          </div>

          {/* Reset */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ statut: 'ACTIVE', typeAlerte: null, priorite: null })}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Aucune alerte trouvée</p>
            <p className="text-gray-400 text-sm mt-1">
              Les alertes apparaîtront ici lorsque des échéances approcheront
            </p>
          </div>
        ) : (
          alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsManagement;
