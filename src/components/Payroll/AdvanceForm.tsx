import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { EmployeeGASFull } from '../../types';

interface AdvanceFormProps {
  employees: EmployeeGASFull[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdvanceForm({ employees, onClose, onSuccess }: AdvanceFormProps) {
  const [formData, setFormData] = useState({
    employe_id: '',
    date_avance: new Date().toISOString().split('T')[0],
    montant_total: 0,
    nombre_mensualites: 1,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const mensualiteMontant = formData.nombre_mensualites > 0 
    ? (formData.montant_total / formData.nombre_mensualites).toFixed(2)
    : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!window.electronAPI) return;
    
    if (!formData.employe_id) {
      alert('Veuillez sélectionner un employé');
      return;
    }
    
    if (formData.montant_total <= 0) {
      alert('Le montant doit être supérieur à 0');
      return;
    }
    
    if (formData.nombre_mensualites <= 0) {
      alert('Le nombre de mensualités doit être supérieur à 0');
      return;
    }
    
    setSubmitting(true);
    try {
      await window.electronAPI.createAdvance({
        ...formData,
        cree_par: 'current_user' // TODO: get from auth context
      });
      
      alert('Avance créée avec succès');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating advance:', error);
      alert(error.message || 'Erreur lors de la création de l\'avance');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === formData.employe_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nouvelle Avance</h2>
          <p className="text-gray-600 mt-1">Créer une avance pour un employé</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employé <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.employe_id}
              onChange={(e) => setFormData({ ...formData, employe_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.matricule} - {emp.nom_complet} ({emp.categorie})
                </option>
              ))}
            </select>
          </div>

          {/* Employee Info */}
          {selectedEmployee && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium">Catégorie</p>
                  <p className="text-blue-900">{selectedEmployee.categorie}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Salaire Base</p>
                  <p className="text-blue-900">${selectedEmployee.salaire_base.toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Mode Rémunération</p>
                  <p className="text-blue-900">{selectedEmployee.mode_remuneration}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de l'Avance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date_avance}
                onChange={(e) => setFormData({ ...formData, date_avance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant Total (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.montant_total || ''}
                  onChange={(e) => setFormData({ ...formData, montant_total: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Installments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de Mensualités <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={formData.nombre_mensualites}
              onChange={(e) => setFormData({ ...formData, nombre_mensualites: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum 24 mois
            </p>
          </div>

          {/* Calculation Preview */}
          {formData.montant_total > 0 && formData.nombre_mensualites > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Mensualité Calculée</p>
                  <p className="text-xs text-green-600 mt-1">
                    Sera déduite automatiquement chaque mois lors du calcul de paie
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  ${mensualiteMontant}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Raison de l'avance, conditions particulières..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Création...' : 'Créer l\'Avance'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">ℹ️ Information</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>L'avance sera automatiquement déduite du salaire lors du calcul de paie mensuel</li>
          <li>Le remboursement commence dès le mois suivant la création de l'avance</li>
          <li>Si le salaire net est insuffisant, le remboursement sera reporté au mois suivant</li>
          <li>L'employé peut consulter le solde restant dans son profil</li>
        </ul>
      </div>
    </div>
  );
}
