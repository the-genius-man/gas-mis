import { useState, useEffect } from 'react';
import { DollarSign, Calendar, Eye, AlertCircle } from 'lucide-react';

interface EmployeeDeduction {
  id: string;
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

interface EmployeeDeductionsViewProps {
  employeeId: string;
  employeeName: string;
}

export default function EmployeeDeductionsView({ employeeId, employeeName }: EmployeeDeductionsViewProps) {
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<EmployeeDeduction | null>(null);

  useEffect(() => {
    if (employeeId) {
      loadEmployeeDeductions();
    }
  }, [employeeId]);

  const loadEmployeeDeductions = async () => {
    if (!window.electronAPI?.getEmployeeDeductions) return;
    
    setLoading(true);
    try {
      const data = await window.electronAPI.getEmployeeDeductions({ employe_id: employeeId });
      setDeductions(data);
    } catch (error) {
      console.error('Error loading employee deductions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || styles.ACTIVE;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`;
  };

  const calculateProgress = (deduction: EmployeeDeduction) => {
    if (deduction.total_amount === 0) return 0;
    return Math.round((deduction.amount_deducted / deduction.total_amount) * 100);
  };

  const getTotalActiveDeductions = () => {
    return deductions
      .filter(d => d.status === 'ACTIVE')
      .reduce((sum, d) => sum + d.amount_remaining, 0);
  };

  const getMonthlyDeductionEstimate = () => {
    // Estimate monthly deductions based on active installment plans
    return deductions
      .filter(d => d.status === 'ACTIVE' && d.schedule_type === 'INSTALLMENTS')
      .reduce((sum, d) => {
        const remainingInstallments = Math.ceil(d.amount_remaining / (d.total_amount / d.installments));
        return sum + (d.amount_remaining / Math.max(remainingInstallments, 1));
      }, 0);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Chargement des déductions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Déductions Salariales</h3>
          <p className="text-gray-600">{employeeName}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Restant</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(getTotalActiveDeductions())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Estimation Mensuelle</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(getMonthlyDeductionEstimate())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Déductions Actives</p>
              <p className="text-lg font-semibold text-gray-900">
                {deductions.filter(d => d.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deductions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {deductions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Aucune déduction pour cet employé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Déduit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Restant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progrès</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deductions.map((deduction) => {
                  const progress = calculateProgress(deduction);
                  return (
                    <tr key={deduction.id} className="hover:bg-gray-50">
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
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(deduction.status)}`}>
                          {deduction.status === 'ACTIVE' ? 'Actif' :
                           deduction.status === 'SUSPENDED' ? 'Suspendu' :
                           deduction.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedDeduction(deduction)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de la Déduction
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-sm text-gray-900">{selectedDeduction.type_nom}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <p className="text-sm text-gray-900">{selectedDeduction.title}</p>
              </div>

              {selectedDeduction.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-600">{selectedDeduction.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant Total</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedDeduction.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant Restant</label>
                  <p className="text-lg font-semibold text-orange-600">{formatCurrency(selectedDeduction.amount_remaining)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Échéancier</label>
                <p className="text-sm text-gray-900">
                  {selectedDeduction.schedule_type === 'ONE_TIME' ? 'Paiement unique' :
                   selectedDeduction.schedule_type === 'INSTALLMENTS' ? `${selectedDeduction.installments} versements` :
                   selectedDeduction.schedule_type === 'RECURRING' ? 'Récurrent' : 'Personnalisé'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de Création</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedDeduction.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedDeduction(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}