import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create client if environment variables are available
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase environment variables not found. Running in offline mode.');
  // Create a mock client for development
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
      signOut: () => Promise.reject(new Error('Supabase not configured'))
    },
    from: () => ({
      select: () => Promise.reject(new Error('Supabase not configured')),
      insert: () => Promise.reject(new Error('Supabase not configured')),
      update: () => Promise.reject(new Error('Supabase not configured')),
      delete: () => Promise.reject(new Error('Supabase not configured'))
    })
  };
}

export { supabase };

export interface Database {
  public: {
    Tables: {
      utilisateurs: {
        Row: {
          id: string;
          nom_utilisateur: string;
          mot_de_passe_hash: string;
          nom_complet: string;
          role: 'ADMIN' | 'CEO' | 'FINANCE' | 'OPS_MANAGER' | 'SUPERVISOR';
          statut: 'ACTIF' | 'SUSPENDU';
          derniere_connexion: string | null;
          cree_le: string;
        };
        Insert: Omit<Database['public']['Tables']['utilisateurs']['Row'], 'id' | 'cree_le'>;
        Update: Partial<Database['public']['Tables']['utilisateurs']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          type_client: 'MORALE' | 'PHYSIQUE';
          nom_entreprise: string;
          nif: string | null;
          rccm: string | null;
          id_national: string | null;
          numero_contrat: string | null;
          contrat_url: string | null;
          contact_nom: string | null;
          contact_email: string | null;
          telephone: string | null;
          contact_urgence_nom: string | null;
          contact_urgence_telephone: string | null;
          adresse_facturation: string | null;
          devise_preferee: string;
          delai_paiement_jours: number;
          cree_le: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'cree_le'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      sites: {
        Row: {
          id: string;
          client_id: string;
          nom_site: string;
          adresse_physique: string | null;
          latitude: number | null;
          longitude: number | null;
          effectif_jour_requis: number;
          effectif_nuit_requis: number;
          cout_unitaire_garde: number;
          tarif_mensuel_client: number;
          consignes_specifiques: string | null;
          est_actif: boolean;
        };
        Insert: Omit<Database['public']['Tables']['sites']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['sites']['Insert']>;
      };
      factures_clients: {
        Row: {
          id: string;
          client_id: string;
          numero_facture: string;
          date_emission: string;
          date_echeance: string | null;
          periode_mois: number | null;
          periode_annee: number | null;
          total_gardiens_factures: number;
          montant_ht_prestation: number;
          montant_frais_supp: number;
          motif_frais_supp: string | null;
          creances_anterieures: number;
          montant_total_ttc: number;
          montant_total_du_client: number;
          devise: string;
          statut_paiement: 'BROUILLON' | 'ENVOYE' | 'PAYE_PARTIEL' | 'PAYE_TOTAL' | 'ANNULE';
          notes_facture: string | null;
        };
        Insert: Omit<Database['public']['Tables']['factures_clients']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['factures_clients']['Insert']>;
      };
    };
  };
}
