import React, { useState } from 'react';
import { X, Save, DollarSign, Calculator, AlertCircle } from 'lucide-react';

interface OhadaDebtLoanPaymentFormProps {
  debtLoan: any;
  onSave: (payment: any) => void;
  onCancel: () => void;
}

export default function OhadaDebtLoanPaymentForm({ debtLoan, onSave, onCancel }: OhadaDebtLoanPaymentFormProps) {
  const [formData, setFormData] = useState({
    dette_pret_id: debtLoan.id,
    date_paiement: new Date().toISOString().split('T')[0],
    montant_paye: 0,
    montant_principal: 0,
    montant_interet: 0,
    mode_paiement: 'VIREMENT' as 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY' | 'COMPENSATION',
    reference_paiement: '',
    numero_piece: '',
    compte_tresorerie_id: '',
    penalites: 0,
    frais_bancaires: 0,
    notes: '',
    devise: debtLoan.devise || 'USD',
    cree_par: 'current_user' // This should come from auth context
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate interest if applicable
  const calculateInterest = (principal: number) => {
    if (!debtLoan.taux_interet || debtLoan.taux_interet <= 0) return 0;
    
    const startDate = new Date(debtLoan.date_debut);
    const paymentDate = new Date(formData.date_paiement);
    const daysDiff = Math.max(0, Math.floor((paymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Simple interest calculation: Principal * Rate * Time / 365
    const annualRate = debtLoan.taux_interet / 100;
    return (principal * annualRate * daysDiff) / 365;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.montant_paye <= 0) {
      newErrors.montant_paye = 'Le montant payé doit être positif';
    }

    if (formData.montant_paye > debtLoan.solde_actuel) {
      newErrors.montant_paye = 'Le montant ne peut pas dépasser le solde restant';
    }

    if (!formData.reference_paiement.trim()) {
      newErrors.reference_paiement = 'La référence de paiement est requise';
    }

    if (formData.montant_principal + formData.montant_interet !== formData.montant_paye) {
      newErrors.montant_principal = 'La somme principal + intérêts doit égaler le montant payé';
    }

    if (formData.date_paiement < debtLoan.date_debut) {
      newErrors.date_paiement = 'La date de paiement ne peut pas être antérieure à la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-calculate principal and interest when total amount changes
    if (field === 'montant_paye') {
      const totalAmount = parseFloat(value) || 0;
      const suggestedInterest = calculateInterest(totalAmount);
      const suggestedPrincipal = Math.max(0, totalAmount - suggestedInterest);
      
      setFormData(prev => ({
        ...prev,
        montant_paye: totalAmount,
        montant_principal: suggestedPrincipal,
        montant_interet: suggestedInterest
      }));
    }

    // Auto-generate reference if not provided
    if (field === 'mode_paiement' && !formData.reference_paiement) {
      const prefix = value === 'VIREMENT' ? 'VIR' : 
                   value === 'CHEQUE' ? 'CHQ' : 
                   value === 'MOBILE_MONEY' ? 'MOB' : 'PAY';
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({
        ...prev,
        reference_paiement: `${prefix}-${timestamp}`
      }));
    }
  };

  const suggestedInterest = calculateInterest(formData.montant_principal);
  const remainingBalance = debtLoan.solde_actuel - formData.montant_paye;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Enregistrer un Paiement
              </h2>
              <p className="text-sm text-gray-500">
                {debtLoan.type === 'DETTE' ? 'Paiement de dette' : 'Remboursement de prêt'} - {debtLoan.tiers_nom}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Debt/Loan Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Résumé de l'opération</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Référence:</span>
                <span className="ml-2 font-medium">{debtLoan.reference_number}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">
                  {debtLoan.type === 'DETTE' ? 'Dette (Passif)' : 'Prêt (Actif)'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Montant initial:</span>
                <span className="ml-2 font-medium">
                  {debtLoan.montant_principal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debtLoan.devise}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Solde actuel:</span>
                <span className="ml-2 font-medium text-red-600">
                  {debtLoan.solde_actuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debtLoan.devise}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Compte OHADA:</span>
                <span className="ml-2 font-medium">{debtLoan.compte_comptable_principal}</span>
              </div>
              <div>
                <span className="text-gray-500">Taux d'intérêt:</span>
                <span className="ml-2 font-medium">
                  {debtLoan.taux_interet ? `${debtLoan.taux_interet}%` : 'Aucun'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations de Paiement</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de paiement *
                </label>
                <input
                  type="date"
                  value={formData.date_paiement}
                  onChange={(e) => handleInputChange('date_paiement', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.date_paiement ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.date_paiement && (
                  <p className="text-sm text-red-600 mt-1">{errors.date_paiement}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement *
                </label>
                <select
                  value={formData.mode_paiement}
                  onChange={(e) => handleInputChange('mode_paiement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="VIREMENT">Virement bancaire</option>
                  <option value="ESPECES">Espèces</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="COMPENSATION">Compensation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence de paiement *
                </label>
                <input
                  type="text"
                  value={formData.reference_paiement}
                  onChange={(e) => handleInputChange('reference_paiement', e.target.value)}
                  placeholder="Numéro de transaction, chèque, etc."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.reference_paiement ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.reference_paiement && (
                  <p className="text-sm text-red-600 mt-1">{errors.reference_paiement}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de pièce
                </label>
                <input
                  type="text"
                  value={formData.numero_piece}
                  onChange={(e) => handleInputChange('numero_piece', e.target.value)}
                  placeholder="Numéro de pièce comptable"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Répartition du Montant
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant total payé *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={debtLoan.solde_actuel}
                  value={formData.montant_paye}
                  onChange={(e) => handleInputChange('montant_paye', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.montant_paye ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.montant_paye && (
                  <p className="text-sm text-red-600 mt-1">{errors.montant_paye}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant principal
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.montant_principal}
                  onChange={(e) => handleInputChange('montant_principal', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.montant_principal ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.montant_principal && (
                  <p className="text-sm text-red-600 mt-1">{errors.montant_principal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant intérêts
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.montant_interet}
                  onChange={(e) => handleInputChange('montant_interet', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {debtLoan.taux_interet > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Intérêt suggéré: {suggestedInterest.toFixed(2)} {debtLoan.devise}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Impact */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Impact du paiement</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Solde avant paiement:</span>
                  <span className="ml-2 font-medium">
                    {debtLoan.solde_actuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debtLoan.devise}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Solde après paiement:</span>
                  <span className="ml-2 font-medium">
                    {remainingBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debtLoan.devise}
                  </span>
                </div>
              </div>
              {remainingBalance <= 0 && (
                <div className="mt-2 flex items-center gap-2 text-green-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Ce paiement soldera complètement la {debtLoan.type === 'DETTE' ? 'dette' : 'créance'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Charges */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Frais Additionnels</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pénalités de retard
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.penalites}
                  onChange={(e) => handleInputChange('penalites', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais bancaires
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.frais_bancaires}
                  onChange={(e) => handleInputChange('frais_bancaires', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Commentaires sur ce paiement..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* OHADA Accounting Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <Calculator className="w-5 h-5" />
              <span className="font-medium">Écriture Comptable Automatique</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Une écriture comptable en partie double sera automatiquement générée selon les normes OHADA.
              {debtLoan.type === 'DETTE' ? 
                ` Débit: ${debtLoan.compte_comptable_principal} | Crédit: 512 (Banque)` :
                ` Débit: 512 (Banque) | Crédit: ${debtLoan.compte_comptable_principal}`
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer le Paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}