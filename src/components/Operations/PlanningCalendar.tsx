import React, { useState, useEffect } from 'react';
import { Users, Calendar as CalendarIcon } from 'lucide-react';
import { AffectationRoteur, EmployeeGASFull } from '../../types';

interface WeeklyPlanningProps {
  onAssignRoteur?: (gap: any) => void;
}

const PlanningCalendar: React.FC<WeeklyPlanningProps> = ({ onAssignRoteur }) => {
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

      {/* Weekly Table Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {roteurAssignments.length > 0 ? (
                roteurAssignments.map((roteur, index) => (
                  <tr key={`${roteur.roteur_id}-${roteur.id}-${index}`} className="hover:bg-gray-50">
                    {/* Roteur Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {roteur.roteur_nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {roteur.statut === 'EN_COURS' ? 'Actif' : 'Planifié'}
                          </div>
                        </div>
                      </div>
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
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                                {dayAssignment.site_nom}
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                dayAssignment.poste === 'JOUR' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {dayAssignment.poste}
                              </span>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune affectation de rôteur</p>
                    <p className="text-sm mt-1">Les affectations apparaîtront ici une fois créées</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                const hasAssignments = roteurAssignments.some(assignment => 
                  assignment.weekly_assignments?.some(wa => wa.day_of_week === day.value)
                );
                return total + (hasAssignments ? 1 : 0);
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

export default PlanningCalendar;