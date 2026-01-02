import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'ADMIN' | 'CEO' | 'FINANCE' | 'OPS_MANAGER' | 'SUPERVISOR';

export interface Utilisateur {
  id: string;
  nom_utilisateur: string;
  nom_complet: string;
  role: UserRole;
  statut: 'ACTIF' | 'SUSPENDU';
}

interface AuthContextType {
  utilisateur: Utilisateur | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 [AUTH] Initialisation du contexte d\'authentification');
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        console.log('📋 [AUTH] Session récupérée:', session ? 'Session active' : 'Aucune session');
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          console.log('👤 [AUTH] Utilisateur trouvé dans la session:', session.user.email);
          await loadUtilisateur(session.user.id);
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        console.log('🔔 [AUTH] Changement d\'état d\'authentification:', event);
        console.log('📋 [AUTH] Session:', session ? `Active (${session.user.email})` : 'Aucune');
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          console.log('👤 [AUTH] Chargement des données utilisateur pour:', session.user.email);
          await loadUtilisateur(session.user.id);
        } else {
          console.log('🚪 [AUTH] Déconnexion - Nettoyage des données utilisateur');
          setUtilisateur(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUtilisateur = async (userId: string) => {
    try {
      console.log('📊 [AUTH] Chargement des données utilisateur depuis la base de données...');
      console.log('🔍 [AUTH] ID utilisateur:', userId);

      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ [AUTH] Erreur lors de la requête:', error);
        throw error;
      }

      if (data) {
        console.log('✅ [AUTH] Données utilisateur chargées:', {
          nom_utilisateur: data.nom_utilisateur,
          nom_complet: data.nom_complet,
          role: data.role,
          statut: data.statut
        });
        setUtilisateur({
          id: data.id,
          nom_utilisateur: data.nom_utilisateur,
          nom_complet: data.nom_complet,
          role: data.role,
          statut: data.statut,
        });
      } else {
        console.warn('⚠️ [AUTH] Aucune donnée utilisateur trouvée dans la table utilisateurs');
      }
    } catch (error) {
      console.error('❌ [AUTH] Erreur lors du chargement de l\'utilisateur:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AUTH] Tentative de connexion avec Supabase...');
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ [AUTH] Erreur d\'authentification Supabase:', error);
      throw error;
    }

    console.log('✅ [AUTH] Authentification Supabase réussie pour:', data.user?.email);
  };

  const signOut = async () => {
    console.log('🚪 [AUTH] Déconnexion en cours...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [AUTH] Erreur lors de la déconnexion:', error);
      throw error;
    }
    console.log('✅ [AUTH] Déconnexion réussie');
    setUtilisateur(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, supabaseUser, loading, signIn, signOut }}>
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
