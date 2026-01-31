import React, { useState } from 'react';
import { Users, Calendar, AlertTriangle, UserCheck, FileText, MapPin, Activity, Clock } from 'lucide-react';
import RoteurManagement from './RoteurManagement';
import PlanningCalendar from './PlanningCalendar';
import AgentsManagement from './AgentsManagement';
import ActionsManagement from '../Disciplinary/ActionsManagement';
import OperationsReports from './OperationsReports';
import SitesManagement from '../Finance/SitesManagement';
import OperationsDashboard from './OperationsDashboard';
import ShiftManagement from './ShiftManagement';

type TabType = 'dashboard' | 'agents' | 'sites' | 'rotation' | 'shifts' | 'discipline' | 'reports';

const OperationsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Tableau de Bord', icon: Activity },
    { id: 'agents' as TabType, label: 'Agents', icon: UserCheck },
    { id: 'sites' as TabType, label: 'Sites', icon: MapPin },
    { id: 'rotation' as TabType, label: 'Rotation', icon: Users },
    { id: 'shifts' as TabType, label: 'Équipes', icon: Clock },
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
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        {activeTab === 'dashboard' && <OperationsDashboard />}
        {activeTab === 'agents' && <AgentsManagement />}
        {activeTab === 'sites' && <SitesManagement />}
        {activeTab === 'rotation' && <PlanningCalendar />}
        {activeTab === 'shifts' && <ShiftManagement />}
        {activeTab === 'discipline' && <ActionsManagement />}
        {activeTab === 'reports' && <OperationsReports />}
      </div>
    </div>
  );
};

export default OperationsModule;
