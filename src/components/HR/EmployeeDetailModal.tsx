import React, { useState, useEffect } from 'react';
import { X, Edit, MapPin, Phone, Mail, Calendar, Building, Clock, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { EmployeeGASFull, HistoriqueDeployement, CongeProvision, Equipement, ActionDisciplinaire } from '../../types';
import DeploymentHistory from './DeploymentHistory';

interface EmployeeDetailModalProps {
  employee: EmployeeGASFull;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  showPayments?: boolean; // Optional prop to control payment functionality
}

type TabType = 'profile' | 'deployments' | 'leave' | 'equipment' | 'disciplinary' | 'payments';

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, onClose, onEdit, onRefresh, showPayments = true }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [deployments, setDeployments] = useState<HistoriqueDeployement[]>([]);
  const [leaveProvisions, setLeaveProvisions] = useState<CongeProvision[]>([]);
  const [equipment, setEquipment] = useState<Equipement[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<ActionDisciplinaire[]>([]);
  const [unpaidSalaries, setUnpaidSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<any>(null);

  useEffect(() => {
    loadDetails();
  }, [employee.id]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [details, deps, provisions, equip, disciplinary, unpaid] = await Promise.all([
          window.electronAPI.getEmployeeGAS(employee.id),
          window.electronAPI.getEmployeeDeployments(employee.id),
          window.electronAPI.getLeaveProvisions({ employeId: employee.id }),
          window.electronAPI.getEmployeeEquipment(employee.id),
          window.electronAPI.getEmployeeDisciplinaryHistory(employee.id),
          window.electronAPI.getSalairesImpayes({ employe_id: employee.id })
        ]);
        setEmployeeDetails(details);
        setDeployments(deps || []);
        setLeaveProvisions(provisions || []);
        setEquipment(equip || []);
        setDisciplinaryActions(disciplinary || []);
        setUnpaidSalaries(unpaid || []);
      }
    } catch (error) {
      console.error('Error loading employee details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'ACTIF': 'bg-green-100 text-green-800',
      'INACTIF': 'bg-gray-100 text-gray-800',
      'SUSPENDU': 'bg-yellow-100 text-yellow-800',
      'TERMINE': 'bg-red-100 text-red-800'
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Profil', icon: Building },
    ...(showPayments ? [{ id: 'payments' as TabType, label: 'Paiements', icon: DollarSign }] : []),
    { id: 'deployments' as TabType, label: 'Déploiements', icon: MapPin },
    { id: 'leave' as TabType, label: 'Congés', icon: Calendar },
    { id: 'equipment' as TabType, label: 'Équipements', icon: Package },
    { id: 'disciplinary' as TabType, label: 'Disciplinaire', icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
              {employee.nom_complet.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{employee.nom_complet}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{employee.matricule}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatutBadge(employee.statut)}`}>
                  {employee.statut}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Informations Personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Date de Naissance</p>
                          <p className="text-sm font-medium">{formatDate(employee.date_naissance)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Téléphone</p>
                          <p className="text-sm font-medium">{employee.telephone || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium">{employee.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Adresse</p>
                          <p className="text-sm font-medium">{employee.adresse || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employment Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Informations d'Emploi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Date d'Embauche</p>
                          <p className="text-sm font-medium">{formatDate(employee.date_embauche)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Catégorie</p>
                          <p className="text-sm font-medium">{employee.categorie}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Site Affecté</p>
                          <p className="text-sm font-medium">{employee.site_nom || 'Non affecté'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Mode de Rémunération</p>
                          <p className="text-sm font-medium">{employee.mode_remuneration}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payroll Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Informations de Paie</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500">
                          {employee.mode_remuneration === 'MENSUEL' ? 'Salaire de Base' : 'Taux Journalier'}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {(employee.mode_remuneration === 'MENSUEL' ? employee.salaire_base : employee.taux_journalier).toLocaleString()} USD
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500">Banque</p>
                        <p className="text-sm font-medium">{employee.banque_nom || '-'}</p>
                        <p className="text-xs text-gray-400">{employee.banque_compte || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Deployment */}
                  {employeeDetails?.currentDeployment && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Déploiement Actuel</h3>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">{employeeDetails.currentDeployment.nom_site}</p>
                            <p className="text-sm text-blue-700">{employeeDetails.currentDeployment.client_nom}</p>
                            <p className="text-xs text-blue-600">
                              Depuis le {formatDate(employeeDetails.currentDeployment.date_debut)} • Poste: {employeeDetails.currentDeployment.poste}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'deployments' && (
                <DeploymentHistory
                  employeId={employee.id}
                  employeeName={employee.nom_complet}
                  deployments={deployments}
                  onRefresh={loadDetails}
                />
              )}

              {showPayments && activeTab === 'payments' && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-xs text-red-600 font-medium uppercase">Total Impayé</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">
                        ${unpaidSalaries.reduce((sum, s) => sum + s.montant_restant, 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {unpaidSalaries.filter(s => s.statut !== 'PAYE_TOTAL').length} période(s)
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-xs text-yellow-600 font-medium uppercase">Partiellement Payé</p>
                      <p className="text-2xl font-bold text-yellow-700 mt-1">
                        ${unpaidSalaries.filter(s => s.statut === 'PAYE_PARTIEL').reduce((sum, s) => sum + s.montant_paye, 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {unpaidSalaries.filter(s => s.statut === 'PAYE_PARTIEL').length} période(s)
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-green-600 font-medium uppercase">Total Payé</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        ${unpaidSalaries.reduce((sum, s) => sum + s.montant_paye, 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {unpaidSalaries.filter(s => s.statut === 'PAYE_TOTAL').length} période(s)
                      </p>
                    </div>
                  </div>

                  {/* Unpaid Salaries List */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Salaires en Attente</h3>
                    {unpaidSalaries.filter(s => s.statut !== 'PAYE_TOTAL').length > 0 ? (
                      <div className="space-y-3">
                        {unpaidSalaries
                          .filter(s => s.statut !== 'PAYE_TOTAL')
                          .sort((a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime())
                          .map((salary) => {
                            const echeanceDate = new Date(salary.date_echeance);
                            const periodMonth = echeanceDate.getMonth() === 0 ? 12 : echeanceDate.getMonth();
                            const periodYear = echeanceDate.getMonth() === 0 ? echeanceDate.getFullYear() - 1 : echeanceDate.getFullYear();
                            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                            
                            return (
                              <div key={salary.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-gray-900">
                                        {monthNames[periodMonth - 1]} {periodYear}
                                      </span>
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                        salary.statut === 'IMPAYE' ? 'bg-red-100 text-red-800' :
                                        salary.statut === 'PAYE_PARTIEL' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {salary.statut.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-gray-500">Montant Net Dû</p>
                                        <p className="font-medium">${salary.montant_net_du.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Déjà Payé</p>
                                        <p className="font-medium text-green-600">${salary.montant_paye.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Restant</p>
                                        <p className="font-medium text-red-600">${salary.montant_restant.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Échéance</p>
                                        <p className="font-medium">{formatDate(salary.date_echeance)}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedSalary(salary);
                                      setShowPaymentModal(true);
                                    }}
                                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                  >
                                    Payer
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucun salaire en attente de paiement</p>
                      </div>
                    )}
                  </div>

                  {/* Payment History */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Historique des Paiements</h3>
                    {unpaidSalaries.filter(s => s.statut === 'PAYE_TOTAL').length > 0 ? (
                      <div className="space-y-2">
                        {unpaidSalaries
                          .filter(s => s.statut === 'PAYE_TOTAL')
                          .sort((a, b) => new Date(b.date_echeance).getTime() - new Date(a.date_echeance).getTime())
                          .map((salary) => {
                            const echeanceDate = new Date(salary.date_echeance);
                            const periodMonth = echeanceDate.getMonth() === 0 ? 12 : echeanceDate.getMonth();
                            const periodYear = echeanceDate.getMonth() === 0 ? echeanceDate.getFullYear() - 1 : echeanceDate.getFullYear();
                            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                            
                            return (
                              <div key={salary.id} className="border rounded-lg p-3 bg-green-50 border-green-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                      <DollarSign className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {monthNames[periodMonth - 1]} {periodYear}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Payé le {formatDate(salary.modifie_le)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-green-700">${salary.montant_net_du.toFixed(2)}</p>
                                    <p className="text-xs text-green-600">{salary.devise}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Aucun paiement effectué</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'leave' && (
                <div className="space-y-6">
                  {/* Leave Balance */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Solde de Congés</h3>
                    {leaveProvisions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {leaveProvisions.map((prov) => (
                          <div key={prov.id} className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">Année {prov.annee}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Acquis:</span>
                                <span className="font-medium">{prov.jours_acquis} jours</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Pris:</span>
                                <span className="font-medium">{prov.jours_pris} jours</span>
                              </div>
                              <div className="flex justify-between text-sm font-semibold text-blue-600 pt-1 border-t">
                                <span>Restant:</span>
                                <span>{(prov.jours_acquis - prov.jours_pris).toFixed(1)} jours</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Aucune provision de congé enregistrée</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'equipment' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Équipements Assignés</h3>
                  {equipment.length > 0 ? (
                    <div className="space-y-3">
                      {equipment.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{item.designation}</p>
                              <p className="text-sm text-gray-500">Code: {item.code_equipement}</p>
                              {item.numero_serie && (
                                <p className="text-xs text-gray-500">N° Série: {item.numero_serie}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  item.categorie === 'UNIFORME' ? 'bg-blue-100 text-blue-800' :
                                  item.categorie === 'RADIO' ? 'bg-purple-100 text-purple-800' :
                                  item.categorie === 'TORCHE' ? 'bg-yellow-100 text-yellow-800' :
                                  item.categorie === 'PR24' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.categorie}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  item.etat === 'NEUF' || item.etat === 'BON' ? 'bg-green-100 text-green-800' :
                                  item.etat === 'USAGE' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {item.etat}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucun équipement assigné</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'disciplinary' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Historique Disciplinaire</h3>
                  {disciplinaryActions.length > 0 ? (
                    <div className="space-y-3">
                      {disciplinaryActions.map((action) => (
                        <div key={action.id} className={`border rounded-lg p-4 ${
                          action.type_action === 'LICENCIEMENT' ? 'border-red-300 bg-red-50' :
                          action.type_action === 'SUSPENSION' ? 'border-orange-300 bg-orange-50' :
                          'border-yellow-300 bg-yellow-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  action.type_action === 'LICENCIEMENT' ? 'bg-red-100 text-red-800' :
                                  action.type_action === 'SUSPENSION' ? 'bg-orange-100 text-orange-800' :
                                  action.type_action === 'AVERTISSEMENT_ECRIT' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {action.type_action.replace(/_/g, ' ')}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  action.statut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                                  action.statut === 'REJETE' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {action.statut.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 font-medium">
                                Date: {formatDate(action.date_incident)}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">{action.description_incident}</p>
                              {action.impact_financier && (
                                <p className="text-sm text-red-600 mt-2 font-medium">
                                  Déduction: {action.montant_deduction} USD
                                  {action.jours_suspension > 0 && ` (${action.jours_suspension} jours)`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucune action disciplinaire</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSalary && (
        <PaymentModal
          salary={selectedSalary}
          employeeName={employee.nom_complet}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedSalary(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedSalary(null);
            loadDetails();
          }}
        />
      )}
    </div>
  );
};

// Payment Modal Component
interface PaymentModalProps {
  salary: any;
  employeeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ salary, employeeName, onClose, onSuccess }) => {
  const [montantPaye, setMontantPaye] = useState(salary.montant_restant.toString());
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]);
  const [modePaiement, setModePaiement] = useState('ESPECES');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const montant = parseFloat(montantPaye);
    if (isNaN(montant) || montant <= 0) {
      setError('Montant invalide');
      return;
    }

    if (montant > salary.montant_restant) {
      setError('Le montant dépasse le montant restant');
      return;
    }

    try {
      setLoading(true);
      await window.electronAPI.payerSalaire({
        salaire_impaye_id: salary.id,
        montant_paye: montant,
        devise: salary.devise,
        date_paiement: datePaiement,
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement || null,
        compte_tresorerie_id: null, // Not using treasury account
        effectue_par: 'user',
        notes: notes || null
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement du paiement');
    } finally {
      setLoading(false);
    }
  };

  const echeanceDate = new Date(salary.date_echeance);
  const periodMonth = echeanceDate.getMonth() === 0 ? 12 : echeanceDate.getMonth();
  const periodYear = echeanceDate.getMonth() === 0 ? echeanceDate.getFullYear() - 1 : echeanceDate.getFullYear();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Enregistrer un Paiement</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Salary Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-medium text-blue-900">{employeeName}</p>
            <p className="text-xs text-blue-700 mt-1">
              Période: {monthNames[periodMonth - 1]} {periodYear}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <p className="text-blue-600">Montant Dû</p>
                <p className="font-semibold text-blue-900">${salary.montant_net_du.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-600">Restant</p>
                <p className="font-semibold text-red-600">${salary.montant_restant.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant à Payer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={montantPaye}
                onChange={(e) => setMontantPaye(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setMontantPaye(salary.montant_restant.toString())}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
            >
              Payer le montant total
            </button>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de Paiement <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode de Paiement <span className="text-red-500">*</span>
            </label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="ESPECES">Espèces</option>
              <option value="VIREMENT">Virement Bancaire</option>
              <option value="CHEQUE">Chèque</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
          </div>

          {/* Payment Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence de Paiement
            </label>
            <input
              type="text"
              value={referencePaiement}
              onChange={(e) => setReferencePaiement(e.target.value)}
              placeholder="N° de transaction, chèque, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes additionnelles..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
