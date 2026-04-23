import { useState } from 'react';
import { BookOpen, BarChart3, Scale, Lock, Settings } from 'lucide-react';
import JournalComptable from './JournalComptable';
import GrandLivre from './GrandLivre';
import BilanOhada from './BilanOhada';
import PeriodClosing from './PeriodClosing';
import TaxSettings from './TaxSettings';

type Tab = 'journal' | 'grandlivre' | 'bilan' | 'cloture' | 'fiscalite';

const tabs = [
  { id: 'journal' as Tab, label: 'Journal Comptable', icon: BookOpen },
  { id: 'grandlivre' as Tab, label: 'Grand Livre', icon: BarChart3 },
  { id: 'bilan' as Tab, label: 'Bilan OHADA', icon: Scale },
  { id: 'cloture' as Tab, label: 'Clôture', icon: Lock },
  { id: 'fiscalite' as Tab, label: 'Paramètres Fiscaux', icon: Settings },
];

export default function ComptabiliteModule() {
  const [activeTab, setActiveTab] = useState<Tab>('journal');

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tab navigation */}
      <div className="bg-gray-50 border-b border-gray-200 px-6">
        <nav className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        {activeTab === 'journal' && <JournalComptable />}
        {activeTab === 'grandlivre' && <GrandLivre />}
        {activeTab === 'bilan' && <BilanOhada />}
        {activeTab === 'cloture' && <PeriodClosing />}
        {activeTab === 'fiscalite' && <TaxSettings />}
      </div>
    </div>
  );
}
