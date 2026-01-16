import { Employee, ElectronClient, Site, DashboardStats, ClientGAS, SiteGAS, FactureGAS, PaiementGAS, CategorieDepense, CompteTresorerie, Depense, MouvementTresorerie, FinanceStats, DepenseFilters, MouvementFilters, Entree, EmployeeGASFull, HistoriqueDeployement, DemandeConge, CongeProvision, ActionDisciplinaire, AlerteSysteme, VehiculeFlotte, Equipement, AffectationRoteur, CoverageGap, ConsommationCarburant, ReparationVehicule, PeriodePaie, BulletinPaie, AvanceEmploye, RemboursementAvance, HRStats, FleetStats, InventoryStats, DisciplinaryStats } from '../types';

// Paiement Summary interface
interface PaiementSummary {
  montant_total: number;
  montant_paye: number;
  solde_restant: number;
  devise: string;
}

// Type declaration for the electron API
declare global {
  interface Window {
    electronAPI?: {
      // Employee operations
      getEmployees: () => Promise<Employee[]>;
      addEmployee: (employee: Employee) => Promise<{ success: boolean; id: string }>;
      updateEmployee: (employee: Employee) => Promise<{ success: boolean }>;
      deleteEmployee: (id: string) => Promise<{ success: boolean }>;
      
      // Client operations (Legacy)
      getClients: () => Promise<ElectronClient[]>;
      addClient: (client: ElectronClient) => Promise<{ success: boolean; id: string }>;
      updateClient: (client: ElectronClient) => Promise<{ success: boolean }>;
      deleteClient: (id: string) => Promise<{ success: boolean }>;
      
      // Site operations (Legacy)
      getSites: () => Promise<Site[]>;
      addSite: (site: Site) => Promise<{ success: boolean; id: string }>;
      updateSite: (site: Site) => Promise<{ success: boolean }>;
      deleteSite: (id: string) => Promise<{ success: boolean }>;
      
      // ============================================================================
      // GUARDIAN COMMAND - GAS API (Conformes au schéma SQL OHADA)
      // ============================================================================
      
      // Clients GAS
      getClientsGAS: (options?: { includeDeleted?: boolean; includeInactive?: boolean }) => Promise<ClientGAS[]>;
      getActiveClientsGAS: () => Promise<ClientGAS[]>;
      addClientGAS: (client: ClientGAS) => Promise<{ success: boolean; id: string }>;
      updateClientGAS: (client: ClientGAS) => Promise<{ success: boolean }>;
      updateClientStatusGAS: (data: { id: string; statut: string }) => Promise<{ success: boolean }>;
      deleteClientGAS: (id: string) => Promise<{ success: boolean }>;
      
      // Sites GAS
      getSitesGAS: () => Promise<SiteGAS[]>;
      addSiteGAS: (site: SiteGAS) => Promise<{ success: boolean; id: string }>;
      updateSiteGAS: (site: SiteGAS) => Promise<{ success: boolean }>;
      deleteSiteGAS: (id: string) => Promise<{ success: boolean }>;
      
      // Factures GAS
      getFacturesGAS: () => Promise<FactureGAS[]>;
      addFactureGAS: (facture: FactureGAS) => Promise<{ success: boolean; id: string }>;
      updateFactureGAS: (facture: FactureGAS) => Promise<{ success: boolean }>;
      deleteFactureGAS: (id: string) => Promise<{ success: boolean }>;
      
      // Paiements GAS
      getPaiementsGAS: (factureId?: string) => Promise<PaiementGAS[]>;
      addPaiementGAS: (paiement: PaiementGAS) => Promise<{ success: boolean; id: string }>;
      updatePaiementGAS: (paiement: PaiementGAS) => Promise<{ success: boolean }>;
      deletePaiementGAS: (id: string) => Promise<{ success: boolean }>;
      getFacturePaiementsSummary: (factureId: string) => Promise<PaiementSummary>;
      
      // Dashboard stats
      getDashboardStats: () => Promise<DashboardStats>;
      
      // Database seeding
      seedDatabase: () => Promise<{ success: boolean; message: string }>;
      
      // ============================================================================
      // FINANCE MODULE - OHADA Comptabilité
      // ============================================================================
      
      // Plan Comptable
      getPlanComptable: () => Promise<any[]>;
      
      // Catégories de Dépenses
      getCategoriesDepenses: () => Promise<CategorieDepense[]>;
      
      // Comptes de Trésorerie
      getComptesTresorerie: () => Promise<CompteTresorerie[]>;
      updateSoldeTresorerie: (data: { compteId: string; nouveauSolde: number }) => Promise<{ success: boolean }>;
      
      // Dépenses
      getDepenses: (filters?: DepenseFilters) => Promise<Depense[]>;
      addDepense: (depense: Depense) => Promise<{ success: boolean; id: string }>;
      updateDepense: (depense: Depense) => Promise<{ success: boolean }>;
      deleteDepense: (id: string) => Promise<{ success: boolean }>;
      
      // Mouvements de Trésorerie
      getMouvementsTresorerie: (filters?: MouvementFilters) => Promise<MouvementTresorerie[]>;
      
      // Entrées (Recettes)
      getEntrees: (filters?: any) => Promise<Entree[]>;
      addEntree: (entree: Entree) => Promise<{ success: boolean; id: string }>;
      updateEntree: (entree: Entree) => Promise<{ success: boolean }>;
      deleteEntree: (id: string) => Promise<{ success: boolean }>;
      
      // Finance Stats
      getFinanceStats: () => Promise<FinanceStats>;
      
      // ============================================================================
      // HR MODULE - Employees GAS
      // ============================================================================
      
      // Employees GAS
      getEmployeesGAS: (filters?: any) => Promise<EmployeeGASFull[]>;
      getEmployeeGAS: (id: string) => Promise<EmployeeGASFull | null>;
      createEmployeeGAS: (employee: any) => Promise<{ success: boolean; id: string }>;
      updateEmployeeGAS: (employee: any) => Promise<{ success: boolean }>;
      deleteEmployeeGAS: (id: string) => Promise<{ success: boolean }>;
      
      // Deployment History
      getEmployeeDeployments: (employeId: string) => Promise<HistoriqueDeployement[]>;
      getSiteDeploymentHistory: (siteId: string) => Promise<HistoriqueDeployement[]>;
      createDeployment: (deployment: any) => Promise<{ success: boolean; id: string }>;
      endDeployment: (data: any) => Promise<{ success: boolean }>;
      getCurrentDeployment: (employeId: string) => Promise<HistoriqueDeployement | null>;
      
      // Leave Management
      getLeaveRequests: (filters?: any) => Promise<DemandeConge[]>;
      createLeaveRequest: (request: any) => Promise<{ success: boolean; id: string }>;
      approveLeaveRequest: (data: any) => Promise<{ success: boolean }>;
      rejectLeaveRequest: (data: any) => Promise<{ success: boolean }>;
      getLeaveProvisions: (filters?: any) => Promise<CongeProvision[]>;
      calculateLeaveProvisions: (year: number) => Promise<{ success: boolean }>;
      
      // ============================================================================
      // OPERATIONS MODULE - Rôteur Management
      // ============================================================================
      getRoteurs: (filters?: any) => Promise<EmployeeGASFull[]>;
      getRoteurAssignments: (filters?: any) => Promise<AffectationRoteur[]>;
      createRoteurAssignment: (assignment: any) => Promise<{ success: boolean; id: string }>;
      updateRoteurAssignment: (assignment: any) => Promise<{ success: boolean }>;
      getSiteCoverageGaps: (filters?: any) => Promise<CoverageGap[]>;
      
      // ============================================================================
      // DISCIPLINARY MODULE
      // ============================================================================
      getDisciplinaryActions: (filters?: any) => Promise<ActionDisciplinaire[]>;
      getDisciplinaryAction: (id: string) => Promise<ActionDisciplinaire | null>;
      createDisciplinaryAction: (action: any) => Promise<{ success: boolean; id: string }>;
      updateDisciplinaryAction: (action: any) => Promise<{ success: boolean }>;
      signDisciplinaryAction: (data: { id: string; signature: string; commentaire?: string }) => Promise<{ success: boolean }>;
      validateDisciplinaryAction: (data: { id: string; validePar: string; commentaire?: string }) => Promise<{ success: boolean }>;
      rejectDisciplinaryAction: (data: { id: string; validePar: string; commentaire: string }) => Promise<{ success: boolean }>;
      getEmployeeDisciplinaryHistory: (employeId: string) => Promise<ActionDisciplinaire[]>;
      submitDisciplinaryForSignature: (id: string) => Promise<{ success: boolean }>;
      
      // ============================================================================
      // ALERTS SYSTEM
      // ============================================================================
      getAlerts: (filters?: any) => Promise<AlerteSysteme[]>;
      acknowledgeAlert: (data: { id: string; acquitteePar: string }) => Promise<{ success: boolean }>;
      runAlertCheck: () => Promise<{ success: boolean; alertsCreated: number }>;
      getAlertCounts: () => Promise<{
        total: number;
        active: number;
        byPriority: { critique: number; haute: number; moyenne: number; basse: number };
        byType: { assurance: number; controle_technique: number; certification: number; conge: number };
        acquittee: number;
        expiree: number;
      }>;
      
      // ============================================================================
      // FLEET MANAGEMENT - Vehicles
      // ============================================================================
      getVehicles: (filters?: any) => Promise<VehiculeFlotte[]>;
      getVehicle: (id: string) => Promise<VehiculeFlotte | null>;
      createVehicle: (vehicle: any) => Promise<{ success: boolean; id: string }>;
      updateVehicle: (vehicle: any) => Promise<{ success: boolean }>;
      deleteVehicle: (id: string) => Promise<{ success: boolean }>;
      
      // Fuel Consumption
      getFuelConsumption: (filters?: any) => Promise<ConsommationCarburant[]>;
      createFuelConsumption: (consumption: any) => Promise<{ success: boolean; id: string }>;
      
      // Vehicle Repairs/Maintenance
      getVehicleRepairs: (filters?: any) => Promise<ReparationVehicule[]>;
      createVehicleRepair: (repair: any) => Promise<{ success: boolean; id: string }>;
      
      // ============================================================================
      // INVENTORY MODULE - Equipment
      // ============================================================================
      getEquipment: (filters?: any) => Promise<Equipement[]>;
      getEquipmentItem: (id: string) => Promise<Equipement | null>;
      createEquipment: (equipment: any) => Promise<{ success: boolean; id: string; code_equipement?: string }>;
      updateEquipment: (equipment: any) => Promise<{ success: boolean }>;
      assignEquipment: (assignment: any) => Promise<{ success: boolean; id: string }>;
      returnEquipment: (returnData: any) => Promise<{ success: boolean }>;
      getEmployeeEquipment: (employeId: string) => Promise<Equipement[]>;
      
      // Dashboard Statistics
      getHRStats: () => Promise<HRStats>;
      getFleetStats: () => Promise<FleetStats>;
      getInventoryStats: () => Promise<InventoryStats>;
      getDisciplinaryStats: () => Promise<DisciplinaryStats>;

      // ============================================================================
      // PAYROLL MODULE
      // ============================================================================
      
      getPayrollPeriods: () => Promise<PeriodePaie[]>;
      createPayrollPeriod: (data: Partial<PeriodePaie>) => Promise<PeriodePaie>;
      calculatePayroll: (data: { periodeId: string; mois: number; annee: number; calculePar?: string }) => Promise<{ success: boolean; bulletins: any[] }>;
      getPayslips: (periodeId: string) => Promise<BulletinPaie[]>;
      getPayslipDetail: (bulletinId: string) => Promise<BulletinPaie & { actions_disciplinaires: ActionDisciplinaire[]; remboursements: RemboursementAvance[] }>;
      validatePayslips: (data: { periodeId: string; valideePar?: string }) => Promise<{ success: boolean }>;
      lockPayrollPeriod: (data: { periodeId: string; verrouilleePar?: string }) => Promise<{ success: boolean }>;
      getEmployeeAdvances: (filters?: { employeId?: string; statut?: string }) => Promise<AvanceEmploye[]>;
      createAdvance: (data: Partial<AvanceEmploye>) => Promise<AvanceEmploye>;
      getAdvanceRepayments: (avanceId: string) => Promise<RemboursementAvance[]>;
      
      // Utility
      isElectron: boolean;
    };
  }
}

