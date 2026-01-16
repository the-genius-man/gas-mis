import React, { useState, useEffect } from 'react';
import { X, Wrench } from 'lucide-react';
import { VehiculeFlotte, TypeReparation } from '../../types';

interface VehicleRepairFormProps {
  vehicle?: VehiculeFlotte;
  onClose: () => void;
  onSuccess: () => void;
}

const VehicleRepairForm: React.FC<VehicleRepairFormProps> = ({ vehicle, onClose, onSuccess }) => {
  const [vehicles, setVehicles] = useState<VehiculeFlotte[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicule_id: vehicle?.id || '',
    date_reparation: new Date().toISOString().split('T')[0],
    type_reparation: 'REPARATION' as TypeReparation,
    description: '',
    garage: '',
    cout_main_oeuvre: '',
    cout_pieces: '',
    montant_total: '',
    kilometrage: vehicle?.kilometrage_actuel?.toString() || '',
    prochaine_revision_km: '',
    prochaine_revision_date: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-calculate total
    const mainOeuvre = parseFloat(formData.cout_main_oeuvre) || 0;
    const pieces = parseFloat(formData.cout_pieces) || 0;
    const total = mainOeuvre + pieces;
    if (total > 0) {
      setFormData(prev => ({ ...prev, montant_total: total.toFixed(2) }));
    }
  }, [formData.cout_main_oeuvre, formData.cout_pieces]);

  const loadData = async () => {
    try {
      if (window.electronAPI) {
        const vehiclesData = await window.electronAPI.getVehicles({ statut: 'ACTIF' });
        setVehicles(vehiclesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicule_id || !formData.description || !formData.montant_total) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      if (window.electronAPI) {
        await window.electronAPI.createVehicleRepair({
          id: crypto.randomUUID(),
          vehicule_id: formData.vehicule_id,
          date_reparation: formData.date_reparation,
          type_reparation: formData.type_reparation,
          description: formData.description,
          garage: formData.garage || null,
          cout_main_oeuvre: parseFloat(formData.cout_main_oeuvre) || 0,
          cout_pieces: parseFloat(formData.cout_pieces) || 0,
          montant_total: parseFloat(formData.montant_total),
          kilometrage: formData.kilometrage ? parseInt(formData.kilometrage) : null,
          prochaine_revision_km: formData.prochaine_revision_km ? parseInt(formData.prochaine_revision_km) : null,
          prochaine_revision_date: formData.prochaine_revision_date || null,
          notes: formData.notes || null
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating vehicle repair:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const repairTypes: { value: TypeReparation; label: string }[] = [
    { value: 'ENTRETIEN', label: 'Entretien' },
    { value: 'REPARATION', label: 'Réparation' },
    { value: 'REVISION', label: 'Révision' },
    { value: 'PNEUS', label: 'Pneus' },
    { value: 'FREINS', label: 'Freins' },
    { value: 'MOTEUR', label: 'Moteur' },
    { value: 'CARROSSERIE', label: 'Carrosserie' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Enregistrer une Réparation</h2>
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
                    kilometrage: selectedVehicle?.kilometrage_actuel?.toString() || ''
                  });
                }}
                disabled={!!vehicle}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
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

            {/* Date and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date_reparation}
                  onChange={(e) => setFormData({ ...formData, date_reparation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type_reparation}
                  onChange={(e) => setFormData({ ...formData, type_reparation: e.target.value as TypeReparation })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                >
                  {repairTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Détails de la réparation..."
                required
              />
            </div>

            {/* Garage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Garage/Atelier
              </label>
              <input
                type="text"
                value={formData.garage}
                onChange={(e) => setFormData({ ...formData, garage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Nom du garage"
              />
            </div>

            {/* Costs */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main d'œuvre (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cout_main_oeuvre}
                  onChange={(e) => setFormData({ ...formData, cout_main_oeuvre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pièces (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cout_pieces}
                  onChange={(e) => setFormData({ ...formData, cout_pieces: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.montant_total}
                  onChange={(e) => setFormData({ ...formData, montant_total: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500"
                  placeholder="Calculé auto"
                  readOnly
                  required
                />
              </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Kilométrage au moment de la réparation"
              />
              <p className="text-xs text-gray-500 mt-1">
                Le kilométrage du véhicule sera mis à jour avec cette valeur
              </p>
            </div>

            {/* Next Revision */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prochaine Révision (km)
                </label>
                <input
                  type="number"
                  value={formData.prochaine_revision_km}
                  onChange={(e) => setFormData({ ...formData, prochaine_revision_km: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 15000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prochaine Révision (date)
                </label>
                <input
                  type="date"
                  value={formData.prochaine_revision_date}
                  onChange={(e) => setFormData({ ...formData, prochaine_revision_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
            disabled={loading || !formData.vehicule_id || !formData.description || !formData.montant_total}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

export default VehicleRepairForm;
