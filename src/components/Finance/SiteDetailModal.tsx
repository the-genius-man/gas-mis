import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Building2, Users, Sun, Moon, DollarSign, 
  Calendar, ArrowRight, History, 
  Phone, Mail, Edit
} from 'lucide-react';
import { SiteGAS, ClientGAS, HistoriqueDeployement } from '../../types';
import Pagination from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface SiteDetailModalProps {
  site: SiteGAS;
  client?: ClientGAS;
  onClose: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
}

const SiteDetailModal: React.FC<SiteDetailModalProps> = ({ site, client, onClose, onEdit, onRefresh }) => {
  const [siteDetails, setSiteDetails] = useState<any>(null);
  const [deployments, setDeployments] = useState<HistoriqueDeployement[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination for history table
  const ITEMS_PER_PAGE = 10;
  
  // Past deployments pagination (for history table)
  const pastDeployments = deployments.filter(d => !d.est_actif);
  const historyPagination = usePagination({ 
    data: pastDeployments, 
    itemsPerPage: ITEMS_PER_PAGE 
  });

  // Current deployments
  const currentDeployments = deployments.filter(d => d.est_actif);

  useEffect(() => {
    loadDetails();
  }, [site.id]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [details, history] = await Promise.all([
          window.electronAPI.getSiteGAS(site.id),
          window.electronAPI.getSiteDeploymentHistory(site.id)
        ]);
        setSiteDetails(details || site);
        setDeployments(history || []);
      }
    } catch (error) {
      console.error('Error loading site details:', error);
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

  const getStatutBadge = (statut: boolean) => {
    return statut ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{site.nom_site}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-4 h-4" />
                <span>{client?.nom_entreprise || 'Client inconnu'}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatutBadge(site.est_actif)}`}>
                  {site.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Site Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du Site</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Client</p>
                        <p className="text-sm font-medium">{client?.nom_entreprise || 'Client inconnu'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Contact Client</p>
                        <p className="text-sm font-medium">{client?.telephone || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email Client</p>
                        <p className="text-sm font-medium">{client?.email || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Date de Création (Déploiement)</p>
                        <p className="text-sm font-medium">{formatDate(site.cree_le)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Coût Unitaire par Garde</p>
                        <p className="text-sm font-medium">${site.cout_unitaire_garde?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Total Mensuel</p>
                        <p className="text-sm font-medium text-green-700">${site.tarif_mensuel_client.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guards Required */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Gardes Requis</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <Sun className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-xl font-bold text-yellow-800">{site.effectif_jour_requis}</p>
                      <p className="text-xs text-yellow-600">Jour</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                      <Moon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                      <p className="text-xl font-bold text-indigo-800">{site.effectif_nuit_requis}</p>
                      <p className="text-xs text-indigo-600">Nuit</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-xl font-bold text-blue-800">
                        {site.effectif_jour_requis + site.effectif_nuit_requis}
                      </p>
                      <p className="text-xs text-blue-600">Total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Guards */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gardes Actuels</h3>
                {currentDeployments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentDeployments.map((deployment) => (
                      <div key={deployment.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                            {(deployment.employe_nom || 'G').charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{deployment.employe_nom || 'Garde inconnu'}</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPosteBadge(deployment.poste)}`}>
                              {deployment.poste}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Depuis: {formatDate(deployment.date_debut)}</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${getMotifBadgeColor(deployment.motif_affectation)}`}>
                          {getMotifLabel(deployment.motif_affectation)}
                        </span>
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

              {/* Guards History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des Gardes</h3>
                {pastDeployments.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Garde
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Poste
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Période
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durée
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Motif
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {historyPagination.paginatedData
                            .sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime())
                            .map((deployment) => (
                              <tr key={deployment.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm">
                                      {(deployment.employe_nom || 'G').charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-900">{deployment.employe_nom || 'Garde inconnu'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPosteBadge(deployment.poste)}`}>
                                    {deployment.poste}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <span>{formatDate(deployment.date_debut)}</span>
                                    <ArrowRight className="w-3 h-3 text-gray-400" />
                                    <span>{formatDate(deployment.date_fin)}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {deployment.duree_jours && (
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">
                                      {deployment.duree_jours} jours
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${getMotifBadgeColor(deployment.motif_affectation)}`}>
                                    {getMotifLabel(deployment.motif_affectation)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {historyPagination.totalPages > 1 && (
                      <Pagination
                        currentPage={historyPagination.currentPage}
                        totalPages={historyPagination.totalPages}
                        onPageChange={historyPagination.setCurrentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={pastDeployments.length}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Aucun historique d'affectation</p>
                  </div>
                )}
              </div>
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
