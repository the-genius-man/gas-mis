import { Employee, Client, Site, DashboardStats } from '../types';

// Type declaration for the electron API
declare global {
  interface Window {
    electronAPI?: {
      // Employee operations
      getEmployees: () => Promise<Employee[]>;
      addEmployee: (employee: Employee) => Promise<{ success: boolean; id: string }>;
      updateEmployee: (employee: Employee) => Promise<{ success: boolean }>;
      deleteEmployee: (id: string) => Promise<{ success: boolean }>;
      
      // Client operations
      getClients: () => Promise<Client[]>;
      addClient: (client: Client) => Promise<{ success: boolean; id: string }>;
      updateClient: (client: Client) => Promise<{ success: boolean }>;
      deleteClient: (id: string) => Promise<{ success: boolean }>;
      
      // Site operations
      getSites: () => Promise<Site[]>;
      addSite: (site: Site) => Promise<{ success: boolean; id: string }>;
      updateSite: (site: Site) => Promise<{ success: boolean }>;
      deleteSite: (id: string) => Promise<{ success: boolean }>;
      
      // Dashboard stats
      getDashboardStats: () => Promise<DashboardStats>;
      
      // Database seeding
      seedDatabase: () => Promise<{ success: boolean; message: string }>;
      
      // Utility
      isElectron: boolean;
    };
  }
}

class DatabaseService {
  private isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    if (this.isElectron()) {
      return await window.electronAPI!.getEmployees();
    }
    // Fallback to sample data for web version
    const { sampleEmployees } = await import('../utils/sampleData');
    return sampleEmployees;
  }

  async addEmployee(employee: Employee): Promise<{ success: boolean; id: string }> {
    if (this.isElectron()) {
      return await window.electronAPI!.addEmployee(employee);
    }
    // Fallback for web version
    console.log('Web version: Employee would be added:', employee);
    return { success: true, id: employee.id };
  }

  async updateEmployee(employee: Employee): Promise<{ success: boolean }> {
    if (this.isElectron()) {
      return await window.electronAPI!.updateEmployee(employee);
    }
    // Fallback for web version
    console.log('Web version: Employee would be updated:', employee);
    return { success: true };
  }

  async deleteEmployee(id: string): Promise<{ success: boolean }> {
    if (this.isElectron()) {
      return await window.electronAPI!.deleteEmployee(id);
    }
    // Fallback for web version
    console.log('Web version: Employee would be deleted:', id);
    return { success: true };
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    if (this.isElectron()) {
      return await window.electronAPI!.getClients();
    }
    // Fallback to sample data for web version
    const { sampleClients } = await import('../utils/sampleData');
    return sampleClients;
  }

  async addClient(client: Client): Promise<{ success: boolean; id: string }> {
    if (this.isElectron()) {
      return await window.electronAPI!.addClient(client);
    }
    // Fallback for web version
    console.log('Web version: Client would be added:', client);
    return { success: true, id: client.id };
  }

  async updateClient(client: Client): Promise<{ success: boolean }> {
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