import { useState, useMemo, useCallback, useRef } from 'react';
import { 
  X, Calendar, ChevronRight, ChevronLeft, FileText, 
  Users, CheckCircle, AlertCircle, Loader2, Send, Printer, Download
} from 'lucide-react';
import { ClientGAS, SiteGAS, FactureGAS, FactureDetailGAS } from '../../types';
import InvoiceDetailModal from './InvoiceDetailModal';
import InvoicePrintTemplateNew from './InvoicePrintTemplateNew';
import { exportMultipleToPDF, printElement } from '../../utils/pdfExport';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ClientPreviewItem {
  client: ClientGAS;
  sites: SiteGAS[];
  totalGuards: number;
  totalAmount: number;
  isAlreadyInvoiced: boolean;
  existingInvoiceId?: string;
}

interface BulkInvoiceWizardProps {
  clients: ClientGAS[];
  sites: SiteGAS[];
  existingInvoices: FactureGAS[];
  onClose: () => void;
  onSuccess: () => void;
}

interface WizardState {
  step: 1 | 2 | 3 | 4;
  periode_mois: number;
  periode_annee: number;
  selectedClientIds: Set<string>;
  generatedInvoices: FactureGAS[];
  selectedInvoiceIds: Set<string>;
  isGenerating: boolean;
  isIssuing: boolean;
  generationProgress: GenerationProgress | null;
  selectedInvoiceForDetail: FactureGAS | null;
  showIssuanceConfirmation: boolean;
  issuanceResult: { success: boolean; count: number; total: number } | null;
}

// ============================================================================
// Bulk Generation Types
// ============================================================================

export interface BulkGenerationRequest {
  clientIds: string[];
  periode_mois: number;
  periode_annee: number;
  date_emission: string;
}

export interface BulkGenerationResult {
  success: boolean;
  generatedCount: number;
  invoices: FactureGAS[];
  errors: { clientId: string; clientName: string; error: string }[];
}

