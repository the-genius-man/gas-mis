import React, { useState } from 'react';
import { Truck, Package } from 'lucide-react';
import FleetManagement from '../Operations/FleetManagement';
import EquipmentManagement from '../Inventory/EquipmentManagement';

type TabType = 'fleet' | 'equipment';

const LogisticsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('fleet');

  const tabs = [
    { id: 'fleet' as TabType, label: 'Flotte', icon: Truck },
    { id: 'equipment' as TabType, label: 'Équipements', icon: Package },
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
        {activeTab === 'fleet' && <FleetManagement />}
        {activeTab === 'equipment' && <EquipmentManagement />}
      </div>
    </div>
  );
};

export default LogisticsModule;
