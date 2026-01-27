import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isOperationsReadOnly } from '../../utils/permissions';
import { Eye, Lock } from 'lucide-react';

interface ReadOnlyWrapperProps {
  children: React.ReactNode;
  moduleName: string;
  showMessage?: boolean;
}

export default function ReadOnlyWrapper({ children, moduleName, showMessage = true }: ReadOnlyWrapperProps) {
  const { utilisateur } = useAuth();
  
  const isReadOnly = utilisateur && isOperationsReadOnly(utilisateur.role);
  
  if (!isReadOnly) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative">
      {showMessage && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Mode Lecture Seule</h3>
              <p className="text-sm text-yellow-700">
                Vous avez un accès en lecture seule au module {moduleName}. 
                Les fonctions de modification sont désactivées.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="pointer-events-none opacity-75 select-none">
        {children}
      </div>
      
      {/* Overlay to prevent interactions */}
      <div className="absolute inset-0 bg-transparent cursor-not-allowed" />
    </div>
  );
}