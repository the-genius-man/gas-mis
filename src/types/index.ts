export type TypeClient = 'MORALE' | 'PHYSIQUE';
export type DeviseClient = 'USD' | 'CDF' | 'EUR';
export type StatutSite = 'ACTIF' | 'INACTIF';
export type StatutFacture = 'BROUILLON' | 'ENVOYE' | 'PAYE_PARTIEL' | 'PAYE_TOTAL' | 'ANNULE';
export type StatutEmploye = 'ACTIF' | 'CONGE' | 'SUSPENDU' | 'LICENCIE';
// Employee Types (Updated Structure)
export type CategorieEmploye = 'GARDE' | 'ADMINISTRATION';
export type PosteGarde = 'GARDE' | 'ROTEUR';
export type PosteAdministration = 'DIRECTEUR_GERANT' | 'ADMINISTRATEUR_GERANT' | 'FINANCIER' | 'COMPTABLE' | 'CHEF_OPERATIONS' | 'SUPERVISEUR' | 'CHAUFFEUR';
export type PosteEmploye = PosteGarde | PosteAdministration;
export type ModeRemuneration = 'MENSUEL_FIXE' | 'TAUX_JOURNALIER';
export type RoleUtilisateur = 'ADMIN' | 'FINANCE_MANAGER' | 'OPERATIONS_MANAGER' | 'ASSISTANT_OPERATIONS_MANAGER';

// ============================================================================
// GUARDIAN COMMAND - Types conformes au schéma SQL OHADA
// ============================================================================

// Utilisateur (Gestion des accès RBAC)
export interface Utilisateur {
  id: string;
  nom_utilisateur: string;
  mot_de_passe_hash?: string;
  nom_complet: string;
  role: RoleUtilisateur;
  statut: 'ACTIF' | 'SUSPENDU';
  derniere_connexion?: string;
  cree_le?: string;
}

export type StatutClient = 'ACTIF' | 'INACTIF' | 'SUPPRIME';

// Client (Tiers contractuels)
export interface ClientGAS {
  id: string;
  type_client: TypeClient;
  nom_entreprise: string;
  nif?: string;
  rccm?: string;
  id_national?: string;
  numero_contrat?: string;
  contrat_url?: string;
  contact_nom?: string;
  contact_email?: string;
  telephone?: string;
  contact_urgence_nom?: string;
  contact_urgence_telephone?: string;
  adresse_facturation?: string;
  devise_preferee: DeviseClient;
  delai_paiement_jours: number;
  statut: StatutClient;
  cree_le?: string;
}

// Site (Lieux physiques sécurisés)
export interface SiteGAS {
  id: string;
  client_id: string;
  nom_site: string;
  adresse_physique?: string;
  latitude?: number;
  longitude?: number;
  effectif_jour_requis: number;
  effectif_nuit_requis: number;
  cout_unitaire_garde: number; // Unit cost per guard per month for this site
  tarif_mensuel_client: number; // Auto-calculated: total_guards × cout_unitaire_garde
  consignes_specifiques?: string;
  est_actif: boolean;
  // Relations
  client?: ClientGAS;
}

// Employé (Personnel GAS)
export interface EmployeGAS {
  id: string;
  matricule_gas: string;
  nom_complet: string;
  genre?: 'M' | 'F';
  date_naissance?: string;
  telephone?: string;
  adresse_domicile?: string;
  numero_cnss?: string;
  categorie: CategorieEmploye;
  mode_remuneration: ModeRemuneration;
  salaire_base_fixe: number;
  taux_journalier_defaut: number;
  date_embauche: string;
  statut: StatutEmploye;
  photo_url?: string;
  cree_le?: string;
}

// Facture Client (Comptabilité OHADA)
export interface FactureGAS {
  id: string;
  client_id: string;
  numero_facture: string;
  date_emission: string;
  date_echeance?: string;
  periode_mois?: number;
  periode_annee?: number;
  total_gardiens_factures: number;
  montant_ht_prestation: number;
  montant_frais_supp: number;
  motif_frais_supp?: string;
  creances_anterieures: number;
  montant_total_ttc: number;
  montant_total_du_client: number;
  devise: DeviseClient;
  statut_paiement: StatutFacture;
  notes_facture?: string;
  // Relations
  client?: ClientGAS;
  details?: FactureDetailGAS[];
}

