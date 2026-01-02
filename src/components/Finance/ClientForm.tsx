import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save } from 'lucide-react';

interface Client {
  id?: string;
  type_client: 'MORALE' | 'PHYSIQUE';
  nom_entreprise: string;
  nif: string | null;
  rccm: string | null;
  id_national: string | null;
  numero_contrat: string | null;
  contact_nom: string | null;
  contact_email: string | null;
  telephone: string | null;
  contact_urgence_nom: string | null;
  contact_urgence_telephone: string | null;
  adresse_facturation: string | null;
  devise_preferee: string;
  delai_paiement_jours: number;
}

interface ClientFormProps {
  client: Client | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientForm({ client, onClose, onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    type_client: 'MORALE',
    nom_entreprise: '',
    nif: null,
    rccm: null,
    id_national: null,
    numero_contrat: null,
    contact_nom: null,
    contact_email: null,
    telephone: null,
    contact_urgence_nom: null,
    contact_urgence_telephone: null,
    adresse_facturation: null,
    devise_preferee: 'USD',
    delai_paiement_jours: 30,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        type_client: client.type_client,
        nom_entreprise: client.nom_entreprise,
        nif: client.nif,
        rccm: client.rccm,
        id_national: client.id_national,
        numero_contrat: client.numero_contrat,
        contact_nom: client.contact_nom,
        contact_email: client.contact_email,
        telephone: client.telephone,
        contact_urgence_nom: client.contact_urgence_nom,
        contact_urgence_telephone: client.contact_urgence_telephone,
        adresse_facturation: client.adresse_facturation,
        devise_preferee: client.devise_preferee,
        delai_paiement_jours: client.delai_paiement_jours,
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (client) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', client.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([formData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du client');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {client ? 'Modifier le Client' : 'Nouveau Client'}
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
                  Type de Client *
                </label>
                <select
                  name="type_client"
                  value={formData.type_client}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MORALE">Personne Morale</option>
                  <option value="PHYSIQUE">Personne Physique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type_client === 'MORALE' ? 'Raison Sociale' : 'Nom Complet'} *
                </label>
                <input
                  type="text"
                  name="nom_entreprise"
                  value={formData.nom_entreprise}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Identifiants Légaux</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIF
                </label>
                <input
                  type="text"
                  name="nif"
                  value={formData.nif || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RCCM
                </label>
                <input
                  type="text"
                  name="rccm"
                  value={formData.rccm || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID National
                </label>
                <input
                  type="text"
                  name="id_national"
                  value={formData.id_national || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Contact
                </label>
                <input
                  type="text"
                  name="contact_nom"
                  value={formData.contact_nom || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact d'Urgence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Contact d'Urgence
                </label>
                <input
                  type="text"
                  name="contact_urgence_nom"
                  value={formData.contact_urgence_nom || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone d'Urgence
                </label>
                <input
                  type="tel"
                  name="contact_urgence_telephone"
                  value={formData.contact_urgence_telephone || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de Facturation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de Contrat
                </label>
                <input
                  type="text"
                  name="numero_contrat"
                  value={formData.numero_contrat || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de Facturation
                </label>
                <textarea
                  name="adresse_facturation"
                  value={formData.adresse_facturation || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise Préférée *
                  </label>
                  <select
                    name="devise_preferee"
                    value={formData.devise_preferee}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Délai de Paiement (jours) *
                  </label>
                  <input
                    type="number"
                    name="delai_paiement_jours"
                    value={formData.delai_paiement_jours}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
