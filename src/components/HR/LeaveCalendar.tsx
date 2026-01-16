import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, AlertCircle } from 'lucide-react';
import { DemandeConge, EmployeeGASFull } from '../../types';

interface LeaveCalendarProps {
  // Future: onCoverageGapClick for rôteur assignment integration
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  leaves: DemandeConge[];
  coverageGaps: number;
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState<DemandeConge[]>([]);
  const [employees, setEmployees] = useState<EmployeeGASFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [requestsData, employeesData] = await Promise.all([
          window.electronAPI.getLeaveRequests({ statut: 'APPROUVE' }),
          window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' })
        ]);
        setRequests(requestsData || []);
        setEmployees(employeesData || []);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
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
        leaves: getLeavesByDate(date),
        coverageGaps: 0
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        leaves: getLeavesByDate(date),
        coverageGaps: 0
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        leaves: getLeavesByDate(date),
        coverageGaps: 0
      });
    }
    
    return days;
  };

  const getLeavesByDate = (date: Date): DemandeConge[] => {
    const dateStr = date.toISOString().split('T')[0];
    return requests.filter(request => {
      const start = new Date(request.date_debut);
      const end = new Date(request.date_fin);
      const current = new Date(dateStr);
      return current >= start && current <= end;
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'ANNUEL': 'bg-blue-500',
      'MALADIE': 'bg-red-500',
      'MATERNITE': 'bg-pink-500',
      'PATERNITE': 'bg-purple-500',
      'SANS_SOLDE': 'bg-gray-500',
      'EXCEPTIONNEL': 'bg-yellow-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ANNUEL': 'Congé annuel',
      'MALADIE': 'Congé maladie',
      'MATERNITE': 'Congé maternité',
      'PATERNITE': 'Congé paternité',
      'SANS_SOLDE': 'Sans solde',
      'EXCEPTIONNEL': 'Exceptionnel'
    };
    return labels[type] || type;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Calculate statistics
  const currentMonthLeaves = requests.filter(request => {
    const start = new Date(request.date_debut);
    const end = new Date(request.date_fin);
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return (start <= monthEnd && end >= monthStart);
  });

  const employeesOnLeaveToday = days.find(d => isToday(d.date))?.leaves.length || 0;

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
            <h2 className="text-lg font-semibold text-gray-900">Calendrier des Congés</h2>
            <p className="text-sm text-gray-500">Vue d'ensemble des absences approuvées</p>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ce mois</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonthLeaves.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">En congé aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">{employeesOnLeaveToday}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Employés actifs</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
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
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() => day.leaves.length > 0 && setSelectedDay(day)}
              className={`
                min-h-[100px] border-b border-r p-2 cursor-pointer transition-colors
                ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}
                ${isToday(day.date) ? 'bg-blue-50' : ''}
                ${day.leaves.length > 0 ? 'cursor-pointer' : 'cursor-default'}
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
                {day.leaves.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                    {day.leaves.length}
                  </span>
                )}
              </div>
              
              {/* Leave indicators */}
              <div className="space-y-1">
                {day.leaves.slice(0, 3).map((leave, idx) => (
                  <div
                    key={idx}
                    className={`text-xs px-2 py-1 rounded text-white truncate ${getTypeColor(leave.type_conge)}`}
                    title={(leave as any).nom_employe}
                  >
                    {(leave as any).nom_employe?.split(' ')[0] || 'Employé'}
                  </div>
                ))}
                {day.leaves.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{day.leaves.length - 3} autre(s)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm">
        <span className="font-medium text-gray-700">Légende:</span>
        {['ANNUEL', 'MALADIE', 'MATERNITE', 'PATERNITE', 'SANS_SOLDE', 'EXCEPTIONNEL'].map(type => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${getTypeColor(type)}`}></div>
            <span className="text-gray-600">{getTypeLabel(type)}</span>
          </div>
        ))}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Congés du {selectedDay.date.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {selectedDay.leaves.map((leave) => (
                <div key={leave.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {(leave as any).nom_employe?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{(leave as any).nom_employe || 'Employé'}</p>
                        <p className="text-sm text-gray-500">{getTypeLabel(leave.type_conge)}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Du {new Date(leave.date_debut).toLocaleDateString('fr-FR')} 
                          {' '}au {new Date(leave.date_fin).toLocaleDateString('fr-FR')}
                        </p>
                        {leave.motif && (
                          <p className="text-sm text-gray-600 mt-2">Motif: {leave.motif}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded text-white ${getTypeColor(leave.type_conge)}`}>
                      {leave.nombre_jours} jour(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedDay.coverageGaps > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Besoin de couverture</p>
                    <p className="text-sm text-yellow-700">
                      {selectedDay.coverageGaps} site(s) nécessite(nt) un rôteur pour cette date
                    </p>
                  </div>
                </div>
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

export default LeaveCalendar;
