# Module Paie - Design Technique

## Architecture

### Composants React
```
src/components/Payroll/
├── PayrollModule.tsx          # Container principal avec tabs
├── PayrollManagement.tsx      # Gestion des périodes de paie
├── PayrollCalculation.tsx     # Écran de calcul
├── PayslipDetail.tsx          # Détail bulletin de paie
├── PayslipPrintTemplate.tsx   # Template PDF bulletin
├── AdvancesManagement.tsx     # Gestion des avances
├── AdvanceForm.tsx            # Formulaire nouvelle avance
└── PayrollExports.tsx         # Exports et déclarations
```

### Backend Handlers (electron.cjs)
```javascript
// Périodes de paie
'db-get-payroll-periods'
'db-create-payroll-period'
'db-update-payroll-period-status'
'db-lock-payroll-period'

// Calcul de paie
'db-calculate-payroll'
'db-get-payslips'
'db-get-payslip-detail'
'db-update-payslip'
'db-validate-payslips'

// Avances
'db-get-employee-advances'
'db-create-advance'
'db-get-advance-repayments'

// Exports
'db-export-payroll-excel'
'db-export-bank-transfer'
'db-export-cnss-declaration'
'db-export-ipr-report'
```

## Schéma Base de Données

```sql
-- Périodes de paie
CREATE TABLE IF NOT EXISTS periodes_paie (
  id TEXT PRIMARY KEY,
  mois INTEGER NOT NULL CHECK(mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'BROUILLON' CHECK(statut IN ('BROUILLON', 'CALCULEE', 'VALIDEE', 'VERROUILLEE')),
  date_calcul TEXT,
  calculee_par TEXT,
  date_validation TEXT,
  validee_par TEXT,
  date_verrouillage TEXT,
  verrouillee_par TEXT,
  notes TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mois, annee)
);

-- Bulletins de paie
CREATE TABLE IF NOT EXISTS bulletins_paie (
  id TEXT PRIMARY KEY,
  periode_paie_id TEXT NOT NULL,
  employe_id TEXT NOT NULL,
  matricule TEXT,
  nom_complet TEXT,
  categorie TEXT,
  mode_remuneration TEXT,
  
  -- Calculs salaire
  salaire_base REAL NOT NULL DEFAULT 0,
  jours_travailles INTEGER DEFAULT 0,
  taux_journalier REAL DEFAULT 0,
  primes REAL DEFAULT 0,
  salaire_brut REAL NOT NULL DEFAULT 0,
  
  -- Retenues sociales
  cnss REAL DEFAULT 0,
  onem REAL DEFAULT 0,
  inpp REAL DEFAULT 0,
  total_retenues_sociales REAL DEFAULT 0,
  
  -- Impôts
  salaire_imposable REAL DEFAULT 0,
  ipr REAL DEFAULT 0,
  
  -- Autres retenues
  retenues_disciplinaires REAL DEFAULT 0,
  avances REAL DEFAULT 0,
  autres_retenues REAL DEFAULT 0,
  total_retenues REAL DEFAULT 0,
  
  -- Net à payer
  salaire_net REAL NOT NULL DEFAULT 0,
  devise TEXT DEFAULT 'USD' CHECK(devise IN ('USD', 'CDF')),
  
  -- Statut paiement
  statut TEXT DEFAULT 'BROUILLON' CHECK(statut IN ('BROUILLON', 'VALIDE', 'PAYE')),
  date_paiement TEXT,
  mode_paiement TEXT,
  reference_paiement TEXT,
  
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  modifie_le TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (periode_paie_id) REFERENCES periodes_paie(id) ON DELETE CASCADE,
  FOREIGN KEY (employe_id) REFERENCES employees_gas(id) ON DELETE CASCADE,
  UNIQUE(periode_paie_id, employe_id)
);

-- Avances employés
CREATE TABLE IF NOT EXISTS avances_employes (
  id TEXT PRIMARY KEY,
  employe_id TEXT NOT NULL,
  date_avance TEXT NOT NULL,
  montant_total REAL NOT NULL,
  montant_rembourse REAL DEFAULT 0,
  montant_restant REAL NOT NULL,
  nombre_mensualites INTEGER NOT NULL,
  mensualite_montant REAL NOT NULL,
  statut TEXT DEFAULT 'EN_COURS' CHECK(statut IN ('EN_COURS', 'REMBOURSE', 'ANNULE')),
  notes TEXT,
  cree_par TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employe_id) REFERENCES employees_gas(id) ON DELETE CASCADE
);

-- Remboursements avances
CREATE TABLE IF NOT EXISTS remboursements_avances (
  id TEXT PRIMARY KEY,
  avance_id TEXT NOT NULL,
  bulletin_paie_id TEXT NOT NULL,
  montant_rembourse REAL NOT NULL,
  date_remboursement TEXT NOT NULL,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (avance_id) REFERENCES avances_employes(id) ON DELETE CASCADE,
  FOREIGN KEY (bulletin_paie_id) REFERENCES bulletins_paie(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_bulletins_periode ON bulletins_paie(periode_paie_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_employe ON bulletins_paie(employe_id);
CREATE INDEX IF NOT EXISTS idx_avances_employe ON avances_employes(employe_id);
CREATE INDEX IF NOT EXISTS idx_remboursements_avance ON remboursements_avances(avance_id);
```

