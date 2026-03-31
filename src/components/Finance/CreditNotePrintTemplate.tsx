import { AvoirGAS, FactureGAS, ClientGAS } from '../../types';

export interface CreditNotePrintTemplateProps {
  avoir: AvoirGAS;
  facture: FactureGAS;
  client?: ClientGAS;
}

// Helper: format currency amount
function formatCurrency(amount: number, devise: string = 'USD'): string {
  return `${amount.toFixed(2)} ${devise}`;
}

// Helper: format ISO date string as DD/MM/YYYY
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function CreditNotePrintTemplate({
  avoir,
  facture,
  client,
}: CreditNotePrintTemplateProps) {
  const clientNom =
    avoir.client?.nom_entreprise ||
    client?.nom_entreprise ||
    facture.client_nom ||
    'Client inconnu';

  const clientContact =
    avoir.client?.contact_nom || client?.contact_nom || '';
  const clientTel =
    avoir.client?.telephone || client?.telephone || '';
  const clientAdresse =
    avoir.client?.adresse_facturation || client?.adresse_facturation || '';

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

          .credit-note-page {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: auto;
          }

          .credit-note-content {
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm !important;
            box-sizing: border-box !important;
          }
        }

        .credit-note-page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          display: block;
          margin: 0 auto;
        }
      `}</style>

      <div
        className="credit-note-page bg-white"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        <div
          className="credit-note-content"
          style={{
            padding: '15mm',
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── Company Header ── */}
          <div className="flex justify-between items-start mb-8">
            {/* Logo */}
            <div style={{ width: '52mm', flexShrink: 0 }}>
              <img
                src="/logo-goahead.png"
                alt="Go Ahead"
                style={{ height: '60px', width: 'auto', display: 'block' }}
              />
            </div>

            {/* Company details */}
            <div className="text-right text-sm">
              <h1 className="text-xl font-bold mb-1">GO AHEAD SARLU</h1>
              <p className="font-semibold">Département de Sécurité et Gardiennage</p>
              <p className="text-xs mt-1">RCCM: CD/GOM/RCCM/20-B-00414</p>
              <p className="text-xs">
                ID NAT.: 19-H5300-N897290 &nbsp;|&nbsp; IMPOT: A2155845A
              </p>
            </div>
          </div>

          {/* ── Document Title ── */}
          <div className="text-center mb-6">
            <h2
              className="text-2xl font-bold uppercase tracking-wide"
              style={{ borderBottom: '2px solid black', paddingBottom: '6px', display: 'inline-block' }}
            >
              Note de Crédit / Avoir
            </h2>
          </div>

          {/* ── Client Info + AV / FAC numbers ── */}
          <div className="grid grid-cols-3 gap-8 mb-6 text-sm">
            {/* Client block */}
            <div>
              <p className="font-semibold mb-1">Client</p>
              <p className="font-bold">{clientNom}</p>
              {clientContact && <p>{clientContact}</p>}
              {clientTel && <p>{clientTel}</p>}
              {clientAdresse && <p className="text-xs text-gray-600">{clientAdresse}</p>}
            </div>

            {/* AV number + date */}
            <div className="text-left">
              <p className="font-semibold mb-1">Numéro Avoir</p>
              <p className="font-bold text-lg">{avoir.numero_avoir}</p>
              <p className="font-semibold mt-2">Date</p>
              <p>{formatDate(avoir.date_avoir)}</p>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className="font-semibold mb-1">Montant crédité</p>
              <p className="font-bold text-2xl">
                {formatCurrency(avoir.montant_avoir, avoir.devise)}
              </p>
            </div>
          </div>

          {/* ── Reference to original invoice ── */}
          <div
            className="mb-6 p-3 text-sm"
            style={{ border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb' }}
          >
            <p className="font-semibold mb-1">Référence</p>
            <p>
              Avoir sur Facture :{' '}
              <span className="font-bold">{facture.numero_facture}</span>
              {facture.date_emission && (
                <span className="text-gray-600 ml-2">
                  (émise le {formatDate(facture.date_emission)})
                </span>
              )}
            </p>
          </div>

          {/* ── Credit note detail table ── */}
          <div className="mb-6">
            <table className="w-full border-collapse border-t-2 border-b-2 border-black">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-2 px-2 font-semibold text-sm">Description</th>
                  <th className="text-left py-2 px-2 font-semibold text-sm">Facture d'origine</th>
                  <th className="text-right py-2 px-2 font-semibold text-sm">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-2 text-sm">{avoir.motif_avoir}</td>
                  <td className="py-3 px-2 text-sm">{facture.numero_facture}</td>
                  <td className="py-3 px-2 text-sm text-right font-semibold">
                    {formatCurrency(avoir.montant_avoir, avoir.devise)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Total section ── */}
          <div className="flex justify-end mb-8">
            <div className="text-right">
              <div className="flex justify-between gap-8 mb-2">
                <span className="font-semibold text-sm">Total crédité</span>
                <span className="font-bold text-lg">
                  {formatCurrency(avoir.montant_avoir, avoir.devise)}
                </span>
              </div>
              <p className="text-xs italic" style={{ marginTop: '12px' }}>
                Pour Go Ahead,
              </p>
            </div>
          </div>

          {/* ── Signature space ── */}
          <div className="flex justify-end mb-12">
            <div className="text-center">
              <div className="h-16 mb-2" />
              <div className="border-t border-black w-48">
                <p className="text-xs mt-1">Facturation</p>
              </div>
            </div>
          </div>

          {/* ── Footer (pushed to bottom) ── */}
          <div className="mt-auto pt-4">
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
    </>
  );
}
