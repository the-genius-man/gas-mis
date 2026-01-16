import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, AlertTriangle, Fuel, Edit, Eye, Wrench } from 'lucide-react';
import { VehiculeFlotte, TypeVehicule } from '../../types';
import VehicleDetailModal from './VehicleDetailModal';
import FuelConsumptionForm from './FuelConsumptionForm';
import VehicleRepairForm from './VehicleRepairForm';

const FleetManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehiculeFlotte[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehiculeFlotte | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiculeFlotte | null>(null);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelFormVehicle, setFuelFormVehicle] = useState<VehiculeFlotte | null>(null);
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [repairFormVehicle, setRepairFormVehicle] = useState<VehiculeFlotte | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const data = await window.electronAPI.getVehicles();
        setVehicles(data || []);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = !searchTerm || 
      v.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marque.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = !filterStatut || v.statut === filterStatut;
    return matchesSearch && matchesStatut;
  });

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'ACTIF': 'bg-green-100 text-green-800',
      'EN_REPARATION': 'bg-yellow-100 text-yellow-800',
      'HORS_SERVICE': 'bg-red-100 text-red-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      'VOITURE': 'bg-blue-100 text-blue-800',
      'MOTO': 'bg-purple-100 text-purple-800',
      'CAMIONNETTE': 'bg-orange-100 text-orange-800',
    };
    return styles[type] || 'bg-gray-100 text-gray-800';
  };

  const getDaysRemaining = (date: string | undefined) => {
    if (!date) return null;
    const expiry = new Date(date);
    const today = new Date();
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getExpiryWarning = (days: number | null) => {
    if (days === null) return null;
    if (days < 0) return { color: 'text-red-600 bg-red-50', text: 'Expiré' };
    if (days <= 15) return { color: 'text-red-600 bg-red-50', text: `${days}j` };
    if (days <= 30) return { color: 'text-yellow-600 bg-yellow-50', text: `${days}j` };
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion de la Flotte</h2>
          <p className="text-sm text-gray-500">{filteredVehicles.length} véhicule(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setRepairFormVehicle(null); setShowRepairForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            title="Enregistrer une réparation"
          >
            <Wrench className="w-4 h-4" />
            Réparation
          </button>
          <button
            onClick={() => { setFuelFormVehicle(null); setShowFuelForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            title="Enregistrer un plein"
          >
            <Fuel className="w-4 h-4" />
            Carburant
          </button>
          <button
            onClick={() => { setEditingVehicle(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouveau Véhicule
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par immatriculation ou marque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="EN_REPARATION">En réparation</option>
            <option value="HORS_SERVICE">Hors service</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const insuranceDays = getDaysRemaining(vehicle.assurance_date_fin);
            const technicalDays = getDaysRemaining(vehicle.controle_technique_expiration);
            const insuranceWarning = getExpiryWarning(insuranceDays);
            const technicalWarning = getExpiryWarning(technicalDays);

            return (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{vehicle.immatriculation}</h3>
                      <p className="text-sm text-gray-500">{vehicle.marque} {vehicle.modele}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutBadge(vehicle.statut)}`}>
                    {vehicle.statut.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadge(vehicle.type_vehicule)}`}>
                    {vehicle.type_vehicule}
                  </span>
                  
                  {vehicle.employe_nom && (
                    <p className="text-sm text-gray-500">Responsable: {vehicle.employe_nom}</p>
                  )}
                  
                  <p className="text-sm text-gray-500">
                    Kilométrage: {vehicle.kilometrage_actuel.toLocaleString()} km
                  </p>
                </div>

                {/* Compliance Alerts */}
                {(insuranceWarning || technicalWarning) && (
                  <div className="space-y-1 mb-4">
                    {insuranceWarning && (
                      <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${insuranceWarning.color}`}>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Assurance: {insuranceWarning.text}</span>
                      </div>
                    )}
                    {technicalWarning && (
                      <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${technicalWarning.color}`}>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Contrôle technique: {technicalWarning.text}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Voir détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditingVehicle(vehicle); setShowForm(true); }}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setRepairFormVehicle(vehicle); setShowRepairForm(true); }}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                    title="Ajouter réparation"
                  >
                    <Wrench className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setFuelFormVehicle(vehicle); setShowFuelForm(true); }}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Ajouter carburant"
                  >
                    <Fuel className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun véhicule enregistré</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Ajouter un véhicule
          </button>
        </div>
      )}

      {/* Vehicle Form Modal */}
      {showForm && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onClose={() => { setShowForm(false); setEditingVehicle(null); }}
          onSave={() => { setShowForm(false); setEditingVehicle(null); loadData(); }}
        />
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onEdit={(vehicle) => {
            setSelectedVehicle(null);
            setEditingVehicle(vehicle);
            setShowForm(true);
          }}
          onRefresh={loadData}
        />
      )}

      {/* Fuel Consumption Form */}
      {showFuelForm && (
        <FuelConsumptionForm
          vehicle={fuelFormVehicle || undefined}
          onClose={() => {
            setShowFuelForm(false);
            setFuelFormVehicle(null);
          }}
          onSuccess={() => {
            loadData();
            if (selectedVehicle) {
              // Refresh the selected vehicle if detail modal is open
              window.electronAPI?.getVehicle(selectedVehicle.id).then(updated => {
                if (updated) setSelectedVehicle(updated);
              });
            }
          }}
        />
      )}

      {/* Vehicle Repair Form */}
      {showRepairForm && (
        <VehicleRepairForm
          vehicle={repairFormVehicle || undefined}
          onClose={() => {
            setShowRepairForm(false);
            setRepairFormVehicle(null);
          }}
          onSuccess={() => {
            loadData();
            if (selectedVehicle) {
              // Refresh the selected vehicle if detail modal is open
              window.electronAPI?.getVehicle(selectedVehicle.id).then(updated => {
                if (updated) setSelectedVehicle(updated);
              });
            }
          }}
        />
      )}
    </div>
  );
};

