import React, { useState } from 'react';
import { Building2, MapPin, FileText } from 'lucide-react';
import ClientsManagement from './ClientsManagement';
import SitesManagement from './SitesManagement';
import InvoicesManagement from './InvoicesManagement';

type Tab = 'clients' | 'sites' | 'factures';

export default function FinanceModule() {
  const [activeTab, setActiveTab] = useState<Tab>('clients');

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
      id: 'factures' as Tab,
      label: 'Facturation',
      icon: FileText,
      description: 'Factures et paiements',
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'clients':
        return <ClientsManagement />;
      case 'sites':
        return <SitesManagement />;
      case 'factures':
        return <InvoicesManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-500 font-normal">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div>{renderContent()}</div>
    </div>
  );
}
