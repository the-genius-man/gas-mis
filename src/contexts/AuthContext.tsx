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
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await loadUtilisateur(session.user.id);
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await loadUtilisateur(session.user.id);
        } else {
          setUtilisateur(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUtilisateur = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUtilisateur({
          id: data.id,
          nom_utilisateur: data.nom_utilisateur,
          nom_complet: data.nom_complet,
          role: data.role,
          statut: data.statut,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      await loadUtilisateur(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
