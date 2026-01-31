import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  Download, 
  Calendar,
  Shield,
  Truck,
  AlertTriangle,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  Plus,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface OperationsReportData {
  siteCoverage: {
    totalSites: number;
    activeSites: number;
    totalGuards: number;
    averageGuardsPerSite: number;
    coveragePercentage: number;
    criticalGaps: number;
    bySite: { site: string; guards: number; status: string; client: string }[];
  };
  guardPerformance: {
    totalGuards: number;
    onDuty: number;
    offDuty: number;
    available: number;
    efficiency: number;
    byStatus: { status: string; count: number; percentage: number }[];
    byShift: { shift: string; count: number }[];
  };
  roteurUtilization: {
    totalRoteurs: number;
    activeRoteurs: number;
    utilizationRate: number;
    averageAssignments: number;
    weeklyHours: number;
    efficiency: number;
    byRoteur: { name: string; assignments: number; sites: string[] }[];
  };
  fleet: {
    totalVehicles: number;
    operational: number;
    maintenance: number;
    outOfService: number;
    utilizationRate: number;
    byType: { type: string; count: number; operational: number }[];
    maintenanceScheduled: { vehicle: string; date: string; type: string }[];
  };
  incidents: {
    total: number;
    resolved: number;
    pending: number;
    critical: number;
    averageResolutionTime: number;
    bySeverity: { severity: string; count: number; percentage: number }[];
    byStatus: { status: string; count: number }[];
    byMonth: { month: string; count: number }[];
    recentIncidents: {
      id: string;
      title: string;
      severity: string;
      status: string;
      site: string;
      date: string;
      assignedTo?: string;
    }[];
  };
  quickActions: {
    sitesNeedingCoverage: number;
    overdueIncidents: number;
    vehiclesNeedingMaintenance: number;
    guardsNeedingDeployment: number;
  };
}

