import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User } from 'lucide-react';

interface DeductionType {
  id: string;
  code: string;
  nom: string;
  description: string;
  calculation_method: string;
  default_schedule_type: string;
  max_percentage_salary: number;
  priority_order: number;
}

interface Employee {
  id: string;
  matricule: string;
  nom_complet: string;
  salaire_base: number;
  categorie: string;
  statut: string;
}

interface DeductionFormProps {
  onClose: () => void;
  onSave: (deduction: any) => Promise<void>;
}

export default function DeductionForm({ onClose, onSave }: DeductionFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    employe_id: '',
    deduction_type_id: '',
    title: '',
    total_amount: '',
    schedule_type: 'ONE_TIME',
    installments: '1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    max_per_period: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmployees();
    loadDeductionTypes();
  }, []);

  const loadEmployees = async () => {
    if (!window.electronAPI?.getEmployeesGAS) return;
    
    try {
      const data = await window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' });
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDeductionTypes = async () => {
    if (!window.electronAPI?.getDeductionTypes) return;
    
    try {
      const data = await window.electronAPI.getDeductionTypes({});
      setDeductionTypes(data);
    } catch (error) {
      console.error('Error loading deduction types:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employe_id) {
      newErrors.employe_id = 'Veuillez sélectionner un employé';
    }

    if (!formData.deduction_type_id) {
      newErrors.deduction_type_id = 'Veuillez sélectionner un type de déduction';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = 'Le montant doit être supérieur à 0';
    }

    if (formData.schedule_type === 'INSTALLMENTS') {
      const installments = parseInt(formData.installments);
      if (!installments || installments < 2) {
        newErrors.installments = 'Le nombre de versements doit être au moins 2';
      }
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La date de début est requise';
    }

    // Validate max deduction percentage if employee is selected
    // Note: Percentage validation disabled - remove this comment to re-enable
    /*
    if (formData.employe_id && formData.total_amount) {
      const employee = employees.find(emp => emp.id === formData.employe_id);
      const selectedType = deductionTypes.find(type => type.id === formData.deduction_type_id);
      
      if (employee && selectedType && selectedType.max_percentage_salary) {
        const maxAmount = employee.salaire_base * selectedType.max_percentage_salary;
        const monthlyAmount = formData.schedule_type === 'INSTALLMENTS' 
          ? parseFloat(formData.total_amount) / parseInt(formData.installments)
          : parseFloat(formData.total_amount);
          
        if (monthlyAmount > maxAmount) {
          newErrors.total_amount = `Le montant mensuel ne peut pas dépasser ${(selectedType.max_percentage_salary * 100).toFixed(1)}% du salaire (${maxAmount.toFixed(2)} USD)`;
        }
      }
    }
    */

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const deductionData = {
        employe_id: formData.employe_id,
        deduction_type_id: formData.deduction_type_id,
        source_type: 'MANUAL',
        title: formData.title.trim(),
        total_amount: parseFloat(formData.total_amount),
        amount_remaining: parseFloat(formData.total_amount),
        schedule_type: formData.schedule_type,
        number_of_installments: formData.schedule_type === 'INSTALLMENTS' ? parseInt(formData.installments) : 1,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        max_per_period: formData.max_per_period ? parseFloat(formData.max_per_period) : null,
        status: 'ACTIVE',
        created_by: 'current_user' // TODO: get from auth context
      };

      await onSave(deductionData);
      onClose();
    } catch (error: any) {
      console.error('Error saving deduction:', error);
      setErrors({ submit: error.message || 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (typeId: string) => {
    setFormData(prev => ({ ...prev, deduction_type_id: typeId }));
    
    const selectedType = deductionTypes.find(type => type.id === typeId);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        schedule_type: selectedType.default_schedule_type || 'ONE_TIME',
        title: prev.title || selectedType.nom
      }));
    }
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.id === formData.employe_id);
  };

  const getSelectedType = () => {
    return deductionTypes.find(type => type.id === formData.deduction_type_id);
  };

  const calculateMonthlyAmount = () => {
    if (!formData.total_amount) return 0;
    const total = parseFloat(formData.total_amount);
    const installments = formData.schedule_type === 'INSTALLMENTS' ? parseInt(formData.installments) : 1;
    return total / installments;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Nouvelle Déduction
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Employé *
            </label>
            <select
              value={formData.employe_id}
              onChange={(e) => setFormData(prev => ({ ...prev, employe_id: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.employe_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un employé</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.matricule} - {employee.nom_complet} ({employee.categorie})
                </option>
              ))}
            </select>
            {errors.employe_id && (
              <p className="text-red-600 text-sm mt-1">{errors.employe_id}</p>
            )}
            {getSelectedEmployee() && (
              <p className="text-sm text-gray-600 mt-1">
                Salaire de base: ${getSelectedEmployee()?.salaire_base.toFixed(2)}
              </p>
            )}
          </div>

          {/* Deduction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de Déduction *
            </label>
            <select
              value={formData.deduction_type_id}
              onChange={(e) => handleTypeChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.deduction_type_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un type</option>
              {deductionTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.nom}
                </option>
              ))}
            </select>
            {errors.deduction_type_id && (
              <p className="text-red-600 text-sm mt-1">{errors.deduction_type_id}</p>
            )}
            {getSelectedType()?.description && (
              <p className="text-sm text-gray-600 mt-1">{getSelectedType()?.description}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Titre de la déduction"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Amount and Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Montant Total (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.total_amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.total_amount && (
                <p className="text-red-600 text-sm mt-1">{errors.total_amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'Échéancier
              </label>
              <select
                value={formData.schedule_type}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ONE_TIME">Paiement unique</option>
                <option value="INSTALLMENTS">Versements échelonnés</option>
                <option value="RECURRING">Récurrent</option>
              </select>
            </div>
          </div>

          {/* Installments */}
          {formData.schedule_type === 'INSTALLMENTS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Versements
              </label>
              <input
                type="number"
                min="2"
                value={formData.installments}
                onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.installments ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.installments && (
                <p className="text-red-600 text-sm mt-1">{errors.installments}</p>
              )}
              {formData.total_amount && formData.installments && (
                <p className="text-sm text-gray-600 mt-1">
                  Montant par versement: ${calculateMonthlyAmount().toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de Début *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.start_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.start_date && (
                <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Fin (optionnel)
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Max Per Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant Maximum par Période (optionnel)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.max_per_period}
              onChange={(e) => setFormData(prev => ({ ...prev, max_per_period: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Laisser vide pour aucune limite"
            />
            <p className="text-sm text-gray-500 mt-1">
              Limite le montant déduit par période de paie
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Créer la Déduction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}