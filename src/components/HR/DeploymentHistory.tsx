import React, { useState } from 'react';
import { MapPin, Calendar, Plus, ArrowRight, User, Building, X } from 'lucide-react';
import { HistoriqueDeployement } from '../../types';
import DeploymentForm from './DeploymentForm';
import Pagination from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface DeploymentHistoryProps {
  employeId: string;
  employeeName?: string;
  deployments: HistoriqueDeployement[];
  onRefresh: () => void;
}

const DeploymentHistory: React.FC<DeploymentHistoryProps> = ({ employeId, employeeName, deployments, onRefresh }) => {
  const [showDeploymentForm, setShowDeploymentForm] = useState(false);
  const [showEndDeploymentForm, setShowEndDeploymentForm] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const currentDeployment = deployments.find(d => !d.date_fin);
  const pastDeployments = deployments.filter(d => d.date_fin);
  
  const deploymentPagination = usePagination({ 
    data: pastDeployments, 
    itemsPerPage: ITEMS_PER_PAGE 
  });

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getMotifLabel = (motif: string) => {
    const labels: Record<string, string> = {
      'NOUVELLE_AFFECTATION': 'Nouvelle affectation',
      'TRANSFERT': 'Transfert',
      'REMPLACEMENT': 'Remplacement',
      'ROTATION': 'Rotation',
      'DEMANDE_EMPLOYE': 'Demande employé',
      'DEMANDE_CLIENT': 'Demande client',
      'DISCIPLINAIRE': 'Disciplinaire',
      'FIN_CONTRAT_SITE': 'Fin contrat site'
    };
    return labels[motif] || motif;
  };

  const getMotifBadgeColor = (motif: string) => {
    const colors: Record<string, string> = {
      'NOUVELLE_AFFECTATION': 'bg-green-100 text-green-800',
      'TRANSFERT': 'bg-blue-100 text-blue-800',
      'REMPLACEMENT': 'bg-yellow-100 text-yellow-800',
      'ROTATION': 'bg-purple-100 text-purple-800',
      'DEMANDE_EMPLOYE': 'bg-gray-100 text-gray-800',
      'DEMANDE_CLIENT': 'bg-orange-100 text-orange-800',
      'DISCIPLINAIRE': 'bg-red-100 text-red-800',
      'FIN_CONTRAT_SITE': 'bg-gray-100 text-gray-800'
    };
    return colors[motif] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header with action */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 uppercase">Historique des Déploiements</h3>
        <button
          onClick={() => setShowDeploymentForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Transférer / Affecter
        </button>
      </div>

      {/* Current Deployment */}
      {currentDeployment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Déploiement Actuel</span>
            </div>
            <button
              onClick={() => setShowEndDeploymentForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <X className="w-4 h-4" />
              Terminer
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Site</p>
                <p className="font-semibold text-blue-900">{(currentDeployment as any).nom_site || 'Site inconnu'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Client</p>
                <p className="font-medium text-blue-800">{(currentDeployment as any).client_nom || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Depuis</p>
                <p className="font-medium text-blue-800">{formatDate(currentDeployment.date_debut)}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-blue-600">Motif:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getMotifBadgeColor(currentDeployment.motif_affectation)}`}>
              {getMotifLabel(currentDeployment.motif_affectation)}
            </span>
          </div>
        </div>
      )}

      {/* Past Deployments Table */}
      {pastDeployments.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Historique des Affectations</h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Site / Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Poste
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Période
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Durée
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Motif
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deploymentPagination.paginatedData.map((deployment) => (
                    <tr key={deployment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{(deployment as any).nom_site || 'Site inconnu'}</div>
                          <div className="text-sm text-gray-500">{(deployment as any).client_nom || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {deployment.poste}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <span>{formatDate(deployment.date_debut)}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(deployment.date_fin)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {deployment.date_debut && deployment.date_fin && 
                          `${Math.ceil((new Date(deployment.date_fin).getTime() - new Date(deployment.date_debut).getTime()) / (1000 * 60 * 60 * 24))} jours`
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMotifBadgeColor(deployment.motif_affectation)}`}>
                          {getMotifLabel(deployment.motif_affectation)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        {deployment.notes ? (
                          <div className="truncate" title={deployment.notes}>
                            {deployment.notes}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={deploymentPagination.currentPage}
              totalPages={deploymentPagination.totalPages}
              onPageChange={deploymentPagination.setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={pastDeployments.length}
            />
          </div>
        </div>
      ) : !currentDeployment && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Aucun historique de déploiement</p>
        </div>
      )}

      {/* Deployment Form Modal */}
      {showDeploymentForm && (
        <DeploymentForm
          employee={{ id: employeId, nom_complet: employeeName || '' } as any}
          onClose={() => setShowDeploymentForm(false)}
          onSave={() => {
            setShowDeploymentForm(false);
            onRefresh();
          }}
        />
      )}

      {/* End Deployment Modal */}
      {showEndDeploymentForm && currentDeployment && (
        <EndDeploymentModal
          employeId={employeId}
          employeeName={employeeName || ''}
          currentDeployment={currentDeployment}
          onClose={() => setShowEndDeploymentForm(false)}
          onSave={() => {
            setShowEndDeploymentForm(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default DeploymentHistory;

// End Deployment Modal Component
interface EndDeploymentModalProps {
  employeId: string;
  employeeName: string;
  currentDeployment: HistoriqueDeployement;
  onClose: () => void;
  onSave: () => void;
}

const EndDeploymentModal: React.FC<EndDeploymentModalProps> = ({ 
  employeId, 
  employeeName, 
  currentDeployment, 
  onClose, 
  onSave 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dateEnd: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (window.electronAPI) {
        await window.electronAPI.endDeployment({
          employeId,
          dateEnd: formData.dateEnd,
          notes: formData.notes
        });
        onSave();
      }
    } catch (error) {
      console.error('Error ending deployment:', error);
      alert('Erreur lors de la fin du déploiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Terminer le Déploiement</h2>
              <p className="text-sm text-gray-500">Retirer {employeeName} du site</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Current deployment info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Déploiement actuel</span>
            </div>
            <p className="text-sm text-blue-700">
              <strong>{employeeName}</strong> est affecté à{' '}
              <strong>{(currentDeployment as any).nom_site || 'ce site'}</strong> depuis le{' '}
              {new Date(currentDeployment.date_debut).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-4">
            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateEnd}
                onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif / Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Motif de la fin du déploiement..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Attention</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Cette action va terminer le déploiement actuel et retirer l'employé du site. 
                  L'employé restera actif mais ne sera affecté à aucun site.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Traitement...
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Terminer le Déploiement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
