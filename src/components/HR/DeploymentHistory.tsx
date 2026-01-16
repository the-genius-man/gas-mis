import React, { useState } from 'react';
import { MapPin, Calendar, Plus, ArrowRight } from 'lucide-react';
import { HistoriqueDeployement } from '../../types';
import DeploymentForm from './DeploymentForm';

interface DeploymentHistoryProps {
  employeId: string;
  employeeName?: string;
  deployments: HistoriqueDeployement[];
  onRefresh: () => void;
}

const DeploymentHistory: React.FC<DeploymentHistoryProps> = ({ employeId, employeeName, deployments, onRefresh }) => {
  const [showDeploymentForm, setShowDeploymentForm] = useState(false);

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

  const currentDeployment = deployments.find(d => !d.date_fin);
  const pastDeployments = deployments.filter(d => d.date_fin);

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
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Déploiement Actuel</span>
          </div>
          <div className="ml-7">
            <p className="font-semibold text-gray-900">{(currentDeployment as any).nom_site || 'Site inconnu'}</p>
            <p className="text-sm text-gray-600">{(currentDeployment as any).client_nom}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Depuis le {formatDate(currentDeployment.date_debut)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${getMotifBadgeColor(currentDeployment.motif_affectation)}`}>
                {getMotifLabel(currentDeployment.motif_affectation)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {pastDeployments.length > 0 ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-4">
            {pastDeployments.map((deployment) => (
              <div key={deployment.id} className="relative pl-10">
                <div className="absolute left-2.5 w-3 h-3 bg-gray-300 rounded-full border-2 border-white"></div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{(deployment as any).nom_site || 'Site inconnu'}</p>
                      <p className="text-sm text-gray-500">{(deployment as any).client_nom}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getMotifBadgeColor(deployment.motif_affectation)}`}>
                      {getMotifLabel(deployment.motif_affectation)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(deployment.date_debut)}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>{formatDate(deployment.date_fin)}</span>
                  </div>
                  {deployment.notes && (
                    <p className="mt-2 text-sm text-gray-500">
                      Note: {deployment.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default DeploymentHistory;
