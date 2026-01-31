import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  FileText, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  DollarSign, 
  BarChart3,
  CreditCard,
  HandCoins
} from 'lucide-react';
import ClientsManagement from './ClientsManagement';
import SitesManagement from './SitesManagement';
import InvoicesManagement from './InvoicesManagement';
import FinanceManagement from './FinanceManagement';
import FinanceReports from './FinanceReports';
import DebtLoanManagement from './OhadaDebtLoanManagement';

type Tab = 'clients' | 'sites' | 'invoices' | 'debts' | 'treasury' | 'reports';

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
    setActiveTab('invoices');
  };

  const tabs = [
    {
      id: 'clients' as Tab,
      label: 'Clients',
      icon: Building2,
      description: 'Gestion des clients et contrats',
    },
    {
      id: 'sites' as Tab,
      label: 'Sites',
      icon: MapPin,
      description: 'Emplacements de sécurité',
    },
    {
      id: 'invoices' as Tab,
      label: 'Facturation',
      icon: FileText,
      description: 'Factures et paiements',
    },
    {
      id: 'debts' as Tab,
      label: 'Dettes & Prêts OHADA',
      icon: HandCoins,
      description: 'Gestion conforme OHADA avec comptabilité automatique',
    },
    {
      id: 'treasury' as Tab,
      label: 'Trésorerie',
      icon: Wallet,
      description: 'Gestion financière et comptable',
    },
    {
      id: 'reports' as Tab,
      label: 'Rapports',
      icon: BarChart3,
      description: 'Analyses et rapports financiers',
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
      case 'invoices':
        return <InvoicesManagement />;
      case 'debts':
        return <DebtLoanManagement />;
      case 'treasury':
        return <FinanceManagement />;
      case 'reports':
        return <FinanceReports />;
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
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-500 font-normal">{tab.description}</div>
                </div>
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
