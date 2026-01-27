import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit2, X, Calendar, DollarSign } from 'lucide-react';
import DeductionForm from './DeductionForm';

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

interface EmployeeDeduction {
  id: string;
  employe_id: string;
  employe_nom: string;
  deduction_type_id: string;
  type_nom: string;
  type_code: string;
  source_type: string;
  source_id: string;
  title: string;
  description: string;
  total_amount: number;
  amount_deducted: number;
  amount_remaining: number;
  schedule_type: string;
  installments: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function DeductionsManagement() {
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedDeduction, setSelectedDeduction] = useState<EmployeeDeduction | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadDeductions();
    loadDeductionTypes();
  }, []);

  const loadDeductions = async () => {
    if (!window.electronAPI?.getEmployeeDeductions) return;
    
    setLoading(true);
    try {
      const data = await window.electronAPI.getEmployeeDeductions({});
      setDeductions(data);
    } catch (error) {
      console.error('Error loading deductions:', error);
      alert('Erreur lors du chargement des déductions');
    } finally {
      setLoading(false);
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

  const filteredDeductions = deductions.filter(deduction => {
    const matchesSearch = deduction.employe_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deduction.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || deduction.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || deduction.type_code === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || styles.ACTIVE;
  };

  const getScheduleTypeBadge = (scheduleType: string) => {
    const styles = {
      ONE_TIME: 'bg-purple-100 text-purple-800',
      INSTALLMENTS: 'bg-orange-100 text-orange-800',
      RECURRING: 'bg-blue-100 text-blue-800',
      CUSTOM: 'bg-gray-100 text-gray-800'
    };
    return styles[scheduleType as keyof typeof styles] || styles.ONE_TIME;
  };

  const handleCreateDeduction = async (deductionData: any) => {
    if (!window.electronAPI?.createDeduction) return;
    
    try {
      await window.electronAPI.createDeduction(deductionData);
      loadDeductions(); // Reload the list
      alert('Déduction créée avec succès');
    } catch (error: any) {
      console.error('Error creating deduction:', error);
      throw new Error(error.message || 'Erreur lors de la création de la déduction');
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`;
  };

  const calculateProgress = (deduction: EmployeeDeduction) => {
    if (deduction.total_amount === 0) return 0;
    return Math.round((deduction.amount_deducted / deduction.total_amount) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Déductions</h2>
          <p className="text-gray-600 mt-1">Suivi et gestion des déductions salariales</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Déduction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher employé ou déduction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="SUSPENDED">Suspendu</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tous les types</option>
            {deductionTypes.map(type => (
              <option key={type.id} value={type.code}>{type.nom}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            {filteredDeductions.length} déduction(s)
          </div>
        </div>
      </div>

      {/* Deductions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement...</p>
          </div>
        ) : filteredDeductions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Aucune déduction trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Déduit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Restant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progrès</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Échéancier</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeductions.map((deduction) => {
                  const progress = calculateProgress(deduction);
                  return (
                    <tr key={deduction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {deduction.employe_nom}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {deduction.type_nom}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {deduction.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(deduction.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {formatCurrency(deduction.amount_deducted)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-orange-600">
                        {formatCurrency(deduction.amount_remaining)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-600">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getScheduleTypeBadge(deduction.schedule_type)}`}>
                          {deduction.schedule_type === 'ONE_TIME' ? 'Unique' :
                           deduction.schedule_type === 'INSTALLMENTS' ? `${deduction.installments} fois` :
                           deduction.schedule_type === 'RECURRING' ? 'Récurrent' : 'Personnalisé'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(deduction.status)}`}>
                          {deduction.status === 'ACTIVE' ? 'Actif' :
                           deduction.status === 'SUSPENDED' ? 'Suspendu' :
                           deduction.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedDeduction(deduction)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {deduction.status === 'ACTIVE' && (
                            <button
                              className="text-gray-600 hover:text-gray-800"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deduction Detail Modal */}
      {selectedDeduction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails de la Déduction
                </h3>
                <button
                  onClick={() => setSelectedDeduction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employé</label>
                  <p className="text-sm text-gray-900">{selectedDeduction.employe_nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-sm text-gray-900">{selectedDeduction.type_nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <p className="text-sm text-gray-900">{selectedDeduction.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(selectedDeduction.status)}`}>
                    {selectedDeduction.status === 'ACTIVE' ? 'Actif' :
                     selectedDeduction.status === 'SUSPENDED' ? 'Suspendu' :
                     selectedDeduction.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                  </span>
                </div>
              </div>

              {selectedDeduction.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-600">{selectedDeduction.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant Total</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedDeduction.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant Déduit</label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedDeduction.amount_deducted)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant Restant</label>
                  <p className="text-lg font-semibold text-orange-600">{formatCurrency(selectedDeduction.amount_remaining)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'Échéancier</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getScheduleTypeBadge(selectedDeduction.schedule_type)}`}>
                    {selectedDeduction.schedule_type === 'ONE_TIME' ? 'Paiement unique' :
                     selectedDeduction.schedule_type === 'INSTALLMENTS' ? `${selectedDeduction.installments} versements` :
                     selectedDeduction.schedule_type === 'RECURRING' ? 'Récurrent' : 'Personnalisé'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de Création</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedDeduction.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progrès</span>
                  <span className="text-sm text-gray-600">{calculateProgress(selectedDeduction)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(selectedDeduction)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedDeduction(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
                {selectedDeduction.status === 'ACTIVE' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Modifier
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Deduction Form */}
      {showCreateForm && (
        <DeductionForm
          onClose={() => setShowCreateForm(false)}
          onSave={handleCreateDeduction}
        />
      )}
    </div>
  );
}