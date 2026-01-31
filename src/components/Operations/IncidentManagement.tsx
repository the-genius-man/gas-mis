import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Clock, 
  MapPin, 
  User, 
  FileText,
  Camera,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Incident {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  site_id: string;
  site_name: string;
  reported_by: string;
  reporter_name: string;
  assigned_to?: string;
  assigned_name?: string;
  incident_date: string;
  incident_time: string;
  resolved_date?: string;
  resolution_notes?: string;
  client_notified: boolean;
  client_notification_date?: string;
  evidence_photos?: string[];
  witness_statements?: string[];
  created_at: string;
  updated_at: string;
}

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      if (window.electronAPI?.getIncidents) {
        const data = await window.electronAPI.getIncidents();
        setIncidents(data || []);
      } else {
        // Mock data for demonstration
        setIncidents([
          {
            id: '1',
            incident_number: 'INC-2024-001',
            title: 'Intrusion détectée - Site Alpha',
            description: 'Détection d\'une intrusion dans le périmètre nord du site Alpha vers 02:30. Alarme déclenchée, intervention immédiate effectuée.',
            severity: 'HIGH',
            status: 'INVESTIGATING',
            site_id: 'site-1',
            site_name: 'Site Alpha',
            reported_by: 'guard-1',
            reporter_name: 'Jean Dupont',
            assigned_to: 'supervisor-1',
            assigned_name: 'Marie Martin',
            incident_date: '2024-01-31',
            incident_time: '02:30',
            client_notified: true,
            client_notification_date: '2024-01-31T03:00:00Z',
            evidence_photos: ['photo1.jpg', 'photo2.jpg'],
            witness_statements: ['Déclaration du garde de nuit'],
            created_at: '2024-01-31T02:35:00Z',
            updated_at: '2024-01-31T08:15:00Z'
          },
          {
            id: '2',
            incident_number: 'INC-2024-002',
            title: 'Panne d\'éclairage - Zone B',
            description: 'Panne générale de l\'éclairage dans la zone B du site Beta. Intervention technique requise.',
            severity: 'MEDIUM',
            status: 'RESOLVED',
            site_id: 'site-2',
            site_name: 'Site Beta',
            reported_by: 'guard-2',
            reporter_name: 'Pierre Durand',
            incident_date: '2024-01-30',
            incident_time: '20:15',
            resolved_date: '2024-01-31T10:30:00Z',
            resolution_notes: 'Remplacement du disjoncteur principal. Éclairage rétabli.',
            client_notified: false,
            created_at: '2024-01-30T20:20:00Z',
            updated_at: '2024-01-31T10:30:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800',
    };
    return styles[severity] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'REPORTED': 'bg-blue-100 text-blue-800',
      'INVESTIGATING': 'bg-yellow-100 text-yellow-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REPORTED': return <AlertCircle className="w-4 h-4" />;
      case 'INVESTIGATING': return <Clock className="w-4 h-4" />;
      case 'RESOLVED': return <CheckCircle className="w-4 h-4" />;
      case 'CLOSED': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = !searchTerm || 
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = !filterSeverity || incident.severity === filterSeverity;
    const matchesStatus = !filterStatus || incident.status === filterStatus;
    const matchesSite = !filterSite || incident.site_id === filterSite;
    return matchesSearch && matchesSeverity && matchesStatus && matchesSite;
  });

  const incidentStats = {
    total: incidents.length,
    reported: incidents.filter(i => i.status === 'REPORTED').length,
    investigating: incidents.filter(i => i.status === 'INVESTIGATING').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    critical: incidents.filter(i => i.severity === 'CRITICAL').length,
    clientNotified: incidents.filter(i => i.client_notified).length
  };

  const formatDateTime = (date: string, time?: string) => {
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('fr-FR');
    return time ? `${dateStr} à ${time}` : dateStr;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Incidents</h2>
          <p className="text-sm text-gray-500">
            Suivi et gestion des incidents de sécurité
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-4 h-4" />
          Signaler un Incident
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{incidentStats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Signalés</p>
              <p className="text-2xl font-bold text-blue-600">{incidentStats.reported}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">{incidentStats.investigating}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Résolus</p>
              <p className="text-2xl font-bold text-green-600">{incidentStats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critiques</p>
              <p className="text-2xl font-bold text-red-600">{incidentStats.critical}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients notifiés</p>
              <p className="text-2xl font-bold text-purple-600">{incidentStats.clientNotified}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par titre, numéro ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les sévérités</option>
              <option value="LOW">Faible</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Élevée</option>
              <option value="CRITICAL">Critique</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="REPORTED">Signalé</option>
              <option value="INVESTIGATING">En cours</option>
              <option value="RESOLVED">Résolu</option>
              <option value="CLOSED">Fermé</option>
            </select>
          </div>
          <div>
            <select
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les sites</option>
              {/* Sites will be loaded dynamically */}
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Incidents ({filteredIncidents.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sévérité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site / Rapporteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date / Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {incident.incident_number}
                        </div>
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {incident.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {incident.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {incident.evidence_photos && incident.evidence_photos.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Camera className="w-3 h-3" />
                              {incident.evidence_photos.length}
                            </div>
                          )}
                          {incident.witness_statements && incident.witness_statements.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <FileText className="w-3 h-3" />
                              {incident.witness_statements.length}
                            </div>
                          )}
                          {incident.client_notified && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <MessageSquare className="w-3 h-3" />
                              Client notifié
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityBadge(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(incident.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(incident.status)}`}>
                          {incident.status}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-900">
                          <MapPin className="w-3 h-3" />
                          {incident.site_name}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <User className="w-3 h-3" />
                          {incident.reporter_name}
                        </div>
                        {incident.assigned_name && (
                          <div className="text-xs text-blue-600">
                            Assigné à: {incident.assigned_name}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {formatDateTime(incident.incident_date, incident.incident_time)}
                        </div>
                        <div className="text-gray-500">
                          {formatTimeAgo(incident.created_at)}
                        </div>
                        {incident.resolved_date && (
                          <div className="text-green-600 text-xs">
                            Résolu: {formatTimeAgo(incident.resolved_date)}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedIncident(incident);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun incident trouvé</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Signaler le premier incident
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncidentManagement;