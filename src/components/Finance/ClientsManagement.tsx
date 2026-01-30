import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Search, Building2, Edit, Trash2, Phone, MapPin, 
  User, AlertCircle, Eye, List, LayoutGrid, Users, DollarSign, Upload
} from 'lucide-react';
import ClientFormWizard from './ClientFormWizard';
import ClientDetailModal from './ClientDetailModal';
import BulkActions, { createBulkActions } from '../common/BulkActions';
import { ClientGAS, SiteGAS } from '../../types';

// Check if running in Electron
const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

type ViewMode = 'list' | 'grid';

interface ClientWithStats extends ClientGAS {
  totalPrice: number;
  totalGuards: number;
  sitesCount: number;
}

export default function ClientsManagement({ onNavigateToSites }: { onNavigateToSites?: () => void }) {
  const electronMode = useMemo(() => isElectron(), []);
  
  const [clients, setClients] = useState<ClientGAS[]>([]);
  const [sites, setSites] = useState<SiteGAS[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientGAS | null>(null);
  const [viewingClient, setViewingClient] = useState<ClientWithStats | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'MORALE' | 'PHYSIQUE'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIF' | 'INACTIF'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Bulk actions state
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (electronMode && window.electronAPI) {
        const [clientsData, sitesData] = await Promise.all([
          window.electronAPI.getClientsGAS(),
          window.electronAPI.getSitesGAS()
        ]);
        setClients(clientsData || []);
        setSites(sitesData || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for each client
  const getClientStats = (clientId: string): { totalPrice: number; totalGuards: number; sitesCount: number } => {
    const clientSites = sites.filter(s => s.client_id === clientId && s.est_actif);
    const totalPrice = clientSites.reduce((sum, s) => sum + s.tarif_mensuel_client, 0);
    const totalGuards = clientSites.reduce((sum, s) => sum + s.effectif_jour_requis + s.effectif_nuit_requis, 0);
    return { totalPrice, totalGuards, sitesCount: clientSites.length };
  };

  const clientsWithStats: ClientWithStats[] = clients.map(client => ({
    ...client,
    ...getClientStats(client.id)
  }));

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment désactiver ce client ? Le client sera marqué comme supprimé mais ses factures seront conservées pour les rapports comptables.')) return;

    try {
      if (electronMode && window.electronAPI) {
        await window.electronAPI.deleteClientGAS(id);
        await loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du client');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadData();
  };

  const handleStatusChange = async (id: string, newStatus: 'ACTIF' | 'INACTIF' | 'SUPPRIME') => {
    try {
      console.log(`🔄 Frontend: Changing client ${id} status to ${newStatus}`);
      console.log(`🔍 Frontend: Electron mode: ${electronMode}`);
      console.log(`🔍 Frontend: electronAPI available:`, !!window.electronAPI);
      console.log(`🔍 Frontend: updateClientStatusGAS available:`, !!window.electronAPI?.updateClientStatusGAS);
      
      if (electronMode && window.electronAPI?.updateClientStatusGAS) {
        console.log(`📡 Frontend: Calling backend updateClientStatusGAS...`);
        const result = await window.electronAPI.updateClientStatusGAS({ id, statut: newStatus });
        console.log('✅ Frontend: Status change result:', result);
        
        // Show detailed results if it was a deactivation
        if (newStatus === 'INACTIF' && result.sitesDeactivated !== undefined) {
          alert(`Client désactivé avec succès!\n\n` +
                `Résultats:\n` +
                `• Client mis à jour: ${result.clientUpdated || 0}\n` +
                `• Sites désactivés: ${result.sitesDeactivated || 0}\n` +
                `• Déploiements fermés: ${result.deploymentsClosed || 0}\n` +
                `• Affectations supprimées: ${result.employeeAssignmentsCleared || 0}`);
        } else if (newStatus === 'INACTIF') {
          alert(`Client désactivé, mais aucun détail sur les changements cascadés n'a été retourné.`);
        }
        
        setViewingClient(null);
        await loadData();
      } else {
        console.log(`❌ Frontend: Cannot change status - electronMode: ${electronMode}, API available: ${!!window.electronAPI?.updateClientStatusGAS}`);
        alert('Cette fonctionnalité nécessite le mode Electron');
      }
    } catch (error) {
      console.error('❌ Frontend: Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut: ' + error.message);
    }
  };

  const handleViewClient = (client: ClientWithStats) => {
    setViewingClient(client);
  };

  // Bulk action handlers
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedClients(filteredClients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedClients([]);
  };

  const handleBulkAction = async (actionId: string, selectedIds: string[]) => {
    setBulkActionLoading(true);
    try {
      switch (actionId) {
        case 'activate':
          await handleBulkActivate(selectedIds);
          break;
        case 'deactivate':
          await handleBulkDeactivate(selectedIds);
          break;
        case 'delete':
          await handleBulkDelete(selectedIds);
          break;
      }
      setSelectedClients([]);
      await loadData();
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('Erreur lors de l\'opération en lot');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkActivate = async (clientIds: string[]) => {
    for (const id of clientIds) {
      if (window.electronAPI?.updateClientStatusGAS) {
        await window.electronAPI.updateClientStatusGAS({ id, statut: 'ACTIF' });
      }
    }
  };

  const handleBulkDeactivate = async (clientIds: string[]) => {
    for (const id of clientIds) {
      if (window.electronAPI?.updateClientStatusGAS) {
        await window.electronAPI.updateClientStatusGAS({ id, statut: 'INACTIF' });
      }
    }
  };

  const handleBulkDelete = async (clientIds: string[]) => {
    for (const id of clientIds) {
      if (window.electronAPI?.deleteClientGAS) {
        await window.electronAPI.deleteClientGAS(id);
      }
    }
  };

  const handleClientSelect = (clientId: string, selected: boolean) => {
    if (selected) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleImportCustomers = async () => {
    if (!window.electronAPI?.importCustomersFromExcel) {
      alert('Fonctionnalité d\'importation non disponible');
      return;
    }

    try {
      setImporting(true);
      console.log('🔄 Starting customer import from Excel...');
      
      const result = await window.electronAPI.importCustomersFromExcel();
      
      if (result.success) {
        const message = `Import terminé avec succès!\n\n` +
                       `Résultats:\n` +
                       `• Clients créés: ${result.clientsCreated || 0}\n` +
                       `• Sites créés: ${result.sitesCreated || 0}\n` +
                       `• Lignes traitées: ${result.totalProcessed || 0}\n` +
                       `• Erreurs: ${result.errors?.length || 0}`;
        
        if (result.errors && result.errors.length > 0) {
          const errorDetails = result.errors.slice(0, 5).map(err => `  - ${err}`).join('\n');
          alert(message + `\n\nPremières erreurs:\n${errorDetails}` + 
                (result.errors.length > 5 ? `\n  ... et ${result.errors.length - 5} autres` : ''));
        } else {
          alert(message);
        }
        
        // Refresh data
        await loadData();
        setShowImportModal(false);
      } else {
        alert(`Erreur lors de l'import: ${result.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('❌ Error importing customers:', error);
      alert('Erreur lors de l\'importation: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const filteredClients = clientsWithStats.filter(client => {
    const matchesSearch =
      client.nom_entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.numero_contrat?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || client.type_client === typeFilter;
    const matchesStatus = statusFilter === 'all' || client.statut === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'ACTIF':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Actif</span>;
      case 'INACTIF':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Inactif</span>;
      case 'SUPPRIME':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Supprimé</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{statut}</span>;
    }
  };

  if (!electronMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Module Non Disponible</h3>
          <p className="text-gray-600">Ce module nécessite le mode Electron avec base de données locale</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
          <p className="text-gray-600 mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            <span>Importer Excel</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Client</span>
          </button>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, NIF, contrat ou contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les Types</option>
            <option value="MORALE">Personne Morale</option>
            <option value="PHYSIQUE">Personne Physique</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les Statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
          </select>
          
          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Vue Liste"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Vue Grille"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedClients}
        totalItems={filteredClients.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        actions={[
          createBulkActions.activate('Activer'),
          createBulkActions.deactivate('Désactiver'),
          createBulkActions.delete('Supprimer')
        ]}
        onAction={handleBulkAction}
        loading={bulkActionLoading}
      />

      {/* List View */}
      {viewMode === 'list' && filteredClients.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                      ref={(input) => {
                        if (input) input.indeterminate = selectedClients.length > 0 && selectedClients.length < filteredClients.length;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gardiens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => handleClientSelect(client.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          client.type_client === 'MORALE' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <Building2 className={`h-5 w-5 ${
                            client.type_client === 'MORALE' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div className="ml-3">
                          <button
                            onClick={() => handleViewClient(client)}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                          >
                            {client.nom_entreprise}
                          </button>
                          <p className="text-xs text-gray-500">
                            {client.type_client === 'MORALE' ? 'Entreprise' : 'Particulier'}
                            {client.numero_contrat && ` • ${client.numero_contrat}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(client.statut || 'ACTIF')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {client.adresse_facturation || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="text-gray-900">{client.contact_nom || '-'}</p>
                        <p className="text-gray-500">{client.telephone || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{client.totalGuards}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold text-green-600">
                          {client.totalPrice.toLocaleString()} {client.devise_preferee}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredClients.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={(e) => handleClientSelect(client.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    />
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      client.type_client === 'MORALE' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Building2 className={`h-6 w-6 ${
                        client.type_client === 'MORALE' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <button
                        onClick={() => handleViewClient(client)}
                        className="font-semibold text-gray-900 hover:text-blue-600 hover:underline text-left line-clamp-1"
                      >
                        {client.nom_entreprise}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                          client.type_client === 'MORALE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {client.type_client === 'MORALE' ? 'Personne Morale' : 'Personne Physique'}
                        </span>
                        {getStatusBadge(client.statut || 'ACTIF')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {client.adresse_facturation && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{client.adresse_facturation}</span>
                  </div>
                )}

                {client.contact_nom && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{client.contact_nom}</span>
                  </div>
                )}

                {client.telephone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{client.telephone}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center text-xs text-blue-700">
                      <Users className="h-3 w-3 mr-1" />
                      Gardiens
                    </div>
                    <span className="text-sm font-bold text-blue-800">{client.totalGuards}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center text-xs text-green-700">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Prix
                    </div>
                    <span className="text-sm font-bold text-green-800">{client.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => handleViewClient(client)}
                  className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>Voir</span>
                </button>
                <button
                  onClick={() => {
                    setEditingClient(client);
                    setShowForm(true);
                  }}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || typeFilter !== 'all'
              ? 'Essayez d\'ajuster vos critères de recherche.'
              : 'Commencez par ajouter votre premier client.'}
          </p>
          {!searchTerm && typeFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter le Premier Client
            </button>
          )}
        </div>
      )}

      {/* Client Form Modal */}
      {showForm && (
        <ClientFormWizard
          client={editingClient}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Client Detail Modal */}
      {viewingClient && (
        <ClientDetailModal
          client={viewingClient}
          sites={sites.filter(s => s.client_id === viewingClient.id)}
          onClose={() => setViewingClient(null)}
          onEdit={() => {
            setEditingClient(viewingClient);
            setViewingClient(null);
            setShowForm(true);
          }}
          onStatusChange={handleStatusChange}
          onNavigateToSites={onNavigateToSites}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Importer des Clients depuis Excel</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Instructions d'importation</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Le fichier customers.xlsx sera utilisé depuis le dossier public</li>
                  <li>• Chaque ligne représente un client potentiel</li>
                  <li>• Les clients en double deviennent des sites du même client</li>
                  <li>• Les données existantes ne seront pas écrasées</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Attention</h4>
                <p className="text-sm text-yellow-800">
                  Cette opération va créer de nouveaux clients et sites. 
                  Assurez-vous que le fichier Excel est correctement formaté.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleImportCustomers}
                disabled={importing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importation...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
