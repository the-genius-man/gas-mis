import React, { useState, useEffect } from 'react';
import { X, Truck, AlertTriangle, CheckCircle, Calendar, Droplet, Edit, Wrench, FileText } from 'lucide-react';
import { VehiculeFlotte, ConsommationCarburant, ReparationVehicule } from '../../types';

interface VehicleDetailModalProps {
  vehicle: VehiculeFlotte;
  onClose: () => void;
  onEdit?: (vehicle: VehiculeFlotte) => void;
  onRefresh?: () => void;
}

type TabType = 'info' | 'fuel' | 'maintenance' | 'journal';

const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ vehicle, onClose, onEdit, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [fuelRecords, setFuelRecords] = useState<ConsommationCarburant[]>([]);
  const [repairRecords, setRepairRecords] = useState<ReparationVehicule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'fuel') {
      loadFuelRecords();
    } else if (activeTab === 'journal') {
      loadJournalRecords();
    }
  }, [activeTab, vehicle.id]);

  const loadFuelRecords = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const data = await window.electronAPI.getFuelConsumption({ vehiculeId: vehicle.id });
        setFuelRecords(data || []);
      }
    } catch (error) {
      console.error('Error loading fuel records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJournalRecords = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [fuel, repairs] = await Promise.all([
          window.electronAPI.getFuelConsumption({ vehiculeId: vehicle.id }),
          window.electronAPI.getVehicleRepairs({ vehiculeId: vehicle.id })
        ]);
        setFuelRecords(fuel || []);
        setRepairRecords(repairs || []);
      }
    } catch (error) {
      console.error('Error loading journal records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatus = (expirationDate?: string) => {
    if (!expirationDate) return { status: 'unknown', label: 'Non renseigné', color: 'gray' };
    
    const today = new Date();
    const expiry = new Date(expirationDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expiré', color: 'red', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 15) {
      return { status: 'critical', label: `${daysUntilExpiry}j restants`, color: 'red', days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', label: `${daysUntilExpiry}j restants`, color: 'yellow', days: daysUntilExpiry };
    } else {
      return { status: 'valid', label: 'Valide', color: 'green', days: daysUntilExpiry };
    }
  };

  const insuranceStatus = getComplianceStatus(vehicle.assurance_date_fin);
  const techInspectionStatus = getComplianceStatus(vehicle.controle_technique_expiration);

  const formatDate = (date?: string) => {
    if (!date) return 'Non renseigné';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '0 USD';
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`;
  };

  const getStatusBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'ACTIF': 'bg-green-100 text-green-800',
      'EN_REPARATION': 'bg-yellow-100 text-yellow-800',
      'HORS_SERVICE': 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      'ACTIF': 'Actif',
      'EN_REPARATION': 'En réparation',
      'HORS_SERVICE': 'Hors service'
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[statut] || 'bg-gray-100'}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'VOITURE': 'Voiture',
      'MOTO': 'Moto',
      'CAMIONNETTE': 'Camionnette'
    };
    return labels[type] || type;
  };

  const totalFuelCost = fuelRecords.reduce((sum, record) => sum + record.montant_total, 0);
  const totalLiters = fuelRecords.reduce((sum, record) => sum + record.quantite_litres, 0);
  const avgConsumption = fuelRecords.length > 0 ? totalLiters / fuelRecords.length : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {vehicle.marque} {vehicle.modele || ''}
              </h2>
              <p className="text-sm text-gray-500">{vehicle.immatriculation}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(vehicle.statut)}
            {onEdit && (
              <button
                onClick={() => onEdit(vehicle)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Modifier"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-4">
            {[
              { id: 'info' as TabType, label: 'Informations', icon: Truck },
              { id: 'fuel' as TabType, label: 'Carburant', icon: Droplet },
              { id: 'maintenance' as TabType, label: 'Conformité', icon: Calendar },
              { id: 'journal' as TabType, label: 'Journal', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Vehicle Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Détails du Véhicule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Type</label>
                    <p className="text-sm font-medium text-gray-900">{getTypeLabel(vehicle.type_vehicule)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Marque</label>
                    <p className="text-sm font-medium text-gray-900">{vehicle.marque}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Modèle</label>
                    <p className="text-sm font-medium text-gray-900">{vehicle.modele || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Immatriculation</label>
                    <p className="text-sm font-medium text-gray-900">{vehicle.immatriculation}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Numéro de Chassis</label>
                    <p className="text-sm font-medium text-gray-900">{vehicle.numero_chassis || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Année</label>
                    <p className="text-sm font-medium text-gray-900">{vehicle.annee_fabrication || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Couleur</label>
                    <p className="text-sm font-medium text-gray-900">{vehicle.couleur || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Kilométrage</label>
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.kilometrage_actuel?.toLocaleString() || '0'} km
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              {vehicle.employe_responsable_id && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Affectation</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900">{vehicle.employe_nom || 'Employé'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Depuis le {formatDate(vehicle.date_affectation)}
                    </p>
                  </div>
                </div>
              )}

              {/* Compliance Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">État de Conformité</h3>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    insuranceStatus.status === 'expired' || insuranceStatus.status === 'critical' ? 'bg-red-50' :
                    insuranceStatus.status === 'warning' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      {insuranceStatus.status === 'valid' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">Assurance</p>
                        <p className="text-xs text-gray-600">Expire le {formatDate(vehicle.assurance_date_fin)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      insuranceStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                      insuranceStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {insuranceStatus.label}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    techInspectionStatus.status === 'expired' || techInspectionStatus.status === 'critical' ? 'bg-red-50' :
                    techInspectionStatus.status === 'warning' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      {techInspectionStatus.status === 'valid' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">Contrôle Technique</p>
                        <p className="text-xs text-gray-600">Expire le {formatDate(vehicle.controle_technique_expiration)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      techInspectionStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                      techInspectionStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {techInspectionStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fuel Tab */}
          {activeTab === 'fuel' && (
            <div className="space-y-6">
              {/* Fuel Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Coût Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalFuelCost)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Litres</p>
                  <p className="text-2xl font-bold text-gray-900">{totalLiters.toFixed(1)} L</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Moyenne/Plein</p>
                  <p className="text-2xl font-bold text-gray-900">{avgConsumption.toFixed(1)} L</p>
                </div>
              </div>

              {/* Fuel Records */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Historique des Pleins</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : fuelRecords.length > 0 ? (
                  <div className="space-y-3">
                    {fuelRecords.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{formatDate(record.date_plein)}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {record.quantite_litres} L × {formatCurrency(record.prix_unitaire)}/L
                            </p>
                            {record.station && (
                              <p className="text-xs text-gray-500 mt-1">Station: {record.station}</p>
                            )}
                            {record.kilometrage && (
                              <p className="text-xs text-gray-500">Kilométrage: {record.kilometrage.toLocaleString()} km</p>
                            )}
                            {record.conducteur_nom && (
                              <p className="text-xs text-gray-500">Conducteur: {record.conducteur_nom}</p>
                            )}
                            {record.notes && (
                              <p className="text-xs text-gray-600 mt-2">{record.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(record.montant_total)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Droplet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucun enregistrement de carburant</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              {/* Insurance */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Assurance</h3>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Compagnie</label>
                      <p className="text-sm font-medium text-gray-900">{vehicle.assurance_compagnie || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Numéro de Police</label>
                      <p className="text-sm font-medium text-gray-900">{vehicle.assurance_numero_police || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Date de Début</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.assurance_date_debut)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Date d'Expiration</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.assurance_date_fin)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {insuranceStatus.status === 'valid' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      insuranceStatus.status === 'valid' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {insuranceStatus.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Inspection */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Contrôle Technique</h3>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Dernière Inspection</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.controle_technique_date)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Date d'Expiration</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(vehicle.controle_technique_expiration)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {techInspectionStatus.status === 'valid' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      techInspectionStatus.status === 'valid' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {techInspectionStatus.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Taxes */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Taxes et Vignette</h3>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Vignette Année</label>
                      <p className="text-sm font-medium text-gray-900">{vehicle.vignette_annee || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Montant Vignette</label>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(vehicle.vignette_montant)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Taxe de Voirie Année</label>
                      <p className="text-sm font-medium text-gray-900">{vehicle.taxe_voirie_annee || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Montant Taxe de Voirie</label>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(vehicle.taxe_voirie_montant)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Journal Tab */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Historique Complet</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                (() => {
                  // Combine and sort all records chronologically
                  const allRecords: Array<{
                    date: string;
                    type: 'fuel' | 'repair';
                    data: ConsommationCarburant | ReparationVehicule;
                  }> = [
                    ...fuelRecords.map(f => ({ date: f.date_plein, type: 'fuel' as const, data: f })),
                    ...repairRecords.map(r => ({ date: r.date_reparation, type: 'repair' as const, data: r }))
                  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  if (allRecords.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucun enregistrement dans le journal</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {allRecords.map((record, index) => {
                        if (record.type === 'fuel') {
                          const fuel = record.data as ConsommationCarburant;
                          return (
                            <div key={`fuel-${fuel.id}-${index}`} className="border rounded-lg p-4 bg-green-50 border-green-200">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Droplet className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                        CARBURANT
                                      </span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {formatDate(fuel.date_plein)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium">
                                      {fuel.quantite_litres} L × {formatCurrency(fuel.prix_unitaire)}/L
                                    </p>
                                    {fuel.station && (
                                      <p className="text-xs text-gray-600 mt-1">Station: {fuel.station}</p>
                                    )}
                                    {fuel.kilometrage && (
                                      <p className="text-xs text-gray-600">Kilométrage: {fuel.kilometrage.toLocaleString()} km</p>
                                    )}
                                    {fuel.conducteur_nom && (
                                      <p className="text-xs text-gray-600">Conducteur: {fuel.conducteur_nom}</p>
                                    )}
                                    {fuel.notes && (
                                      <p className="text-xs text-gray-600 mt-2 italic">{fuel.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">{formatCurrency(fuel.montant_total)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          const repair = record.data as ReparationVehicule;
                          const getRepairTypeLabel = (type: string) => {
                            const labels: Record<string, string> = {
                              'ENTRETIEN': 'Entretien',
                              'REPARATION': 'Réparation',
                              'REVISION': 'Révision',
                              'PNEUS': 'Pneus',
                              'FREINS': 'Freins',
                              'MOTEUR': 'Moteur',
                              'CARROSSERIE': 'Carrosserie',
                              'AUTRE': 'Autre'
                            };
                            return labels[type] || type;
                          };

                          const getRepairTypeColor = (type: string) => {
                            const colors: Record<string, string> = {
                              'ENTRETIEN': 'bg-blue-100 text-blue-800',
                              'REPARATION': 'bg-orange-100 text-orange-800',
                              'REVISION': 'bg-purple-100 text-purple-800',
                              'PNEUS': 'bg-gray-100 text-gray-800',
                              'FREINS': 'bg-red-100 text-red-800',
                              'MOTEUR': 'bg-yellow-100 text-yellow-800',
                              'CARROSSERIE': 'bg-indigo-100 text-indigo-800',
                              'AUTRE': 'bg-gray-100 text-gray-800'
                            };
                            return colors[type] || 'bg-gray-100 text-gray-800';
                          };

                          return (
                            <div key={`repair-${repair.id}-${index}`} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Wrench className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getRepairTypeColor(repair.type_reparation)}`}>
                                        {getRepairTypeLabel(repair.type_reparation)}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {formatDate(repair.date_reparation)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium">{repair.description}</p>
                                    {repair.garage && (
                                      <p className="text-xs text-gray-600 mt-1">Garage: {repair.garage}</p>
                                    )}
                                    {repair.kilometrage && (
                                      <p className="text-xs text-gray-600">Kilométrage: {repair.kilometrage.toLocaleString()} km</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                      <span>Main d'œuvre: {formatCurrency(repair.cout_main_oeuvre)}</span>
                                      <span>Pièces: {formatCurrency(repair.cout_pieces)}</span>
                                    </div>
                                    {repair.prochaine_revision_date && (
                                      <p className="text-xs text-blue-600 mt-2">
                                        Prochaine révision: {formatDate(repair.prochaine_revision_date)}
                                        {repair.prochaine_revision_km && ` (${repair.prochaine_revision_km.toLocaleString()} km)`}
                                      </p>
                                    )}
                                    {repair.notes && (
                                      <p className="text-xs text-gray-600 mt-2 italic">{repair.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">{formatCurrency(repair.montant_total)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;
