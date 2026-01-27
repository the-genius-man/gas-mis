import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'FINANCE_MANAGER' | 'OPERATIONS_MANAGER' | 'ASSISTANT_OPERATIONS_MANAGER';

export interface Utilisateur {
  id: string;
  nom_utilisateur: string;
  nom_complet: string;
  email?: string;
  role: UserRole;
  statut: 'ACTIF' | 'SUSPENDU';
  derniere_connexion?: string;
  cree_le?: string;
}

interface AuthContextType {
  utilisateur: Utilisateur | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Add global function for debugging
  useEffect(() => {
    (window as any).clearAuthSession = () => {
      console.log('🧹 [DEBUG] Nettoyage manuel de la session');
      localStorage.clear();
      setUtilisateur(null);
      window.location.reload();
      console.log('✅ [DEBUG] Session nettoyée');
    };
  }, []);

  useEffect(() => {
    console.log('🔄 [AUTH] Initialisation du contexte d\'authentification local');
    console.log('🔍 [AUTH] Vérification localStorage:', localStorage.getItem('gas_current_user'));
    
    // Don't check session if we're logging out
    if (!isLoggingOut) {
      checkExistingSession();
    } else {
      setLoading(false);
    }
  }, [isLoggingOut]);

  const checkExistingSession = async () => {
    try {
      console.log('🔍 [AUTH] Vérification de session existante...');
      
      // Check if we're in logout mode
      if (isLoggingOut) {
        console.log('🚫 [AUTH] Mode déconnexion actif, pas de restauration de session');
        setUtilisateur(null);
        return;
      }
      
      // Check if there's a stored session
      const storedUser = localStorage.getItem('gas_current_user');
      console.log('🔍 [AUTH] Données localStorage brutes:', storedUser);
      
      if (storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
        try {
          const userData = JSON.parse(storedUser);
          console.log('👤 [AUTH] Session locale trouvée:', userData.nom_utilisateur);
          console.log('🔍 [AUTH] Données utilisateur:', userData);
          
          // Verify user still exists and is active
          if (window.electronAPI) {
            console.log('🔍 [AUTH] Vérification avec electronAPI...');
            const user = await window.electronAPI.getUserById(userData.id);
            if (user && user.statut === 'ACTIF') {
              setUtilisateur(user);
              console.log('✅ [AUTH] Session locale validée');
            } else {
              console.log('⚠️ [AUTH] Session locale invalide, nettoyage');
              localStorage.removeItem('gas_current_user');
              setUtilisateur(null);
            }
          } else {
            // If no electronAPI, just use stored data (web mode fallback)
            console.log('🔍 [AUTH] Mode web, utilisation des données stockées');
            setUtilisateur(userData);
            console.log('✅ [AUTH] Session locale validée (mode web)');
          }
        } catch (parseError) {
          console.error('❌ [AUTH] Erreur de parsing des données utilisateur:', parseError);
          localStorage.removeItem('gas_current_user');
          setUtilisateur(null);
        }
      } else {
        console.log('🚫 [AUTH] Aucune session locale trouvée');
        setUtilisateur(null);
      }
    } catch (error) {
      console.error('❌ [AUTH] Erreur lors de la vérification de session:', error);
      localStorage.removeItem('gas_current_user');
      setUtilisateur(null);
    } finally {
      setLoading(false);
      console.log('🏁 [AUTH] Vérification de session terminée, loading=false');
    }
  };

  const signIn = async (username: string, password: string) => {
    console.log('🔐 [AUTH] Tentative de connexion locale pour:', username);
    
    if (!window.electronAPI) {
      throw new Error('Application non disponible en mode hors ligne');
    }

    try {
      const user = await window.electronAPI.authenticateUser(username, password);
      
      if (!user) {
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
      }

      if (user.statut !== 'ACTIF') {
        throw new Error('Compte suspendu. Contactez l\'administrateur.');
      }

      // Update last login
      await window.electronAPI.updateUserLastLogin(user.id);
      
      // Store session locally
      localStorage.setItem('gas_current_user', JSON.stringify(user));
      
      setUtilisateur(user);
      console.log('✅ [AUTH] Connexion locale réussie pour:', user.nom_complet);
    } catch (error: any) {
      console.error('❌ [AUTH] Erreur de connexion locale:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 [AUTH] Déconnexion locale en cours...');
    console.log('🔍 [AUTH] Utilisateur actuel avant déconnexion:', utilisateur?.nom_utilisateur);
    console.log('🔍 [AUTH] localStorage avant suppression:', localStorage.getItem('gas_current_user'));
    
    // Set logout flag to prevent session restoration
    setIsLoggingOut(true);
    
    try {
      // Clear ALL possible auth-related localStorage keys
      const keysToRemove = [
        'gas_current_user',
        'supabase.auth.token',
        'sb-auth-token',
        'auth_token',
        'user_session',
        'current_user'
      ];
      
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`🗑️ [AUTH] Suppression de la clé: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Also clear all localStorage for safety
      console.log('🧹 [AUTH] Nettoyage complet du localStorage');
      localStorage.clear();
      
      console.log('🔍 [AUTH] localStorage après suppression:', localStorage.getItem('gas_current_user'));
      
      setUtilisateur(null);
      console.log('👤 [AUTH] État utilisateur mis à null');
      
      console.log('✅ [AUTH] Déconnexion locale réussie');
      
      // Force a page reload to ensure clean state
      console.log('🔄 [AUTH] Rechargement immédiat de la page');
      window.location.href = window.location.origin + window.location.pathname;
      
    } catch (error) {
      console.error('❌ [AUTH] Erreur lors de la déconnexion locale:', error);
      // Force reload even if there's an error
      window.location.reload();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ utilisateur, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
