/// <reference types="vite/client" />

// Electron API declarations
interface ElectronAPI {
  // Existing methods
  isElectron: boolean;
  getEmployees: () => Promise<any[]>;
  addEmployee: (employee: any) => Promise<any>;
  updateEmployee: (employee: any) => Promise<any>;
  deleteEmployee: (id: string) => Promise<any>;
  
  // Payroll
  getPayrollPeriods: () => Promise<any[]>;
  createPayrollPeriod: (data: any) => Promise<any>;
  calculatePayroll: (data: any) => Promise<any>;
  getPayslips: (periodeId: string) => Promise<any[]>;
  getPayslipDetail: (bulletinId: string) => Promise<any>;
  validatePayslips: (data: any) => Promise<any>;
  lockPayrollPeriod: (data: any) => Promise<any>;
  flushPayroll: () => Promise<any>;
  updatePayslip: (data: any) => Promise<any>;
  getEmployeeAdvances: (filters?: any) => Promise<any[]>;
  createAdvance: (data: any) => Promise<any>;
  getAdvanceRepayments: (avanceId: string) => Promise<any[]>;
  
  // OHADA Payroll Tracking
  getSalairesImpayes: (filters?: any) => Promise<any[]>;
  getPaiementsSalaires: (salaireImpayeId: string) => Promise<any[]>;
  payerSalaire: (paiement: any) => Promise<any>;
  getChargesSocialesDues: (filters?: any) => Promise<any[]>;
  getPaiementsChargesSociales: (chargeSocialeId: string) => Promise<any[]>;
  payerChargeSociale: (paiement: any) => Promise<any>;
  getOhadaPayrollSummary: (filters?: any) => Promise<any>;
  getPayrollDeductions: (filters?: any) => Promise<any[]>;
  applyDisciplinaryDeductions: (data: any) => Promise<any>;
  
  // Enhanced Deductions System
  getDeductionTypes: (filters?: any) => Promise<any[]>;
  createDeduction: (deduction: any) => Promise<any>;
  getEmployeeDeductions: (data?: { employe_id?: string; filters?: any }) => Promise<any[]>;
  calculatePeriodDeductions: (data: { periode_paie_id: string; mois: number; annee: number }) => Promise<any[]>;
  applyPeriodDeductions: (data: { periode_paie_id: string; mois: number; annee: number; deductions: any[] }) => Promise<any>;
  updateDeduction: (data: { deduction_id: string; updates: any }) => Promise<any>;
  cancelDeduction: (data: { deduction_id: string; reason?: string }) => Promise<any>;
  getDeductionHistory: (data: { deduction_id: string }) => Promise<any[]>;
  
  // Deployment Management
  getCurrentDeployment: (employeId: string) => Promise<any>;
  getEmployeeDeployments: (employeId: string) => Promise<any[]>;
  getSiteDeploymentHistory: (siteId: string) => Promise<any[]>;
  createDeployment: (deployment: any) => Promise<any>;
  endDeployment: (data: any) => Promise<any>;
  
  // Employee Management
  getEmployeeGAS: (employeId: string) => Promise<any>;
  getEmployeesGAS: () => Promise<any[]>;
  addEmployeeGAS: (employee: any) => Promise<any>;
  updateEmployeeGAS: (employee: any) => Promise<any>;
  deleteEmployeeGAS: (id: string) => Promise<any>;
  
  // Sites Management
  getSitesGAS: () => Promise<any[]>;
  addSiteGAS: (site: any) => Promise<any>;
  updateSiteGAS: (site: any) => Promise<any>;
  updateSiteStatusGAS: (data: { id: string; est_actif: boolean }) => Promise<any>;
  deleteSiteGAS: (id: string) => Promise<any>;
  
  // Clients Management
  getClientsGAS: () => Promise<any[]>;
  addClientGAS: (client: any) => Promise<any>;
  updateClientGAS: (client: any) => Promise<any>;
  updateClientStatusGAS: (data: { id: string; statut: string }) => Promise<any>;
  deleteClientGAS: (id: string) => Promise<any>;
  
  // OHADA Accounting Entries
  createEcritureComptable: (data: any) => Promise<any>;
  getEcrituresComptables: (filters?: any) => Promise<any[]>;
  getLignesEcriture: (ecritureId: string) => Promise<any[]>;
  validerEcriture: (data: any) => Promise<any>;
  getGrandLivre: (filters?: any) => Promise<any[]>;
  getBilanOhada: (data: any) => Promise<any[]>;
  
  // Tax Settings
  getTaxSettings: () => Promise<any[]>;
  updateTaxSetting: (data: any) => Promise<any>;
  resetTaxSettings: () => Promise<any>;
  
  // Reporting Module
  getHRReportStats: (dateRange: { startDate: string; endDate: string }) => Promise<any>;
  getOperationsReportStats: (dateRange: { startDate: string; endDate: string }) => Promise<any>;
  
  // File Management
  saveFile: (data: { fileBuffer: ArrayBuffer; fileName: string; fileType: string; employeeId: string }) => Promise<{ success: boolean; filePath: string }>;
  deleteFile: (filePath: string) => Promise<{ success: boolean }>;
  getFilePath: (relativePath: string) => Promise<{ success: boolean; fullPath: string }>;
  
  // Roteur Management
  getRoteurs: (filters?: any) => Promise<any[]>;
  getRoteurAssignments: (filters?: any) => Promise<any[]>;
  getSitesEligibleForRoteur: (filters?: any) => Promise<any[]>;
  createRoteurAssignment: (assignment: any) => Promise<any>;
  updateRoteurAssignment: (assignment: any) => Promise<any>;
  convertRoteurToGuard: (data: { roteurId: string; reason?: string }) => Promise<any>;
  getSiteCoverageGaps: (filters?: any) => Promise<any[]>;
  
  // Add other methods as needed
  [key: string]: any;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
