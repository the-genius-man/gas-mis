import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, hasAnyPermission, Permission } from '../../utils/permissions';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  showFallback = true
}) => {
  const { utilisateur } = useAuth();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(utilisateur?.role || null, permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? permissions.every(p => hasPermission(utilisateur?.role || null, p))
      : hasAnyPermission(utilisateur?.role || null, permissions);
  } else {
    // If no permissions specified, allow access
    hasAccess = true;
  }
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showFallback) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès Restreint</h3>
          <p className="text-sm text-gray-500">
            Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.
          </p>
        </div>
      </div>
    );
  }
  
  return null;
};

export default PermissionGuard;