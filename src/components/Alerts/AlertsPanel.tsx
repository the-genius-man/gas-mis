import React, { useState, useEffect } from 'react';
import { X, Bell, RefreshCw, AlertTriangle } from 'lucide-react';
import { AlerteSysteme } from '../../types';
import AlertCard from './AlertCard';

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState<AlerteSysteme[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'acquittee'>('active');

  const loadAlerts = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const filters: any = {};
      if (filter !== 'all') {
        filters.statut = filter === 'active' ? 'ACTIVE' : 'ACQUITTEE';
      }
      const data = await window.electronAPI.getAlerts(filters);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen, filter]);

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

  if (!isOpen) return null;

  const activeCount = alerts.filter(a => a.statut === 'ACTIVE').length;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          <h2 className="font-semibold text-lg">Alertes</h2>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCheck}
            disabled={checking}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Vérifier les alertes"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'active' 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Actives
        </button>
        <button
          onClick={() => setFilter('acquittee')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'acquittee' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Acquittées
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune alerte</p>
          </div>
        ) : (
          alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              compact
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
