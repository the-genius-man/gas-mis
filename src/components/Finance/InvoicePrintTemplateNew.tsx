import { FactureGAS, ClientGAS, SiteGAS } from '../../types';

export interface InvoicePrintTemplateProps {
  invoices: FactureGAS[];
  clients: ClientGAS[];
  sites: SiteGAS[];
  // All invoices for the client, used to populate the unpaid prior invoices table
  allInvoices?: (FactureGAS & { totalPaye?: number; soldeRestant?: number })[];
}

export interface InvoicePrintData {
  invoice: FactureGAS;
  client: ClientGAS | undefined;
  invoiceSites: SiteGAS[];
  priorUnpaidInvoices: (FactureGAS & { soldeRestant: number })[];
}

// Helper function to format currency
function formatCurrency(amount: number, devise: string = 'USD'): string {
  return `$${amount.toFixed(2)}`;
}

// Helper function to format date
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to get month name in French
function getMonthName(month: number | undefined): string {
  if (!month || month < 1 || month > 12) return '-';
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return months[month - 1];
}

// Prepare invoice data
export function prepareInvoicePrintData(
  invoices: FactureGAS[],
  clients: ClientGAS[],
  sites: SiteGAS[],
  allInvoices?: (FactureGAS & { totalPaye?: number; soldeRestant?: number })[]
): InvoicePrintData[] {
  return invoices.map(invoice => {
    const client = clients.find(c => c.id === invoice.client_id);
    const invoiceSites = invoice.details
      ? invoice.details.map(detail => {
          const site = sites.find(s => s.id === detail.site_id);
          return site;
        }).filter((s): s is SiteGAS => s !== undefined)
      : sites.filter(s => s.client_id === invoice.client_id && s.est_actif);

    // Find prior unpaid invoices for the same client (excluding current invoice).
    // Always computed when allInvoices is provided — does not require creances_anterieures to be set.
    const priorUnpaidInvoices: (FactureGAS & { soldeRestant: number })[] = [];
    if (allInvoices) {
      const currentPeriod = (invoice.periode_annee || 0) * 100 + (invoice.periode_mois || 0);
      console.log('[CREANCES] Invoice:', invoice.numero_facture, 'period:', currentPeriod, 'allInvoices count:', allInvoices.length);
      const unpaid = allInvoices
        .filter(inv => {
          const invPeriod = (inv.periode_annee || 0) * 100 + (inv.periode_mois || 0);
          const solde = inv.soldeRestant ?? inv.montant_total_du_client;
          const passes =
            inv.id !== invoice.id &&
            inv.client_id === invoice.client_id &&
            inv.statut_paiement !== 'ANNULE' &&
            inv.statut_paiement !== 'PAYE_TOTAL' &&
            solde > 0 &&
            invPeriod < currentPeriod;
          if (inv.client_id === invoice.client_id && inv.id !== invoice.id) {
            console.log('[CREANCES] Candidate:', inv.numero_facture, 'period:', invPeriod, 'status:', inv.statut_paiement, 'solde:', solde, 'passes:', passes);
          }
          return passes;
        })
        .map(inv => ({
          ...inv,
          soldeRestant: inv.soldeRestant ?? inv.montant_total_du_client
        }))
        .sort((a, b) => {
          const pa = (a.periode_annee || 0) * 100 + (a.periode_mois || 0);
          const pb = (b.periode_annee || 0) * 100 + (b.periode_mois || 0);
          return pa - pb;
        });
      priorUnpaidInvoices.push(...unpaid);
    }

    return { invoice, client, invoiceSites, priorUnpaidInvoices };
  });
}

// Single Invoice Component
interface SingleInvoicePrintProps {
  data: InvoicePrintData;
  isLast: boolean;
}

