import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Search, MapPin, Edit, Trash2, Building2, DollarSign,
  AlertCircle, Sun, Moon, Navigation, FileText, List, LayoutGrid, Eye,
  Power, PowerOff
} from 'lucide-react';
import { SiteGAS, ClientGAS } from '../../types';
import SiteForm from './SiteForm';
import SiteDetailModal from './SiteDetailModal';

// Check if running in Electron
const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

export default function SitesManagement() {
  const electronMode = useMemo(() => isElectron(), []);
  
  const [sites, setSites] = useState<SiteGAS[]>([]);
  const [clients, setClients] = useState<ClientGAS[]>([]);
  const [activeClients, setActiveClients] = useState<ClientGAS[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteGAS | null>(null);
  const [viewingSite, setViewingSite] = useState<SiteGAS | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'inactif'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (electronMode && window.electronAPI) {
        const [sitesData, clientsData, activeClientsData] = await Promise.all([
          window.electronAPI.getSitesGAS(),
          window.electronAPI.getClientsGAS(),
          window.electronAPI.getActiveClientsGAS ? window.electronAPI.getActiveClientsGAS() : window.electronAPI.getClientsGAS()
        ]);
        setSites(sitesData || []);
        setClients(clientsData || []);
        setActiveClients(activeClientsData || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.nom_entreprise || 'Client inconnu';
  };

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce site ? Cette action est irréversible.')) return;

    try {
      if (electronMode && window.electronAPI) {
        await window.electronAPI.deleteSiteGAS(id);
        await loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du site');
    }
  };

  const handleStatusChange = async (id: string, newStatus: boolean) => {
    const site = sites.find(s => s.id === id);
    const statusText = newStatus ? 'activer' : 'désactiver';
    const confirmMessage = newStatus 
      ? `Voulez-vous vraiment activer le site "${site?.nom_site}" ?`
      : `Voulez-vous vraiment désactiver le site "${site?.nom_site}" ?\n\nCela fermera automatiquement tous les déploiements actifs et supprimera les affectations des gardes à ce site.`;
    
    if (!confirm(confirmMessage)) return;

    try {
      console.log(`🔄 Frontend: Changing site ${id} status to ${newStatus ? 'ACTIF' : 'INACTIF'}`);
      
      if (electronMode && window.electronAPI?.updateSiteStatusGAS) {
        console.log(`📡 Frontend: Calling backend updateSiteStatusGAS...`);
        const result = await window.electronAPI.updateSiteStatusGAS({ id, est_actif: newStatus });
        console.log('✅ Frontend: Site status change result:', result);
        
        // Show detailed results if it was a deactivation
        if (!newStatus && result.deploymentsClosed !== undefined) {
          alert(`Site désactivé avec succès!\n\n` +
                `Résultats:\n` +
                `• Site mis à jour: ${result.siteUpdated || 0}\n` +
                `• Déploiements fermés: ${result.deploymentsClosed || 0}\n` +
                `• Affectations supprimées: ${result.employeeAssignmentsCleared || 0}`);
        } else if (!newStatus) {
          alert(`Site désactivé, mais aucun détail sur les changements cascadés n'a été retourné.`);
        } else {
          alert(`Site activé avec succès!`);
        }
        
        await loadData();
      } else {
        console.log(`❌ Frontend: Cannot change status - electronMode: ${electronMode}, API available: ${!!window.electronAPI?.updateSiteStatusGAS}`);
        alert('Cette fonctionnalité nécessite le mode Electron');
      }
    } catch (error) {
      console.error('❌ Frontend: Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut: ' + error.message);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSite(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadData();
  };

  const filteredSites = sites.filter(site => {
    const clientName = getClientName(site.client_id);
    const matchesSearch =
      site.nom_site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.adresse_physique?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'actif' && site.est_actif) ||
      (statusFilter === 'inactif' && !site.est_actif);

    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalEffectifJour = filteredSites.reduce((sum, s) => sum + s.effectif_jour_requis, 0);
  const totalEffectifNuit = filteredSites.reduce((sum, s) => sum + s.effectif_nuit_requis, 0);
  const totalRevenuMensuel = filteredSites.filter(s => s.est_actif).reduce((sum, s) => sum + s.tarif_mensuel_client, 0);

  if (!electronMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Module Non Disponible</h3>
          <p className="text-gray-600">Ce module nécessite le mode Electron</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Sites</h2>
          <p className="text-gray-600 mt-1">
            {sites.length} site{sites.length !== 1 ? 's' : ''} • {sites.filter(s => s.est_actif).length} actif{sites.filter(s => s.est_actif).length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Site</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sites Actifs</p>
              <p className="text-xl font-bold text-gray-900">{sites.filter(s => s.est_actif).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Sun className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Effectif Jour</p>
              <p className="text-xl font-bold text-gray-900">{totalEffectifJour} gardes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Moon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Effectif Nuit</p>
              <p className="text-xl font-bold text-gray-900">{totalEffectifNuit} gardes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenu Mensuel</p>
              <p className="text-xl font-bold text-gray-900">${totalRevenuMensuel.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, client ou adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les Statuts</option>
            <option value="actif">Actifs uniquement</option>
            <option value="inactif">Inactifs uniquement</option>
          </select>
          
          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 flex items-center gap-1 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Vue Liste"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 flex items-center gap-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jour</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nuit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Coût Unitaire</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tarif Mensuel</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        site.est_actif ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <MapPin className={`h-4 w-4 ${site.est_actif ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{site.nom_site}</p>
                        {site.adresse_physique && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">{site.adresse_physique}</p>
                        )}
                        {!site.client_actif && (
                          <p className="text-xs text-orange-600 font-medium">⚠️ Client inactif</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Building2 className="h-3 w-3" />
                      {getClientName(site.client_id)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-sm">
                      <Sun className="h-3 w-3" />
                      {site.effectif_jour_requis}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm">
                      <Moon className="h-3 w-3" />
                      {site.effectif_nuit_requis}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    ${site.cout_unitaire_garde?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-green-700">${site.tarif_mensuel_client.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      site.est_actif
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {site.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingSite(site)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(site.id, !site.est_actif)}
                        disabled={!site.est_actif && !site.client_actif}
                        className={`p-1.5 rounded transition-colors ${
                          site.est_actif
                            ? 'text-orange-600 hover:bg-orange-50'
                            : site.client_actif
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          site.est_actif 
                            ? 'Désactiver le site' 
                            : site.client_actif
                              ? 'Activer le site'
                              : 'Impossible d\'activer - Client inactif'
                        }
                      >
                        {site.est_actif ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSite(site);
                          setShowForm(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(site.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <div key={site.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      site.est_actif ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <MapPin className={`h-6 w-6 ${site.est_actif ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{site.nom_site}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {getClientName(site.client_id)}
                      </p>
                      {!site.client_actif && (
                        <p className="text-xs text-orange-600 font-medium">⚠️ Client inactif</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    site.est_actif
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {site.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Adresse */}
                {site.adresse_physique && (
                  <div className="flex items-start text-sm text-gray-600">
                    <Navigation className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
                    <span className="line-clamp-2">{site.adresse_physique}</span>
                  </div>
                )}

                {/* GPS */}
                {site.latitude && site.longitude && (
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    GPS: {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                  </div>
                )}

                {/* Effectifs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div className="flex items-center text-xs text-yellow-700">
                      <Sun className="h-3 w-3 mr-1" />
                      Jour
                    </div>
                    <span className="text-sm font-semibold text-yellow-800">
                      {site.effectif_jour_requis}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-indigo-50 rounded">
                    <div className="flex items-center text-xs text-indigo-700">
                      <Moon className="h-3 w-3 mr-1" />
                      Nuit
                    </div>
                    <span className="text-sm font-semibold text-indigo-800">
                      {site.effectif_nuit_requis}
                    </span>
                  </div>
                </div>

                {/* Tarifs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-xs text-green-700">Tarif Mensuel Client</span>
                    <span className="text-sm font-semibold text-green-800">
                      ${site.tarif_mensuel_client.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs text-gray-600">Coût Unitaire/Garde</span>
                    <span className="text-sm font-semibold text-gray-800">
                      ${site.cout_unitaire_garde?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>

                {/* Consignes */}
                {site.consignes_specifiques && (
                  <div className="p-2 bg-blue-50 rounded border border-blue-100">
                    <div className="flex items-center text-xs text-blue-700 mb-1">
                      <FileText className="h-3 w-3 mr-1" />
                      Consignes Spécifiques
                    </div>
                    <p className="text-xs text-blue-800 line-clamp-2">{site.consignes_specifiques}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => setViewingSite(site)}
                  className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>Détails</span>
                </button>
                <button
                  onClick={() => handleStatusChange(site.id, !site.est_actif)}
                  disabled={!site.est_actif && !site.client_actif}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium ${
                    site.est_actif
                      ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                      : site.client_actif
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                  title={
                    site.est_actif 
                      ? 'Désactiver' 
                      : site.client_actif
                        ? 'Activer'
                        : 'Impossible d\'activer - Client inactif'
                  }
                >
                  {site.est_actif ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  <span>{site.est_actif ? 'Désactiver' : 'Activer'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditingSite(site);
                    setShowForm(true);
                  }}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDelete(site.id)}
                  className="bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredSites.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun site trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Essayez d\'ajuster vos critères de recherche.'
              : 'Commencez par ajouter votre premier site.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter le Premier Site
            </button>
          )}
        </div>
      )}

      {/* Site Form Modal */}
      {showForm && (
        <SiteForm
          site={editingSite}
          clients={activeClients}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Site Detail Modal */}
      {viewingSite && (
        <SiteDetailModal
          site={viewingSite}
          client={getClient(viewingSite.client_id)}
          onClose={() => setViewingSite(null)}
          onEdit={() => {
            setEditingSite(viewingSite);
            setViewingSite(null);
            setShowForm(true);
          }}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
