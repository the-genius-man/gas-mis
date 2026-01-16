import {
  Shield,
  Home,
  FileText,
  Building2,
  Wallet,
  Users,
  Truck,
  Package,
  DollarSign,
  Settings,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
  { id: 'hr-module', label: 'Ressources Humaines', icon: Users },
  { id: 'operations-module', label: 'Opérations', icon: Truck },
  { id: 'logistics-module', label: 'Logistique', icon: Package },
  { id: 'clients', label: 'Clients', icon: Building2 },
  { id: 'facturation', label: 'Facturation', icon: FileText },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'payroll-module', label: 'Paie', icon: DollarSign },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <div className="bg-slate-900 text-white w-64 h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Go Ahead Security</h1>
            <p className="text-sm text-slate-400">Leading the curve ahead</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onModuleChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        <p className="text-xs text-slate-400 text-center italic">Version 1.1.0</p>
      </div>
    </div>
  );
}