export default function OperationsReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<OperationsReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<'overview' | 'coverage' | 'guards' | 'roteurs' | 'fleet' | 'incidents'>('overview');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    site: '',
    status: '',
    severity: ''
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    try {
      const [employees, sites, deployments, vehicles, incidents, roteurAssignments] = await Promise.all([
        window.electronAPI.getEmployeesGAS(),
        window.electronAPI.getSitesGAS(),
        window.electronAPI.getDeploymentHistory ? window.electronAPI.getDeploymentHistory() : Promise.resolve([]),
        window.electronAPI.getVehicles ? window.electronAPI.getVehicles() : Promise.resolve([]),
        window.electronAPI.getIncidents ? window.electronAPI.getIncidents() : Promise.resolve([]),
        window.electronAPI.getRoteurAssignments ? window.electronAPI.getRoteurAssignments() : Promise.resolve([])
      ]);

      // Filter guards and roteurs
      const guards = employees.filter((emp: any) => emp.categorie === 'GARDE' && emp.poste === 'GARDE');
      const roteurs = employees.filter((emp: any) => emp.categorie === 'GARDE' && emp.poste === 'ROTEUR');

      // Filter active deployments
      const activeDeployments = deployments.filter((dep: any) => !dep.date_fin);
      const activeSites = sites.filter((site: any) => site.est_actif);

      // Site coverage analysis
      const coveredSiteIds = new Set(activeDeployments.map((d: any) => d.site_id));
      const uncoveredSites = activeSites.filter((s: any) => !coveredSiteIds.has(s.id));
      const coveragePercentage = activeSites.length > 0 ? Math.round((coveredSiteIds.size / activeSites.length) * 100) : 0;
      const criticalGaps = uncoveredSites.filter((s: any) => (s.effectif_jour_requis + s.effectif_nuit_requis) > 0).length;

      const guardsBySite = activeDeployments.reduce((acc: any, dep: any) => {
        const siteId = dep.site_id;
        const site = sites.find((s: any) => s.id === siteId);
        const siteName = site?.nom_site || 'Site inconnu';
        const client = site?.client_nom || 'Client inconnu';
        
        if (!acc[siteName]) {
          acc[siteName] = { site: siteName, guards: 0, status: 'Couvert', client };
        }
        acc[siteName].guards++;
        return acc;
      }, {});

      // Add uncovered sites
      uncoveredSites.forEach((site: any) => {
        if (!guardsBySite[site.nom_site]) {
          guardsBySite[site.nom_site] = {
            site: site.nom_site,
            guards: 0,
            status: 'Non couvert',
            client: site.client_nom || 'Client inconnu'
          };
        }
      });

      // Guard performance analysis
      const onDutyGuards = activeDeployments.length;
      const availableGuards = guards.filter((g: any) => g.statut === 'ACTIF').length - onDutyGuards;
      const efficiency = guards.length > 0 ? Math.round((onDutyGuards / guards.length) * 100) : 0;

      const guardsByStatus = guards.reduce((acc: any, guard: any) => {
        const status = guard.statut || 'Autre';
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
      }, {});

      const guardsByShift = activeDeployments.reduce((acc: any, dep: any) => {
        const shift = dep.poste || 'Non défini';
        if (!acc[shift]) acc[shift] = 0;
        acc[shift]++;
        return acc;
      }, {});

      // Roteur utilization analysis
      const activeRoteurAssignments = roteurAssignments.filter((r: any) => r.statut === 'EN_COURS' || r.statut === 'PLANIFIE');
      const roteurUtilizationRate = roteurs.length > 0 ? Math.round((activeRoteurAssignments.length / roteurs.length) * 100) : 0;
      const weeklyAssignments = activeRoteurAssignments.reduce((total: number, assignment: any) => {
        return total + (assignment.weekly_assignments?.length || 1);
      }, 0);
      const averageAssignments = roteurs.length > 0 ? Math.round((weeklyAssignments / roteurs.length) * 10) / 10 : 0;

      const roteurDetails = activeRoteurAssignments.map((assignment: any) => ({
        name: assignment.roteur_nom || 'Rôteur inconnu',
        assignments: assignment.weekly_assignments?.length || 1,
        sites: assignment.weekly_assignments?.map((wa: any) => wa.site_nom).filter(Boolean) || []
      }));

      // Fleet analysis
      const operationalVehicles = vehicles.filter((v: any) => v.statut === 'ACTIF').length;
      const maintenanceVehicles = vehicles.filter((v: any) => v.statut === 'EN_REPARATION').length;
      const outOfServiceVehicles = vehicles.filter((v: any) => v.statut === 'HORS_SERVICE').length;
      const fleetUtilization = vehicles.length > 0 ? Math.round((operationalVehicles / vehicles.length) * 100) : 0;

      const vehiclesByType = vehicles.reduce((acc: any, vehicle: any) => {
        const type = vehicle.type_vehicule || 'Autre';
        if (!acc[type]) acc[type] = { type, count: 0, operational: 0 };
        acc[type].count++;
        if (vehicle.statut === 'ACTIF') acc[type].operational++;
        return acc;
      }, {});

      // Incidents analysis (mock data if no real incidents)
      const mockIncidents = incidents.length === 0 ? [
        {
          id: '1',
          title: 'Intrusion détectée - Site Alpha',
          severity: 'HIGH',
          status: 'INVESTIGATING',
          site: 'Site Alpha',
          date: '2024-01-31',
          assignedTo: 'Marie Martin'
        },
        {
          id: '2',
          title: 'Panne d\'éclairage - Zone B',
          severity: 'MEDIUM',
          status: 'RESOLVED',
          site: 'Site Beta',
          date: '2024-01-30'
        }
      ] : incidents;

      const resolvedIncidents = mockIncidents.filter((i: any) => i.status === 'RESOLVED').length;
      const pendingIncidents = mockIncidents.filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
      const criticalIncidents = mockIncidents.filter((i: any) => i.severity === 'CRITICAL').length;

      const incidentsBySeverity = mockIncidents.reduce((acc: any, incident: any) => {
        const severity = incident.severity || 'UNKNOWN';
        if (!acc[severity]) acc[severity] = 0;
        acc[severity]++;
        return acc;
      }, {});

      const incidentsByStatus = mockIncidents.reduce((acc: any, incident: any) => {
        const status = incident.status || 'UNKNOWN';
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
      }, {});

      // Quick actions data
      const quickActions = {
        sitesNeedingCoverage: criticalGaps,
        overdueIncidents: mockIncidents.filter((i: any) => i.status === 'REPORTED' && 
          new Date(i.date) < new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
        vehiclesNeedingMaintenance: vehicles.filter((v: any) => 
          v.controle_technique_expiration && 
          new Date(v.controle_technique_expiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
        guardsNeedingDeployment: availableGuards
      };

      setReportData({
        siteCoverage: {
          totalSites: sites.length,
          activeSites: activeSites.length,
          totalGuards: activeDeployments.length,
          averageGuardsPerSite: activeSites.length > 0 ? Math.round((activeDeployments.length / activeSites.length) * 10) / 10 : 0,
          coveragePercentage,
          criticalGaps,
          bySite: Object.values(guardsBySite)
        },
        guardPerformance: {
          totalGuards: guards.length,
          onDuty: onDutyGuards,
          offDuty: guards.length - onDutyGuards,
          available: availableGuards,
          efficiency,
          byStatus: Object.entries(guardsByStatus).map(([status, count]) => ({
            status,
            count: count as number,
            percentage: Math.round(((count as number) / guards.length) * 100)
          })),
          byShift: Object.entries(guardsByShift).map(([shift, count]) => ({ shift, count: count as number }))
        },
        roteurUtilization: {
          totalRoteurs: roteurs.length,
          activeRoteurs: activeRoteurAssignments.length,
          utilizationRate: roteurUtilizationRate,
          averageAssignments,
          weeklyHours: weeklyAssignments * 8, // Assuming 8 hours per assignment
          efficiency: roteurUtilizationRate,
          byRoteur: roteurDetails
        },
        fleet: {
          totalVehicles: vehicles.length,
          operational: operationalVehicles,
          maintenance: maintenanceVehicles,
          outOfService: outOfServiceVehicles,
          utilizationRate: fleetUtilization,
          byType: Object.values(vehiclesByType),
          maintenanceScheduled: vehicles
            .filter((v: any) => v.controle_technique_expiration)
            .map((v: any) => ({
              vehicle: `${v.marque} ${v.modele} (${v.immatriculation})`,
              date: v.controle_technique_expiration,
              type: 'Contrôle technique'
            }))
            .slice(0, 5)
        },
        incidents: {
          total: mockIncidents.length,
          resolved: resolvedIncidents,
          pending: pendingIncidents,
          critical: criticalIncidents,
          averageResolutionTime: 24, // Mock average resolution time in hours
          bySeverity: Object.entries(incidentsBySeverity).map(([severity, count]) => ({
            severity,
            count: count as number,
            percentage: Math.round(((count as number) / mockIncidents.length) * 100)
          })),
          byStatus: Object.entries(incidentsByStatus).map(([status, count]) => ({ status, count: count as number })),
          byMonth: [
            { month: 'Jan', count: Math.floor(mockIncidents.length * 0.3) },
            { month: 'Fév', count: Math.floor(mockIncidents.length * 0.7) }
          ],
          recentIncidents: mockIncidents.slice(0, 5).map((incident: any) => ({
            id: incident.id,
            title: incident.title,
            severity: incident.severity,
            status: incident.status,
            site: incident.site,
            date: incident.date,
            assignedTo: incident.assignedTo
          }))
        },
        quickActions
      });
    } catch (error) {
      console.error('Error loading operations report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = [
      ['RAPPORT OPÉRATIONS - VUE D\'ENSEMBLE'],
      ['Période', `${dateRange.startDate} - ${dateRange.endDate}`],
      ['Généré le', new Date().toLocaleDateString('fr-FR')],
      [''],
      ['MÉTRIQUES CLÉS'],
      ['Couverture des sites', `${reportData.siteCoverage.coveragePercentage}%`],
      ['Efficacité des gardes', `${reportData.guardPerformance.efficiency}%`],
      ['Utilisation des rôteurs', `${reportData.roteurUtilization.utilizationRate}%`],
      ['Utilisation de la flotte', `${reportData.fleet.utilizationRate}%`],
      [''],
      ['ACTIONS RAPIDES REQUISES'],
      ['Sites nécessitant couverture', reportData.quickActions.sitesNeedingCoverage],
      ['Incidents en retard', reportData.quickActions.overdueIncidents],
      ['Véhicules nécessitant maintenance', reportData.quickActions.vehiclesNeedingMaintenance],
      ['Gardes disponibles pour déploiement', reportData.quickActions.guardsNeedingDeployment]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Vue d\'ensemble');

    // Site Coverage sheet
    const coverageData = [
      ['COUVERTURE DES SITES'],
      ['Période', `${dateRange.startDate} - ${dateRange.endDate}`],
      [''],
      ['STATISTIQUES GÉNÉRALES'],
      ['Total Sites', reportData.siteCoverage.totalSites],
      ['Sites Actifs', reportData.siteCoverage.activeSites],
      ['Pourcentage de couverture', `${reportData.siteCoverage.coveragePercentage}%`],
      ['Gaps critiques', reportData.siteCoverage.criticalGaps],
      ['Total Gardes Déployés', reportData.siteCoverage.totalGuards],
      ['Moyenne Gardes/Site', reportData.siteCoverage.averageGuardsPerSite],
      [''],
      ['DÉTAIL PAR SITE'],
      ['Site', 'Client', 'Nombre de Gardes', 'Statut'],
      ...reportData.siteCoverage.bySite.map(item => [item.site, item.client, item.guards, item.status])
    ];
    const wsCoverage = XLSX.utils.aoa_to_sheet(coverageData);
    XLSX.utils.book_append_sheet(wb, wsCoverage, 'Couverture Sites');

    // Guard Performance sheet
    const guardsData = [
      ['PERFORMANCE DES GARDES'],
      ['Total Gardes', reportData.guardPerformance.totalGuards],
      ['En Service', reportData.guardPerformance.onDuty],
      ['Hors Service', reportData.guardPerformance.offDuty],
      ['Disponibles', reportData.guardPerformance.available],
      ['Efficacité', `${reportData.guardPerformance.efficiency}%`],
      [''],
      ['PAR STATUT'],
      ['Statut', 'Nombre', 'Pourcentage'],
      ...reportData.guardPerformance.byStatus.map(item => [item.status, item.count, `${item.percentage}%`]),
      [''],
      ['PAR ÉQUIPE'],
      ['Équipe', 'Nombre'],
      ...reportData.guardPerformance.byShift.map(item => [item.shift, item.count])
    ];
    const wsGuards = XLSX.utils.aoa_to_sheet(guardsData);
    XLSX.utils.book_append_sheet(wb, wsGuards, 'Gardes');

    // Roteur Utilization sheet
    const roteursData = [
      ['UTILISATION DES RÔTEURS'],
      ['Total Rôteurs', reportData.roteurUtilization.totalRoteurs],
      ['Rôteurs Actifs', reportData.roteurUtilization.activeRoteurs],
      ['Taux d\'Utilisation', `${reportData.roteurUtilization.utilizationRate}%`],
      ['Moyenne Affectations', reportData.roteurUtilization.averageAssignments],
      ['Heures Hebdomadaires', reportData.roteurUtilization.weeklyHours],
      [''],
      ['DÉTAIL PAR RÔTEUR'],
      ['Nom', 'Affectations', 'Sites Couverts'],
      ...reportData.roteurUtilization.byRoteur.map(item => [item.name, item.assignments, item.sites.join(', ')])
    ];
    const wsRoteurs = XLSX.utils.aoa_to_sheet(roteursData);
    XLSX.utils.book_append_sheet(wb, wsRoteurs, 'Rôteurs');

    // Fleet sheet
    const fleetData = [
      ['PARC AUTOMOBILE'],
      ['Total Véhicules', reportData.fleet.totalVehicles],
      ['Opérationnels', reportData.fleet.operational],
      ['En Maintenance', reportData.fleet.maintenance],
      ['Hors Service', reportData.fleet.outOfService],
      ['Taux d\'Utilisation', `${reportData.fleet.utilizationRate}%`],
      [''],
      ['PAR TYPE'],
      ['Type', 'Total', 'Opérationnels'],
      ...reportData.fleet.byType.map(item => [item.type, item.count, item.operational]),
      [''],
      ['MAINTENANCE PROGRAMMÉE'],
      ['Véhicule', 'Date', 'Type'],
      ...reportData.fleet.maintenanceScheduled.map(item => [item.vehicle, item.date, item.type])
    ];
    const wsFleet = XLSX.utils.aoa_to_sheet(fleetData);
    XLSX.utils.book_append_sheet(wb, wsFleet, 'Parc Auto');

    // Incidents sheet
    const incidentsData = [
      ['GESTION DES INCIDENTS'],
      ['Total Incidents', reportData.incidents.total],
      ['Résolus', reportData.incidents.resolved],
      ['En Attente', reportData.incidents.pending],
      ['Critiques', reportData.incidents.critical],
      ['Temps Moyen de Résolution (h)', reportData.incidents.averageResolutionTime],
      [''],
      ['PAR SÉVÉRITÉ'],
      ['Sévérité', 'Nombre', 'Pourcentage'],
      ...reportData.incidents.bySeverity.map(item => [item.severity, item.count, `${item.percentage}%`]),
      [''],
      ['PAR STATUT'],
      ['Statut', 'Nombre'],
      ...reportData.incidents.byStatus.map(item => [item.status, item.count]),
      [''],
      ['INCIDENTS RÉCENTS'],
      ['ID', 'Titre', 'Sévérité', 'Statut', 'Site', 'Date', 'Assigné à'],
      ...reportData.incidents.recentIncidents.map(item => [
        item.id, item.title, item.severity, item.status, item.site, item.date, item.assignedTo || 'Non assigné'
      ])
    ];
    const wsIncidents = XLSX.utils.aoa_to_sheet(incidentsData);
    XLSX.utils.book_append_sheet(wb, wsIncidents, 'Incidents');

    XLSX.writeFile(wb, `Rapport_Operations_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT OPÉRATIONS', pageWidth / 2, 30, { align: 'center' });

    // Period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période: ${dateRange.startDate} - ${dateRange.endDate}`, pageWidth / 2, 45, { align: 'center' });
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 55, { align: 'center' });

    let yPosition = 75;

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ EXÉCUTIF', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
      ['Métrique', 'Valeur', 'Statut'],
      ['Couverture des sites', `${reportData.siteCoverage.coveragePercentage}%`, reportData.siteCoverage.coveragePercentage >= 90 ? 'Bon' : 'À améliorer'],
      ['Efficacité des gardes', `${reportData.guardPerformance.efficiency}%`, reportData.guardPerformance.efficiency >= 80 ? 'Bon' : 'À améliorer'],
      ['Utilisation des rôteurs', `${reportData.roteurUtilization.utilizationRate}%`, reportData.roteurUtilization.utilizationRate >= 70 ? 'Bon' : 'À améliorer'],
      ['Utilisation de la flotte', `${reportData.fleet.utilizationRate}%`, reportData.fleet.utilizationRate >= 75 ? 'Bon' : 'À améliorer']
    ];

    (doc as any).autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Quick Actions Required
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIONS RAPIDES REQUISES', margin, yPosition);
    yPosition += 15;

    const quickActionsData = [
      ['Action', 'Nombre'],
      ['Sites nécessitant couverture', reportData.quickActions.sitesNeedingCoverage.toString()],
      ['Incidents en retard', reportData.quickActions.overdueIncidents.toString()],
      ['Véhicules nécessitant maintenance', reportData.quickActions.vehiclesNeedingMaintenance.toString()],
      ['Gardes disponibles pour déploiement', reportData.quickActions.guardsNeedingDeployment.toString()]
    ];

    (doc as any).autoTable({
      head: [quickActionsData[0]],
      body: quickActionsData.slice(1),
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [217, 83, 79] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Site Coverage Details
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COUVERTURE DES SITES', margin, yPosition);
    yPosition += 15;

    const siteData = [
      ['Site', 'Client', 'Gardes', 'Statut'],
      ...reportData.siteCoverage.bySite.slice(0, 15).map(item => [
        item.site.substring(0, 25),
        item.client.substring(0, 20),
        item.guards.toString(),
        item.status
      ])
    ];

    (doc as any).autoTable({
      head: [siteData[0]],
      body: siteData.slice(1),
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [92, 184, 92] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' }
      }
    });

    // Add more pages for incidents if needed
    if (reportData.incidents.recentIncidents.length > 0) {
      doc.addPage();
      yPosition = 30;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INCIDENTS RÉCENTS', margin, yPosition);
      yPosition += 15;

      const incidentData = [
        ['Titre', 'Sévérité', 'Statut', 'Site', 'Date'],
        ...reportData.incidents.recentIncidents.slice(0, 10).map(item => [
          item.title.substring(0, 30),
          item.severity,
          item.status,
          item.site.substring(0, 20),
          item.date
        ])
      ];

      (doc as any).autoTable({
        head: [incidentData[0]],
        body: incidentData.slice(1),
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [240, 173, 78] }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
      doc.text('Rapport Opérations - Confidentiel', margin, doc.internal.pageSize.height - 10);
    }

    doc.save(`Rapport_Operations_${dateRange.startDate}_${dateRange.endDate}.pdf`);
  };

  const handleExport = () => {
    if (exportFormat === 'excel') {
      exportToExcel();
    } else {
      exportToPDF();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Enhanced Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rapports Opérations</h2>
            <p className="text-sm text-gray-600 mt-1">
              Analyse complète des performances opérationnelles et indicateurs clés
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            <button
              onClick={loadReportData}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
              </select>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>
        </div>

        {/* Date Range and Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Période:</label>
            </div>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">à</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select
                  value={filters.site}
                  onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les sites</option>
                  {/* Sites will be populated dynamically */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sévérité</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les sévérités</option>
                  <option value="LOW">Faible</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Élevée</option>
                  <option value="CRITICAL">Critique</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Panel */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Actions Rapides Requises</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="w-4 h-4" />
              <span>Mise à jour en temps réel</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border-2 ${reportData.quickActions.sitesNeedingCoverage > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <MapPin className={`w-5 h-5 ${reportData.quickActions.sitesNeedingCoverage > 0 ? 'text-red-600' : 'text-green-600'}`} />
                <span className={`text-2xl font-bold ${reportData.quickActions.sitesNeedingCoverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {reportData.quickActions.sitesNeedingCoverage}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700">Sites sans couverture</p>
              {reportData.quickActions.sitesNeedingCoverage > 0 && (
                <button className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium">
                  → Voir les sites
                </button>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${reportData.quickActions.overdueIncidents > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className={`w-5 h-5 ${reportData.quickActions.overdueIncidents > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                <span className={`text-2xl font-bold ${reportData.quickActions.overdueIncidents > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {reportData.quickActions.overdueIncidents}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700">Incidents en retard</p>
              {reportData.quickActions.overdueIncidents > 0 && (
                <button className="mt-2 text-xs text-orange-600 hover:text-orange-800 font-medium">
                  → Traiter incidents
                </button>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${reportData.quickActions.vehiclesNeedingMaintenance > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <Truck className={`w-5 h-5 ${reportData.quickActions.vehiclesNeedingMaintenance > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
                <span className={`text-2xl font-bold ${reportData.quickActions.vehiclesNeedingMaintenance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {reportData.quickActions.vehiclesNeedingMaintenance}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700">Véhicules à maintenir</p>
              {reportData.quickActions.vehiclesNeedingMaintenance > 0 && (
                <button className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 font-medium">
                  → Planifier maintenance
                </button>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${reportData.quickActions.guardsNeedingDeployment > 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <Users className={`w-5 h-5 ${reportData.quickActions.guardsNeedingDeployment > 0 ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`text-2xl font-bold ${reportData.quickActions.guardsNeedingDeployment > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                  {reportData.quickActions.guardsNeedingDeployment}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700">Gardes disponibles</p>
              {reportData.quickActions.guardsNeedingDeployment > 0 && (
                <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  → Déployer gardes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Type Tabs - Enhanced */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3, description: 'Résumé exécutif' },
              { id: 'coverage', label: 'Couverture Sites', icon: MapPin, description: 'Analyse des sites' },
              { id: 'guards', label: 'Performance Gardes', icon: Shield, description: 'Efficacité du personnel' },
              { id: 'roteurs', label: 'Utilisation Rôteurs', icon: Users, description: 'Rotations et affectations' },
              { id: 'fleet', label: 'Parc Automobile', icon: Truck, description: 'Gestion des véhicules' },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle, description: 'Sécurité et incidents' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id as any)}
                  className={`flex flex-col items-center gap-1 py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                    selectedReport === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  <span className="text-xs text-gray-400">{tab.description}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {selectedReport === 'overview' && reportData && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Résumé Exécutif</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${reportData.siteCoverage.coveragePercentage >= 90 ? 'text-green-600' : reportData.siteCoverage.coveragePercentage >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {reportData.siteCoverage.coveragePercentage}%
                    </div>
                    <div className="text-sm text-gray-600">Couverture Sites</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${reportData.siteCoverage.coveragePercentage >= 90 ? 'bg-green-100 text-green-800' : reportData.siteCoverage.coveragePercentage >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {reportData.siteCoverage.coveragePercentage >= 90 ? 'Excellent' : reportData.siteCoverage.coveragePercentage >= 70 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${reportData.guardPerformance.efficiency >= 80 ? 'text-green-600' : reportData.guardPerformance.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {reportData.guardPerformance.efficiency}%
                    </div>
                    <div className="text-sm text-gray-600">Efficacité Gardes</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${reportData.guardPerformance.efficiency >= 80 ? 'bg-green-100 text-green-800' : reportData.guardPerformance.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {reportData.guardPerformance.efficiency >= 80 ? 'Excellent' : reportData.guardPerformance.efficiency >= 60 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${reportData.roteurUtilization.utilizationRate >= 70 ? 'text-green-600' : reportData.roteurUtilization.utilizationRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {reportData.roteurUtilization.utilizationRate}%
                    </div>
                    <div className="text-sm text-gray-600">Utilisation Rôteurs</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${reportData.roteurUtilization.utilizationRate >= 70 ? 'bg-green-100 text-green-800' : reportData.roteurUtilization.utilizationRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {reportData.roteurUtilization.utilizationRate >= 70 ? 'Excellent' : reportData.roteurUtilization.utilizationRate >= 50 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${reportData.fleet.utilizationRate >= 75 ? 'text-green-600' : reportData.fleet.utilizationRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {reportData.fleet.utilizationRate}%
                    </div>
                    <div className="text-sm text-gray-600">Utilisation Flotte</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${reportData.fleet.utilizationRate >= 75 ? 'bg-green-100 text-green-800' : reportData.fleet.utilizationRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {reportData.fleet.utilizationRate >= 75 ? 'Excellent' : reportData.fleet.utilizationRate >= 50 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Site Coverage */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Couverture des Sites</h4>
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sites actifs</span>
                      <span className="font-medium">{reportData.siteCoverage.activeSites}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sites couverts</span>
                      <span className="font-medium">{reportData.siteCoverage.activeSites - reportData.siteCoverage.criticalGaps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gaps critiques</span>
                      <span className={`font-medium ${reportData.siteCoverage.criticalGaps > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {reportData.siteCoverage.criticalGaps}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Taux de couverture</span>
                        <span className={`font-bold ${reportData.siteCoverage.coveragePercentage >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {reportData.siteCoverage.coveragePercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guard Performance */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Performance Gardes</h4>
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total gardes</span>
                      <span className="font-medium">{reportData.guardPerformance.totalGuards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">En service</span>
                      <span className="font-medium text-green-600">{reportData.guardPerformance.onDuty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Disponibles</span>
                      <span className="font-medium text-blue-600">{reportData.guardPerformance.available}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Efficacité</span>
                        <span className={`font-bold ${reportData.guardPerformance.efficiency >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {reportData.guardPerformance.efficiency}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roteur Utilization */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Utilisation Rôteurs</h4>
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total rôteurs</span>
                      <span className="font-medium">{reportData.roteurUtilization.totalRoteurs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Actifs</span>
                      <span className="font-medium text-purple-600">{reportData.roteurUtilization.activeRoteurs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Moy. affectations</span>
                      <span className="font-medium">{reportData.roteurUtilization.averageAssignments}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Taux d'utilisation</span>
                        <span className={`font-bold ${reportData.roteurUtilization.utilizationRate >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {reportData.roteurUtilization.utilizationRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fleet and Incidents Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Parc Automobile</h4>
                    <Truck className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total véhicules</span>
                      <span className="font-medium">{reportData.fleet.totalVehicles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Opérationnels</span>
                      <span className="font-medium text-green-600">{reportData.fleet.operational}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">En maintenance</span>
                      <span className="font-medium text-orange-600">{reportData.fleet.maintenance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hors service</span>
                      <span className="font-medium text-red-600">{reportData.fleet.outOfService}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Incidents</h4>
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total incidents</span>
                      <span className="font-medium">{reportData.incidents.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Résolus</span>
                      <span className="font-medium text-green-600">{reportData.incidents.resolved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">En attente</span>
                      <span className="font-medium text-yellow-600">{reportData.incidents.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Critiques</span>
                      <span className="font-medium text-red-600">{reportData.incidents.critical}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Recommandations
                </h4>
                <div className="space-y-3">
                  {reportData.siteCoverage.criticalGaps > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Sites sans couverture</p>
                        <p className="text-sm text-gray-600">
                          {reportData.siteCoverage.criticalGaps} site(s) nécessitent une couverture immédiate. 
                          Déployez des gardes disponibles ou réaffectez des rôteurs.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {reportData.guardPerformance.efficiency < 80 && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Efficacité des gardes</p>
                        <p className="text-sm text-gray-600">
                          L'efficacité actuelle de {reportData.guardPerformance.efficiency}% peut être améliorée. 
                          Considérez une formation supplémentaire ou une redistribution des affectations.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {reportData.fleet.maintenance > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Maintenance véhicules</p>
                        <p className="text-sm text-gray-600">
                          {reportData.fleet.maintenance} véhicule(s) en maintenance. 
                          Planifiez les interventions pour minimiser l'impact opérationnel.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {reportData.quickActions.guardsNeedingDeployment > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Gardes disponibles</p>
                        <p className="text-sm text-gray-600">
                          {reportData.quickActions.guardsNeedingDeployment} garde(s) disponible(s) pour déploiement. 
                          Optimisez la couverture en les affectant aux sites prioritaires.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'coverage' && reportData && (
            <div className="space-y-6">
              {/* Coverage Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Sites</span>
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.siteCoverage.totalSites}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Sites Actifs</span>
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.siteCoverage.activeSites}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Gardes Déployés</span>
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{reportData.siteCoverage.totalGuards}</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700">Moy. Gardes/Site</span>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {reportData.siteCoverage.averageGuardsPerSite.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* By Site */}
              {reportData.siteCoverage.bySite.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gardes par Site</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre de Gardes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.siteCoverage.bySite.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.site}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.guards}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedReport === 'guards' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance des Gardes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Gardes</span>
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.guardPerformance.totalGuards}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">En Service</span>
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.guardPerformance.onDuty}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Hors Service</span>
                    <Shield className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{reportData.guardPerformance.offDuty}</p>
                </div>
              </div>

              {reportData.guardPerformance.byStatus.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Statut</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.guardPerformance.byStatus.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.status}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedReport === 'roteurs' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Utilisation des Rôteurs</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Rôteurs</span>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.roteurUtilization.totalRoteurs}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Actifs</span>
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.roteurUtilization.activeRoteurs}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Taux d'Utilisation</span>
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportData.roteurUtilization.utilizationRate.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700">Moy. Affectations</span>
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {reportData.roteurUtilization.averageAssignments.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Le taux d'utilisation représente le pourcentage de rôteurs actuellement actifs. 
                  La moyenne d'affectations indique le nombre moyen de déploiements par rôteur.
                </p>
              </div>
            </div>
          )}

          {selectedReport === 'fleet' && reportData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Parc Automobile</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Véhicules</span>
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.fleet.totalVehicles}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Opérationnels</span>
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.fleet.operational}</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700">En Maintenance</span>
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{reportData.fleet.maintenance}</p>
                </div>
              </div>

              {reportData.fleet.byType.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Type de Véhicule</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.fleet.byType.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedReport === 'incidents' && reportData && (
            <div className="space-y-6">
              {/* Incidents Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Total Incidents</span>
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{reportData.incidents.total}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Résolus</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{reportData.incidents.resolved}</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-700">En Attente</span>
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">{reportData.incidents.pending}</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">Critiques</span>
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">{reportData.incidents.critical}</p>
                </div>
              </div>

              {/* Incidents by Severity */}
              {reportData.incidents.bySeverity.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Sévérité</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reportData.incidents.bySeverity.map((item, index) => {
                      const severityColors = {
                        'LOW': 'bg-green-100 text-green-800 border-green-200',
                        'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        'HIGH': 'bg-orange-100 text-orange-800 border-orange-200',
                        'CRITICAL': 'bg-red-100 text-red-800 border-red-200'
                      };
                      const severityLabels = {
                        'LOW': 'Faible',
                        'MEDIUM': 'Moyenne',
                        'HIGH': 'Élevée',
                        'CRITICAL': 'Critique'
                      };
                      
                      return (
                        <div key={index} className={`p-4 rounded-lg border-2 ${severityColors[item.severity as keyof typeof severityColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          <div className="text-center">
                            <div className="text-2xl font-bold mb-1">{item.count}</div>
                            <div className="text-sm font-medium">{severityLabels[item.severity as keyof typeof severityLabels] || item.severity}</div>
                            <div className="text-xs mt-1">{item.percentage}% du total</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Incidents */}
              {reportData.incidents.recentIncidents.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Incidents Récents</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Incident
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sévérité
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Site
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assigné à
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.incidents.recentIncidents.map((incident) => {
                          const severityColors = {
                            'LOW': 'bg-green-100 text-green-800',
                            'MEDIUM': 'bg-yellow-100 text-yellow-800',
                            'HIGH': 'bg-orange-100 text-orange-800',
                            'CRITICAL': 'bg-red-100 text-red-800'
                          };
                          const statusColors = {
                            'REPORTED': 'bg-blue-100 text-blue-800',
                            'INVESTIGATING': 'bg-yellow-100 text-yellow-800',
                            'RESOLVED': 'bg-green-100 text-green-800',
                            'CLOSED': 'bg-gray-100 text-gray-800'
                          };
                          const statusLabels = {
                            'REPORTED': 'Signalé',
                            'INVESTIGATING': 'En cours',
                            'RESOLVED': 'Résolu',
                            'CLOSED': 'Fermé'
                          };
                          
                          return (
                            <tr key={incident.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[incident.severity as keyof typeof severityColors] || 'bg-gray-100 text-gray-800'}`}>
                                  {incident.severity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[incident.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                                  {statusLabels[incident.status as keyof typeof statusLabels] || incident.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {incident.site}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(incident.date).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {incident.assignedTo || 'Non assigné'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Incident Trends */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendances Mensuelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Évolution par Mois</h4>
                    <div className="space-y-2">
                      {reportData.incidents.byMonth.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.month}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min((item.count / Math.max(...reportData.incidents.byMonth.map(m => m.count))) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Métriques Clés</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Temps moyen de résolution</span>
                        <span className="font-medium">{reportData.incidents.averageResolutionTime}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Taux de résolution</span>
                        <span className="font-medium text-green-600">
                          {reportData.incidents.total > 0 ? Math.round((reportData.incidents.resolved / reportData.incidents.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Incidents critiques</span>
                        <span className={`font-medium ${reportData.incidents.critical > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {reportData.incidents.critical}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items */}
              {(reportData.incidents.pending > 0 || reportData.incidents.critical > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Actions Requises
                  </h4>
                  <div className="space-y-3">
                    {reportData.incidents.critical > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-gray-900">Incidents critiques</p>
                          <p className="text-sm text-gray-600">
                            {reportData.incidents.critical} incident(s) critique(s) nécessitent une attention immédiate.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {reportData.incidents.pending > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-gray-900">Incidents en attente</p>
                          <p className="text-sm text-gray-600">
                            {reportData.incidents.pending} incident(s) en attente de traitement ou de résolution.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