// Détail Facture (Ligne par site)
export interface FactureDetailGAS {
  id: string;
  facture_id: string;
  site_id: string;
  nombre_gardiens_site: number;
  montant_forfaitaire_site: number;
  description_ligne?: string;
  // Relations
  site?: SiteGAS;
}

// Plan Comptable OHADA
export interface CompteOHADA {
  code_ohada: string;
  libelle: string;
  type_compte: 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT';
}

// Mode de Paiement
export type ModePaiement = 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY';

// Paiement (Encaissements clients)
export interface PaiementGAS {
  id: string;
  facture_id: string;
  date_paiement: string;
  montant_paye: number;
  devise: DeviseClient;
  mode_paiement: ModePaiement;
  reference_paiement?: string;
  banque_origine?: string;
  notes?: string;
  cree_le?: string;
  // Relations
  facture?: FactureGAS;
}

// Dashboard Stats
export interface DashboardStats {
  totalEmployees: number;
  activeGuards: number;
  totalClients: number;
  activeSites: number;
  monthlyRevenue: number;
  pendingIncidents: number;
  expiringCertifications: number;
  upcomingShifts: number;
}

// ============================================================================
// Types Legacy (pour compatibilité avec le code existant)
// ============================================================================

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  dateHired: string;
  position: string;
  department: string;
  status: string;
  salary: number;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string;
}

// Supabase Client interface (for web mode - legacy)
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

// Electron Client interface (for desktop mode - legacy)
export interface ElectronClient {
  id: string;
  name: string;
  type: 'corporate' | 'residential';
  primaryContact: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  contractStartDate: string;
  contractEndDate: string;
  serviceLevel: string;
  hourlyRate: number;
  billingCycle: string;
  paymentTerms: string;
  status: string;
  totalValue: number;
  createdDate: string;
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
  cout_unitaire_garde: number;
  tarif_mensuel_client: number;
  consignes_specifiques?: string;
  statut: StatutSite;
  created_at?: string;
  updated_at?: string;
  clients?: Client;
}

export interface Facture {
  id: string;
  client_id: string;
  numero_facture: string;
  date_emission: string;
  date_echeance: string;
  periode_mois: number;
  periode_annee: number;
  total_gardiens_factures: number;
  montant_ht_prestation: number;
  montant_frais_supp: number;
  motif_frais_supp?: string;
  creances_anterieures: number;
  montant_total_ttc: number;
  montant_total_du_client: number;
  devise: DeviseClient;
  statut_paiement: StatutFacture;
  notes_facture?: string;
  created_at?: string;
  updated_at?: string;
  clients?: Client;
  factures_details?: FactureDetail[];
}

export interface FactureDetail {
  id: string;
  facture_id: string;
  site_id: string;
  nombre_gardiens_site: number;
  montant_forfaitaire_site: number;
  description_ligne?: string;
  sites?: Site;
}

// ============================================================================
// FINANCE MODULE - Types OHADA
// ============================================================================

export type TypeCompteTresorerie = 'CAISSE' | 'BANQUE' | 'MOBILE_MONEY';
export type TypeMouvement = 'ENTREE' | 'SORTIE' | 'TRANSFERT';
export type TypeSource = 'PAIEMENT_CLIENT' | 'DEPENSE' | 'TRANSFERT' | 'AUTRE';
export type StatutDepense = 'EN_ATTENTE' | 'VALIDEE' | 'ANNULEE';

// Plan Comptable OHADA
export interface PlanComptable {
  code_compte: string;
  libelle: string;
  classe: string;
  type_compte: 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT';
  est_actif: boolean;
  description?: string;
}

// Compte de Trésorerie (Caisse, Banque, Mobile Money)
export interface CompteTresorerie {
  id: string;
  code_compte: string;
  nom_compte: string;
  type_compte: TypeCompteTresorerie;
  devise: DeviseClient;
  solde_actuel: number;
  banque_nom?: string;
  numero_compte?: string;
  est_actif: boolean;
  cree_le?: string;
}