export interface GenerationProgress {
  total: number;
  completed: number;
  successCount: number;
  errorCount: number;
  currentClient: string;
  errors: { clientId: string; clientName: string; error: string }[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates the client preview data for bulk invoice generation.
 * Filters active clients with active sites and calculates totals.
 * 
 * @param clients - All clients in the system
 * @param sites - All sites in the system
 * @param existingInvoices - Existing invoices to check for duplicates
 * @param periode_mois - Selected billing month
 * @param periode_annee - Selected billing year
 * @returns Array of ClientPreviewItem with calculated totals
 */
export function calculateClientPreview(
  clients: ClientGAS[],
  sites: SiteGAS[],
  existingInvoices: FactureGAS[],
  periode_mois: number,
  periode_annee: number
): ClientPreviewItem[] {
  const result: ClientPreviewItem[] = [];

  for (const client of clients) {
    // Get active sites for this client
    const clientSites = sites.filter(
      site => site.client_id === client.id && site.est_actif === true
    );

    // Skip clients with no active sites
    if (clientSites.length === 0) {
      continue;
    }

    // Calculate totals
    const totalGuards = clientSites.reduce(
      (sum, site) => sum + (site.effectif_jour_requis || 0) + (site.effectif_nuit_requis || 0),
      0
    );

    const totalAmount = clientSites.reduce(
      (sum, site) => sum + (site.tarif_mensuel_client || 0),
      0
    );

    // Check for existing invoice in the selected period
    const existingInvoice = existingInvoices.find(
      inv => inv.client_id === client.id && 
             inv.periode_mois === periode_mois && 
             inv.periode_annee === periode_annee
    );

    result.push({
      client,
      sites: clientSites,
      totalGuards,
      totalAmount,
      isAlreadyInvoiced: !!existingInvoice,
      existingInvoiceId: existingInvoice?.id
    });
  }

  return result;
}

/**
 * Generates a unique invoice number based on period and sequence.
 * Format: FAC-YYYY-MM-XXXX where XXXX is a random 4-digit number
 * 
 * @param periode_mois - Billing month
 * @param periode_annee - Billing year
 * @param existingNumbers - Set of existing invoice numbers to avoid duplicates
 * @returns Unique invoice number string
 */
export function generateInvoiceNumber(
  periode_mois: number,
  periode_annee: number,
  existingNumbers: Set<string>
): string {
  const monthStr = periode_mois.toString().padStart(2, '0');
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    const sequence = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const invoiceNumber = `FAC-${periode_annee}-${monthStr}-${sequence}`;
    
    if (!existingNumbers.has(invoiceNumber)) {
      return invoiceNumber;
    }
    attempts++;
  }
  
  // Fallback with timestamp if random fails
  const timestamp = Date.now().toString().slice(-6);
  return `FAC-${periode_annee}-${monthStr}-${timestamp}`;
}

/**
 * Generates a single invoice for a client with all their active sites.
 * 
 * @param client - The client to generate invoice for
 * @param clientSites - Active sites belonging to the client
 * @param periode_mois - Billing month
 * @param periode_annee - Billing year
 * @param date_emission - Invoice emission date
 * @param invoiceNumber - Pre-generated unique invoice number
 * @returns Generated invoice with details
 */
export function generateSingleInvoice(
  client: ClientGAS,
  clientSites: SiteGAS[],
  periode_mois: number,
  periode_annee: number,
  date_emission: string,
  invoiceNumber: string
): FactureGAS {
  // Calculate totals from active sites
  const totalGuards = clientSites.reduce(
    (sum, site) => sum + (site.effectif_jour_requis || 0) + (site.effectif_nuit_requis || 0),
    0
  );
  
  const montantHT = clientSites.reduce(
    (sum, site) => sum + (site.tarif_mensuel_client || 0),
    0
  );
  
  // Create invoice details for each site
  const details: FactureDetailGAS[] = clientSites.map(site => ({
    id: crypto.randomUUID(),
    facture_id: '', // Will be set after invoice creation
    site_id: site.id,
    nombre_gardiens_site: (site.effectif_jour_requis || 0) + (site.effectif_nuit_requis || 0),
    montant_forfaitaire_site: site.tarif_mensuel_client || 0,
    description_ligne: `${site.nom_site} - Gardiennage mensuel`,
    site: site
  }));
  
  // Calculate due date (based on client's payment terms)
  const emissionDate = new Date(date_emission);
  const dueDate = new Date(emissionDate);
  dueDate.setDate(dueDate.getDate() + (client.delai_paiement_jours || 30));
  
  const invoice: FactureGAS = {
    id: crypto.randomUUID(),
    client_id: client.id,
    numero_facture: invoiceNumber,
    date_emission: date_emission,
    date_echeance: dueDate.toISOString().split('T')[0],
    periode_mois: periode_mois,
    periode_annee: periode_annee,
    total_gardiens_factures: totalGuards,
    montant_ht_prestation: montantHT,
    montant_frais_supp: 0,
    motif_frais_supp: undefined,
    creances_anterieures: 0,
    montant_total_ttc: montantHT, // No tax in this system
    montant_total_du_client: montantHT,
    devise: client.devise_preferee || 'USD',
    statut_paiement: 'BROUILLON',
    notes_facture: `Facture mensuelle - ${MONTHS.find(m => m.value === periode_mois)?.label} ${periode_annee}`,
    client: client,
    details: details
  };
  
  // Update facture_id in details
  invoice.details = details.map(d => ({ ...d, facture_id: invoice.id }));
  
  return invoice;
}

/**
 * Generates invoices for multiple clients in bulk.
 * Handles errors per client without stopping the entire batch.
 * 
 * @param clientPreviews - Array of client preview items to generate invoices for
 * @param selectedClientIds - Set of client IDs that were selected for generation
 * @param periode_mois - Billing month
 * @param periode_annee - Billing year
 * @param existingInvoiceNumbers - Set of existing invoice numbers to avoid duplicates
 * @param onProgress - Optional callback for progress updates
 * @param delayMs - Optional delay between generations for UI updates (default: 50ms, use 0 for tests)
 * @returns BulkGenerationResult with generated invoices and any errors
 */
export async function generateBulkInvoices(
  clientPreviews: ClientPreviewItem[],
  selectedClientIds: Set<string>,
  periode_mois: number,
  periode_annee: number,
  existingInvoiceNumbers: Set<string>,
  onProgress?: (progress: GenerationProgress) => void,
  delayMs: number = 50
): Promise<BulkGenerationResult> {
  const date_emission = new Date().toISOString().split('T')[0];
  const usedNumbers = new Set(existingInvoiceNumbers);
  
  // Filter to only selected clients that are not already invoiced
  const clientsToProcess = clientPreviews.filter(
    cp => selectedClientIds.has(cp.client.id) && !cp.isAlreadyInvoiced
  );
  
  const result: BulkGenerationResult = {
    success: true,
    generatedCount: 0,
    invoices: [],
    errors: []
  };
  
  const progress: GenerationProgress = {
    total: clientsToProcess.length,
    completed: 0,
    successCount: 0,
    errorCount: 0,
    currentClient: '',
    errors: []
  };
  
  for (const clientPreview of clientsToProcess) {
    progress.currentClient = clientPreview.client.nom_entreprise;
    onProgress?.(progress);
    
    try {
      // Validate client has sites
      if (clientPreview.sites.length === 0) {
        throw new Error('Aucun site actif trouvé');
      }
      
      // Generate unique invoice number
      const invoiceNumber = generateInvoiceNumber(periode_mois, periode_annee, usedNumbers);
      usedNumbers.add(invoiceNumber);
      
      // Generate the invoice
      const invoice = generateSingleInvoice(
        clientPreview.client,
        clientPreview.sites,
        periode_mois,
        periode_annee,
        date_emission,
        invoiceNumber
      );
      
      result.invoices.push(invoice);
      result.generatedCount++;
      progress.successCount++;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const errorEntry = {
        clientId: clientPreview.client.id,
        clientName: clientPreview.client.nom_entreprise,
        error: errorMessage
      };
      result.errors.push(errorEntry);
      progress.errors.push(errorEntry);
      progress.errorCount++;
    }
    
    progress.completed++;
    onProgress?.(progress);
    
    // Small delay to allow UI updates (skip in tests with delayMs=0)
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  result.success = result.errors.length === 0;
  
  return result;
}

/**
 * Calculates batch totals for a set of invoices.
 * Used in Step 4 to display summary statistics.
 * 
 * @param invoices - Array of generated invoices
 * @returns Object with totalInvoices, totalAmount, and totalGuards
 */
export function calculateBatchTotals(invoices: FactureGAS[]): {
  totalInvoices: number;
  totalAmount: number;
  totalGuards: number;
} {
  return {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.montant_total_du_client || 0), 0),
    totalGuards: invoices.reduce((sum, inv) => sum + (inv.total_gardiens_factures || 0), 0)
  };
}

