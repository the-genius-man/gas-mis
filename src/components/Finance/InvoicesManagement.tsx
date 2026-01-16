import { useEffect, useState, useMemo } from 'react';
import { 
  FileText, Plus, Search, Filter, DollarSign, Calendar, Building2,
  Edit, Trash2, AlertCircle, CheckCircle, Clock, XCircle, CreditCard, Send, CalendarDays, Printer, Download, FileSpreadsheet, Trash
} from 'lucide-react';
import { FactureGAS, ClientGAS, SiteGAS, StatutFacture } from '../../types';
import InvoiceForm from './InvoiceForm';
import PaymentForm from './PaymentForm';
import InvoiceDetailModal from './InvoiceDetailModal';
import BulkInvoiceWizard from './BulkInvoiceWizard';
import InvoicePrintView from './InvoicePrintView';
import InvoicePrintTemplateNew from './InvoicePrintTemplateNew';
import { exportMultipleToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';

// Check if running in Electron
const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

const getStatusConfig = (status: StatutFacture) => {
  switch (status) {
    case 'BROUILLON':
      return { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText };
    case 'ENVOYE':
      return { label: 'Envoyé', color: 'bg-blue-100 text-blue-800', icon: Clock };
    case 'PAYE_PARTIEL':
      return { label: 'Payé Partiel', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
    case 'PAYE_TOTAL':
      return { label: 'Payé Total', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    case 'ANNULE':
      return { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800', icon: FileText };
  }
};

interface FactureWithPayments extends FactureGAS {
  totalPaye: number;
  soldeRestant: number;
}

export default function InvoicesManagement() {
  const electronMode = useMemo(() => isElectron(), []);
  
  const [factures, setFactures] = useState<FactureWithPayments[]>([]);
  const [clients, setClients] = useState<ClientGAS[]>([]);
  const [sites, setSites] = useState<SiteGAS[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StatutFacture>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFacture, setEditingFacture] = useState<FactureGAS | null>(null);
  const [viewingFacture, setViewingFacture] = useState<FactureWithPayments | null>(null);
  const [printingFacture, setPrintingFacture] = useState<FactureWithPayments | null>(null);
  const [payingFacture, setPayingFacture] = useState<FactureWithPayments | null>(null);
  const [showBulkWizard, setShowBulkWizard] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Clear selection when filters change
    setSelectedInvoiceIds(new Set());
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (electronMode && window.electronAPI) {
        const [facturesData, clientsData, sitesData] = await Promise.all([
          window.electronAPI.getFacturesGAS(),
          window.electronAPI.getClientsGAS(),
          window.electronAPI.getSitesGAS()
        ]);
        
        // Load payment summaries for each facture
        const facturesWithPayments: FactureWithPayments[] = await Promise.all(
          (facturesData || []).map(async (facture: FactureGAS) => {
            try {
              const summary = await window.electronAPI!.getFacturePaiementsSummary(facture.id);
              return {
                ...facture,
                totalPaye: summary.montant_paye,
                soldeRestant: summary.solde_restant
              };
            } catch {
              return {
                ...facture,
                totalPaye: 0,
                soldeRestant: facture.montant_total_du_client
              };
            }
          })
        );
        
        setFactures(facturesWithPayments);
        setClients(clientsData || []);
        setSites(sitesData || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.nom_entreprise || 'Client inconnu';
  };

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette facture ? Cette action supprimera également tous les paiements associés.')) return;

    try {
      if (electronMode && window.electronAPI) {
        await window.electronAPI.deleteFactureGAS(id);
        await loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la facture');
    }
  };

  const handleSendInvoice = async (facture: FactureWithPayments) => {
    if (!confirm(`Voulez-vous émettre la facture ${facture.numero_facture} ?\n\nUne fois émise, la facture ne pourra plus être modifiée.`)) return;

    try {
      if (electronMode && window.electronAPI) {
        await window.electronAPI.updateFactureGAS({
          ...facture,
          statut_paiement: 'ENVOYE'
        });
        await loadData();
      }
    } catch (error) {
      console.error('Erreur lors de l\'émission:', error);
      alert('Erreur lors de l\'émission de la facture');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingFacture(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadData();
  };

  const handlePaymentSuccess = () => {
    setPayingFacture(null);
    loadData();
  };

  const handleBulkWizardClose = () => {
    setShowBulkWizard(false);
  };

  const handleBulkWizardSuccess = () => {
    setShowBulkWizard(false);
    loadData();
  };

  // Selection handlers
  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.size === filteredFactures.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(filteredFactures.map(f => f.id)));
    }
  };

  // Export selected invoices to PDF
  const handleExportSelectedPDF = async () => {
    const selectedInvoices = factures.filter(f => selectedInvoiceIds.has(f.id));
    
    if (selectedInvoices.length === 0) {
      alert('Veuillez sélectionner au moins une facture');
      return;
    }

    try {
      // Show print preview
      setShowPrintPreview(true);
      
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get all invoice elements
      const invoiceElements = document.querySelectorAll('.invoice-page');
      const elements = Array.from(invoiceElements) as HTMLElement[];
      
      if (elements.length === 0) {
        alert('Erreur: Impossible de trouver les factures à exporter');
        setShowPrintPreview(false);
        return;
      }
      
      // Generate filename: GAS - 2026 - Invoice #
      const currentYear = new Date().getFullYear();
      const invoiceCount = selectedInvoices.length;
      const filename = `GAS - ${currentYear} - Invoice ${invoiceCount === 1 ? selectedInvoices[0].numero_facture : `${invoiceCount} factures`}.pdf`;
      
      // Export to PDF
      await exportMultipleToPDF(elements, filename, {
        orientation: 'portrait',
        format: 'a4',
        quality: 0.95
      });
      
      // Hide print preview and clear selection
      setShowPrintPreview(false);
      setSelectedInvoiceIds(new Set());
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
      setShowPrintPreview(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = () => {
    const dataToExport = filteredFactures.map(facture => ({
      'Numéro Facture': facture.numero_facture,
      'Client': getClientName(facture.client_id),
      'Date Émission': new Date(facture.date_emission).toLocaleDateString('fr-FR'),
      'Date Échéance': facture.date_echeance ? new Date(facture.date_echeance).toLocaleDateString('fr-FR') : '',
      'Période': `${facture.periode_mois}/${facture.periode_annee}`,
      'Montant HT': facture.montant_ht_prestation,
      'Montant TTC': facture.montant_total_ttc,
      'Créances Antérieures': facture.creances_anterieures,
      'Total Dû': facture.montant_total_du_client,
      'Montant Payé': facture.totalPaye,
      'Solde Restant': facture.soldeRestant,
      'Statut': getStatusConfig(facture.statut_paiement).label,
      'Devise': facture.devise,
      'Gardiens': facture.total_gardiens_factures
    }));

    exportToExcel(dataToExport, 'Factures_GAS', 'Factures');
  };

  // Bulk delete selected invoices
  const handleBulkDelete = async () => {
    const selectedInvoices = factures.filter(f => selectedInvoiceIds.has(f.id));
    
    if (selectedInvoices.length === 0) {
      alert('Veuillez sélectionner au moins une facture');
      return;
    }

    // Check if any selected invoice cannot be deleted
    const undeletable = selectedInvoices.filter(
      f => f.statut_paiement !== 'BROUILLON' && f.statut_paiement !== 'ANNULE'
    );

    if (undeletable.length > 0) {
      alert(`${undeletable.length} facture(s) ne peuvent pas être supprimées car elles ne sont pas en brouillon ou annulées.`);
      return;
    }

    if (!confirm(`Voulez-vous vraiment supprimer ${selectedInvoices.length} facture(s) ?\n\nCette action supprimera également tous les paiements associés.`)) {
      return;
    }

    try {
      if (electronMode && window.electronAPI) {
        // Delete all selected invoices
        await Promise.all(
          Array.from(selectedInvoiceIds).map(id => 
            window.electronAPI!.deleteFactureGAS(id)
          )
        );
        
        setSelectedInvoiceIds(new Set());
        await loadData();
        alert(`${selectedInvoices.length} facture(s) supprimée(s) avec succès`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression des factures');
    }
  };

  const filteredFactures = factures.filter(facture => {
    const clientName = getClientName(facture.client_id);
    const matchesSearch =
      facture.numero_facture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || facture.statut_paiement === statusFilter;

    // Date range filter
    let matchesDateRange = true;
    if (dateFrom || dateTo) {
      const factureDate = new Date(facture.date_emission);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        matchesDateRange = matchesDateRange && factureDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire day
        matchesDateRange = matchesDateRange && factureDate <= toDate;
      }
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Calculate statistics
  const stats = {
    total: factures.length,
    totalMontant: factures.reduce((sum, f) => sum + f.montant_total_ttc, 0),
    totalPaye: factures.reduce((sum, f) => sum + f.totalPaye, 0),
    enAttente: factures.filter(f => f.statut_paiement === 'ENVOYE' || f.statut_paiement === 'PAYE_PARTIEL')
      .reduce((sum, f) => sum + f.soldeRestant, 0),
    enRetard: factures.filter(f => {
      if (f.statut_paiement === 'PAYE_TOTAL' || f.statut_paiement === 'ANNULE') return false;
      if (!f.date_echeance) return false;
      return new Date(f.date_echeance) < new Date();
    }).length
  };

  if (!electronMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Module Non Disponible</h3>
          <p className="text-gray-600">Ce module nécessite le mode Electron</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Factures</h2>
          <p className="text-gray-600 mt-1">
            {factures.length} facture{factures.length !== 1 ? 's' : ''} enregistrée{factures.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkWizard(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Facturation Mensuelle</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Facture</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Factures</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant Facturé</p>
              <p className="text-xl font-bold text-gray-900">${stats.totalMontant.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Encaissé</p>
              <p className="text-xl font-bold text-green-600">${stats.totalPaye.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-xl font-bold text-yellow-600">${stats.enAttente.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En Retard</p>
              <p className="text-xl font-bold text-red-600">{stats.enRetard}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro de facture ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYE">Envoyé</option>
                <option value="PAYE_PARTIEL">Payé Partiel</option>
                <option value="PAYE_TOTAL">Payé Total</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Période:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Du:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Au:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="text-sm text-blue-600 hover:text-blue-700 px-2"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            
            {/* Excel Export Button */}
            <button
              onClick={handleExportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Exporter Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Selected Button */}
      {selectedInvoiceIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedInvoiceIds.size} facture{selectedInvoiceIds.size > 1 ? 's' : ''} sélectionnée{selectedInvoiceIds.size > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              <span>Supprimer</span>
            </button>
            <button
              onClick={handleExportSelectedPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Exporter PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Factures Table */}
      {filteredFactures.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.size === filteredFactures.length && filteredFactures.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facture</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFactures.map((facture) => {
                  const statusConfig = getStatusConfig(facture.statut_paiement);
                  const StatusIcon = statusConfig.icon;
                  const canPay = facture.statut_paiement !== 'PAYE_TOTAL' && facture.statut_paiement !== 'ANNULE' && facture.statut_paiement !== 'BROUILLON';
                  
                  return (
                    <tr key={facture.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.has(facture.id)}
                          onChange={() => handleSelectInvoice(facture.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <button
                              onClick={() => setViewingFacture(facture)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {facture.numero_facture}
                            </button>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{getClientName(facture.client_id)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{facture.periode_mois}/{facture.periode_annee}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {facture.montant_total_du_client.toLocaleString()} {facture.devise}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {facture.totalPaye.toLocaleString()} {facture.devise}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${facture.soldeRestant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {facture.soldeRestant.toLocaleString()} {facture.devise}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          {/* Send invoice button - only for BROUILLON */}
                          {facture.statut_paiement === 'BROUILLON' && (
                            <button
                              onClick={() => handleSendInvoice(facture)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Émettre la facture"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {canPay && (
                            <button
                              onClick={() => setPayingFacture(facture)}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                              title="Enregistrer un paiement"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setPrintingFacture(facture)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Voir format imprimable"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {/* Only allow editing for BROUILLON invoices */}
                          {facture.statut_paiement === 'BROUILLON' && (
                            <button
                              onClick={() => { setEditingFacture(facture); setShowForm(true); }}
                              className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {/* Only allow deletion for BROUILLON or ANNULE invoices */}
                          {(facture.statut_paiement === 'BROUILLON' || facture.statut_paiement === 'ANNULE') && (
                            <button
                              onClick={() => handleDelete(facture.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture trouvée</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'ALL' ? 'Essayez d\'ajuster vos critères de recherche.' : 'Commencez par créer votre première facture.'}
          </p>
          {!searchTerm && statusFilter === 'ALL' && (
            <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Créer la Première Facture
            </button>
          )}
        </div>
      )}

      {/* Invoice Form Modal */}
      {showForm && (
        <InvoiceForm facture={editingFacture} clients={clients} sites={sites} onClose={handleFormClose} onSuccess={handleFormSuccess} />
      )}

      {/* Invoice Detail Modal */}
      {viewingFacture && (
        <InvoiceDetailModal
          facture={viewingFacture}
          client={getClient(viewingFacture.client_id)}
          onClose={() => setViewingFacture(null)}
          onPayment={() => { setPayingFacture(viewingFacture); setViewingFacture(null); }}
          onRefresh={loadData}
        />
      )}

      {/* Invoice Print View Modal */}
      {printingFacture && (
        <InvoicePrintView
          facture={printingFacture}
          client={getClient(printingFacture.client_id)}
          onClose={() => setPrintingFacture(null)}
        />
      )}

      {/* Payment Form Modal */}
      {payingFacture && (
        <PaymentForm
          paiement={null}
          facture={{ ...payingFacture, client: getClient(payingFacture.client_id) }}
          soldeRestant={payingFacture.soldeRestant}
          onClose={() => setPayingFacture(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Bulk Invoice Wizard Modal */}
      {showBulkWizard && (
        <BulkInvoiceWizard
          clients={clients}
          sites={sites}
          existingInvoices={factures}
          onClose={handleBulkWizardClose}
          onSuccess={handleBulkWizardSuccess}
        />
      )}

      {/* Hidden Print Preview for Multi-Invoice Export */}
      {showPrintPreview && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <InvoicePrintTemplateNew
            invoices={factures.filter(f => selectedInvoiceIds.has(f.id))}
            clients={clients}
            sites={sites}
          />
        </div>
      )}
    </div>
  );
}
