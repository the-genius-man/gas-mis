import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X, Plus } from 'lucide-react';
import { DemandeConge, CongeProvision, EmployeeGASFull } from '../../types';

interface LeaveManagementProps {
  showProvisions?: boolean;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ showProvisions = false }) => {
  const [requests, setRequests] = useState<DemandeConge[]>([]);
  const [provisions, setProvisions] = useState<CongeProvision[]>([]);
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<DemandeConge | null>(null);
  const [actionComment, setActionComment] = useState('');

  const [formData, setFormData] = useState({
    employeId: '',
    typeConge: 'ANNUEL' as const,
    dateDebut: '',
    dateFin: '',
    motif: ''
  });

  useEffect(() => {
    loadData();
  }, [showProvisions]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [requestsData, provisionsData, employeesData] = await Promise.all([
          window.electronAPI.getLeaveRequests({}),
          window.electronAPI.getLeaveProvisions({}),
          window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' })
        ]);
        setRequests(requestsData || []);
        setProvisions(provisionsData || []);
        setEmployees(employeesData || []);
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.employeId || !formData.dateDebut || !formData.dateFin) return;

    try {
      if (window.electronAPI) {
        await window.electronAPI.createLeaveRequest({
          employeId: formData.employeId,
          typeConge: formData.typeConge,
          dateDebut: formData.dateDebut,
          dateFin: formData.dateFin,
          motif: formData.motif
        });
        setShowNewRequest(false);
        setFormData({
          employeId: '',
          typeConge: 'ANNUEL',
          dateDebut: '',
          dateFin: '',
          motif: ''
        });
        loadData();
      }
    } catch (error) {
      console.error('Error creating leave request:', error);
    }
  };

  const handleApprove = async (request: DemandeConge) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.approveLeaveRequest({ id: request.id, approuvePar: 'current-user', commentaire: actionComment });
        setSelectedRequest(null);
        setActionComment('');
        loadData();
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (request: DemandeConge) => {
    if (!actionComment) {
      alert('Veuillez fournir un motif de refus');
      return;
    }
    try {
      if (window.electronAPI) {
        await window.electronAPI.rejectLeaveRequest({ id: request.id, approuvePar: 'current-user', commentaire: actionComment });
        setSelectedRequest(null);
        setActionComment('');
        loadData();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');

  const getStatusBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
      'APPROUVE': 'bg-green-100 text-green-800',
      'REFUSE': 'bg-red-100 text-red-800',
      'ANNULE': 'bg-gray-100 text-gray-800'
    };
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'APPROUVE': 'Approuvé',
      'REFUSE': 'Refusé',
      'ANNULE': 'Annulé'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut] || 'bg-gray-100'}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ANNUEL': 'Congé annuel',
      'MALADIE': 'Congé maladie',
      'MATERNITE': 'Congé maternité',
      'PATERNITE': 'Congé paternité',
      'SANS_SOLDE': 'Sans solde',
      'EXCEPTIONNEL': 'Exceptionnel'
    };
    return labels[type] || type;
  };

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.statut === statusFilter);

  const calculateDays = (debut: string, fin: string) => {
    const start = new Date(debut);
    const end = new Date(fin);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Provisions View
  if (showProvisions) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Provisions de Congés</h2>
          <p className="text-sm text-gray-500">Solde des congés par employé (1.5 jours/mois travaillé)</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Année</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acquis</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pris</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Restant</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {provisions.map((prov) => (
                <tr key={prov.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                        {(prov as any).nom_employe?.charAt(0) || '?'}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {(prov as any).nom_employe || 'Employé'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prov.annee}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{prov.jours_acquis}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{prov.jours_pris}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                    {(prov.jours_acquis - prov.jours_pris).toFixed(1)}
                  </td>
                </tr>
              ))}
              {provisions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucune provision de congé enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Requests View
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Demandes de Congé</h2>
          <p className="text-sm text-gray-500">{filteredRequests.length} demande(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="REFUSE">Refusé</option>
          </select>
          <button
            onClick={() => setShowNewRequest(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Demande
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {(request as any).nom_employe?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{(request as any).nom_employe || 'Employé'}</p>
                  <p className="text-sm text-gray-500">{getTypeLabel(request.type_conge)}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(request.date_debut)} - {formatDate(request.date_fin)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {calculateDays(request.date_debut, request.date_fin)} jour(s)
                    </span>
                  </div>
                  {request.motif && (
                    <p className="mt-2 text-sm text-gray-600">Motif: {request.motif}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(request.statut)}
                {request.statut === 'EN_ATTENTE' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Approuver"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Refuser"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune demande de congé</p>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Nouvelle Demande de Congé</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employé</label>
                <select
                  value={formData.employeId}
                  onChange={(e) => setFormData({ ...formData, employeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.nom_complet}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Congé</label>
                <select
                  value={formData.typeConge}
                  onChange={(e) => setFormData({ ...formData, typeConge: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ANNUEL">Congé annuel</option>
                  <option value="MALADIE">Congé maladie</option>
                  <option value="MATERNITE">Congé maternité</option>
                  <option value="PATERNITE">Congé paternité</option>
                  <option value="SANS_SOLDE">Sans solde</option>
                  <option value="EXCEPTIONNEL">Exceptionnel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Début</label>
                  <input
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Fin</label>
                  <input
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <textarea
                  value={formData.motif}
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Motif de la demande..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewRequest(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={!formData.employeId || !formData.dateDebut || !formData.dateFin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Traiter la Demande</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{(selectedRequest as any).nom_employe}</p>
              <p className="text-sm text-gray-500">{getTypeLabel(selectedRequest.type_conge)}</p>
              <p className="text-sm text-gray-500">
                {formatDate(selectedRequest.date_debut)} - {formatDate(selectedRequest.date_fin)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
              <textarea
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Commentaire (obligatoire pour refus)..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setSelectedRequest(null); setActionComment(''); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReject(selectedRequest)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Refuser
              </button>
              <button
                onClick={() => handleApprove(selectedRequest)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approuver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
