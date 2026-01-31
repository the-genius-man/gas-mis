# OHADA Compliance Analysis - Debt & Loan Tracking System

## ❌ **Current Implementation Issues**

### **Missing OHADA Compliance**
The current debt/loan tracking implementation does **NOT** follow OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires) accounting principles, which are mandatory for businesses in OHADA member countries including DRC.

### **Key Missing Elements**

#### 1. **OHADA Chart of Accounts Integration**
- **Missing**: Proper OHADA account codes for debts and loans
- **Required**: Integration with existing `plan_comptable` table
- **Impact**: Non-compliance with OHADA accounting standards

#### 2. **Double-Entry Accounting**
- **Missing**: Automatic generation of accounting entries (écritures comptables)
- **Required**: Every debt/loan transaction must generate proper debit/credit entries
- **Impact**: Incomplete accounting records

#### 3. **OHADA Account Classifications**
- **Missing**: Proper classification using OHADA account codes
- **Required**: Specific account codes for different types of debts and loans

## 🏦 **OHADA Account Codes for Debts & Loans**

### **Debt Accounts (Passif - Liabilities)**
- **161**: Emprunts et dettes auprès des établissements de crédit
- **162**: Emprunts et dettes financières diverses
- **163**: Avances reçues de l'État
- **164**: Avances reçues et comptes courants bloqués
- **165**: Dépôts et cautionnements reçus
- **166**: Intérêts courus sur emprunts
- **167**: Emprunts et dettes assortis de conditions particulières
- **168**: Autres emprunts et dettes financières

### **Loan Accounts (Actif - Assets)**
- **261**: Prêts au personnel
- **262**: Prêts aux associés
- **263**: Prêts aux sociétés liées
- **264**: Prêts et créances sur l'État
- **265**: Prêts et créances sur les collectivités publiques
- **266**: Dépôts et cautionnements versés
- **267**: Créances rattachées aux participations
- **268**: Autres prêts et créances financières

### **Interest Accounts**
- **661**: Charges d'intérêts (Interest expenses)
- **771**: Produits d'intérêts (Interest income)

## 🔧 **Required OHADA-Compliant Implementation**

### **1. Enhanced Database Schema**

#### **OHADA-Compliant Debts/Loans Table**
```sql
CREATE TABLE dettes_prets_ohada (
  id TEXT PRIMARY KEY,
  type TEXT CHECK(type IN ('DETTE', 'PRET')) NOT NULL,
  reference_number TEXT UNIQUE NOT NULL,
  
  -- OHADA Compliance Fields
  compte_comptable_principal TEXT NOT NULL, -- Main OHADA account code
  compte_comptable_interet TEXT, -- Interest account code
  sous_compte TEXT, -- Sub-account for detailed tracking
  
  -- Creditor/Debtor Information
  tiers_nom TEXT NOT NULL,
  tiers_type TEXT CHECK(tiers_type IN ('PERSONNE', 'ENTREPRISE', 'BANQUE', 'EMPLOYE', 'ETAT', 'COLLECTIVITE')) NOT NULL,
  tiers_numero_compte TEXT, -- Account number in chart of accounts
  
  -- Financial Information
  montant_principal DECIMAL(15,2) NOT NULL,
  solde_actuel DECIMAL(15,2) NOT NULL,
  taux_interet DECIMAL(5,2),
  type_interet TEXT CHECK(type_interet IN ('SIMPLE', 'COMPOSE', 'FIXE')),
  
  -- Dates
  date_debut DATE NOT NULL,
  date_echeance DATE,
  
  -- Status and Classification
  statut TEXT CHECK(statut IN ('ACTIF', 'REMBOURSE', 'EN_RETARD', 'PROVISIONNE', 'ANNULE')) DEFAULT 'ACTIF',
  frequence_paiement TEXT CHECK(frequence_paiement IN ('MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL', 'UNIQUE')),
  
  -- OHADA Specific Fields
  nature_garantie TEXT, -- Type of guarantee
  valeur_garantie DECIMAL(15,2), -- Guarantee value
  provision_constituee DECIMAL(15,2) DEFAULT 0, -- Provision for bad debts
  
  -- Description and Documentation
  objet TEXT NOT NULL, -- Purpose of debt/loan
  conditions_particulieres TEXT,
  pieces_justificatives TEXT, -- Supporting documents
  
  -- Audit Trail
  devise TEXT DEFAULT 'CDF',
  cree_par TEXT NOT NULL,
  cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
  modifie_le DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (compte_comptable_principal) REFERENCES plan_comptable(numero_compte),
  FOREIGN KEY (compte_comptable_interet) REFERENCES plan_comptable(numero_compte)
);
```

