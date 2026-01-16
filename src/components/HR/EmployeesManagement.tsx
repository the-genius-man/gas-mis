import React, { useState, useEffect } from 'react';
import { Plus, Search, Grid, List, Eye, Edit, Trash2, MapPin, UserCheck } from 'lucide-react';
import { EmployeeGASFull, CategorieEmploye, StatutEmployeGAS } from '../../types';
import EmployeeForm from './EmployeeForm';
import EmployeeDetailModal from './EmployeeDetailModal';
import DeploymentForm from './DeploymentForm';

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
  const [showDeploymentForm, setShowDeploymentForm] = useState(false);
  const [deployingEmployee, setDeployingEmployee] = useState<EmployeeGASFull | null>(null);

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
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir terminer le contrat de cet employé?')) return;
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteEmployeeGAS(id);
        loadData();
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDeploy = (employee: EmployeeGASFull) => {
    setDeployingEmployee(employee);
    setShowDeploymentForm(true);
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
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                        {emp.nom_complet.charAt(0)}
                      </div>
                      <span className="ml-3 text-sm text-gray-900">{emp.nom_complet}</span>
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
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </button>
                      <button
                        onClick={() => handleDeploy(emp)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 hover:border-purple-300 transition-colors"
                        title="Déployer / Transférer"
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        Déployer
                      </button>
                      <button
                        onClick={() => { setEditingEmployee(emp); setShowForm(true); }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 hover:border-green-300 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Modifier
                      </button>
                      {emp.statut === 'ACTIF' && (
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 hover:border-red-300 transition-colors"
                          title="Terminer contrat"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Terminer
                        </button>
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
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                    {emp.nom_complet.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{emp.nom_complet}</h3>
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

              <div className="flex justify-end gap-1 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setSelectedEmployee(emp)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-colors"
                  title="Voir détails"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Voir
                </button>
                <button
                  onClick={() => handleDeploy(emp)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 hover:border-purple-300 transition-colors"
                  title="Déployer / Transférer"
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  Déployer
                </button>
                <button
                  onClick={() => { setEditingEmployee(emp); setShowForm(true); }}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 hover:border-green-300 transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Modifier
                </button>
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

      {/* Deployment Form Modal */}
      {showDeploymentForm && deployingEmployee && (
        <DeploymentForm
          employee={deployingEmployee}
          onClose={() => { setShowDeploymentForm(false); setDeployingEmployee(null); }}
          onSave={() => { setShowDeploymentForm(false); setDeployingEmployee(null); loadData(); }}
        />
      )}
    </div>
  );
};

export default EmployeesManagement;
