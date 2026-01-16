import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { EmployeeGASFull, CategorieEmploye, PosteEmploye, ModeRemunerationGAS, EtatCivil, Genre } from '../../types';

interface EmployeeFormProps {
  employee: EmployeeGASFull | null;
  sites: any[];
  onClose: () => void;
  onSave: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, sites, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom_complet: employee?.nom_complet || '',
    date_naissance: employee?.date_naissance || '',
    genre: employee?.genre || '' as Genre | '',
    etat_civil: employee?.etat_civil || '' as EtatCivil | '',
    numero_id_national: employee?.numero_id_national || '',
    telephone: employee?.telephone || '',
    email: employee?.email || '',
    adresse: employee?.adresse || '',
    date_embauche: employee?.date_embauche || new Date().toISOString().split('T')[0],
    categorie: employee?.categorie || 'GARDE' as CategorieEmploye,
    poste: employee?.poste || 'GARDE' as PosteEmploye,
    site_affecte_id: employee?.site_affecte_id || '',
    mode_remuneration: employee?.mode_remuneration || 'MENSUEL' as ModeRemunerationGAS,
    salaire_base: employee?.salaire_base || 0,
    taux_journalier: employee?.taux_journalier || 0,
    banque_nom: employee?.banque_nom || '',
    banque_compte: employee?.banque_compte || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nom_complet.trim()) {
      setError('Le nom complet est requis');
      return;
    }
    if (!formData.date_embauche) {
      setError('La date d\'embauche est requise');
      return;
    }

    try {
      setSaving(true);
      if (window.electronAPI) {
        if (employee) {
          await window.electronAPI.updateEmployeeGAS({
            ...formData,
            id: employee.id,
            site_affecte_id: formData.site_affecte_id || null,
          });
        } else {
          const id = 'emp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          await window.electronAPI.createEmployeeGAS({
            ...formData,
            id,
            site_affecte_id: formData.site_affecte_id || null,
          });
        }
        onSave();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {employee ? 'Modifier Employé' : 'Nouvel Employé'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Informations Personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom Complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nom_complet}
                    onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value as Genre })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">État Civil</label>
                  <select
                    value={formData.etat_civil}
                    onChange={(e) => setFormData({ ...formData, etat_civil: e.target.value as EtatCivil })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="CELIBATAIRE">Célibataire</option>
                    <option value="MARIE">Marié(e)</option>
                    <option value="DIVORCE">Divorcé(e)</option>
                    <option value="VEUF">Veuf/Veuve</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° ID National</label>
                  <input
                    type="text"
                    value={formData.numero_id_national}
                    onChange={(e) => setFormData({ ...formData, numero_id_national: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Informations d'Emploi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'Embauche <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date_embauche}
                    onChange={(e) => setFormData({ ...formData, date_embauche: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={formData.categorie}
                    onChange={(e) => {
                      const newCategorie = e.target.value as CategorieEmploye;
                      setFormData({ 
                        ...formData, 
                        categorie: newCategorie,
                        poste: newCategorie === 'GARDE' ? 'GARDE' : 'DIRECTEUR_GERANT' // Reset poste based on categorie
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="GARDE">Garde</option>
                    <option value="ADMINISTRATION">Administration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                  <select
                    value={formData.poste}
                    onChange={(e) => setFormData({ ...formData, poste: e.target.value as PosteEmploye })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {formData.categorie === 'GARDE' ? (
                      <>
                        <option value="GARDE">Garde</option>
                        <option value="ROTEUR">Rôteur</option>
                      </>
                    ) : (
                      <>
                        <option value="DIRECTEUR_GERANT">Directeur Gérant</option>
                        <option value="ADMINISTRATEUR_GERANT">Administrateur Gérant</option>
                        <option value="FINANCIER">Financier</option>
                        <option value="COMPTABLE">Comptable</option>
                        <option value="CHEF_OPERATIONS">Chef des Opérations</option>
                        <option value="SUPERVISEUR">Superviseur</option>
                        <option value="CHAUFFEUR">Chauffeur</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Affecté</label>
                  <select
                    value={formData.site_affecte_id}
                    onChange={(e) => setFormData({ ...formData, site_affecte_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Non affecté</option>
                    {sites.filter(s => s.est_actif).map(site => (
                      <option key={site.id} value={site.id}>{site.nom_site}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payroll Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Informations de Paie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Rémunération</label>
                  <select
                    value={formData.mode_remuneration}
                    onChange={(e) => setFormData({ ...formData, mode_remuneration: e.target.value as ModeRemunerationGAS })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MENSUEL">Mensuel</option>
                    <option value="JOURNALIER">Journalier</option>
                  </select>
                </div>

                {formData.mode_remuneration === 'MENSUEL' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salaire de Base (USD)</label>
                    <input
                      type="number"
                      value={formData.salaire_base}
                      onChange={(e) => setFormData({ ...formData, salaire_base: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taux Journalier (USD)</label>
                    <input
                      type="number"
                      value={formData.taux_journalier}
                      onChange={(e) => setFormData({ ...formData, taux_journalier: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la Banque</label>
                  <input
                    type="text"
                    value={formData.banque_nom}
                    onChange={(e) => setFormData({ ...formData, banque_nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° de Compte</label>
                  <input
                    type="text"
                    value={formData.banque_compte}
                    onChange={(e) => setFormData({ ...formData, banque_compte: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