#### **OHADA-Compliant Payments Table**
```sql
CREATE TABLE paiements_dettes_prets_ohada (
  id TEXT PRIMARY KEY,
  dette_pret_id TEXT NOT NULL,
  
  -- Payment Information
  date_paiement DATE NOT NULL,
  montant_paye DECIMAL(15,2) NOT NULL,
  montant_principal DECIMAL(15,2) NOT NULL,
  montant_interet DECIMAL(15,2) NOT NULL,
  
  -- Payment Method and Reference
  mode_paiement TEXT CHECK(mode_paiement IN ('ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY', 'COMPENSATION')) NOT NULL,
  reference_paiement TEXT NOT NULL,
  numero_piece TEXT, -- Document number
  
  -- OHADA Accounting Integration
  ecriture_comptable_id TEXT, -- Link to accounting entry
  compte_tresorerie_id TEXT NOT NULL, -- Treasury account used
  
  -- Additional Information
  penalites DECIMAL(15,2) DEFAULT 0, -- Late payment penalties
  frais_bancaires DECIMAL(15,2) DEFAULT 0, -- Bank charges
  notes TEXT,
  
  -- Audit Trail
  cree_par TEXT NOT NULL,
  cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (dette_pret_id) REFERENCES dettes_prets_ohada(id),
  FOREIGN KEY (ecriture_comptable_id) REFERENCES ecritures_comptables(id),
  FOREIGN KEY (compte_tresorerie_id) REFERENCES comptes_tresorerie(id)
);
```

### **2. OHADA Account Code Mapping**

#### **Debt Classification by Type**
```javascript
const OHADA_DEBT_ACCOUNTS = {
  'BANQUE': {
    'COURT_TERME': '161', // Emprunts bancaires à court terme
    'LONG_TERME': '161',  // Emprunts bancaires à long terme
    'INTERET': '661'      // Charges d'intérêts
  },
  'ENTREPRISE': {
    'FOURNISSEUR': '401', // Fournisseurs
    'AUTRE': '162',       // Emprunts et dettes financières diverses
    'INTERET': '661'
  },
  'EMPLOYE': {
    'AVANCE_RECUE': '164', // Avances reçues du personnel
    'INTERET': '661'
  },
  'ETAT': {
    'AVANCE': '163',      // Avances reçues de l'État
    'INTERET': '661'
  }
};

const OHADA_LOAN_ACCOUNTS = {
  'EMPLOYE': {
    'AVANCE_SALAIRE': '261', // Prêts au personnel
    'INTERET': '771'         // Produits d'intérêts
  },
  'ENTREPRISE': {
    'PRET_COMMERCIAL': '268', // Autres prêts et créances financières
    'INTERET': '771'
  },
  'ETAT': {
    'CREANCE': '264',        // Prêts et créances sur l'État
    'INTERET': '771'
  }
};
```

### **3. Automatic Accounting Entries Generation**

