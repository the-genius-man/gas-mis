import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Search, Plus, Filter, Eye, Edit, MapPin, Users, Building2, Shield } from 'lucide-react';
import { Site } from '../../types';

interface SiteListProps {
  onAddSite: () => void;
  onViewSite: (site: Site) => void;
  onEditSite: (site: Site) => void;
}

export default function SiteList({ onAddSite, onViewSite, onEditSite }: SiteListProps) {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'office' | 'warehouse' | 'retail' | 'residential' | 'event' | 'other'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'setup'>('all');

  const filteredSites = state.sites.filter(site => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || site.siteDetails.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'setup':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'actif';
      case 'inactive':
        return 'inactif';
      case 'setup':
        return 'configuration';
      default:
        return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'office':
        return 'bg-blue-100 text-blue-800';
      case 'warehouse':
        return 'bg-orange-100 text-orange-800';
      case 'retail':
        return 'bg-green-100 text-green-800';
      case 'residential':
        return 'bg-purple-100 text-purple-800';
      case 'event':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'office':
        return 'bureau';
      case 'warehouse':
        return 'entrepôt';
      case 'retail':
        return 'commerce de détail';
      case 'residential':
        return 'résidentiel';
      case 'event':
        return 'événement';
      case 'other':
        return 'autre';
      default:
        return type;
    }
  };

  const getClientName = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    return client?.name || 'Client Inconnu';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Sites</h2>
          <p className="text-gray-600 mt-1">Gérez les emplacements de sécurité et les sites de déploiement</p>
        </div>
        <button
          onClick={onAddSite}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un Site</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher des sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les Types</option>
              <option value="office">Bureau</option>
              <option value="warehouse">Entrepôt</option>
              <option value="retail">Commerce de Détail</option>
              <option value="residential">Résidentiel</option>
              <option value="event">Événement</option>
              <option value="other">Autre</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les Statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="setup">Configuration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Site Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSites.map((site) => (
          <div key={site.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{site.name}</h3>
                  <p className="text-sm text-gray-600">{getClientName(site.clientId)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(site.status)}`}>
                  {getStatusText(site.status)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(site.siteDetails.type)}`}>
                  {getTypeText(site.siteDetails.type)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span className="truncate">
                  {site.location.address}, {site.location.city}, {site.location.state}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Gardes Requis</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {site.securityRequirements.guardsRequired}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Gardes Assignés</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {site.assignedGuards.length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>Routes de Patrouille</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {site.siteDetails.patrolRoutes.length}
                </span>
              </div>
            </div>

            {site.siteDetails.specialInstructions && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">Instructions Spéciales</p>
                <p className="text-sm text-blue-600 truncate">
                  {site.siteDetails.specialInstructions}
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => onViewSite(site)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
              >
                <Eye className="h-4 w-4" />
                <span>Voir</span>
              </button>
              <button
                onClick={() => onEditSite(site)}
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun site trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Essayez d\'ajuster vos critères de recherche ou de filtre.'
              : 'Commencez par ajouter votre premier site de sécurité.'}
          </p>
          {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={onAddSite}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter le Premier Site
            </button>
          )}
        </div>
      )}
    </div>
  );
}