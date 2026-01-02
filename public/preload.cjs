const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Employee operations
  getEmployees: () => ipcRenderer.invoke('db-get-employees'),
  addEmployee: (employee) => ipcRenderer.invoke('db-add-employee', employee),
  updateEmployee: (employee) => ipcRenderer.invoke('db-update-employee', employee),
  deleteEmployee: (id) => ipcRenderer.invoke('db-delete-employee', id),
  
  // Client operations
  getClients: () => ipcRenderer.invoke('db-get-clients'),
  addClient: (client) => ipcRenderer.invoke('db-add-client', client),
  updateClient: (client) => ipcRenderer.invoke('db-update-client', client),
  deleteClient: (id) => ipcRenderer.invoke('db-delete-client', id),
  
  // Site operations
  getSites: () => ipcRenderer.invoke('db-get-sites'),
  addSite: (site) => ipcRenderer.invoke('db-add-site', site),
  updateSite: (site) => ipcRenderer.invoke('db-update-site', site),
  deleteSite: (id) => ipcRenderer.invoke('db-delete-site', id),
  
  // Dashboard stats
  getDashboardStats: () => ipcRenderer.invoke('db-get-dashboard-stats'),
  
  // Database seeding
  seedDatabase: () => ipcRenderer.invoke('db-seed-data'),
  
  // Utility
  isElectron: true
});