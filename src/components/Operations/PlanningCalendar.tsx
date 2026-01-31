import React, { useState, useEffect } from 'react';
import { Users, Calendar as CalendarIcon, Plus, MapPin, AlertTriangle, Edit, UserPlus } from 'lucide-react';
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
          let weeklyAssignments = assignment.weekly_assignments;
          
          // Handle different formats of weekly_assignments
          if (typeof weeklyAssignments === 'string') {
            try {
              weeklyAssignments = JSON.parse(weeklyAssignments);
            } catch (error) {
              console.warn('Failed to parse weekly_assignments JSON:', weeklyAssignments);
              weeklyAssignments = [];
            }
          } else if (!Array.isArray(weeklyAssignments)) {
            // If it's not a string or array, default to empty array
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
                        className="flex items-center text-left hover:bg-blue-50 rounded-lg p-2 -m-2 transition-colors w-full"
                      >
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {roteur.roteur_nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {roteur.statut === 'EN_COURS' ? 'Actif' : 'Planifié'}
                          </div>
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

export default PlanningCalendar;