#### **Debt Creation Entry**
```javascript
// When creating a debt (money we owe)
const createDebtAccountingEntry = async (debt) => {
  const entries = [
    {
      compte_comptable: getAssetAccount(debt.objet), // What we received
      sens: 'DEBIT',
      montant: debt.montant_principal,
      libelle: `Réception ${debt.objet}`,
      tiers_nom: debt.tiers_nom
    },
    {
      compte_comptable: debt.compte_comptable_principal, // Debt account
      sens: 'CREDIT',
      montant: debt.montant_principal,
      libelle: `Dette envers ${debt.tiers_nom}`,
      tiers_nom: debt.tiers_nom
    }
  ];
  
  await createEcritureComptable({
    date_ecriture: debt.date_debut,
    numero_piece: debt.reference_number,
    libelle: `Création dette - ${debt.tiers_nom}`,
    type_operation: 'CREATION_DETTE',
    source_id: debt.id,
    montant_total: debt.montant_principal,
    lignes: entries
  });
};
```

#### **Loan Creation Entry**
```javascript
// When creating a loan (money owed to us)
const createLoanAccountingEntry = async (loan) => {
  const entries = [
    {
      compte_comptable: loan.compte_comptable_principal, // Loan receivable
      sens: 'DEBIT',
      montant: loan.montant_principal,
      libelle: `Prêt accordé à ${loan.tiers_nom}`,
      tiers_nom: loan.tiers_nom
    },
    {
      compte_comptable: getTreasuryAccount(loan.compte_tresorerie_id), // Cash/Bank
      sens: 'CREDIT',
      montant: loan.montant_principal,
      libelle: `Décaissement prêt ${loan.tiers_nom}`,
      tiers_nom: loan.tiers_nom
    }
  ];
  
  await createEcritureComptable({
    date_ecriture: loan.date_debut,
    numero_piece: loan.reference_number,
    libelle: `Octroi prêt - ${loan.tiers_nom}`,
    type_operation: 'CREATION_PRET',
    source_id: loan.id,
    montant_total: loan.montant_principal,
    lignes: entries
  });
};
```

#### **Payment Entry (Debt Repayment)**
```javascript
// When paying a debt
const createDebtPaymentEntry = async (payment, debt) => {
  const entries = [
    {
      compte_comptable: debt.compte_comptable_principal, // Debt account
      sens: 'DEBIT',
      montant: payment.montant_principal,
      libelle: `Remboursement dette ${debt.tiers_nom}`,
      tiers_nom: debt.tiers_nom
    },
    {
      compte_comptable: getTreasuryAccount(payment.compte_tresorerie_id), // Cash/Bank
      sens: 'CREDIT',
      montant: payment.montant_principal,
      libelle: `Paiement à ${debt.tiers_nom}`,
      tiers_nom: debt.tiers_nom
    }
  ];
  
  // Add interest entry if applicable
  if (payment.montant_interet > 0) {
    entries.push({
      compte_comptable: debt.compte_comptable_interet || '661',
      sens: 'DEBIT',
      montant: payment.montant_interet,
      libelle: `Intérêts sur dette ${debt.tiers_nom}`,
      tiers_nom: debt.tiers_nom
    });
  }
  
  await createEcritureComptable({
    date_ecriture: payment.date_paiement,
    numero_piece: payment.reference_paiement,
    libelle: `Paiement dette - ${debt.tiers_nom}`,
    type_operation: 'PAIEMENT_DETTE',
    source_id: payment.id,
    montant_total: payment.montant_paye,
    lignes: entries
  });
};
```

### **4. OHADA Reporting Requirements**

