import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, DollarSign, Calendar, User } from 'lucide-react';

interface PayrollDeductionsModalProps {
  periodeId: string;
  mois: number;
  annee: number;
  onClose: () => void;
}

interface DisciplinaryDeduction {
  id: string;
  employe_id: string;
  type_action: string;
  date_incident: string;
  description_incident: string;
  montant_deduction: number;
  applique_paie: number;
  nom_complet: string;
  matricule: string;
}

const PayrollDeductionsModal: React.FC<PayrollDeductionsModalProps> = ({
  periodeId,
  mois,
  annee,
  onClose
}) => {
  const [deductions, setDeductions] = useState<DisciplinaryDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeductions();
  }, [periodeId, mois, annee]);

  const loadDeductions = async () => {
    try {
      setLoading(true);
      const data = await window.electronAPI.getPayrollDeductions({
        periode_paie_id: periodeId,
        mois,
        annee
      });
      setDeductions(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des déductions');
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'AVERTISSEMENT_VERBAL': 'Avertissement Verbal',
      'AVERTISSEMENT_ECRIT': 'Avertissement Écrit',
      'SUSPENSION': 'Suspension',
      'LICENCIEMENT': 'Licenciement'
    };
    return labels[type] || type;
  };

  const getActionTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      'AVERTISSEMENT_VERBAL': 'bg-yellow-100 text-yellow-800',
      'AVERTISSEMENT_ECRIT': 'bg-orange-100 text-orange-800',
      'SUSPENSION': 'bg-red-100 text-red-800',
      'LICENCIEMENT': 'bg-red-200 text-red-900'
    };
    return styles[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const totalDeductions = deductions.reduce((sum, d) => sum + d.montant_deduction, 0);
  const appliedDeductions = deductions.filter(d => d.applique_paie === 1);
  const pendingDeductions = deductions.filter(d => d.applique_paie === 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Déductions Disciplinaires</h2>
            <p className="text-sm text-gray-600">
              Période: {monthNames[mois - 1]} {annee}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Total Déductions</p>
                      <p className="text-2xl font-bold text-blue-700">
                        ${totalDeductions.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Appliquées</p>
                      <p className="text-2xl font-bold text-green-700">
                        {appliedDeductions.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-yellow-600">En Attente</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {pendingDeductions.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions List */}
              {deductions.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Détail des Déductions
                  </h3>
                  
                  <div className="space-y-3">
                    {deductions.map((deduction) => (
                      <div
                        key={deduction.id}
                        className={`border rounded-lg p-4 ${
                          deduction.applique_paie === 1
                            ? 'border-green-200 bg-green-50'
                            : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-900">
                                  {deduction.nom_complet}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({deduction.matricule})
                                </span>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getActionTypeBadge(
                                  deduction.type_action
                                )}`}
                              >
                                {getActionTypeLabel(deduction.type_action)}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  deduction.applique_paie === 1
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {deduction.applique_paie === 1 ? 'Appliquée' : 'En Attente'}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2">
                              {deduction.description_incident}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>Incident: {formatDate(deduction.date_incident)}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">
                              -${deduction.montant_deduction.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune déduction disciplinaire pour cette période</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollDeductionsModal;