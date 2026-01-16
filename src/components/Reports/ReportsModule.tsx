import React, { useState } from 'react';
import { FileText, Users, Shield, DollarSign, Briefcase, Package, TrendingUp } from 'lucide-react';
import HRReports from './HRReports';
import OperationsReports from './OperationsReports';
import FinanceReports from './FinanceReports';
import PayrollReports from './PayrollReports';
import ClientReports from './ClientReports';
import InventoryReports from './InventoryReports';

type ReportCategory = 'hr' | 'operations' | 'finance' | 'payroll' | 'clients' | 'inventory';

export default function ReportsModule() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('hr');

  const categories = [
    { id: 'hr' as ReportCategory, name: 'RH & Personnel', icon: Users, color: 'blue' },
    { id: 'operations' as ReportCategory, name: 'Opérations', icon: Shield, color: 'green' },
    { id: 'finance' as ReportCategory, name: 'Finance', icon: DollarSign, color: 'emerald' },
    { id: 'payroll' as ReportCategory, name: 'Paie', icon: Briefcase, color: 'purple' },
    { id: 'clients' as ReportCategory, name: 'Clients', icon: TrendingUp, color: 'orange' },
    { id: 'inventory' as ReportCategory, name: 'Inventaire', icon: Package, color: 'indigo' }
  ];

  const renderReportContent = () => {
    switch (activeCategory) {
      case 'hr':
        return <HRReports />;
      case 'operations':
        return <OperationsReports />;
      case 'finance':
        return <FinanceReports />;
      case 'payroll':
        return <PayrollReports />;
      case 'clients':
        return <ClientReports />;
      case 'inventory':
        return <InventoryReports />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports & Analyses</h1>
            <p className="text-sm text-gray-600">Tableaux de bord et rapports par département</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? `border-${category.color}-600 text-${category.color}-600`
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {renderReportContent()}
      </div>
    </div>
  );
}
