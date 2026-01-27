const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Employee operations
  getEmployees: () => ipcRenderer.invoke('db-get-employees'),
  addEmployee: (employee) => ipcRenderer.invoke('db-add-employee', employee),
  updateEmployee: (employee) => ipcRenderer.invoke('db-update-employee', employee),
  deleteEmployee: (id) => ipcRenderer.invoke('db-delete-employee', id),
  
  // Client operations (Legacy)
  getClients: () => ipcRenderer.invoke('db-get-clients'),
  addClient: (client) => ipcRenderer.invoke('db-add-client', client),
  updateClient: (client) => ipcRenderer.invoke('db-update-client', client),
  deleteClient: (id) => ipcRenderer.invoke('db-delete-client', id),
  
  // Site operations (Legacy)
  getSites: () => ipcRenderer.invoke('db-get-sites'),
  addSite: (site) => ipcRenderer.invoke('db-add-site', site),
  updateSite: (site) => ipcRenderer.invoke('db-update-site', site),
  deleteSite: (id) => ipcRenderer.invoke('db-delete-site', id),
  
  // ============================================================================
  // GUARDIAN COMMAND - GAS API (Conformes au schéma SQL OHADA)
  // ============================================================================
  
  // Clients GAS (Table: clients)
  getClientsGAS: (options) => ipcRenderer.invoke('db-get-clients-gas', options),
  getActiveClientsGAS: () => ipcRenderer.invoke('db-get-active-clients-gas'),
  addClientGAS: (client) => ipcRenderer.invoke('db-add-client-gas', client),
  updateClientGAS: (client) => ipcRenderer.invoke('db-update-client-gas', client),
  updateClientStatusGAS: (data) => ipcRenderer.invoke('db-update-client-status', data),
  deleteClientGAS: (id) => ipcRenderer.invoke('db-delete-client-gas', id),
  
  // Sites GAS (Table: sites)
  getSitesGAS: () => ipcRenderer.invoke('db-get-sites-gas'),
  addSiteGAS: (site) => ipcRenderer.invoke('db-add-site-gas', site),
  updateSiteGAS: (site) => ipcRenderer.invoke('db-update-site-gas', site),
  updateSiteStatusGAS: (data) => ipcRenderer.invoke('db-update-site-status', data),
  deleteSiteGAS: (id) => ipcRenderer.invoke('db-delete-site-gas', id),
  
  // Factures GAS (Table: factures_clients)
  getFacturesGAS: () => ipcRenderer.invoke('db-get-factures-gas'),
  addFactureGAS: (facture) => ipcRenderer.invoke('db-add-facture-gas', facture),
  updateFactureGAS: (facture) => ipcRenderer.invoke('db-update-facture-gas', facture),
  deleteFactureGAS: (id) => ipcRenderer.invoke('db-delete-facture-gas', id),
  
  // Paiements GAS (Table: paiements)
  getPaiementsGAS: (factureId) => ipcRenderer.invoke('db-get-paiements-gas', factureId),
  addPaiementGAS: (paiement) => ipcRenderer.invoke('db-add-paiement-gas', paiement),
  updatePaiementGAS: (paiement) => ipcRenderer.invoke('db-update-paiement-gas', paiement),
  deletePaiementGAS: (id) => ipcRenderer.invoke('db-delete-paiement-gas', id),
  getFacturePaiementsSummary: (factureId) => ipcRenderer.invoke('db-get-facture-paiements-summary', factureId),
  
  // Dashboard stats
  getDashboardStats: () => ipcRenderer.invoke('db-get-dashboard-stats'),
  
  // Database seeding
  seedDatabase: () => ipcRenderer.invoke('db-seed-data'),
  
  // ============================================================================
  // FINANCE MODULE - OHADA Comptabilité
  // ============================================================================
  
  // Plan Comptable
  getPlanComptable: () => ipcRenderer.invoke('db-get-plan-comptable'),
  
  // Catégories de Dépenses
  getCategoriesDepenses: () => ipcRenderer.invoke('db-get-categories-depenses'),
  
  // Comptes de Trésorerie
  getComptesTresorerie: () => ipcRenderer.invoke('db-get-comptes-tresorerie'),
  updateSoldeTresorerie: (data) => ipcRenderer.invoke('db-update-solde-tresorerie', data),
  
  // Dépenses
  getDepenses: (filters) => ipcRenderer.invoke('db-get-depenses', filters),
  addDepense: (depense) => ipcRenderer.invoke('db-add-depense', depense),
  updateDepense: (depense) => ipcRenderer.invoke('db-update-depense', depense),
  deleteDepense: (id) => ipcRenderer.invoke('db-delete-depense', id),
  
  // Mouvements de Trésorerie
  getMouvementsTresorerie: (filters) => ipcRenderer.invoke('db-get-mouvements-tresorerie', filters),
  
  // Entrées (Recettes/Dépôts)
  getEntrees: (filters) => ipcRenderer.invoke('db-get-entrees', filters),
  addEntree: (entree) => ipcRenderer.invoke('db-add-entree', entree),
  updateEntree: (entree) => ipcRenderer.invoke('db-update-entree', entree),
  deleteEntree: (id) => ipcRenderer.invoke('db-delete-entree', id),
  
  // Finance Stats
  getFinanceStats: () => ipcRenderer.invoke('db-get-finance-stats'),
  
  // ============================================================================
  // HR MODULE - Employees GAS
  // ============================================================================
  
  // Employees GAS
  getEmployeesGAS: (filters) => ipcRenderer.invoke('db-get-employees-gas', filters),
  getEmployeeGAS: (id) => ipcRenderer.invoke('db-get-employee-gas', id),
  createEmployeeGAS: (employee) => ipcRenderer.invoke('db-create-employee-gas', employee),
  updateEmployeeGAS: (employee) => ipcRenderer.invoke('db-update-employee-gas', employee),
  deleteEmployeeGAS: (id) => ipcRenderer.invoke('db-delete-employee-gas', id),
  
  // Deployment History
  getEmployeeDeployments: (employeId) => ipcRenderer.invoke('db-get-employee-deployments', employeId),
  getSiteDeploymentHistory: (siteId) => ipcRenderer.invoke('db-get-site-deployment-history', siteId),
  createDeployment: (deployment) => ipcRenderer.invoke('db-create-deployment', deployment),
  endDeployment: (data) => ipcRenderer.invoke('db-end-deployment', data),
  getCurrentDeployment: (employeId) => ipcRenderer.invoke('db-get-current-deployment', employeId),
  
  // Leave Management
  getLeaveRequests: (filters) => ipcRenderer.invoke('db-get-leave-requests', filters),
  createLeaveRequest: (request) => ipcRenderer.invoke('db-create-leave-request', request),
  approveLeaveRequest: (data) => ipcRenderer.invoke('db-approve-leave-request', data),
  rejectLeaveRequest: (data) => ipcRenderer.invoke('db-reject-leave-request', data),
  getLeaveProvisions: (filters) => ipcRenderer.invoke('db-get-leave-provisions', filters),
  calculateLeaveProvisions: (year) => ipcRenderer.invoke('db-calculate-leave-provisions', year),
  
  // ============================================================================
  // OPERATIONS MODULE - Rôteur Management
  // ============================================================================
  
  getRoteurs: (filters) => ipcRenderer.invoke('db-get-roteurs', filters),
  getRoteurAssignments: (filters) => ipcRenderer.invoke('db-get-roteur-assignments', filters),
  getSitesEligibleForRoteur: (filters) => ipcRenderer.invoke('db-get-sites-eligible-for-roteur', filters),
  debugRoteurSites: () => ipcRenderer.invoke('db-debug-roteur-sites'),
  testQuery: (query) => ipcRenderer.invoke('db-test-query', query),
  createRoteurAssignment: (assignment) => ipcRenderer.invoke('db-create-roteur-assignment', assignment),
  updateRoteurAssignment: (assignment) => ipcRenderer.invoke('db-update-roteur-assignment', assignment),
  convertRoteurToGuard: (data) => ipcRenderer.invoke('db-convert-roteur-to-guard', data),
  getSiteCoverageGaps: (filters) => ipcRenderer.invoke('db-get-site-coverage-gaps', filters),
  
  // ============================================================================
  // DISCIPLINARY MODULE
  // ============================================================================
  
  getDisciplinaryActions: (filters) => ipcRenderer.invoke('db-get-disciplinary-actions', filters),
  getDisciplinaryAction: (id) => ipcRenderer.invoke('db-get-disciplinary-action', id),
  createDisciplinaryAction: (action) => ipcRenderer.invoke('db-create-disciplinary-action', action),
  updateDisciplinaryAction: (action) => ipcRenderer.invoke('db-update-disciplinary-action', action),
  signDisciplinaryAction: (data) => ipcRenderer.invoke('db-sign-disciplinary-action', data),
  validateDisciplinaryAction: (data) => ipcRenderer.invoke('db-validate-disciplinary-action', data),
  rejectDisciplinaryAction: (data) => ipcRenderer.invoke('db-reject-disciplinary-action', data),
  getEmployeeDisciplinaryHistory: (employeId) => ipcRenderer.invoke('db-get-employee-disciplinary-history', employeId),
  submitDisciplinaryForSignature: (id) => ipcRenderer.invoke('db-submit-disciplinary-for-signature', id),
  getPayrollDeductions: (filters) => ipcRenderer.invoke('db-get-payroll-deductions', filters),
  applyDisciplinaryDeductions: (data) => ipcRenderer.invoke('db-apply-disciplinary-deductions', data),
  
  // Enhanced Deductions System
  getDeductionTypes: (filters) => ipcRenderer.invoke('db-get-deduction-types', filters),
  createDeduction: (deduction) => ipcRenderer.invoke('db-create-deduction', deduction),
  getEmployeeDeductions: (data) => ipcRenderer.invoke('db-get-employee-deductions', data),
  calculatePeriodDeductions: (data) => ipcRenderer.invoke('db-calculate-period-deductions', data),
  applyPeriodDeductions: (data) => ipcRenderer.invoke('db-apply-period-deductions', data),
  updateDeduction: (data) => ipcRenderer.invoke('db-update-deduction', data),
  cancelDeduction: (data) => ipcRenderer.invoke('db-cancel-deduction', data),
  getDeductionHistory: (data) => ipcRenderer.invoke('db-get-deduction-history', data),
  
  // ============================================================================
  // ALERTS SYSTEM
  // ============================================================================
  
  getAlerts: (filters) => ipcRenderer.invoke('db-get-alerts', filters),
  acknowledgeAlert: (data) => ipcRenderer.invoke('db-acknowledge-alert', data),
  runAlertCheck: () => ipcRenderer.invoke('db-run-alert-check'),
  getAlertCounts: () => ipcRenderer.invoke('db-get-alert-counts'),
  
  // ============================================================================
  // FLEET MANAGEMENT - Vehicles
  // ============================================================================
  
  getVehicles: (filters) => ipcRenderer.invoke('db-get-vehicles', filters),
  getVehicle: (id) => ipcRenderer.invoke('db-get-vehicle', id),
  createVehicle: (vehicle) => ipcRenderer.invoke('db-create-vehicle', vehicle),
  updateVehicle: (vehicle) => ipcRenderer.invoke('db-update-vehicle', vehicle),
  deleteVehicle: (id) => ipcRenderer.invoke('db-delete-vehicle', id),
  
  // Fuel Consumption
  getFuelConsumption: (filters) => ipcRenderer.invoke('db-get-fuel-consumption', filters),
  createFuelConsumption: (consumption) => ipcRenderer.invoke('db-create-fuel-consumption', consumption),
  
  // Vehicle Repairs/Maintenance
  getVehicleRepairs: (filters) => ipcRenderer.invoke('db-get-vehicle-repairs', filters),
  createVehicleRepair: (repair) => ipcRenderer.invoke('db-create-vehicle-repair', repair),
  
  // ============================================================================
  // INVENTORY MODULE - Equipment
  // ============================================================================
  
  getEquipment: (filters) => ipcRenderer.invoke('db-get-equipment', filters),
  getEquipmentItem: (id) => ipcRenderer.invoke('db-get-equipment-item', id),
  createEquipment: (equipment) => ipcRenderer.invoke('db-create-equipment', equipment),
  updateEquipment: (equipment) => ipcRenderer.invoke('db-update-equipment', equipment),
  assignEquipment: (assignment) => ipcRenderer.invoke('db-assign-equipment', assignment),
  returnEquipment: (returnData) => ipcRenderer.invoke('db-return-equipment', returnData),
  getEmployeeEquipment: (employeId) => ipcRenderer.invoke('db-get-employee-equipment', employeId),
  
  // ============================================================================
  // DASHBOARD STATISTICS
  // ============================================================================
  
  getHRStats: () => ipcRenderer.invoke('db-get-hr-stats'),
  getFleetStats: () => ipcRenderer.invoke('db-get-fleet-stats'),
  getInventoryStats: () => ipcRenderer.invoke('db-get-inventory-stats'),
  getDisciplinaryStats: () => ipcRenderer.invoke('db-get-disciplinary-stats'),

  // ============================================================================
  // PAYROLL MODULE
  // ============================================================================
  
  getPayrollPeriods: () => ipcRenderer.invoke('db-get-payroll-periods'),
  createPayrollPeriod: (data) => ipcRenderer.invoke('db-create-payroll-period', data),
  calculatePayroll: (data) => ipcRenderer.invoke('db-calculate-payroll', data),
  getPayslips: (periodeId) => ipcRenderer.invoke('db-get-payslips', periodeId),
  getPayslipDetail: (bulletinId) => ipcRenderer.invoke('db-get-payslip-detail', bulletinId),
  validatePayslips: (data) => ipcRenderer.invoke('db-validate-payslips', data),
  lockPayrollPeriod: (data) => ipcRenderer.invoke('db-lock-payroll-period', data),
  flushPayroll: () => ipcRenderer.invoke('db-flush-payroll'),
  updatePayslip: (data) => ipcRenderer.invoke('db-update-payslip', data),
  getEmployeeAdvances: (filters) => ipcRenderer.invoke('db-get-employee-advances', filters),
  createAdvance: (data) => ipcRenderer.invoke('db-create-advance', data),
  getAdvanceRepayments: (avanceId) => ipcRenderer.invoke('db-get-advance-repayments', avanceId),
  
  // ============================================================================
  // USER AUTHENTICATION & MANAGEMENT
  // ============================================================================
  
  // Authentication
  authenticateUser: (username, password) => ipcRenderer.invoke('auth-authenticate-user', username, password),
  getUserById: (userId) => ipcRenderer.invoke('auth-get-user-by-id', userId),
  updateUserLastLogin: (userId) => ipcRenderer.invoke('auth-update-last-login', userId),
  
  // User Management
  getUsers: () => ipcRenderer.invoke('auth-get-users'),
  createUser: (userData) => ipcRenderer.invoke('auth-create-user', userData),
  updateUser: (userData) => ipcRenderer.invoke('auth-update-user', userData),
  deleteUser: (userId) => ipcRenderer.invoke('auth-delete-user', userId),
  updateUserStatus: (userId, status) => ipcRenderer.invoke('auth-update-user-status', userId, status),

  // ============================================================================
  // USER SETTINGS & QUICK ACTIONS
  // ============================================================================
  
  getUserSettings: (userId) => ipcRenderer.invoke('db-get-user-settings', userId),
  saveUserSettings: (settings) => ipcRenderer.invoke('db-save-user-settings', settings),
  getAvailableQuickActions: (userRole) => ipcRenderer.invoke('db-get-available-quick-actions', userRole),
  
  // ============================================================================
  // TAX SETTINGS
  // ============================================================================
  
  getTaxSettings: () => ipcRenderer.invoke('db-get-tax-settings'),
  updateTaxSetting: (data) => ipcRenderer.invoke('db-update-tax-setting', data),
  resetTaxSettings: () => ipcRenderer.invoke('db-reset-tax-settings'),
  
  // ============================================================================
  // OHADA PAYROLL TRACKING - Salaires Impayés & Charges Sociales
  // ============================================================================
  
  getSalairesImpayes: (filters) => ipcRenderer.invoke('db-get-salaires-impayes', filters),
  getPaiementsSalaires: (salaireImpayeId) => ipcRenderer.invoke('db-get-paiements-salaires', salaireImpayeId),
  payerSalaire: (paiement) => ipcRenderer.invoke('db-payer-salaire', paiement),
  
  getChargesSocialesDues: (filters) => ipcRenderer.invoke('db-get-charges-sociales-dues', filters),
  getPaiementsChargesSociales: (chargeSocialeId) => ipcRenderer.invoke('db-get-paiements-charges-sociales', chargeSocialeId),
  payerChargeSociale: (paiement) => ipcRenderer.invoke('db-payer-charge-sociale', paiement),
  
  getOhadaPayrollSummary: (filters) => ipcRenderer.invoke('db-get-ohada-payroll-summary', filters),
  
  // ============================================================================
  // OHADA ACCOUNTING ENTRIES - Écritures Comptables
  // ============================================================================
  
  createEcritureComptable: (data) => ipcRenderer.invoke('db-create-ecriture-comptable', data),
  getEcrituresComptables: (filters) => ipcRenderer.invoke('db-get-ecritures-comptables', filters),
  getLignesEcriture: (ecritureId) => ipcRenderer.invoke('db-get-lignes-ecriture', ecritureId),
  validerEcriture: (data) => ipcRenderer.invoke('db-valider-ecriture', data),
  getGrandLivre: (filters) => ipcRenderer.invoke('db-get-grand-livre', filters),
  getBilanOhada: (data) => ipcRenderer.invoke('db-get-bilan-ohada', data),
  
  // ============================================================================
  // REPORTING MODULE
  // ============================================================================
  
  getHRReportStats: (dateRange) => ipcRenderer.invoke('db-get-hr-report-stats', dateRange),
  getOperationsReportStats: (dateRange) => ipcRenderer.invoke('db-get-operations-report-stats', dateRange),
  
  // ============================================================================
  // FILE MANAGEMENT - Photo and Document Upload
  // ============================================================================

  saveFile: (data) => ipcRenderer.invoke('db-save-file', data),
  deleteFile: (filePath) => ipcRenderer.invoke('db-delete-file', filePath),
  getFilePath: (relativePath) => ipcRenderer.invoke('db-get-file-path', relativePath),
  
  // Utility
  isElectron: true
});
