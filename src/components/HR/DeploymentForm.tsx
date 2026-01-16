import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, User, ArrowRight, AlertCircle } from 'lucide-react';
import { EmployeeGASFull, HistoriqueDeployement } from '../../types';

interface DeploymentFormProps {
  employee?: EmployeeGASFull | null;
  siteId?: string | null;
  onClose: () => void;
  onSave: () => void;
}

type MotifAffectation = 'EMBAUCHE' | 'TRANSFERT' | 'REMPLACEMENT' | 'ROTATION' | 'DEMANDE_EMPLOYE' | 'DEMANDE_CLIENT' | 'DISCIPLINAIRE' | 'FIN_CONTRAT_SITE';
type PosteType = 'JOUR' | 'NUIT' | 'MIXTE';

const DeploymentForm: React.FC<DeploymentFormProps> = ({ employee, siteId, onClose, onSave }) => {
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [siteCapacities, setSiteCapacities] = useState<Record<string, { current: number; total: number }>>({});
  const [currentDeployment, setCurrentDeployment] = useState<HistoriqueDeployement | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    employeId: employee?.id || '',
    siteId: siteId || '',
    poste: 'JOUR' as PosteType,
    dateDebut: new Date().toISOString().split('T')[0],
    motifAffectation: 'TRANSFERT' as MotifAffectation,
    notes: '',
    endCurrentDeployment: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.employeId) {
      loadCurrentDeployment(formData.employeId);
    } else {
      setCurrentDeployment(null);
    }
  }, [formData.employeId]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      if (window.electronAPI) {
        const [emps, sitesData] = await Promise.all([
          window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' }),
          window.electronAPI.getSitesGAS()
        ]);
        setEmployees(emps || []);
        const activeSites = (sitesData || []).filter((s: any) => s.est_actif);
        setSites(activeSites);
        
        // Load capacity for each site
        await loadSiteCapacities(activeSites);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoadingData(false);
    }
  };

  const loadSiteCapacities = async (sitesData: any[]) => {
    try {
      if (window.electronAPI) {
        const capacities: Record<string, { current: number; total: number }> = {};
        
        for (const site of sitesData) {
          const deployments = await window.electronAPI.getSiteDeploymentHistory(site.id);
          const activeDeployments = deployments?.filter((d: any) => d.est_actif) || [];
          capacities[site.id] = {
            current: activeDeployments.length,
            total: site.effectif_jour_requis + site.effectif_nuit_requis
          };
        }
        
        setSiteCapacities(capacities);
      }
    } catch (err) {
      console.error('Error loading site capacities:', err);
    }
  };

  const loadCurrentDeployment = async (employeId: string) => {
    try {
      if (window.electronAPI) {
        const deployment = await window.electronAPI.getCurrentDeployment(employeId);
        setCurrentDeployment(deployment);
      }
    } catch (err) {
      console.error('Error loading current deployment:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.employeId) {
      setError('Veuillez sélectionner un employé');
      return;
    }
    if (!formData.siteId) {
      setError('Veuillez sélectionner un site');
      return;
    }
    if (!formData.dateDebut) {
      setError('Veuillez sélectionner une date de début');
      return;
    }

    // Check if trying to deploy to the same site
    if (currentDeployment && currentDeployment.site_id === formData.siteId) {
      setError('L\'employé est déjà affecté à ce site');
      return;
    }

    try {
      setLoading(true);
      if (window.electronAPI) {
        await window.electronAPI.createDeployment({
          id: crypto.randomUUID(),
          employe_id: formData.employeId,
          site_id: formData.siteId,
          poste: formData.poste,
          date_debut: formData.dateDebut,
          motif_affectation: formData.motifAffectation,
          notes: formData.notes
        });
        onSave();
      }
    } catch (err: any) {
      console.error('Error creating deployment:', err);
      setError(err.message || 'Erreur lors de la création du déploiement');
    } finally {
      setLoading(false);
    }
  };

  const getMotifLabel = (motif: MotifAffectation) => {
    const labels: Record<MotifAffectation, string> = {
      'EMBAUCHE': 'Nouvelle embauche',
      'TRANSFERT': 'Transfert',
      'REMPLACEMENT': 'Remplacement',
      'ROTATION': 'Rotation',
      'DEMANDE_EMPLOYE': 'Demande de l\'employé',
      'DEMANDE_CLIENT': 'Demande du client',
      'DISCIPLINAIRE': 'Mesure disciplinaire',
      'FIN_CONTRAT_SITE': 'Fin de contrat site'
    };
    return labels[motif];
  };

  const selectedEmployee = employees.find(e => e.id === formData.employeId);
  const selectedSite = sites.find(s => s.id === formData.siteId);
  const currentSite = currentDeployment ? sites.find(s => s.id === currentDeployment.site_id) : null;

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {employee ? 'Transférer l\'employé' : 'Nouvelle Affectation'}
              </h2>
              <p className="text-sm text-gray-500">
                {employee ? `Transférer ${employee.nom_complet} vers un nouveau site` : 'Affecter un employé à un site'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Employee Selection */}
            {!employee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employé <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.employeId}
                  onChange={(e) => setFormData({ ...formData, employeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.matricule} - {emp.nom_complet} ({emp.categorie})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Current Deployment Info */}
            {currentDeployment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Affectation actuelle</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {selectedEmployee?.nom_complet || 'L\'employé'} est actuellement affecté à{' '}
                      <strong>{currentSite?.nom_site || 'un site'}</strong> depuis le{' '}
                      {new Date(currentDeployment.date_debut).toLocaleDateString('fr-FR')}.
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Cette affectation sera automatiquement clôturée lors du transfert.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Visualization */}
            {currentDeployment && formData.siteId && (
              <div className="flex items-center justify-center gap-4 py-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{currentSite?.nom_site || 'Site actuel'}</p>
                  <p className="text-xs text-gray-500">Actuel</p>
                </div>
                <ArrowRight className="w-8 h-8 text-blue-500" />
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-blue-700">{selectedSite?.nom_site || 'Nouveau site'}</p>
                  <p className="text-xs text-blue-500">Destination</p>
                </div>
              </div>
            )}

            {/* Site Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site de destination <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Sélectionner un site</option>
                {sites.map((site) => {
                  const capacity = siteCapacities[site.id];
                  const isFull = capacity && capacity.current >= capacity.total;
                  const isCurrent = currentDeployment?.site_id === site.id;
                  
                  return (
                    <option 
                      key={site.id} 
                      value={site.id}
                      disabled={isCurrent || isFull}
                    >
                      {site.nom_site}
                      {capacity ? ` (${capacity.current}/${capacity.total})` : ''}
                      {isCurrent ? ' (actuel)' : ''}
                      {isFull && !isCurrent ? ' (complet)' : ''}
                    </option>
                  );
                })}
              </select>
              {formData.siteId && siteCapacities[formData.siteId] && (
                <p className="mt-1 text-sm text-gray-600">
                  Capacité: {siteCapacities[formData.siteId].current}/{siteCapacities[formData.siteId].total} gardes affectés
                </p>
              )}
            </div>

            {/* Two columns for Poste and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poste <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value as PosteType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="JOUR">Jour</option>
                  <option value="NUIT">Nuit</option>
                  <option value="MIXTE">Mixte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Motif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif de l'affectation <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.motifAffectation}
                onChange={(e) => setFormData({ ...formData, motifAffectation: e.target.value as MotifAffectation })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EMBAUCHE">{getMotifLabel('EMBAUCHE')}</option>
                <option value="TRANSFERT">{getMotifLabel('TRANSFERT')}</option>
                <option value="REMPLACEMENT">{getMotifLabel('REMPLACEMENT')}</option>
                <option value="ROTATION">{getMotifLabel('ROTATION')}</option>
                <option value="DEMANDE_EMPLOYE">{getMotifLabel('DEMANDE_EMPLOYE')}</option>
                <option value="DEMANDE_CLIENT">{getMotifLabel('DEMANDE_CLIENT')}</option>
                <option value="DISCIPLINAIRE">{getMotifLabel('DISCIPLINAIRE')}</option>
                <option value="FIN_CONTRAT_SITE">{getMotifLabel('FIN_CONTRAT_SITE')}</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Notes additionnelles sur ce déploiement..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !formData.employeId || !formData.siteId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  {currentDeployment ? 'Transférer' : 'Affecter'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeploymentForm;
