import { useState, useEffect, useMemo } from 'react';
import { X, Save, CreditCard, Calendar, DollarSign, Building2, FileText } from 'lucide-react';
import { PaiementGAS, FactureGAS, ModePaiement, DeviseClient } from '../../types';

interface PaymentFormProps {
  paiement: PaiementGAS | null;
  facture: FactureGAS;
  soldeRestant: number;
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

const modesPaiement: { value: ModePaiement; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'VIREMENT', label: 'Virement Bancaire' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

export default function PaymentForm({ paiement, facture, soldeRestant, onClose, onSuccess }: PaymentFormProps) {
  const electronMode = useMemo(() => isElectron(), []);
  const [loading, setLoading] = useState(false);
  const [montantInput, setMontantInput] = useState(soldeRestant.toString());
  const [formData, setFormData] = useState({
    date_paiement: new Date().toISOString().split('T')[0],
    devise: facture.devise as DeviseClient,
    mode_paiement: 'ESPECES' as ModePaiement,
    reference_paiement: '',
    banque_origine: '',
    notes: ''
  });

  // Parse montant from input string
  const montantPaye = parseFloat(montantInput) || 0;

  useEffect(() => {
    if (paiement) {
      setMontantInput(paiement.montant_paye.toString());
      setFormData({
        date_paiement: paiement.date_paiement,
        devise: paiement.devise,
        mode_paiement: paiement.mode_paiement,
        reference_paiement: paiement.reference_paiement || '',
        banque_origine: paiement.banque_origine || '',
        notes: paiement.notes || ''
      });
    }
  }, [paiement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electronMode) return;
    
    // Frontend validation - prevent exceeding remaining balance
    if (montantPaye <= 0) {
      alert('Le montant du paiement doit être supérieur à 0');
      return;
    }
    
    if (!paiement && montantPaye > soldeRestant) {
      alert(`Le montant du paiement (${montantPaye.toLocaleString()} ${formData.devise}) dépasse le solde restant (${soldeRestant.toLocaleString()} ${formData.devise})`);
      return;
    }
    
    setLoading(true);

    try {
      const paiementData: PaiementGAS = {
        ...formData,
        montant_paye: montantPaye,
        id: paiement?.id || crypto.randomUUID(),
        facture_id: facture.id,
      };

      console.log('Submitting payment:', paiementData);

      if (window.electronAPI) {
        if (paiement) {
          const result = await window.electronAPI.updatePaiementGAS(paiementData);
          console.log('Update result:', result);
        } else {
          const result = await window.electronAPI.addPaiementGAS(paiementData);
          console.log('Add result:', result);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur lors de l'enregistrement du paiement: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const showBankField = formData.mode_paiement === 'VIREMENT' || formData.mode_paiement === 'CHEQUE';
  const showReferenceField = formData.mode_paiement !== 'ESPECES';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {paiement ? 'Modifier le Paiement' : 'Enregistrer un Paiement'}
              </h2>
              <p className="text-green-100 text-sm">{facture.numero_facture}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <FileText className="h-4 w-4" />
            <span>Facture: {facture.numero_facture}</span>
            {facture.client && (
              <>
                <span>•</span>
                <Building2 className="h-4 w-4" />
                <span>{facture.client.nom_entreprise}</span>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Montant Total</p>
              <p className="text-lg font-bold text-gray-900">
                {facture.montant_total_du_client.toLocaleString()} {facture.devise}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Déjà Payé</p>
              <p className="text-lg font-bold text-green-600">
                {(facture.montant_total_du_client - soldeRestant).toLocaleString()} {facture.devise}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-orange-200 bg-orange-50">
              <p className="text-xs text-orange-600">Solde Restant</p>
              <p className="text-lg font-bold text-orange-700">
                {soldeRestant.toLocaleString()} {facture.devise}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date du Paiement <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_paiement"
                value={formData.date_paiement}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Montant Payé <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="montant_paye"
                  value={montantInput}
                  onChange={(e) => setMontantInput(e.target.value)}
                  required
                  min="0.01"
                  max={paiement ? undefined : soldeRestant}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-16"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {formData.devise}
                </span>
              </div>
              {!paiement && montantPaye > soldeRestant && (
                <p className="text-xs text-red-500 mt-1">Le montant dépasse le solde restant</p>
              )}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de Paiement <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {modesPaiement.map(mode => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mode_paiement: mode.value }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.mode_paiement === mode.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference (for non-cash payments) */}
          {showReferenceField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence du Paiement
              </label>
              <input
                type="text"
                name="reference_paiement"
                value={formData.reference_paiement}
                onChange={handleChange}
                placeholder={
                  formData.mode_paiement === 'VIREMENT' ? 'N° de virement' :
                  formData.mode_paiement === 'CHEQUE' ? 'N° de chèque' :
                  formData.mode_paiement === 'MOBILE_MONEY' ? 'N° de transaction' : ''
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Bank (for bank transfers and checks) */}
          {showBankField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banque d'Origine
              </label>
              <input
                type="text"
                name="banque_origine"
                value={formData.banque_origine}
                onChange={handleChange}
                placeholder="Ex: BCDC, Rawbank, Equity..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Observations ou commentaires..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Payment Preview */}
          {!paiement && montantPaye > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Après ce paiement</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Nouveau solde</p>
                  <p className="text-lg font-bold text-green-800">
                    {Math.max(0, soldeRestant - montantPaye).toLocaleString()} {formData.devise}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Statut</p>
                  <p className="text-lg font-bold text-green-800">
                    {montantPaye >= soldeRestant ? 'Payé Total' : 'Payé Partiel'}
                  </p>
                </div>
              </div>
            </div>
          )}
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
              disabled={loading || montantPaye <= 0 || (!paiement && montantPaye > soldeRestant)}
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
