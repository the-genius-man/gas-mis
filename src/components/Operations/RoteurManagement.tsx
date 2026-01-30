import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Plus, Clock, AlertTriangle, Users, Edit, Trash2 } from 'lucide-react';
import { EmployeeGASFull, AffectationRoteur } from '../../types';

interface SiteWithGuardCount {
  id: string;
  nom_site: string;
  client_nom?: string;
  guard_count: number;
  day_guards: number;
  night_guards: number;
  needs_roteur: boolean;
  current_roteur?: AffectationRoteur;
}

const RoteurManagement: React.FC = () => {
  const [roteurs, setRoteurs] = useState<EmployeeGASFull[]>([]);
  const [sites, setSites] = useState<SiteWithGuardCount[]>([]);
  const [assignments, setAssignments] = useState<AffectationRoteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRoteur, setSelectedRoteur] = useState<EmployeeGASFull | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<AffectationRoteur | null>(null);
  const [activeTab, setActiveTab] = useState<'roteurs' | 'assignments' | 'coverage' | 'calendar'>('roteurs');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        // Debug: Check the data
        if (window.electronAPI.debugRoteurSites) {
          const debugResult = await window.electronAPI.debugRoteurSites();
          console.log('🔍 DEBUG: Roteur sites data:', debugResult);
        }
        
        const [emps, sitesData, assignmentsData, coverageGaps] = await Promise.all([
          window.electronAPI.getRoteurs?.() || window.electronAPI.getEmployeesGAS({ categorie: 'GARDE', poste: 'ROTEUR' }),
          window.electronAPI.getSitesEligibleForRoteur?.() || window.electronAPI.getSitesGAS(),
          window.electronAPI.getRoteurAssignments?.() || Promise.resolve([]),
          window.electronAPI.getSiteCoverageGaps?.() || Promise.resolve([])
        ]);
        
        console.log('🔍 Sites data from getSitesEligibleForRoteur:', sitesData);
        
        setRoteurs(emps || []);
        setAssignments(assignmentsData || []);
        
        // Convert coverage gaps to sites with guard count format
        const sitesWithCoverage: SiteWithGuardCount[] = (sitesData || []).map((site: any) => {
          // Find current active roteur assignment for this site
          const currentRoteurAssignment = (assignmentsData || []).find((assignment: any) => {
            // Check if this assignment covers this site in its weekly assignments
            if (assignment.weekly_assignments && assignment.weekly_assignments.length > 0) {
              return assignment.weekly_assignments.some((wa: any) => wa.site_id === site.id) &&
                     (assignment.statut === 'EN_COURS' || assignment.statut === 'PLANIFIE');
            }
            // Fallback for old-style assignments
            return assignment.site_id === site.id && 
                   (assignment.statut === 'EN_COURS' || assignment.statut === 'PLANIFIE');
          });
          
          // A site needs roteur if it has exactly 1 guard AND no active roteur assignment
          const needsRoteur = site.guard_count === 1 && !currentRoteurAssignment;
          
          return {
            id: site.id,
            nom_site: site.nom_site,
            client_nom: site.client_nom,
            guard_count: site.guard_count || 0,
            day_guards: site.guard_count || 0,
            night_guards: 0,
            needs_roteur: needsRoteur,
            current_roteur: currentRoteurAssignment
          };
        });
        
        console.log('🔍 Processed sites with coverage:', sitesWithCoverage);
        setSites(sitesWithCoverage);
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

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette affectation?')) return;
    
    try {
      if (window.electronAPI?.updateRoteurAssignment) {
        await window.electronAPI.updateRoteurAssignment({
          id: assignmentId,
          statut: 'ANNULE'
        });
        loadData();
      }
    } catch (error) {
      console.error('Error canceling assignment:', error);
      alert('Erreur lors de l\'annulation de l\'affectation');
    }
  };

  const handleEditAssignment = (assignment: AffectationRoteur) => {
    setEditingAssignment(assignment);
    setShowAssignForm(true);
  };

  const handleConvertToGuard = async (roteur: EmployeeGASFull) => {
    const activeCount = activeAssignments.filter(a => a.roteur_id === roteur.id).length;
    
    const confirmMessage = activeCount > 0 
      ? `Êtes-vous sûr de vouloir convertir ${roteur.nom_complet} en garde normal?\n\nCela annulera ${activeCount} affectation(s) active(s) et laissera ces sites sans couverture de rôteur.`
      : `Êtes-vous sûr de vouloir convertir ${roteur.nom_complet} en garde normal?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      if (window.electronAPI?.convertRoteurToGuard) {
        const result = await window.electronAPI.convertRoteurToGuard({
          roteurId: roteur.id,
          reason: 'Conversion manuelle via interface utilisateur'
        });
        
        if (result.success) {
          const message = `${roteur.nom_complet} a été converti en garde normal avec succès!\n\n` +
                         `Résultats:\n` +
                         `• Employé mis à jour: ${result.employeeUpdated || 0}\n` +
                         `• Affectations annulées: ${result.assignmentsCancelled || 0}\n` +
                         `• Sites affectés: ${result.sitesAffected || 0}`;
          
          if (result.affectedSites && result.affectedSites.length > 0) {
            const sitesList = result.affectedSites.map(s => `  - ${s.nom_site} (${s.client_nom}) - ${s.jour_semaine}`).join('\n');
            alert(message + `\n\nSites libérés:\n${sitesList}`);
          } else {
            alert(message);
          }
          
          loadData(); // Refresh the data
        }
      } else {
        alert('Cette fonctionnalité nécessite le mode Electron');
      }
    } catch (error) {
      console.error('Error converting roteur to guard:', error);
      alert('Erreur lors de la conversion: ' + error.message);
    }
  };

  const activeAssignments = assignments.filter(a => a.statut === 'EN_COURS' || a.statut === 'PLANIFIE');
  const sitesNeedingRoteur = sites.filter(s => s.needs_roteur && !s.current_roteur);
  const availableRoteurs = roteurs.filter(r => 
    r.statut === 'ACTIF' && 
    !activeAssignments.some(a => a.roteur_id === r.id)
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
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Rôteurs</h2>
          <p className="text-sm text-gray-500">
            {availableRoteurs.length} rôteur(s) disponible(s) • {activeAssignments.length} affectation(s) active(s) • {sitesNeedingRoteur.length} site(s) nécessitant un rôteur
          </p>
        </div>
        <button
          onClick={() => { setSelectedRoteur(null); setEditingAssignment(null); setShowAssignForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Affectation
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('roteurs')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'roteurs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Rôteurs ({roteurs.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assignments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Affectations ({activeAssignments.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('coverage')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'coverage'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Couverture Sites ({sitesNeedingRoteur.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content for Roteurs and Coverage tabs (with padding) */}
        {(activeTab === 'roteurs' || activeTab === 'coverage') && (
          <div className="p-6">
            {/* Search */}
            {activeTab === 'roteurs' && (
              <div className="mb-6">
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
            )}

            {/* Roteurs Tab */}
            {activeTab === 'roteurs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoteurs.map((roteur) => {
                  const currentAssignment = activeAssignments.find(a => a.roteur_id === roteur.id);
                  const isAvailable = !currentAssignment;
                  
                  return (
                    <div key={roteur.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold overflow-hidden">
                            {roteur.photo_url ? (
                              <img
                                src={roteur.photo_url}
                                alt={`Photo de ${roteur.nom_complet}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              roteur.nom_complet.charAt(0)
                            )}
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
                        {currentAssignment ? (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>Affecté: {currentAssignment.site_nom}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <Users className="w-3 h-3" />
                            <span>Disponible</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                        <button
                          onClick={() => { setSelectedRoteur(roteur); setEditingAssignment(null); setShowAssignForm(true); }}
                          disabled={!isAvailable}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Calendar className="w-4 h-4" />
                          {isAvailable ? 'Affecter' : 'Déjà affecté'}
                        </button>
                        
                        <button
                          onClick={() => handleConvertToGuard(roteur)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg border border-orange-200"
                          title="Convertir en garde normal"
                        >
                          <User className="w-4 h-4" />
                          Convertir en Garde
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Coverage Tab */}
            {activeTab === 'coverage' && (
              <div className="space-y-4">
                {sitesNeedingRoteur.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sitesNeedingRoteur.map((site) => (
                      <div key={site.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{site.nom_site}</h3>
                            {site.client_nom && (
                              <p className="text-sm text-gray-600">{site.client_nom}</p>
                            )}
                            <p className="text-sm text-orange-700 mt-1">
                              {site.guard_count} garde(s) - Nécessite un rôteur
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-orange-200">
                          <button
                            onClick={() => {
                              setSelectedRoteur(null);
                              setEditingAssignment(null);
                              setShowAssignForm(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-orange-700 hover:bg-orange-100 rounded-lg"
                          >
                            <Plus className="w-4 h-4" />
                            Affecter un rôteur
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Tous les sites ont une couverture adéquate</p>
                    <p className="text-sm mt-1">Aucun site ne nécessite actuellement de rôteur</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignments Tab - Full width table outside container */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {activeAssignments.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôteur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poste</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeAssignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assignment.roteur_nom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{assignment.site_nom}</div>
                          {assignment.client_nom && (
                            <div className="text-xs text-gray-500">{assignment.client_nom}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(assignment.date_debut).toLocaleDateString('fr-FR')} - {new Date(assignment.date_fin).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            assignment.poste === 'JOUR' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {assignment.poste}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            assignment.statut === 'EN_COURS' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {assignment.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                handleEditAssignment(assignment);
                              }}
                              className="inline-flex items-center p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Modifier l'affectation"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                handleCancelAssignment(assignment.id);
                              }}
                              className="inline-flex items-center p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Annuler l'affectation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune affectation active</p>
              </div>
            </div>
          )}
        </div>
      )}

      {filteredRoteurs.length === 0 && activeTab === 'roteurs' && (
        <div className="text-center py-12 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun rôteur trouvé</p>
          <p className="text-sm mt-1">Les rôteurs sont des employés avec le poste "ROTEUR"</p>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignForm && (
        <RoteurAssignmentModal
          roteur={selectedRoteur}
          assignment={editingAssignment}
          sites={sites.filter(s => s.needs_roteur)} // Only show sites needing roteur
          roteurs={availableRoteurs}
          onClose={() => { 
            setShowAssignForm(false); 
            setSelectedRoteur(null); 
            setEditingAssignment(null); 
          }}
          onSave={() => { 
            setShowAssignForm(false); 
            setSelectedRoteur(null); 
            setEditingAssignment(null); 
            loadData(); // Refresh all data including sites that need roteurs
          }}
        />
      )}
    </div>
  );
};

// Assignment Modal Component
interface RoteurAssignmentModalProps {
  roteur?: EmployeeGASFull | null;
  assignment?: AffectationRoteur | null;
  sites: SiteWithGuardCount[];
  roteurs: EmployeeGASFull[];
  onClose: () => void;
  onSave: () => void;
}

const RoteurAssignmentModal: React.FC<RoteurAssignmentModalProps> = ({ 
  roteur, 
  assignment, 
  sites, 
  roteurs, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    roteurId: assignment?.roteur_id || roteur?.id || '',
    dateDebut: assignment?.date_debut?.split('T')[0] || new Date().toISOString().split('T')[0],
    poste: (assignment?.poste || 'NUIT') as 'JOUR' | 'NUIT',
    notes: assignment?.notes || ''
  });
  
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, {
    siteId: string;
    poste: 'JOUR' | 'NUIT';
    notes?: string;
  } | null>>(() => {
    // Initialize from existing assignment if editing
    if (assignment?.weekly_assignments) {
      const schedule: Record<number, any> = {
        1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 0: null
      };
      
      assignment.weekly_assignments.forEach(wa => {
        schedule[wa.day_of_week] = {
          siteId: wa.site_id,
          poste: wa.poste,
          notes: wa.notes
        };
      });
      
      return schedule;
    }
    
    return {
      1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 0: null
    };
  });
  
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const isEditing = !!assignment;
  const modalTitle = isEditing ? 'Modifier l\'affectation' : 'Nouvelle affectation de rôteur';

  const daysOfWeek = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' }
  ];

  // Real-time validation for weekly schedule
  useEffect(() => {
    const validateWeeklySchedule = async () => {
      const activeAssignments = Object.entries(weeklySchedule).filter(([_, assignment]) => assignment !== null);
      
      if (activeAssignments.length === 0) {
        setValidationErrors([]);
        return;
      }

      setCheckingAvailability(true);
      const errors: string[] = [];

      try {
        // Check for duplicate sites across days
        const usedSites = new Set<string>();
        const siteConflicts: string[] = [];

        for (const [dayOfWeek, assignment] of activeAssignments) {
          if (assignment && usedSites.has(assignment.siteId)) {
            const dayName = daysOfWeek.find(d => d.value === parseInt(dayOfWeek))?.label;
            const siteName = availableSites.find(s => s.id === assignment.siteId)?.nom_site;
            siteConflicts.push(`${dayName}: Site "${siteName}" déjà assigné un autre jour`);
          } else if (assignment) {
            usedSites.add(assignment.siteId);
          }
        }

        errors.push(...siteConflicts);

        // Check each assignment for conflicts with backend
        for (const [dayOfWeek, assignment] of activeAssignments) {
          if (assignment && window.electronAPI?.checkWeeklyRoteurAvailability) {
            const result = await window.electronAPI.checkWeeklyRoteurAvailability({
              roteurId: formData.roteurId,
              siteId: assignment.siteId,
              dayOfWeek: parseInt(dayOfWeek),
              poste: assignment.poste,
              excludeAssignmentId: assignment?.id
            });

            if (!result.available) {
              const dayName = daysOfWeek.find(d => d.value === parseInt(dayOfWeek))?.label;
              errors.push(...result.conflicts.map(c => `${dayName}: ${c.error}`));
            }
          }
        }

        setValidationErrors(errors);
      } catch (error) {
        console.error('Error validating weekly schedule:', error);
        setValidationErrors(['Erreur lors de la validation']);
      } finally {
        setCheckingAvailability(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateWeeklySchedule, 500);
    return () => clearTimeout(timeoutId);
  }, [weeklySchedule, formData.roteurId, assignment?.id]);

  const updateDayAssignment = (dayOfWeek: number, field: 'siteId' | 'poste' | 'notes', value: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek] ? {
        ...prev[dayOfWeek]!,
        [field]: value
      } : {
        siteId: field === 'siteId' ? value : availableSites[0]?.id || '',
        poste: field === 'poste' ? value as 'JOUR' | 'NUIT' : 'NUIT',
        notes: field === 'notes' ? value : ''
      }
    }));
  };

  const clearDayAssignment = (dayOfWeek: number) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayOfWeek]: null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roteurId || !formData.dateDebut) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (Object.values(weeklySchedule).every(assignment => assignment === null)) {
      alert('Veuillez définir au moins une affectation hebdomadaire');
      return;
    }

    // Convert weeklySchedule to weeklyAssignments format
    const weeklyAssignments = Object.entries(weeklySchedule)
      .filter(([_, assignment]) => assignment !== null)
      .map(([dayOfWeek, assignment]) => ({
        dayOfWeek: parseInt(dayOfWeek),
        siteId: assignment!.siteId,
        poste: assignment!.poste,
        notes: assignment!.notes
      }));

    console.log('🔍 [ROTEUR] Weekly schedule object:', weeklySchedule);
    console.log('🔍 [ROTEUR] Converted weekly assignments:', weeklyAssignments);

    if (weeklyAssignments.length === 0) {
      alert('Veuillez définir au moins une affectation hebdomadaire');
      return;
    }

    // Check for validation errors
    if (validationErrors.length > 0) {
      alert('Veuillez corriger les erreurs de validation avant de continuer:\n\n' + validationErrors.join('\n'));
      return;
    }

    try {
      setSaving(true);
      
      if (window.electronAPI?.createRoteurWeeklyAssignment) {
        console.log('🔄 [ROTEUR] Using createRoteurWeeklyAssignment');
        
        const assignmentData = {
          roteur_id: formData.roteurId,
          date_debut: formData.dateDebut,
          poste: formData.poste,
          notes: formData.notes,
          weekly_assignments: weeklyAssignments.map(wa => ({
            day_of_week: wa.dayOfWeek,
            site_id: wa.siteId,
            poste: wa.poste,
            notes: wa.notes
          })),
          statut: 'PLANIFIE'
        };
        
        console.log('🔍 [ROTEUR] Sending assignment data:', assignmentData);
        
        const result = await window.electronAPI.createRoteurWeeklyAssignment(assignmentData);
        
        // Show success message with assignment details
        if (result.success && result.weekly_assignments) {
          const assignmentDetails = result.weekly_assignments.map(a => {
            const dayName = daysOfWeek.find(d => d.value === a.day_of_week)?.label;
            return `• ${dayName} - ${a.site_nom} (${a.poste})`;
          }).join('\n');
          
          alert(`Affectation hebdomadaire créée avec succès!\n\n` +
                `${result.weekly_assignments.length} jour(s) assigné(s) par semaine\n\n` +
                `Rotation hebdomadaire:\n${assignmentDetails}\n\n` +
                `Note: Cette rotation continuera jusqu'à annulation manuelle.`);
        }
      } else if (window.electronAPI?.createRoteurAssignment) {
        // Fallback to regular assignment creation with weekly_assignments data
        console.log('🔄 [ROTEUR] Using fallback createRoteurAssignment with weekly data');
        
        const assignmentData = {
          roteur_id: formData.roteurId,
          site_id: weeklyAssignments.length > 0 ? weeklyAssignments[0].siteId : '',
          date_debut: formData.dateDebut,
          date_fin: '2099-12-31', // Far future date for ongoing rotation
          poste: formData.poste,
          notes: formData.notes,
          weekly_assignments: weeklyAssignments.map(wa => ({
            day_of_week: wa.dayOfWeek,
            site_id: wa.siteId,
            poste: wa.poste,
            notes: wa.notes
          })),
          statut: 'PLANIFIE'
        };
        
        console.log('🔍 [ROTEUR] Sending fallback assignment data:', assignmentData);
        
        const result = await window.electronAPI.createRoteurAssignment(assignmentData);
        
        if (result.success) {
          alert(`Affectation hebdomadaire créée avec succès!\n\n` +
                `${weeklyAssignments.length} jour(s) assigné(s) par semaine\n\n` +
                `Note: Cette rotation continuera jusqu'à annulation manuelle.`);
        }
      } else {
        throw new Error('Aucune fonction d\'affectation disponible');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving assignment:', error);
      
      // More specific error message
      let errorMessage = 'Erreur lors de l\'enregistrement de l\'affectation';
      if (error.message.includes('NOT NULL constraint failed')) {
        errorMessage += '\n\nErreur de base de données: Un champ obligatoire est manquant.';
      } else if (error.message.includes('createRoteurWeeklyAssignment')) {
        errorMessage += '\n\nLa fonction d\'affectation hebdomadaire n\'est pas disponible.';
      }
      
      alert(errorMessage + '\n\nDétails: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter sites to only show those needing roteur coverage
  const availableSites = sites.filter(site => 
    site.needs_roteur && (!site.current_roteur || site.current_roteur.id === assignment?.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-semibold mb-4">{modalTitle}</h3>
        
        {availableSites.length === 0 && !isEditing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Aucun site disponible</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Tous les sites ont déjà une couverture adéquate ou un rôteur affecté.
                  Seuls les sites avec exactement 1 garde nécessitent un rôteur.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Weekly Assignment Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Affectation hebdomadaire récurrente</p>
                <p className="text-sm text-blue-700 mt-1">
                  Sélectionnez les jours de la semaine et les sites pour chaque jour. 
                  Cette rotation continuera jusqu'à annulation manuelle.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Erreurs de validation</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Availability Check Status */}
          {checkingAvailability && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <p className="text-sm text-yellow-700">Vérification de la disponibilité...</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              {/* Roteur Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôteur</label>
                <select
                  value={formData.roteurId}
                  onChange={(e) => setFormData({ ...formData, roteurId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!roteur} // Disable if roteur is pre-selected
                >
                  <option value="">Sélectionner un rôteur</option>
                  {roteurs.map((r) => (
                    <option key={r.id} value={r.id}>{r.nom_complet} ({r.matricule})</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de Début</label>
                <input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Date à partir de laquelle la rotation hebdomadaire commence
                </p>
              </div>

              {/* Default Shift */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste par défaut</label>
                <select
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value as 'JOUR' | 'NUIT' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NUIT">Nuit</option>
                  <option value="JOUR">Jour</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes générales</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Instructions générales pour cette affectation..."
                />
              </div>
            </div>

            {/* Right Column - Weekly Schedule Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Planning hebdomadaire</label>
                <div className="text-xs text-gray-500">
                  {Object.values(weeklySchedule).filter(a => a !== null).length} jour(s) assigné(s)
                </div>
              </div>

              {/* Instructions */}
              {availableSites.length === 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    ⚠️ Aucun site disponible pour les affectations de rôteur.
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Seuls les sites avec exactement 1 garde et sans rôteur actuel sont éligibles.
                  </p>
                </div>
              )}

              {availableSites.length > 0 && Object.values(weeklySchedule).every(a => a === null) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✅ Prêt! Sélectionnez les sites pour chaque jour de la semaine.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {availableSites.length} site(s) disponible(s): {availableSites.map(s => s.nom_site).join(', ')}
                  </p>
                </div>
              )}

              {/* Weekly Grid */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {daysOfWeek.map((day) => {
                  const dayAssignment = weeklySchedule[day.value];
                  const isAssigned = dayAssignment !== null;

                  return (
                    <div key={day.value} className={`border-b border-gray-200 last:border-b-0 ${isAssigned ? 'bg-blue-50' : 'bg-white'}`}>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">{day.label}</span>
                            {isAssigned && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Assigné
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isAssigned ? (
                              <button
                                type="button"
                                onClick={() => clearDayAssignment(day.value)}
                                className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                              >
                                Supprimer
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateDayAssignment(day.value, 'siteId', availableSites[0]?.id || '')}
                                disabled={availableSites.length === 0}
                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Assigner
                              </button>
                            )}
                          </div>
                        </div>

                        {isAssigned && dayAssignment && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Site</label>
                                <select
                                  value={dayAssignment.siteId}
                                  onChange={(e) => updateDayAssignment(day.value, 'siteId', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  {availableSites.map(site => (
                                    <option key={site.id} value={site.id}>
                                      {site.nom_site}
                                      {site.client_nom && ` - ${site.client_nom}`}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Poste</label>
                                <select
                                  value={dayAssignment.poste}
                                  onChange={(e) => updateDayAssignment(day.value, 'poste', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="NUIT">Nuit</option>
                                  <option value="JOUR">Jour</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                              <input
                                type="text"
                                value={dayAssignment.notes || ''}
                                onChange={(e) => updateDayAssignment(day.value, 'notes', e.target.value)}
                                placeholder="Notes pour ce jour..."
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {!isAssigned && availableSites.length > 0 && (
                          <div className="text-xs text-gray-500 italic">
                            Cliquez sur "Assigner" pour définir une rotation ce jour
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.values(weeklySchedule).some(a => a !== null) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    💡 Astuce: Un même site ne peut être assigné qu'une seule fois par semaine pour éviter les conflits.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || checkingAvailability || validationErrors.length > 0 || Object.values(weeklySchedule).every(a => a === null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {checkingAvailability ? 'Vérification...' : (saving ? 'Enregistrement...' : 'Créer la rotation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSave,
  sites,
  agents
}) => {
  const [formData, setFormData] = useState<AssignmentFormData>({
    agent_id: assignment?.agent_id || '',
    site_id: assignment?.site_id || '',
    start_date: assignment?.start_date || '',
    end_date: assignment?.end_date || '',
    daily_assignments: assignment?.daily_assignments || []
  });
  
  const [saving, setSaving] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [dailyAssignments, setDailyAssignments] = useState<DailyAssignment[]>(
    assignment?.daily_assignments || []
  );

  const isEditing = !!assignment;
  const modalTitle = isEditing ? 'Modifier l\'affectation' : 'Nouvelle affectation';

  // Filter sites to only show those needing roteur coverage
  const availableSites = sites.filter(site => 
    site.needs_roteur && (!site.current_roteur || site.current_roteur.id === assignment?.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationErrors.length > 0) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        daily_assignments: dailyAssignments
      });
      onClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">{modalTitle}</h3>
        
        {availableSites.length === 0 && !isEditing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Aucun site disponible</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Tous les sites ont déjà une couverture adéquate ou un rôteur affecté.
                  Seuls les sites avec exactement 1 garde nécessitent un rôteur.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Weekly Constraint Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Contrainte hebdomadaire</p>
                <p className="text-sm text-blue-700 mt-1">
                  Un rôteur ne peut servir qu'une fois par semaine au même site. 
                  Cette règle garantit une rotation équitable et évite la surcharge.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Erreurs de validation</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Availability Check Status */}
          {checkingAvailability && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <p className="text-sm text-yellow-700">Vérification de la disponibilité...</p>
              </div>
            </div>
          )}
          {/* Roteur Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôteur</label>
            <select
              value={formData.roteurId}
              onChange={(e) => setFormData({ ...formData, roteurId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!roteur} // Disable if roteur is pre-selected
            >
              <option value="">Sélectionner un rôteur</option>
              {roteurs.map((r) => (
                <option key={r.id} value={r.id}>{r.nom_complet} ({r.matricule})</option>
              ))}
            </select>
          </div>

          {/* Site Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sites (maximum 6)
            </label>
            <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
              {availableSites.length > 0 ? (
                availableSites.map((site) => (
                  <label key={site.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.siteIds.includes(site.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (formData.siteIds.length < 6) {
                            setFormData({ 
                              ...formData, 
                              siteIds: [...formData.siteIds, site.id] 
                            });
                          } else {
                            alert('Maximum 6 sites autorisés par rôteur');
                          }
                        } else {
                          setFormData({ 
                            ...formData, 
                            siteIds: formData.siteIds.filter(id => id !== site.id) 
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      {site.nom_site} ({site.guard_count} garde)
                      {site.client_nom && (
                        <span className="text-gray-500"> - {site.client_nom}</span>
                      )}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-2">Aucun site disponible pour affectation</p>
              )}
            </div>
            {formData.siteIds.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {formData.siteIds.length} site(s) sélectionné(s) sur 6 maximum
              </p>
            )}
          </div>

          {/* Date Range */}
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

          {/* Shift */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poste de remplacement</label>
            <select
              value={formData.poste}
              onChange={(e) => setFormData({ ...formData, poste: e.target.value as 'JOUR' | 'NUIT' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="JOUR">Jour (remplacement jour de repos)</option>
              <option value="NUIT">Nuit (remplacement jour de repos)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Le rôteur couvre le jour de repos du garde principal
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Instructions spéciales, jour de la semaine à couvrir, etc..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Le système applique automatiquement la contrainte: maximum une affectation par semaine au même site.
            </p>
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
              disabled={saving || checkingAvailability || validationErrors.length > 0 || (availableSites.length === 0 && !isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {checkingAvailability ? 'Vérification...' : (saving ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Affecter'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoteurManagement;
