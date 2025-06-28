import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Search, Plus, Filter, Eye, Edit, Building2, DollarSign, Calendar, MapPin } from 'lucide-react';
import { Client } from '../../types';

interface ClientListProps {
  onAddClient: () => void;
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
}

export default function ClientList({ onAddClient, onViewClient, onEditClient }: ClientListProps) {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'corporate' | 'residential' | 'event' | 'government'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  const filteredClients = state.clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactInfo.primaryContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
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
      case 'pending':
        return 'en attente';
      default:
        return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'corporate':
        return 'bg-blue-100 text-blue-800';
      case 'residential':
        return 'bg-green-100 text-green-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      case 'government':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'corporate':
        return 'entreprise';
      case 'residential':
        return 'résidentiel';
      case 'event':
        return 'événement';
      case 'government':
        return 'gouvernement';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
          <p className="text-gray-600 mt-1">Gérez vos clients de services de sécurité et leurs contrats</p>
        </div>
        <button
          onClick={onAddClient}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un Client</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher des clients..."
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
              <option value="corporate">Entreprise</option>
              <option value="residential">Résidentiel</option>
              <option value="event">Événement</option>
              <option value="government">Gouvernement</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les Statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="pending">En Attente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const daysUntilExpiry = getDaysUntilExpiry(client.contract.endDate);
          const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          const isExpired = daysUntilExpiry <= 0;
          
          return (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-600">{client.contactInfo.primaryContact}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                    {getStatusText(client.status)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(client.type)}`}>
                    {getTypeText(client.type)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>Valeur du Contrat</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(client.totalValue)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Contrat Expire le</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'
                  }`}>
                    {new Date(client.contract.endDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Sites</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {client.sites.length} site{client.sites.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {(isExpiringSoon || isExpired) && (
                <div className={`mb-4 p-2 rounded-lg text-sm ${
                  isExpired 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  {isExpired 
                    ? 'Le contrat a expiré !' 
                    : `Le contrat expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => onViewClient(client)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>Voir</span>
                </button>
                <button
                  onClick={() => onEditClient(client)}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Essayez d\'ajuster vos critères de recherche ou de filtre.'
              : 'Commencez par ajouter votre premier client.'}
          </p>
          {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={onAddClient}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter le Premier Client
            </button>
          )}
        </div>
      )}
    </div>
  );
}