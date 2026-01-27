import React, { useState, useEffect } from 'react';
import { Search, Users, UserCheck, Filter, Eye, Edit, MapPin, MoreVertical } from 'lucide-react';
import { EmployeeGASFull } from '../../types';
import DeploymentForm from '../HR/DeploymentForm';
import EmployeeDetailModal from '../HR/EmployeeDetailModal';

interface ActionDropdownProps {
  employee: EmployeeGASFull;
  isOpen: boolean;
  onToggle: () => void;
  onDeploy: () => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  employee,
  isOpen,
  onToggle,
  onDeploy
}) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 hover:border-gray-300 transition-colors"
      >
        <MoreVertical className="w-3 h-3" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle}></div>
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={onDeploy}
                className="w-full text-left px-3 py-2 text-xs text-purple-600 hover:bg-purple-50 flex items-center gap-2"
              >
                <UserCheck className="w-3 h-3" />
                Déployer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AgentsManagement: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<'GARDE' | 'ROTEUR' | ''>('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showDeploymentForm, setShowDeploymentForm] = useState(false);
  const [deployingEmployee, setDeployingEmployee] = useState<EmployeeGASFull | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeGASFull | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const data = await window.electronAPI.getEmployeesGAS();
        // Filter only guards (including roteurs)
        const agents = (data || []).filter(
          (emp: EmployeeGASFull) => emp.categorie === 'GARDE'
        );
        setEmployees(agents);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm || 
      emp.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = !filterCategorie || emp.categorie === filterCategorie;
    const matchesStatut = !filterStatut || emp.statut === filterStatut;
    return matchesSearch && matchesCategorie && matchesStatut;
  });

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'ACTIF': 'bg-green-100 text-green-800',
      'INACTIF': 'bg-gray-100 text-gray-800',
      'SUSPENDU': 'bg-yellow-100 text-yellow-800',
      'TERMINE': 'bg-red-100 text-red-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const getCategorieBadge = (categorie: string) => {
    const styles: Record<string, string> = {
      'GARDE': 'bg-blue-100 text-blue-800',
      'ROTEUR': 'bg-purple-100 text-purple-800',
    };
    return styles[categorie] || 'bg-gray-100 text-gray-800';
  };

  const getCategorieLabel = (categorie: string) => {
    const labels: Record<string, string> = {
      'GARDE': 'Gardien',
      'ROTEUR': 'Rôteur',
    };
    return labels[categorie] || categorie;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`;
  };

  const handleDeploy = (employee: EmployeeGASFull) => {
    setDeployingEmployee(employee);
    setShowDeploymentForm(true);
  };

  const stats = {
    total: filteredEmployees.length,
    gardes: filteredEmployees.filter(e => e.categorie === 'GARDE').length,
    roteurs: filteredEmployees.filter(e => e.categorie === 'ROTEUR').length,
    actifs: filteredEmployees.filter(e => e.statut === 'ACTIF').length,
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
          <h2 className="text-xl font-semibold text-gray-900">Agents de Terrain</h2>
          <p className="text-sm text-gray-500">
            {stats.total} agent(s) • {stats.gardes} gardien(s) • {stats.roteurs} rôteur(s)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gardiens</p>
              <p className="text-2xl font-bold text-gray-900">{stats.gardes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rôteurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.roteurs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.actifs}</p>
            </div>
          </div>
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
                placeholder="Rechercher par nom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value as 'GARDE' | 'ROTEUR' | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes catégories</option>
              <option value="GARDE">Gardiens</option>
              <option value="ROTEUR">Rôteurs</option>
            </select>
          </div>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="TERMINE">Terminé</option>
          </select>
        </div>
      </div>

      {/* Agents Table */}
      {filteredEmployees.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Affecté
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rémunération
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                        >
                          {employee.nom_complet}
                        </button>
                        <div className="text-sm text-gray-500">{employee.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategorieBadge(employee.categorie)}`}>
                      {getCategorieLabel(employee.categorie)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.site_nom || 'Non affecté'}
                    </div>
                    {employee.client_nom && (
                      <div className="text-xs text-gray-500">{employee.client_nom}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.mode_remuneration === 'MENSUEL' 
                        ? formatCurrency(employee.salaire_base)
                        : `${formatCurrency(employee.taux_journalier)}/jour`
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.mode_remuneration === 'MENSUEL' ? 'Mensuel' : 'Journalier'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutBadge(employee.statut)}`}>
                      {employee.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.telephone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ActionDropdown
                      employee={employee}
                      isOpen={openDropdown === employee.id}
                      onToggle={() => setOpenDropdown(openDropdown === employee.id ? null : employee.id)}
                      onDeploy={() => {
                        handleDeploy(employee);
                        setOpenDropdown(null);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun agent trouvé</p>
        </div>
      )}

      {/* Deployment Form Modal */}
      {showDeploymentForm && deployingEmployee && (
        <DeploymentForm
          employee={deployingEmployee}
          onClose={() => { setShowDeploymentForm(false); setDeployingEmployee(null); }}
          onSave={() => { setShowDeploymentForm(false); setDeployingEmployee(null); loadData(); }}
        />
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onEdit={() => {
            setShowEditForm(true);
            setSelectedEmployee(null);
          }}
          onRefresh={loadData}
          showPayments={false}
        />
      )}
    </div>
  );
};

export default AgentsManagement;
