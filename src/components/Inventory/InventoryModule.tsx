import React, { useState } from 'react';
import { Package, ClipboardList, FileText } from 'lucide-react';
import EquipmentManagement from './EquipmentManagement';
import InventoryReports from './InventoryReports';

type TabType = 'equipment' | 'assignments' | 'reports';

const InventoryModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('equipment');

  const tabs = [
    { id: 'equipment' as TabType, label: 'Équipements', icon: Package },
    { id: 'assignments' as TabType, label: 'Affectations', icon: ClipboardList },
    { id: 'reports' as TabType, label: 'Rapports', icon: FileText },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'equipment' && <EquipmentManagement />}
        {activeTab === 'assignments' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Historique des affectations en cours de développement</p>
            </div>
          </div>
        )}
        {activeTab === 'reports' && <InventoryReports />}
      </div>
    </div>
  );
};

export default InventoryModule;
