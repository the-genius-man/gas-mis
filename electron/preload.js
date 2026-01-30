const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // Employees
  getEmployees: () => ipcRenderer.invoke('db-get-employees'),
  addEmployee: (employee) => ipcRenderer.invoke('db-add-employee', employee),
  updateEmployee: (employee) => ipcRenderer.invoke('db-update-employee', employee),
  deleteEmployee: (id) => ipcRenderer.invoke('db-delete-employee', id),
  
  // Clients GAS
  getClientsGAS: () => ipcRenderer.invoke('db-get-clients-gas'),
  getActiveClientsGAS: () => ipcRenderer.invoke('db-get-active-clients-gas'),
  addClientGAS: (client) => ipcRenderer.invoke('db-add-client-gas', client),
  updateClientGAS: (client) => ipcRenderer.invoke('db-update-client-gas', client),
  updateClientStatusGAS: (data) => ipcRenderer.invoke('db-update-client-status', data),
  deleteClientGAS: (id) => ipcRenderer.invoke('db-delete-client-gas', id),
  
  // Sites GAS
  getSitesGAS: () => ipcRenderer.invoke('db-get-sites-gas'),
  addSiteGAS: (site) => ipcRenderer.invoke('db-add-site-gas', site),
  updateSiteGAS: (site) => ipcRenderer.invoke('db-update-site-gas', site),
  deleteSiteGAS: (id) => ipcRenderer.invoke('db-delete-site-gas', id),
  
  // Factures GAS
  getFacturesGAS: () => ipcRenderer.invoke('db-get-factures-gas'),
  addFactureGAS: (facture) => ipcRenderer.invoke('db-add-facture-gas', facture),
  updateFactureGAS: (facture) => ipcRenderer.invoke('db-update-facture-gas', facture),
  deleteFactureGAS: (id) => ipcRenderer.invoke('db-delete-facture-gas', id),
  
  // Paiements GAS
  getPaiementsGAS: (factureId) => ipcRenderer.invoke('db-get-paiements-gas', factureId),
  addPaiementGAS: (paiement) => ipcRenderer.invoke('db-add-paiement-gas', paiement),
  updatePaiementGAS: (paiement) => ipcRenderer.invoke('db-update-paiement-gas', paiement),
  deletePaiementGAS: (id) => ipcRenderer.invoke('db-delete-paiement-gas', id),
  getFacturePaiementsSummary: (factureId) => ipcRenderer.invoke('db-get-facture-paiements-summary', factureId),
  
  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('db-get-dashboard-stats'),
  
  // Finance Module - OHADA
  getPlanComptable: () => ipcRenderer.invoke('db-get-plan-comptable'),
  getCategoriesDepenses: () => ipcRenderer.invoke('db-get-categories-depenses'),
  getComptesTresorerie: () => ipcRenderer.invoke('db-get-comptes-tresorerie'),
  updateSoldeTresorerie: (data) => ipcRenderer.invoke('db-update-solde-tresorerie', data),
  getDepenses: (filters) => ipcRenderer.invoke('db-get-depenses', filters),
  addDepense: (depense) => ipcRenderer.invoke('db-add-depense', depense),
  updateDepense: (depense) => ipcRenderer.invoke('db-update-depense', depense),
  deleteDepense: (id) => ipcRenderer.invoke('db-delete-depense', id),
  getMouvementsTresorerie: (filters) => ipcRenderer.invoke('db-get-mouvements-tresorerie', filters),
  
  // Entrées (Recettes/Dépôts)
  getEntrees: (filters) => ipcRenderer.invoke('db-get-entrees', filters),
  addEntree: (entree) => ipcRenderer.invoke('db-add-entree', entree),
  updateEntree: (entree) => ipcRenderer.invoke('db-update-entree', entree),
  deleteEntree: (id) => ipcRenderer.invoke('db-delete-entree', id),
  
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
  // ROTEUR MANAGEMENT
  // ============================================================================
  
  getRoteurs: (filters) => ipcRenderer.invoke('db-get-roteurs', filters),
  getRoteurAssignments: (filters) => ipcRenderer.invoke('db-get-roteur-assignments', filters),
  createRoteurAssignment: (assignment) => ipcRenderer.invoke('db-create-roteur-assignment', assignment),
  updateRoteurAssignment: (assignment) => ipcRenderer.invoke('db-update-roteur-assignment', assignment),
  checkRoteurWeeklyAvailability: (data) => ipcRenderer.invoke('db-check-roteur-weekly-availability', data),
  getSiteCoverageGaps: (filters) => ipcRenderer.invoke('db-get-site-coverage-gaps', filters),
  getRoteurAvailability: (data) => ipcRenderer.invoke('db-get-roteur-availability', data),
  
  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================
  
  getHRStats: () => ipcRenderer.invoke('db-get-hr-stats'),
  getFleetStats: () => ipcRenderer.invoke('db-get-fleet-stats'),
  getInventoryStats: () => ipcRenderer.invoke('db-get-inventory-stats'),
  getDisciplinaryStats: () => ipcRenderer.invoke('db-get-disciplinary-stats'),
  
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
  // PAYROLL MODULE - Additional Functions
  // ============================================================================

  flushPayroll: () => ipcRenderer.invoke('db-flush-payroll'),
  
  // Disciplinary Deductions Integration
  getPayrollDeductions: (filters) => ipcRenderer.invoke('db-get-payroll-deductions', filters),
  applyDisciplinaryDeductions: (data) => ipcRenderer.invoke('db-apply-disciplinary-deductions', data),

  // ============================================================================
  // FILE MANAGEMENT - Photo and Document Upload
  // ============================================================================

  saveFile: (data) => ipcRenderer.invoke('db-save-file', data),
  deleteFile: (filePath) => ipcRenderer.invoke('db-delete-file', filePath),
  getFilePath: (relativePath) => ipcRenderer.invoke('db-get-file-path', relativePath),

  // ============================================================================
  // DATA CONSISTENCY UTILITIES
  // ============================================================================
  
  cleanupRoteurAssignments: () => ipcRenderer.invoke('db-cleanup-roteur-assignments'),
  checkDataConsistency: () => ipcRenderer.invoke('db-check-data-consistency'),
  syncSiteAssignments: () => ipcRenderer.invoke('db-sync-site-assignments'),
  fixClientSiteConsistency: () => ipcRenderer.invoke('db-fix-client-site-consistency'),
  testClientDeactivation: (clientId) => ipcRenderer.invoke('db-test-client-deactivation', clientId),

  // ============================================================================
  // USER SETTINGS AND PREFERENCES
  // ============================================================================
  
  getUserSettings: (userId) => ipcRenderer.invoke('db-get-user-settings', userId),
  saveUserSettings: (settings) => ipcRenderer.invoke('db-save-user-settings', settings),
  getAvailableQuickActions: (userRole) => ipcRenderer.invoke('db-get-available-quick-actions', userRole),
  changeUserPassword: (userId, currentPassword, newPassword) => ipcRenderer.invoke('db-change-user-password', userId, currentPassword, newPassword),
  exportUserData: (userId) => ipcRenderer.invoke('db-export-user-data', userId),
  importUserData: (userId, data) => ipcRenderer.invoke('db-import-user-data', userId, data),

  // ============================================================================
  // EXCEL IMPORT
  // ============================================================================
  
  importCustomersFromExcel: () => ipcRenderer.invoke('db-import-customers-from-excel')
});
