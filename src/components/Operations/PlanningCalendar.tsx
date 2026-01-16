import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, Users, CheckCircle } from 'lucide-react';
import { SiteGAS, CoverageGap, AffectationRoteur, EmployeeGASFull } from '../../types';

interface PlanningCalendarProps {
  onAssignRoteur?: (gap: CoverageGap) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  coverageGaps: CoverageGap[];
  roteurAssignments: AffectationRoteur[];
}

const PlanningCalendar: React.FC<PlanningCalendarProps> = ({ onAssignRoteur }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sites, setSites] = useState<SiteGAS[]>([]);
  const [coverageGaps, setCoverageGaps] = useState<CoverageGap[]>([]);
  const [roteurAssignments, setRoteurAssignments] = useState<AffectationRoteur[]>([]);
  const [roteurs, setRoteurs] = useState<EmployeeGASFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const [sitesData, gapsData, assignmentsData, roteursData] = await Promise.all([
          window.electronAPI.getSitesGAS(),
          window.electronAPI.getSiteCoverageGaps({ dateDebut: firstDay, dateFin: lastDay }),
          window.electronAPI.getRoteurAssignments({ dateDebut: firstDay, dateFin: lastDay }),
          window.electronAPI.getRoteurs({ statut: 'ACTIF' })
        ]);

        setSites(sitesData?.filter(s => s.est_actif) || []);
        setCoverageGaps(gapsData || []);
        setRoteurAssignments(assignmentsData || []);
        setRoteurs(roteursData || []);
      }
    } catch (error) {
      console.error('Error loading planning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDay = firstDay.getDay();
    const days: CalendarDay[] = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        coverageGaps: getGapsByDate(date),
        roteurAssignments: getAssignmentsByDate(date)
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        coverageGaps: getGapsByDate(date),
        roteurAssignments: getAssignmentsByDate(date)
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        coverageGaps: getGapsByDate(date),
        roteurAssignments: getAssignmentsByDate(date)
      });
    }
    
    return days;
  };

  const getGapsByDate = (date: Date): CoverageGap[] => {
    const dateStr = date.toISOString().split('T')[0];
    return coverageGaps.filter(gap => {
      if (selectedSite !== 'all' && gap.site_id !== selectedSite) return false;
      const start = new Date(gap.date_debut);
      const end = new Date(gap.date_fin);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });
  };

  const getAssignmentsByDate = (date: Date): AffectationRoteur[] => {
    const dateStr = date.toISOString().split('T')[0];
    return roteurAssignments.filter(assignment => {
      if (selectedSite !== 'all' && assignment.site_id !== selectedSite) return false;
      const start = new Date(assignment.date_debut);
      const end = new Date(assignment.date_fin);
      const current = new Date(dateStr);
      return current >= start && current <= end && assignment.statut !== 'ANNULE';
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Calculate statistics
  const totalAssignments = roteurAssignments.filter(a => a.statut !== 'ANNULE').length;
  const uncoveredGaps = coverageGaps.filter(gap => {
    return !roteurAssignments.some(assignment => 
      assignment.site_id === gap.site_id &&
      assignment.demande_conge_id === gap.demande_conge_id &&
      assignment.statut !== 'ANNULE'
    );
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Calendrier de Planning</h2>
            <p className="text-sm text-gray-500">Gestion des couvertures et affectations rôteurs</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.nom_site}</option>
              ))}
            </select>
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Aujourd'hui
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center capitalize">
                {formatMonthYear(currentDate)}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sites actifs</p>
                <p className="text-2xl font-bold text-gray-900">{sites.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Besoins de couverture</p>
                <p className="text-2xl font-bold text-gray-900">{uncoveredGaps}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rôteurs assignés</p>
                <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rôteurs disponibles</p>
                <p className="text-2xl font-bold text-gray-900">{roteurs.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map(day => (
            <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const hasGaps = day.coverageGaps.length > 0;
            const hasAssignments = day.roteurAssignments.length > 0;
            const uncovered = day.coverageGaps.filter(gap => 
              !day.roteurAssignments.some(a => a.demande_conge_id === gap.demande_conge_id)
            ).length;

            return (
              <div
                key={index}
                onClick={() => (hasGaps || hasAssignments) && setSelectedDay(day)}
                className={`
                  min-h-[100px] border-b border-r p-2 transition-colors
                  ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                  ${isToday(day.date) ? 'bg-blue-50' : ''}
                  ${(hasGaps || hasAssignments) ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`
                    text-sm font-medium
                    ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                    ${isToday(day.date) ? 'text-blue-600 font-bold' : ''}
                  `}>
                    {day.date.getDate()}
                  </span>
                  {(hasGaps || hasAssignments) && (
                    <div className="flex items-center gap-1">
                      {uncovered > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                          {uncovered}
                        </span>
                      )}
                      {hasAssignments && (
                        <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                          {day.roteurAssignments.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Coverage indicators */}
                <div className="space-y-1">
                  {uncovered > 0 && (
                    <div className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Besoin couverture</span>
                    </div>
                  )}
                  {hasAssignments && (
                    <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Rôteur assigné</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm">
        <span className="font-medium text-gray-700">Légende:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
          <span className="text-gray-600">Besoin de couverture</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
          <span className="text-gray-600">Rôteur assigné</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Planning du {selectedDay.date.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Coverage Gaps */}
            {selectedDay.coverageGaps.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Besoins de Couverture ({selectedDay.coverageGaps.length})
                </h4>
                <div className="space-y-3">
                  {selectedDay.coverageGaps.map((gap, idx) => {
                    const isAssigned = selectedDay.roteurAssignments.some(
                      a => a.demande_conge_id === gap.demande_conge_id
                    );
                    return (
                      <div key={idx} className={`border rounded-lg p-4 ${isAssigned ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{gap.site_nom}</p>
                            <p className="text-sm text-gray-600">{gap.client_nom}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Remplacer: {gap.employe_nom}
                            </p>
                            <p className="text-sm text-gray-500">
                              Période: {new Date(gap.date_debut).toLocaleDateString('fr-FR')} - {new Date(gap.date_fin).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          {!isAssigned && onAssignRoteur && (
                            <button
                              onClick={() => {
                                setSelectedDay(null);
                                onAssignRoteur(gap);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                              Assigner Rôteur
                            </button>
                          )}
                          {isAssigned && (
                            <span className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Assigné
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rôteur Assignments */}
            {selectedDay.roteurAssignments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Rôteurs Assignés ({selectedDay.roteurAssignments.length})
                </h4>
                <div className="space-y-3">
                  {selectedDay.roteurAssignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{assignment.roteur_nom}</p>
                          <p className="text-sm text-gray-600">{assignment.site_nom}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Poste: {assignment.poste === 'JOUR' ? 'Jour' : 'Nuit'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Période: {new Date(assignment.date_debut).toLocaleDateString('fr-FR')} - {new Date(assignment.date_fin).toLocaleDateString('fr-FR')}
                          </p>
                          {assignment.notes && (
                            <p className="text-sm text-gray-600 mt-2">Note: {assignment.notes}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          assignment.statut === 'PLANIFIE' ? 'bg-blue-100 text-blue-800' :
                          assignment.statut === 'EN_COURS' ? 'bg-green-100 text-green-800' :
                          assignment.statut === 'TERMINE' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assignment.statut === 'PLANIFIE' ? 'Planifié' :
                           assignment.statut === 'EN_COURS' ? 'En cours' :
                           assignment.statut === 'TERMINE' ? 'Terminé' : 'Annulé'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDay.coverageGaps.length === 0 && selectedDay.roteurAssignments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune activité pour cette date</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningCalendar;