#### **Balance Sheet Integration**
```javascript
// Debts appear in Passif (Liabilities)
const getOhadaDebtBalances = async (date_fin) => {
  return await db.prepare(`
    SELECT 
      d.compte_comptable_principal,
      pc.libelle_compte,
      SUM(d.solde_actuel) as solde_total,
      COUNT(*) as nombre_dettes
    FROM dettes_prets_ohada d
    JOIN plan_comptable pc ON d.compte_comptable_principal = pc.numero_compte
    WHERE d.type = 'DETTE' 
      AND d.statut = 'ACTIF'
      AND d.date_debut <= ?
    GROUP BY d.compte_comptable_principal, pc.libelle_compte
    ORDER BY d.compte_comptable_principal
  `).all(date_fin);
};

// Loans appear in Actif (Assets)
const getOhadaLoanBalances = async (date_fin) => {
  return await db.prepare(`
    SELECT 
      l.compte_comptable_principal,
      pc.libelle_compte,
      SUM(l.solde_actuel) as solde_total,
      COUNT(*) as nombre_prets
    FROM dettes_prets_ohada l
    JOIN plan_comptable pc ON l.compte_comptable_principal = pc.numero_compte
    WHERE l.type = 'PRET' 
      AND l.statut = 'ACTIF'
      AND l.date_debut <= ?
    GROUP BY l.compte_comptable_principal, pc.libelle_compte
    ORDER BY l.compte_comptable_principal
  `).all(date_fin);
};
```

#### **Profit & Loss Integration**
```javascript
// Interest expenses and income
const getOhadaInterestMovements = async (date_debut, date_fin) => {
  return await db.prepare(`
    SELECT 
      CASE 
        WHEN d.type = 'DETTE' THEN d.compte_comptable_interet
        WHEN d.type = 'PRET' THEN d.compte_comptable_interet
      END as compte_interet,
      pc.libelle_compte,
      d.type,
      SUM(p.montant_interet) as montant_total
    FROM paiements_dettes_prets_ohada p
    JOIN dettes_prets_ohada d ON p.dette_pret_id = d.id
    JOIN plan_comptable pc ON d.compte_comptable_interet = pc.numero_compte
    WHERE p.date_paiement BETWEEN ? AND ?
      AND p.montant_interet > 0
    GROUP BY d.compte_comptable_interet, pc.libelle_compte, d.type
    ORDER BY d.compte_comptable_interet
  `).all(date_debut, date_fin);
};
```

## 🚨 **Immediate Action Required**

### **1. Replace Current Implementation**
The current debt/loan tracking system must be replaced with an OHADA-compliant version that:
- Uses proper OHADA account codes
- Generates automatic accounting entries
- Integrates with existing `plan_comptable`
- Follows double-entry bookkeeping principles

### **2. Database Migration**
- Create new OHADA-compliant tables
- Migrate existing data (if any) to new structure
- Update all related API endpoints

### **3. Integration with Existing OHADA System**
- Connect with existing `ecritures_comptables` system
- Use existing `plan_comptable` for account validation
- Integrate with treasury management system

## ✅ **OHADA Compliance Checklist**

### **Required for Compliance**
- [ ] Use OHADA chart of accounts (plan_comptable)
- [ ] Generate automatic double-entry accounting entries
- [ ] Proper classification of debts and loans by OHADA account codes
- [ ] Integration with existing accounting journal (ecritures_comptables)
- [ ] Balance sheet reporting (Actif/Passif)
- [ ] Profit & loss reporting (interest income/expenses)
- [ ] Audit trail with proper documentation
- [ ] Provision for bad debts (créances douteuses)

### **Best Practices**
- [ ] Monthly reconciliation with accounting records
- [ ] Aging analysis for overdue items
- [ ] Interest calculation according to OHADA standards
- [ ] Proper documentation and supporting documents
- [ ] Segregation of duties for approval and recording

## 📋 **Next Steps**

1. **Immediate**: Create OHADA-compliant database schema
2. **Phase 1**: Implement OHADA account code integration
3. **Phase 2**: Add automatic accounting entry generation
4. **Phase 3**: Create OHADA-compliant reporting
5. **Phase 4**: User interface with OHADA account selection
6. **Phase 5**: Integration testing with existing accounting system

**Status: ❌ CURRENT IMPLEMENTATION NOT OHADA COMPLIANT - REQUIRES COMPLETE REDESIGN**