class DatabaseService {
  private isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
  }

  // Employee operations (Updated to use employees_gas)
  async getEmployees(): Promise<EmployeeGASFull[]> {
    if (this.isElectron()) {
      return await window.electronAPI!.getEmployeesGAS();
    }
    // Fallback to empty array for web version
    return [];
  }

  async addEmployee(employee: EmployeeGASFull): Promise<{ success: boolean; id: string }> {
    if (this.isElectron()) {
      return await window.electronAPI!.createEmployeeGAS(employee);
    }
    // Fallback for web version
    console.log('Web version: Employee would be added:', employee);
    return { success: true, id: employee.id };
  }

  async updateEmployee(employee: EmployeeGASFull): Promise<{ success: boolean }> {
    if (this.isElectron()) {
      return await window.electronAPI!.updateEmployeeGAS(employee);
    }
    // Fallback for web version
    console.log('Web version: Employee would be updated:', employee);
    return { success: true };
  }

  async deleteEmployee(id: string): Promise<{ success: boolean }> {
    if (this.isElectron()) {
      return await window.electronAPI!.deleteEmployeeGAS(id);
    }
    // Fallback for web version
    console.log('Web version: Employee would be deleted:', id);
    return { success: true };
  }

  // Client operations
  async getClients(): Promise<ElectronClient[]> {
    if (this.isElectron()) {
      return await window.electronAPI!.getClients();
    }
    // Fallback to empty array for web version
    return [];
  }

  async addClient(client: ElectronClient): Promise<{ success: boolean; id: string }> {
    if (this.isElectron()) {
      return await window.electronAPI!.addClient(client);
    }
    // Fallback for web version
    console.log('Web version: Client would be added:', client);
    return { success: true, id: client.id };
  }

  async updateClient(client: ElectronClient): Promise<{ success: boolean }> {
    if (this.isElectron()) {
      return await window.electronAPI!.updateClient(client);
    }
    // Fallback for web version
    console.log('Web version: Client would be updated:', client);
    return { success: true };
  }

  async deleteClient(id: string): Promise<{ success: boolean }> {
    if (this.isElectron()) {
      return await window.electronAPI!.deleteClient(id);
    }
    // Fallback for web version
    console.log('Web version: Client would be deleted:', id);
    return { success: true };
  }

  // Site operations
  async getSites(): Promise<Site[]> {
    if (this.isElectron()) {
      return await window.electronAPI!.getSites();
    }
    // Fallback to sample data for web version
    const { sampleSites } = await import('../utils/sampleData');
    return sampleSites;
  }

  async addSite(site: Site): Promise<{ success: boolean; id: string }> {
    if (this.isElectron()) {
      return await window.electronAPI!.addSite(site);
    }
    // Fallback for web version
    console.log('Web version: Site would be added:', site);
    return { success: true, id: site.id };
  }

  async updateSite(site: Site): Promise<{ success: boolean }> {
    if (this.isElectron()) {
      return await window.electronAPI!.updateSite(site);
    }
    // Fallback for web version
    console.log('Web version: Site would be updated:', site);
    return { success: true };
  }

  async deleteSite(id: string): Promise<{ success: boolean }> {
    if (this.isElectron()) {
      return await window.electronAPI!.deleteSite(id);
    }
    // Fallback for web version
    console.log('Web version: Site would be deleted:', id);
    return { success: true };
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    if (this.isElectron()) {
      return await window.electronAPI!.getDashboardStats();
    }
    // Fallback to sample data for web version
    const { sampleDashboardStats } = await import('../utils/sampleData');
    return sampleDashboardStats;
  }

  // Database seeding
  async seedDatabase(): Promise<{ success: boolean; message: string }> {
    if (this.isElectron()) {
      return await window.electronAPI!.seedDatabase();
    }
    // Fallback for web version
    console.log('Web version: Database would be seeded with sample data');
    return { success: true, message: 'Sample data loaded (web version)' };
  }
}

export const databaseService = new DatabaseService();