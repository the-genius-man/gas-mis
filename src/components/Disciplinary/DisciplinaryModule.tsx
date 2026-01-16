import React, { useState } from 'react';
import { AlertTriangle, PenTool, CheckSquare } from 'lucide-react';
import ActionsManagement from './ActionsManagement';

type TabType = 'actions' | 'signature' | 'validation';

const DisciplinaryModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('actions');

  const tabs = [
    { id: 'actions' as TabType, label: 'Toutes les Actions', icon: AlertTriangle },
    { id: 'signature' as TabType, label: 'Attente Signature', icon: PenTool },
    { id: 'validation' as TabType, label: 'Attente Validation', icon: CheckSquare },
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
                    ? 'border-red-500 text-red-600'
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
        {activeTab === 'actions' && <ActionsManagement />}
        {activeTab === 'signature' && <ActionsManagement filterStatut="EN_ATTENTE_SIGNATURE" />}
        {activeTab === 'validation' && <ActionsManagement filterStatut="EN_ATTENTE_VALIDATION" />}
      </div>
    </div>
  );
};

export default DisciplinaryModule;
