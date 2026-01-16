import React, { useState, useEffect } from 'react';
import { X, Edit, MapPin, Phone, Mail, Calendar, Building, Clock, Package, AlertTriangle } from 'lucide-react';
import { EmployeeGASFull, HistoriqueDeployement, CongeProvision, Equipement, ActionDisciplinaire } from '../../types';
import DeploymentHistory from './DeploymentHistory';

interface EmployeeDetailModalProps {
  employee: EmployeeGASFull;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

type TabType = 'profile' | 'deployments' | 'leave' | 'equipment' | 'disciplinary';

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, onClose, onEdit, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [deployments, setDeployments] = useState<HistoriqueDeployement[]>([]);
  const [leaveProvisions, setLeaveProvisions] = useState<CongeProvision[]>([]);
  const [equipment, setEquipment] = useState<Equipement[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<ActionDisciplinaire[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [employee.id]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [details, deps, provisions, equip, disciplinary] = await Promise.all([
          window.electronAPI.getEmployeeGAS(employee.id),
          window.electronAPI.getEmployeeDeployments(employee.id),
          window.electronAPI.getLeaveProvisions({ employeId: employee.id }),
          window.electronAPI.getEmployeeEquipment(employee.id),
          window.electronAPI.getEmployeeDisciplinaryHistory(employee.id)
        ]);
        setEmployeeDetails(details);
        setDeployments(deps || []);
        setLeaveProvisions(provisions || []);
        setEquipment(equip || []);
        setDisciplinaryActions(disciplinary || []);
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
    </div>
  );
};

export default EmployeeDetailModal;
