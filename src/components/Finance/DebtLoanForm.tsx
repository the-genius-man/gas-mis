import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, Calendar, User, Building2, CreditCard } from 'lucide-react';

interface DebtLoan {
  id?: string;
  type: 'DETTE' | 'PRET';
  reference_number: string;
  creditor_debtor_name: string;
  creditor_debtor_type: 'PERSONNE' | 'ENTREPRISE' | 'BANQUE' | 'EMPLOYE';
  contact_info?: string;
  principal_amount: number;
  current_balance: number;
  interest_rate?: number;
  interest_type?: 'SIMPLE' | 'COMPOSE' | 'FIXE';
  start_date: string;
  due_date?: string;
  status: 'ACTIF' | 'REMBOURSE' | 'EN_RETARD' | 'ANNULE';
  payment_frequency?: 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL' | 'UNIQUE';
  description: string;
  currency: string;
  guarantees?: string;
}

interface DebtLoanFormProps {
  debtLoan?: DebtLoan | null;
  onSave: (debtLoan: DebtLoan) => void;
  onCancel: () => void;
}

export default function DebtLoanForm({ debtLoan, onSave, onCancel }: DebtLoanFormProps) {
  const [formData, setFormData] = useState<DebtLoan>({
    type: 'DETTE',
    reference_number: '',
    creditor_debtor_name: '',
    creditor_debtor_type: 'PERSONNE',
    contact_info: '',
    principal_amount: 0,
    current_balance: 0,
    interest_rate: 0,
    interest_type: 'SIMPLE',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'ACTIF',
    payment_frequency: 'MENSUEL',
    description: '',
    currency: 'USD',
    guarantees: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (debtLoan) {
      setFormData(debtLoan);
    } else {
      // Generate reference number for new debt/loan
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      
      setFormData(prev => ({
        ...prev,
        reference_number: `${prev.type}-${year}${month}${day}-${time}`,
        current_balance: prev.principal_amount
      }));
    }
  }, [debtLoan]);

  useEffect(() => {
    // Update reference number when type changes
    if (!debtLoan) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      
      setFormData(prev => ({
        ...prev,
        reference_number: `${formData.type}-${year}${month}${day}-${time}`
      }));
    }
  }, [formData.type, debtLoan]);

  useEffect(() => {
    // Update current balance when principal amount changes (for new items)
    if (!debtLoan) {
      setFormData(prev => ({
        ...prev,
        current_balance: prev.principal_amount
      }));
    }
  }, [formData.principal_amount, debtLoan]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.creditor_debtor_name.trim()) {
      newErrors.creditor_debtor_name = formData.type === 'DETTE' ? 'Le nom du créancier est requis' : 'Le nom du débiteur est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (formData.principal_amount <= 0) {
      newErrors.principal_amount = 'Le montant principal doit être supérieur à 0';
    }

    if (formData.current_balance < 0) {
      newErrors.current_balance = 'Le solde restant ne peut pas être négatif';
    }

    if (formData.current_balance > formData.principal_amount) {
      newErrors.current_balance = 'Le solde restant ne peut pas être supérieur au montant principal';
    }

    if (formData.interest_rate && (formData.interest_rate < 0 || formData.interest_rate > 100)) {
      newErrors.interest_rate = 'Le taux d\'intérêt doit être entre 0 et 100%';
    }

    if (formData.due_date && formData.due_date <= formData.start_date) {
      newErrors.due_date = 'La date d\'échéance doit être postérieure à la date de début';
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

  const handleChange = (field: keyof DebtLoan, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateMonthlyPayment = () => {
    if (formData.principal_amount > 0 && formData.interest_rate && formData.due_date) {
      const principal = formData.principal_amount;
      const rate = formData.interest_rate / 100 / 12; // Monthly rate
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.due_date);
      const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      if (months > 0) {
        let monthlyPayment;
        if (rate > 0) {
          monthlyPayment = principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
        } else {
          monthlyPayment = principal / months;
        }
        return monthlyPayment.toFixed(2);
      }
    }
    return '0.00';
  };

  const getCreditorDebtorLabel = () => {
    return formData.type === 'DETTE' ? 'Créancier' : 'Débiteur';
  };

  const getCreditorDebtorIcon = () => {
    switch (formData.creditor_debtor_type) {
      case 'PERSONNE': return <User className="w-4 h-4" />;
      case 'ENTREPRISE': return <Building2 className="w-4 h-4" />;
      case 'BANQUE': return <CreditCard className="w-4 h-4" />;
      case 'EMPLOYE': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {debtLoan ? 'Modifier' : 'Nouvelle'} {formData.type === 'DETTE' ? 'Dette' : 'Prêt'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="DETTE"
                    checked={formData.type === 'DETTE'}
                    onChange={(e) => handleChange('type', e.target.value as 'DETTE' | 'PRET')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Dette (nous devons)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="PRET"
                    checked={formData.type === 'PRET'}
                    onChange={(e) => handleChange('type', e.target.value as 'DETTE' | 'PRET')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Prêt (on nous doit)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Référence automatique"
              />
            </div>
          </div>

          {/* Creditor/Debtor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getCreditorDebtorLabel()}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {getCreditorDebtorIcon()}
                </div>
                <input
                  type="text"
                  value={formData.creditor_debtor_name}
                  onChange={(e) => handleChange('creditor_debtor_name', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.creditor_debtor_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={`Nom du ${formData.type === 'DETTE' ? 'créancier' : 'débiteur'}`}
                />
              </div>
              {errors.creditor_debtor_name && (
                <p className="mt-1 text-sm text-red-600">{errors.creditor_debtor_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.creditor_debtor_type}
                onChange={(e) => handleChange('creditor_debtor_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="PERSONNE">Personne physique</option>
                <option value="ENTREPRISE">Entreprise</option>
                <option value="BANQUE">Institution bancaire</option>
                <option value="EMPLOYE">Employé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
            <input
              type="text"
              value={formData.contact_info || ''}
              onChange={(e) => handleChange('contact_info', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Téléphone, email, adresse..."
            />
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant Principal</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.principal_amount}
                  onChange={(e) => handleChange('principal_amount', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.principal_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.principal_amount && (
                <p className="mt-1 text-sm text-red-600">{errors.principal_amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Solde Restant</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_balance}
                onChange={(e) => handleChange('current_balance', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.current_balance ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.current_balance && (
                <p className="mt-1 text-sm text-red-600">{errors.current_balance}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Interest Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Taux d'Intérêt (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.interest_rate || ''}
                onChange={(e) => handleChange('interest_rate', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.interest_rate ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.interest_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.interest_rate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d'Intérêt</label>
              <select
                value={formData.interest_type || 'SIMPLE'}
                onChange={(e) => handleChange('interest_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="SIMPLE">Simple</option>
                <option value="COMPOSE">Composé</option>
                <option value="FIXE">Fixe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence de Paiement</label>
              <select
                value={formData.payment_frequency || 'MENSUEL'}
                onChange={(e) => handleChange('payment_frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="MENSUEL">Mensuel</option>
                <option value="TRIMESTRIEL">Trimestriel</option>
                <option value="SEMESTRIEL">Semestriel</option>
                <option value="ANNUEL">Annuel</option>
                <option value="UNIQUE">Paiement unique</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de Début</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date d'Échéance</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.due_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
              )}
            </div>
          </div>

          {/* Payment Calculator */}
          {formData.principal_amount > 0 && formData.due_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Calcul Estimatif</h4>
              </div>
              <p className="text-sm text-blue-800">
                Paiement mensuel estimé: <span className="font-bold">{calculateMonthlyPayment()} {formData.currency}</span>
              </p>
            </div>
          )}

          {/* Description and Guarantees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Description détaillée de la dette/prêt..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Garanties</label>
            <textarea
              value={formData.guarantees || ''}
              onChange={(e) => handleChange('guarantees', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Garanties, collatéraux, conditions particulières..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIF">Actif</option>
              <option value="REMBOURSE">Remboursé</option>
              <option value="EN_RETARD">En retard</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {debtLoan ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}