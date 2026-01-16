import React, { useState, useEffect } from 'react';
import { X, Droplet } from 'lucide-react';
import { VehiculeFlotte, EmployeeGASFull } from '../../types';

interface FuelConsumptionFormProps {
  vehicle?: VehiculeFlotte;
  onClose: () => void;
  onSuccess: () => void;
}

const FuelConsumptionForm: React.FC<FuelConsumptionFormProps> = ({ vehicle, onClose, onSuccess }) => {
  const [vehicles, setVehicles] = useState<VehiculeFlotte[]>([]);
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicule_id: vehicle?.id || '',
    date_plein: new Date().toISOString().split('T')[0],
    quantite_litres: '',
    prix_unitaire: '',
    montant_total: '',
    kilometrage: vehicle?.kilometrage_actuel?.toString() || '',
    station: '',
    conducteur_id: vehicle?.employe_responsable_id || '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-calculate total
    const litres = parseFloat(formData.quantite_litres) || 0;
    const prix = parseFloat(formData.prix_unitaire) || 0;
    const total = litres * prix;
    if (total > 0) {
      setFormData(prev => ({ ...prev, montant_total: total.toFixed(2) }));
    }
  }, [formData.quantite_litres, formData.prix_unitaire]);

  const loadData = async () => {
    try {
      if (window.electronAPI) {
        const [vehiclesData, employeesData] = await Promise.all([
          window.electronAPI.getVehicles({ statut: 'ACTIF' }),
          window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' })
        ]);
        setVehicles(vehiclesData || []);
        setEmployees(employeesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicule_id || !formData.quantite_litres || !formData.prix_unitaire) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      if (window.electronAPI) {
        await window.electronAPI.createFuelConsumption({
          id: crypto.randomUUID(),
          vehicule_id: formData.vehicule_id,
          date_plein: formData.date_plein,
          quantite_litres: parseFloat(formData.quantite_litres),
          prix_unitaire: parseFloat(formData.prix_unitaire),
          montant_total: parseFloat(formData.montant_total),
          kilometrage: formData.kilometrage ? parseInt(formData.kilometrage) : null,
          station: formData.station || null,
          conducteur_id: formData.conducteur_id || null,
          notes: formData.notes || null
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating fuel consumption:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Droplet className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Enregistrer un Plein</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Véhicule <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vehicule_id}
                onChange={(e) => {
                  const selectedVehicle = vehicles.find(v => v.id === e.target.value);
                  setFormData({
                    ...formData,
                    vehicule_id: e.target.value,
                    kilometrage: selectedVehicle?.kilometrage_actuel?.toString() || '',
                    conducteur_id: selectedVehicle?.employe_responsable_id || ''
                  });
                }}
                disabled={!!vehicle}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.immatriculation} - {v.marque} {v.modele || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date du Plein <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date_plein}
                onChange={(e) => setFormData({ ...formData, date_plein: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité (Litres) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantite_litres}
                  onChange={(e) => setFormData({ ...formData, quantite_litres: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix Unitaire (USD/L) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.prix_unitaire}
                  onChange={(e) => setFormData({ ...formData, prix_unitaire: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Total Amount (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant Total (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.montant_total}
                onChange={(e) => setFormData({ ...formData, montant_total: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                placeholder="Calculé automatiquement"
                readOnly
              />
            </div>

            {/* Kilometrage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kilométrage Actuel
              </label>
              <input
                type="number"
                value={formData.kilometrage}
                onChange={(e) => setFormData({ ...formData, kilometrage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Kilométrage au moment du plein"
              />
              <p className="text-xs text-gray-500 mt-1">
                Le kilométrage du véhicule sera mis à jour avec cette valeur
              </p>
            </div>

            {/* Station */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Station Service
              </label>
              <input
                type="text"
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de la station"
              />
            </div>

            {/* Driver */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conducteur
              </label>
              <select
                value={formData.conducteur_id}
                onChange={(e) => setFormData({ ...formData, conducteur_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un conducteur</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom_complet}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.vehicule_id || !formData.quantite_litres || !formData.prix_unitaire}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FuelConsumptionForm;
