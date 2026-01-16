import { 
  X, Building2, Phone, Mail, MapPin, FileText, User, Calendar,
  DollarSign, Users, Edit, Sun, Moon, CreditCard, UserX, UserCheck
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
}

export default function ClientDetailModal({ client, sites, onClose, onEdit, onStatusChange }: ClientDetailModalProps) {
  const activeSites = sites.filter(s => s.est_actif);
  const totalEffectifJour = activeSites.reduce((sum, s) => sum + s.effectif_jour_requis, 0);
  const totalEffectifNuit = activeSites.reduce((sum, s) => sum + s.effectif_nuit_requis, 0);

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'ACTIF':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Actif</span>;
      case 'INACTIF':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Inactif</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{statut}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${
          client.type_client === 'MORALE' 
            ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
            : 'bg-gradient-to-r from-green-600 to-green-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{client.nom_entreprise}</h2>
              <p className="text-white/80 text-sm">
                {client.type_client === 'MORALE' ? 'Personne Morale' : 'Personne Physique'}
                {client.numero_contrat && ` • ${client.numero_contrat}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              title="Modifier"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Prix Total Mensuel</span>
              </div>
              <p className="text-2xl font-bold text-green-800">
                {client.totalPrice.toLocaleString()}
              </p>
              <p className="text-xs text-green-600">{client.devise_preferee}/mois</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Total Gardiens</span>
              </div>
              <p className="text-2xl font-bold text-blue-800">{client.totalGuards}</p>
              <p className="text-xs text-blue-600">agents déployés</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-700 mb-1">
                <Sun className="h-4 w-4" />
                <span className="text-xs font-medium">Effectif Jour</span>
              </div>
              <p className="text-2xl font-bold text-yellow-800">{totalEffectifJour}</p>
              <p className="text-xs text-yellow-600">gardes de jour</p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <Moon className="h-4 w-4" />
                <span className="text-xs font-medium">Effectif Nuit</span>
              </div>
              <p className="text-2xl font-bold text-indigo-800">{totalEffectifNuit}</p>
              <p className="text-xs text-indigo-600">gardes de nuit</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Principal */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Contact Principal
              </h4>
              <div className="space-y-2">
                {client.contact_nom && (
                  <p className="text-sm text-gray-700">{client.contact_nom}</p>
                )}
                {client.telephone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {client.telephone}
                  </div>
                )}
                {client.contact_email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {client.contact_email}
                  </div>
                )}
                {!client.contact_nom && !client.telephone && !client.contact_email && (
                  <p className="text-sm text-gray-400 italic">Non renseigné</p>
                )}
              </div>
            </div>

            {/* Contact Urgence */}
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-600" />
                Contact d'Urgence
              </h4>
              <div className="space-y-2">
                {client.contact_urgence_nom && (
                  <p className="text-sm text-gray-700">{client.contact_urgence_nom}</p>
                )}
                {client.contact_urgence_telephone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {client.contact_urgence_telephone}
                  </div>
                )}
                {!client.contact_urgence_nom && !client.contact_urgence_telephone && (
                  <p className="text-sm text-gray-400 italic">Non renseigné</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          {client.adresse_facturation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Adresse de Facturation
              </h4>
              <p className="text-sm text-gray-700">{client.adresse_facturation}</p>
            </div>
          )}

          {/* Legal Information */}
          {(client.nif || client.rccm || client.id_national) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Identifiants Légaux
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {client.nif && (
                  <div>
                    <p className="text-xs text-gray-500">NIF</p>
                    <p className="text-sm font-medium text-gray-900">{client.nif}</p>
                  </div>
                )}
                {client.rccm && (
                  <div>
                    <p className="text-xs text-gray-500">RCCM</p>
                    <p className="text-sm font-medium text-gray-900">{client.rccm}</p>
                  </div>
                )}
                {client.id_national && (
                  <div>
                    <p className="text-xs text-gray-500">ID National</p>
                    <p className="text-sm font-medium text-gray-900">{client.id_national}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Information */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Conditions de Facturation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Devise</p>
                <p className="text-sm font-medium text-gray-900">{client.devise_preferee}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Délai de Paiement</p>
                <p className="text-sm font-medium text-gray-900">{client.delai_paiement_jours} jours</p>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              Statut du Client
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Statut actuel:</span>
                {getStatusBadge(client.statut || 'ACTIF')}
              </div>
              {onStatusChange && (
                <div className="flex gap-2">
                  {client.statut === 'ACTIF' ? (
                    <button
                      onClick={() => onStatusChange(client.id, 'INACTIF')}
                      className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-1"
                    >
                      <UserX className="h-4 w-4" />
                      Désactiver
                    </button>
                  ) : (
                    <button
                      onClick={() => onStatusChange(client.id, 'ACTIF')}
                      className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="h-4 w-4" />
                      Réactiver
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {client.statut === 'ACTIF' 
                ? 'Un client inactif ne pourra plus être sélectionné pour créer de nouveaux sites.'
                : 'Réactivez ce client pour pouvoir créer de nouveaux sites.'}
            </p>
          </div>

          {/* Sites List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-600" />
              Sites ({sites.length})
            </h4>
            {sites.length > 0 ? (
              <div className="space-y-3">
                {sites.map(site => (
                  <div 
                    key={site.id} 
                    className={`p-4 rounded-lg border ${
                      site.est_actif 
                        ? 'bg-white border-gray-200' 
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900">{site.nom_site}</h5>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            site.est_actif 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {site.est_actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        {site.adresse_physique && (
                          <p className="text-sm text-gray-500 mt-1">{site.adresse_physique}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {site.tarif_mensuel_client.toLocaleString()} {client.devise_preferee}
                        </p>
                        <p className="text-xs text-gray-500">
                          {site.effectif_jour_requis + site.effectif_nuit_requis} gardiens
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Sun className="h-3 w-3 text-yellow-500" />
                        Jour: {site.effectif_jour_requis}
                      </span>
                      <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3 text-indigo-500" />
                        Nuit: {site.effectif_nuit_requis}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucun site enregistré pour ce client</p>
              </div>
            )}
          </div>

          {/* Created Date */}
          {client.cree_le && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Client créé le {new Date(client.cree_le).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Fermer
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Edit className="h-4 w-4" />
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
}