// Vehicle Form Modal
interface VehicleFormModalProps {
  vehicle: VehiculeFlotte | null;
  onClose: () => void;
  onSave: () => void;
}

const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ vehicle, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type_vehicule: (vehicle?.type_vehicule || 'VOITURE') as TypeVehicule,
    marque: vehicle?.marque || '',
    modele: vehicle?.modele || '',
    immatriculation: vehicle?.immatriculation || '',
    annee_fabrication: vehicle?.annee_fabrication || new Date().getFullYear(),
    couleur: vehicle?.couleur || '',
    assurance_compagnie: vehicle?.assurance_compagnie || '',
    assurance_date_fin: vehicle?.assurance_date_fin || '',
    controle_technique_expiration: vehicle?.controle_technique_expiration || '',
    kilometrage_actuel: vehicle?.kilometrage_actuel || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marque || !formData.immatriculation) return;

    try {
      setSaving(true);
      if (window.electronAPI) {
        if (vehicle) {
          // Update existing vehicle
          await window.electronAPI.updateVehicle({
            id: vehicle.id,
            ...formData
          });
        } else {
          // Create new vehicle
          const id = crypto.randomUUID();
          await window.electronAPI.createVehicle({
            id,
            ...formData
          });
        }
      }
      onSave();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Erreur lors de l\'enregistrement du véhicule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {vehicle ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type_vehicule}
                  onChange={(e) => setFormData({ ...formData, type_vehicule: e.target.value as TypeVehicule })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VOITURE">Voiture</option>
                  <option value="MOTO">Moto</option>
                  <option value="CAMIONNETTE">Camionnette</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation *</label>
                <input
                  type="text"
                  value={formData.immatriculation}
                  onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marque *</label>
                <input
                  type="text"
                  value={formData.marque}
                  onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                <input
                  type="text"
                  value={formData.modele}
                  onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <input
                  type="number"
                  value={formData.annee_fabrication}
                  onChange={(e) => setFormData({ ...formData, annee_fabrication: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                <input
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilométrage</label>
                <input
                  type="number"
                  value={formData.kilometrage_actuel}
                  onChange={(e) => setFormData({ ...formData, kilometrage_actuel: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Conformité</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compagnie Assurance</label>
                  <input
                    type="text"
                    value={formData.assurance_compagnie}
                    onChange={(e) => setFormData({ ...formData, assurance_compagnie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Assurance</label>
                  <input
                    type="date"
                    value={formData.assurance_date_fin}
                    onChange={(e) => setFormData({ ...formData, assurance_date_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Contrôle Technique</label>
                <input
                  type="date"
                  value={formData.controle_technique_expiration}
                  onChange={(e) => setFormData({ ...formData, controle_technique_expiration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FleetManagement;