/**
 * Checks if an invoice has zero amount (for warning display).
 * 
 * @param invoice - The invoice to check
 * @returns true if the invoice has zero amount
 */
export function hasZeroAmount(invoice: FactureGAS): boolean {
  return invoice.montant_total_du_client === 0;
}

// ============================================================================
// Bulk Issuance Types and Functions
// ============================================================================

export interface BulkIssuanceResult {
  success: boolean;
  issuedCount: number;
  invoices: FactureGAS[];
  errors: { invoiceId: string; invoiceNumber: string; error: string }[];
}

/**
 * Issues multiple invoices in bulk by changing their status from BROUILLON to ENVOYE.
 * 
 * @param invoices - Array of invoices to potentially issue
 * @param selectedInvoiceIds - Set of invoice IDs that were selected for issuance
 * @returns BulkIssuanceResult with issued invoices and any errors
 */
export function bulkIssueInvoices(
  invoices: FactureGAS[],
  selectedInvoiceIds: Set<string>
): BulkIssuanceResult {
  const result: BulkIssuanceResult = {
    success: true,
    issuedCount: 0,
    invoices: [],
    errors: []
  };

  // Filter to only selected invoices
  const invoicesToIssue = invoices.filter(inv => selectedInvoiceIds.has(inv.id));

  for (const invoice of invoicesToIssue) {
    try {
      // Only issue BROUILLON invoices
      if (invoice.statut_paiement !== 'BROUILLON') {
        result.errors.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.numero_facture,
          error: `Statut invalide: ${invoice.statut_paiement} (attendu: BROUILLON)`
        });
        continue;
      }

      // Update status to ENVOYE
      const issuedInvoice: FactureGAS = {
        ...invoice,
        statut_paiement: 'ENVOYE'
      };

      result.invoices.push(issuedInvoice);
      result.issuedCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      result.errors.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.numero_facture,
        error: errorMessage
      });
    }
  }

  result.success = result.errors.length === 0;

  return result;
}

/**
 * Checks if any of the selected invoices have zero amount.
 * Used to warn users before bulk issuance.
 * 
 * @param invoices - Array of all invoices
 * @param selectedInvoiceIds - Set of selected invoice IDs
 * @returns true if any selected invoice has zero amount
 */
export function hasSelectedZeroAmountInvoices(
  invoices: FactureGAS[],
  selectedInvoiceIds: Set<string>
): boolean {
  return invoices.some(
    inv => selectedInvoiceIds.has(inv.id) && hasZeroAmount(inv)
  );
}

/**
 * Calculates the total amount for selected invoices.
 * 
 * @param invoices - Array of all invoices
 * @param selectedInvoiceIds - Set of selected invoice IDs
 * @returns Total amount of selected invoices
 */
export function calculateSelectedTotal(
  invoices: FactureGAS[],
  selectedInvoiceIds: Set<string>
): number {
  return invoices
    .filter(inv => selectedInvoiceIds.has(inv.id))
    .reduce((sum, inv) => sum + (inv.montant_total_du_client || 0), 0);
}

// ============================================================================
// Step Components
// ============================================================================

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' }
];

const STEP_TITLES = {
  1: 'Sélection de la Période',
  2: 'Aperçu des Clients',
  3: 'Génération des Factures',
  4: 'Révision et Actions'
};

const STEP_ICONS = {
  1: Calendar,
  2: Users,
  3: FileText,
  4: CheckCircle
};

// ============================================================================
// Main Component
// ============================================================================