// Catégorie de Dépense
export interface CategorieDepense {
  id: string;
  code_compte: string;
  nom_categorie: string;
  description?: string;
  est_actif: boolean;
  compte_libelle?: string; // Joined from plan_comptable
}

// Dépense (Charge)
export interface Depense {
  id: string;
  categorie_id: string;
  compte_tresorerie_id: string;
  date_depense: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  devise: DeviseClient;
  beneficiaire?: string;
  description: string;
  reference_piece?: string;
  mode_paiement: ModePaiement;
  statut: StatutDepense;
  cree_par?: string;
  cree_le?: string;
  // Joined fields
  nom_categorie?: string;
  compte_tresorerie_nom?: string;
}

// Entrée (Recette/Dépôt)
export type SourceEntree = 'DEPOT' | 'PAIEMENT_CLIENT' | 'AUTRE';

export interface Entree {
  id: string;
  compte_tresorerie_id: string;
  date_entree: string;
  montant: number;
  devise: DeviseClient;
  source_type: SourceEntree;
  facture_id?: string;
  description: string;
  reference?: string;
  mode_paiement: ModePaiement;
  cree_par?: string;
  cree_le?: string;
  // Joined fields
  compte_tresorerie_nom?: string;
  numero_facture?: string;
  client_nom?: string;
}

// Mouvement de Trésorerie (Journal de Caisse/Banque)
export interface MouvementTresorerie {
  id: string;
  compte_tresorerie_id: string;
  date_mouvement: string;
  type_mouvement: TypeMouvement;
  montant: number;
  devise: DeviseClient;
  libelle: string;
  reference_source?: string;
  type_source?: TypeSource;
  source_id?: string;
  solde_avant: number;
  solde_apres: number;
  cree_le?: string;
  // Joined fields
  nom_compte?: string;
}

// Finance Stats (Dashboard)
export interface FinanceStats {
  totalCaisseUSD: number;
  totalCaisseCDF: number;
  totalBanque: number;
  depensesMois: number;
  depensesParCategorie: { nom_categorie: string; total: number }[];
  comptes: CompteTresorerie[];
}

// Filters for Finance queries
export interface DepenseFilters {
  dateDebut?: string;
  dateFin?: string;
  categorieId?: string;
  statut?: StatutDepense;
}

export interface MouvementFilters {
  compteId?: string;
  dateDebut?: string;
  dateFin?: string;
}


// ============================================================================
// HR, OPERATIONS, INVENTORY & DISCIPLINARY MODULE - Types
// ============================================================================

// Employee Status Types
export type StatutEmployeGAS = 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'TERMINE';
export type ModeRemunerationGAS = 'MENSUEL' | 'JOURNALIER';
export type EtatCivil = 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';
export type Genre = 'M' | 'F';

// Deployment History Types
export type MotifAffectation = 'EMBAUCHE' | 'TRANSFERT' | 'DEMANDE_CLIENT' | 'DISCIPLINAIRE' | 'REORGANISATION' | 'AUTRE';
export type PosteDeployement = 'JOUR' | 'NUIT' | 'MIXTE';

// Leave Types
export type TypeConge = 'ANNUEL' | 'MALADIE' | 'MATERNITE' | 'PATERNITE' | 'SANS_SOLDE';
export type StatutConge = 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'ANNULE';

// Rôteur Assignment Types
export type StatutAffectationRoteur = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';

// Vehicle Types
export type TypeVehicule = 'VOITURE' | 'MOTO' | 'CAMIONNETTE';
export type StatutVehicule = 'ACTIF' | 'EN_REPARATION' | 'HORS_SERVICE';

// Equipment Types
export type CategorieEquipement = 'UNIFORME' | 'RADIO' | 'TORCHE' | 'PR24' | 'AUTRE';
export type EtatEquipement = 'NEUF' | 'BON' | 'USAGE' | 'ENDOMMAGE' | 'PERDU';
export type StatutEquipement = 'DISPONIBLE' | 'AFFECTE' | 'EN_REPARATION' | 'RETIRE';

