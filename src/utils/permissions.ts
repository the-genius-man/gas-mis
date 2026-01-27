import { UserRole } from '../contexts/AuthContext';

// Define permissions for each module
export type Permission = 
  // Dashboard
  | 'dashboard.view'
  
  // Finance Module
  | 'finance.view'
  | 'finance.create'
  | 'finance.edit'
  | 'finance.delete'
  | 'finance.approve'
  | 'finance.reports'
  
  // HR Module
  | 'hr.view'
  | 'hr.create'
  | 'hr.edit'
  | 'hr.delete'
  | 'hr.payroll'
  | 'hr.disciplinary'
  | 'hr.reports'
  
  // Operations Module
  | 'operations.view'
  | 'operations.create'
  | 'operations.edit'
  | 'operations.delete'
  | 'operations.assign'
  | 'operations.reports'
  
  // Inventory Module
  | 'inventory.view'
  | 'inventory.create'
  | 'inventory.edit'
  | 'inventory.delete'
  | 'inventory.assign'
  
  // Reports Module
  | 'reports.view'
  | 'reports.finance'
  | 'reports.hr'
  | 'reports.operations'
  | 'reports.inventory'
  
  // User Management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.manage_roles'
  
  // Settings
  | 'settings.view'
  | 'settings.edit';

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access to everything
    'dashboard.view',
    'finance.view', 'finance.create', 'finance.edit', 'finance.delete', 'finance.approve', 'finance.reports',
    'hr.view', 'hr.create', 'hr.edit', 'hr.delete', 'hr.payroll', 'hr.disciplinary', 'hr.reports',
    'operations.view', 'operations.create', 'operations.edit', 'operations.delete', 'operations.assign', 'operations.reports',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.assign',
    'reports.view', 'reports.finance', 'reports.hr', 'reports.operations', 'reports.inventory',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
    'settings.view', 'settings.edit'
  ],
  
  FINANCE_MANAGER: [
    // Finance + HR + Read-only Operations access
    'dashboard.view',
    'finance.view', 'finance.create', 'finance.edit', 'finance.delete', 'finance.approve', 'finance.reports',
    'hr.view', 'hr.create', 'hr.edit', 'hr.delete', 'hr.payroll', 'hr.disciplinary', 'hr.reports',
    'operations.view', 'operations.reports', // Read-only operations access
    'inventory.view', // Read-only inventory access
    'reports.view', 'reports.finance', 'reports.hr', 'reports.operations', 'reports.inventory',
    // NO users access for Finance Manager
    'settings.view'
  ],
  
  OPERATIONS_MANAGER: [
    // Operations + Limited HR + NO Finance access
    'dashboard.view',
    // NO finance access for Operations roles
    'hr.view', 'hr.create', 'hr.edit', 'hr.reports', // HR access without payroll and disciplinary
    'operations.view', 'operations.create', 'operations.edit', 'operations.delete', 'operations.assign', 'operations.reports',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.assign',
    'reports.view', 'reports.hr', 'reports.operations', 'reports.inventory',
    // NO users access for Operations Manager
    'settings.view' // Added settings access
  ],
  
  ASSISTANT_OPERATIONS_MANAGER: [
    // Limited Operations + Basic HR + NO Finance access
    'dashboard.view',
    // NO finance access for Operations roles
    'hr.view', 'hr.create', 'hr.edit', // Basic HR access
    'operations.view', 'operations.create', 'operations.edit', 'operations.assign', // Operations without delete
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.assign', // Inventory without delete
    'reports.view', 'reports.operations', 'reports.inventory',
    // NO users access for Assistant Operations Manager
    'settings.view' // Added settings access
  ]
};

// Permission checking functions
export function hasPermission(userRole: UserRole | null, permission: Permission): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(userRole: UserRole | null, permissions: Permission[]): boolean {
  if (!userRole) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole | null, permissions: Permission[]): boolean {
  if (!userRole) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Module access checking
export function canAccessModule(userRole: UserRole | null, module: string): boolean {
  if (!userRole) return false;
  
  switch (module) {
    case 'dashboard':
      return hasPermission(userRole, 'dashboard.view');
    case 'finance':
      return hasPermission(userRole, 'finance.view');
    case 'hr':
      return hasPermission(userRole, 'hr.view');
    case 'operations':
      return hasPermission(userRole, 'operations.view');
    case 'inventory':
      return hasPermission(userRole, 'inventory.view');
    case 'reports':
      return hasPermission(userRole, 'reports.view');
    case 'users':
      return hasPermission(userRole, 'users.view');
    case 'settings':
      return hasPermission(userRole, 'settings.view');
    default:
      return false;
  }
}

// Role display names and descriptions
export const ROLE_INFO: Record<UserRole, { name: string; description: string; color: string }> = {
  ADMIN: {
    name: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système',
    color: 'bg-red-100 text-red-800'
  },
  FINANCE_MANAGER: {
    name: 'Gestionnaire Financier',
    description: 'Gestion financière, RH et administration',
    color: 'bg-green-100 text-green-800'
  },
  OPERATIONS_MANAGER: {
    name: 'Gestionnaire Opérations',
    description: 'Gestion des opérations, inventaire et RH de base',
    color: 'bg-blue-100 text-blue-800'
  },
  ASSISTANT_OPERATIONS_MANAGER: {
    name: 'Assistant Gestionnaire Opérations',
    description: 'Assistance aux opérations et tâches de base',
    color: 'bg-yellow-100 text-yellow-800'
  }
};

// Get user's accessible modules
export function getAccessibleModules(userRole: UserRole | null): string[] {
  if (!userRole) return [];
  
  const modules = ['dashboard'];
  
  if (canAccessModule(userRole, 'finance')) modules.push('finance');
  if (canAccessModule(userRole, 'hr')) modules.push('hr');
  if (canAccessModule(userRole, 'operations')) modules.push('operations');
  if (canAccessModule(userRole, 'inventory')) modules.push('inventory');
  if (canAccessModule(userRole, 'reports')) modules.push('reports');
  if (canAccessModule(userRole, 'users')) modules.push('users');
  if (canAccessModule(userRole, 'settings')) modules.push('settings');
  
  return modules;
}

// Check if user has read-only access to operations (for Finance users)
export function isOperationsReadOnly(userRole: UserRole | null): boolean {
  if (!userRole) return true;
  
  // Finance Manager can view operations but not modify
  if (userRole === 'FINANCE_MANAGER') {
    return hasPermission(userRole, 'operations.view') && !hasPermission(userRole, 'operations.create');
  }
  
  return false;
}

// Check if user can access finance modules (Finance, Paie, Facturation)
export function canAccessFinanceModules(userRole: UserRole | null): boolean {
  if (!userRole) return false;
  return hasPermission(userRole, 'finance.view');
}