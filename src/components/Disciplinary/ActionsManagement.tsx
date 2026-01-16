import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Eye, Edit, Send } from 'lucide-react';
import { ActionDisciplinaire, TypeActionDisciplinaire, StatutActionDisciplinaire } from '../../types';
import ActionForm from './ActionForm';
import ActionDetailModal from './ActionDetailModal';

interface ActionsManagementProps {
  filterStatut?: StatutActionDisciplinaire;
}

const ActionsManagement: React.FC<ActionsManagementProps> = ({ filterStatut }) => {
  const [actions, setActions] = useState<ActionDisciplinaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TypeActionDisciplinaire | ''>('');
  const [filterStatus, setFilterStatus] = useState<StatutActionDisciplinaire | ''>(filterStatut || '');
  const [showForm, setShowForm] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionDisciplinaire | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionDisciplinaire | null>(null);

  useEffect(() => {
    loadData();
  }, [filterStatut]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI?.getDisciplinaryActions) {
        const filters: Record<string, string> = {};
        if (filterStatut) filters.statut = filterStatut;
        const data = await window.electronAPI.getDisciplinaryActions(filters);
        setActions(data || []);
      }
    } catch (error) {
      console.error('Error loading disciplinary actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = actions.filter(a => {
    const matchesSearch = !searchTerm || 
      a.employe_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description_incident.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || a.type_action === filterType;
    const matchesStatus = !filterStatus || a.statut === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: TypeActionDisciplinaire) => {
    const styles: Record<TypeActionDisciplinaire, string> = {
      'AVERTISSEMENT_VERBAL': 'bg-yellow-100 text-yellow-800',
      'AVERTISSEMENT_ECRIT': 'bg-orange-100 text-orange-800',
      'SUSPENSION': 'bg-red-100 text-red-800',
      'LICENCIEMENT': 'bg-red-200 text-red-900',
    };
    const labels: Record<TypeActionDisciplinaire, string> = {
      'AVERTISSEMENT_VERBAL': 'Avert. Verbal',
      'AVERTISSEMENT_ECRIT': 'Avert. Écrit',
      'SUSPENSION': 'Suspension',
      'LICENCIEMENT': 'Licenciement',
    };
    return { style: styles[type], label: labels[type] };
  };

  const getStatutBadge = (statut: StatutActionDisciplinaire) => {
    const styles: Record<StatutActionDisciplinaire, string> = {
      'BROUILLON': 'bg-gray-100 text-gray-800',
      'EN_ATTENTE_SIGNATURE': 'bg-yellow-100 text-yellow-800', // Legacy - treated as validation
      'EN_ATTENTE_VALIDATION': 'bg-yellow-100 text-yellow-800',
      'VALIDE': 'bg-green-100 text-green-800',
      'REJETE': 'bg-red-100 text-red-800',
    };
    const labels: Record<StatutActionDisciplinaire, string> = {
      'BROUILLON': 'Brouillon',
      'EN_ATTENTE_SIGNATURE': 'Attente Validation', // Legacy - treated as validation
      'EN_ATTENTE_VALIDATION': 'Attente Validation',
      'VALIDE': 'Validé',
      'REJETE': 'Rejeté',
    };
    return { style: styles[statut], label: labels[statut] };
  };

  const handleSubmitForValidation = async (action: ActionDisciplinaire) => {
    if (!window.electronAPI?.submitDisciplinaryForSignature) return;
    try {
      await window.electronAPI.submitDisciplinaryForSignature(action.id);
      loadData();
    } catch (error) {
      console.error('Error submitting for validation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {filterStatut === 'EN_ATTENTE_VALIDATION' ? 'Actions en Attente de Validation' : 
             'Actions Disciplinaires'}
          </h2>
          <p className="text-sm text-gray-500">{filteredActions.length} action(s)</p>
        </div>
        {!filterStatut && (
          <button
            onClick={() => { setEditingAction(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Action
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par employé ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TypeActionDisciplinaire | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous types</option>
            <option value="AVERTISSEMENT_VERBAL">Avertissement Verbal</option>
            <option value="AVERTISSEMENT_ECRIT">Avertissement Écrit</option>
            <option value="SUSPENSION">Suspension</option>
            <option value="LICENCIEMENT">Licenciement</option>
          </select>

          {!filterStatut && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StatutActionDisciplinaire | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tous statuts</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="EN_ATTENTE_VALIDATION">Attente Validation</option>
              <option value="VALIDE">Validé</option>
              <option value="REJETE">Rejeté</option>
            </select>
          )}
        </div>
      </div>

      {/* Actions Table */}
      {filteredActions.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Incident</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActions.map((action) => {
                const typeBadge = getTypeBadge(action.type_action);
                const statutBadge = getStatutBadge(action.statut);
                return (
                  <tr key={action.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{action.employe_nom}</div>
                      <div className="text-xs text-gray-500">{action.matricule}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeBadge.style}`}>
                        {typeBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(action.date_incident).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {action.description_incident}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {action.impact_financier ? (
                        <span className="text-red-600 font-medium">
                          {action.montant_deduction > 0 && `${action.montant_deduction} USD`}
                          {action.jours_suspension > 0 && ` / ${action.jours_suspension}j`}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statutBadge.style}`}>
                        {statutBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedAction(action)}
                          className="p-1 text-gray-400 hover:text-blue-600" 
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {action.statut === 'BROUILLON' && (
                          <>
                            <button
                              onClick={() => { setEditingAction(action); setShowForm(true); }}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSubmitForValidation(action)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Soumettre pour validation"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune action disciplinaire</p>
          {!filterStatut && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-red-600 hover:text-red-700"
            >
              Créer une action
            </button>
          )}
        </div>
      )}

      {/* Action Form Modal */}
      {showForm && (
        <ActionForm
          action={editingAction}
          onClose={() => { setShowForm(false); setEditingAction(null); }}
          onSave={() => { setShowForm(false); setEditingAction(null); loadData(); }}
        />
      )}

      {/* Action Detail Modal */}
      {selectedAction && (
        <ActionDetailModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default ActionsManagement;
