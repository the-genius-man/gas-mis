import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { EmployeeGASFull, ElectronClient, Site, User, DashboardStats } from '../types';
import { databaseService } from '../services/database';

interface AppState {
  employees: EmployeeGASFull[];
  clients: ElectronClient[];
  sites: Site[];
  currentUser: User | null;
  dashboardStats: DashboardStats;
  loading: boolean;
  error: string | null;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EMPLOYEES'; payload: EmployeeGASFull[] }
  | { type: 'ADD_EMPLOYEE'; payload: EmployeeGASFull }
  | { type: 'UPDATE_EMPLOYEE'; payload: EmployeeGASFull }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'SET_CLIENTS'; payload: ElectronClient[] }
  | { type: 'ADD_CLIENT'; payload: ElectronClient }
  | { type: 'UPDATE_CLIENT'; payload: ElectronClient }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SET_SITES'; payload: Site[] }
  | { type: 'ADD_SITE'; payload: Site }
  | { type: 'UPDATE_SITE'; payload: Site }
  | { type: 'DELETE_SITE'; payload: string }
  | { type: 'SET_CURRENT_USER'; payload: User }
  | { type: 'UPDATE_DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'LOAD_ALL_DATA' };

const initialState: AppState = {
  employees: [],
  clients: [],
  sites: [],
  currentUser: null,
  dashboardStats: {
    totalEmployees: 0,
    activeGuards: 0,
    totalClients: 0,
    activeSites: 0,
    monthlyRevenue: 0,
    pendingIncidents: 0,
    expiringCertifications: 0,
    upcomingShifts: 0,
  },
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(emp => 
          emp.id === action.payload.id ? action.payload : emp
        )
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== action.payload)
      };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client => 
          client.id === action.payload.id ? action.payload : client
        )
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload)
      };
    case 'SET_SITES':
      return { ...state, sites: action.payload };
    case 'ADD_SITE':
      return { ...state, sites: [...state.sites, action.payload] };
    case 'UPDATE_SITE':
      return {
        ...state,
        sites: state.sites.map(site => 
          site.id === action.payload.id ? action.payload : site
        )
      };
    case 'DELETE_SITE':
      return {
        ...state,
        sites: state.sites.filter(site => site.id !== action.payload)
      };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'UPDATE_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadAllData: () => Promise<void>;
    addEmployee: (employee: EmployeeGASFull) => Promise<void>;
    updateEmployee: (employee: EmployeeGASFull) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
    addClient: (client: ElectronClient) => Promise<void>;
    updateClient: (client: ElectronClient) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    addSite: (site: Site) => Promise<void>;
    updateSite: (site: Site) => Promise<void>;
    deleteSite: (id: string) => Promise<void>;
    seedDatabase: () => Promise<void>;
  };
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadAllData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const [employees, clients, sites, dashboardStats] = await Promise.all([
        databaseService.getEmployees(),
        databaseService.getClients(),
        databaseService.getSites(),
        databaseService.getDashboardStats()
      ]);

      dispatch({ type: 'SET_EMPLOYEES', payload: employees });
      dispatch({ type: 'SET_CLIENTS', payload: clients });
      dispatch({ type: 'SET_SITES', payload: sites });
      dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: dashboardStats });
    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const actions = {
    loadAllData,

    addEmployee: async (employee: EmployeeGASFull) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.addEmployee(employee);
        if (result.success) {
          dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
          // Refresh dashboard stats
          const stats = await databaseService.getDashboardStats();
          dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: stats });
        }
      } catch (error) {
        console.error('Error adding employee:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add employee' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    updateEmployee: async (employee: EmployeeGASFull) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.updateEmployee(employee);
        if (result.success) {
          dispatch({ type: 'UPDATE_EMPLOYEE', payload: employee });
        }
      } catch (error) {
        console.error('Error updating employee:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update employee' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    deleteEmployee: async (id: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.deleteEmployee(id);
        if (result.success) {
          dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
          // Refresh dashboard stats
          const stats = await databaseService.getDashboardStats();
          dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: stats });
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete employee' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    addClient: async (client: ElectronClient) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.addClient(client);
        if (result.success) {
          dispatch({ type: 'ADD_CLIENT', payload: client });
          // Refresh dashboard stats
          const stats = await databaseService.getDashboardStats();
          dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: stats });
        }
      } catch (error) {
        console.error('Error adding client:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add client' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    updateClient: async (client: ElectronClient) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.updateClient(client);
        if (result.success) {
          dispatch({ type: 'UPDATE_CLIENT', payload: client });
        }
      } catch (error) {
        console.error('Error updating client:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update client' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    deleteClient: async (id: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.deleteClient(id);
        if (result.success) {
          dispatch({ type: 'DELETE_CLIENT', payload: id });
          // Refresh dashboard stats
          const stats = await databaseService.getDashboardStats();
          dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: stats });
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete client' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    addSite: async (site: Site) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.addSite(site);
        if (result.success) {
          dispatch({ type: 'ADD_SITE', payload: site });
          // Refresh dashboard stats
          const stats = await databaseService.getDashboardStats();
          dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: stats });
        }
      } catch (error) {
        console.error('Error adding site:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add site' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    updateSite: async (site: Site) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.updateSite(site);
        if (result.success) {
          dispatch({ type: 'UPDATE_SITE', payload: site });
        }
      } catch (error) {
        console.error('Error updating site:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update site' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    deleteSite: async (id: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.deleteSite(id);
        if (result.success) {
          dispatch({ type: 'DELETE_SITE', payload: id });
          // Refresh dashboard stats
          const stats = await databaseService.getDashboardStats();
          dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: stats });
        }
      } catch (error) {
        console.error('Error deleting site:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete site' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    seedDatabase: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await databaseService.seedDatabase();
        if (result.success) {
          // Reload all data after seeding
          await loadAllData();
        }
      } catch (error) {
        console.error('Error seeding database:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to seed database' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}