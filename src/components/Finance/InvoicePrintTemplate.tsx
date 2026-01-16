import { FactureGAS, ClientGAS, SiteGAS } from '../../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface InvoicePrintTemplateProps {
  invoices: FactureGAS[];
  clients: ClientGAS[];
  sites: SiteGAS[];
}

export interface InvoicePrintData {
  invoice: FactureGAS;
  client: ClientGAS | undefined;
  invoiceSites: SiteGAS[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Prepares invoice data for printing by matching invoices with their clients and sites.
 * 
 * @param invoices - Array of invoices to prepare
 * @param clients - Array of all clients
 * @param sites - Array of all sites
 * @returns Array of InvoicePrintData with matched client and sites
 */
export function prepareInvoicePrintData(
  invoices: FactureGAS[],
  clients: ClientGAS[],
  sites: SiteGAS[]
): InvoicePrintData[] {
  return invoices.map(invoice => {
    const client = clients.find(c => c.id === invoice.client_id);
    
    // Get sites from invoice details or fallback to matching by client_id
    const invoiceSites = invoice.details
      ? invoice.details.map(detail => {
          const site = sites.find(s => s.id === detail.site_id);
          return site;
        }).filter((s): s is SiteGAS => s !== undefined)
      : sites.filter(s => s.client_id === invoice.client_id && s.est_actif);
    
    return {
      invoice,
      client,
      invoiceSites
    };
  });
}

/**
 * Formats a currency amount for display.
 * 
 * @param amount - The amount to format
 * @param devise - The currency code (USD, CDF, EUR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, devise: string = 'USD'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a date for display in French locale.
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Gets the month name in French.
 * 
 * @param month - Month number (1-12)
 * @returns French month name
 */
export function getMonthName(month: number | undefined): string {
  if (!month || month < 1 || month > 12) return '-';
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[month - 1];
}

/**
 * Checks if an invoice print data contains all required fields for printing.
 * 
 * @param data - The invoice print data to validate
 * @returns Object with validation result and missing fields
 */
export function validatePrintData(data: InvoicePrintData): {
  isValid: boolean;
  hasCompanyHeader: boolean;
  hasInvoiceNumber: boolean;
  hasClientName: boolean;
  hasClientAddress: boolean;
  hasEmissionDate: boolean;
  hasDueDate: boolean;
  hasBillingPeriod: boolean;
  hasSiteBreakdown: boolean;
  hasSubtotal: boolean;
  hasTotalDue: boolean;
  hasPaymentSection: boolean;
} {
  const { invoice, client } = data;
  
  const hasCompanyHeader = true; // Always present in template
  const hasInvoiceNumber = !!invoice.numero_facture;
  const hasClientName = !!client?.nom_entreprise;
  const hasClientAddress = !!client?.adresse_facturation;
  const hasEmissionDate = !!invoice.date_emission;
  const hasDueDate = !!invoice.date_echeance;
  const hasBillingPeriod = !!(invoice.periode_mois && invoice.periode_annee);
  const hasSiteBreakdown = !!(invoice.details && invoice.details.length > 0);
  const hasSubtotal = invoice.montant_ht_prestation !== undefined;
  const hasTotalDue = invoice.montant_total_du_client !== undefined;
  const hasPaymentSection = true; // Always present in template
  
  const isValid = hasCompanyHeader && hasInvoiceNumber && hasClientName && 
                  hasEmissionDate && hasBillingPeriod && hasSubtotal && 
                  hasTotalDue && hasPaymentSection;
  
  return {
    isValid,
    hasCompanyHeader,
    hasInvoiceNumber,
    hasClientName,
    hasClientAddress,
    hasEmissionDate,
    hasDueDate,
    hasBillingPeriod,
    hasSiteBreakdown,
    hasSubtotal,
    hasTotalDue,
    hasPaymentSection
  };
}

// ============================================================================
// Single Invoice Component
// ============================================================================

interface SingleInvoicePrintProps {
  data: InvoicePrintData;
  isLast: boolean;
}

function SingleInvoicePrint({ data, isLast }: SingleInvoicePrintProps) {
  const { invoice, client, invoiceSites } = data;
  
  return (
    <div className={`invoice-page bg-white ${!isLast ? 'page-break-after' : ''}`}>
      {/* A4 Page Container */}
      <div className="invoice-content p-8 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col">
        
        {/* Company Header */}
        <header className="invoice-header border-b-2 border-blue-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Logo Placeholder */}
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                GAS
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-600">Go Ahead Security</h1>
                <p className="text-sm text-gray-600">Services de Gardiennage Professionnel</p>
                <p className="text-xs text-gray-500 mt-1">NIF: XXXXXXXXXX | RCCM: XXXXXXXXXX</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800">FACTURE</h2>
              <p className="text-lg font-semibold text-blue-600 mt-1">{invoice.numero_facture}</p>
            </div>
          </div>
        </header>

        {/* Invoice Info and Client Info */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Invoice Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Détails de la Facture
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">N° Facture:</span>
                <span className="font-medium">{invoice.numero_facture}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date d'émission:</span>
                <span className="font-medium">{formatDate(invoice.date_emission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date d'échéance:</span>
                <span className="font-medium">{formatDate(invoice.date_echeance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Période:</span>
                <span className="font-medium">
                  {getMonthName(invoice.periode_mois)} {invoice.periode_annee}
                </span>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Facturer à
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {client?.nom_entreprise || 'Client inconnu'}
              </p>
              {client?.adresse_facturation && (
                <p className="text-gray-600 text-sm">{client.adresse_facturation}</p>
              )}
              {client?.contact_nom && (
                <p className="text-gray-600 text-sm">Contact: {client.contact_nom}</p>
              )}
              {client?.telephone && (
                <p className="text-gray-600 text-sm">Tél: {client.telephone}</p>
              )}
              {client?.contact_email && (
                <p className="text-gray-600 text-sm">Email: {client.contact_email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sites Breakdown Table */}
        <div className="flex-1 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Détail des Prestations
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Site
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Gardiens Jour
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Gardiens Nuit
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Total Gardiens
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.details && invoice.details.length > 0 ? (
                invoice.details.map((detail, index) => {
                  const site = invoiceSites.find(s => s.id === detail.site_id);
                  return (
                    <tr key={detail.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {site?.nom_site || detail.description_ligne || `Site ${index + 1}`}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {site?.effectif_jour_requis || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {site?.effectif_nuit_requis || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm font-medium">
                        {detail.nombre_gardiens_site}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">
                        {formatCurrency(detail.montant_forfaitaire_site, invoice.devise)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="border border-gray-300 px-4 py-4 text-center text-gray-500 italic">
                    Aucun détail de site disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="mb-6">
          <div className="flex justify-end">
            <div className="w-80 bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total HT:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.montant_ht_prestation, invoice.devise)}
                  </span>
                </div>
                
                {invoice.montant_frais_supp > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Frais supplémentaires
                      {invoice.motif_frais_supp && (
                        <span className="text-xs text-gray-500 block">
                          ({invoice.motif_frais_supp})
                        </span>
                      )}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(invoice.montant_frais_supp, invoice.devise)}
                    </span>
                  </div>
                )}
                
                {invoice.creances_anterieures > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Créances antérieures:</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(invoice.creances_anterieures, invoice.devise)}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total TTC:</span>
                    <span className="font-semibold">
                      {formatCurrency(invoice.montant_total_ttc, invoice.devise)}
                    </span>
                  </div>
                </div>
                
                <div className="border-t-2 border-blue-600 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-800">TOTAL DÛ:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(invoice.montant_total_du_client, invoice.devise)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guards Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total gardiens facturés:</span>
            <span className="text-lg font-bold text-blue-600">
              {invoice.total_gardiens_factures} gardien(s)
            </span>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="payment-section bg-gray-100 rounded-lg p-4 mt-auto">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Instructions de Paiement
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Mode de paiement acceptés:</p>
              <ul className="text-gray-800 space-y-1">
                <li>• Virement bancaire</li>
                <li>• Chèque</li>
                <li>• Espèces</li>
                <li>• Mobile Money</li>
              </ul>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Coordonnées bancaires:</p>
              <div className="text-gray-800 space-y-1">
                <p><span className="text-gray-500">Banque:</span> [Nom de la Banque]</p>
                <p><span className="text-gray-500">Compte:</span> [Numéro de Compte]</p>
                <p><span className="text-gray-500">SWIFT:</span> [Code SWIFT]</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-300">
            <p className="text-xs text-gray-500 text-center">
              Merci de mentionner le numéro de facture ({invoice.numero_facture}) lors du paiement.
              <br />
              Pour toute question, contactez-nous à: contact@goaheadsecurity.com
            </p>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes_facture && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> {invoice.notes_facture}
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Go Ahead Security - Services de Gardiennage Professionnel</p>
          <p>Adresse: [Adresse de l'entreprise] | Tél: [Numéro de téléphone] | Email: contact@goaheadsecurity.com</p>
        </footer>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * InvoicePrintTemplate - Renders multiple invoices for printing.
 * Each invoice is formatted for A4 paper with page breaks between them.
 * 
 * @param props - Component props containing invoices, clients, and sites
 * @returns JSX element with printable invoice templates
 */
export default function InvoicePrintTemplate({ invoices, clients, sites }: InvoicePrintTemplateProps) {
  const printData = prepareInvoicePrintData(invoices, clients, sites);
  
  if (printData.length === 0) {
    return (
      <div className="print-container p-8 text-center text-gray-500">
        <p>Aucune facture à imprimer</p>
      </div>
    );
  }
  
  return (
    <div className="print-container">
      {printData.map((data, index) => (
        <SingleInvoicePrint
          key={data.invoice.id}
          data={data}
          isLast={index === printData.length - 1}
        />
      ))}
    </div>
  );
}
