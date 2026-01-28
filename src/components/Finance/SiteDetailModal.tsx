import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Building2, Users, Sun, Moon, DollarSign, 
  Calendar, ArrowRight, Navigation, UserCheck, History, 
  Phone, Mail, Edit, Download, FileText
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
  const [activeTab, setActiveTab] = useState('profile');

  // Tab configuration
  const tabs = [
    { id: 'profile', label: 'Profil', icon: Building2 },
    { id: 'guards', label: 'Gardes', icon: UserCheck },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'reports', label: 'Rapports', icon: FileText }
  ];

  // Pagination for history table
  const ITEMS_PER_PAGE = 10;
  
  // Past deployments pagination (for history table)
  const pastDeployments = deployments.filter(d => !d.est_actif);
  const historyPagination = usePagination({ 
    data: pastDeployments, 
    itemsPerPage: ITEMS_PER_PAGE 
  });

  // Current deployments pagination (for guards table)
  const currentDeployments = deployments.filter(d => d.est_actif);
  const currentPagination = usePagination({ 
    data: currentDeployments, 
    itemsPerPage: ITEMS_PER_PAGE 
  });

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

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Site Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Informations du Site</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Client</p>
                          <p className="text-sm font-medium">{client?.nom_entreprise || 'Client inconnu'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Date de Création</p>
                          <p className="text-sm font-medium">{formatDate(site.cree_le)}</p>
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
                  </div>

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

                  {/* Staffing Requirements */}
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

                  {/* Pricing Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Informations Tarifaires</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Special Instructions */}
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
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-green-600 font-medium uppercase">Gardes Actifs</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">{currentDeployments.length}</p>
                      <p className="text-xs text-green-600 mt-1">
                        sur {site.effectif_jour_requis + site.effectif_nuit_requis} requis
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-xs text-yellow-600 font-medium uppercase">Postes Jour</p>
                      <p className="text-2xl font-bold text-yellow-700 mt-1">
                        {currentDeployments.filter(d => d.poste === 'JOUR').length}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        sur {site.effectif_jour_requis} requis
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <p className="text-xs text-indigo-600 font-medium uppercase">Postes Nuit</p>
                      <p className="text-2xl font-bold text-indigo-700 mt-1">
                        {currentDeployments.filter(d => d.poste === 'NUIT').length}
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">
                        sur {site.effectif_nuit_requis} requis
                      </p>
                    </div>
                  </div>

                  {/* Current Guards Table */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Gardes Actuellement Affectés</h3>
                    {currentDeployments.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Garde
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Poste
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                  Date Début
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
                              {currentPagination.paginatedData.map((deployment) => (
                                <tr key={deployment.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
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
                                    {formatDate(deployment.date_debut)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getMotifBadgeColor(deployment.motif_affectation)}`}>
                                      {getMotifLabel(deployment.motif_affectation)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                                    <div className="truncate" title={deployment.notes || ''}>
                                      {deployment.notes || '-'}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {currentPagination.totalPages > 1 && (
                          <Pagination
                            currentPage={currentPagination.currentPage}
                            totalPages={currentPagination.totalPages}
                            onPageChange={currentPagination.setCurrentPage}
                            itemsPerPage={ITEMS_PER_PAGE}
                            totalItems={currentDeployments.length}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Aucun garde actuellement affecté</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Historique des Affectations</h3>
                  {pastDeployments.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                Garde
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
                                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                                    <div className="truncate" title={deployment.notes || ''}>
                                      {deployment.notes || '-'}
                                    </div>
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
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Rapports et Documents</h3>
                  
                  {/* Site Performance Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Taux d'Occupation</h4>
                      <div className="text-2xl font-bold text-blue-700">
                        {Math.round((currentDeployments.length / (site.effectif_jour_requis + site.effectif_nuit_requis)) * 100)}%
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {currentDeployments.length} sur {site.effectif_jour_requis + site.effectif_nuit_requis} postes
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">Total Affectations</h4>
                      <div className="text-2xl font-bold text-purple-700">{deployments.length}</div>
                      <p className="text-xs text-purple-600 mt-1">Depuis la création</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Actions Rapides</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Download className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">Exporter Historique</p>
                          <p className="text-xs text-gray-500">Télécharger l'historique des gardes</p>
                        </div>
                      </button>
                      <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">Rapport Mensuel</p>
                          <p className="text-xs text-gray-500">Générer rapport d'activité</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Activité Récente</h4>
                    <div className="space-y-3">
                      {deployments
                        .sort((a, b) => new Date(b.cree_le || b.date_debut).getTime() - new Date(a.cree_le || a.date_debut).getTime())
                        .slice(0, 5)
                        .map((deployment) => (
                          <div key={deployment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {deployment.est_actif ? 'Affectation' : 'Fin d\'affectation'} - {deployment.employe_nom}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(deployment.est_actif ? deployment.date_debut : deployment.date_fin)} • {deployment.poste}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
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
