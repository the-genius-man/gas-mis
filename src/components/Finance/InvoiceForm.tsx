import { useState, useEffect, useMemo } from 'react';
import { X, Save, FileText, Building2, Calendar, Trash2 } from 'lucide-react';
import { FactureGAS, FactureDetailGAS, ClientGAS, SiteGAS } from '../../types';

interface InvoiceFormProps {
  facture: FactureGAS | null;
  clients: ClientGAS[];
  sites: SiteGAS[];
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

const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `FAC-${year}${month}-${random}`;
};

const initialFormData: Omit<FactureGAS, 'id' | 'cree_le'> = {
  client_id: '',
  numero_facture: generateInvoiceNumber(),
  date_emission: new Date().toISOString().split('T')[0],
  date_echeance: '',
  periode_mois: new Date().getMonth() + 1,
  periode_annee: new Date().getFullYear(),
  total_gardiens_factures: 0,
  montant_ht_prestation: 0,
  montant_frais_supp: 0,
  motif_frais_supp: '',
  creances_anterieures: 0,
  montant_total_ttc: 0,
  montant_total_du_client: 0,
  devise: 'USD',
  statut_paiement: 'BROUILLON',
  notes_facture: '',
  details: []
};

export default function InvoiceForm({ facture, clients, sites, onClose, onSuccess }: InvoiceFormProps) {
  const electronMode = useMemo(() => isElectron(), []);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [details, setDetails] = useState<Partial<FactureDetailGAS>[]>([]);

  useEffect(() => {
    if (facture) {
      setFormData({
        client_id: facture.client_id,
        numero_facture: facture.numero_facture,
        date_emission: facture.date_emission,
        date_echeance: facture.date_echeance || '',
        periode_mois: facture.periode_mois || new Date().getMonth() + 1,
        periode_annee: facture.periode_annee || new Date().getFullYear(),
        total_gardiens_factures: facture.total_gardiens_factures,
        montant_ht_prestation: facture.montant_ht_prestation,
        montant_frais_supp: facture.montant_frais_supp,
        motif_frais_supp: facture.motif_frais_supp || '',
        creances_anterieures: facture.creances_anterieures,
        montant_total_ttc: facture.montant_total_ttc,
        montant_total_du_client: facture.montant_total_du_client,
        devise: facture.devise,
        statut_paiement: facture.statut_paiement,
        notes_facture: facture.notes_facture || '',
      });
      setDetails(facture.details || []);
    }
  }, [facture]);

  // Get client's sites
  const clientSites = sites.filter(s => s.client_id === formData.client_id && s.est_actif);

  // Calculate totals when details change
  useEffect(() => {
    const totalGardiens = details.reduce((sum, d) => sum + (d.nombre_gardiens_site || 0), 0);
    const montantHT = details.reduce((sum, d) => sum + (d.montant_forfaitaire_site || 0), 0);
    const montantTTC = montantHT + formData.montant_frais_supp;
    const montantDu = montantTTC + formData.creances_anterieures;

    setFormData(prev => ({
      ...prev,
      total_gardiens_factures: totalGardiens,
      montant_ht_prestation: montantHT,
      montant_total_ttc: montantTTC,
      montant_total_du_client: montantDu
    }));
  }, [details, formData.montant_frais_supp, formData.creances_anterieures]);

  // Update echeance when client changes
  useEffect(() => {
    if (formData.client_id && formData.date_emission) {
      const client = clients.find(c => c.id === formData.client_id);
      if (client) {
        const emissionDate = new Date(formData.date_emission);
        emissionDate.setDate(emissionDate.getDate() + client.delai_paiement_jours);
        setFormData(prev => ({
          ...prev,
          devise: client.devise_preferee,
          date_echeance: emissionDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.client_id, formData.date_emission, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electronMode || !formData.client_id) return;
    
    setLoading(true);

    try {
      const factureData: FactureGAS = {
        ...formData,
        id: facture?.id || crypto.randomUUID(),
        details: details.map(d => ({
          ...d,
          id: d.id || crypto.randomUUID(),
          facture_id: facture?.id || ''
        })) as FactureDetailGAS[]
      };

      if (window.electronAPI) {
        if (facture) {
          await window.electronAPI.updateFactureGAS(factureData);
        } else {
          await window.electronAPI.addFactureGAS(factureData);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const addSiteDetail = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    // Check if site already added
    if (details.some(d => d.site_id === siteId)) {
      alert('Ce site est déjà ajouté à la facture');
      return;
    }

    const totalEffectif = site.effectif_jour_requis + site.effectif_nuit_requis;
    
    setDetails(prev => [...prev, {
      id: crypto.randomUUID(),
      site_id: siteId,
      nombre_gardiens_site: totalEffectif,
      montant_forfaitaire_site: site.tarif_mensuel_client,
      description_ligne: `Gardiennage ${site.nom_site} - ${formData.periode_mois}/${formData.periode_annee}`,
      site: site
    }]);
  };

  const removeDetail = (index: number) => {
    setDetails(prev => prev.filter((_, i) => i !== index));
  };

  const updateDetail = (index: number, field: string, value: number | string) => {
    setDetails(prev => prev.map((d, i) => 
      i === index ? { ...d, [field]: value } : d
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {facture ? 'Modifier la Facture' : 'Nouvelle Facture'}
              </h2>
              <p className="text-blue-100 text-sm">{formData.numero_facture}</p>
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
          {/* Client & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Client <span className="text-red-500">*</span>
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Sélectionner un client --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom_entreprise}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de Facture <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="numero_facture"
                value={formData.numero_facture}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Dates & Period */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Émission
              </label>
              <input
                type="date"
                name="date_emission"
                value={formData.date_emission}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Échéance
              </label>
              <input
                type="date"
                name="date_echeance"
                value={formData.date_echeance}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
              <select
                name="periode_mois"
                value={formData.periode_mois}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
              <input
                type="number"
                name="periode_annee"
                value={formData.periode_annee}
                onChange={handleChange}
                min="2020"
                max="2030"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sites Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Détails par Site</h4>
              {formData.client_id && clientSites.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addSiteDetail(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">+ Ajouter un site</option>
                  {clientSites.filter(s => !details.some(d => d.site_id === s.id)).map(site => (
                    <option key={site.id} value={site.id}>{site.nom_site}</option>
                  ))}
                </select>
              )}
            </div>

            {details.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  {formData.client_id 
                    ? 'Ajoutez des sites pour cette facture'
                    : 'Sélectionnez d\'abord un client'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {details.map((detail, index) => {
                  const site = sites.find(s => s.id === detail.site_id);
                  return (
                    <div key={detail.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{site?.nom_site || 'Site'}</h5>
                          <p className="text-xs text-gray-500">{site?.adresse_physique}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDetail(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Gardiens</label>
                          <input
                            type="number"
                            value={detail.nombre_gardiens_site || 0}
                            onChange={(e) => updateDetail(index, 'nombre_gardiens_site', parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Montant ({formData.devise})</label>
                          <input
                            type="number"
                            value={detail.montant_forfaitaire_site || 0}
                            onChange={(e) => updateDetail(index, 'montant_forfaitaire_site', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={detail.description_ligne || ''}
                            onChange={(e) => updateDetail(index, 'description_ligne', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional Charges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frais Supplémentaires ({formData.devise})
              </label>
              <input
                type="number"
                name="montant_frais_supp"
                value={formData.montant_frais_supp}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif des Frais
              </label>
              <input
                type="text"
                name="motif_frais_supp"
                value={formData.motif_frais_supp}
                onChange={handleChange}
                placeholder="Ex: Heures supplémentaires"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Créances Antérieures ({formData.devise})
              </label>
              <input
                type="number"
                name="creances_anterieures"
                value={formData.creances_anterieures}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                name="statut_paiement"
                value={formData.statut_paiement}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYE">Envoyé</option>
                <option value="PAYE_PARTIEL">Payé Partiel</option>
                <option value="PAYE_TOTAL">Payé Total</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">Récapitulatif</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Gardiens</p>
                <p className="text-lg font-bold text-blue-900">{formData.total_gardiens_factures}</p>
              </div>
              <div>
                <p className="text-blue-700">Montant HT</p>
                <p className="text-lg font-bold text-blue-900">{formData.devise} {formData.montant_ht_prestation.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-700">Total TTC</p>
                <p className="text-lg font-bold text-blue-900">{formData.devise} {formData.montant_total_ttc.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-700">Total Dû</p>
                <p className="text-xl font-bold text-green-700">{formData.devise} {formData.montant_total_du_client.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes_facture"
              value={formData.notes_facture}
              onChange={handleChange}
              rows={3}
              placeholder="Notes ou commentaires sur cette facture..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              disabled={loading || !formData.client_id}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
