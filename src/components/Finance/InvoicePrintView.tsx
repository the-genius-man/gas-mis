import { useState, useEffect, useMemo } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { FactureGAS, ClientGAS, SiteGAS } from '../../types';
import InvoicePrintTemplateNew from './InvoicePrintTemplateNew';
import { exportToPDF } from '../../utils/pdfExport';

interface InvoicePrintViewProps {
  facture: FactureGAS & { totalPaye?: number; soldeRestant?: number };
  client?: ClientGAS;
  onClose: () => void;
}

// Check if running in Electron
const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

export default function InvoicePrintView({ facture, client, onClose }: InvoicePrintViewProps) {
  const electronMode = useMemo(() => isElectron(), []);
  const [sites, setSites] = useState<SiteGAS[]>([]);
  const [allInvoices, setAllInvoices] = useState<(FactureGAS & { totalPaye?: number; soldeRestant?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    if (!electronMode || !window.electronAPI) return;
    
    setLoading(true);
    try {
      const [sitesData, invoicesData] = await Promise.all([
        window.electronAPI.getSitesGAS(),
        window.electronAPI.getFacturesGAS()
      ]);
      setSites(sitesData || []);

      // Enrich invoices with payment summaries for the prior unpaid table
      if (invoicesData && facture.creances_anterieures > 0) {
        const clientInvoices = (invoicesData as FactureGAS[]).filter(
          inv => inv.client_id === facture.client_id && inv.id !== facture.id
        );
        const enriched = await Promise.all(
          clientInvoices.map(async inv => {
            try {
              const summary = await window.electronAPI!.getFacturePaiementsSummary(inv.id);
              return { ...inv, totalPaye: summary.montant_paye, soldeRestant: summary.solde_restant };
            } catch {
              return { ...inv, totalPaye: 0, soldeRestant: inv.montant_total_du_client };
            }
          })
        );
        setAllInvoices(enriched);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Wait a moment to ensure render is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const invoiceElement = document.querySelector('.invoice-page') as HTMLElement;
      if (!invoiceElement) {
        alert('Erreur: Impossible de trouver la facture');
        return;
      }

      const filename = `Facture_${facture.numero_facture}.pdf`;
      await exportToPDF(invoiceElement, filename, {
        orientation: 'portrait',
        format: 'a4',
        quality: 0.95
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-auto">
      {/* Header with Actions */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10 print:hidden">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Facture {facture.numero_facture}
              </h2>
              <p className="text-sm text-gray-500">
                {client?.nom_entreprise || 'Client'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="py-8 print:py-0">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none">
          <InvoicePrintTemplateNew
            invoices={[facture]}
            clients={client ? [client] : []}
            sites={sites}
            allInvoices={allInvoices}
          />
        </div>
      </div>
    </div>
  );
}
