import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';

interface DebtLoan {
  id: string;
  type: 'DETTE' | 'PRET';
  reference_number: string;
  creditor_debtor_name: string;
  current_balance: number;
  currency: string;
  description: string;
}

interface DebtLoanPayment {
  id?: string;
  debt_loan_id: string;
  payment_date: string;
  amount: number;
  payment_type: 'CAPITAL' | 'INTERET' | 'MIXTE';
  payment_method: 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY';
  reference: string;
  notes?: string;
}

interface DebtLoanPaymentFormProps {
  debtLoan: DebtLoan;
  payment?: DebtLoanPayment | null;
  onSave: (payment: DebtLoanPayment) => void;
  onCancel: () => void;
}

export default function DebtLoanPaymentForm({ debtLoan, payment, onSave, onCancel }: DebtLoanPaymentFormProps) {
  const [formData, setFormData] = useState<DebtLoanPayment>({
    debt_loan_id: debtLoan.id,
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_type: 'MIXTE',
    payment_method: 'ESPECES',
    reference: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (payment) {
      setFormData(payment);
    } else {
      // Generate reference number for new payment
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      
      setFormData(prev => ({
        ...prev,
        reference: `PAY-${year}${month}${day}-${time}`
      }));
    }
  }, [payment]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
    }

    if (formData.amount > debtLoan.current_balance) {
      newErrors.amount = `Le montant ne peut pas dépasser le solde restant (${debtLoan.current_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${debtLoan.currency})`;
    }

    if (!formData.reference.trim()) {
      newErrors.reference = 'La référence est requise';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'La date de paiement est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: keyof DebtLoanPayment, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPaymentMethodIcon = () => {
    switch (formData.payment_method) {
      case 'ESPECES': return <DollarSign className="w-4 h-4" />;
      case 'VIREMENT': return <CreditCard className="w-4 h-4" />;
      case 'CHEQUE': return <FileText className="w-4 h-4" />;
      case 'MOBILE_MONEY': return <DollarSign className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const calculateNewBalance = () => {
    return Math.max(0, debtLoan.current_balance - formData.amount);
  };

  const getPaymentTypeLabel = () => {
    switch (formData.payment_type) {
      case 'CAPITAL': return 'Capital uniquement';
      case 'INTERET': return 'Intérêts uniquement';
      case 'MIXTE': return 'Capital + Intérêts';
      default: return formData.payment_type;
    }
  };

  const getPaymentMethodLabel = () => {
    switch (formData.payment_method) {
      case 'ESPECES': return 'Espèces';
      case 'VIREMENT': return 'Virement bancaire';
      case 'CHEQUE': return 'Chèque';
      case 'MOBILE_MONEY': return 'Mobile Money';
      default: return formData.payment_method;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {payment ? 'Modifier le Paiement' : 'Enregistrer un Paiement'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Debt/Loan Information */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">
                {debtLoan.type === 'DETTE' ? 'Dette' : 'Prêt'}: <span className="font-medium text-gray-900">{debtLoan.reference_number}</span>
              </p>
              <p className="text-sm text-gray-600">
                {debtLoan.type === 'DETTE' ? 'Créancier' : 'Débiteur'}: <span className="font-medium text-gray-900">{debtLoan.creditor_debtor_name}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Solde actuel: <span className="font-bold text-red-600">
                  {debtLoan.current_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debtLoan.currency}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Description: <span className="text-gray-900">{debtLoan.description}</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Amount and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant du Paiement ({debtLoan.currency})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={debtLoan.current_balance}
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Maximum: {debtLoan.current_balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debtLoan.currency}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de Paiement</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => handleChange('payment_date', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.payment_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.payment_date && (
                <p className="mt-1 text-sm text-red-600">{errors.payment_date}</p>
              )}
            </div>
          </div>

          {/* Payment Type and Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de Paiement</label>
              <select
                value={formData.payment_type}
                onChange={(e) => handleChange('payment_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="MIXTE">Capital + Intérêts</option>
                <option value="CAPITAL">Capital uniquement</option>
                <option value="INTERET">Intérêts uniquement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de Paiement</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {getPaymentMethodIcon()}
                </div>
                <select
                  value={formData.payment_method}
                  onChange={(e) => handleChange('payment_method', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ESPECES">Espèces</option>
                  <option value="VIREMENT">Virement bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Référence du Paiement</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.reference ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Numéro de transaction, référence bancaire..."
            />
            {errors.reference && (
              <p className="mt-1 text-sm text-red-600">{errors.reference}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Notes additionnelles sur le paiement..."
            />
          </div>

          {/* Payment Summary */}
          {formData.amount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Résumé du Paiement</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-800">
                    <span className="font-medium">Montant:</span> {formData.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debtLoan.currency}
                  </p>
                  <p className="text-green-800">
                    <span className="font-medium">Type:</span> {getPaymentTypeLabel()}
                  </p>
                </div>
                <div>
                  <p className="text-green-800">
                    <span className="font-medium">Méthode:</span> {getPaymentMethodLabel()}
                  </p>
                  <p className="text-green-800">
                    <span className="font-medium">Nouveau solde:</span> {calculateNewBalance().toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {debtLoan.currency}
                  </p>
                </div>
              </div>
              {calculateNewBalance() === 0 && (
                <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                  <p className="text-sm font-medium text-green-800">
                    ✅ Ce paiement soldera complètement la {debtLoan.type === 'DETTE' ? 'dette' : 'créance'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
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
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {payment ? 'Modifier' : 'Enregistrer'} le Paiement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}