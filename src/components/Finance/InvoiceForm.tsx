import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Facture, Client, Site, DeviseClient } from '../../types';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface InvoiceFormProps {
  facture: Facture | null;
  onClose: () => void;
}

interface InvoiceLineItem {
  site_id: string;
  nombre_gardiens_site: number;
  montant_forfaitaire_site: number;
  description_ligne: string;
}

export default function InvoiceForm({ facture, onClose }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [clientSites, setClientSites] = useState<Site[]>([]);

  const [clientId, setClientId] = useState(facture?.client_id || '');
  const [numeroFacture, setNumeroFacture] = useState(facture?.numero_facture || '');
  const [dateEmission, setDateEmission] = useState(
    facture?.date_emission || new Date().toISOString().split('T')[0]
  );
  const [dateEcheance, setDateEcheance] = useState(facture?.date_echeance || '');
  const [periodeMois, setPeriodeMois] = useState(facture?.periode_mois || new Date().getMonth() + 1);
  const [periodeAnnee, setPeriodeAnnee] = useState(facture?.periode_annee || new Date().getFullYear());
  const [montantFraisSupp, setMontantFraisSupp] = useState(facture?.montant_frais_supp || 0);
  const [motifFraisSupp, setMotifFraisSupp] = useState(facture?.motif_frais_supp || '');
  const [creancesAnterieures, setCreancesAnterieures] = useState(facture?.creances_anterieures || 0);
  const [devise, setDevise] = useState<DeviseClient>(facture?.devise || 'USD');
  const [notesFacture, setNotesFacture] = useState(facture?.notes_facture || '');

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  useEffect(() => {
    loadClients();
    loadSites();

    if (!facture) {
      generateInvoiceNumber();
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
        setDevise(selectedClient.devise_facturation);
        calculateDueDate(dateEmission, selectedClient.delai_paiement_jours);
      }
      setClientSites(sites.filter(s => s.client_id === clientId && s.statut === 'ACTIF'));
    } else {
      setClientSites([]);
    }
  }, [clientId, clients, sites]);

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('raison_sociale');
    if (data) setClients(data);
  };

  const loadSites = async () => {
    const { data } = await supabase
      .from('sites')
      .select('*')
      .eq('statut', 'ACTIF');
    if (data) setSites(data);
  };

  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const { count } = await supabase
      .from('factures_clients')
      .select('*', { count: 'exact', head: true })
      .gte('date_emission', `${year}-01-01`);

    const nextNumber = (count || 0) + 1;
    setNumeroFacture(`GAS-${year}${month}-${String(nextNumber).padStart(4, '0')}`);
  };

  const calculateDueDate = (emissionDate: string, delaiJours: number) => {
    const date = new Date(emissionDate);
    date.setDate(date.getDate() + delaiJours);
    setDateEcheance(date.toISOString().split('T')[0]);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        site_id: '',
        nombre_gardiens_site: 0,
        montant_forfaitaire_site: 0,
        description_ligne: '',
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'site_id' && value) {
      const site = clientSites.find(s => s.id === value);
      if (site) {
        updated[index].montant_forfaitaire_site = site.tarif_mensuel_client;
        updated[index].description_ligne = `Prestation de sécurité - ${site.nom}`;
      }
    }

    setLineItems(updated);
  };

  const calculateTotals = () => {
    const montantHT = lineItems.reduce((sum, item) => sum + item.montant_forfaitaire_site, 0);
    const totalGardiens = lineItems.reduce((sum, item) => sum + item.nombre_gardiens_site, 0);
    const montantTTC = montantHT + montantFraisSupp;
    const montantTotal = montantTTC + creancesAnterieures;

    return {
      montantHT,
      totalGardiens,
      montantTTC,
      montantTotal,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lineItems.length === 0) {
      alert('Veuillez ajouter au moins une ligne de facturation');
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotals();

      const factureData = {
        client_id: clientId,
        numero_facture: numeroFacture,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        periode_mois: periodeMois,
        periode_annee: periodeAnnee,
        total_gardiens_factures: totals.totalGardiens,
        montant_ht_prestation: totals.montantHT,
        montant_frais_supp: montantFraisSupp,
        motif_frais_supp: motifFraisSupp || null,
        creances_anterieures: creancesAnterieures,
        montant_total_ttc: totals.montantTTC,
        montant_total_du_client: totals.montantTotal,
        devise: devise,
        statut_paiement: 'BROUILLON',
        notes_facture: notesFacture || null,
      };

      let factureId: string;

      if (facture) {
        const { error } = await supabase
          .from('factures_clients')
          .update(factureData)
          .eq('id', facture.id);

        if (error) throw error;

        await supabase
          .from('factures_details')
          .delete()
          .eq('facture_id', facture.id);

        factureId = facture.id;
      } else {
        const { data, error } = await supabase
          .from('factures_clients')
          .insert(factureData)
          .select()
          .single();

        if (error) throw error;
        factureId = data.id;
      }

      const detailsData = lineItems.map(item => ({
        facture_id: factureId,
        site_id: item.site_id,
        nombre_gardiens_site: item.nombre_gardiens_site,
        montant_forfaitaire_site: item.montant_forfaitaire_site,
        description_ligne: item.description_ligne || null,
      }));

      const { error: detailsError } = await supabase
        .from('factures_details')
        .insert(detailsData);

      if (detailsError) throw detailsError;

      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Erreur lors de l\'enregistrement de la facture');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {facture ? 'Modifier la Facture' : 'Nouvelle Facture'}
          </h2>
          <p className="text-gray-600 mt-1">
            {facture ? `Modification de ${facture.numero_facture}` : 'Créer une nouvelle facture client'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Informations Générales</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.raison_sociale}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de Facture *
              </label>
              <input
                type="text"
                value={numeroFacture}
                onChange={(e) => setNumeroFacture(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'Émission *
              </label>
              <input
                type="date"
                value={dateEmission}
                onChange={(e) => {
                  setDateEmission(e.target.value);
                  const client = clients.find(c => c.id === clientId);
                  if (client) {
                    calculateDueDate(e.target.value, client.delai_paiement_jours);
                  }
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'Échéance *
              </label>
              <input
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois de Période *
              </label>
              <select
                value={periodeMois}
                onChange={(e) => setPeriodeMois(Number(e.target.value))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année de Période *
              </label>
              <input
                type="number"
                value={periodeAnnee}
                onChange={(e) => setPeriodeAnnee(Number(e.target.value))}
                required
                min="2020"
                max="2100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise *
              </label>
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value as DeviseClient)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD - Dollar Américain</option>
                <option value="CDF">CDF - Franc Congolais</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lignes de Facturation</h3>
            <button
              type="button"
              onClick={addLineItem}
              disabled={!clientId}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un site</span>
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune ligne de facturation. Veuillez ajouter des sites à facturer.
            </div>
          ) : (
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Ligne {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site *
                      </label>
                      <select
                        value={item.site_id}
                        onChange={(e) => updateLineItem(index, 'site_id', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un site</option>
                        {clientSites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de Gardiens *
                      </label>
                      <input
                        type="number"
                        value={item.nombre_gardiens_site}
                        onChange={(e) => updateLineItem(index, 'nombre_gardiens_site', Number(e.target.value))}
                        required
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Montant Forfaitaire *
                      </label>
                      <input
                        type="number"
                        value={item.montant_forfaitaire_site}
                        onChange={(e) => updateLineItem(index, 'montant_forfaitaire_site', Number(e.target.value))}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description_ligne}
                        onChange={(e) => updateLineItem(index, 'description_ligne', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Montants Additionnels</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frais Supplémentaires
              </label>
              <input
                type="number"
                value={montantFraisSupp}
                onChange={(e) => setMontantFraisSupp(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif Frais Supplémentaires
              </label>
              <input
                type="text"
                value={motifFraisSupp}
                onChange={(e) => setMotifFraisSupp(e.target.value)}
                placeholder="Ex: Frais de déplacement"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Créances Antérieures
              </label>
              <input
                type="number"
                value={creancesAnterieures}
                onChange={(e) => setCreancesAnterieures(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes de Facture
            </label>
            <textarea
              value={notesFacture}
              onChange={(e) => setNotesFacture(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Montant HT Prestations:</span>
              <span className="font-medium">{totals.montantHT.toLocaleString('fr-FR')} {devise}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Frais Supplémentaires:</span>
              <span className="font-medium">{montantFraisSupp.toLocaleString('fr-FR')} {devise}</span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2">
              <span className="text-gray-700">Sous-total TTC:</span>
              <span className="font-medium">{totals.montantTTC.toLocaleString('fr-FR')} {devise}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Créances Antérieures:</span>
              <span className="font-medium">{creancesAnterieures.toLocaleString('fr-FR')} {devise}</span>
            </div>
            <div className="flex justify-between border-t-2 border-blue-300 pt-2 text-lg">
              <span className="font-semibold text-gray-900">Total Dû:</span>
              <span className="font-bold text-blue-600">{totals.montantTotal.toLocaleString('fr-FR')} {devise}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Total Gardiens Facturés:</span>
              <span className="font-medium">{totals.totalGardiens}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
