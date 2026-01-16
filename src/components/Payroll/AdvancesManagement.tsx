import { useState, useEffect } from 'react';
import { Plus, DollarSign, CheckCircle, XCircle, Eye } from 'lucide-react';
import { AvanceEmploye, EmployeeGASFull } from '../../types';
import AdvanceForm from './AdvanceForm';

export default function AdvancesManagement() {
  const [advances, setAdvances] = useState<AvanceEmploye[]>([]);
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<AvanceEmploye | null>(null);
  const [filters, setFilters] = useState({
    employeId: '',
    statut: ''
  });

  useEffect(() => {
    loadAdvances();
    loadEmployees();
  }, [filters]);

  const loadAdvances = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const data = await window.electronAPI.getEmployeeAdvances(filters);
      setAdvances(data);
    } catch (error) {
      console.error('Error loading advances:', error);
      alert('Erreur lors du chargement des avances');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!window.electronAPI) return;
    
    try {
      const data = await window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' });
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleAdvanceCreated = () => {
    setShowForm(false);
    loadAdvances();
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      EN_COURS: 'bg-blue-100 text-blue-800',
      REMBOURSE: 'bg-green-100 text-green-800',
      ANNULE: 'bg-red-100 text-red-800'
    };
    return styles[statut as keyof typeof styles] || styles.EN_COURS;
  };

  const getStatutIcon = (statut: string) => {
    if (statut === 'REMBOURSE') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (statut === 'ANNULE') return <XCircle className="w-4 h-4 text-red-600" />;
    return <DollarSign className="w-4 h-4 text-blue-600" />;
  };

  if (showForm) {
    return (
      <AdvanceForm
        employees={employees}
        onClose={() => setShowForm(false)}
        onSuccess={handleAdvanceCreated}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Avances</h2>
          <p className="text-gray-600 mt-1">Suivi des avances et remboursements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Avance
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employé
            </label>
            <select
              value={filters.employeId}
              onChange={(e) => setFilters({ ...filters, employeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les employés</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.matricule} - {emp.nom_complet}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="EN_COURS">En Cours</option>
              <option value="REMBOURSE">Remboursé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Avances</p>
              <p className="text-2xl font-bold text-gray-900">{advances.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En Cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {advances.filter(a => a.statut === 'EN_COURS').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Remboursées</p>
              <p className="text-2xl font-bold text-gray-900">
                {advances.filter(a => a.statut === 'REMBOURSE').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${advances.reduce((sum, a) => sum + a.montant_total, 0).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advances List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remboursé</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Restant</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mensualités</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : advances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Aucune avance trouvée
                  </td>
                </tr>
              ) : (
                advances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{advance.matricule}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{advance.employe_nom}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(advance.date_avance).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ${advance.montant_total.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      ${advance.montant_rembourse.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">
                      ${advance.montant_restant.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {advance.nombre_mensualites} × ${advance.mensualite_montant.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatutIcon(advance.statut)}
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatutBadge(advance.statut)}`}>
                          {advance.statut.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {advances.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                    ${advances.reduce((sum, a) => sum + a.montant_total, 0).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-green-600">
                    ${advances.reduce((sum, a) => sum + a.montant_rembourse, 0).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-orange-600">
                    ${advances.reduce((sum, a) => sum + a.montant_restant, 0).toLocaleString('fr-FR')}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