function SingleInvoicePrint({ data, isLast }: SingleInvoicePrintProps) {
  const { invoice, client } = data;
  
  return (
    <div className={`invoice-page bg-white ${!isLast ? 'page-break-after' : ''}`} style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="invoice-content" style={{ 
        padding: '15mm', 
        width: '210mm', 
        minHeight: '297mm',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        fontSize: '10pt',
        boxSizing: 'border-box'
      }}>
        
        {/* Header with Logo and Company Info */}
        <div className="flex justify-between items-start mb-8">
          {/* Logo - left aligned, fixed width */}
          <div style={{ width: '52mm', flexShrink: 0 }}>
            <img
              src="/logo-goahead.png"
              alt="Go Ahead"
              style={{ height: '60px', width: 'auto', display: 'block' }}
            />
          </div>

          {/* Company Details - right aligned, 4 lines */}
          <div className="text-right text-sm">
            <h1 className="text-xl font-bold mb-1">GO AHEAD SARLU</h1>
            <p className="font-semibold">Département de Sécurité et Gardiennage</p>
            <p className="text-xs mt-1">RCCM: CD/GOM/RCCM/20-B-00414</p>
            <p className="text-xs">ID NAT.: 19-H5300-N897290 &nbsp;|&nbsp; IMPOT: A2155845A</p>
          </div>
        </div>

        {/* Client Info and Invoice Details */}
        <div className="grid grid-cols-3 gap-8 mb-6 text-sm">
          {/* Client */}
          <div>
            <p className="font-semibold mb-1">Client</p>
            <p className="font-bold">{client?.nom_entreprise || 'Client inconnu'}</p>
            <p>{client?.contact_nom || ''}</p>
            <p>{client?.telephone || ''}</p>
          </div>

          {/* Invoice Number & Date - left aligned */}
          <div className="text-left">
            <p className="font-semibold mb-1">Numéro Facture</p>
            <p className="font-bold text-lg">{invoice.numero_facture}</p>
            <p className="font-semibold mt-2">Date</p>
            <p>{formatDate(invoice.date_emission)}</p>
          </div>

          {/* Total */}
          <div className="text-right">
            <p className="font-semibold mb-1">Total à payer</p>
            <p className="font-bold text-2xl">{formatCurrency(invoice.montant_total_du_client, invoice.devise)}</p>
          </div>
        </div>

        {/* Main Service Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border-t-2 border-b-2 border-black">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-2 px-2 font-semibold text-sm">Service</th>
                <th className="text-left py-2 px-2 font-semibold text-sm">Période Facturée</th>
                <th className="text-right py-2 px-2 font-semibold text-sm">Prix Unitaire</th>
                <th className="text-center py-2 px-2 font-semibold text-sm">Agents</th>
                <th className="text-right py-2 px-2 font-semibold text-sm">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-2 text-sm">Gardiennage</td>
                <td className="py-2 px-2 text-sm">
                  {getMonthName(invoice.periode_mois)} {invoice.periode_annee}
                </td>
                <td className="text-right py-2 px-2 text-sm">
                  {invoice.details && invoice.details.length > 0
                    ? formatCurrency(invoice.details[0].montant_forfaitaire_site / (invoice.details[0].nombre_gardiens_site || 1), invoice.devise)
                    : '-'}
                </td>
                <td className="text-center py-2 px-2 text-sm font-semibold">
                  {invoice.total_gardiens_factures}
                </td>
                <td className="text-right py-2 px-2 text-sm font-semibold">
                  {formatCurrency(invoice.montant_ht_prestation, invoice.devise)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Previous Invoices Section */}
        {data.priorUnpaidInvoices.length > 0 && (
          <div className="mb-6">
            <h3 className="text-center font-bold text-sm mb-3 uppercase">Autres Factures</h3>
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr className="border-t border-b border-black">
                  <th className="text-left py-2 px-2 font-semibold text-sm">Période Impayée</th>
                  <th className="text-left py-2 px-2 font-semibold text-sm">Date Facture</th>
                  <th className="text-left py-2 px-2 font-semibold text-sm">N° Facture</th>
                  <th className="text-right py-2 px-2 font-semibold text-sm">Montant</th>
                </tr>
              </thead>
              <tbody>
                {data.priorUnpaidInvoices.map(prior => (
                  <tr key={prior.id} className="border-b border-gray-300">
                    <td className="py-2 px-2 text-sm">
                      {getMonthName(prior.periode_mois)} {prior.periode_annee}
                    </td>
                    <td className="py-2 px-2 text-sm">{formatDate(prior.date_emission)}</td>
                    <td className="py-2 px-2 text-sm">{prior.numero_facture}</td>
                    <td className="py-2 px-2 text-sm text-right font-medium">
                      {formatCurrency(prior.soldeRestant, invoice.devise)} {invoice.devise}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black">
                  <td colSpan={3} className="py-2 px-2 text-sm font-semibold text-right">
                    Total créances antérieures
                  </td>
                  <td className="py-2 px-2 text-sm font-bold text-right text-orange-700">
                    {formatCurrency(
                      data.priorUnpaidInvoices.reduce((s, p) => s + p.soldeRestant, 0),
                      invoice.devise
                    )} {invoice.devise}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Total Section */}
        <div className="flex justify-end mb-8">
          <div className="text-right">
            <div className="flex justify-between gap-8 mb-2">
              <span className="font-semibold text-sm">Total à payer</span>
              <span className="font-bold text-lg">{formatCurrency(invoice.montant_total_du_client, invoice.devise)}</span>
            </div>
            {/* 50% more space before Pour Go Ahead */}
            <p className="text-xs italic" style={{ marginTop: '12px' }}>Pour Go Ahead,</p>
          </div>
        </div>

        {/* Signature Space */}
        <div className="flex justify-end mb-12">
          <div className="text-center">
            <div className="h-16 mb-2"></div>
            <div className="border-t border-black w-48">
              <p className="text-xs mt-1">Facturation</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          {/* Due date — above the footer line */}
          <p className="text-sm font-semibold mb-3">
            Cette facture est à payer avant le {formatDate(invoice.date_echeance)}
          </p>

          {/* Company Footer Info */}
          <div className="border-t-2 border-black pt-3 text-xs text-center">
            <p className="font-semibold mb-1">
              Adresse: 70, Av Abattoir, Q Kyeshero, En Diagonal de la Cathédrale, Goma - RDC
            </p>
            <p className="mb-1">
              +243 974 821 064; +243 855 307 832 | gas@goahead.africa | www.goahead.africa
            </p>
            <p className="font-semibold">
              BANK OF AFRICA; Compte: 04530670005; Intitulé: GO AHEAD SARL
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Main Component
export default function InvoicePrintTemplateNew({ invoices, clients, sites, allInvoices }: InvoicePrintTemplateProps) {
  const printData = prepareInvoicePrintData(invoices, clients, sites, allInvoices);
  
  if (printData.length === 0) {
    return (
      <div className="print-container p-8 text-center text-gray-500">
        <p>Aucune facture à imprimer</p>
      </div>
    );
  }
  
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .invoice-page {
            page-break-after: always;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .invoice-page:last-child {
            page-break-after: auto;
          }
          
          .invoice-content {
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm !important;
            box-sizing: border-box !important;
          }
        }
        
        .invoice-page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          display: block;
          margin: 0 auto;
        }
      `}</style>
      <div className="print-container">
        {printData.map((data, index) => (
          <SingleInvoicePrint
            key={data.invoice.id}
            data={data}
            isLast={index === printData.length - 1}
          />
        ))}
      </div>
    </>
  );
}
