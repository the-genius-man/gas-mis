import { useState, useEffect } from 'react';
import { FileText, AlertCircle, BookOpen } from 'lucide-react';
import InvoicesManagement from './InvoicesManagement';
import InvoiceAgingReport from './InvoiceAgingReport';
import ClientStatement from './ClientStatement';
import { FactureWithPayments, ClientGAS } from '../../types';

type Tab = 'invoices' | 'creances' | 'releves';

export default function FacturationModule() {
  const [activeTab, setActiveTab] = useState<Tab>('invoices');

  const tabs = [
    { id: 'invoices' as Tab, label: 'Factures', icon: FileText },
    { id: 'creances' as Tab, label: 'Créances Clients', icon: AlertCircle },
    { id: 'releves' as Tab, label: 'Relevés de Compte', icon: BookOpen },
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
        {activeTab === 'releves' && <RelevesTab />}
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

// ─── Relevés de Compte tab ───────────────────────────────────────────────────

function RelevesTab() {
  const [factures, setFactures] = useState<FactureWithPayments[]>([]);
  const [clients, setClients] = useState<ClientGAS[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

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
        const active = (clientsData || []).filter((c: ClientGAS) => c.statut !== 'SUPPRIME');
        setClients(active);
        if (active.length > 0) setSelectedClientId(active[0].id);
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

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <BookOpen className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">Aucun client enregistré</p>
      </div>
    );
  }

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="flex flex-col h-full">
      {/* Client selector bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Client :</label>
        <select
          value={selectedClientId}
          onChange={e => setSelectedClientId(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px]"
        >
          {clients
            .slice()
            .sort((a, b) => a.nom_entreprise.localeCompare(b.nom_entreprise))
            .map(c => (
              <option key={c.id} value={c.id}>{c.nom_entreprise}</option>
            ))}
        </select>
      </div>

      {/* Statement */}
      <div className="flex-1 overflow-y-auto">
        {selectedClient && (
          <ClientStatement
            key={selectedClient.id}
            client={selectedClient}
            allFactures={factures}
            onClose={() => {}}
            inline
          />
        )}
      </div>
    </div>
  );
}
