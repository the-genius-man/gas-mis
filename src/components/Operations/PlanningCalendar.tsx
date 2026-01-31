import React, { useState, useEffect } from 'react';
import { Users, Calendar as CalendarIcon, Plus, MapPin, AlertTriangle, Edit, UserPlus, Clock, Trash2 } from 'lucide-react';
import { AffectationRoteur, EmployeeGASFull } from '../../types';

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

interface WeeklyPlanningProps {
  onAssignRoteur?: (gap: any) => void;
}

const PlanningCalendar: React.FC<WeeklyPlanningProps> = ({ onAssignRoteur }) => {
  const [roteurAssignments, setRoteurAssignments] = useState<AffectationRoteur[]>([]);
  const [roteurs, setRoteurs] = useState<EmployeeGASFull[]>([]);
  const [sites, setSites] = useState<SiteWithGuardCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRoteur, setSelectedRoteur] = useState<EmployeeGASFull | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<AffectationRoteur | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [assignmentsData, roteursData, sitesData] = await Promise.all([
          window.electronAPI.getRoteurAssignments?.() || Promise.resolve([]),
          window.electronAPI.getRoteurs?.({ statut: 'ACTIF' }) || Promise.resolve([]),
          window.electronAPI.getSitesEligibleForRoteur?.() || window.electronAPI.getSitesGAS() || Promise.resolve([])
        ]);

        // Process assignments and parse weekly_assignments if it's a JSON string
        const processedAssignments = (assignmentsData || []).map(assignment => {
          console.log('🔍 [PLANNING] Processing assignment:', assignment.id, 'weekly_assignments:', assignment.weekly_assignments);
          
          let weeklyAssignments = assignment.weekly_assignments;
          
          // Handle different formats of weekly_assignments
          if (typeof weeklyAssignments === 'string') {
            try {
              weeklyAssignments = JSON.parse(weeklyAssignments);
              console.log('🔍 [PLANNING] Parsed JSON weekly_assignments:', weeklyAssignments);
            } catch (error) {
              console.warn('Failed to parse weekly_assignments JSON:', weeklyAssignments);
              weeklyAssignments = [];
            }
          } else if (!Array.isArray(weeklyAssignments)) {
            // If it's not a string or array, default to empty array
            console.log('🔍 [PLANNING] weekly_assignments is not string or array, defaulting to empty array');
            weeklyAssignments = [];
          }
          
          // Ensure each assignment has the correct structure
          weeklyAssignments = weeklyAssignments.map(wa => ({
            day_of_week: parseInt(wa.day_of_week),
            site_id: wa.site_id,
            site_nom: wa.site_nom,
            poste: wa.poste || 'NUIT',
            notes: wa.notes || ''
          }));
          
          console.log('🔍 [PLANNING] Final processed weekly_assignments:', weeklyAssignments);
          
          return {
            ...assignment,
            weekly_assignments: weeklyAssignments
          };
        });

        const activeAssignments = processedAssignments.filter(a => a.statut === 'EN_COURS' || a.statut === 'PLANIFIE');
        
        // Process sites data
        const sitesWithCoverage: SiteWithGuardCount[] = (sitesData || []).map((site: any) => {
          // Find current active roteur assignment for this site
          const currentRoteurAssignment = activeAssignments.find((assignment: any) => {
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
        
        setRoteurAssignments(activeAssignments);
        setRoteurs(roteursData || []);
        setSites(sitesWithCoverage);
      }
    } catch (error) {
      console.error('Error loading rotation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoteurClick = (assignment: AffectationRoteur) => {
    setEditingAssignment(assignment);
    setSelectedRoteur(null);
    setShowAssignForm(true);
  };

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

  const daysOfWeek = [
    { value: 1, label: 'Lundi', shortLabel: 'Lun' },
    { value: 2, label: 'Mardi', shortLabel: 'Mar' },
    { value: 3, label: 'Mercredi', shortLabel: 'Mer' },
    { value: 4, label: 'Jeudi', shortLabel: 'Jeu' },
    { value: 5, label: 'Vendredi', shortLabel: 'Ven' },
    { value: 6, label: 'Samedi', shortLabel: 'Sam' },
    { value: 0, label: 'Dimanche', shortLabel: 'Dim' }
  ];

  const sitesNeedingRoteur = sites.filter(s => s.needs_roteur && !s.current_roteur);
  const availableRoteurs = roteurs.filter(r => 
    r.statut === 'ACTIF' && 
    !roteurAssignments.some(a => a.roteur_id === r.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Rotation des Rôteurs</h2>
          <p className="text-sm text-gray-500">
            Gestion des rotations hebdomadaires et affectations des rôteurs
          </p>
        </div>
        <button
          onClick={() => { setSelectedRoteur(null); setEditingAssignment(null); setShowAssignForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Déployer Rôteur
        </button>
      </div>

      {/* Sites Non Affectés Section */}
      {sitesNeedingRoteur.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="font-medium text-orange-900">Sites Non Affectés ({sitesNeedingRoteur.length})</h3>
            </div>
            <button
              onClick={() => { setSelectedRoteur(null); setEditingAssignment(null); setShowAssignForm(true); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
            >
              <UserPlus className="w-4 h-4" />
              Déployer Rôteur
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sitesNeedingRoteur.map((site) => (
              <div key={site.id} className="bg-white border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{site.nom_site}</h4>
                    {site.client_nom && (
                      <p className="text-sm text-gray-600 truncate">{site.client_nom}</p>
                    )}
                    <p className="text-sm text-orange-700">
                      {site.guard_count} garde(s) - Nécessite un rôteur
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Rotation Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Planning Hebdomadaire</h3>
            </div>
            <div className="text-sm text-gray-500">
              {roteurAssignments.length} rôteur(s) actif(s)
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôteurs
                </th>
                {daysOfWeek.map((day) => (
                  <th key={day.value} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {roteurAssignments.length > 0 ? (
                roteurAssignments.map((roteur, index) => (
                  <tr key={`${roteur.roteur_id}-${roteur.id}-${index}`} className="hover:bg-gray-50">
                    {/* Roteur Name - Clickable */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRoteurClick(roteur)}
                        className="text-left hover:bg-blue-50 rounded-lg p-2 -m-2 transition-colors w-full"
                      >
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {roteur.roteur_nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {roteur.statut === 'EN_COURS' ? 'Actif' : 'Planifié'}
                        </div>
                      </button>
                    </td>

                    {/* Days of Week */}
                    {daysOfWeek.map((day) => {
                      const dayAssignment = roteur.weekly_assignments?.find(
                        wa => wa.day_of_week === day.value
                      );

                      return (
                        <td key={`${roteur.roteur_id}-${day.value}-${index}`} className="px-6 py-4 text-center">
                          {dayAssignment ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={dayAssignment.site_nom}>
                                {dayAssignment.site_nom || 'Site non défini'}
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                dayAssignment.poste === 'JOUR' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {dayAssignment.poste || 'JOUR'}
                              </span>
                              {dayAssignment.notes && (
                                <div className="text-xs text-gray-500 truncate max-w-[120px]" title={dayAssignment.notes}>
                                  {dayAssignment.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRoteurClick(roteur)}
                          className="inline-flex items-center p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Modifier la rotation"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelAssignment(roteur.id)}
                          className="inline-flex items-center p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Annuler la rotation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune rotation de rôteur</p>
                    <p className="text-sm mt-1">Cliquez sur "Déployer Rôteur" pour commencer</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Résumé des Rotations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {roteurAssignments.length}
            </div>
            <div className="text-gray-600">Rôteurs Actifs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {roteurAssignments.reduce((total, assignment) => {
                return total + (assignment.weekly_assignments?.length || 1);
              }, 0)}
            </div>
            <div className="text-gray-600">Affectations Totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {sitesNeedingRoteur.length}
            </div>
            <div className="text-gray-600">Sites Non Affectés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {availableRoteurs.length}
            </div>
            <div className="text-gray-600">Rôteurs Disponibles</div>
          </div>
        </div>
      </div>

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
      
      // Ensure weekly_assignments is properly formatted
      const formattedWeeklyAssignments = weeklyAssignments.map(wa => ({
        day_of_week: parseInt(wa.dayOfWeek),
        site_id: wa.siteId,
        poste: wa.poste || 'NUIT',
        notes: wa.notes || ''
      }));
      
      console.log('🔍 [ROTEUR] Formatted weekly assignments:', formattedWeeklyAssignments);
      
      if (window.electronAPI?.createRoteurAssignment) {
        console.log('🔄 [ROTEUR] Using createRoteurAssignment with weekly data');
        
        const assignmentData = {
          roteur_id: formData.roteurId,
          site_id: formattedWeeklyAssignments.length > 0 ? formattedWeeklyAssignments[0].site_id : '',
          date_debut: formData.dateDebut,
          date_fin: '2099-12-31', // Far future date for ongoing rotation
          poste: formData.poste,
          notes: formData.notes,
          weekly_assignments: JSON.stringify(formattedWeeklyAssignments), // Ensure it's a JSON string
          statut: 'PLANIFIE'
        };
        
        console.log('🔍 [ROTEUR] Sending assignment data:', assignmentData);
        
        const result = await window.electronAPI.createRoteurAssignment(assignmentData);
        
        console.log('🔍 [ROTEUR] Backend response:', result);
        
        // Show success message with assignment details
        if (result.success && result.weekly_assignments) {
          const assignmentDetails = result.weekly_assignments.map((a: any) => {
            const dayName = daysOfWeek.find(d => d.value === a.day_of_week)?.label;
            return `• ${dayName} - ${a.site_nom} (${a.poste})`;
          }).join('\n');
          
          alert(`Affectation hebdomadaire créée avec succès!\n\n` +
                `${result.weekly_assignments.length} jour(s) assigné(s) par semaine\n\n` +
                `Rotation hebdomadaire:\n${assignmentDetails}\n\n` +
                `Note: Cette rotation continuera jusqu'à annulation manuelle.`);
        } else if (result.success) {
          alert(`Affectation hebdomadaire créée avec succès!\n\n` +
                `${formattedWeeklyAssignments.length} jour(s) assigné(s) par semaine\n\n` +
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

export default PlanningCalendar;