// Disciplinary Types
export type TypeActionDisciplinaire = 'AVERTISSEMENT_VERBAL' | 'AVERTISSEMENT_ECRIT' | 'SUSPENSION' | 'LICENCIEMENT';
export type StatutActionDisciplinaire = 'BROUILLON' | 'EN_ATTENTE_SIGNATURE' | 'EN_ATTENTE_VALIDATION' | 'VALIDE' | 'REJETE';

// Alert Types
export type TypeAlerte = 'ASSURANCE' | 'CONTROLE_TECHNIQUE' | 'CERTIFICATION' | 'CONGE' | 'AUTRE';
export type PrioriteAlerte = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
export type StatutAlerte = 'ACTIVE' | 'ACQUITTEE' | 'EXPIREE';

// ============================================================================
// HR MODULE - Interfaces
// ============================================================================

// Enhanced Employee (GAS)
export interface EmployeeGASFull {
  id: string;
  matricule: string;
  nom_complet: string;
  date_naissance?: string;
  genre?: Genre;
  etat_civil?: EtatCivil;
  numero_id_national?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  photo_url?: string;
  document_id_url?: string;
  document_cv_url?: string;
  document_casier_url?: string;
  date_embauche: string;
  categorie: CategorieEmploye;
  poste: PosteEmploye;
  site_affecte_id?: string;
  mode_remuneration: ModeRemunerationGAS;
  salaire_base: number;
  taux_journalier: number;
  banque_nom?: string;
  banque_compte?: string;
  statut: StatutEmployeGAS;
  date_fin_contrat?: string;
  motif_fin?: string;
  cree_le?: string;
  modifie_le?: string;
  // Joined fields
  site_nom?: string;
  client_nom?: string;
}

// Guard Deployment History
export interface HistoriqueDeployement {
  id: string;
  employe_id: string;
  site_id: string;
  date_debut: string;
  date_fin?: string;
  poste: PosteDeployement;
  motif_affectation: MotifAffectation;
  notes?: string;
  roteur_sites?: string; // Comma-separated list of sites for roteur assignments
  est_actif: boolean;
  cree_par?: string;
  cree_le?: string;
  modifie_le?: string;
  // Joined fields
  employe_nom?: string;
  site_nom?: string;
  client_nom?: string;
  duree_jours?: number;
}

// Leave Provision
export interface CongeProvision {
  id: string;
  employe_id: string;
  annee: number;
  jours_acquis: number;
  jours_pris: number;
  jours_restants?: number; // Calculated: jours_acquis - jours_pris
  provision_montant: number;
  cree_le?: string;
  // Joined fields
  employe_nom?: string;
}

// Leave Request
export interface DemandeConge {
  id: string;
  employe_id: string;
  type_conge: TypeConge;
  date_debut: string;
  date_fin: string;
  nombre_jours: number;
  motif?: string;
  statut: StatutConge;
  approuve_par?: string;
  date_approbation?: string;
  notes_approbation?: string;
  roteur_remplacant_id?: string;
  cree_le?: string;
  // Joined fields
  employe_nom?: string;
  roteur_nom?: string;
  approbateur_nom?: string;
}

// ============================================================================
// OPERATIONS MODULE - Interfaces
// ============================================================================

// Rôteur Assignment
export interface AffectationRoteur {
  id: string;
  roteur_id: string;
  site_id: string;
  employe_remplace_id?: string;
  demande_conge_id?: string;
  date_debut: string;
  date_fin: string;
  poste: 'JOUR' | 'NUIT';
  statut: StatutAffectationRoteur;
  notes?: string;
  cree_le?: string;
  // Joined fields
  roteur_nom?: string;
  site_nom?: string;
  client_nom?: string;
  employe_remplace_nom?: string;
}

// Coverage Gap (Site needing rôteur coverage)
export interface CoverageGap {
  site_id: string;
  site_nom: string;
  client_nom?: string;
  employe_id: string;
  employe_nom: string;
  demande_conge_id: string;
  date_debut: string;
  date_fin: string;
  nombre_jours: number;
}

