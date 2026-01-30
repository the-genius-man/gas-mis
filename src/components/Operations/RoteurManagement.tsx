import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, User, Plus, Clock, AlertTriangle, Users, Edit, Trash2, CalendarDays } from 'lucide-react';
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
          const currentRoteurAssignment = (assignmentsData || []).find((assignment: any) => 
            assignment.site_id === site.id && 
            (assignment.statut === 'EN_COURS' || assignment.statut === 'PLANIFIE')
          );
          
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
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'calendar'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Calendrier</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content for Roteurs, Coverage, and Calendar tabs (with padding) */}
        {(activeTab === 'roteurs' || activeTab === 'coverage' || activeTab === 'calendar') && (
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

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <RoteurCalendarView assignments={activeAssignments} />
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
            loadData(); 
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
    dateFin: assignment?.date_fin?.split('T')[0] || '',
    poste: (assignment?.poste || 'JOUR') as 'JOUR' | 'NUIT',
    notes: assignment?.notes || ''
  });
  
  const [dailyAssignments, setDailyAssignments] = useState<Array<{
    date: string;
    siteId: string;
    poste: 'JOUR' | 'NUIT';
    notes?: string;
  }>>([]);
  
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const isEditing = !!assignment;
  const modalTitle = isEditing ? 'Modifier l\'affectation' : 'Nouvelle affectation de rôteur';

  // Generate available dates when date range changes
  useEffect(() => {
    if (formData.dateDebut && formData.dateFin) {
      const dates = generateDateRange(formData.dateDebut, formData.dateFin);
      setAvailableDates(dates);
      
      // Clear daily assignments if date range changed
      setDailyAssignments([]);
    }
  }, [formData.dateDebut, formData.dateFin]);

  // Helper function to generate date range
  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Real-time validation for daily assignments
  useEffect(() => {
    const validateDailyAssignments = async () => {
      if (dailyAssignments.length === 0) {
        setValidationErrors([]);
        return;
      }

      setCheckingAvailability(true);
      const errors: string[] = [];

      try {
        // Check each daily assignment for conflicts
        for (const dailyAssignment of dailyAssignments) {
          if (window.electronAPI?.checkDailySiteAvailability) {
            const result = await window.electronAPI.checkDailySiteAvailability({
              siteId: dailyAssignment.siteId,
              date: dailyAssignment.date,
              poste: dailyAssignment.poste,
              excludeAssignmentId: assignment?.id
            });

            if (!result.available) {
              errors.push(...result.conflicts.map(c => c.error));
            }
          }
        }

        setValidationErrors(errors);
      } catch (error) {
        console.error('Error validating daily assignments:', error);
        setValidationErrors(['Erreur lors de la validation']);
      } finally {
        setCheckingAvailability(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateDailyAssignments, 500);
    return () => clearTimeout(timeoutId);
  }, [dailyAssignments, assignment?.id]);

  const addDailyAssignment = () => {
    if (availableDates.length === 0) {
      alert('Veuillez d\'abord définir une période (date début et fin)');
      return;
    }

    // Find first available date not already assigned
    const usedDates = dailyAssignments.map(da => da.date);
    const availableDate = availableDates.find(date => !usedDates.includes(date));

    if (!availableDate) {
      alert('Toutes les dates de la période sont déjà assignées');
      return;
    }

    const firstAvailableSite = sites.length > 0 ? sites[0].id : '';

    setDailyAssignments([...dailyAssignments, {
      date: availableDate,
      siteId: firstAvailableSite,
      poste: formData.poste,
      notes: ''
    }]);
  };

  const updateDailyAssignment = (index: number, field: string, value: string) => {
    const updated = [...dailyAssignments];
    updated[index] = { ...updated[index], [field]: value };
    setDailyAssignments(updated);
  };

  const removeDailyAssignment = (index: number) => {
    const updated = dailyAssignments.filter((_, i) => i !== index);
    setDailyAssignments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roteurId || !formData.dateDebut || !formData.dateFin) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (dailyAssignments.length === 0) {
      alert('Veuillez ajouter au moins une affectation journalière');
      return;
    }

    // Validate dates
    if (new Date(formData.dateFin) <= new Date(formData.dateDebut)) {
      alert('La date de fin doit être postérieure à la date de début');
      return;
    }

    // Check for validation errors
    if (validationErrors.length > 0) {
      alert('Veuillez corriger les erreurs de validation avant de continuer:\n\n' + validationErrors.join('\n'));
      return;
    }

    try {
      setSaving(true);
      
      if (window.electronAPI?.createRoteurAssignment) {
        const result = await window.electronAPI.createRoteurAssignment({
          roteur_id: formData.roteurId,
          site_id: dailyAssignments.length > 0 ? dailyAssignments[0].siteId : '', // Primary site for backward compatibilitys[0]?.siteId || '', // Primary site for backward compatibility
          date_debut: formData.dateDebut,
          date_fin: formData.dateFin,
          poste: formData.poste,
          notes: formData.notes,
          daily_assignments: dailyAssignments.map(da => ({
            date: da.date,
            site_id: da.siteId,
            poste: da.poste,
            notes: da.notes
          })),
          statut: 'PLANIFIE'
        });
        
        // Show success message with assignment details
        if (result.success && result.daily_assignments) {
          const assignmentDetails = result.daily_assignments.map(a => 
            `• ${a.jour_semaine} ${new Date(a.date).toLocaleDateString('fr-FR')} - ${a.site_nom} (${a.poste})`
          ).join('\n');
          
          alert(`Affectation créée avec succès!\n\n` +
                `${result.total_days_assigned} jour(s) assigné(s) manuellement\n\n` +
                `Détails des affectations:\n${assignmentDetails}\n\n` +
                `Note: Chaque site ne peut avoir qu'un seul rôteur par jour.`);
        }
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Erreur lors de l\'enregistrement de l\'affectation:\n\n' + error.message);
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
          {/* Daily Assignment Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Affectation journalière manuelle</p>
                <p className="text-sm text-blue-700 mt-1">
                  Sélectionnez manuellement les jours et sites pour chaque affectation. 
                  Un seul rôteur peut être assigné par site par jour.
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

              {/* Date Range Helper */}
              {formData.dateDebut && formData.dateFin && availableDates.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✓ Période définie: {availableDates.length} jour(s) disponible(s)
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Vous pouvez maintenant ajouter des affectations journalières →
                  </p>
                </div>
              )}

              {/* Default Shift */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste par défaut</label>
                <select
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value as 'JOUR' | 'NUIT' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="JOUR">Jour</option>
                  <option value="NUIT">Nuit</option>
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

            {/* Right Column - Daily Assignments */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Affectations journalières</label>
                <button
                  type="button"
                  onClick={addDailyAssignment}
                  disabled={availableDates.length === 0 || availableSites.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={availableDates.length === 0 ? "Définissez d'abord une période" : availableSites.length === 0 ? "Aucun site disponible" : "Ajouter une affectation journalière"}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter jour
                </button>
              </div>

              {/* Instructions */}
              {availableDates.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    📅 Définissez d'abord une période (dates début et fin) pour pouvoir ajouter des affectations journalières.
                  </p>
                </div>
              )}

              {availableDates.length > 0 && availableSites.length === 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    ⚠️ Aucun site disponible pour les affectations de rôteur.
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Seuls les sites avec exactement 1 garde et sans rôteur actuel sont éligibles.
                  </p>
                </div>
              )}

              {availableDates.length > 0 && availableSites.length > 0 && dailyAssignments.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✅ Prêt! Cliquez sur "Ajouter jour" pour sélectionner les sites et créer les affectations.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {availableSites.length} site(s) disponible(s): {availableSites.map(s => s.nom_site).join(', ')}
                  </p>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-3">
                {dailyAssignments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune affectation journalière. Cliquez sur "Ajouter jour" pour commencer.
                  </p>
                ) : (
                  dailyAssignments.map((dailyAssignment, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Jour {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDailyAssignment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                          <select
                            value={dailyAssignment.date}
                            onChange={(e) => updateDailyAssignment(index, 'date', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            {availableDates.map(date => (
                              <option key={date} value={date}>
                                {new Date(date).toLocaleDateString('fr-FR', { 
                                  weekday: 'short', 
                                  day: 'numeric', 
                                  month: 'short' 
                                })}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Poste</label>
                          <select
                            value={dailyAssignment.poste}
                            onChange={(e) => updateDailyAssignment(index, 'poste', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="JOUR">Jour</option>
                            <option value="NUIT">Nuit</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Site</label>
                        <select
                          value={dailyAssignment.siteId}
                          onChange={(e) => updateDailyAssignment(index, 'siteId', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          {availableSites.map(site => (
                            <option key={site.id} value={site.id}>
                              {site.nom_site} ({site.guard_count} garde)
                              {site.client_nom && ` - ${site.client_nom}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                        <input
                          type="text"
                          value={dailyAssignment.notes || ''}
                          onChange={(e) => updateDailyAssignment(index, 'notes', e.target.value)}
                          placeholder="Notes spécifiques pour ce jour..."
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {dailyAssignments.length > 0 && (
                <p className="text-xs text-blue-600">
                  {dailyAssignments.length} jour(s) assigné(s) sur {availableDates.length} disponible(s)
                </p>
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
              disabled={saving || checkingAvailability || validationErrors.length > 0 || dailyAssignments.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {checkingAvailability ? 'Vérification...' : (saving ? 'Enregistrement...' : 'Créer l\'affectation')}
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

// Calendar View Component
interface RoteurCalendarViewProps {
  assignments: AffectationRoteur[];
}

const RoteurCalendarView: React.FC<RoteurCalendarViewProps> = ({ assignments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  // Get assignments for a specific date
  const getAssignmentsForDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    
    return assignments.filter(assignment => {
      const startDate = new Date(assignment.date_debut);
      const endDate = new Date(assignment.date_fin);
      
      // Check if this date falls within the assignment period
      if (date >= startDate && date <= endDate) {
        // For roteur assignments, we need to determine which site they're covering on this specific day
        // This should be handled by the backend to distribute days across assigned sites
        // For now, we'll show only one assignment per roteur per day
        return true;
      }
      return false;
    });
  };
  
  // Get the specific site assignment for a roteur on a given day
  const getRoteurSiteForDay = (roteurId: string, day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const roteurAssignments = assignments.filter(assignment => 
      assignment.roteur_id === roteurId &&
      new Date(assignment.date_debut) <= date &&
      new Date(assignment.date_fin) >= date
    );
    
    if (roteurAssignments.length === 0) return null;
    
    // If roteur has multiple site assignments, determine which site for this day
    // This could be based on a rotation pattern (e.g., round-robin)
    // For now, we'll use a simple day-based rotation
    const daysSinceStart = Math.floor((date.getTime() - new Date(roteurAssignments[0].date_debut).getTime()) / (1000 * 60 * 60 * 24));
    const siteIndex = daysSinceStart % roteurAssignments.length;
    
    return roteurAssignments[siteIndex];
  };
  
  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Calendrier des Affectations - {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 rounded"></div>
          <span>Affectation active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-200 rounded"></div>
          <span>Affectation planifiée</span>
        </div>
        <div className="text-gray-600 text-xs">
          • Un rôteur ne peut couvrir qu'un site par jour
          • Maximum une fois par semaine au même site
          • La rotation entre sites se fait automatiquement
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-24 border-r border-b border-gray-200 last:border-r-0"></div>;
            }
            
            // Get unique roteurs for this day (one assignment per roteur)
            const dayAssignments = getAssignmentsForDate(day);
            const uniqueRoteurAssignments = [];
            const seenRoteurs = new Set();
            
            for (const assignment of dayAssignments) {
              if (!seenRoteurs.has(assignment.roteur_id)) {
                // Get the specific site this roteur is covering today
                const todayAssignment = getRoteurSiteForDay(assignment.roteur_id, day);
                if (todayAssignment) {
                  uniqueRoteurAssignments.push(todayAssignment);
                  seenRoteurs.add(assignment.roteur_id);
                }
              }
            }
            
            const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
            
            return (
              <div
                key={day}
                className={`h-24 border-r border-b border-gray-200 last:border-r-0 p-1 ${
                  isToday ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {uniqueRoteurAssignments.slice(0, 3).map((assignment, idx) => (
                    <div
                      key={`${assignment.id}-${day}-${idx}`}
                      className={`text-xs p-1 rounded truncate ${
                        assignment.statut === 'EN_COURS' 
                          ? 'bg-blue-200 text-blue-800' 
                          : 'bg-green-200 text-green-800'
                      }`}
                      title={`${assignment.roteur_nom} couvre ${assignment.site_nom} aujourd'hui`}
                    >
                      {assignment.roteur_nom?.split(' ')[0]} @ {assignment.site_nom?.substring(0, 10)}
                    </div>
                  ))}
                  {uniqueRoteurAssignments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{uniqueRoteurAssignments.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Assignment Summary with Rotation Schedule */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">Planning de Rotation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => {
            // Calculate rotation schedule for this assignment
            const startDate = new Date(assignment.date_debut);
            const endDate = new Date(assignment.date_fin);
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            // Get all sites this roteur is assigned to during this period
            const roteurAssignments = assignments.filter(a => 
              a.roteur_id === assignment.roteur_id &&
              a.date_debut === assignment.date_debut &&
              a.date_fin === assignment.date_fin
            );
            
            return (
              <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{assignment.roteur_nom}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    assignment.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {assignment.statut}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {startDate.toLocaleDateString('fr-FR')} - {endDate.toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{assignment.poste}</span>
                  </div>
                  
                  {/* Current Site Assignment */}
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span className="font-medium text-blue-900">Site Actuel</span>
                    </div>
                    <span className="text-blue-800">{assignment.site_nom}</span>
                  </div>
                  
                  {/* Rotation Pattern */}
                  {roteurAssignments.length > 1 && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Rotation ({roteurAssignments.length} sites):
                      </div>
                      <div className="space-y-1">
                        {roteurAssignments.map((site, idx) => (
                          <div key={site.id} className="text-xs text-gray-600">
                            {idx + 1}. {site.site_nom}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Rotation automatique chaque jour
                      </div>
                    </div>
                  )}
                  
                  {assignment.notes && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                      <strong>Notes:</strong> {assignment.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {assignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune affectation de rôteur</p>
          <p className="text-sm mt-1">Les affectations apparaîtront ici une fois créées</p>
        </div>
      )}
    </div>
  );
};

export default RoteurManagement;
