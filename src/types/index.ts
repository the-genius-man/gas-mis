export type TypeClient = 'MORALE' | 'PHYSIQUE';
export type DeviseClient = 'USD' | 'CDF' | 'EUR';
export type StatutSite = 'ACTIF' | 'INACTIF';

export interface Client {
  id: string;
  raison_sociale: string;
  type_client: TypeClient;
  nif?: string;
  rccm?: string;
  id_national?: string;
  adresse_facturation: string;
  contact_principal_nom: string;
  contact_principal_telephone: string;
  contact_principal_email?: string;
  contact_urgence_nom?: string;
  contact_urgence_telephone?: string;
  devise_facturation: DeviseClient;
  delai_paiement_jours: number;
  numero_contrat?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Site {
  id: string;
  nom: string;
  client_id: string;
  localisation: string;
  adresse_physique: string;
  latitude?: number;
  longitude?: number;
  effectif_requis_jour: number;
  effectif_requis_nuit: number;
  tarif_mensuel_client: number;
  taux_journalier_garde: number;
  consignes_specifiques?: string;
  statut: StatutSite;
  created_at?: string;
  updated_at?: string;
  clients?: Client;
}