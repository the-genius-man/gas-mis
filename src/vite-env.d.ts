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
  
  // Add other methods as needed
  [key: string]: any;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
