import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin,
} from 'lucide-react';
import ClientsManagement from './ClientsManagement';
import SitesManagement from './SitesManagement';

type Tab = 'clients' | 'sites';

// Check if running in Electron
const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

export default function FinanceModule() {
  const [activeTab, setActiveTab] = useState<Tab>('clients');
  
  // Memoize electron detection
  const electronMode = useMemo(() => isElectron(), []);

  const navigateToSites = () => {
    setActiveTab('sites');
  };

  const navigateToInvoices = () => {
    // Invoices are now in the Facturation sidebar item
  };

  const tabs = [
    {
      id: 'clients' as Tab,
      label: 'Clients',
      icon: Building2,
    },
    {
      id: 'sites' as Tab,
      label: 'Sites',
      icon: MapPin,
    },
  ];

  const renderContent = () => {
    if (!electronMode) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Module Finance</h3>
            <p className="text-gray-600">Ce module nécessite le mode Electron avec base de données locale</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'clients':
        return <ClientsManagement onNavigateToSites={navigateToSites} onNavigateToInvoices={navigateToInvoices} />;
      case 'sites':
        return <SitesManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!electronMode}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${!electronMode ? 'opacity-50 cursor-not-allowed' : ''}
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
