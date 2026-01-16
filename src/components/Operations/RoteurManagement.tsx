import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, User } from 'lucide-react';
import { EmployeeGASFull, AffectationRoteur } from '../../types';

const RoteurManagement: React.FC = () => {
  const [roteurs, setRoteurs] = useState<EmployeeGASFull[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRoteur, setSelectedRoteur] = useState<EmployeeGASFull | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [emps, sitesData] = await Promise.all([
          window.electronAPI.getEmployeesGAS({ categorie: 'GARDE', poste: 'ROTEUR' }),
          window.electronAPI.getSitesGAS()
        ]);
        setRoteurs(emps || []);
        setSites(sitesData || []);
      }
    } catch (error) {
      console.error('Error loading roteurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoteurs = roteurs.filter(r => 
    !searchTerm || r.nom_complet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'ACTIF': 'bg-green-100 text-green-800',
      'INACTIF': 'bg-gray-100 text-gray-800',
      'SUSPENDU': 'bg-yellow-100 text-yellow-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Rôteurs</h2>
          <p className="text-sm text-gray-500">{filteredRoteurs.length} rôteur(s) disponible(s)</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un rôteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Roteurs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoteurs.map((roteur) => (
          <div key={roteur.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                  {roteur.nom_complet.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{roteur.nom_complet}</h3>
                  <p className="text-sm text-gray-500">{roteur.matricule}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatutBadge(roteur.statut)}`}>
                {roteur.statut}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-500">
              {roteur.telephone && (
                <p>{roteur.telephone}</p>
              )}
              {roteur.site_nom && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Actuellement: {roteur.site_nom}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => { setSelectedRoteur(roteur); setShowAssignForm(true); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Calendar className="w-4 h-4" />
                Affecter
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRoteurs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun rôteur trouvé</p>
          <p className="text-sm mt-1">Les rôteurs sont des employés avec la catégorie "ROTEUR"</p>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignForm && selectedRoteur && (
        <RoteurAssignmentModal
          roteur={selectedRoteur}
          sites={sites}
          onClose={() => { setShowAssignForm(false); setSelectedRoteur(null); }}
          onSave={() => { setShowAssignForm(false); setSelectedRoteur(null); loadData(); }}
        />
      )}
    </div>
  );
};

// Assignment Modal Component
interface RoteurAssignmentModalProps {
  roteur: EmployeeGASFull;
  sites: any[];
  onClose: () => void;
  onSave: () => void;
}

const RoteurAssignmentModal: React.FC<RoteurAssignmentModalProps> = ({ roteur, sites, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    siteId: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    poste: 'JOUR' as 'JOUR' | 'NUIT',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId || !formData.dateDebut || !formData.dateFin) return;

    try {
      setSaving(true);
      // TODO: Implement createRoteurAssignment IPC handler
      console.log('Creating assignment:', { roteurId: roteur.id, ...formData });
      onSave();
    } catch (error) {
      console.error('Error creating assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Affecter {roteur.nom_complet}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <select
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.nom_site}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Début</label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Fin</label>
              <input
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
            <select
              value={formData.poste}
              onChange={(e) => setFormData({ ...formData, poste: e.target.value as 'JOUR' | 'NUIT' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="JOUR">Jour</option>
              <option value="NUIT">Nuit</option>
            </select>
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

          <div className="flex justify-end gap-3 pt-4">
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
              {saving ? 'Enregistrement...' : 'Affecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoteurManagement;
