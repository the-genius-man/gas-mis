import React, { useState } from 'react';
import { Users, Calendar, Clock, CalendarDays, FileText } from 'lucide-react';
import EmployeesManagement from './EmployeesManagement';
import LeaveManagement from './LeaveManagement';
import LeaveCalendar from './LeaveCalendar';
import HRReports from './HRReports';

type TabType = 'employees' | 'leave' | 'calendar' | 'provisions' | 'reports';

const HRModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('employees');

  const tabs = [
    { id: 'employees' as TabType, label: 'Employés', icon: Users },
    { id: 'leave' as TabType, label: 'Demandes de Congé', icon: Calendar },
    { id: 'calendar' as TabType, label: 'Calendrier', icon: CalendarDays },
    { id: 'provisions' as TabType, label: 'Provisions Congés', icon: Clock },
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
        {activeTab === 'employees' && <EmployeesManagement />}
        {activeTab === 'leave' && <LeaveManagement />}
        {activeTab === 'calendar' && <LeaveCalendar />}
        {activeTab === 'provisions' && <LeaveManagement showProvisions />}
        {activeTab === 'reports' && <HRReports />}
      </div>
    </div>
  );
};

export default HRModule;
