# Design Document: HR, Operations, Inventory & Disciplinary Modules

## Overview

This document outlines the technical design for implementing the HR, Operations, Inventory, and Disciplinary modules for the Go Ahead Security MIS. The design follows the existing application architecture using Electron with SQLite and React frontend.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │    HR    │ │Operations│ │Inventory │ │   Disciplinary   │   │
│  │  Module  │ │  Module  │ │  Module  │ │     Module       │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │            │            │                │              │
│       └────────────┴────────────┴────────────────┘              │
│                           │                                      │
│                    IPC Bridge (preload.js)                       │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                    Electron Main Process                         │
│                           │                                      │
│              ┌────────────┴────────────┐                        │
│              │    IPC Handlers         │                        │
│              │  (electron.cjs/main.js) │                        │
│              └────────────┬────────────┘                        │
│                           │                                      │
│              ┌────────────┴────────────┐                        │
│              │    SQLite Database      │                        │
│              │   (database.sqlite)     │                        │
│              └─────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

### Module Integration

The new modules will integrate with existing modules:
- **Finance Module**: Disciplinary deductions link to payroll
- **Dashboard**: Alerts and stats display
- **Clients/Sites**: Employee assignments reference sites

## Database Schema

### New Tables

#### 1. employees_gas (Enhanced Employee Table)
```sql
CREATE TABLE IF NOT EXISTS employees_gas (
  id TEXT PRIMARY KEY,
  matricule TEXT UNIQUE NOT NULL,
  nom_complet TEXT NOT NULL,
  date_naissance TEXT,
  genre TEXT CHECK(genre IN ('M', 'F')),
  etat_civil TEXT CHECK(etat_civil IN ('CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF')),
  numero_id_national TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  
  -- Documents (stored as file paths or base64)
  photo_url TEXT,
  document_id_url TEXT,
  document_cv_url TEXT,
  document_casier_url TEXT,
  
  -- Employment
  date_embauche TEXT NOT NULL,
  poste TEXT DEFAULT 'GARDE',
  categorie TEXT CHECK(categorie IN ('ADMINISTRATION', 'GARDE', 'ROTEUR', 'SUPERVISEUR')) DEFAULT 'GARDE',
  site_affecte_id TEXT REFERENCES sites_gas(id),
  
  -- Payroll
  mode_remuneration TEXT CHECK(mode_remuneration IN ('MENSUEL', 'JOURNALIER')) DEFAULT 'MENSUEL',
  salaire_base REAL DEFAULT 0,
  taux_journalier REAL DEFAULT 0,
  
  -- Bank
  banque_nom TEXT,
  banque_compte TEXT,
  
  -- Status
  statut TEXT CHECK(statut IN ('ACTIF', 'INACTIF', 'SUSPENDU', 'TERMINE')) DEFAULT 'ACTIF',
  date_fin_contrat TEXT,
  motif_fin TEXT,
  
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. historique_deployements (Guard Deployment History)
```sql
CREATE TABLE IF NOT EXISTS historique_deployements (
  id TEXT PRIMARY KEY,
  employe_id TEXT NOT NULL REFERENCES employees_gas(id),
  site_id TEXT NOT NULL REFERENCES sites_gas(id),
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  poste TEXT CHECK(poste IN ('JOUR', 'NUIT', 'MIXTE')) DEFAULT 'JOUR',
  motif_affectation TEXT CHECK(motif_affectation IN ('EMBAUCHE', 'TRANSFERT', 'DEMANDE_CLIENT', 'DISCIPLINAIRE', 'REORGANISATION', 'AUTRE')) DEFAULT 'EMBAUCHE',
  notes TEXT,
  est_actif INTEGER DEFAULT 1, -- 1 = current deployment, 0 = ended
  cree_par TEXT REFERENCES utilisateurs(id),
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deployements_employe ON historique_deployements(employe_id);
CREATE INDEX idx_deployements_site ON historique_deployements(site_id);
CREATE INDEX idx_deployements_actif ON historique_deployements(est_actif);
```

#### 3. conges_provisions (Leave Provisions)
```sql
CREATE TABLE IF NOT EXISTS conges_provisions (
  id TEXT PRIMARY KEY,
  employe_id TEXT NOT NULL REFERENCES employees_gas(id),
  annee INTEGER NOT NULL,
  jours_acquis REAL DEFAULT 0,
  jours_pris REAL DEFAULT 0,
  jours_restants REAL GENERATED ALWAYS AS (jours_acquis - jours_pris) STORED,
  provision_montant REAL DEFAULT 0,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employe_id, annee)
);
```

#### 4. demandes_conge (Leave Requests)
```sql
CREATE TABLE IF NOT EXISTS demandes_conge (
  id TEXT PRIMARY KEY,
  employe_id TEXT NOT NULL REFERENCES employees_gas(id),
  type_conge TEXT CHECK(type_conge IN ('ANNUEL', 'MALADIE', 'MATERNITE', 'PATERNITE', 'SANS_SOLDE')) NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  nombre_jours REAL NOT NULL,
  motif TEXT,
  statut TEXT CHECK(statut IN ('EN_ATTENTE', 'APPROUVE', 'REFUSE', 'ANNULE')) DEFAULT 'EN_ATTENTE',
  approuve_par TEXT REFERENCES utilisateurs(id),
  date_approbation TEXT,
  notes_approbation TEXT,
  roteur_remplacant_id TEXT REFERENCES employees_gas(id),
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. affectations_roteur (Rôteur Assignments)
```sql
CREATE TABLE IF NOT EXISTS affectations_roteur (
  id TEXT PRIMARY KEY,
  roteur_id TEXT NOT NULL REFERENCES employees_gas(id),
  site_id TEXT NOT NULL REFERENCES sites_gas(id),
  employe_remplace_id TEXT REFERENCES employees_gas(id),
  demande_conge_id TEXT REFERENCES demandes_conge(id),
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  poste TEXT CHECK(poste IN ('JOUR', 'NUIT')) DEFAULT 'JOUR',
  statut TEXT CHECK(statut IN ('PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE')) DEFAULT 'PLANIFIE',
  notes TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. vehicules_flotte (Fleet Vehicles)
```sql
CREATE TABLE IF NOT EXISTS vehicules_flotte (
  id TEXT PRIMARY KEY,
  type_vehicule TEXT CHECK(type_vehicule IN ('VOITURE', 'MOTO', 'CAMIONNETTE')) NOT NULL,
  marque TEXT NOT NULL,
  modele TEXT,
  immatriculation TEXT UNIQUE NOT NULL,
  numero_chassis TEXT,
  annee_fabrication INTEGER,
  couleur TEXT,
  
  -- Assignment
  employe_responsable_id TEXT REFERENCES employees_gas(id),
  date_affectation TEXT,
  
  -- Insurance
  assurance_compagnie TEXT,
  assurance_numero_police TEXT,
  assurance_date_debut TEXT,
  assurance_date_fin TEXT,
  
  -- Technical Inspection
  controle_technique_date TEXT,
  controle_technique_expiration TEXT,
  
  -- Taxes
  vignette_annee INTEGER,
  vignette_montant REAL,
  taxe_voirie_annee INTEGER,
  taxe_voirie_montant REAL,
  
  -- Status
  statut TEXT CHECK(statut IN ('ACTIF', 'EN_REPARATION', 'HORS_SERVICE')) DEFAULT 'ACTIF',
  kilometrage_actuel INTEGER DEFAULT 0,
  
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. consommation_carburant (Fuel Consumption)
```sql
CREATE TABLE IF NOT EXISTS consommation_carburant (
  id TEXT PRIMARY KEY,
  vehicule_id TEXT NOT NULL REFERENCES vehicules_flotte(id),
  date_plein TEXT NOT NULL,
  quantite_litres REAL NOT NULL,
  prix_unitaire REAL NOT NULL,
  montant_total REAL NOT NULL,
  kilometrage INTEGER,
  station TEXT,
  conducteur_id TEXT REFERENCES employees_gas(id),
  depense_id TEXT REFERENCES depenses(id),
  notes TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. equipements (Equipment Registry)
```sql
CREATE TABLE IF NOT EXISTS equipements (
  id TEXT PRIMARY KEY,
  code_equipement TEXT UNIQUE NOT NULL,
  qr_code TEXT UNIQUE,
  categorie TEXT CHECK(categorie IN ('UNIFORME', 'RADIO', 'ARME', 'PROTECTION', 'AUTRE')) NOT NULL,
  designation TEXT NOT NULL,
  description TEXT,
  numero_serie TEXT,
  date_acquisition TEXT,
  cout_acquisition REAL,
  etat TEXT CHECK(etat IN ('NEUF', 'BON', 'USAGE', 'ENDOMMAGE', 'PERDU')) DEFAULT 'NEUF',
  statut TEXT CHECK(statut IN ('DISPONIBLE', 'AFFECTE', 'EN_REPARATION', 'RETIRE')) DEFAULT 'DISPONIBLE',
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 9. affectations_equipement (Equipment Assignments)
```sql
CREATE TABLE IF NOT EXISTS affectations_equipement (
  id TEXT PRIMARY KEY,
  equipement_id TEXT NOT NULL REFERENCES equipements(id),
  employe_id TEXT NOT NULL REFERENCES employees_gas(id),
  date_affectation TEXT NOT NULL,
  signature_affectation TEXT, -- Base64 signature image
  date_retour TEXT,
  signature_retour TEXT,
  etat_retour TEXT CHECK(etat_retour IN ('BON', 'USAGE', 'ENDOMMAGE', 'PERDU')),
  notes TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. actions_disciplinaires (Disciplinary Actions)
```sql
CREATE TABLE IF NOT EXISTS actions_disciplinaires (
  id TEXT PRIMARY KEY,
  employe_id TEXT NOT NULL REFERENCES employees_gas(id),
  type_action TEXT CHECK(type_action IN ('AVERTISSEMENT_VERBAL', 'AVERTISSEMENT_ECRIT', 'SUSPENSION', 'LICENCIEMENT')) NOT NULL,
  date_incident TEXT NOT NULL,
  description_incident TEXT NOT NULL,
  lieu_incident TEXT,
  temoins TEXT,
  
  -- Financial Impact
  impact_financier INTEGER DEFAULT 0, -- 1 = yes, 0 = no
  montant_deduction REAL DEFAULT 0,
  jours_suspension INTEGER DEFAULT 0,
  
  -- Workflow
  statut TEXT CHECK(statut IN ('BROUILLON', 'EN_ATTENTE_SIGNATURE', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'REJETE')) DEFAULT 'BROUILLON',
  
  -- Signatures
  signature_employe TEXT,
  date_signature_employe TEXT,
  commentaire_employe TEXT,
  
  -- Validation
  valide_par TEXT REFERENCES utilisateurs(id),
  date_validation TEXT,
  commentaire_validation TEXT,
  
  -- Payroll Link
  periode_paie_mois INTEGER,
  periode_paie_annee INTEGER,
  applique_paie INTEGER DEFAULT 0,
  
  cree_par TEXT REFERENCES utilisateurs(id),
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 11. alertes_systeme (System Alerts)
```sql
CREATE TABLE IF NOT EXISTS alertes_systeme (
  id TEXT PRIMARY KEY,
  type_alerte TEXT CHECK(type_alerte IN ('ASSURANCE', 'CONTROLE_TECHNIQUE', 'CERTIFICATION', 'CONGE', 'AUTRE')) NOT NULL,
  reference_type TEXT NOT NULL, -- 'vehicule', 'employe', etc.
  reference_id TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  date_echeance TEXT,
  priorite TEXT CHECK(priorite IN ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE')) DEFAULT 'MOYENNE',
  statut TEXT CHECK(statut IN ('ACTIVE', 'ACQUITTEE', 'EXPIREE')) DEFAULT 'ACTIVE',
  acquittee_par TEXT REFERENCES utilisateurs(id),
  date_acquittement TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_employees_statut ON employees_gas(statut);
CREATE INDEX idx_employees_categorie ON employees_gas(categorie);
CREATE INDEX idx_demandes_conge_employe ON demandes_conge(employe_id);
CREATE INDEX idx_demandes_conge_statut ON demandes_conge(statut);
CREATE INDEX idx_vehicules_statut ON vehicules_flotte(statut);
CREATE INDEX idx_equipements_statut ON equipements(statut);
CREATE INDEX idx_actions_disciplinaires_employe ON actions_disciplinaires(employe_id);
CREATE INDEX idx_actions_disciplinaires_statut ON actions_disciplinaires(statut);
CREATE INDEX idx_alertes_statut ON alertes_systeme(statut);
CREATE INDEX idx_alertes_type ON alertes_systeme(type_alerte);
```

## Component Design

### Module Structure

```
src/components/
├── HR/
│   ├── HRModule.tsx              # Main HR module container
│   ├── EmployeesManagement.tsx   # Employee list/grid view
│   ├── EmployeeForm.tsx          # Create/edit employee
│   ├── EmployeeDetailModal.tsx   # Employee details with tabs
│   ├── DeploymentHistory.tsx     # Guard deployment timeline
│   ├── DeploymentForm.tsx        # Create/transfer deployment
│   ├── LeaveManagement.tsx       # Leave requests list
│   ├── LeaveRequestForm.tsx      # Create leave request
│   ├── LeaveCalendar.tsx         # Calendar view of leaves
│   └── LeaveProvisions.tsx       # Leave balance overview
│
├── Operations/
│   ├── OperationsModule.tsx      # Main operations container
│   ├── PlanningCalendar.tsx      # Site staffing calendar
│   ├── RoteurManagement.tsx      # Rôteur pool and assignments
│   ├── RoteurAssignmentForm.tsx  # Assign rôteur to site
│   ├── FleetManagement.tsx       # Vehicle list
│   ├── VehicleForm.tsx           # Create/edit vehicle
│   ├── VehicleDetailModal.tsx    # Vehicle details
│   └── FuelConsumptionForm.tsx   # Record fuel consumption
│
├── Inventory/
│   ├── InventoryModule.tsx       # Main inventory container
│   ├── EquipmentManagement.tsx   # Equipment list
│   ├── EquipmentForm.tsx         # Create/edit equipment
│   ├── EquipmentAssignment.tsx   # Assign equipment to employee
│   ├── EquipmentReturn.tsx       # Process equipment return
│   └── QRCodeScanner.tsx         # QR code scanning component
│
├── Disciplinary/
│   ├── DisciplinaryModule.tsx    # Main disciplinary container
│   ├── ActionsManagement.tsx     # Disciplinary actions list
│   ├── ActionForm.tsx            # Create disciplinary action
│   ├── ActionDetailModal.tsx     # Action details with workflow
│   ├── SignatureCapture.tsx      # Digital signature component
│   └── ActionValidation.tsx      # Validation workflow
│
└── Alerts/
    ├── AlertsPanel.tsx           # Alerts sidebar/panel
    ├── AlertCard.tsx             # Individual alert display
    └── AlertsManagement.tsx      # Full alerts management
```

### Key Components

#### 1. EmployeeDetailModal.tsx
Tabbed interface showing:
- **Profil**: Personal information, documents
- **Emploi**: Position, salary, site assignment
- **Déploiements**: Complete deployment history timeline
- **Congés**: Leave balance, history
- **Équipements**: Assigned equipment
- **Disciplinaire**: Disciplinary history
- **Documents**: Uploaded files

#### 2. PlanningCalendar.tsx
- Monthly/weekly calendar view
- Shows sites with staffing status (green=covered, red=gap)
- Click on gap to assign rôteur
- Drag-and-drop rôteur assignment

#### 3. VehicleDetailModal.tsx
- Vehicle information
- Compliance status with countdown badges
- Assignment history
- Fuel consumption history
- Maintenance log

#### 4. SignatureCapture.tsx
- Canvas-based signature capture
- Touch and mouse support
- Save as base64 image
- Clear/redo functionality

## IPC Handlers

### HR Handlers
```javascript
// Employee CRUD
'db-get-employees-gas'
'db-get-employee-gas'
'db-create-employee-gas'
'db-update-employee-gas'
'db-delete-employee-gas' // Soft delete

// Deployment History
'db-get-employee-deployments'      // Get deployment history for an employee
'db-get-site-deployment-history'   // Get all guards who worked at a site
'db-create-deployment'             // Create new deployment (auto-closes previous)
'db-end-deployment'                // End current deployment
'db-get-current-deployment'        // Get employee's current site assignment

// Leave Management
'db-get-leave-requests'
'db-create-leave-request'
'db-approve-leave-request'
'db-reject-leave-request'
'db-get-leave-provisions'
'db-calculate-leave-provisions'
```

### Operations Handlers
```javascript
// Rôteur Management
'db-get-roteurs'
'db-get-roteur-assignments'
'db-create-roteur-assignment'
'db-update-roteur-assignment'

// Fleet Management
'db-get-vehicles'
'db-get-vehicle'
'db-create-vehicle'
'db-update-vehicle'
'db-delete-vehicle'

// Fuel Consumption
'db-get-fuel-consumption'
'db-create-fuel-consumption'
```

### Inventory Handlers
```javascript
'db-get-equipment'
'db-get-equipment-item'
'db-create-equipment'
'db-update-equipment'
'db-assign-equipment'
'db-return-equipment'
'db-get-employee-equipment'
```

### Disciplinary Handlers
```javascript
'db-get-disciplinary-actions'
'db-get-disciplinary-action'
'db-create-disciplinary-action'
'db-update-disciplinary-action'
'db-sign-disciplinary-action'
'db-validate-disciplinary-action'
'db-reject-disciplinary-action'
'db-get-employee-disciplinary-history'
```

### Alert Handlers
```javascript
'db-get-alerts'
'db-acknowledge-alert'
'db-run-alert-check' // Manual trigger
'db-get-alert-counts'
```

## TypeScript Types

```typescript
// src/types/index.ts additions

// Deployment History Types
export type MotifAffectation = 'EMBAUCHE' | 'TRANSFERT' | 'DEMANDE_CLIENT' | 'DISCIPLINAIRE' | 'REORGANISATION' | 'AUTRE';
export type PosteDeployement = 'JOUR' | 'NUIT' | 'MIXTE';

export interface HistoriqueDeployement {
  id: string;
  employe_id: string;
  site_id: string;
  date_debut: string;
  date_fin?: string;
  poste: PosteDeployement;
  motif_affectation: MotifAffectation;
  notes?: string;
  est_actif: boolean;
  cree_par?: string;
  cree_le?: string;
  // Joined
  employe_nom?: string;
  site_nom?: string;
  client_nom?: string;
  duree_jours?: number;
}

// Employee Status
export type StatutEmployeGAS = 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'TERMINE';
export type CategorieEmployeGAS = 'ADMINISTRATION' | 'GARDE' | 'ROTEUR' | 'SUPERVISEUR';
export type ModeRemunerationGAS = 'MENSUEL' | 'JOURNALIER';
export type EtatCivil = 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';

// Leave Types
export type TypeConge = 'ANNUEL' | 'MALADIE' | 'MATERNITE' | 'PATERNITE' | 'SANS_SOLDE';
export type StatutConge = 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'ANNULE';

// Vehicle Types
export type TypeVehicule = 'VOITURE' | 'MOTO' | 'CAMIONNETTE';
export type StatutVehicule = 'ACTIF' | 'EN_REPARATION' | 'HORS_SERVICE';

// Equipment Types
export type CategorieEquipement = 'UNIFORME' | 'RADIO' | 'ARME' | 'PROTECTION' | 'AUTRE';
export type EtatEquipement = 'NEUF' | 'BON' | 'USAGE' | 'ENDOMMAGE' | 'PERDU';
export type StatutEquipement = 'DISPONIBLE' | 'AFFECTE' | 'EN_REPARATION' | 'RETIRE';

// Disciplinary Types
export type TypeActionDisciplinaire = 'AVERTISSEMENT_VERBAL' | 'AVERTISSEMENT_ECRIT' | 'SUSPENSION' | 'LICENCIEMENT';
export type StatutActionDisciplinaire = 'BROUILLON' | 'EN_ATTENTE_SIGNATURE' | 'EN_ATTENTE_VALIDATION' | 'VALIDE' | 'REJETE';

// Alert Types
export type TypeAlerte = 'ASSURANCE' | 'CONTROLE_TECHNIQUE' | 'CERTIFICATION' | 'CONGE' | 'AUTRE';
export type PrioriteAlerte = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
export type StatutAlerte = 'ACTIVE' | 'ACQUITTEE' | 'EXPIREE';

// Interfaces
export interface EmployeeGASFull {
  id: string;
  matricule: string;
  nom_complet: string;
  date_naissance?: string;
  genre?: 'M' | 'F';
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
  poste: string;
  categorie: CategorieEmployeGAS;
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
  // Joined
  site_nom?: string;
}

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
  // Joined
  employe_nom?: string;
  roteur_nom?: string;
}

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
  // Joined
  employe_nom?: string;
}

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
  // Joined
  employe_affecte_id?: string;
  employe_affecte_nom?: string;
}

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
  signature_employe?: string;
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
  // Joined
  employe_nom?: string;
  validateur_nom?: string;
}

export interface AlerteSysteme {
  id: string;
  type_alerte: TypeAlerte;
  reference_type: string;
  reference_id: string;
  titre: string;
  message: string;
  date_echeance?: string;
  priorite: PrioriteAlerte;
  statut: StatutAlerte;
  acquittee_par?: string;
  date_acquittement?: string;
  cree_le?: string;
}
```

## Automated Alert System

### Alert Check Logic (runs on app startup and can be triggered manually)

```javascript
async function runAlertCheck(db) {
  const today = new Date().toISOString().split('T')[0];
  const j30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const j15 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Check insurance expiration (J-30)
  const insuranceExpiring = db.prepare(`
    SELECT * FROM vehicules_flotte 
    WHERE assurance_date_fin <= ? AND assurance_date_fin >= ? AND statut = 'ACTIF'
  `).all(j30, today);
  
  for (const vehicle of insuranceExpiring) {
    createAlertIfNotExists(db, {
      type_alerte: 'ASSURANCE',
      reference_type: 'vehicule',
      reference_id: vehicle.id,
      titre: `Assurance expire bientôt - ${vehicle.immatriculation}`,
      message: `L'assurance du véhicule ${vehicle.marque} ${vehicle.immatriculation} expire le ${vehicle.assurance_date_fin}`,
      date_echeance: vehicle.assurance_date_fin,
      priorite: 'HAUTE'
    });
  }
  
  // Check technical inspection (J-15)
  const techExpiring = db.prepare(`
    SELECT * FROM vehicules_flotte 
    WHERE controle_technique_expiration <= ? AND controle_technique_expiration >= ? AND statut = 'ACTIF'
  `).all(j15, today);
  
  for (const vehicle of techExpiring) {
    createAlertIfNotExists(db, {
      type_alerte: 'CONTROLE_TECHNIQUE',
      reference_type: 'vehicule',
      reference_id: vehicle.id,
      titre: `Contrôle technique expire bientôt - ${vehicle.immatriculation}`,
      message: `Le contrôle technique du véhicule ${vehicle.marque} ${vehicle.immatriculation} expire le ${vehicle.controle_technique_expiration}`,
      date_echeance: vehicle.controle_technique_expiration,
      priorite: 'HAUTE'
    });
  }
}
```

## Navigation Integration

Update `App.tsx` to include new modules in navigation:

```typescript
const modules = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'hr', label: 'Ressources Humaines', icon: Users },
  { id: 'operations', label: 'Opérations', icon: Calendar },
  { id: 'inventory', label: 'Inventaire', icon: Package },
  { id: 'disciplinary', label: 'Disciplinaire', icon: AlertTriangle },
];
```

## Security Considerations

1. **Role-Based Access**: 
   - Only SUPERVISOR+ can create disciplinary actions
   - Only OPS_MANAGER+ can validate disciplinary actions
   - Only HR/ADMIN can modify employee salaries

2. **Audit Trail**: All critical actions logged with user ID and timestamp

3. **Document Storage**: Sensitive documents stored with restricted access

## Performance Considerations

1. **Pagination**: All list views paginated (20 items default)
2. **Lazy Loading**: Employee documents loaded on demand
3. **Indexed Queries**: Key columns indexed for fast filtering
4. **Alert Caching**: Alert counts cached and refreshed periodically