## Algorithme de Calcul IPR

```javascript
function calculateIPR(salaireImposable) {
  // Barème IPR RDC (en CDF)
  const tranches = [
    { min: 0, max: 72000, taux: 0 },
    { min: 72001, max: 144000, taux: 0.03 },
    { min: 144001, max: 288000, taux: 0.05 },
    { min: 288001, max: 576000, taux: 0.10 },
    { min: 576001, max: 1152000, taux: 0.15 },
    { min: 1152001, max: 2304000, taux: 0.20 },
    { min: 2304001, max: 4608000, taux: 0.25 },
    { min: 4608001, max: 9216000, taux: 0.30 },
    { min: 9216001, max: 18432000, taux: 0.35 },
    { min: 18432001, max: 36864000, taux: 0.40 },
    { min: 36864001, max: Infinity, taux: 0.45 }
  ];
  
  let ipr = 0;
  let reste = salaireImposable;
  
  for (const tranche of tranches) {
    if (reste <= 0) break;
    
    const montantTranche = Math.min(reste, tranche.max - tranche.min + 1);
    ipr += montantTranche * tranche.taux;
    reste -= montantTranche;
  }
  
  return Math.round(ipr * 100) / 100; // 2 décimales
}
```

## Algorithme de Calcul Complet

```javascript
async function calculatePayroll(periodeId, mois, annee) {
  // 1. Récupérer tous les employés actifs
  const employees = db.prepare(`
    SELECT * FROM employees_gas 
    WHERE statut = 'ACTIF'
  `).all();
  
  const bulletins = [];
  
  for (const emp of employees) {
    // 2. Calculer salaire brut
    let salaireBase = 0;
    let joursTravailles = 0;
    
    if (emp.mode_remuneration === 'MENSUEL') {
      salaireBase = emp.salaire_base;
    } else {
      // Journalier: compter jours travaillés (30 par défaut)
      joursTravailles = 30; // TODO: intégrer avec planning
      salaireBase = joursTravailles * emp.taux_journalier;
    }
    
    const primes = 0; // TODO: système de primes
    const salaireBrut = salaireBase + primes;
    
    // 3. Calculer retenues sociales
    const cnss = Math.round(salaireBrut * 0.05 * 100) / 100;
    const onem = Math.round(salaireBrut * 0.015 * 100) / 100;
    const inpp = Math.round(salaireBrut * 0.005 * 100) / 100;
    const totalRetenuesSociales = cnss + onem + inpp;
    
    // 4. Calculer salaire imposable
    const salaireImposable = salaireBrut - totalRetenuesSociales;
    
    // 5. Calculer IPR
    const ipr = calculateIPR(salaireImposable);
    
    // 6. Récupérer retenues disciplinaires
    const disciplinaires = db.prepare(`
      SELECT SUM(montant_deduction) as total
      FROM actions_disciplinaires
      WHERE employe_id = ?
      AND periode_paie_mois = ?
      AND periode_paie_annee = ?
      AND applique_paie = 0
      AND statut = 'VALIDE'
    `).get(emp.id, mois, annee);
    
    const retenuesDisciplinaires = disciplinaires?.total || 0;
    
    // 7. Récupérer avances à rembourser
    const avances = db.prepare(`
      SELECT id, mensualite_montant
      FROM avances_employes
      WHERE employe_id = ?
      AND statut = 'EN_COURS'
      AND montant_restant > 0
    `).all(emp.id);
    
    let totalAvances = 0;
    for (const avance of avances) {
      totalAvances += Math.min(avance.mensualite_montant, avance.montant_restant);
    }
    
    // 8. Calculer total retenues et net
    const totalRetenues = totalRetenuesSociales + ipr + retenuesDisciplinaires + totalAvances;
    const salaireNet = salaireBrut - totalRetenues;
    
    // 9. Créer bulletin
    bulletins.push({
      id: generateUUID(),
      periode_paie_id: periodeId,
      employe_id: emp.id,
      matricule: emp.matricule,
      nom_complet: emp.nom_complet,
      categorie: emp.categorie,
      mode_remuneration: emp.mode_remuneration,
      salaire_base: salaireBase,
      jours_travailles: joursTravailles,
      taux_journalier: emp.taux_journalier,
      primes,
      salaire_brut: salaireBrut,
      cnss,
      onem,
      inpp,
      total_retenues_sociales: totalRetenuesSociales,
      salaire_imposable: salaireImposable,
      ipr,
      retenues_disciplinaires: retenuesDisciplinaires,
      avances: totalAvances,
      total_retenues: totalRetenues,
      salaire_net: salaireNet,
      devise: 'USD',
      statut: 'BROUILLON'
    });
  }
  
  return bulletins;
}
```

