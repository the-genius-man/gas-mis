import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Shield, Users, Search } from 'lucide-react';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { ROLE_INFO, hasPermission } from '../../utils/permissions';
import PermissionGuard from '../common/PermissionGuard';
import Pagination from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface User {
  id: string;
  nom_utilisateur: string;
  nom_complet: string;
  email?: string;
  role: UserRole;
  statut: 'ACTIF' | 'SUSPENDU';
  derniere_connexion?: string;
  cree_le?: string;
}

const UserManagement: React.FC = () => {
  const { utilisateur } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIF' | 'SUSPENDU'>('ALL');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nom_utilisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'ALL' || user.statut === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const userPagination = usePagination({ 
    data: filteredUsers, 
    itemsPerPage: ITEMS_PER_PAGE 
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const data = await window.electronAPI.getUsers();
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === utilisateur?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.nom_complet}" ?`)) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteUser(user.id);
          await loadUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Erreur lors de la suppression de l\'utilisateur.');
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === utilisateur?.id) {
      alert('Vous ne pouvez pas modifier le statut de votre propre compte.');
      return;
    }

    try {
      const newStatus = user.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
      if (window.electronAPI) {
        await window.electronAPI.updateUserStatus(user.id, newStatus);
        await loadUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="users.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Gestion des Utilisateurs</h2>
          </div>
          <PermissionGuard permission="users.create">
            <button
              onClick={handleCreateUser}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvel Utilisateur
            </button>
          </PermissionGuard>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tous les rôles</option>
              {Object.entries(ROLE_INFO).map(([role, info]) => (
                <option key={role} value={role}>{info.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ACTIF' | 'SUSPENDU')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="SUSPENDU">Suspendu</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-500">
              {filteredUsers.length} utilisateur(s) trouvé(s)
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière Connexion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userPagination.paginatedData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.nom_complet.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.nom_complet}</div>
                          <div className="text-sm text-gray-500">@{user.nom_utilisateur}</div>
                          {user.email && (
                            <div className="text-xs text-gray-400">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_INFO[user.role].color}`}>
                        <Shield className="w-3 h-3" />
                        {ROLE_INFO[user.role].name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.statut === 'ACTIF' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.derniere_connexion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.cree_le)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <PermissionGuard permission="users.edit">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                        
                        <PermissionGuard permission="users.edit">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1 rounded ${
                              user.statut === 'ACTIF' 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.statut === 'ACTIF' ? 'Suspendre' : 'Activer'}
                            disabled={user.id === utilisateur?.id}
                          >
                            {user.statut === 'ACTIF' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </PermissionGuard>

                        <PermissionGuard permission="users.delete">
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                            disabled={user.id === utilisateur?.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Pagination
            currentPage={userPagination.currentPage}
            totalPages={userPagination.totalPages}
            onPageChange={userPagination.setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredUsers.length}
          />
        </div>

        {/* User Form Modal */}
        {showUserForm && (
          <UserFormModal
            user={editingUser}
            onClose={() => {
              setShowUserForm(false);
              setEditingUser(null);
            }}
            onSave={() => {
              setShowUserForm(false);
              setEditingUser(null);
              loadUsers();
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

// User Form Modal Component
interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom_utilisateur: user?.nom_utilisateur || '',
    nom_complet: user?.nom_complet || '',
    email: user?.email || '',
    role: user?.role || 'ASSISTANT_OPERATIONS_MANAGER' as UserRole,
    statut: user?.statut || 'ACTIF' as 'ACTIF' | 'SUSPENDU',
    mot_de_passe: '',
    confirmer_mot_de_passe: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.nom_utilisateur.trim() || !formData.nom_complet.trim()) {
      setError('Le nom d\'utilisateur et le nom complet sont requis.');
      return;
    }

    if (!user && (!formData.mot_de_passe || formData.mot_de_passe.length < 6)) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (formData.mot_de_passe && formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      if (window.electronAPI) {
        if (user) {
          // Update existing user
          await window.electronAPI.updateUser({
            id: user.id,
            nom_utilisateur: formData.nom_utilisateur,
            nom_complet: formData.nom_complet,
            email: formData.email || undefined,
            role: formData.role,
            statut: formData.statut,
            ...(formData.mot_de_passe && { mot_de_passe: formData.mot_de_passe })
          });
        } else {
          // Create new user
          await window.electronAPI.createUser({
            nom_utilisateur: formData.nom_utilisateur,
            nom_complet: formData.nom_complet,
            email: formData.email || undefined,
            role: formData.role,
            statut: formData.statut,
            mot_de_passe: formData.mot_de_passe
          });
        }
        onSave();
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {user ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nom_utilisateur}
              onChange={(e) => setFormData({ ...formData, nom_utilisateur: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nom_complet}
              onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {Object.entries(ROLE_INFO).map(([role, info]) => (
                <option key={role} value={role}>{info.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {ROLE_INFO[formData.role].description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'ACTIF' | 'SUSPENDU' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="ACTIF">Actif</option>
              <option value="SUSPENDU">Suspendu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'} {!user && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={formData.mot_de_passe}
              onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={!user}
              minLength={6}
            />
          </div>

          {formData.mot_de_passe && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmer_mot_de_passe}
                onChange={(e) => setFormData({ ...formData, confirmer_mot_de_passe: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : (user ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;