// Fleet Vehicle
export interface VehiculeFlotte {
  id: string;
  type_vehicule: TypeVehicule;
  marque: string;
  modele?: string;
  immatriculation: string;
  numero_chassis?: string;
  annee_fabrication?: number;
  couleur?: string;
  employe_responsable_id?: string;
  date_affectation?: string;
  assurance_compagnie?: string;
  assurance_numero_police?: string;
  assurance_date_debut?: string;
  assurance_date_fin?: string;
  controle_technique_date?: string;
  controle_technique_expiration?: string;
  vignette_annee?: number;
  vignette_montant?: number;
  taxe_voirie_annee?: number;
  taxe_voirie_montant?: number;
  statut: StatutVehicule;
  kilometrage_actuel: number;
  cree_le?: string;
  modifie_le?: string;
  // Joined fields
  employe_nom?: string;
  // Calculated fields
  assurance_jours_restants?: number;
  controle_technique_jours_restants?: number;
}

// Fuel Consumption
export interface ConsommationCarburant {
  id: string;
  vehicule_id: string;
  date_plein: string;
  quantite_litres: number;
  prix_unitaire: number;
  montant_total: number;
  kilometrage?: number;
  station?: string;
  conducteur_id?: string;
  depense_id?: string;
  notes?: string;
  cree_le?: string;
  // Joined fields
  vehicule_immatriculation?: string;
  vehicule_marque?: string;
  vehicule_modele?: string;
  conducteur_nom?: string;
}

// Vehicle Repair/Maintenance Types
export type TypeReparation = 'ENTRETIEN' | 'REPARATION' | 'REVISION' | 'PNEUS' | 'FREINS' | 'MOTEUR' | 'CARROSSERIE' | 'AUTRE';

export interface ReparationVehicule {
  id: string;
  vehicule_id: string;
  date_reparation: string;
  type_reparation: TypeReparation;
  description: string;
  garage?: string;
  cout_main_oeuvre: number;
  cout_pieces: number;
  montant_total: number;
  kilometrage?: number;
  prochaine_revision_km?: number;
  prochaine_revision_date?: string;
  depense_id?: string;
  notes?: string;
  cree_le?: string;
  // Joined fields
  vehicule_immatriculation?: string;
  vehicule_marque?: string;
  vehicule_modele?: string;
}

// ============================================================================
// INVENTORY MODULE - Interfaces
// ============================================================================

// Equipment
export interface Equipement {
  id: string;
  code_equipement: string;
  qr_code?: string;
  categorie: CategorieEquipement;
  designation: string;
  description?: string;
  numero_serie?: string;
  date_acquisition?: string;
  cout_acquisition?: number;
  etat: EtatEquipement;
  statut: StatutEquipement;
  cree_le?: string;
  // Joined fields
  employe_affecte_id?: string;
  employe_affecte_nom?: string;
}

// Equipment Assignment
export interface AffectationEquipement {
  id: string;
  equipement_id: string;
  employe_id: string;
  date_affectation: string;
  signature_affectation?: string; // Base64 image
  date_retour?: string;
  signature_retour?: string; // Base64 image
  etat_retour?: 'BON' | 'USAGE' | 'ENDOMMAGE' | 'PERDU';
  notes?: string;
  cree_le?: string;
  // Joined fields
  equipement_code?: string;
  equipement_designation?: string;
  employe_nom?: string;
}

// ============================================================================
// DISCIPLINARY MODULE - Interfaces
// ============================================================================

// Disciplinary Action
export interface ActionDisciplinaire {
  id: string;
  employe_id: string;
  type_action: TypeActionDisciplinaire;
  date_incident: string;
  description_incident: string;
  lieu_incident?: string;
  temoins?: string;
  impact_financier: boolean;
  montant_deduction: number;
  jours_suspension: number;
  statut: StatutActionDisciplinaire;
  signature_employe?: string; // Base64 image
  date_signature_employe?: string;
  commentaire_employe?: string;
  valide_par?: string;
  date_validation?: string;
  commentaire_validation?: string;
  periode_paie_mois?: number;
  periode_paie_annee?: number;
  applique_paie: boolean;
  cree_par?: string;
  cree_le?: string;
  // Joined fields
  employe_nom?: string;
  matricule?: string;
  validateur_nom?: string;
  createur_nom?: string;
}

// ============================================================================
// ALERTS MODULE - Interfaces
// ============================================================================

