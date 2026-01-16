import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Depense, CategorieDepense, CompteTresorerie, ModePaiement, StatutDepense } from '../../types';

interface DepenseFormProps {
  depense?: Depense | null;
  categories: CategorieDepense[];
  comptes: CompteTresorerie[];
  onSave: (depense: Depense) => void;
  onCancel: () => void;
}

const modesPaiement: { value: ModePaiement; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

const statuts: { value: StatutDepense; label: string }[] = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'VALIDEE', label: 'Validée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

export default function DepenseForm({ depense, categories, comptes, onSave, onCancel }: DepenseFormProps) {
  const [formData, setFormData] = useState<Partial<Depense>>({
    categorie_id: '',
    compte_tresorerie_id: 'caisse-usd',
    date_depense: new Date().toISOString().split('T')[0],
    quantite: 1,
    prix_unitaire: 0,
    montant: 0,
    devise: 'USD',
    beneficiaire: '',
    description: '',
    reference_piece: '',
    mode_paiement: 'ESPECES',
    statut: 'VALIDEE',
  });

  useEffect(() => {
    if (depense) {
      setFormData({
        ...depense,
        date_depense: depense.date_depense?.split('T')[0] || new Date().toISOString().split('T')[0],
        quantite: depense.quantite || 1,
        prix_unitaire: depense.prix_unitaire || depense.montant || 0,
      });
    }
  }, [depense]);

  // Auto-calculate montant when quantite or prix_unitaire changes
  useEffect(() => {
    const total = (formData.quantite || 1) * (formData.prix_unitaire || 0);
    setFormData(prev => ({ ...prev, montant: total }));
  }, [formData.quantite, formData.prix_unitaire]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categorie_id || !formData.compte_tresorerie_id || !formData.description || !formData.prix_unitaire) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const depenseData: Depense = {
      id: depense?.id || crypto.randomUUID(),
      categorie_id: formData.categorie_id!,
      compte_tresorerie_id: formData.compte_tresorerie_id!,
      date_depense: formData.date_depense!,
      quantite: Number(formData.quantite) || 1,
      prix_unitaire: Number(formData.prix_unitaire),
      montant: Number(formData.montant),
      devise: formData.devise as 'USD' | 'CDF' | 'EUR',
      beneficiaire: formData.beneficiaire || undefined,
      description: formData.description!,
      reference_piece: formData.reference_piece || undefined,
      mode_paiement: formData.mode_paiement as ModePaiement,
      statut: formData.statut as StatutDepense,
    };

    onSave(depenseData);
  };

  const selectedCompte = comptes.find(c => c.id === formData.compte_tresorerie_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {depense ? 'Modifier la dépense' : 'Nouvelle dépense'}
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
              value={formData.date_depense}
              onChange={(e) => setFormData({ ...formData, date_depense: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.categorie_id}
              onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom_categorie}
                </option>
              ))}
            </select>
          </div>

          {/* Compte de Trésorerie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte de sortie <span className="text-red-500">*</span>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix unitaire <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.prix_unitaire}
                onChange={(e) => setFormData({ ...formData, prix_unitaire: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Montant Total (calculé) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant Total
            </label>
            <input
              type="text"
              value={`${(formData.montant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${selectedCompte?.devise || formData.devise}`}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-blue-50 text-blue-700 font-semibold"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description de la dépense..."
              required
            />
          </div>

          {/* Bénéficiaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire</label>
            <input
              type="text"
              value={formData.beneficiaire}
              onChange={(e) => setFormData({ ...formData, beneficiaire: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nom du bénéficiaire"
            />
          </div>

          {/* Mode de paiement et Référence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
              <select
                value={formData.mode_paiement}
                onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value as ModePaiement })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {modesPaiement.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence pièce</label>
              <input
                type="text"
                value={formData.reference_piece}
                onChange={(e) => setFormData({ ...formData, reference_piece: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="N° facture, reçu..."
              />
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value as StatutDepense })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statuts.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {depense ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
