import React from 'react';
import { 
  X, Building2, Edit, MapPin, Phone, Mail, FileText, DollarSign, 
  Calendar, CreditCard, User, Users
} from 'lucide-react';
import { ClientGAS, SiteGAS, StatutClient } from '../../types';

interface ClientWithStats extends ClientGAS {
  totalPrice: number;
  totalGuards: number;
  sitesCount: number;
}

interface ClientDetailModalProps {
  client: ClientWithStats;
  sites: SiteGAS[];
  onClose: () => void;
  onEdit: () => void;
  onStatusChange?: (id: string, newStatus: StatutClient) => void;
  onNavigateToSites?: () => void;
}

export default function ClientDetailModal({ client, sites, onClose, onEdit, onStatusChange, onNavigateToSites }: ClientDetailModalProps) {
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'ACTIF':
        return 'bg-green-100 text-green-800';
      case 'INACTIF':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{client.nom_entreprise}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{client.type_client === 'MORALE' ? 'Personne Morale' : 'Personne Physique'}</span>
                {client.numero_contrat && (
                  <>
                    <span>•</span>
                    <span>{client.numero_contrat}</span>
                  </>
                )}
                <span>•</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(client.statut || 'ACTIF')}`}>
                  {client.statut || 'ACTIF'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={async () => {
                  if (window.electronAPI?.testClientDeactivation) {
                    const result = await window.electronAPI.testClientDeactivation(client.id);
                    console.log('🧪 Client test result:', result);
                    alert(`Test Results:\n\nClient: ${result.client?.nom_entreprise} (${result.client?.statut})\nSites: ${result.summary.totalSites} total, ${result.summary.activeSites} active\nActive Deployments: ${result.summary.activeDeployments}\nAssigned Employees: ${result.summary.assignedEmployees}`);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm"
              >
                🧪 Test
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Key Stats */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Statistiques</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Chiffre d'Affaires Mensuel</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {client.totalPrice.toLocaleString()} {client.devise_preferee}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Gardiens</p>
                  <p className="text-lg font-semibold text-gray-900">{client.totalGuards}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Sites Actifs</p>
                  <p className="text-lg font-semibold text-gray-900">{sites.filter(s => s.est_actif).length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500">Délai de Paiement</p>
                  <p className="text-lg font-semibold text-gray-900">{client.delai_paiement_jours} jours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Informations de Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Contact Principal</p>
                  <p className="text-sm font-medium">{client.contact_nom || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium">{client.telephone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium">{client.contact_email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Adresse</p>
                  <p className="text-sm font-medium">{client.adresse_facturation || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(client.contact_urgence_nom || client.contact_urgence_telephone) && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Contact d'Urgence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-xs text-gray-500">Nom</p>
                    <p className="text-sm font-medium">{client.contact_urgence_nom || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="text-sm font-medium">{client.contact_urgence_telephone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal Information */}
          {(client.nif || client.rccm || client.id_national) && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Identifiants Légaux</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {client.nif && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-500">NIF</p>
                      <p className="text-sm font-medium">{client.nif}</p>
                    </div>
                  </div>
                )}
                {client.rccm && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-500">RCCM</p>
                      <p className="text-sm font-medium">{client.rccm}</p>
                    </div>
                  </div>
                )}
                {client.id_national && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-500">ID National</p>
                      <p className="text-sm font-medium">{client.id_national}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sites List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Sites ({sites.length})</h3>
              {sites.length > 0 && onNavigateToSites && (
                <button
                  onClick={() => {
                    onNavigateToSites();
                    onClose();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Gérer tous les sites →
                </button>
              )}
            </div>
            
            {sites.length > 0 ? (
              <div className="space-y-4">
                {sites.map(site => (
                  <div 
                    key={site.id} 
                    onClick={() => {
                      if (onNavigateToSites) {
                        onNavigateToSites();
                        onClose();
                      }
                    }}
                    className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                      site.est_actif 
                        ? 'bg-white border-gray-200' 
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <h4 className="font-medium text-gray-900">{site.nom_site}</h4>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            site.est_actif 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {site.est_actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        {site.adresse_physique && (
                          <p className="text-sm text-gray-500 mb-2">{site.adresse_physique}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Jour: {site.effectif_jour_requis} gardiens</span>
                          <span>Nuit: {site.effectif_nuit_requis} gardiens</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {site.tarif_mensuel_client.toLocaleString()} {client.devise_preferee}
                        </p>
                        <p className="text-sm text-gray-500">
                          {site.effectif_jour_requis + site.effectif_nuit_requis} gardiens total
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun site enregistré pour ce client</p>
              </div>
            )}
          </div>

          {/* Status Management */}
          {onStatusChange && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Gestion du Statut</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Statut actuel:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(client.statut || 'ACTIF')}`}>
                    {client.statut || 'ACTIF'}
                  </span>
                </div>
                {client.statut === 'ACTIF' ? (
                  <button
                    onClick={() => onStatusChange(client.id, 'INACTIF')}
                    className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    Désactiver
                  </button>
                ) : (
                  <button
                    onClick={() => onStatusChange(client.id, 'ACTIF')}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Réactiver
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
