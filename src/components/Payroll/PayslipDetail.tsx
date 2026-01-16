import { useState, useEffect } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import { BulletinPaie, ActionDisciplinaire, RemboursementAvance } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayslipDetailProps {
  payslip: BulletinPaie;
  onClose: () => void;
}

export default function PayslipDetail({ payslip, onClose }: PayslipDetailProps) {
  const [details, setDetails] = useState<{
    actions_disciplinaires: ActionDisciplinaire[];
    remboursements: RemboursementAvance[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [payslip.id]);

  const loadDetails = async () => {
    if (!window.electronAPI) return;
    
    try {
      const data = await window.electronAPI.getPayslipDetail(payslip.id);
      setDetails({
        actions_disciplinaires: data.actions_disciplinaires || [],
        remboursements: data.remboursements || []
      });
    } catch (error) {
      console.error('Error loading payslip details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BULLETIN DE PAIE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Company info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Go Ahead Security', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Employee info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS EMPLOYE', 14, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const employeeInfo = [
      ['Matricule:', payslip.matricule],
      ['Nom Complet:', payslip.nom_complet],
      ['Catégorie:', payslip.categorie],
      ['Mode Rémunération:', payslip.mode_remuneration]
    ];

    employeeInfo.forEach(([label, value]) => {
      doc.text(label, 14, yPos);
      doc.text(value, 60, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Salary calculation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CALCUL DU SALAIRE', 14, yPos);
    yPos += 7;

    const salaryData = [];
    salaryData.push(['Salaire de Base', `$${payslip.salaire_base.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]);
    
    if (payslip.mode_remuneration === 'JOURNALIER') {
      salaryData.push([`  (${payslip.jours_travailles} jours × $${payslip.taux_journalier.toLocaleString('fr-FR')})`, '']);
    }
    
    if (payslip.primes > 0) {
      salaryData.push(['Primes', `$${payslip.primes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]);
    }
    
    if (payslip.arrieres > 0) {
      salaryData.push(['ℹ️ Arriérés (Info)', `$${payslip.arrieres.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]);
    }
    
    salaryData.push(['SALAIRE BRUT', `$${payslip.salaire_brut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]);

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: salaryData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === salaryData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Social deductions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RETENUES SOCIALES', 14, yPos);
    yPos += 7;

    const socialData = [
      ['CNSS', `-$${payslip.cnss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`],
      ['ONEM', `-$${payslip.onem.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`],
      ['INPP', `-$${payslip.inpp.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`],
      ['TOTAL RETENUES SOCIALES', `-$${payslip.total_retenues_sociales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]
    ];

    autoTable(doc, {
      startY: yPos,
      body: socialData,
      theme: 'plain',
      styles: { fontSize: 10, textColor: [220, 38, 38] },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === socialData.length - 1) {
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Tax
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('IMPOTS', 14, yPos);
    yPos += 7;

    const taxData = [
      ['Salaire Imposable', `$${payslip.salaire_imposable.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`],
      ['IPR (Impôt Professionnel)', `-$${payslip.ipr.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]
    ];

    autoTable(doc, {
      startY: yPos,
      body: taxData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === 1) {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Other deductions
    if (payslip.retenues_disciplinaires > 0 || payslip.avances > 0 || payslip.autres_retenues > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('AUTRES RETENUES', 14, yPos);
      yPos += 7;

      const otherData = [];
      if (payslip.retenues_disciplinaires > 0) {
        otherData.push(['Retenues Disciplinaires', `-$${payslip.retenues_disciplinaires.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]);
      }
      if (payslip.avances > 0) {
        otherData.push(['Remboursement Avances', `-$${payslip.avances.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]);
      }
      if (payslip.autres_retenues > 0) {
        otherData.push(['Autres Retenues', `-$${payslip.autres_retenues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]);
      }

      autoTable(doc, {
        startY: yPos,
        body: otherData,
        theme: 'plain',
        styles: { fontSize: 10, textColor: [220, 38, 38] },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Net salary
    doc.setFillColor(34, 197, 94);
    doc.rect(14, yPos, pageWidth - 28, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SALAIRE NET DU MOIS', 20, yPos + 10);
    doc.text(`$${payslip.salaire_net.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${payslip.devise}`, pageWidth - 20, yPos + 10, { align: 'right' });

    yPos += 20;

    // Arriérés and total to pay
    if (payslip.arrieres > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Arriérés (salaires impayés des mois précédents)', 14, yPos);
      doc.text(`+ $${payslip.arrieres.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${payslip.devise}`, pageWidth - 14, yPos, { align: 'right' });
      yPos += 10;

      // Total to pay
      const totalAPayer = payslip.salaire_net + payslip.arrieres;
      doc.setFillColor(22, 163, 74);
      doc.rect(14, yPos, pageWidth - 28, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('MONTANT TOTAL À PAYER', 20, yPos + 10);
      doc.text(`$${totalAPayer.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${payslip.devise}`, pageWidth - 20, yPos + 10, { align: 'right' });
      yPos += 20;
    }

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Statut: ${payslip.statut}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Save PDF
    doc.save(`Bulletin_Paie_${payslip.matricule}_${payslip.nom_complet.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Bulletin de Paie</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Matricule</p>
                <p className="font-medium text-gray-900">{payslip.matricule}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nom Complet</p>
                <p className="font-medium text-gray-900">{payslip.nom_complet}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Catégorie</p>
                <p className="font-medium text-gray-900">{payslip.categorie}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mode Rémunération</p>
                <p className="font-medium text-gray-900">{payslip.mode_remuneration}</p>
              </div>
            </div>
          </div>

          {/* Salary Calculation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calcul du Salaire</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Salaire de Base</span>
                <span className="font-medium">${payslip.salaire_base.toLocaleString('fr-FR')}</span>
              </div>
              {payslip.mode_remuneration === 'JOURNALIER' && (
                <div className="flex justify-between py-2 border-b border-gray-200 text-sm text-gray-600">
                  <span>({payslip.jours_travailles} jours × ${payslip.taux_journalier.toLocaleString('fr-FR')})</span>
                  <span></span>
                </div>
              )}
              {payslip.primes > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Primes</span>
                  <span className="font-medium">${payslip.primes.toLocaleString('fr-FR')}</span>
                </div>
              )}
              {payslip.arrieres > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Arriérés</span>
                  <span className="font-medium text-blue-600">${payslip.arrieres.toLocaleString('fr-FR')}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b-2 border-gray-300 font-semibold">
                <span className="text-gray-900">Salaire Brut</span>
                <span className="text-gray-900">${payslip.salaire_brut.toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </div>

          {/* Social Deductions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Retenues Sociales</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">CNSS (5%)</span>
                <span className="text-red-600">-${payslip.cnss.toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">ONEM (1.5%)</span>
                <span className="text-red-600">-${payslip.onem.toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">INPP (0.5%)</span>
                <span className="text-red-600">-${payslip.inpp.toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-gray-300 font-semibold">
                <span className="text-gray-900">Total Retenues Sociales</span>
                <span className="text-red-600">-${payslip.total_retenues_sociales.toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </div>

          {/* Tax */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impôts</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Salaire Imposable</span>
                <span className="font-medium">${payslip.salaire_imposable.toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-gray-300">
                <span className="text-gray-700">IPR (Impôt Professionnel)</span>
                <span className="text-red-600">-${payslip.ipr.toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </div>

          {/* Other Deductions */}
          {(payslip.retenues_disciplinaires > 0 || payslip.avances > 0 || payslip.autres_retenues > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Autres Retenues</h3>
              <div className="space-y-2">
                {payslip.retenues_disciplinaires > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">Retenues Disciplinaires</span>
                    <span className="text-red-600">-${payslip.retenues_disciplinaires.toLocaleString('fr-FR')}</span>
                  </div>
                )}
                {payslip.avances > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">Remboursement Avances</span>
                    <span className="text-red-600">-${payslip.avances.toLocaleString('fr-FR')}</span>
                  </div>
                )}
                {payslip.autres_retenues > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">Autres Retenues</span>
                    <span className="text-red-600">-${payslip.autres_retenues.toLocaleString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disciplinary Actions Detail */}
          {!loading && details && details.actions_disciplinaires.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Disciplinaires Appliquées</h3>
              <div className="space-y-2">
                {details.actions_disciplinaires.map((action) => (
                  <div key={action.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-red-900">{action.type_action}</p>
                        <p className="text-sm text-red-700 mt-1">{action.description_incident}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Date: {new Date(action.date_incident).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="text-red-600 font-medium">
                        -${action.montant_deduction.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advance Repayments Detail */}
          {!loading && details && details.remboursements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Remboursements d'Avances</h3>
              <div className="space-y-2">
                {details.remboursements.map((remb) => (
                  <div key={remb.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-yellow-900">Avance #{remb.avance_id.substring(0, 8)}</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Montant total: ${remb.montant_total?.toLocaleString('fr-FR')} sur {remb.nombre_mensualites} mois
                        </p>
                      </div>
                      <span className="text-yellow-600 font-medium">
                        -${remb.montant_rembourse.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Net Salary */}
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-green-700">Salaire Net du Mois</p>
                <p className="text-xs text-green-600 mt-1">Devise: {payslip.devise}</p>
              </div>
              <p className="text-3xl font-bold text-green-700">
                ${payslip.salaire_net.toLocaleString('fr-FR')}
              </p>
            </div>
            
            {/* Arriérés and Total */}
            {payslip.arrieres > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-green-700">Arriérés (mois précédents)</span>
                  <span className="font-semibold text-green-700">
                    + ${payslip.arrieres.toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-300">
                  <span className="text-base font-bold text-green-800">MONTANT TOTAL À PAYER</span>
                  <span className="text-2xl font-bold text-green-800">
                    ${(payslip.salaire_net + payslip.arrieres).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Récapitulatif</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Salaire Brut</p>
                <p className="font-medium text-gray-900">${payslip.salaire_brut.toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Retenues</p>
                <p className="font-medium text-red-600">-${payslip.total_retenues.toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-gray-600">Statut</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  payslip.statut === 'PAYE' ? 'bg-green-100 text-green-800' :
                  payslip.statut === 'VALIDE' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {payslip.statut}
                </span>
              </div>
              <div>
                <p className="text-gray-600">Date Création</p>
                <p className="font-medium text-gray-900">
                  {payslip.cree_le ? new Date(payslip.cree_le).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
