import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Search,
  Filter,
  CreditCard,
  CheckCircle,
  Clock,
  User,
  Eye,
  X
} from 'lucide-react';
import { SalaireImpaye, PaiementSalaire } from '../../types';

export default function UnpaidSalariesManagement() {
  const [salairesImpayes, setSalairesImpayes] = useState<SalaireImpaye[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('');
  const [selectedSalaire, setSelectedSalaire] = useState<SalaireImpaye | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paiements, setPaiements] = useState<PaiementSalaire[]>([]);
  
  // Payment form state
  const [montantPaye, setMontantPaye] = useState('');
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]);
  const [modePaiement, setModePaiement] = useState<'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY'>('VIREMENT');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadSalairesImpayes();
  }, []);

  const loadSalairesImpayes = async () => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      alert('Mode Electron non disponible');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading salaires impayes...');
      const data = await window.electronAPI.getSalairesImpayes({});
      console.log('Salaires impayes loaded:', data);
      setSalairesImpayes(data);
    } catch (error) {
      console.error('Error loading unpaid salaries:', error);
      alert(`Erreur lors du chargement des salaires impayés:\n${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPaiements = async (salaireId: string) => {
    if (!window.electronAPI) return;
    
    try {
      const data = await window.electronAPI.getPaiementsSalaires(salaireId);
      setPaiements(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedSalaire || !window.electronAPI) return;
    
    const montant = parseFloat(montantPaye);
    if (isNaN(montant) || montant <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    
    if (montant > selectedSalaire.montant_restant) {
      alert(`Le montant ne peut pas dépasser le solde restant (${selectedSalaire.montant_restant.toFixed(2)} ${selectedSalaire.devise})`);
      return;
    }
    
    if (!confirm(`Confirmer le paiement de ${montant.toFixed(2)} ${selectedSalaire.devise} pour ${selectedSalaire.nom_complet}?`)) {
      return;
    }
    
    try {
      await window.electronAPI.payerSalaire({
        salaire_impaye_id: selectedSalaire.id,
        montant_paye: montant,
        devise: selectedSalaire.devise,
        date_paiement: datePaiement,
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement || undefined,
        notes: notes || undefined,
        effectue_par: 'current_user'
      });
      
      alert('Paiement enregistré avec succès!');
      setShowPaymentModal(false);
      resetPaymentForm();
      loadSalairesImpayes();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const resetPaymentForm = () => {
    setMontantPaye('');
    setDatePaiement(new Date().toISOString().split('T')[0]);
    setModePaiement('VIREMENT');
    setReferencePaiement('');
    setNotes('');
    setSelectedSalaire(null);
  };

  const openPaymentModal = (salaire: SalaireImpaye) => {
    setSelectedSalaire(salaire);
    setMontantPaye(salaire.montant_restant.toString());
    setShowPaymentModal(true);
  };

  const openHistoryModal = async (salaire: SalaireImpaye) => {
    setSelectedSalaire(salaire);
    await loadPaiements(salaire.id);
    setShowHistoryModal(true);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'IMPAYE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Impayé
          </span>
        );
      case 'PAYE_PARTIEL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            <Clock className="w-3 h-3" />
            Partiel
          </span>
        );
      case 'PAYE_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Payé
          </span>
        );
      default:
        return null;
    }
  };

  const filteredSalaires = salairesImpayes.filter(s => {
    if (searchTerm && !s.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !s.matricule.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterStatut && s.statut !== filterStatut) return false;
    if (filterPeriode && s.periode_paie_id !== filterPeriode) return false;
    return true;
  });

  const totalDu = filteredSalaires.reduce((sum, s) => sum + s.montant_net_du, 0);
  const totalPaye = filteredSalaires.reduce((sum, s) => sum + s.montant_paye, 0);
  const totalRestant = filteredSalaires.reduce((sum, s) => sum + s.montant_restant, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des salaires impayés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-7 w-7" />
          Salaires Impayés (Compte 422)
        </h2>
        <p className="text-gray-600 mt-1">Suivi des rémunérations dues au personnel</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Dû</p>
              <p className="text-2xl font-bold text-blue-900">{totalDu.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Payé</p>
              <p className="text-2xl font-bold text-green-900">{totalPaye.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Solde Restant</p>
              <p className="text-2xl font-bold text-red-900">{totalRestant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par nom ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="IMPAYE">Impayé</option>
          <option value="PAYE_PARTIEL">Paiement partiel</option>
          <option value="PAYE_TOTAL">Payé total</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant Dû</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payé</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Restant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échéance</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSalaires.map((salaire) => (
              <tr key={salaire.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{salaire.nom_complet}</div>
                      <div className="text-xs text-gray-500">{salaire.matricule}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {salaire.mois}/{salaire.annee}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  {salaire.montant_net_du.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {salaire.devise}
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-600">
                  {salaire.montant_paye.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {salaire.devise}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                  {salaire.montant_restant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {salaire.devise}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(salaire.date_echeance).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {getStatutBadge(salaire.statut)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {salaire.statut !== 'PAYE_TOTAL' && (
                      <button
                        onClick={() => openPaymentModal(salaire)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Enregistrer un paiement"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    {salaire.montant_paye > 0 && (
                      <button
                        onClick={() => openHistoryModal(salaire)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="Voir l'historique"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredSalaires.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Aucun salaire impayé trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSalaire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Enregistrer un Paiement</h3>
              <button
                onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Employé</p>
                <p className="font-medium text-gray-900">{selectedSalaire.nom_complet}</p>
                <p className="text-xs text-gray-500">{selectedSalaire.matricule}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600">Solde Restant</p>
                <p className="text-xl font-bold text-blue-900">
                  {selectedSalaire.montant_restant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {selectedSalaire.devise}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à Payer *
                </label>
                <input
                  type="number"
                  value={montantPaye}
                  onChange={(e) => setMontantPaye(e.target.value)}
                  step="0.01"
                  min="0"
                  max={selectedSalaire.montant_restant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de Paiement *
                </label>
                <input
                  type="date"
                  value={datePaiement}
                  onChange={(e) => setDatePaiement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode de Paiement *
                </label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="ESPECES">Espèces</option>
                  <option value="VIREMENT">Virement Bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence de Paiement
                </label>
                <input
                  type="text"
                  value={referencePaiement}
                  onChange={(e) => setReferencePaiement(e.target.value)}
                  placeholder="Ex: VIR-2026-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes optionnelles..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handlePayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Enregistrer le Paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedSalaire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Historique des Paiements</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employé</p>
                    <p className="font-medium text-gray-900">{selectedSalaire.nom_complet}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Période</p>
                    <p className="font-medium text-gray-900">{selectedSalaire.mois}/{selectedSalaire.annee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Montant Total Dû</p>
                    <p className="font-medium text-gray-900">
                      {selectedSalaire.montant_net_du.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {selectedSalaire.devise}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Solde Restant</p>
                    <p className="font-medium text-red-600">
                      {selectedSalaire.montant_restant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {selectedSalaire.devise}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {paiements.map((paiement, index) => (
                  <div key={paiement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Paiement #{index + 1}</span>
                      <span className="text-lg font-bold text-green-600">
                        {paiement.montant_paye.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {paiement.devise}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Mode:</span>
                        <span className="ml-2 text-gray-900">{paiement.mode_paiement}</span>
                      </div>
                      {paiement.reference_paiement && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Référence:</span>
                          <span className="ml-2 text-gray-900">{paiement.reference_paiement}</span>
                        </div>
                      )}
                      {paiement.notes && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Notes:</span>
                          <span className="ml-2 text-gray-900">{paiement.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {paiements.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Aucun paiement enregistré</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
