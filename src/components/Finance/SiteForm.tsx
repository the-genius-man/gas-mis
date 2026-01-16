import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, MapPin, Building2, Users, DollarSign, FileText } from 'lucide-react';
import { SiteGAS, ClientGAS } from '../../types';

interface SiteFormProps {
  site: SiteGAS | null;
  clients: ClientGAS[];
  onClose: () => void;
  onSuccess: () => void;
}

// Check if running in Electron
const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

const initialFormData: Omit<SiteGAS, 'id'> = {
  client_id: '',
  nom_site: '',
  adresse_physique: '',
  latitude: undefined,
  longitude: undefined,
  effectif_jour_requis: 1,
  effectif_nuit_requis: 1,
  cout_unitaire_garde: 0,
  tarif_mensuel_client: 0,
  consignes_specifiques: '',
  est_actif: true,
};

export default function SiteForm({ site, clients, onClose, onSuccess }: SiteFormProps) {
  const electronMode = useMemo(() => isElectron(), []);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  // Get selected client for currency display
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === formData.client_id);
  }, [clients, formData.client_id]);

  useEffect(() => {
    if (site) {
      setFormData({
        client_id: site.client_id,
        nom_site: site.nom_site,
        adresse_physique: site.adresse_physique || '',
        latitude: site.latitude,
        longitude: site.longitude,
        effectif_jour_requis: site.effectif_jour_requis,
        effectif_nuit_requis: site.effectif_nuit_requis,
        cout_unitaire_garde: site.cout_unitaire_garde || 0,
        tarif_mensuel_client: site.tarif_mensuel_client,
        consignes_specifiques: site.consignes_specifiques || '',
        est_actif: site.est_actif,
      });
    }
  }, [site]);

  // Auto-calculate tarif_mensuel_client whenever effectif or cout_unitaire changes
  const calculatedTarif = useMemo(() => {
    const totalGuards = formData.effectif_jour_requis + formData.effectif_nuit_requis;
    return Math.round(totalGuards * formData.cout_unitaire_garde * 100) / 100;
  }, [formData.effectif_jour_requis, formData.effectif_nuit_requis, formData.cout_unitaire_garde]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electronMode || !formData.client_id) return;
    
    setLoading(true);

    try {
      const siteData: SiteGAS = {
        ...formData,
        id: site?.id || crypto.randomUUID(),
        tarif_mensuel_client: calculatedTarif,
      };

      if (window.electronAPI) {
        if (site) {
          await window.electronAPI.updateSiteGAS(siteData);
        } else {
          await window.electronAPI.addSiteGAS(siteData);
        }
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
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const totalGuards = formData.effectif_jour_requis + formData.effectif_nuit_requis;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {site ? 'Modifier le Site' : 'Nouveau Site'}
              </h2>
              <p className="text-green-100 text-sm">
                {site ? 'Mise à jour des informations' : 'Enregistrement d\'un nouveau site de gardiennage'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Client Associé <span className="text-red-500">*</span>
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom_entreprise} ({client.type_client})
                </option>
              ))}
            </select>
          </div>

          {/* Site Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du Site <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nom_site"
                value={formData.nom_site}
                onChange={handleChange}
                required
                placeholder="Ex: Entrepôt Kyeshero"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse Physique
              </label>
              <textarea
                name="adresse_physique"
                value={formData.adresse_physique}
                onChange={handleChange}
                rows={2}
                placeholder="Ex: Avenue du Lac, Quartier Himbi, Goma"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude (GPS)
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude || ''}
                onChange={handleChange}
                step="0.000001"
                placeholder="Ex: -1.678432"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude (GPS)
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude || ''}
                onChange={handleChange}
                step="0.000001"
                placeholder="Ex: 29.234567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Effectifs */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Effectifs Requis
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-yellow-800 mb-2">
                  Effectif Jour <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="effectif_jour_requis"
                  value={formData.effectif_jour_requis}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white text-center text-lg font-bold"
                />
                <p className="text-xs text-yellow-700 mt-1 text-center">gardes</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-indigo-800 mb-2">
                  Effectif Nuit <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="effectif_nuit_requis"
                  value={formData.effectif_nuit_requis}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-center text-lg font-bold"
                />
                <p className="text-xs text-indigo-700 mt-1 text-center">gardes</p>
              </div>
            </div>
          </div>

          {/* Tarification */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Tarification ({selectedClient?.devise_preferee || 'USD'})
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coût Unitaire par Garde <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="cout_unitaire_garde"
                    value={formData.cout_unitaire_garde}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Ex: 150"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tarif mensuel par garde pour ce site</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarif Mensuel Total (Auto)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={calculatedTarif}
                    readOnly
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-semibold"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">= {totalGuards} gardes × ${formData.cout_unitaire_garde.toLocaleString()}</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h5 className="text-sm font-medium text-green-800 mb-2">Récapitulatif Mensuel</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-green-600">Total Gardes</p>
                  <p className="font-semibold text-green-900">{totalGuards}</p>
                </div>
                <div>
                  <p className="text-green-600">Coût Unitaire</p>
                  <p className="font-semibold text-green-900">${formData.cout_unitaire_garde.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-green-600">Montant Facturé</p>
                  <p className="font-bold text-green-900 text-lg">${calculatedTarif.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Consignes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Consignes Spécifiques
            </label>
            <textarea
              name="consignes_specifiques"
              value={formData.consignes_specifiques}
              onChange={handleChange}
              rows={3}
              placeholder="Protocoles de sécurité propres au site..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              name="est_actif"
              id="est_actif"
              checked={formData.est_actif}
              onChange={handleChange}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="est_actif" className="text-sm font-medium text-gray-700">
              Site Actif
              <span className="block text-xs text-gray-500 font-normal">
                Les sites inactifs ne seront pas inclus dans la facturation
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            <span className="text-red-500">*</span> Champs obligatoires
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.client_id || !formData.nom_site}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
