import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, MapPin, Edit, Trash2, Building2, DollarSign, Users } from 'lucide-react';
import SiteForm from './SiteForm';

interface Site {
  id: string;
  client_id: string;
  nom_site: string;
  adresse_physique: string | null;
  latitude: number | null;
  longitude: number | null;
  effectif_jour_requis: number;
  effectif_nuit_requis: number;
  tarif_mensuel_client: number;
  taux_journalier_garde: number;
  consignes_specifiques: string | null;
  est_actif: boolean;
}

interface SiteWithClient extends Site {
  client_nom: string;
}

export default function SitesManagement() {
  const [sites, setSites] = useState<SiteWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'inactif'>('all');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sites')
        .select(`
          *,
          clients!inner(nom_entreprise)
        `)
        .order('nom_site');

      if (error) throw error;

      const sitesWithClient = (data || []).map((site: any) => ({
        ...site,
        client_nom: site.clients.nom_entreprise,
      }));

      setSites(sitesWithClient);
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce site ?')) return;

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSites();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du site');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSite(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadSites();
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch =
      site.nom_site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.adresse_physique?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'actif' && site.est_actif) ||
      (statusFilter === 'inactif' && !site.est_actif);

    return matchesSearch && matchesStatus;
  });

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Sites</h2>
          <p className="text-gray-600 mt-1">
            {sites.length} site{sites.length !== 1 ? 's' : ''} enregistré{sites.length !== 1 ? 's' : ''}
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
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSites.map((site) => (
          <div key={site.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  site.est_actif ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <MapPin className={`h-6 w-6 ${site.est_actif ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{site.nom_site}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {site.client_nom}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                site.est_actif
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {site.est_actif ? 'Actif' : 'Inactif'}
              </span>
            </div>

            {site.adresse_physique && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{site.adresse_physique}</span>
                </p>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Effectif Jour</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {site.effectif_jour_requis} garde{site.effectif_jour_requis !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Effectif Nuit</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {site.effectif_nuit_requis} garde{site.effectif_nuit_requis !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Tarif Mensuel</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${site.tarif_mensuel_client.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Taux Journalier</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${site.taux_journalier_garde.toLocaleString()}
                </span>
              </div>
            </div>

            {site.consignes_specifiques && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 line-clamp-3">
                  {site.consignes_specifiques}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingSite(site);
                  setShowForm(true);
                }}
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => handleDelete(site.id)}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer</span>
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
            {searchTerm || statusFilter !== 'all'
              ? 'Essayez d\'ajuster vos critères de recherche.'
              : 'Commencez par ajouter votre premier site.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter le Premier Site
            </button>
          )}
        </div>
      )}

      {showForm && (
        <SiteForm
          site={editingSite}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
