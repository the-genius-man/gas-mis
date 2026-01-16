import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Edit, Eye, UserPlus, RotateCcw, QrCode, ScanLine } from 'lucide-react';
import { Equipement, CategorieEquipement, StatutEquipement, EtatEquipement, EmployeeGASFull } from '../../types';
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeScanner from './QRCodeScanner';

const EquipmentManagement: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipement[]>([]);
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<CategorieEquipement | ''>('');
  const [filterStatut, setFilterStatut] = useState<StatutEquipement | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipement | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrEquipment, setQrEquipment] = useState<Equipement | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningEquipment, setAssigningEquipment] = useState<Equipement | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningEquipment, setReturningEquipment] = useState<Equipement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [equipmentData, employeesData] = await Promise.all([
          window.electronAPI.getEquipment(),
          window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' })
        ]);
        setEquipment(equipmentData || []);
        setEmployees(employeesData || []);
      } else {
        setEquipment([]);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch = !searchTerm || 
      e.code_equipement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = !filterCategorie || e.categorie === filterCategorie;
    const matchesStatut = !filterStatut || e.statut === filterStatut;
    return matchesSearch && matchesCategorie && matchesStatut;
  });

  const getCategorieBadge = (categorie: CategorieEquipement) => {
    const styles: Record<CategorieEquipement, string> = {
      'UNIFORME': 'bg-blue-100 text-blue-800',
      'RADIO': 'bg-purple-100 text-purple-800',
      'TORCHE': 'bg-yellow-100 text-yellow-800',
      'PR24': 'bg-orange-100 text-orange-800',
      'AUTRE': 'bg-gray-100 text-gray-800',
    };
    return styles[categorie] || 'bg-gray-100 text-gray-800';
  };

  const getStatutBadge = (statut: StatutEquipement) => {
    const styles: Record<StatutEquipement, string> = {
      'DISPONIBLE': 'bg-green-100 text-green-800',
      'AFFECTE': 'bg-blue-100 text-blue-800',
      'EN_REPARATION': 'bg-yellow-100 text-yellow-800',
      'RETIRE': 'bg-red-100 text-red-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const getEtatBadge = (etat: EtatEquipement) => {
    const styles: Record<EtatEquipement, string> = {
      'NEUF': 'bg-green-100 text-green-800',
      'BON': 'bg-blue-100 text-blue-800',
      'USAGE': 'bg-yellow-100 text-yellow-800',
      'ENDOMMAGE': 'bg-orange-100 text-orange-800',
      'PERDU': 'bg-red-100 text-red-800',
    };
    return styles[etat] || 'bg-gray-100 text-gray-800';
  };

  const handleQRScan = (scannedCode: string) => {
    // Search for equipment by the scanned code
    const foundEquipment = equipment.find(
      e => e.code_equipement === scannedCode || 
           e.qr_code === scannedCode ||
           e.id === scannedCode
    );

    if (foundEquipment) {
      // Set search term to highlight the found equipment
      setSearchTerm(scannedCode);
      setScanMessage({ type: 'success', text: `Équipement trouvé: ${foundEquipment.designation}` });
      // Optionally show the QR code details
      setQrEquipment(foundEquipment);
      setShowQRCode(true);
    } else {
      setScanMessage({ type: 'error', text: `Aucun équipement trouvé avec le code: ${scannedCode}` });
    }

    setShowScanner(false);
    
    // Clear message after 5 seconds
    setTimeout(() => setScanMessage(null), 5000);
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
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Équipements</h2>
          <p className="text-sm text-gray-500">{filteredEquipment.length} équipement(s)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <ScanLine className="w-4 h-4" />
            Scanner QR
          </button>
          <button
            onClick={() => { setEditingEquipment(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouvel Équipement
          </button>
        </div>
      </div>

      {/* Scan Message */}
      {scanMessage && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          scanMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {scanMessage.type === 'success' ? (
            <QrCode className="w-5 h-5" />
          ) : (
            <Package className="w-5 h-5" />
          )}
          <span>{scanMessage.text}</span>
          <button 
            onClick={() => setScanMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par code ou désignation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value as CategorieEquipement | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes catégories</option>
            <option value="UNIFORME">Uniforme</option>
            <option value="RADIO">Radio</option>
            <option value="TORCHE">Torche</option>
            <option value="PR24">PR 24</option>
            <option value="AUTRE">Autre</option>
          </select>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as StatutEquipement | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous statuts</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="AFFECTE">Affecté</option>
            <option value="EN_REPARATION">En réparation</option>
            <option value="RETIRE">Retiré</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      {filteredEquipment.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">État</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affecté à</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.code_equipement}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategorieBadge(item.categorie)}`}>
                      {item.categorie}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEtatBadge(item.etat)}`}>
                      {item.etat}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutBadge(item.statut)}`}>
                      {item.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.employe_affecte_nom || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600" title="Voir">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingEquipment(item); setShowForm(true); }}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setQrEquipment(item); setShowQRCode(true); }}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                        title="Générer QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      {item.statut === 'DISPONIBLE' && (
                        <button 
                          onClick={() => { setAssigningEquipment(item); setShowAssignModal(true); }}
                          className="p-1 text-gray-400 hover:text-purple-600" 
                          title="Affecter"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      {item.statut === 'AFFECTE' && (
                        <button 
                          onClick={() => { setReturningEquipment(item); setShowReturnModal(true); }}
                          className="p-1 text-gray-400 hover:text-orange-600" 
                          title="Retourner"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun équipement enregistré</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Ajouter un équipement
          </button>
        </div>
      )}

      {/* Equipment Form Modal */}
      {showForm && (
        <EquipmentFormModal
          equipment={editingEquipment}
          onClose={() => { setShowForm(false); setEditingEquipment(null); }}
          onSave={() => { setShowForm(false); setEditingEquipment(null); loadData(); }}
        />
      )}

      {/* QR Code Generator Modal */}
      {showQRCode && qrEquipment && (
        <QRCodeGenerator
          equipment={qrEquipment}
          onClose={() => { setShowQRCode(false); setQrEquipment(null); }}
        />
      )}

      {/* QR Code Scanner Modal */}
      {showScanner && (
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Equipment Assignment Modal */}
      {showAssignModal && assigningEquipment && (
        <EquipmentAssignmentModal
          equipment={assigningEquipment}
          employees={employees}
          onClose={() => { setShowAssignModal(false); setAssigningEquipment(null); }}
          onSave={() => { setShowAssignModal(false); setAssigningEquipment(null); loadData(); }}
        />
      )}

      {/* Equipment Return Modal */}
      {showReturnModal && returningEquipment && (
        <EquipmentReturnModal
          equipment={returningEquipment}
          onClose={() => { setShowReturnModal(false); setReturningEquipment(null); }}
          onSave={() => { setShowReturnModal(false); setReturningEquipment(null); loadData(); }}
        />
      )}
    </div>
  );
};

// Equipment Form Modal
interface EquipmentFormModalProps {
  equipment: Equipement | null;
  onClose: () => void;
  onSave: () => void;
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({ equipment, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    code_equipement: equipment?.code_equipement || '',
    categorie: equipment?.categorie || 'UNIFORME' as CategorieEquipement,
    designation: equipment?.designation || '',
    description: equipment?.description || '',
    numero_serie: equipment?.numero_serie || '',
    date_acquisition: equipment?.date_acquisition || '',
    cout_acquisition: equipment?.cout_acquisition || 0,
    etat: equipment?.etat || 'NEUF' as EtatEquipement,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.designation) return;

    try {
      setSaving(true);
      if (window.electronAPI) {
        if (equipment) {
          // Update existing equipment
          await window.electronAPI.updateEquipment({
            id: equipment.id,
            ...formData
          });
        } else {
          // Create new equipment
          const id = crypto.randomUUID();
          await window.electronAPI.createEquipment({
            id,
            ...formData
          });
        }
      }
      onSave();
    } catch (error) {
      console.error('Error saving equipment:', error);
      alert('Erreur lors de l\'enregistrement de l\'équipement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {equipment ? 'Modifier l\'Équipement' : 'Nouvel Équipement'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code_equipement}
                  onChange={(e) => setFormData({ ...formData, code_equipement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-généré si vide"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value as CategorieEquipement })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UNIFORME">Uniforme</option>
                  <option value="RADIO">Radio</option>
                  <option value="TORCHE">Torche</option>
                  <option value="PR24">PR 24</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Désignation *</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Série</label>
                <input
                  type="text"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
                <select
                  value={formData.etat}
                  onChange={(e) => setFormData({ ...formData, etat: e.target.value as EtatEquipement })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NEUF">Neuf</option>
                  <option value="BON">Bon</option>
                  <option value="USAGE">Usagé</option>
                  <option value="ENDOMMAGE">Endommagé</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Acquisition</label>
                <input
                  type="date"
                  value={formData.date_acquisition}
                  onChange={(e) => setFormData({ ...formData, date_acquisition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coût (USD)</label>
                <input
                  type="number"
                  value={formData.cout_acquisition}
                  onChange={(e) => setFormData({ ...formData, cout_acquisition: parseFloat(e.target.value) })}
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

// Equipment Assignment Modal
interface EquipmentAssignmentModalProps {
  equipment: Equipement;
  employees: EmployeeGASFull[];
  onClose: () => void;
  onSave: () => void;
}

const EquipmentAssignmentModal: React.FC<EquipmentAssignmentModalProps> = ({ equipment, employees, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    employe_id: '',
    date_affectation: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employe_id) {
      setError('Veuillez sélectionner un employé');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (window.electronAPI) {
        await window.electronAPI.assignEquipment({
          id: crypto.randomUUID(),
          equipement_id: equipment.id,
          employe_id: formData.employe_id,
          date_affectation: formData.date_affectation,
          notes: formData.notes || null
        });
      }
      onSave();
    } catch (err: any) {
      console.error('Error assigning equipment:', err);
      setError(err.message || 'Erreur lors de l\'affectation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Affecter l'Équipement</h3>
          
          {/* Equipment Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">Équipement:</p>
            <p className="font-medium">{equipment.designation}</p>
            <p className="text-sm text-gray-500">{equipment.code_equipement} - {equipment.categorie}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employé *</label>
              <select
                value={formData.employe_id}
                onChange={(e) => setFormData({ ...formData, employe_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un employé</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.matricule} - {emp.nom_complet}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'affectation</label>
              <input
                type="date"
                value={formData.date_affectation}
                onChange={(e) => setFormData({ ...formData, date_affectation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Notes optionnelles..."
              />
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Affectation...' : 'Affecter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Equipment Return Modal
interface EquipmentReturnModalProps {
  equipment: Equipement;
  onClose: () => void;
  onSave: () => void;
}

const EquipmentReturnModal: React.FC<EquipmentReturnModalProps> = ({ equipment, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date_retour: new Date().toISOString().split('T')[0],
    etat_retour: 'BON' as EtatEquipement,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      if (window.electronAPI) {
        await window.electronAPI.returnEquipment({
          equipement_id: equipment.id,
          date_retour: formData.date_retour,
          etat_retour: formData.etat_retour,
          notes: formData.notes || null
        });
      }
      onSave();
    } catch (err: any) {
      console.error('Error returning equipment:', err);
      setError(err.message || 'Erreur lors du retour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Retour d'Équipement</h3>
          
          {/* Equipment Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">Équipement:</p>
            <p className="font-medium">{equipment.designation}</p>
            <p className="text-sm text-gray-500">{equipment.code_equipement} - {equipment.categorie}</p>
            {equipment.employe_affecte_nom && (
              <p className="text-sm text-blue-600 mt-1">Affecté à: {equipment.employe_affecte_nom}</p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour</label>
              <input
                type="date"
                value={formData.date_retour}
                onChange={(e) => setFormData({ ...formData, date_retour: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">État au retour *</label>
              <select
                value={formData.etat_retour}
                onChange={(e) => setFormData({ ...formData, etat_retour: e.target.value as EtatEquipement })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="BON">Bon état</option>
                <option value="USAGE">Usagé</option>
                <option value="ENDOMMAGE">Endommagé</option>
                <option value="PERDU">Perdu</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Observations sur l'état de l'équipement..."
              />
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
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Confirmer le retour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentManagement;
