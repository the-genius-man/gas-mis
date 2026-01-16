import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ActionDisciplinaire, TypeActionDisciplinaire, EmployeeGASFull } from '../../types';

interface ActionFormProps {
  action: ActionDisciplinaire | null;
  onClose: () => void;
  onSave: () => void;
}

const ActionForm: React.FC<ActionFormProps> = ({ action, onClose, onSave }) => {
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [formData, setFormData] = useState({
    employe_id: action?.employe_id || '',
    type_action: action?.type_action || 'AVERTISSEMENT_VERBAL' as TypeActionDisciplinaire,
    date_incident: action?.date_incident || new Date().toISOString().split('T')[0],
    description_incident: action?.description_incident || '',
    lieu_incident: action?.lieu_incident || '',
    temoins: action?.temoins || '',
    impact_financier: action?.impact_financier || false,
    montant_deduction: action?.montant_deduction || 0,
    jours_suspension: action?.jours_suspension || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      if (window.electronAPI?.getEmployeesGAS) {
        const data = await window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' });
        setEmployees(data || []);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employe_id || !formData.description_incident) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const actionData = {
        ...formData,
        id: action?.id || `disc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        statut: 'BROUILLON',
      };

      if (action) {
        if (window.electronAPI?.updateDisciplinaryAction) {
          await window.electronAPI.updateDisciplinaryAction(actionData);
        }
      } else {
        if (window.electronAPI?.createDisciplinaryAction) {
          await window.electronAPI.createDisciplinaryAction(actionData);
        }
      }

      onSave();
    } catch (err) {
      console.error('Error saving action:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {action ? 'Modifier l\'Action Disciplinaire' : 'Nouvelle Action Disciplinaire'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employé *
            </label>
            <select
              value={formData.employe_id}
              onChange={(e) => setFormData({ ...formData, employe_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
              disabled={!!action}
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.matricule} - {emp.nom_complet}
                </option>
              ))}
            </select>
          </div>

          {/* Type and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'Action *
              </label>
              <select
                value={formData.type_action}
                onChange={(e) => setFormData({ ...formData, type_action: e.target.value as TypeActionDisciplinaire })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="AVERTISSEMENT_VERBAL">Avertissement Verbal</option>
                <option value="AVERTISSEMENT_ECRIT">Avertissement Écrit</option>
                <option value="SUSPENSION">Suspension</option>
                <option value="LICENCIEMENT">Licenciement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de l'Incident *
              </label>
              <input
                type="date"
                value={formData.date_incident}
                onChange={(e) => setFormData({ ...formData, date_incident: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description de l'Incident *
            </label>
            <textarea
              value={formData.description_incident}
              onChange={(e) => setFormData({ ...formData, description_incident: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Décrivez l'incident en détail..."
              required
            />
          </div>

          {/* Location and Witnesses */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu de l'Incident
              </label>
              <input
                type="text"
                value={formData.lieu_incident}
                onChange={(e) => setFormData({ ...formData, lieu_incident: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Ex: Site ABC, Bureau principal..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Témoins
              </label>
              <input
                type="text"
                value={formData.temoins}
                onChange={(e) => setFormData({ ...formData, temoins: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Noms des témoins..."
              />
            </div>
          </div>

          {/* Financial Impact */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="impact_financier"
                checked={formData.impact_financier}
                onChange={(e) => setFormData({ ...formData, impact_financier: e.target.checked })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="impact_financier" className="text-sm font-medium text-gray-700">
                Impact Financier / Sanction
              </label>
            </div>

            {formData.impact_financier && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant Déduction (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.montant_deduction}
                    onChange={(e) => setFormData({ ...formData, montant_deduction: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jours de Suspension
                  </label>
                  <input
                    type="number"
                    value={formData.jours_suspension}
                    onChange={(e) => setFormData({ ...formData, jours_suspension: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionForm;
