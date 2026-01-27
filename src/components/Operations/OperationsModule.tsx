import React, { useState } from 'react';
import { Users, Calendar, AlertTriangle, UserCheck, FileText, Building2, MapPin } from 'lucide-react';
import RoteurManagement from './RoteurManagement';
import PlanningCalendar from './PlanningCalendar';
import AgentsManagement from './AgentsManagement';
import ActionsManagement from '../Disciplinary/ActionsManagement';
import OperationsReports from './OperationsReports';
import ClientsManagement from '../Finance/ClientsManagement';
import SitesManagement from '../Finance/SitesManagement';

type TabType = 'agents' | 'roteurs' | 'clients' | 'sites' | 'planning' | 'discipline' | 'reports';

const OperationsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('agents');

  const tabs = [
    { id: 'agents' as TabType, label: 'Agents', icon: UserCheck },
    { id: 'roteurs' as TabType, label: 'Rôteurs', icon: Users },
    { id: 'clients' as TabType, label: 'Clients', icon: Building2 },
    { id: 'sites' as TabType, label: 'Sites', icon: MapPin },
    { id: 'planning' as TabType, label: 'Planning', icon: Calendar },
    { id: 'discipline' as TabType, label: 'Discipline', icon: AlertTriangle },
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
        {activeTab === 'agents' && <AgentsManagement />}
        {activeTab === 'roteurs' && <RoteurManagement />}
        {activeTab === 'clients' && <ClientsManagement />}
        {activeTab === 'sites' && <SitesManagement />}
        {activeTab === 'planning' && <PlanningCalendar />}
        {activeTab === 'discipline' && <ActionsManagement />}
        {activeTab === 'reports' && <OperationsReports />}
      </div>
    </div>
  );
};

export default OperationsModule;
