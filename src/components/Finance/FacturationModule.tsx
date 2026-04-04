import { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import InvoicesManagement from './InvoicesManagement';
import InvoiceAgingReport from './InvoiceAgingReport';
import { FactureWithPayments, ClientGAS } from '../../types';

type Tab = 'invoices' | 'creances';

export default function FacturationModule() {
  const [activeTab, setActiveTab] = useState<Tab>('invoices');

  const tabs = [
    { id: 'invoices' as Tab, label: 'Factures', icon: FileText },
    { id: 'creances' as Tab, label: 'Créances Clients', icon: AlertCircle },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        {activeTab === 'invoices' && <InvoicesManagement />}
        {activeTab === 'creances' && <CreancesTab />}
      </div>
    </div>
  );
}

function CreancesTab() {
  const [factures, setFactures] = useState<FactureWithPayments[]>([]);
  const [clients, setClients] = useState<ClientGAS[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!window.electronAPI) { setLoading(false); return; }
      try {
        const [facturesData, clientsData] = await Promise.all([
          window.electronAPI.getFacturesGAS(),
          window.electronAPI.getClientsGAS(),
        ]);
        const enriched: FactureWithPayments[] = await Promise.all(
          (facturesData || []).map(async (f: any) => {
            try {
              const summary = await window.electronAPI!.getFacturePaiementsSummary(f.id);
              return { ...f, totalPaye: summary.montant_paye, soldeRestant: summary.solde_restant };
            } catch {
              return { ...f, totalPaye: 0, soldeRestant: f.montant_total_du_client };
            }
          })
        );
        setFactures(enriched);
        setClients(clientsData || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <InvoiceAgingReport
      factures={factures}
      clients={clients}
      onClose={() => {}}
      inline
    />
  );
}
