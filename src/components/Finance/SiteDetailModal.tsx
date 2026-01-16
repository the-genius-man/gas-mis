import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Building2, Users, Sun, Moon, DollarSign, 
  Calendar, ArrowRight, Clock, FileText, Navigation,
  UserCheck, History
} from 'lucide-react';
import { SiteGAS, ClientGAS, HistoriqueDeployement } from '../../types';

interface SiteDetailModalProps {
  site: SiteGAS;
  client?: ClientGAS;
  onClose: () => void;
}

type TabType = 'info' | 'guards';

const SiteDetailModal: React.FC<SiteDetailModalProps> = ({ site, client, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [deployments, setDeployments] = useState<HistoriqueDeployement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'guards') {
      loadDeploymentHistory();
    }
  }, [activeTab, site.id]);

  const loadDeploymentHistory = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const history = await window.electronAPI.getSiteDeploymentHistory(site.id);
        setDeployments(history || []);
      }
    } catch (error) {
      console.error('Error loading deployment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getMotifLabel = (motif: string) => {
    const labels: Record<string, string> = {
      'EMBAUCHE': 'Embauche',
      'TRANSFERT': 'Transfert',
      'DEMANDE_CLIENT': 'Demande client',
      'DISCIPLINAIRE': 'Disciplinaire',
      'REORGANISATION': 'Réorganisation',
      'AUTRE': 'Autre'
    };
    return labels[motif] || motif;
  };

  const getMotifBadgeColor = (motif: string) => {
    const colors: Record<string, string> = {
      'EMBAUCHE': 'bg-green-100 text-green-800',
      'TRANSFERT': 'bg-blue-100 text-blue-800',
      'DEMANDE_CLIENT': 'bg-orange-100 text-orange-800',
      'DISCIPLINAIRE': 'bg-red-100 text-red-800',
      'REORGANISATION': 'bg-purple-100 text-purple-800',
      'AUTRE': 'bg-gray-100 text-gray-800'
    };
    return colors[motif] || 'bg-gray-100 text-gray-800';
  };

  const getPosteBadge = (poste: string) => {
    if (poste === 'JOUR') return 'bg-yellow-100 text-yellow-800';
    if (poste === 'NUIT') return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  const currentDeployments = deployments.filter(d => d.est_actif);
  const pastDeployments = deployments.filter(d => !d.est_actif);

  const tabs = [
    { id: 'info' as TabType, label: 'Informations', icon: FileText },
    { id: 'guards' as TabType, label: 'Historique des Gardes', icon: History },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{site.nom_site}</h2>
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <Building2 className="w-4 h-4" />
                <span>{client?.nom_entreprise || 'Client inconnu'}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  site.est_actif ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {site.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 bg-gray-50">
          <nav className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Location Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Localisation</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {site.adresse_physique && (
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Adresse</p>
                        <p className="text-sm font-medium text-gray-900">{site.adresse_physique}</p>
                      </div>
                    </div>
                  )}
                  {site.latitude && site.longitude && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Coordonnées GPS</p>
                        <p className="text-sm font-medium text-gray-900">
                          {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Staffing */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Effectifs Requis</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <Sun className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-800">{site.effectif_jour_requis}</p>
                    <p className="text-sm text-yellow-600">Gardes Jour</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                    <Moon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-indigo-800">{site.effectif_nuit_requis}</p>
                    <p className="text-sm text-indigo-600">Gardes Nuit</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">
                      {site.effectif_jour_requis + site.effectif_nuit_requis}
                    </p>
                    <p className="text-sm text-blue-600">Total</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Tarification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Coût Unitaire par Garde</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${site.cout_unitaire_garde?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">par mois</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600">Tarif Mensuel Client</p>
                    <p className="text-xl font-bold text-green-700">
                      ${site.tarif_mensuel_client.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {site.effectif_jour_requis + site.effectif_nuit_requis} gardes × ${site.cout_unitaire_garde?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consignes */}
              {site.consignes_specifiques && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Consignes Spécifiques</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{site.consignes_specifiques}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guards' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <>
                  {/* Current Guards */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3 flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Gardes Actuellement Affectés ({currentDeployments.length})
                    </h3>
                    {currentDeployments.length > 0 ? (
                      <div className="space-y-3">
                        {currentDeployments.map((deployment) => (
                          <div key={deployment.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                                  {(deployment.employe_nom || 'G').charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{deployment.employe_nom || 'Garde inconnu'}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPosteBadge(deployment.poste)}`}>
                                      {deployment.poste}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Depuis le {formatDate(deployment.date_debut)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMotifBadgeColor(deployment.motif_affectation)}`}>
                                {getMotifLabel(deployment.motif_affectation)}
                              </span>
                            </div>
                            {deployment.notes && (
                              <p className="mt-2 text-sm text-green-700 bg-green-100 rounded p-2">
                                {deployment.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Aucun garde actuellement affecté</p>
                      </div>
                    )}
                  </div>

                  {/* Past Guards */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Historique des Affectations ({pastDeployments.length})
                    </h3>
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
                                    <p className="font-medium text-gray-900">{deployment.employe_nom || 'Garde inconnu'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPosteBadge(deployment.poste)}`}>
                                        {deployment.poste}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMotifBadgeColor(deployment.motif_affectation)}`}>
                                    {getMotifLabel(deployment.motif_affectation)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(deployment.date_debut)}</span>
                                  <ArrowRight className="w-4 h-4" />
                                  <span>{formatDate(deployment.date_fin)}</span>
                                  {deployment.duree_jours && (
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                      {deployment.duree_jours} jours
                                    </span>
                                  )}
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
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Aucun historique d'affectation</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteDetailModal;
