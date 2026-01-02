import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Building2, Edit, Trash2, Phone, Mail, MapPin, FileText } from 'lucide-react';
import ClientForm from './ClientForm';

interface Client {
  id: string;
  type_client: 'MORALE' | 'PHYSIQUE';
  nom_entreprise: string;
  nif: string | null;
  rccm: string | null;
  id_national: string | null;
  numero_contrat: string | null;
  contact_nom: string | null;
  contact_email: string | null;
  telephone: string | null;
  adresse_facturation: string | null;
  devise_preferee: string;
  delai_paiement_jours: number;
}

export default function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'MORALE' | 'PHYSIQUE'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nom_entreprise');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadClients();
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
    loadClients();
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.nom_entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nif?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || client.type_client === typeFilter;

    return matchesSearch && matchesType;
  });

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
          <p className="text-gray-600 mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, contact ou NIF..."
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{client.nom_entreprise}</h3>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                    client.type_client === 'MORALE'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {client.type_client === 'MORALE' ? 'Personne Morale' : 'Personne Physique'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {client.nif && (
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">NIF: {client.nif}</span>
                </div>
              )}
              {client.contact_nom && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{client.contact_nom}</span>
                </div>
              )}
              {client.contact_email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{client.contact_email}</span>
                </div>
              )}
              {client.telephone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{client.telephone}</span>
                </div>
              )}
              {client.adresse_facturation && (
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{client.adresse_facturation}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
              <span className="text-sm text-gray-600">Devise préférée</span>
              <span className="text-sm font-semibold text-gray-900">{client.devise_preferee}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
              <span className="text-sm text-gray-600">Délai de paiement</span>
              <span className="text-sm font-semibold text-gray-900">{client.delai_paiement_jours} jours</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingClient(client);
                  setShowForm(true);
                }}
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => handleDelete(client.id)}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter le Premier Client
            </button>
          )}
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
