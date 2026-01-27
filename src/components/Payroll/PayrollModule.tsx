import { useState } from 'react';
import { DollarSign, Users, FileText, AlertCircle, BarChart3, Minus } from 'lucide-react';
import PayrollManagement from './PayrollManagement';
import AdvancesManagement from './AdvancesManagement';
import UnpaidSalariesManagement from './UnpaidSalariesManagement';
import DeductionsManagement from './DeductionsManagement';
import PayrollReports from './PayrollReports';

type TabType = 'payroll' | 'advances' | 'deductions' | 'unpaid' | 'reports';

export default function PayrollModule() {
  const [activeTab, setActiveTab] = useState<TabType>('payroll');

  const tabs = [
    { id: 'payroll' as TabType, label: 'Paie', icon: DollarSign },
    { id: 'advances' as TabType, label: 'Avances', icon: FileText },
    { id: 'deductions' as TabType, label: 'Déductions', icon: Minus },
    { id: 'unpaid' as TabType, label: 'Salaires Impayés', icon: AlertCircle },
    { id: 'reports' as TabType, label: 'Rapports', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'payroll' && <PayrollManagement />}
        {activeTab === 'advances' && <AdvancesManagement />}
        {activeTab === 'deductions' && <DeductionsManagement />}
        {activeTab === 'unpaid' && <UnpaidSalariesManagement />}
        {activeTab === 'reports' && <PayrollReports />}
      </div>
    </div>
  );
}
