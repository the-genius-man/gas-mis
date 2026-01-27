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
  BarChart3,
  UserCog,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessModule, ROLE_INFO, isOperationsReadOnly } from '../../utils/permissions';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: Home, module: 'dashboard' },
  { id: 'hr-module', label: 'Personnel', icon: Users, module: 'hr' },
  { id: 'operations-module', label: 'Opérations', icon: Truck, module: 'operations' },
  { id: 'logistics-module', label: 'Logistique', icon: Package, module: 'inventory' },
  { id: 'clients', label: 'Clients', icon: Building2, module: 'finance' },
  { id: 'facturation', label: 'Facturation', icon: FileText, module: 'finance' },
  { id: 'finance', label: 'Finance', icon: Wallet, module: 'finance' },
  { id: 'payroll-module', label: 'Paie', icon: DollarSign, module: 'finance' }, // Changed from 'hr' to 'finance'
  { id: 'reports', label: 'Rapports', icon: BarChart3, module: 'reports' },
  { id: 'users', label: 'Utilisateurs', icon: UserCog, module: 'users' },
  { id: 'settings', label: 'Paramètres', icon: Settings, module: 'settings' },
];

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const { utilisateur, signOut } = useAuth();

  // Filter menu items based on user permissions with specific rules
  const accessibleMenuItems = menuItems.filter(item => {
    if (!utilisateur) return false;
    
    // Special rules for different roles
    const userRole = utilisateur.role;
    
    // Users module - only ADMIN can access
    if (item.id === 'users') {
      return userRole === 'ADMIN';
    }
    
    // Finance modules (clients, facturation, finance, payroll-module) - Operations roles cannot access
    const financeModules = ['clients', 'facturation', 'finance', 'payroll-module'];
    if (financeModules.includes(item.id)) {
      return userRole === 'ADMIN' || userRole === 'FINANCE_MANAGER';
    }
    
    // Operations modules (operations-module, logistics-module) - Finance can view but not modify
    const operationsModules = ['operations-module', 'logistics-module'];
    if (operationsModules.includes(item.id)) {
      return canAccessModule(userRole, item.module);
    }
    
    // Default permission check for other modules
    return canAccessModule(userRole, item.module);
  });

  const handleSignOut = async () => {
    if (signOut) {
      try {
        console.log('🚪 [SIDEBAR] Tentative de déconnexion...');
        await signOut();
        console.log('✅ [SIDEBAR] Déconnexion réussie');
      } catch (error) {
        console.error('❌ [SIDEBAR] Erreur de déconnexion:', error);
      }
    } else {
      console.log('⚠️ [SIDEBAR] Fonction signOut non disponible');
    }
  };

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
          {accessibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const isReadOnly = utilisateur && isOperationsReadOnly(utilisateur.role) && 
                              ['operations-module', 'logistics-module'].includes(item.id);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onModuleChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  } ${isReadOnly ? 'opacity-75' : ''}`}
                  title={isReadOnly ? 'Accès en lecture seule' : ''}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {isReadOnly && (
                    <span className="text-xs bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded ml-auto">
                      Lecture
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-slate-300 hover:bg-red-600 hover:text-white mb-3"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Se déconnecter</span>
        </button>
        
        <p className="text-xs text-slate-400 text-center italic">Version 1.1.0</p>
      </div>
    </div>
  );
}