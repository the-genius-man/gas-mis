import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/Auth/Login';
import FinanceModule from './components/Finance/FinanceModule';
import EmployeeList from './components/HR/EmployeeList';
import ClientList from './components/Operations/ClientList';
import SiteList from './components/Operations/SiteList';
import { Employee, Client, Site } from './types';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true;

function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');

  // Use different contexts based on environment
  const appContext = isElectron ? useApp() : null;
  const authContext = !isElectron ? useAuth() : null;

  // Load all data on app start (Electron mode)
  useEffect(() => {
    if (isElectron && appContext) {
      appContext.actions.loadAllData();
    }
  }, [appContext]);

  // Handle authentication loading (Supabase mode)
  if (!isElectron && authContext) {
    if (authContext.loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      );
    }

    if (!authContext.utilisateur) {
      return <Login />;
    }
  }

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard':
        return 'Tableau de Bord';
      case 'hr':
        return 'Ressources Humaines';
      case 'operations':
        return 'Opérations';
      case 'sites':
        return 'Gestion des Sites';
      case 'finance':
        return 'Finance et Facturation';
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
        return isElectron ? 'Aperçu de vos opérations de sécurité' : 'Vue d\'ensemble du système';
      case 'hr':
        return 'Gérez le personnel et les informations des employés';
      case 'operations':
        return 'Gestion des clients et opérations de service';
      case 'sites':
        return 'Emplacements de sécurité et sites de déploiement';
      case 'finance':
        return isElectron ? 'Facturation, facturation et gestion financière' : 'Gestion des clients, sites et facturation';
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
    if (isElectron && appContext?.state.loading) {
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
    if (isElectron && appContext?.state.error) {
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
        return <Dashboard />;
      case 'hr':
        return isElectron ? (
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
        return isElectron ? (
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
        return isElectron ? (
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
      case 'finance':
        return <FinanceModule />;
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="flex-1 flex flex-col">
        <Header title={getModuleTitle()} subtitle={getModuleSubtitle()} />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  // Wrap with appropriate providers based on environment
  if (isElectron) {
    return (
      <AppProvider>
        <AppContent />
      </AppProvider>
    );
  } else {
    return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    );
  }
}

export default App;