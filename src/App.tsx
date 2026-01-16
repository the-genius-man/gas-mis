import { useEffect, useState, useMemo } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/EnhancedDashboard';
import EmployeeList from './components/HR/EmployeeList';
import HRModule from './components/HR/HRModule';
import OperationsModule from './components/Operations/OperationsModule';
import LogisticsModule from './components/Logistics/LogisticsModule';
import PayrollModule from './components/Payroll/PayrollModule';
import ClientList from './components/Operations/ClientList';
import SiteList from './components/Operations/SiteList';
import FinanceModule from './components/Finance/FinanceModule';
import InvoicesManagement from './components/Finance/InvoicesManagement';
import FinanceManagement from './components/Finance/FinanceManagement';
import SettingsPage from './components/Settings/SettingsPage';
import ReportsModule from './components/Reports/ReportsModule';
import { Employee, Client, Site } from './types';

function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');
  
  // Memoize electron detection to prevent re-computation
  const electronMode = useMemo(() => {
    if (typeof window !== 'undefined') {
      return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
    }
    return false;
  }, []);
  
  const supabaseMode = useMemo(() => {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) && !electronMode;
  }, [electronMode]);

  // Use App context for Electron mode
  const appContext = electronMode ? useApp() : null;
  
  // Use Auth context for Supabase mode (lazy load to avoid errors)
  const [authContext, setAuthContext] = useState<any>(null);

  useEffect(() => {
    if (supabaseMode) {
      // Dynamically import AuthContext only when needed
      import('./contexts/AuthContext').then(({ useAuth }) => {
        try {
          setAuthContext({ useAuth });
        } catch (error) {
          console.error('Failed to load auth context:', error);
        }
      });
    }
  }, [supabaseMode]);

  // Load all data on app start (Electron mode) - only run once
  useEffect(() => {
    if (electronMode && appContext) {
      appContext.actions.loadAllData();
    }
  }, [electronMode]); // Remove appContext dependency to prevent loops

  // Handle authentication loading (Supabase mode)
  if (supabaseMode && authContext) {
    // This would handle Supabase auth, but for now we'll skip it
    // since we're focusing on Electron mode
  }

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard':
        return 'Tableau de Bord';
      case 'hr':
        return 'Ressources Humaines';
      case 'hr-module':
        return 'Ressources Humaines';
      case 'operations':
        return 'Opérations';
      case 'operations-module':
        return 'Opérations';
      case 'logistics-module':
        return 'Logistique';
      case 'payroll-module':
        return 'Paie';
      case 'sites':
        return 'Gestion des Sites';
      case 'clients':
        return 'Clients';
      case 'facturation':
        return 'Facturation';
      case 'finance':
        return 'Finance';
      case 'mobile':
        return 'Opérations sur le Terrain';
      case 'analytics':
        return 'Analytiques';
      case 'settings':
        return 'Paramètres';
      default:
        return 'Tableau de Bord';
    }
  };

  const getModuleSubtitle = () => {
    switch (activeModule) {
      case 'dashboard':
        return electronMode ? 'Aperçu de vos opérations de sécurité' : 'Vue d\'ensemble du système';
      case 'hr':
        return 'Gérez le personnel et les informations des employés';
      case 'hr-module':
        return 'Gestion des employés, congés et déploiements';
      case 'operations':
        return 'Gestion des clients et opérations de service';
      case 'operations-module':
        return 'Agents, rôteurs, planning et discipline';
      case 'logistics-module':
        return 'Flotte et équipements';
      case 'payroll-module':
        return 'Calcul de paie, avances et bulletins';
      case 'sites':
        return 'Emplacements de sécurité et sites de déploiement';
      case 'clients':
        return 'Gestion des clients et sites';
      case 'facturation':
        return 'Factures, paiements et facturation mensuelle';
      case 'finance':
        return 'Gestion des entrées et dépenses';
      case 'settings':
        return 'Configuration et actions rapides personnalisées';
      case 'mobile':
        return 'Application mobile et opérations sur le terrain';
      case 'analytics':
        return 'Rapports et analyses commerciales';
      case 'settings':
        return 'Configuration du système et préférences';
      default:
        return '';
    }
  };

  const handleAddEmployee = () => {
    console.log('Fonctionnalité d\'ajout d\'employé à implémenter');
  };

  const handleViewEmployee = (employee: Employee) => {
    console.log('Voir employé:', employee);
  };

  const handleEditEmployee = (employee: Employee) => {
    console.log('Modifier employé:', employee);
  };

  const handleAddClient = () => {
    console.log('Fonctionnalité d\'ajout de client à implémenter');
  };

  const handleViewClient = (client: Client) => {
    console.log('Voir client:', client);
  };

  const handleEditClient = (client: Client) => {
    console.log('Modifier client:', client);
  };

  const handleAddSite = () => {
    console.log('Fonctionnalité d\'ajout de site à implémenter');
  };

  const handleViewSite = (site: Site) => {
    console.log('Voir site:', site);
  };

  const handleEditSite = (site: Site) => {
    console.log('Modifier site:', site);
  };

  const renderContent = () => {
    // Show loading state for Electron mode
    if (electronMode && appContext?.state.loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      );
    }

    // Show error state for Electron mode
    if (electronMode && appContext?.state.error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Erreur</p>
              <p>{appContext.state.error}</p>
            </div>
            <button
              onClick={() => appContext.actions.loadAllData()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'hr-module':
        return electronMode ? (
          <HRModule />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ressources Humaines</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'operations-module':
        return electronMode ? (
          <OperationsModule />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Opérations</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'logistics-module':
        return electronMode ? (
          <LogisticsModule />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Logistique</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'payroll-module':
        return electronMode ? (
          <PayrollModule />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Paie</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'hr':
        return electronMode ? (
          <EmployeeList
            onAddEmployee={handleAddEmployee}
            onViewEmployee={handleViewEmployee}
            onEditEmployee={handleEditEmployee}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ressources Humaines</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'operations':
        return electronMode ? (
          <ClientList
            onAddClient={handleAddClient}
            onViewClient={handleViewClient}
            onEditClient={handleEditClient}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Opérations</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'sites':
        return electronMode ? (
          <SiteList
            onAddSite={handleAddSite}
            onViewSite={handleViewSite}
            onEditSite={handleEditSite}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestion des Sites</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'clients':
        return electronMode ? (
          <FinanceModule />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Clients</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'facturation':
        return electronMode ? (
          <InvoicesManagement />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Facturation</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'finance':
        return electronMode ? (
          <FinanceManagement />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Finance</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'settings':
        return electronMode ? (
          <SettingsPage />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Paramètres</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'reports':
        return electronMode ? (
          <ReportsModule />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Rapports</h3>
              <p className="text-gray-600">Module disponible en mode Electron</p>
            </div>
          </div>
        );
      case 'mobile':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Opérations sur le Terrain</h3>
              <p className="text-gray-600">À venir dans la Phase 4 - Fonctionnalités de l'Application Mobile</p>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tableau de Bord Analytique</h3>
              <p className="text-gray-600">À venir dans la Phase 4 - Analyses Avancées</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Paramètres du Système</h3>
              <p className="text-gray-600">Options de configuration à venir bientôt</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      
      {/* Main Content - absolute positioning to start at top */}
      <div className="absolute top-0 left-64 right-0 bottom-0 flex flex-col overflow-hidden">
        <Header title={getModuleTitle()} subtitle={getModuleSubtitle()} />
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  // Always use AppProvider for now, since we're focusing on Electron mode
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;