import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save } from 'lucide-react';

interface Site {
  id?: string;
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

interface Client {
  id: string;
  nom_entreprise: string;
}

interface SiteFormProps {
  site: Site | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SiteForm({ site, onClose, onSuccess }: SiteFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<Omit<Site, 'id'>>({
    client_id: '',
    nom_site: '',
    adresse_physique: null,
    latitude: null,
    longitude: null,
    effectif_jour_requis: 1,
    effectif_nuit_requis: 1,
    tarif_mensuel_client: 0,
    taux_journalier_garde: 0,
    consignes_specifiques: null,
    est_actif: true,
  });

  useEffect(() => {
    loadClients();
    if (site) {
      setFormData({
        client_id: site.client_id,
        nom_site: site.nom_site,
        adresse_physique: site.adresse_physique,
        latitude: site.latitude,
        longitude: site.longitude,
        effectif_jour_requis: site.effectif_jour_requis,
        effectif_nuit_requis: site.effectif_nuit_requis,
        tarif_mensuel_client: site.tarif_mensuel_client,
        taux_journalier_garde: site.taux_journalier_garde,
        consignes_specifiques: site.consignes_specifiques,
        est_actif: site.est_actif,
      });
    }
  }, [site]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom_entreprise')
        .order('nom_entreprise');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (site) {
        const { error } = await supabase
          .from('sites')
          .update(formData)
          .eq('id', site.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sites')
          .insert([formData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du site');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : value,
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {site ? 'Modifier le Site' : 'Nouveau Site'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nom_entreprise}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Site *
                </label>
                <input
                  type="text"
                  name="nom_site"
                  value={formData.nom_site}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Entrepôt Kyeshero"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Localisation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse Physique
                </label>
                <textarea
                  name="adresse_physique"
                  value={formData.adresse_physique || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Adresse complète du site"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    step="0.000001"
                    placeholder="-1.234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    step="0.000001"
                    placeholder="29.234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Effectifs Requis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effectif de Jour *
                </label>
                <input
                  type="number"
                  name="effectif_jour_requis"
                  value={formData.effectif_jour_requis}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effectif de Nuit *
                </label>
                <input
                  type="number"
                  name="effectif_nuit_requis"
                  value={formData.effectif_nuit_requis}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tarification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarif Mensuel Client (USD) *
                </label>
                <input
                  type="number"
                  name="tarif_mensuel_client"
                  value={formData.tarif_mensuel_client}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux Journalier Garde (USD) *
                </label>
                <input
                  type="number"
                  name="taux_journalier_garde"
                  value={formData.taux_journalier_garde}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Consignes de Sécurité</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consignes Spécifiques
                </label>
                <textarea
                  name="consignes_specifiques"
                  value={formData.consignes_specifiques || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Protocoles de sécurité spécifiques à ce site..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="est_actif"
                  checked={formData.est_actif}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Site actif
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
