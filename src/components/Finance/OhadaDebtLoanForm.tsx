import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, BookOpen, AlertCircle } from 'lucide-react';

interface PlanComptable {
  code_compte: string;
  libelle: string;
  type_compte: string;
  est_actif: number;
}

interface OhadaDebtLoanFormProps {
  debtLoan?: any;
  onSave: (debtLoan: any) => void;
  onCancel: () => void;
}

export default function OhadaDebtLoanForm({ debtLoan, onSave, onCancel }: OhadaDebtLoanFormProps) {
  const [formData, setFormData] = useState({
    type: 'DETTE' as 'DETTE' | 'PRET',
    reference_number: '',
    compte_comptable_principal: '',
    compte_comptable_interet: '',
    sous_compte: '',
    tiers_nom: '',
    tiers_type: 'ENTREPRISE' as 'PERSONNE' | 'ENTREPRISE' | 'BANQUE' | 'EMPLOYE' | 'ETAT' | 'COLLECTIVITE',
    tiers_numero_compte: '',
    contact_info: '',
    montant_principal: 0,
    taux_interet: 0,
    type_interet: 'SIMPLE' as 'SIMPLE' | 'COMPOSE' | 'FIXE',
    date_debut: new Date().toISOString().split('T')[0],
    date_echeance: '',
    frequence_paiement: 'MENSUEL' as 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL' | 'UNIQUE',
    nature_garantie: '',
    valeur_garantie: 0,
    objet: '',
    conditions_particulieres: '',
    pieces_justificatives: '',
    devise: 'USD' as 'USD' | 'CDF',
    cree_par: 'current_user' // This should come from auth context
  });

  const [planComptable, setPlanComptable] = useState<PlanComptable[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPlanComptable();
    if (debtLoan) {
      setFormData({
        ...debtLoan,
        date_debut: debtLoan.date_debut?.split('T')[0] || '',
        date_echeance: debtLoan.date_echeance?.split('T')[0] || '',
      });
    }
  }, [debtLoan]);

  const loadPlanComptable = async () => {
    try {
      if (window.electronAPI) {
        const accounts = await window.electronAPI.getPlanComptable();
        setPlanComptable(accounts || []);
      }
    } catch (error) {
      console.error('Error loading plan comptable:', error);
    }
  };

  // OHADA account suggestions based on type and tiers type
  const getAccountSuggestions = (type: string, tiersType: string) => {
    const suggestions: Record<string, Record<string, string[]>> = {
      'DETTE': {
        'BANQUE': ['161'], // Emprunts bancaires
        'ENTREPRISE': ['162', '401'], // Emprunts financiers, Fournisseurs
        'EMPLOYE': ['164'], // Avances reçues du personnel
        'ETAT': ['163'], // Avances reçues de l'État
        'PERSONNE': ['162'], // Emprunts financiers divers
        'COLLECTIVITE': ['162']
      },
      'PRET': {
        'EMPLOYE': ['261'], // Prêts au personnel
        'ENTREPRISE': ['268'], // Autres prêts et créances financières
        'ETAT': ['264'], // Prêts et créances sur l'État
        'PERSONNE': ['268'], // Autres prêts
        'COLLECTIVITE': ['265'] // Prêts aux collectivités publiques
      }
    };

    return suggestions[type]?.[tiersType] || [];
  };

  const getInterestAccountSuggestions = (type: string) => {
    return type === 'DETTE' ? ['661'] : ['771']; // Charges d'intérêts vs Produits d'intérêts
  };

  const getFilteredAccounts = (accountCodes: string[]) => {
    return planComptable.filter(account => 
      accountCodes.some(code => account.code_compte.startsWith(code))
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tiers_nom.trim()) {
      newErrors.tiers_nom = 'Le nom du tiers est requis';
    }

    if (!formData.objet.trim()) {
      newErrors.objet = 'L\'objet est requis';
    }

    if (formData.montant_principal <= 0) {
      newErrors.montant_principal = 'Le montant principal doit être positif';
    }

    if (!formData.compte_comptable_principal) {
      newErrors.compte_comptable_principal = 'Le compte comptable principal est requis';
    }

    if (formData.taux_interet > 0 && !formData.compte_comptable_interet) {
      newErrors.compte_comptable_interet = 'Le compte d\'intérêts est requis si un taux est défini';
    }

    if (formData.date_echeance && formData.date_echeance <= formData.date_debut) {
      newErrors.date_echeance = 'La date d\'échéance doit être postérieure à la date de début';
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
      console.error('Error saving debt/loan:', error);
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

    // Auto-suggest accounts when type or tiers type changes
    if (field === 'type' || field === 'tiers_type') {
      const newType = field === 'type' ? value : formData.type;
      const newTiersType = field === 'tiers_type' ? value : formData.tiers_type;
      
      const suggestions = getAccountSuggestions(newType, newTiersType);
      if (suggestions.length > 0) {
        const suggestedAccount = planComptable.find(account => 
          account.code_compte.startsWith(suggestions[0])
        );
        if (suggestedAccount) {
          setFormData(prev => ({ 
            ...prev, 
            [field]: value,
            compte_comptable_principal: suggestedAccount.code_compte 
          }));
        }
      }

      // Auto-suggest interest account
      if (formData.taux_interet > 0) {
        const interestSuggestions = getInterestAccountSuggestions(newType);
        const suggestedInterestAccount = planComptable.find(account => 
          account.code_compte.startsWith(interestSuggestions[0])
        );
        if (suggestedInterestAccount) {
          setFormData(prev => ({ 
            ...prev, 
            compte_comptable_interet: suggestedInterestAccount.code_compte 
          }));
        }
      }
    }
  };

  const accountSuggestions = getAccountSuggestions(formData.type, formData.tiers_type);
  const interestAccountSuggestions = getInterestAccountSuggestions(formData.type);
  const suggestedAccounts = getFilteredAccounts(accountSuggestions);
  const suggestedInterestAccounts = getFilteredAccounts(interestAccountSuggestions);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {debtLoan ? 'Modifier' : 'Nouvelle'} Dette/Prêt OHADA
              </h2>
              <p className="text-sm text-gray-500">
                Conforme aux normes OHADA avec comptabilité automatique
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
          {/* OHADA Compliance Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Intégration OHADA</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Les comptes comptables sont automatiquement suggérés selon les normes OHADA. 
              Une écriture comptable en partie double sera générée automatiquement.
            </p>
          </div>

          {/* Type and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'opération *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="DETTE">Dette (Passif) - Argent que nous devons</option>
                <option value="PRET">Prêt (Actif) - Argent qui nous est dû</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => handleInputChange('reference_number', e.target.value)}
                placeholder="Auto-générée si vide"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tiers Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations du Tiers</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du tiers *
                </label>
                <input
                  type="text"
                  value={formData.tiers_nom}
                  onChange={(e) => handleInputChange('tiers_nom', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.tiers_nom ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.tiers_nom && (
                  <p className="text-sm text-red-600 mt-1">{errors.tiers_nom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de tiers *
                </label>
                <select
                  value={formData.tiers_type}
                  onChange={(e) => handleInputChange('tiers_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="ENTREPRISE">Entreprise</option>
                  <option value="BANQUE">Banque</option>
                  <option value="EMPLOYE">Employé</option>
                  <option value="ETAT">État</option>
                  <option value="PERSONNE">Personne physique</option>
                  <option value="COLLECTIVITE">Collectivité publique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact
                </label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange('contact_info', e.target.value)}
                  placeholder="Téléphone, email, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de compte tiers
                </label>
                <input
                  type="text"
                  value={formData.tiers_numero_compte}
                  onChange={(e) => handleInputChange('tiers_numero_compte', e.target.value)}
                  placeholder="Numéro de compte du tiers"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* OHADA Accounting */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Comptes OHADA
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compte comptable principal *
                </label>
                <select
                  value={formData.compte_comptable_principal}
                  onChange={(e) => handleInputChange('compte_comptable_principal', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.compte_comptable_principal ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Sélectionner un compte</option>
                  {suggestedAccounts.map((account) => (
                    <option key={account.code_compte} value={account.code_compte}>
                      {account.code_compte} - {account.libelle}
                    </option>
                  ))}
                </select>
                {errors.compte_comptable_principal && (
                  <p className="text-sm text-red-600 mt-1">{errors.compte_comptable_principal}</p>
                )}
                {accountSuggestions.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Comptes suggérés OHADA: {accountSuggestions.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compte d'intérêts
                </label>
                <select
                  value={formData.compte_comptable_interet}
                  onChange={(e) => handleInputChange('compte_comptable_interet', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.compte_comptable_interet ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Aucun (si pas d'intérêts)</option>
                  {suggestedInterestAccounts.map((account) => (
                    <option key={account.code_compte} value={account.code_compte}>
                      {account.code_compte} - {account.libelle}
                    </option>
                  ))}
                </select>
                {errors.compte_comptable_interet && (
                  <p className="text-sm text-red-600 mt-1">{errors.compte_comptable_interet}</p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  Compte suggéré: {interestAccountSuggestions[0]} ({formData.type === 'DETTE' ? 'Charges' : 'Produits'} d'intérêts)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-compte (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.sous_compte}
                  onChange={(e) => handleInputChange('sous_compte', e.target.value)}
                  placeholder="Pour un suivi détaillé"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations Financières</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant principal *
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
                  required
                />
                {errors.montant_principal && (
                  <p className="text-sm text-red-600 mt-1">{errors.montant_principal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux d'intérêt (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taux_interet}
                  onChange={(e) => handleInputChange('taux_interet', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'intérêt
                </label>
                <select
                  value={formData.type_interet}
                  onChange={(e) => handleInputChange('type_interet', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SIMPLE">Simple</option>
                  <option value="COMPOSE">Composé</option>
                  <option value="FIXE">Fixe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => handleInputChange('date_debut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={formData.date_echeance}
                  onChange={(e) => handleInputChange('date_echeance', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.date_echeance ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date_echeance && (
                  <p className="text-sm text-red-600 mt-1">{errors.date_echeance}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence de paiement
                </label>
                <select
                  value={formData.frequence_paiement}
                  onChange={(e) => handleInputChange('frequence_paiement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MENSUEL">Mensuel</option>
                  <option value="TRIMESTRIEL">Trimestriel</option>
                  <option value="SEMESTRIEL">Semestriel</option>
                  <option value="ANNUEL">Annuel</option>
                  <option value="UNIQUE">Paiement unique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select
                  value={formData.devise}
                  onChange={(e) => handleInputChange('devise', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guarantees */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Garanties (optionnel)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nature de la garantie
                </label>
                <input
                  type="text"
                  value={formData.nature_garantie}
                  onChange={(e) => handleInputChange('nature_garantie', e.target.value)}
                  placeholder="Ex: Hypothèque, Nantissement, Caution..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valeur de la garantie
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valeur_garantie}
                  onChange={(e) => handleInputChange('valeur_garantie', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Description</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objet *
              </label>
              <input
                type="text"
                value={formData.objet}
                onChange={(e) => handleInputChange('objet', e.target.value)}
                placeholder="Ex: Achat d'équipement, Avance sur salaire..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.objet ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.objet && (
                <p className="text-sm text-red-600 mt-1">{errors.objet}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conditions particulières
              </label>
              <textarea
                value={formData.conditions_particulieres}
                onChange={(e) => handleInputChange('conditions_particulieres', e.target.value)}
                rows={3}
                placeholder="Conditions spéciales, clauses particulières..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pièces justificatives
              </label>
              <input
                type="text"
                value={formData.pieces_justificatives}
                onChange={(e) => handleInputChange('pieces_justificatives', e.target.value)}
                placeholder="Liste des documents joints"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}