## Types TypeScript

```typescript
export type StatutPeriodePaie = 'BROUILLON' | 'CALCULEE' | 'VALIDEE' | 'VERROUILLEE';
export type StatutBulletin = 'BROUILLON' | 'VALIDE' | 'PAYE';
export type StatutAvance = 'EN_COURS' | 'REMBOURSE' | 'ANNULE';

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
  // Calculated
  nombre_bulletins?: number;
  total_brut?: number;
  total_net?: number;
}

export interface BulletinPaie {
  id: string;
  periode_paie_id: string;
  employe_id: string;
  matricule: string;
  nom_complet: string;
  categorie: CategorieEmployeGAS;
  mode_remuneration: ModeRemunerationGAS;
  salaire_base: number;
  jours_travailles: number;
  taux_journalier: number;
  primes: number;
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
  // Joined
  employe_nom?: string;
  matricule?: string;
}

export interface RemboursementAvance {
  id: string;
  avance_id: string;
  bulletin_paie_id: string;
  montant_rembourse: number;
  date_remboursement: string;
  cree_le?: string;
}
```

## Flux de Données

```
User Action → React Component → IPC Call → Electron Handler → SQLite → Response → Component Update
```

## Sécurité & Validation

1. **Validation des montants**: Tous les calculs arrondis à 2 décimales
2. **Vérification période**: Impossible de calculer une période déjà verrouillée
3. **Audit trail**: Toutes les modifications enregistrées
4. **Permissions**: Vérification des rôles utilisateur
5. **Transactions**: Utilisation de transactions SQLite pour cohérence

## Performance

1. **Calcul batch**: Tous les employés calculés en une transaction
2. **Index database**: Index sur clés étrangères et dates
3. **Cache**: Résultats mis en cache côté frontend
4. **Export asynchrone**: Génération PDF/Excel en background