// System Alert
export interface AlerteSysteme {
  id: string;
  type_alerte: TypeAlerte;
  reference_type: string; // 'vehicule', 'employe', 'equipement', etc.
  reference_id: string;
  titre: string;
  message: string;
  date_echeance?: string;
  priorite: PrioriteAlerte;
  statut: StatutAlerte;
  acquittee_par?: string;
  date_acquittement?: string;
  cree_le?: string;
  // Joined fields
  acquitteur_nom?: string;
}

// Alert Counts (for dashboard)
export interface AlerteCounts {
  total: number;
  assurance: number;
  controle_technique: number;
  certification: number;
  conge: number;
  autre: number;
  critique: number;
  haute: number;
}

// ============================================================================
// HR STATS - Dashboard
// ============================================================================

export interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  guardsCount: number;
  roteursCount: number;
  supervisorsCount: number;
  adminCount: number;
  onLeaveCount: number;
  pendingLeaveRequests: number;
}

export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  inRepairVehicles: number;
  expiringInsurance: number;
  expiringTechnicalInspection: number;
}

export interface InventoryStats {
  totalEquipment: number;
  availableEquipment: number;
  assignedEquipment: number;
  damagedEquipment: number;
}

export interface DisciplinaryStats {
  pendingActions: number;
  pendingSignatures: number;
  pendingValidations: number;
  thisMonthActions: number;
}

// ============================================================================
// PAYROLL MODULE - Types
// ============================================================================

export type StatutPeriodePaie = 'BROUILLON' | 'CALCULEE' | 'VALIDEE' | 'VERROUILLEE';
export type StatutBulletin = 'BROUILLON' | 'VALIDE' | 'PAYE';
export type StatutAvance = 'EN_COURS' | 'REMBOURSE' | 'ANNULE';

// Payroll Period
export interface PeriodePaie {
  id: string;
  mois: number;
  annee: number;
  statut: StatutPeriodePaie;
  date_calcul?: string;
  calculee_par?: string;
  date_validation?: string;
  validee_par?: string;
  date_verrouillage?: string;
  verrouillee_par?: string;
  notes?: string;
  cree_le?: string;
  // Calculated fields
  nombre_bulletins?: number;
  total_brut?: number;
  total_net?: number;
}

// Payslip
export interface BulletinPaie {
  id: string;
  periode_paie_id: string;
  employe_id: string;
  matricule: string;
  nom_complet: string;
  categorie: CategorieEmploye;
  mode_remuneration: ModeRemunerationGAS;
  salaire_base: number;
  jours_travailles: number;
  taux_journalier: number;
  primes: number;
  arrieres: number;
  salaire_brut: number;
  cnss: number;
  onem: number;
  inpp: number;
  total_retenues_sociales: number;
  salaire_imposable: number;
  ipr: number;
  retenues_disciplinaires: number;
  avances: number;
  autres_retenues: number;
  total_retenues: number;
  salaire_net: number;
  devise: DeviseClient;
  statut: StatutBulletin;
  date_paiement?: string;
  mode_paiement?: ModePaiement;
  reference_paiement?: string;
  cree_le?: string;
  modifie_le?: string;
}

// Employee Advance
export interface AvanceEmploye {
  id: string;
  employe_id: string;
  date_avance: string;
  montant_total: number;
  montant_rembourse: number;
  montant_restant: number;
  nombre_mensualites: number;
  mensualite_montant: number;
  statut: StatutAvance;
  notes?: string;
  cree_par?: string;
  cree_le?: string;
  // Joined fields
  employe_nom?: string;
  matricule?: string;
}

// Advance Repayment
export interface RemboursementAvance {
  id: string;
  avance_id: string;
  bulletin_paie_id: string;
  montant_rembourse: number;
  date_remboursement: string;
  cree_le?: string;
  // Joined fields
  mois?: number;
  annee?: number;
}


// ============================================================================
// OHADA ACCOUNTING - Comptabilité OHADA
// ============================================================================

// Salaires Impayés (Compte 422)
export type StatutSalaireImpaye = 'IMPAYE' | 'PAYE_PARTIEL' | 'PAYE_TOTAL';

