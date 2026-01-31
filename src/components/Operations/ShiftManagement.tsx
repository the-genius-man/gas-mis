import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Users, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Download
} from 'lucide-react';

interface Shift {
  id: string;
  site_id: string;
  site_nom: string;
  employee_id: string;
  employee_nom: string;
  date: string;
  shift_type: 'JOUR' | 'NUIT' | 'MIXTE';
  start_time: string;
  end_time: string;
  status: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  overtime_hours?: number;
  created_at: string;
}

interface ShiftTemplate {
  id: string;
  name: string;
  shift_type: 'JOUR' | 'NUIT' | 'MIXTE';
  start_time: string;
  end_time: string;
  duration_hours: number;
  break_duration: number;
  is_active: boolean;
}

const ShiftManagement: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSite, setFilterSite] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        // Load shifts for selected date
        const shiftsData = await window.electronAPI.getShifts?.({ date: selectedDate }) || [];
        const templatesData = await window.electronAPI.getShiftTemplates?.() || [];
        
        setShifts(shiftsData);
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error loading shift data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PLANIFIE': 'bg-blue-100 text-blue-800',
      'EN_COURS': 'bg-green-100 text-green-800',
      'TERMINE': 'bg-gray-100 text-gray-800',
      'ANNULE': 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getShiftTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      'JOUR': 'bg-yellow-100 text-yellow-800',
      'NUIT': 'bg-blue-100 text-blue-800',
      'MIXTE': 'bg-purple-100 text-purple-800',
    };
    return styles[type] || 'bg-gray-100 text-gray-800';
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
  };

  const calculateOvertime = (shift: Shift) => {
    if (!shift.check_in_time || !shift.check_out_time) return 0;
    
    const plannedDuration = calculateDuration(shift.start_time, shift.end_time);
    const actualDuration = calculateDuration(shift.check_in_time, shift.check_out_time);
    
    return Math.max(0, actualDuration - plannedDuration);
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSite = !filterSite || shift.site_id === filterSite;
    const matchesStatus = !filterStatus || shift.status === filterStatus;
    return matchesSite && matchesStatus;
  });

  const shiftStats = {
    total: filteredShifts.length,
    planned: filteredShifts.filter(s => s.status === 'PLANIFIE').length,
    inProgress: filteredShifts.filter(s => s.status === 'EN_COURS').length,
    completed: filteredShifts.filter(s => s.status === 'TERMINE').length,
    cancelled: filteredShifts.filter(s => s.status === 'ANNULE').length,
    totalOvertime: filteredShifts.reduce((total, shift) => total + calculateOvertime(shift), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Équipes</h2>
          <p className="text-sm text-gray-500">
            Planification et suivi des équipes de travail
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Équipe
          </button>
        </div>
      </div>

      {/* Filters and Date Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <select
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les sites</option>
              {/* Sites will be loaded dynamically */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{shiftStats.total}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Planifiées</p>
              <p className="text-2xl font-bold text-blue-600">{shiftStats.planned}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-green-600">{shiftStats.inProgress}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-gray-600">{shiftStats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Annulées</p>
              <p className="text-2xl font-bold text-red-600">{shiftStats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures Sup.</p>
              <p className="text-2xl font-bold text-orange-600">{shiftStats.totalOvertime.toFixed(1)}h</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Équipes du {new Date(selectedDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent / Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type / Horaires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pointage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée / H. Sup.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShifts.length > 0 ? (
                filteredShifts.map((shift) => {
                  const plannedDuration = calculateDuration(shift.start_time, shift.end_time);
                  const overtime = calculateOvertime(shift);
                  
                  return (
                    <tr key={shift.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {shift.employee_nom}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {shift.site_nom}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftTypeBadge(shift.shift_type)}`}>
                            {shift.shift_type}
                          </span>
                          <div className="text-sm text-gray-600">
                            {shift.start_time} - {shift.end_time}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            Entrée: {shift.check_in_time || '-'}
                          </div>
                          <div className="text-gray-600">
                            Sortie: {shift.check_out_time || '-'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {plannedDuration}h planifiées
                          </div>
                          {overtime > 0 && (
                            <div className="text-orange-600 font-medium">
                              +{overtime.toFixed(1)}h sup.
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(shift.status)}`}>
                          {shift.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingShift(shift)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucune équipe planifiée pour cette date</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Créer une nouvelle équipe
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Modèles d'Équipes</h3>
          <p className="text-sm text-gray-500">Modèles prédéfinis pour créer rapidement des équipes</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getShiftTypeBadge(template.shift_type)}`}>
                    {template.shift_type}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Horaires: {template.start_time} - {template.end_time}</div>
                  <div>Durée: {template.duration_hours}h</div>
                  <div>Pause: {template.break_duration}min</div>
                </div>
                <button className="mt-3 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Utiliser ce modèle
                </button>
              </div>
            ))}
            
            {/* Add Template Button */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-gray-400">
              <button className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-700">
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">Nouveau modèle</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;