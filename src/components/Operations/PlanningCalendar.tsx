import React, { useState, useEffect } from 'react';
import { Users, MapPin, Clock, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { AffectationRoteur, EmployeeGASFull } from '../../types';

interface WeeklyPlanningProps {
  onAssignRoteur?: (gap: any) => void;
}

const WeeklyPlanning: React.FC<WeeklyPlanningProps> = ({ onAssignRoteur }) => {
  const [roteurAssignments, setRoteurAssignments] = useState<AffectationRoteur[]>([]);
  const [roteurs, setRoteurs] = useState<EmployeeGASFull[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [assignmentsData, roteursData] = await Promise.all([
          window.electronAPI.getRoteurAssignments?.() || Promise.resolve([]),
          window.electronAPI.getRoteurs?.({ statut: 'ACTIF' }) || Promise.resolve([])
        ]);

        setRoteurAssignments(assignmentsData?.filter(a => a.statut === 'EN_COURS' || a.statut === 'PLANIFIE') || []);
        setRoteurs(roteursData || []);
      }
    } catch (error) {
      console.error('Error loading weekly planning data:', error);
    } finally {
      setLoading(false);
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

  // Get assignments for a specific day of the week
  const getAssignmentsForDay = (dayOfWeek: number) => {
    const dayAssignments: Array<{
      roteur_nom: string;
      site_nom: string;
      poste: string;
      statut: string;
      roteur_id: string;
    }> = [];

    roteurAssignments.forEach(assignment => {
      if (assignment.weekly_assignments && assignment.weekly_assignments.length > 0) {
        // New weekly assignment format
        assignment.weekly_assignments.forEach(wa => {
          if (wa.day_of_week === dayOfWeek) {
            dayAssignments.push({
              roteur_nom: assignment.roteur_nom,
              site_nom: wa.site_nom,
              poste: wa.poste,
              statut: assignment.statut,
              roteur_id: assignment.roteur_id
            });
          }
        });
      } else {
        // Fallback for old-style assignments - show on all days
        dayAssignments.push({
          roteur_nom: assignment.roteur_nom,
          site_nom: assignment.site_nom,
          poste: assignment.poste,
          statut: assignment.statut,
          roteur_id: assignment.roteur_id
        });
      }
    });

    return dayAssignments;
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
          <h2 className="text-xl font-semibold text-gray-900">Planning Hebdomadaire des Rôteurs</h2>
          <p className="text-sm text-gray-500">
            Vue d'ensemble des affectations par jour de la semaine
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>Rotation récurrente</span>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {daysOfWeek.map((day) => {
            const dayAssignments = getAssignmentsForDay(day.value);
            
            return (
              <div key={day.value} className="min-h-[300px]">
                {/* Day Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 text-center">{day.label}</h3>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {dayAssignments.length} affectation(s)
                  </p>
                </div>

                {/* Day Content */}
                <div className="p-3 space-y-2">
                  {dayAssignments.length > 0 ? (
                    dayAssignments.map((assignment, index) => (
                      <div
                        key={`${assignment.roteur_id}-${index}`}
                        className={`p-3 rounded-lg border text-sm ${
                          assignment.statut === 'EN_COURS'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Users className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {assignment.roteur_nom}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <p className="text-gray-700 text-xs truncate">
                            {assignment.site_nom}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            assignment.poste === 'JOUR' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {assignment.poste}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucune affectation</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Résumé Hebdomadaire</h3>
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
              {new Set(roteurAssignments.flatMap(a => 
                a.weekly_assignments?.map(wa => wa.site_id) || [a.site_id]
              )).size}
            </div>
            <div className="text-gray-600">Sites Couverts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {daysOfWeek.reduce((total, day) => {
                return total + (getAssignmentsForDay(day.value).length > 0 ? 1 : 0);
              }, 0)}
            </div>
            <div className="text-gray-600">Jours Actifs</div>
          </div>
        </div>
      </div>

      {roteurAssignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune affectation de rôteur</p>
          <p className="text-sm mt-1">Les affectations apparaîtront ici une fois créées</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanning;