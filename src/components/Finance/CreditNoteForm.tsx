import { useState } from 'react';
import { X, Save, FileX, Calendar, DollarSign, FileText, Building2 } from 'lucide-react';
import { AvoirGAS, FactureWithPayments, ClientGAS, DeviseClient } from '../../types';

interface CreditNoteFormProps {
  facture: FactureWithPayments;
  client?: ClientGAS;
  onClose: () => void;
  onSuccess: () => void;
}

const devises: { value: DeviseClient; label: string }[] = [
  { value: 'USD', label: 'USD — Dollar américain' },
  { value: 'CDF', label: 'CDF — Franc congolais' },
  { value: 'EUR', label: 'EUR — Euro' },
];

export default function CreditNoteForm({ facture, client, onClose, onSuccess }: CreditNoteFormProps) {
  const soldeRestant = facture.soldeRestant;

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [montantInput, setMontantInput] = useState('');
  const [formData, setFormData] = useState({
    date_avoir: new Date().toISOString().split('T')[0],
    motif_avoir: '',
    devise: facture.devise as DeviseClient,
  });

  const montantAvoir = parseFloat(montantInput) || 0;

  // Inline validation errors
  const montantError =
    montantAvoir > soldeRestant
      ? `Le montant dépasse le solde restant de ${soldeRestant.toLocaleString()} ${formData.devise}`
      : montantAvoir <= 0 && montantInput !== ''
      ? 'Le montant doit être supérieur à 0'
      : null;

  const motifError = formData.motif_avoir.trim() === '' ? 'Le motif est obligatoire' : null;

  const isFormValid =
    montantAvoir > 0 &&
    montantAvoir <= soldeRestant &&
    formData.motif_avoir.trim() !== '';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!isFormValid) return;

    setLoading(true);
    try {
      const avoir: Omit<AvoirGAS, 'numero_avoir' | 'cree_le'> = {
        id: crypto.randomUUID(),
        facture_id: facture.id,
        client_id: facture.client_id,
        date_avoir: formData.date_avoir,
        montant_avoir: montantAvoir,
        motif_avoir: formData.motif_avoir.trim(),
        devise: formData.devise,
      };

      const result = await window.electronAPI.createAvoir(avoir);

      if (result && (result as { error?: string }).error) {
        setServerError((result as { error: string }).error);
        return;
      }

      onSuccess();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de l\'avoir'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileX className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Créer un Avoir</h2>
              <p className="text-purple-100 text-sm">{facture.numero_facture}</p>
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
            {(client || facture.client) && (
              <>
                <span>•</span>
                <Building2 className="h-4 w-4" />
                <span>{(client || facture.client)?.nom_entreprise}</span>
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
                {facture.totalPaye.toLocaleString()} {facture.devise}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Server error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date de l'Avoir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_avoir"
                value={formData.date_avoir}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Montant de l'Avoir <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={montantInput}
                  onChange={e => setMontantInput(e.target.value)}
                  required
                  min="0.01"
                  max={soldeRestant}
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-16 ${
                    montantError ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                  {formData.devise}
                </span>
              </div>
              {montantError && (
                <p className="text-xs text-red-500 mt-1">{montantError}</p>
              )}
            </div>
          </div>

          {/* Devise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Devise <span className="text-red-500">*</span>
            </label>
            <select
              name="devise"
              value={formData.devise}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {devises.map(d => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif de l'Avoir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="motif_avoir"
              value={formData.motif_avoir}
              onChange={handleChange}
              required
              placeholder="Ex: Erreur de facturation, remise commerciale..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                motifError && formData.motif_avoir !== '' ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {motifError && formData.motif_avoir === '' && montantInput !== '' && (
              <p className="text-xs text-red-500 mt-1">{motifError}</p>
            )}
          </div>

          {/* Preview */}
          {montantAvoir > 0 && montantAvoir <= soldeRestant && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-800 mb-2">Après cet avoir</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-purple-700">Nouveau solde</p>
                  <p className="text-lg font-bold text-purple-800">
                    {Math.max(0, soldeRestant - montantAvoir).toLocaleString()} {formData.devise}
                  </p>
                </div>
                <div>
                  <p className="text-purple-700">Statut</p>
                  <p className="text-lg font-bold text-purple-800">
                    {montantAvoir >= soldeRestant ? 'Soldé' : 'Partiellement crédité'}
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
              disabled={loading || !isFormValid}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Enregistrement...' : 'Créer l\'Avoir'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
