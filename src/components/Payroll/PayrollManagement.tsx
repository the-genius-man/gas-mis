import { useState, useEffect } from 'react';
import { Plus, Calculator, Check, Lock, Eye, RefreshCw, Edit2, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { PeriodePaie, BulletinPaie } from '../../types';
import PayslipDetail from './PayslipDetail';
import PayslipEditForm from './PayslipEditForm';
import PayrollDeductionsModal from './PayrollDeductionsModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PayrollManagement() {
  const [periods, setPeriods] = useState<PeriodePaie[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodePaie | null>(null);
  const [payslips, setPayslips] = useState<BulletinPaie[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<BulletinPaie | null>(null);
  const [editingPayslip, setEditingPayslip] = useState<BulletinPaie | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showDeductionsModal, setShowDeductionsModal] = useState(false);

  // Form state for new period
  const [newPeriod, setNewPeriod] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    notes: ''
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      console.log('Selected period changed to:', selectedPeriod.id, selectedPeriod.mois, selectedPeriod.annee);
      loadPayslips(selectedPeriod.id);
      // Reset editing state when period changes
      console.log('Resetting editing states due to period change');
      setEditingPayslip(null);
      setSelectedPayslip(null);
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const data = await window.electronAPI.getPayrollPeriods();
      setPeriods(data);
      
      // Auto-select most recent period
      if (data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0]);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
      alert('Erreur lors du chargement des périodes. Veuillez redémarrer l\'application pour initialiser le module de paie.');
    } finally {
      setLoading(false);
    }
  };

  const loadPayslips = async (periodeId: string) => {
    if (!window.electronAPI) return;
    
    try {
      console.log('Loading payslips for period:', periodeId);
      const data = await window.electronAPI.getPayslips(periodeId);
      setPayslips(data);
      console.log('Payslips loaded, resetting editing states');
      // Reset editing states when loading new payslips
      setEditingPayslip(null);
      setSelectedPayslip(null);
    } catch (error) {
      console.error('Error loading payslips:', error);
      alert('Erreur lors du chargement des bulletins');
    }
  };

  const handleCreatePeriod = async () => {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.createPayrollPeriod(newPeriod);
      setShowNewPeriodForm(false);
      setNewPeriod({
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear(),
        notes: ''
      });
      loadPeriods();
      alert('Période créée avec succès');
    } catch (error: any) {
      console.error('Error creating period:', error);
      alert(error.message || 'Erreur lors de la création de la période');
    }
  };

  const handleCalculatePayroll = async () => {
    if (!selectedPeriod || !window.electronAPI) return;
    
    if (!confirm(`Calculer la paie pour ${getMonthName(selectedPeriod.mois)} ${selectedPeriod.annee}?\n\nCela remplacera les calculs existants.`)) {
      return;
    }
    
    setCalculating(true);
    try {
      await window.electronAPI.calculatePayroll({
        periodeId: selectedPeriod.id,
        mois: selectedPeriod.mois,
        annee: selectedPeriod.annee,
        calculePar: 'current_user' // TODO: get from auth context
      });
      
      // Reload periods and update selected period with new status
      const updatedPeriods = await window.electronAPI.getPayrollPeriods();
      setPeriods(updatedPeriods);
      const updatedPeriod = updatedPeriods.find(p => p.id === selectedPeriod.id);
      if (updatedPeriod) {
        setSelectedPeriod(updatedPeriod);
      }
      
      loadPayslips(selectedPeriod.id);
      alert('Paie calculée avec succès');
    } catch (error: any) {
      console.error('Error calculating payroll:', error);
      alert(error.message || 'Erreur lors du calcul de la paie');
    } finally {
      setCalculating(false);
    }
  };

  const handleValidatePayslips = async () => {
    if (!selectedPeriod || !window.electronAPI) return;
    
    if (!confirm(`Valider tous les bulletins de paie pour ${getMonthName(selectedPeriod.mois)} ${selectedPeriod.annee}?`)) {
      return;
    }
    
    try {
      await window.electronAPI.validatePayslips({
        periodeId: selectedPeriod.id,
        valideePar: 'current_user' // TODO: get from auth context
      });
      
      // Reload periods and update selected period with new status
      const updatedPeriods = await window.electronAPI.getPayrollPeriods();
      setPeriods(updatedPeriods);
      const updatedPeriod = updatedPeriods.find(p => p.id === selectedPeriod.id);
      if (updatedPeriod) {
        setSelectedPeriod(updatedPeriod);
      }
      
      loadPayslips(selectedPeriod.id);
      alert('Bulletins validés avec succès');
    } catch (error: any) {
      console.error('Error validating payslips:', error);
      alert(error.message || 'Erreur lors de la validation');
    }
  };

  const handleLockPeriod = async () => {
    if (!selectedPeriod || !window.electronAPI) return;
    
    if (!confirm(`Verrouiller la période ${getMonthName(selectedPeriod.mois)} ${selectedPeriod.annee}?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      await window.electronAPI.lockPayrollPeriod({
        periodeId: selectedPeriod.id,
        verrouilleePar: 'current_user' // TODO: get from auth context
      });
      
      // Reload periods and update selected period with new status
      const updatedPeriods = await window.electronAPI.getPayrollPeriods();
      setPeriods(updatedPeriods);
      const updatedPeriod = updatedPeriods.find(p => p.id === selectedPeriod.id);
      if (updatedPeriod) {
        setSelectedPeriod(updatedPeriod);
      }
      
      alert('Période verrouillée avec succès');
    } catch (error: any) {
      console.error('Error locking period:', error);
      alert(error.message || 'Erreur lors du verrouillage');
    }
  };

  const handleFlushPayroll = async () => {
    if (!window.electronAPI) return;
    
    if (!confirm('⚠️ ATTENTION: Cette action supprimera TOUTES les périodes de paie et bulletins.\n\nCela inclut:\n- Toutes les périodes de paie\n- Tous les bulletins de paie\n- Tous les salaires impayés\n- Tous les paiements de salaires\n\nCette action est IRRÉVERSIBLE!\n\nÊtes-vous absolument sûr?')) {
      return;
    }
    
    // Double confirmation
    if (!confirm('Dernière confirmation: Supprimer TOUTES les données de paie?')) {
      return;
    }
    
    try {
      await window.electronAPI.flushPayroll();
      setSelectedPeriod(null);
      setPayslips([]);
      loadPeriods();
      alert('✅ Toutes les données de paie ont été supprimées avec succès');
    } catch (error: any) {
      console.error('Error flushing payroll:', error);
      alert(error.message || 'Erreur lors de la suppression des données');
    }
  };

  const handleUpdatePayslip = async (updates: Partial<BulletinPaie>) => {
    if (!editingPayslip || !window.electronAPI) return;
    
    try {
      console.log('Updating payslip:', editingPayslip.id);
      await window.electronAPI.updatePayslip({
        bulletinId: editingPayslip.id,
        updates
      });
      
      console.log('Payslip updated successfully, closing form');
      setEditingPayslip(null);
      
      if (selectedPeriod) {
        console.log('Reloading payslips for period:', selectedPeriod.id);
        await loadPayslips(selectedPeriod.id);
      }
      alert('Bulletin modifié avec succès');
    } catch (error: any) {
      console.error('Error updating payslip:', error);
      throw error;
    }
  };

  const handleExportAllPDF = async () => {
    if (!selectedPeriod || !window.electronAPI || payslips.length === 0) {
      alert('Aucun bulletin à exporter');
      return;
    }

    if (exportingPDF) {
      return; // Prevent multiple clicks
    }

    setExportingPDF(true);
    try {
      console.log('Starting PDF export for period:', selectedPeriod.mois, selectedPeriod.annee);
      console.log('Number of payslips:', payslips.length);

      // Get employee IDs from payslips
      const employeeIds = payslips.map(p => p.employe_id);
      console.log('Employee IDs:', employeeIds);

      // Get deployments for all employees (try current deployment first, then fallback to employee site)
      const deploymentsPromises = employeeIds.map(async (id, index) => {
        try {
          console.log(`Getting deployment for employee ${index + 1}/${employeeIds.length}:`, id);
          
          // First try to get current deployment
          if (window.electronAPI.getCurrentDeployment) {
            const deployment = await window.electronAPI.getCurrentDeployment(id);
            if (deployment && deployment.nom_site) {
              console.log('Found deployment:', deployment.nom_site);
              return deployment;
            }
          }
          
          // Fallback: get employee data with site information
          if (window.electronAPI.getEmployeeGAS) {
            const employee = await window.electronAPI.getEmployeeGAS(id);
            if (employee && employee.site_nom) {
              console.log('Found employee site:', employee.site_nom);
              return { site_nom: employee.site_nom };
            }
          }
          
          console.log('No site found for employee:', id);
          return null;
        } catch (error) {
          console.error('Error getting deployment for employee:', id, error);
          return null;
        }
      });
      
      // Get arriérés details (which months) for employees who have arriérés > 0
      const arrieresPromises = payslips.map(async (payslip) => {
        if (payslip.arrieres <= 0) return [];
        
        try {
          // Get all unpaid salaries for this employee
          console.log('Calling getSalairesImpayes for employee:', payslip.employe_id);
          const salairesImpayes = await window.electronAPI.getSalairesImpayes({ 
            employe_id: payslip.employe_id
          });
          console.log('Got salaires impayes:', salairesImpayes?.length || 0, 'records');
          
          // Filter only previous periods with unpaid amounts
          return salairesImpayes.filter((s: any) => {
            // date_echeance is set to 15th of the month AFTER the payroll period
            // So January 2026 payroll has date_echeance = Feb 15, 2026
            // We need to check if this unpaid salary is from a period BEFORE the current one
            const echeanceDate = new Date(s.date_echeance);
            const echeanceYear = echeanceDate.getFullYear();
            const echeanceMonth = echeanceDate.getMonth() + 1; // 1-12
            
            // The payroll period is one month before the due date
            // So if due date is Feb 15, the period is January
            const salairePeriodYear = echeanceMonth === 1 ? echeanceYear - 1 : echeanceYear;
            const salairePeriodMonth = echeanceMonth === 1 ? 12 : echeanceMonth - 1;
            
            // Compare with current period
            const isPreviousPeriod = 
              (salairePeriodYear < selectedPeriod.annee) ||
              (salairePeriodYear === selectedPeriod.annee && salairePeriodMonth < selectedPeriod.mois);
            
            return isPreviousPeriod && 
                   (s.statut === 'IMPAYE' || s.statut === 'PAYE_PARTIEL') &&
                   s.montant_restant > 0;
          });
        } catch (error) {
          console.error('Error fetching arriérés for employee:', payslip.employe_id, error);
          return [];
        }
      });

      const [deployments, arrieresData] = await Promise.all([
        Promise.all(deploymentsPromises),
        Promise.all(arrieresPromises)
      ]);

      console.log('='.repeat(80));
      console.log('DEPLOYMENT DATA RETRIEVED:');
      console.log('='.repeat(80));
      deployments.forEach((d, i) => {
        console.log(`[${i}] ${payslips[i]?.nom_complet} (${payslips[i]?.employe_id})`);
        console.log(`    Deployment object:`, d);
        if (d) {
          console.log(`    - site_id: ${d.site_id || 'NULL'}`);
          console.log(`    - nom_site: ${d.nom_site || 'NULL'}`);
        }
        console.log(`    Site name: ${d?.nom_site || '❌ NULL'}`);
        console.log(`    Will show in PDF: "${d?.nom_site || 'Non affecté'}"`);
      });
      console.log('='.repeat(80));

      // Create PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Set margins (0.5 inches = 12.7mm)
      const margin = 12.7;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let yPos = margin;

      // Helper function to get month name in French
      const getMonthNameFr = (month: number) => {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
                        'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        return months[month - 1];
      };

      // Helper function to format arriérés
      const formatArrieres = (payslip: BulletinPaie, employeeArrieres: any[]) => {
        if (payslip.arrieres <= 0) {
          return '$0.00';
        }

        if (!employeeArrieres || employeeArrieres.length === 0) {
          // If we have arriérés but no month details, just show the amount
          return `$${payslip.arrieres.toFixed(2)}`;
        }

        const months = employeeArrieres.map((s: any) => {
          // date_echeance is 15th of month AFTER the payroll period
          // So we need to subtract 1 month to get the actual payroll period
          const echeanceDate = new Date(s.date_echeance);
          const echeanceMonth = echeanceDate.getMonth() + 1; // 1-12
          const echeanceYear = echeanceDate.getFullYear();
          
          // Calculate the actual payroll period (one month before due date)
          const periodMonth = echeanceMonth === 1 ? 12 : echeanceMonth - 1;
          const periodYear = echeanceMonth === 1 ? echeanceYear - 1 : echeanceYear;
          
          return `${getMonthNameFr(periodMonth)} ${periodYear}`;
        }).join(', ');

        return `$${payslip.arrieres.toFixed(2)} (${months})`;
      };

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`BULLETINS DE PAIE - ${getMonthName(selectedPeriod.mois).toUpperCase()} ${selectedPeriod.annee}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Go Ahead Security', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Separate by category
      const gardePayslips = payslips.filter(p => p.categorie === 'GARDE');
      const adminPayslips = payslips.filter(p => p.categorie === 'ADMINISTRATION');

      // Function to create table for a category
      const createCategoryTable = (categoryPayslips: BulletinPaie[], categoryName: string) => {
        if (categoryPayslips.length === 0) return;

        // Check if we need a new page
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${categoryName}`, margin, yPos);
        yPos += 7;

        const tableData = categoryPayslips.map((payslip, index) => {
          const payslipIndex = payslips.indexOf(payslip);
          const deployment = deployments[payslipIndex];
          const employeeArrieres = arrieresData[payslipIndex];
          
          const siteName = deployment?.nom_site || 'Non affecté';
          console.log(`  Table row for ${payslip.nom_complet}: index=${payslipIndex}, site="${siteName}"`);

          const totalAPayer = payslip.salaire_net + payslip.arrieres;

          return [
            payslip.nom_complet,
            siteName,
            `${payslip.salaire_base.toFixed(2)}`,
            formatArrieres(payslip, employeeArrieres),
            `$${payslip.salaire_brut.toFixed(2)}`,
            `$${payslip.retenues_disciplinaires.toFixed(2)}`,
            `$${payslip.autres_retenues.toFixed(2)}`,
            `$${payslip.salaire_net.toFixed(2)}`,
            `$${totalAPayer.toFixed(2)}`
          ];
        });

        // Calculate totals
        const totals = [
          'TOTAL',
          '',
          `${categoryPayslips.reduce((sum, p) => sum + p.salaire_base, 0).toFixed(2)}`,
          '', // Arriérés total not summed (different employees)
          `$${categoryPayslips.reduce((sum, p) => sum + p.salaire_brut, 0).toFixed(2)}`,
          `$${categoryPayslips.reduce((sum, p) => sum + p.retenues_disciplinaires, 0).toFixed(2)}`,
          `$${categoryPayslips.reduce((sum, p) => sum + p.autres_retenues, 0).toFixed(2)}`,
          `$${categoryPayslips.reduce((sum, p) => sum + p.salaire_net, 0).toFixed(2)}`,
          `$${categoryPayslips.reduce((sum, p) => sum + p.salaire_net + p.arrieres, 0).toFixed(2)}`
        ];

        autoTable(doc, {
          startY: yPos,
          head: [[
            'Nom Complet',
            'Site d\'Affectation',
            'Salaire de Base',
            'Arriérés de Salaire',
            'Salaire Brut',
            'Ret. Disciplinaires',
            'Autres Retenues',
            'Salaire Net',
            'Total à Payer'
          ]],
          body: [...tableData, totals],
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 2,
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 40 }, // Nom
            1: { cellWidth: 35 }, // Site
            2: { cellWidth: 22, halign: 'right' }, // Salaire de Base
            3: { cellWidth: 45 }, // Arriérés
            4: { cellWidth: 22, halign: 'right' }, // Brut
            5: { cellWidth: 22, halign: 'right' }, // Ret. Disc
            6: { cellWidth: 22, halign: 'right' }, // Autres
            7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }, // Net
            8: { cellWidth: 25, halign: 'right', fontStyle: 'bold' } // Total à Payer
          },
          didParseCell: (data) => {
            // Highlight totals row
            if (data.row.index === tableData.length) {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.fontStyle = 'bold';
            }
            // Alternate row colors
            if (data.row.index < tableData.length && data.row.index % 2 === 1) {
              data.cell.styles.fillColor = [250, 250, 250];
            }
          },
          margin: { left: margin, right: margin }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      };

      // Create tables for each category
      createCategoryTable(gardePayslips, 'GARDE');
      createCategoryTable(adminPayslips, 'ADMINISTRATION');

      // Grand total
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL GÉNÉRAL', margin, yPos);
      yPos += 7;

      const grandTotalData = [[
        'Total Tous Employés',
        `${payslips.length} employés`,
        `${payslips.reduce((sum, p) => sum + p.salaire_base, 0).toFixed(2)}`,
        '',
        `$${payslips.reduce((sum, p) => sum + p.salaire_brut, 0).toFixed(2)}`,
        `$${payslips.reduce((sum, p) => sum + p.retenues_disciplinaires, 0).toFixed(2)}`,
        `$${payslips.reduce((sum, p) => sum + p.autres_retenues, 0).toFixed(2)}`,
        `$${payslips.reduce((sum, p) => sum + p.salaire_net, 0).toFixed(2)}`,
        `$${payslips.reduce((sum, p) => sum + p.salaire_net + p.arrieres, 0).toFixed(2)}`
      ]];

      autoTable(doc, {
        startY: yPos,
        body: grandTotalData,
        theme: 'plain',
        styles: {
          fontSize: 11,
          fontStyle: 'bold',
          fillColor: [34, 197, 94],
          textColor: 255
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 35 },
          2: { cellWidth: 22, halign: 'right' },
          3: { cellWidth: 45 },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 22, halign: 'right' },
          7: { cellWidth: 22, halign: 'right' },
          8: { cellWidth: 25, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      // Footer
      const footerY = pageHeight - 10;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, footerY, { align: 'center' });

      // Save PDF
      const monthName = getMonthName(selectedPeriod.mois);
      doc.save(`GAS ${selectedPeriod.annee} - Bulletins_Paie_${monthName}.pdf`);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      console.error('Error stack:', error.stack);
      console.error('Selected period:', selectedPeriod);
      console.error('Payslips count:', payslips.length);
      
      let errorMessage = 'Erreur lors de l\'export PDF';
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
    } finally {
      setExportingPDF(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month - 1];
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      BROUILLON: 'bg-gray-100 text-gray-800',
      CALCULEE: 'bg-blue-100 text-blue-800',
      VALIDEE: 'bg-green-100 text-green-800',
      VERROUILLEE: 'bg-purple-100 text-purple-800'
    };
    return styles[statut as keyof typeof styles] || styles.BROUILLON;
  };

  if (selectedPayslip) {
    return (
      <PayslipDetail
        payslip={selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
      />
    );
  }

  if (editingPayslip) {
    console.log('Rendering PayslipEditForm for:', editingPayslip.nom_complet);
    return (
      <PayslipEditForm
        payslip={editingPayslip}
        onSave={handleUpdatePayslip}
        onCancel={() => {
          console.log('Cancelling payslip edit');
          setEditingPayslip(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion de la Paie</h2>
          <p className="text-gray-600 mt-1">Calcul et gestion des salaires mensuels</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Only show flush button in development */}
          {import.meta.env.DEV && (
            <button
              onClick={handleFlushPayroll}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Supprimer toutes les données de paie (DEV ONLY)"
            >
              <Trash2 className="w-5 h-5" />
              Réinitialiser
            </button>
          )}
          <button
            onClick={() => setShowNewPeriodForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Période
          </button>
        </div>
      </div>

      {/* New Period Form */}
      {showNewPeriodForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle Période de Paie</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois
              </label>
              <select
                value={newPeriod.mois}
                onChange={(e) => setNewPeriod({ ...newPeriod, mois: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <input
                type="number"
                value={newPeriod.annee}
                onChange={(e) => setNewPeriod({ ...newPeriod, annee: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <input
                type="text"
                value={newPeriod.notes}
                onChange={(e) => setNewPeriod({ ...newPeriod, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optionnel"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreatePeriod}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer
            </button>
            <button
              onClick={() => setShowNewPeriodForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Periods List */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Périodes</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chargement...</p>
                </div>
              ) : periods.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucune période de paie
                </div>
              ) : (
                periods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedPeriod(period)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedPeriod?.id === period.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {getMonthName(period.mois)} {period.annee}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatutBadge(period.statut)}`}>
                        {period.statut}
                      </span>
                    </div>
                    {period.nombre_bulletins !== undefined && (
                      <div className="text-sm text-gray-600">
                        <div>{period.nombre_bulletins} bulletins</div>
                        {period.total_net !== undefined && (
                          <div className="font-medium text-green-600 mt-1">
                            Net: ${period.total_net.toLocaleString('fr-FR')}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Payslips List */}
        <div className="col-span-8">
          {selectedPeriod ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bulletins - {getMonthName(selectedPeriod.mois)} {selectedPeriod.annee}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {payslips.length} employés
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedPeriod.statut === 'BROUILLON' && (
                      <button
                        onClick={handleCalculatePayroll}
                        disabled={calculating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Calculator className="w-4 h-4" />
                        {calculating ? 'Calcul...' : 'Calculer'}
                      </button>
                    )}
                    {selectedPeriod.statut === 'CALCULEE' && (
                      <>
                        <button
                          onClick={() => setShowDeductionsModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Déductions
                        </button>
                        <button
                          onClick={handleValidatePayslips}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Valider
                        </button>
                      </>
                    )}
                    {selectedPeriod.statut === 'VALIDEE' && (
                      <button
                        onClick={handleLockPeriod}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        Verrouiller
                      </button>
                    )}
                    {payslips.length > 0 && (
                      <button
                        onClick={handleExportAllPDF}
                        disabled={exportingPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-4 h-4" />
                        {exportingPDF ? 'Export en cours...' : 'Exporter PDF'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Brut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retenues</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payslips.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          {selectedPeriod.statut === 'BROUILLON' 
                            ? 'Cliquez sur "Calculer" pour générer les bulletins'
                            : 'Aucun bulletin disponible'}
                        </td>
                      </tr>
                    ) : (
                      payslips.map((payslip) => (
                        <tr key={payslip.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{payslip.matricule}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{payslip.nom_complet}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{payslip.categorie}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            ${payslip.salaire_brut.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">
                            -${payslip.total_retenues.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                            ${payslip.salaire_net.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {selectedPeriod.statut === 'CALCULEE' && payslip.statut === 'BROUILLON' && (
                                <button
                                  onClick={() => setEditingPayslip(payslip)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedPayslip(payslip)}
                                className="text-gray-600 hover:text-gray-800"
                                title="Voir détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {payslips.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                          ${payslips.reduce((sum, p) => sum + p.salaire_brut, 0).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-red-600">
                          -${payslips.reduce((sum, p) => sum + p.total_retenues, 0).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-green-600">
                          ${payslips.reduce((sum, p) => sum + p.salaire_net, 0).toLocaleString('fr-FR')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Sélectionnez une période pour voir les bulletins</p>
            </div>
          )}
        </div>
      </div>

      {/* Disciplinary Deductions Modal */}
      {showDeductionsModal && selectedPeriod && (
        <PayrollDeductionsModal
          periodeId={selectedPeriod.id}
          mois={selectedPeriod.mois}
          annee={selectedPeriod.annee}
          onClose={() => setShowDeductionsModal(false)}
        />
      )}
    </div>
  );
}
