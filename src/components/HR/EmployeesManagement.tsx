import React, { useState, useEffect } from 'react';
import { Plus, Search, Grid, List, Eye, Edit, Trash2, MapPin, AlertTriangle, RefreshCw, MoreVertical } from 'lucide-react';
import { EmployeeGASFull, CategorieEmploye, StatutEmployeGAS } from '../../types';
import EmployeeForm from './EmployeeForm';
import EmployeeDetailModal from './EmployeeDetailModal';

interface ContractTerminationModal {
  employee: EmployeeGASFull;
  onClose: () => void;
  onConfirm: (reason: string, clearSite: boolean) => void;
  pendingPayments?: number;
  loading?: boolean;
}

const ContractTerminationModal: React.FC<ContractTerminationModal> = ({
  employee,
  onClose,
  onConfirm,
  pendingPayments = 0,
  loading = false
}) => {
  const [reason, setReason] = useState('');
  const [clearSite, setClearSite] = useState(true);
  const [customReason, setCustomReason] = useState('');

  const predefinedReasons = [
    'Fin de contrat',
    'Démission',
    'Licenciement',
    'Abandon de poste',
    'Retraite',
    'Décès',
    'Mutation',
    'Autre'
  ];

  const handleSubmit = () => {
    const finalReason = reason === 'Autre' ? customReason : reason;
    if (!finalReason.trim()) {
      alert('Veuillez spécifier une raison pour la fin de contrat');
      return;
    }
    
    // Special case for death - allow termination even with pending payments
    if (reason === 'Décès') {
      if (!window.confirm('Attention: Cette action terminera définitivement le contrat. En cas de décès, le contrat ne pourra pas être rouvert. Continuer?')) {
        return;
      }
    }
    
    onConfirm(finalReason, clearSite);
  };

  const hasPendingPayments = pendingPayments > 0;
  const isDeathTermination = reason === 'Décès';
  const canTerminate = !hasPendingPayments || isDeathTermination;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Terminer le contrat de {employee.nom_complet}
        </h3>

        {/* Pending Payments Warning */}
        {hasPendingPayments && !isDeathTermination && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Paiements en attente</p>
                <p className="text-sm text-red-700 mt-1">
                  Cet employé a {pendingPayments.toLocaleString('fr-FR')} USD de paiements en attente 
                  (salaires impayés et/ou avances non remboursées). 
                  Vous ne pouvez pas terminer le contrat tant que tous les paiements ne sont pas effectués.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Death Termination Warning */}
        {isDeathTermination && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Terminaison définitive</p>
                <p className="text-sm text-gray-700 mt-1">
                  En cas de décès, le contrat sera terminé définitivement et ne pourra pas être rouvert.
                  {hasPendingPayments && ` Les paiements en attente (${pendingPayments.toLocaleString('fr-FR')} USD) devront être traités séparément.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Assignment Info */}
        {employee.site_nom && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Affectation actuelle</span>
            </div>
            <p className="text-sm text-blue-700">{employee.site_nom}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Termination Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de la fin de contrat *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Sélectionnez une raison</option>
              {predefinedReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Custom Reason Input */}
          {reason === 'Autre' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Précisez la raison
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Décrivez la raison de la fin de contrat..."
                disabled={loading}
              />
            </div>
          )}

          {/* Site Assignment Options */}
          {employee.site_affecte_id && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearSite}
                  onChange={(e) => setClearSite(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Retirer l'affectation du site
                  </div>
                  <p className="text-xs text-gray-500">
                    L'employé ne sera plus affecté à aucun site
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canTerminate || loading || !reason}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Terminer le contrat
          </button>
        </div>
      </div>
    </div>
  );
};

interface ContractReopenModal {
  employee: EmployeeGASFull;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

const ContractReopenModal: React.FC<ContractReopenModal> = ({
  employee,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('Veuillez spécifier une raison pour la réouverture du contrat');
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Rouvrir le contrat de {employee.nom_complet}
        </h3>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-700">
            Le contrat a été terminé le {employee.date_fin_contrat ? new Date(employee.date_fin_contrat).toLocaleDateString('fr-FR') : 'N/A'} 
            {employee.motif_fin && ` pour: ${employee.motif_fin}`}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de la réouverture *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Expliquez pourquoi le contrat est rouvert..."
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reason}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Rouvrir le contrat
          </button>
        </div>
      </div>
    </div>
  );
};

interface ActionDropdownProps {
  employee: EmployeeGASFull;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onTerminate: () => void;
  onReopen: () => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  employee,
  isOpen,
  onToggle,
  onEdit,
  onTerminate,
  onReopen
}) => {
  const canEdit = employee.statut === 'ACTIF';
  
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
              {canEdit ? (
                <button
                  onClick={onEdit}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit className="w-3 h-3" />
                  Modifier
                </button>
              ) : (
                <div className="w-full text-left px-3 py-2 text-xs text-gray-400 cursor-not-allowed flex items-center gap-2">
                  <Edit className="w-3 h-3" />
                  Modifier
                  <span className="ml-auto text-xs">(Désactivé)</span>
                </div>
              )}
              
              {employee.statut === 'ACTIF' && (
                <button
                  onClick={onTerminate}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Terminer
                </button>
              )}
              
              {employee.statut === 'TERMINE' && employee.motif_fin !== 'Décès' && (
                <button
                  onClick={onReopen}
                  className="w-full text-left px-3 py-2 text-xs text-green-600 hover:bg-green-50 flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Rouvrir
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const EmployeesManagement: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<CategorieEmploye | ''>('');
  const [filterStatut, setFilterStatut] = useState<StatutEmployeGAS | ''>('');
  const [filterSite, setFilterSite] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeGASFull | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeGASFull | null>(null);
  
  // New states for contract management
  const [terminatingEmployee, setTerminatingEmployee] = useState<EmployeeGASFull | null>(null);
  const [reopeningEmployee, setReopeningEmployee] = useState<EmployeeGASFull | null>(null);
  const [pendingPayments, setPendingPayments] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [emps, sitesData] = await Promise.all([
          window.electronAPI.getEmployeesGAS(),
          window.electronAPI.getSitesGAS()
        ]);
        setEmployees(emps || []);
        setSites(sitesData || []);
        
        // Load pending payments for all employees
        await loadPendingPayments(emps || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPayments = async (employeeList: EmployeeGASFull[]) => {
    try {
      if (window.electronAPI) {
        const payments: Record<string, number> = {};
        
        // Get pending payments for all employees
        for (const emp of employeeList) {
          try {
            let totalPending = 0;
            
            // Check for unpaid advances
            if (window.electronAPI.getEmployeeAdvances) {
              const advances = await window.electronAPI.getEmployeeAdvances({ 
                employeId: emp.id, 
                statut: 'EN_COURS' 
              });
              totalPending += advances.reduce((sum, advance) => sum + (advance.montant || 0), 0);
            }
            
            // Check for unpaid salaries/payslips
            if (window.electronAPI.getPayslips) {
              try {
                // Get all payroll periods to check for unpaid salaries
                const periods = await window.electronAPI.getPayrollPeriods();
                for (const period of periods) {
                  if (period.statut === 'VALIDEE' || period.statut === 'CALCULEE') {
                    const payslips = await window.electronAPI.getPayslips(period.id);
                    const employeePayslip = payslips.find(p => p.employe_id === emp.id);
                    if (employeePayslip && employeePayslip.statut !== 'PAYE') {
                      totalPending += employeePayslip.salaire_net || 0;
                    }
                  }
                }
              } catch (payrollError) {
                console.warn(`Could not load payroll data for employee ${emp.id}:`, payrollError);
              }
            }
            
            if (totalPending > 0) {
              payments[emp.id] = totalPending;
            }
          } catch (error) {
            console.warn(`Could not load payments for employee ${emp.id}:`, error);
          }
        }
        
        setPendingPayments(payments);
      }
    } catch (error) {
      console.warn('Error loading pending payments:', error);
    }
  };

  const handleTerminateContract = async (reason: string, clearSite: boolean) => {
    if (!terminatingEmployee) return;
    
    setActionLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.updateEmployeeGAS) {
        const updatedEmployee = {
          ...terminatingEmployee,
          statut: 'TERMINE' as StatutEmployeGAS,
          date_fin_contrat: new Date().toISOString(),
          motif_fin: reason,
          site_affecte_id: clearSite ? null : terminatingEmployee.site_affecte_id
        };
        
        await window.electronAPI.updateEmployeeGAS(updatedEmployee);
        setTerminatingEmployee(null);
        loadData();
        alert('Contrat terminé avec succès');
      }
    } catch (error) {
      console.error('Error terminating contract:', error);
      alert('Erreur lors de la terminaison du contrat');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenContract = async (reason: string) => {
    if (!reopeningEmployee) return;
    
    setActionLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.updateEmployeeGAS) {
        const updatedEmployee = {
          ...reopeningEmployee,
          statut: 'ACTIF' as StatutEmployeGAS,
          date_fin_contrat: null,
          motif_fin: `Contrat rouvert: ${reason}`
        };
        
        await window.electronAPI.updateEmployeeGAS(updatedEmployee);
        setReopeningEmployee(null);
        loadData();
        alert('Contrat rouvert avec succès');
      }
    } catch (error) {
      console.error('Error reopening contract:', error);
      alert('Erreur lors de la réouverture du contrat');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    
    setTerminatingEmployee(employee);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm || 
      emp.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = !filterCategorie || emp.categorie === filterCategorie;
    const matchesStatut = !filterStatut || emp.statut === filterStatut;
    const matchesSite = !filterSite || emp.site_affecte_id === filterSite;
    return matchesSearch && matchesCategorie && matchesStatut && matchesSite;
  });

  const getStatutBadge = (statut: StatutEmployeGAS) => {
    const styles: Record<StatutEmployeGAS, string> = {
      'ACTIF': 'bg-green-100 text-green-800',
      'INACTIF': 'bg-gray-100 text-gray-800',
      'SUSPENDU': 'bg-yellow-100 text-yellow-800',
      'TERMINE': 'bg-red-100 text-red-800'
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const getCategorieBadge = (categorie: CategorieEmploye) => {
    const styles: Record<CategorieEmploye, string> = {
      'GARDE': 'bg-blue-100 text-blue-800',
      'ADMINISTRATION': 'bg-green-100 text-green-800'
    };
    return styles[categorie] || 'bg-gray-100 text-gray-800';
  };

  const getPosteBadge = (poste: string) => {
    const styles: Record<string, string> = {
      'GARDE': 'bg-blue-100 text-blue-800',
      'ROTEUR': 'bg-purple-100 text-purple-800',
      'DIRECTEUR_GERANT': 'bg-red-100 text-red-800',
      'ADMINISTRATEUR_GERANT': 'bg-orange-100 text-orange-800',
      'FINANCIER': 'bg-green-100 text-green-800',
      'COMPTABLE': 'bg-teal-100 text-teal-800',
      'CHEF_OPERATIONS': 'bg-indigo-100 text-indigo-800',
      'SUPERVISEUR': 'bg-yellow-100 text-yellow-800',
      'CHAUFFEUR': 'bg-gray-100 text-gray-800'
    };
    return styles[poste] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Employés</h2>
          <p className="text-sm text-gray-500">{filteredEmployees.length} employé(s)</p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouvel Employé
        </button>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value as CategorieEmploye | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes catégories</option>
            <option value="GARDE">Garde</option>
            <option value="ADMINISTRATION">Administration</option>
          </select>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as StatutEmployeGAS | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="TERMINE">Terminé</option>
          </select>

          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.nom_site}</option>
            ))}
          </select>

          <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Employee List */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom Complet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site Affecté</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {emp.matricule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm overflow-hidden">
                        {emp.photo_url ? (
                          <img
                            src={emp.photo_url}
                            alt={`Photo de ${emp.nom_complet}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          emp.nom_complet.charAt(0)
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="ml-3 text-sm text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                      >
                        {emp.nom_complet}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategorieBadge(emp.categorie)}`}>
                      {emp.categorie}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPosteBadge(emp.poste)}`}>
                      {emp.poste.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {emp.site_nom ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {emp.site_nom}
                      </div>
                    ) : (
                      <span className="text-gray-400">Non affecté</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {emp.telephone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutBadge(emp.statut)}`}>
                      {emp.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      <ActionDropdown
                        employee={emp}
                        isOpen={openDropdown === emp.id}
                        onToggle={() => setOpenDropdown(openDropdown === emp.id ? null : emp.id)}
                        onEdit={() => {
                          setEditingEmployee(emp);
                          setShowForm(true);
                          setOpenDropdown(null);
                        }}
                        onTerminate={() => {
                          handleDelete(emp.id);
                          setOpenDropdown(null);
                        }}
                        onReopen={() => {
                          setReopeningEmployee(emp);
                          setOpenDropdown(null);
                        }}
                      />
                      {emp.motif_fin === 'Décès' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded" title="Contrat terminé définitivement">
                          Définitif
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun employé trouvé
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg overflow-hidden">
                    {emp.photo_url ? (
                      <img
                        src={emp.photo_url}
                        alt={`Photo de ${emp.nom_complet}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      emp.nom_complet.charAt(0)
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedEmployee(emp)}
                      className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors text-left"
                    >
                      {emp.nom_complet}
                    </button>
                    <p className="text-sm text-gray-500">{emp.matricule}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutBadge(emp.statut)}`}>
                  {emp.statut}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategorieBadge(emp.categorie)}`}>
                    {emp.categorie}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPosteBadge(emp.poste)}`}>
                    {emp.poste.replace('_', ' ')}
                  </span>
                </div>
                {emp.site_nom && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {emp.site_nom}
                  </div>
                )}
                {emp.telephone && (
                  <p className="text-sm text-gray-500">{emp.telephone}</p>
                )}
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-100">
                <ActionDropdown
                  employee={emp}
                  isOpen={openDropdown === emp.id}
                  onToggle={() => setOpenDropdown(openDropdown === emp.id ? null : emp.id)}
                  onEdit={() => {
                    setEditingEmployee(emp);
                    setShowForm(true);
                    setOpenDropdown(null);
                  }}
                  onTerminate={() => {
                    handleDelete(emp.id);
                    setOpenDropdown(null);
                  }}
                  onReopen={() => {
                    setReopeningEmployee(emp);
                    setOpenDropdown(null);
                  }}
                />
                {emp.motif_fin === 'Décès' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded" title="Contrat terminé définitivement">
                    Définitif
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employee Form Modal */}
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          sites={sites}
          onClose={() => { setShowForm(false); setEditingEmployee(null); }}
          onSave={() => { setShowForm(false); setEditingEmployee(null); loadData(); }}
        />
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onEdit={() => { setEditingEmployee(selectedEmployee); setSelectedEmployee(null); setShowForm(true); }}
          onRefresh={loadData}
        />
      )}

      {/* Contract Termination Modal */}
      {terminatingEmployee && (
        <ContractTerminationModal
          employee={terminatingEmployee}
          onClose={() => setTerminatingEmployee(null)}
          onConfirm={handleTerminateContract}
          pendingPayments={pendingPayments[terminatingEmployee.id] || 0}
          loading={actionLoading}
        />
      )}

      {/* Contract Reopen Modal */}
      {reopeningEmployee && (
        <ContractReopenModal
          employee={reopeningEmployee}
          onClose={() => setReopeningEmployee(null)}
          onConfirm={handleReopenContract}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default EmployeesManagement;
