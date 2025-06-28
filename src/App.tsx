import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import EmployeeList from './components/HR/EmployeeList';
import ClientList from './components/Operations/ClientList';
import SiteList from './components/Operations/SiteList';
import { sampleEmployees, sampleClients, sampleSites, sampleDashboardStats } from './utils/sampleData';
import { Employee, Client, Site } from './types';

function AppContent() {
  const { state, dispatch } = useApp();
  const [activeModule, setActiveModule] = useState('dashboard');

  // Initialize sample data
  useEffect(() => {
    dispatch({ type: 'SET_EMPLOYEES', payload: sampleEmployees });
    dispatch({ type: 'SET_CLIENTS', payload: sampleClients });
    dispatch({ type: 'SET_SITES', payload: sampleSites });
    dispatch({ type: 'UPDATE_DASHBOARD_STATS', payload: sampleDashboardStats });
  }, [dispatch]);

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard':
        return 'Dashboard';
      case 'hr':
        return 'Human Resources';
      case 'operations':
        return 'Operations';
      case 'sites':
        return 'Site Management';
      case 'finance':
        return 'Finance & Billing';
      case 'mobile':
        return 'Field Operations';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const getModuleSubtitle = () => {
    switch (activeModule) {
      case 'dashboard':
        return 'Overview of your security operations';
      case 'hr':
        return 'Manage personnel and employee information';
      case 'operations':
        return 'Client management and service operations';
      case 'sites':
        return 'Security locations and deployment sites';
      case 'finance':
        return 'Billing, invoicing, and financial management';
      case 'mobile':
        return 'Mobile app and field operations';
      case 'analytics':
        return 'Reports and business analytics';
      case 'settings':
        return 'System configuration and preferences';
      default:
        return '';
    }
  };

  const handleAddEmployee = () => {
    console.log('Add employee functionality to be implemented');
  };

  const handleViewEmployee = (employee: Employee) => {
    console.log('View employee:', employee);
  };

  const handleEditEmployee = (employee: Employee) => {
    console.log('Edit employee:', employee);
  };

  const handleAddClient = () => {
    console.log('Add client functionality to be implemented');
  };

  const handleViewClient = (client: Client) => {
    console.log('View client:', client);
  };

  const handleEditClient = (client: Client) => {
    console.log('Edit client:', client);
  };

  const handleAddSite = () => {
    console.log('Add site functionality to be implemented');
  };

  const handleViewSite = (site: Site) => {
    console.log('View site:', site);
  };

  const handleEditSite = (site: Site) => {
    console.log('Edit site:', site);
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'hr':
        return (
          <EmployeeList
            onAddEmployee={handleAddEmployee}
            onViewEmployee={handleViewEmployee}
            onEditEmployee={handleEditEmployee}
          />
        );
      case 'operations':
        return (
          <ClientList
            onAddClient={handleAddClient}
            onViewClient={handleViewClient}
            onEditClient={handleEditClient}
          />
        );
      case 'sites':
        return (
          <SiteList
            onAddSite={handleAddSite}
            onViewSite={handleViewSite}
            onEditSite={handleEditSite}
          />
        );
      case 'finance':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Finance & Billing</h3>
              <p className="text-gray-600">Coming in Phase 3 - Financial Integration</p>
            </div>
          </div>
        );
      case 'mobile':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Field Operations</h3>
              <p className="text-gray-600">Coming in Phase 4 - Mobile App Features</p>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">Coming in Phase 4 - Advanced Analytics</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
              <p className="text-gray-600">Configuration options coming soon</p>
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
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;