import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Search, Plus, Filter, Eye, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Employee } from '../../types';

interface EmployeeListProps {
  onAddEmployee: () => void;
  onViewEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
}

export default function EmployeeList({ onAddEmployee, onViewEmployee, onEditEmployee }: EmployeeListProps) {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredEmployees = state.employees.filter(employee => {
    const matchesSearch = 
      employee.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.employment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'actif';
      case 'inactive':
        return 'inactif';
      case 'terminated':
        return 'terminé';
      default:
        return status;
    }
  };

  const getExpiringCertifications = (employee: Employee) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return employee.certifications.filter(cert => {
      const expiryDate = new Date(cert.expiryDate);
      return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
    }).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Employés</h2>
          <p className="text-gray-600 mt-1">Gérez votre personnel de sécurité et leurs informations</p>
        </div>
        <button
          onClick={onAddEmployee}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un Employé</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher des employés..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les Statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => {
          const expiringCerts = getExpiringCertifications(employee);
          
          return (
            <div key={employee.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {employee.personalInfo.firstName[0]}{employee.personalInfo.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">#{employee.employeeNumber}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.employment.status)}`}>
                  {getStatusText(employee.employment.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">{employee.personalInfo.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{employee.personalInfo.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{employee.personalInfo.address.city}, {employee.personalInfo.address.state}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{employee.employment.position}</p>
                  <p className="text-sm text-gray-600">{employee.employment.department}</p>
                </div>
                {expiringCerts > 0 && (
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    {expiringCerts} cert{expiringCerts > 1 ? 's' : ''} expirant{expiringCerts > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onViewEmployee(employee)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>Voir</span>
                </button>
                <button
                  onClick={() => onEditEmployee(employee)}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Essayez d\'ajuster vos critères de recherche ou de filtre.'
              : 'Commencez par ajouter votre premier employé.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={onAddEmployee}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter le Premier Employé
            </button>
          )}
        </div>
      )}
    </div>
  );
}