export interface SalaireImpaye {
  id: string;
  bulletin_paie_id: string;
  employe_id: string;
  periode_paie_id: string;
  matricule: string;
  nom_complet: string;
  montant_net_du: number;
  montant_paye: number;
  montant_restant: number;
  devise: DeviseClient;
  date_echeance: string;
  statut: StatutSalaireImpaye;
  compte_comptable: string;
  notes?: string;
  cree_le?: string;
  modifie_le?: string;
  // Joined fields
  categorie?: string;
  mois?: string;
  annee?: number;
  periode_statut?: string;
}

// Paiements de Salaires
export interface PaiementSalaire {
  id: string;
  salaire_impaye_id: string;
  montant_paye: number;
  devise: DeviseClient;
  date_paiement: string;
  mode_paiement: ModePaiement;
  reference_paiement?: string;
  compte_tresorerie_id?: string;
  effectue_par?: string;
  notes?: string;
  cree_le?: string;
  // Joined fields
  compte_nom?: string;
}

// Charges Sociales Dues (Comptes 42x)
export type TypeChargeSociale = 'CNSS' | 'ONEM' | 'INPP' | 'IPR';
export type StatutChargeSociale = 'IMPAYE' | 'PAYE_PARTIEL' | 'PAYE_TOTAL';

export interface ChargeSocialeDue {
  id: string;
  periode_paie_id: string;
  organisme: TypeChargeSociale;
  montant_du: number;
  montant_paye: number;
  montant_restant: number;
  devise: DeviseClient;
  date_echeance: string;
  statut: StatutChargeSociale;
  compte_comptable: string;
  mois_reference: string;
  annee_reference: number;
  penalites: number;
  notes?: string;
  cree_le?: string;
  modifie_le?: string;
}

// Paiements de Charges Sociales
export interface PaiementChargeSociale {
  id: string;
  charge_sociale_id: string;
  montant_paye: number;
  devise: DeviseClient;
  date_paiement: string;
  mode_paiement: ModePaiement;
  reference_paiement?: string;
  numero_bordereau?: string;
  compte_tresorerie_id?: string;
  effectue_par?: string;
  notes?: string;
  cree_le?: string;
  // Joined fields
  compte_nom?: string;
}

// Écritures Comptables (Journal)
export type TypeOperationComptable = 'PAIE' | 'PAIEMENT_SALAIRE' | 'PAIEMENT_CHARGES' | 'DEPENSE' | 'RECETTE' | 'AUTRE';
export type StatutEcriture = 'BROUILLON' | 'VALIDE' | 'CLOTURE';

export interface EcritureComptable {
  id: string;
  date_ecriture: string;
  numero_piece?: string;
  libelle: string;
  type_operation: TypeOperationComptable;
  source_id?: string;
  montant_total: number;
  devise: DeviseClient;
  statut: StatutEcriture;
  cree_par?: string;
  valide_par?: string;
  date_validation?: string;
  cree_le?: string;
}

// Lignes d'Écritures (Débit/Crédit)
export type SensEcriture = 'DEBIT' | 'CREDIT';

export interface LigneEcriture {
  id: string;
  ecriture_id: string;
  compte_comptable: string;
  libelle_compte?: string;
  sens: SensEcriture;
  montant: number;
  devise: DeviseClient;
  tiers_id?: string;
  tiers_nom?: string;
  cree_le?: string;
  // Joined fields
  compte_libelle_complet?: string;
}

// Grand Livre Entry
export interface GrandLivreEntry {
  compte_comptable: string;
  compte_libelle: string;
  type_compte: string;
  date_ecriture: string;
  numero_piece?: string;
  ecriture_libelle: string;
  sens: SensEcriture;
  montant: number;
  devise: DeviseClient;
  tiers_nom?: string;
}

// Bilan OHADA Entry
export interface BilanEntry {
  compte_comptable: string;
  libelle: string;
  type_compte: string;
  total_debit: number;
  total_credit: number;
}

// OHADA Payroll Summary
export interface OhadaPayrollSummary {
  salaires_impayes: {
    total: number;
    impaye: number;
    paye_partiel: number;
    paye_total: number;
  };
  charges_sociales: {
    cnss: { du: number; paye: number; restant: number };
    onem: { du: number; paye: number; restant: number };
    inpp: { du: number; paye: number; restant: number };
    ipr: { du: number; paye: number; restant: number };
  };
}
