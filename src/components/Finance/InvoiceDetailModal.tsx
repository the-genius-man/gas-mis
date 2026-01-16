import { useState, useEffect, useMemo } from 'react';
import { 
  X, FileText, Building2, Calendar, MapPin, 
  CreditCard, Clock, Trash2, Plus,
  User, Phone, Mail, Printer, Download
} from 'lucide-react';
import { FactureGAS, ClientGAS, PaiementGAS, ModePaiement, SiteGAS } from '../../types';
import { exportToPDF } from '../../utils/pdfExport';
import InvoicePrintTemplateNew from './InvoicePrintTemplateNew';

interface FactureWithPayments extends FactureGAS {
  totalPaye: number;
  soldeRestant: number;
}

interface InvoiceDetailModalProps {
  facture: FactureWithPayments;
  client?: ClientGAS;
  onClose: () => void;
  onPayment: () => void;
  onRefresh: () => void;
}

// Check if running in Electron
const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

const getModePaiementLabel = (mode: ModePaiement) => {
  switch (mode) {
    case 'ESPECES': return 'Espèces';
    case 'VIREMENT': return 'Virement';
    case 'CHEQUE': return 'Chèque';
    case 'MOBILE_MONEY': return 'Mobile Money';
    default: return mode;
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'BROUILLON':
      return { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' };
    case 'ENVOYE':
      return { label: 'Envoyé', color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50' };
    case 'PAYE_PARTIEL':
      return { label: 'Payé Partiel', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50' };
    case 'PAYE_TOTAL':
      return { label: 'Payé Total', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50' };
    case 'ANNULE':
      return { label: 'Annulé', color: 'bg-red-100 text-red-800', bgColor: 'bg-red-50' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' };
  }
};

export default function InvoiceDetailModal({ facture, client, onClose, onPayment, onRefresh }: InvoiceDetailModalProps) {
  const electronMode = useMemo(() => isElectron(), []);
  const [paiements, setPaiements] = useState<PaiementGAS[]>([]);
  const [sites, setSites] = useState<SiteGAS[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'paiements'>('details');
  const [showPrintTemplate, setShowPrintTemplate] = useState(false);

  useEffect(() => {
    loadPaiements();
    loadSites();
  }, [facture.id]);

  const loadPaiements = async () => {
    if (!electronMode || !window.electronAPI) return;
    
    setLoading(true);
    try {
      const data = await window.electronAPI.getPaiementsGAS(facture.id);
      setPaiements(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    if (!electronMode || !window.electronAPI) return;
    
    try {
      const data = await window.electronAPI.getSitesGAS();
      setSites(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error);
    }
  };

  const handleDeletePaiement = async (paiementId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce paiement ?')) return;

    try {
      if (window.electronAPI) {
        await window.electronAPI.deletePaiementGAS(paiementId);
        await loadPaiements();
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du paiement');
    }
  };

  const statusConfig = getStatusConfig(facture.statut_paiement);
  const canPay = facture.statut_paiement !== 'PAYE_TOTAL' && 
                 facture.statut_paiement !== 'ANNULE' && 
                 facture.statut_paiement !== 'BROUILLON';

  const handleExportPDF = async () => {
    try {
      // Show the hidden print template
      setShowPrintTemplate(true);
      
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the invoice template element
      const invoiceElement = document.querySelector('.invoice-page') as HTMLElement;
      if (!invoiceElement) {
        alert('Erreur: Impossible de trouver le template de facture');
        setShowPrintTemplate(false);
        return;
      }

      const filename = `Facture_${facture.numero_facture}.pdf`;
      await exportToPDF(invoiceElement, filename, {
        orientation: 'portrait',
        format: 'a4',
        quality: 0.95
      });
      
      // Hide the print template
      setShowPrintTemplate(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
      setShowPrintTemplate(false);
    }
  };
  
  const progressPercent = facture.montant_total_du_client > 0 
    ? Math.min(100, (facture.totalPaye / facture.montant_total_du_client) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col invoice-detail-content">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${statusConfig.bgColor}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{facture.numero_facture}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                <span className="text-sm text-gray-600">
                  Émise le {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-white/50 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Payment Progress Bar */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression du paiement</span>
            <span className="text-sm text-gray-600">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                progressPercent >= 100 ? 'bg-green-500' : 
                progressPercent > 0 ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-600 font-medium">
              Payé: {facture.totalPaye.toLocaleString()} {facture.devise}
            </span>
            <span className="text-orange-600 font-medium">
              Reste: {facture.soldeRestant.toLocaleString()} {facture.devise}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Détails de la Facture
            </button>
            <button
              onClick={() => setActiveTab('paiements')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'paiements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historique des Paiements
              {paiements.length > 0 && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                  {paiements.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Client Info */}
              {client && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Informations Client
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{client.nom_entreprise}</p>
                      <p className="text-sm text-gray-500">{client.type_client === 'MORALE' ? 'Personne Morale' : 'Personne Physique'}</p>
                    </div>
                    <div className="space-y-1">
                      {client.contact_nom && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <User className="h-3 w-3" /> {client.contact_nom}
                        </p>
                      )}
                      {client.telephone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="h-3 w-3" /> {client.telephone}
                        </p>
                      )}
                      {client.contact_email && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="h-3 w-3" /> {client.contact_email}
                        </p>
                      )}
                    </div>
                  </div>
                  {client.adresse_facturation && (
                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> {client.adresse_facturation}
                    </p>
                  )}
                </div>
              )}

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Période</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {facture.periode_mois}/{facture.periode_annee}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Date d'Émission</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(facture.date_emission).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {facture.date_echeance && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Date d'Échéance</label>
                      <p className={`flex items-center gap-2 ${
                        new Date(facture.date_echeance) < new Date() && facture.statut_paiement !== 'PAYE_TOTAL'
                          ? 'text-red-600 font-medium'
                          : 'text-gray-900'
                      }`}>
                        <Clock className="h-4 w-4" />
                        {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                        {new Date(facture.date_echeance) < new Date() && facture.statut_paiement !== 'PAYE_TOTAL' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">En retard</span>
                        )}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Gardiens Facturés</label>
                    <p className="text-gray-900">{facture.total_gardiens_factures} gardien(s)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Montant HT Prestation</span>
                      <span className="font-medium">{facture.montant_ht_prestation.toLocaleString()} {facture.devise}</span>
                    </div>
                    {facture.montant_frais_supp > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Frais Supplémentaires</span>
                        <span className="font-medium">{facture.montant_frais_supp.toLocaleString()} {facture.devise}</span>
                      </div>
                    )}
                    {facture.creances_anterieures > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Créances Antérieures</span>
                        <span className="font-medium text-orange-600">{facture.creances_anterieures.toLocaleString()} {facture.devise}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Total TTC</span>
                        <span className="font-bold text-lg">{facture.montant_total_ttc.toLocaleString()} {facture.devise}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">Montant Dû</span>
                        <span className="font-bold text-xl text-blue-600">{facture.montant_total_du_client.toLocaleString()} {facture.devise}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {facture.notes_facture && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Notes</h4>
                  <p className="text-sm text-yellow-700">{facture.notes_facture}</p>
                </div>
              )}

              {facture.motif_frais_supp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Motif des Frais Supplémentaires</h4>
                  <p className="text-sm text-blue-700">{facture.motif_frais_supp}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement des paiements...</p>
                </div>
              ) : paiements.length > 0 ? (
                <div className="space-y-3">
                  {paiements.map((paiement) => (
                    <div key={paiement.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {paiement.montant_paye.toLocaleString()} {paiement.devise}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(paiement.date_paiement).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {getModePaiementLabel(paiement.mode_paiement)}
                              </span>
                              {paiement.reference_paiement && (
                                <span className="text-xs text-gray-500">
                                  Réf: {paiement.reference_paiement}
                                </span>
                              )}
                            </div>
                            {paiement.banque_origine && (
                              <p className="text-xs text-gray-500 mt-1">
                                Banque: {paiement.banque_origine}
                              </p>
                            )}
                            {paiement.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {paiement.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePaiement(paiement.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer ce paiement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun paiement enregistré</h3>
                  <p className="text-gray-600 mb-4">
                    Cette facture n'a pas encore reçu de paiement.
                  </p>
                  {canPay && (
                    <button
                      onClick={onPayment}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Enregistrer le Premier Paiement
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Fermer
            </button>
            {canPay && (
              <button
                onClick={onPayment}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Enregistrer un Paiement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Invoice Template for PDF Export */}
      {showPrintTemplate && (
        <div className="fixed inset-0 bg-white z-[200] overflow-auto" style={{ top: '-9999px', left: '-9999px' }}>
          <InvoicePrintTemplateNew
            invoices={[facture]}
            clients={client ? [client] : []}
            sites={sites}
          />
        </div>
      )}
    </div>
  );
}
