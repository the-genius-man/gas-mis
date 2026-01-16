import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Entree, CompteTresorerie, ModePaiement, SourceEntree, FactureGAS } from '../../types';

interface EntreeFormProps {
  entree?: Entree | null;
  comptes: CompteTresorerie[];
  unpaidInvoices: FactureGAS[];
  onSave: (entree: Entree) => void;
  onCancel: () => void;
}

const modesPaiement: { value: ModePaiement; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

const sourceTypes: { value: SourceEntree; label: string }[] = [
  { value: 'DEPOT', label: 'Dépôt' },
  { value: 'PAIEMENT_CLIENT', label: 'Paiement Client' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function EntreeForm({ entree, comptes, unpaidInvoices, onSave, onCancel }: EntreeFormProps) {
  const [formData, setFormData] = useState<Partial<Entree>>({
    compte_tresorerie_id: 'caisse-usd',
    date_entree: new Date().toISOString().split('T')[0],
    montant: 0,
    devise: 'USD',
    source_type: 'PAIEMENT_CLIENT',
    facture_id: '',
    description: '',
    reference: '',
    mode_paiement: 'ESPECES',
  });

  useEffect(() => {
    if (entree) {
      setFormData({
        ...entree,
        date_entree: entree.date_entree?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    }
  }, [entree]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.compte_tresorerie_id || !formData.description || !formData.montant) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.source_type === 'PAIEMENT_CLIENT' && !formData.facture_id) {
      alert('Veuillez sélectionner une facture pour un paiement client');
      return;
    }

    const entreeData: Entree = {
      id: entree?.id || crypto.randomUUID(),
      compte_tresorerie_id: formData.compte_tresorerie_id!,
      date_entree: formData.date_entree!,
      montant: Number(formData.montant),
      devise: formData.devise as 'USD' | 'CDF' | 'EUR',
      source_type: formData.source_type as SourceEntree,
      facture_id: formData.source_type === 'PAIEMENT_CLIENT' ? formData.facture_id : undefined,
      description: formData.description!,
      reference: formData.reference || undefined,
      mode_paiement: formData.mode_paiement as ModePaiement,
    };

    onSave(entreeData);
  };

  const selectedCompte = comptes.find(c => c.id === formData.compte_tresorerie_id);
  const selectedInvoice = unpaidInvoices.find(f => f.id === formData.facture_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {entree ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date_entree}
              onChange={(e) => setFormData({ ...formData, date_entree: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          {/* Type de source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'entrée <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.source_type}
              onChange={(e) => setFormData({ ...formData, source_type: e.target.value as SourceEntree, facture_id: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              {sourceTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Facture (si paiement client) */}
          {formData.source_type === 'PAIEMENT_CLIENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facture <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.facture_id}
                onChange={(e) => {
                  const invoice = unpaidInvoices.find(f => f.id === e.target.value);
                  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                  const periodLabel = invoice?.periode_mois && invoice?.periode_annee 
                    ? ` - ${monthNames[invoice.periode_mois - 1]} ${invoice.periode_annee}`
                    : '';
                  setFormData({ 
                    ...formData, 
                    facture_id: e.target.value,
                    description: invoice ? `Paiement ${invoice.client?.nom_entreprise || 'Client'} - Facture ${invoice.numero_facture}${periodLabel}` : formData.description
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Sélectionner une facture</option>
                {unpaidInvoices.map((facture) => {
                  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
                    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                  const periodLabel = facture.periode_mois && facture.periode_annee 
                    ? `${monthNames[facture.periode_mois - 1]} ${facture.periode_annee}`
                    : '';
                  return (
                    <option key={facture.id} value={facture.id}>
                      {facture.numero_facture} - {facture.client?.nom_entreprise || 'Client'} {periodLabel ? `(${periodLabel})` : ''} - Solde: {facture.montant_total_du_client?.toLocaleString()} {facture.devise}
                    </option>
                  );
                })}
              </select>
              {selectedInvoice && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Client:</span> {selectedInvoice.client?.nom_entreprise || 'N/A'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Période:</span> {
                      selectedInvoice.periode_mois && selectedInvoice.periode_annee
                        ? `${['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][selectedInvoice.periode_mois - 1]} ${selectedInvoice.periode_annee}`
                        : 'N/A'
                    }
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Montant dû:</span> {selectedInvoice.montant_total_du_client?.toLocaleString()} {selectedInvoice.devise}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Compte de Trésorerie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte de destination <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.compte_tresorerie_id}
              onChange={(e) => {
                const compte = comptes.find(c => c.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  compte_tresorerie_id: e.target.value,
                  devise: compte?.devise || 'USD'
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Sélectionner un compte</option>
              {comptes.map((compte) => (
                <option key={compte.id} value={compte.id}>
                  {compte.nom_compte} ({compte.devise}) - Solde: {compte.solde_actuel.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Montant et Devise */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
              <input
                type="text"
                value={selectedCompte?.devise || formData.devise}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Description de l'entrée..."
              required
            />
          </div>

          {/* Mode de paiement et Référence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
              <select
                value={formData.mode_paiement}
                onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value as ModePaiement })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {modesPaiement.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="N° reçu, bordereau..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {entree ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