export default function BulkInvoiceWizard({
  clients,
  sites,
  existingInvoices,
  onClose,
  onSuccess
}: BulkInvoiceWizardProps) {
  // Initialize with current month/year
  const currentDate = new Date();
  
  const [state, setState] = useState<WizardState>({
    step: 1,
    periode_mois: currentDate.getMonth() + 1,
    periode_annee: currentDate.getFullYear(),
    selectedClientIds: new Set(),
    generatedInvoices: [],
    selectedInvoiceIds: new Set(),
    isGenerating: false,
    isIssuing: false,
    generationProgress: null,
    selectedInvoiceForDetail: null,
    showIssuanceConfirmation: false,
    issuanceResult: null
  });

  // Ref for print container
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Calculate client preview based on selected period
  const clientPreviews = useMemo(() => {
    return calculateClientPreview(
      clients,
      sites,
      existingInvoices,
      state.periode_mois,
      state.periode_annee
    );
  }, [clients, sites, existingInvoices, state.periode_mois, state.periode_annee]);

  // Generate year options (current year - 1 to current year + 1)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  // Navigation handlers
  const goToNextStep = () => {
    if (state.step < 4) {
      setState(prev => ({ ...prev, step: (prev.step + 1) as 1 | 2 | 3 | 4 }));
    }
  };

  const goToPreviousStep = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 | 4 }));
    }
  };

  const handlePeriodChange = (field: 'periode_mois' | 'periode_annee', value: number) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  // Check if can proceed to next step
  const canProceed = () => {
    switch (state.step) {
      case 1:
        return state.periode_mois > 0 && state.periode_annee > 0;
      case 2:
        return state.selectedClientIds.size > 0;
      case 3:
        return state.generatedInvoices.length > 0;
      default:
        return true;
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3, 4].map((stepNum) => {
          const StepIcon = STEP_ICONS[stepNum as keyof typeof STEP_ICONS];
          const isActive = state.step === stepNum;
          const isCompleted = state.step > stepNum;
          
          return (
            <div key={stepNum} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              {stepNum < 4 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    state.step > stepNum ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Step 1: Period Selection
  const renderStep1 = () => {
    const selectedMonthLabel = MONTHS.find(m => m.value === state.periode_mois)?.label || '';
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sélectionnez la période de facturation
          </h3>
          <p className="text-gray-600">
            Choisissez le mois et l'année pour lesquels vous souhaitez générer les factures.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mois
            </label>
            <select
              value={state.periode_mois}
              onChange={(e) => handlePeriodChange('periode_mois', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              {MONTHS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année
            </label>
            <select
              value={state.periode_annee}
              onChange={(e) => handlePeriodChange('periode_annee', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800">
            <span className="font-semibold">Période sélectionnée:</span>{' '}
            {selectedMonthLabel} {state.periode_annee}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            {clientPreviews.length} client(s) avec des sites actifs
          </p>
        </div>
      </div>
    );
  };

  // Client selection handlers
  const handleClientToggle = (clientId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedClientIds);
      if (newSelected.has(clientId)) {
        newSelected.delete(clientId);
      } else {
        newSelected.add(clientId);
      }
      return { ...prev, selectedClientIds: newSelected };
    });
  };

  const handleSelectAll = () => {
    const selectableClients = clientPreviews.filter(cp => !cp.isAlreadyInvoiced);
    setState(prev => ({
      ...prev,
      selectedClientIds: new Set(selectableClients.map(cp => cp.client.id))
    }));
  };

  const handleDeselectAll = () => {
    setState(prev => ({ ...prev, selectedClientIds: new Set() }));
  };

  // Calculate batch summary for selected clients
  const batchSummary = useMemo(() => {
    const selectedPreviews = clientPreviews.filter(cp => 
      state.selectedClientIds.has(cp.client.id)
    );
    return {
      selectedCount: selectedPreviews.length,
      totalAmount: selectedPreviews.reduce((sum, cp) => sum + cp.totalAmount, 0),
      totalGuards: selectedPreviews.reduce((sum, cp) => sum + cp.totalGuards, 0)
    };
  }, [clientPreviews, state.selectedClientIds]);

  // Get existing invoice numbers for uniqueness check
  const existingInvoiceNumbers = useMemo(() => {
    return new Set(existingInvoices.map(inv => inv.numero_facture));
  }, [existingInvoices]);

  // Handle bulk invoice generation
  const handleGenerateInvoices = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true,
      generationProgress: {
        total: prev.selectedClientIds.size,
        completed: 0,
        successCount: 0,
        errorCount: 0,
        currentClient: '',
        errors: []
      }
    }));
    
    try {
      const result = await generateBulkInvoices(
        clientPreviews,
        state.selectedClientIds,
        state.periode_mois,
        state.periode_annee,
        existingInvoiceNumbers,
        (progress) => {
          setState(prev => ({ ...prev, generationProgress: progress }));
        }
      );
      
      // Save generated invoices to database
      if (window.electronAPI && result.invoices.length > 0) {
        for (const invoice of result.invoices) {
          try {
            await window.electronAPI.addFactureGAS(invoice);
          } catch (saveError) {
            console.error('Error saving invoice:', invoice.numero_facture, saveError);
          }
        }
      }
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedInvoices: result.invoices,
        // Auto-advance to step 4 if we have invoices
        step: result.invoices.length > 0 ? 4 : prev.step
      }));
      
    } catch (error) {
      console.error('Bulk generation failed:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: prev.generationProgress ? {
          ...prev.generationProgress,
          errors: [{
            clientId: '',
            clientName: 'Système',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          }]
        } : null
      }));
    }
  }, [clientPreviews, state.selectedClientIds, state.periode_mois, state.periode_annee, existingInvoiceNumbers]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Render Step 2: Client Selection Preview
  const renderStep2 = () => {
    const selectableClients = clientPreviews.filter(cp => !cp.isAlreadyInvoiced);
    const allSelected = selectableClients.length > 0 && 
      selectableClients.every(cp => state.selectedClientIds.has(cp.client.id));

    return (
      <div className="space-y-4">
        {/* Header with Select All / Deselect All */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Aperçu des Clients
            </h3>
            <p className="text-sm text-gray-600">
              Sélectionnez les clients à facturer pour {MONTHS.find(m => m.value === state.periode_mois)?.label} {state.periode_annee}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              disabled={selectableClients.length === 0}
              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tout sélectionner
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={state.selectedClientIds.size === 0}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tout désélectionner
            </button>
          </div>
        </div>

        {/* Client Table */}
        {clientPreviews.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun client avec des sites actifs</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={allSelected ? handleDeselectAll : handleSelectAll}
                      disabled={selectableClients.length === 0}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sites
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gardiens
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientPreviews.map((preview) => (
                  <tr 
                    key={preview.client.id}
                    className={`${
                      preview.isAlreadyInvoiced 
                        ? 'bg-gray-50 opacity-60' 
                        : state.selectedClientIds.has(preview.client.id)
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={state.selectedClientIds.has(preview.client.id)}
                        onChange={() => handleClientToggle(preview.client.id)}
                        disabled={preview.isAlreadyInvoiced}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {preview.client.nom_entreprise}
                      </div>
                      {preview.client.contact_nom && (
                        <div className="text-sm text-gray-500">
                          {preview.client.contact_nom}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {preview.sites.length}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {preview.totalGuards}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(preview.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {preview.isAlreadyInvoiced ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Déjà facturé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          À facturer
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Batch Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-sm text-blue-600">Clients sélectionnés</span>
                <p className="text-2xl font-bold text-blue-900">{batchSummary.selectedCount}</p>
              </div>
              <div className="h-10 w-px bg-blue-200" />
              <div>
                <span className="text-sm text-blue-600">Total gardiens</span>
                <p className="text-2xl font-bold text-blue-900">{batchSummary.totalGuards}</p>
              </div>
              <div className="h-10 w-px bg-blue-200" />
              <div>
                <span className="text-sm text-blue-600">Montant total</span>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(batchSummary.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if all clients already invoiced */}
        {selectableClients.length === 0 && clientPreviews.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <div className="text-yellow-600 mt-0.5">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-yellow-800">Tous les clients sont déjà facturés</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Tous les clients avec des sites actifs ont déjà une facture pour {MONTHS.find(m => m.value === state.periode_mois)?.label} {state.periode_annee}.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Step 3: Bulk Invoice Generation
  const renderStep3 = () => {
    const { isGenerating, generationProgress, generatedInvoices } = state;
    
    // If generation is complete and we have invoices, show summary
    if (!isGenerating && generatedInvoices.length > 0) {
      const totalAmount = generatedInvoices.reduce(
        (sum, inv) => sum + inv.montant_total_du_client,
        0
      );
      const totalGuards = generatedInvoices.reduce(
        (sum, inv) => sum + inv.total_gardiens_factures,
        0
      );
      
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Génération terminée !
            </h3>
            <p className="text-gray-600">
              {generatedInvoices.length} facture(s) créée(s) avec succès
            </p>
          </div>
          
          {/* Summary Stats */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <span className="text-sm text-green-600">Factures créées</span>
                <p className="text-3xl font-bold text-green-900">{generatedInvoices.length}</p>
              </div>
              <div>
                <span className="text-sm text-green-600">Total gardiens</span>
                <p className="text-3xl font-bold text-green-900">{totalGuards}</p>
              </div>
              <div>
                <span className="text-sm text-green-600">Montant total</span>
                <p className="text-3xl font-bold text-green-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
          
          {/* Errors if any */}
          {generationProgress && generationProgress.errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">
                    {generationProgress.errors.length} erreur(s) lors de la génération
                  </h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    {generationProgress.errors.map((err, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{err.clientName}:</span> {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500">
            Cliquez sur "Suivant" pour réviser et émettre les factures
          </div>
        </div>
      );
    }
    
    // If generating, show progress
    if (isGenerating && generationProgress) {
      const progressPercent = generationProgress.total > 0 
        ? Math.round((generationProgress.completed / generationProgress.total) * 100)
        : 0;
      
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Génération en cours...
            </h3>
            <p className="text-gray-600">
              {generationProgress.currentClient}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{generationProgress.completed} / {generationProgress.total}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 text-center">
            <div>
              <span className="text-sm text-gray-500">Succès</span>
              <p className="text-2xl font-bold text-green-600">{generationProgress.successCount}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Erreurs</span>
              <p className="text-2xl font-bold text-red-600">{generationProgress.errorCount}</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Initial state - ready to generate
    const selectedCount = state.selectedClientIds.size;
    const selectedPreviews = clientPreviews.filter(cp => 
      state.selectedClientIds.has(cp.client.id) && !cp.isAlreadyInvoiced
    );
    const totalAmount = selectedPreviews.reduce((sum, cp) => sum + cp.totalAmount, 0);
    const totalGuards = selectedPreviews.reduce((sum, cp) => sum + cp.totalGuards, 0);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Prêt à générer les factures
          </h3>
          <p className="text-gray-600">
            Vérifiez les informations ci-dessous avant de lancer la génération
          </p>
        </div>
        
        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <span className="text-sm text-blue-600">Clients sélectionnés</span>
              <p className="text-3xl font-bold text-blue-900">{selectedCount}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Total gardiens</span>
              <p className="text-3xl font-bold text-blue-900">{totalGuards}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Montant estimé</span>
              <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
        
        {/* Period Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-700">
            <span className="font-medium">Période de facturation:</span>{' '}
            {MONTHS.find(m => m.value === state.periode_mois)?.label} {state.periode_annee}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Les factures seront créées avec le statut "Brouillon"
          </p>
        </div>
        
        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={handleGenerateInvoices}
            disabled={selectedCount === 0}
            className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto ${
              selectedCount > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FileText className="h-5 w-5" />
            Générer {selectedCount} facture(s)
          </button>
        </div>
      </div>
    );
  };

  // Invoice row click handler for Step 4
  const handleInvoiceRowClick = (invoice: FactureGAS) => {
    setState(prev => ({ ...prev, selectedInvoiceForDetail: invoice }));
  };

  const handleCloseInvoiceDetail = () => {
    setState(prev => ({ ...prev, selectedInvoiceForDetail: null }));
  };

  const handleInvoiceDetailRefresh = () => {
    // Refresh the invoice list after modal closes
    // For now, just close the modal - actual refresh would require re-fetching from database
    handleCloseInvoiceDetail();
  };

  // Invoice selection handlers for Step 4
  const handleInvoiceToggle = (invoiceId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedInvoiceIds);
      if (newSelected.has(invoiceId)) {
        newSelected.delete(invoiceId);
      } else {
        newSelected.add(invoiceId);
      }
      return { ...prev, selectedInvoiceIds: newSelected };
    });
  };

  const handleSelectAllInvoices = () => {
    setState(prev => ({
      ...prev,
      selectedInvoiceIds: new Set(prev.generatedInvoices.map(inv => inv.id))
    }));
  };

  const handleDeselectAllInvoices = () => {
    setState(prev => ({ ...prev, selectedInvoiceIds: new Set() }));
  };

  // Bulk issuance handlers
  const handleShowIssuanceConfirmation = () => {
    setState(prev => ({ ...prev, showIssuanceConfirmation: true }));
  };

  const handleCancelIssuance = () => {
    setState(prev => ({ ...prev, showIssuanceConfirmation: false }));
  };

  const handleConfirmIssuance = useCallback(async () => {
    setState(prev => ({ ...prev, isIssuing: true, showIssuanceConfirmation: false }));

    // Perform bulk issuance
    const result = bulkIssueInvoices(state.generatedInvoices, state.selectedInvoiceIds);

    // Update the generated invoices with new statuses
    const updatedInvoices = state.generatedInvoices.map(inv => {
      const issuedInvoice = result.invoices.find(issued => issued.id === inv.id);
      return issuedInvoice || inv;
    });

    // Save updated invoices to database
    if (window.electronAPI) {
      for (const invoice of result.invoices) {
        try {
          await window.electronAPI.updateFactureGAS(invoice);
        } catch (updateError) {
          console.error('Error updating invoice status:', invoice.numero_facture, updateError);
        }
      }
    }

    // Calculate total for success message
    const issuedTotal = result.invoices.reduce(
      (sum, inv) => sum + (inv.montant_total_du_client || 0),
      0
    );

    setState(prev => ({
      ...prev,
      isIssuing: false,
      generatedInvoices: updatedInvoices,
      selectedInvoiceIds: new Set(), // Clear selection after issuance
      issuanceResult: {
        success: result.success,
        count: result.issuedCount,
        total: issuedTotal
      }
    }));
  }, [state.generatedInvoices, state.selectedInvoiceIds]);

  const handleDismissIssuanceResult = () => {
    setState(prev => ({ ...prev, issuanceResult: null }));
  };

  // Print selected invoices handler
  const handlePrintSelectedInvoices = useCallback(() => {
    // Get selected invoices
    const selectedInvoices = state.generatedInvoices.filter(
      inv => state.selectedInvoiceIds.has(inv.id)
    );
    
    if (selectedInvoices.length === 0) return;
    
    // Show print preview which will trigger print
    setShowPrintPreview(true);
    
    // Use setTimeout to ensure the print content is rendered before printing
    setTimeout(() => {
      window.print();
      // Hide print preview after print dialog closes
      setTimeout(() => {
        setShowPrintPreview(false);
      }, 500);
    }, 100);
  }, [state.generatedInvoices, state.selectedInvoiceIds]);

  // Export selected invoices to PDF
  const handleExportToPDF = useCallback(async () => {
    const selectedInvoices = state.generatedInvoices.filter(
      inv => state.selectedInvoiceIds.has(inv.id)
    );
    
    if (selectedInvoices.length === 0) return;
    
    try {
      // Show print preview to render invoices
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
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `Factures_${date}_${selectedInvoices.length}factures.pdf`;
      
      // Export to PDF
      await exportMultipleToPDF(elements, filename, {
        orientation: 'portrait',
        format: 'a4',
        quality: 0.95
      });
      
      // Hide print preview
      setShowPrintPreview(false);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
      setShowPrintPreview(false);
    }
  }, [state.generatedInvoices, state.selectedInvoiceIds]);

  // Get selected invoices for printing
  const selectedInvoicesForPrint = useMemo(() => {
    return state.generatedInvoices.filter(
      inv => state.selectedInvoiceIds.has(inv.id)
    );
  }, [state.generatedInvoices, state.selectedInvoiceIds]);

  // Check if selected invoices include any with zero amount
  const selectedHasZeroAmount = useMemo(() => {
    return hasSelectedZeroAmountInvoices(state.generatedInvoices, state.selectedInvoiceIds);
  }, [state.generatedInvoices, state.selectedInvoiceIds]);

  // Calculate selected invoices total
  const selectedInvoicesTotal = useMemo(() => {
    return calculateSelectedTotal(state.generatedInvoices, state.selectedInvoiceIds);
  }, [state.generatedInvoices, state.selectedInvoiceIds]);

  // Count of selected draft invoices (only BROUILLON can be issued)
  const selectedDraftCount = useMemo(() => {
    return state.generatedInvoices.filter(
      inv => state.selectedInvoiceIds.has(inv.id) && inv.statut_paiement === 'BROUILLON'
    ).length;
  }, [state.generatedInvoices, state.selectedInvoiceIds]);

  // Calculate batch totals for Step 4
  const invoiceBatchTotals = useMemo(() => {
    return calculateBatchTotals(state.generatedInvoices);
  }, [state.generatedInvoices]);

  // Render Step 4: Review and Actions
  const renderStep4 = () => {
    const { generatedInvoices, selectedInvoiceIds } = state;
    
    if (generatedInvoices.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune facture générée</p>
          <p className="text-sm text-gray-500 mt-2">
            Retournez à l'étape précédente pour générer des factures
          </p>
        </div>
      );
    }

    const allSelected = generatedInvoices.length > 0 && 
      generatedInvoices.every(inv => selectedInvoiceIds.has(inv.id));
    const hasZeroAmountInvoices = generatedInvoices.some(inv => inv.montant_total_du_client === 0);

    return (
      <div className="space-y-4">
        {/* Header with Select All / Deselect All */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Révision des Factures
            </h3>
            <p className="text-sm text-gray-600">
              {generatedInvoices.length} facture(s) générée(s) - Cliquez sur une ligne pour voir les détails
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAllInvoices}
              disabled={generatedInvoices.length === 0}
              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tout sélectionner
            </button>
            <button
              onClick={handleDeselectAllInvoices}
              disabled={selectedInvoiceIds.size === 0}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tout désélectionner
            </button>
          </div>
        </div>

        {/* Zero Amount Warning */}
        {hasZeroAmountInvoices && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800">Attention: Factures à montant zéro</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Certaines factures ont un montant de 0. Vérifiez les tarifs des sites concernés.
              </p>
            </div>
          </div>
        )}

        {/* Invoice Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={allSelected ? handleDeselectAllInvoices : handleSelectAllInvoices}
                    disabled={generatedInvoices.length === 0}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sites
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gardiens
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {generatedInvoices.map((invoice) => {
                const isZeroAmount = invoice.montant_total_du_client === 0;
                const isSelected = selectedInvoiceIds.has(invoice.id);
                
                return (
                  <tr 
                    key={invoice.id}
                    onClick={(e) => {
                      // Don't trigger row click if clicking on checkbox
                      if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        handleInvoiceRowClick(invoice);
                      }
                    }}
                    className={`cursor-pointer transition-colors ${
                      isZeroAmount 
                        ? 'bg-yellow-50 hover:bg-yellow-100' 
                        : isSelected
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleInvoiceToggle(invoice.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {invoice.numero_facture}
                        </span>
                        {isZeroAmount && (
                          <span title="Montant zéro">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {invoice.client?.nom_entreprise || 'Client inconnu'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {invoice.details?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {invoice.total_gardiens_factures}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      isZeroAmount ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      {formatCurrency(invoice.montant_total_du_client)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.statut_paiement === 'BROUILLON' 
                          ? 'bg-gray-100 text-gray-800'
                          : invoice.statut_paiement === 'ENVOYE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.statut_paiement === 'BROUILLON' ? 'Brouillon' : 
                         invoice.statut_paiement === 'ENVOYE' ? 'Envoyé' : 
                         invoice.statut_paiement}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Batch Totals Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-sm text-blue-600">Total factures</span>
                <p className="text-2xl font-bold text-blue-900">{invoiceBatchTotals.totalInvoices}</p>
              </div>
              <div className="h-10 w-px bg-blue-200" />
              <div>
                <span className="text-sm text-blue-600">Total gardiens</span>
                <p className="text-2xl font-bold text-blue-900">{invoiceBatchTotals.totalGuards}</p>
              </div>
              <div className="h-10 w-px bg-blue-200" />
              <div>
                <span className="text-sm text-blue-600">Montant total</span>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(invoiceBatchTotals.totalAmount)}</p>
              </div>
            </div>
            {selectedInvoiceIds.size > 0 && (
              <div className="text-right">
                <span className="text-sm text-blue-600">Sélectionnées</span>
                <p className="text-lg font-bold text-blue-900">{selectedInvoiceIds.size}</p>
              </div>
            )}
          </div>
        </div>

        {/* Issuance Success Message */}
        {state.issuanceResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800">Émission réussie</h4>
                <p className="text-sm text-green-700 mt-1">
                  {state.issuanceResult.count} facture(s) émise(s) pour un total de {formatCurrency(state.issuanceResult.total)}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissIssuanceResult}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {selectedInvoiceIds.size > 0 && (
          <div className="flex justify-end gap-3">
            {/* Export PDF Button */}
            <button
              onClick={handleExportToPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter PDF ({selectedInvoiceIds.size})
            </button>
            
            {/* Print Button - always available when invoices are selected */}
            <button
              onClick={handlePrintSelectedInvoices}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer ({selectedInvoiceIds.size})
            </button>
            
            {/* Issue Button - only for draft invoices */}
            {selectedDraftCount > 0 && (
              <button
                onClick={handleShowIssuanceConfirmation}
                disabled={state.isIssuing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isIssuing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Émission en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Émettre les sélectionnées ({selectedDraftCount})
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (state.step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Facturation Mensuelle</h2>
                <p className="text-blue-100 text-sm">
                  Étape {state.step}/4 - {STEP_TITLES[state.step]}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            {renderStepIndicator()}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
            <button
              onClick={state.step === 1 ? onClose : goToPreviousStep}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              {state.step === 1 ? (
                'Annuler'
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </>
              )}
            </button>

            {state.step < 4 ? (
              <button
                onClick={goToNextStep}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  canProceed()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onSuccess}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Terminer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {state.selectedInvoiceForDetail && (
        <InvoiceDetailModal
          facture={{
            ...state.selectedInvoiceForDetail,
            totalPaye: 0,
            soldeRestant: state.selectedInvoiceForDetail.montant_total_du_client
          }}
          client={state.selectedInvoiceForDetail.client}
          onClose={handleCloseInvoiceDetail}
          onPayment={() => {}} // Payment not available for draft invoices
          onRefresh={handleInvoiceDetailRefresh}
        />
      )}

      {/* Issuance Confirmation Dialog */}
      {state.showIssuanceConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmer l'émission
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Vous êtes sur le point d'émettre <span className="font-semibold">{selectedDraftCount}</span> facture(s) 
                pour un montant total de <span className="font-semibold">{formatCurrency(selectedInvoicesTotal)}</span>.
              </p>

              {selectedHasZeroAmount && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Attention</p>
                    <p className="text-sm text-yellow-700">
                      Certaines factures sélectionnées ont un montant de 0. Êtes-vous sûr de vouloir les émettre ?
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Le statut des factures passera de "Brouillon" à "Envoyé".
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelIssuance}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmIssuance}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Confirmer l'émission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Container - Hidden on screen, visible when printing */}
      {showPrintPreview && (
        <div 
          ref={printContainerRef}
          className="print-only fixed inset-0 bg-white z-[100] overflow-auto"
        >
          <InvoicePrintTemplateNew
            invoices={selectedInvoicesForPrint}
            clients={clients}
            sites={sites}
          />
        </div>
      )}
    </>
  );
}
