# 💰 Salary Payment & Treasury Integration Status

## Current Implementation

### ✅ What's Working

When a salary is paid using the `db-payer-salaire` handler (in `public/electron.cjs`):

1. **Payment Record Created**
   - Inserts into `paiements_salaires` table
   - Tracks: amount, date, payment method, reference, treasury account

2. **Unpaid Salary Updated**
   - Updates `salaires_impayes` record
   - Calculates new `montant_paye`, `montant_restant`, `statut`
   - Status changes: IMPAYE → PAYE_PARTIEL → PAYE_TOTAL

3. **Payslip Status Updated**
   - When fully paid, updates `bulletins_paie.statut` to 'PAYE'
   - Records payment date, method, and reference

4. **Treasury Balance Updated** ✅
   - Deducts payment amount from `comptes_tresorerie.solde_actuel`
   - Calculation: `solde_apres = solde_avant - montant_paye`

5. **Treasury Movement Recorded** ✅
   - Inserts into `mouvements_tresorerie` table
   - Type: 'SORTIE' (outgoing)
   - Source type: 'PAIEMENT_SALAIRE'
   - Records: solde_avant, solde_apres
   - Links to payment via `source_id`

### ❌ What's Missing

**Expense Record NOT Created**
- Salary payments do NOT create records in the `depenses` table
- This means:
  - ❌ Won't appear in expense reports
  - ❌ Won't be categorized under "Salaires et appointements" (code 661)
  - ❌ Won't be included in expense analytics
  - ✅ BUT treasury balance IS correctly updated

## Code Location

### File: `public/electron.cjs` (Production)

**Handler:** `db-payer-salaire` (lines ~1900-1990)

```javascript
ipcMain.handle('db-payer-salaire', async (event, paiement) => {
  // 1. Validate unpaid salary exists
  const salaireImpaye = db.prepare('SELECT * FROM salaires_impayes WHERE id = ?')
    .get(paiement.salaire_impaye_id);
  
  // 2. Insert payment record
  db.prepare(`INSERT INTO paiements_salaires (...) VALUES (...)`)
    .run(...);
  
  // 3. Update unpaid salary
  db.prepare(`UPDATE salaires_impayes SET montant_paye = ?, ...`)
    .run(...);
  
  // 4. Update payslip status if fully paid
  if (nouveauStatut === 'PAYE_TOTAL') {
    db.prepare(`UPDATE bulletins_paie SET statut = 'PAYE', ...`)
      .run(...);
  }
  
  // 5. Update treasury balance ✅
  if (paiement.compte_tresorerie_id) {
    const soldeApres = soldeAvant - paiement.montant_paye;
    db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
      .run(soldeApres, paiement.compte_tresorerie_id);
    
    // 6. Record treasury movement ✅
    db.prepare(`INSERT INTO mouvements_tresorerie (...) VALUES (...)`)
      .run(...);
  }
  
  // ❌ MISSING: Create expense record
  // Should insert into depenses table here
});
```

### File: `electron/main.js` (Development)

**Status:** Handler NOT implemented yet
- Need to add the same handler to development version

## Impact Analysis

### What Works:
✅ **Treasury Balance** - Correctly reflects salary payments
✅ **Cash Flow Tracking** - Movements recorded in `mouvements_tresorerie`
✅ **Payment History** - Full audit trail in `paiements_salaires`
✅ **Payslip Status** - Correctly updated to PAYE

### What Doesn't Work:
❌ **Expense Reports** - Salary payments not included
❌ **Expense Categories** - Can't see salary expenses by category
❌ **Budget Tracking** - Can't track salary budget vs actual
❌ **Accounting Reports** - Incomplete expense data

## Recommendation

### Option 1: Add Expense Record Creation (Recommended)

Modify the `db-payer-salaire` handler to also create an expense record:

```javascript
// After updating treasury balance, add:

// Create expense record for accounting
const depenseId = crypto.randomUUID();
db.prepare(`
  INSERT INTO depenses (
    id, categorie_id, compte_tresorerie_id, date_depense, montant, devise,
    beneficiaire, description, reference_piece, mode_paiement, statut
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALIDEE')
`).run(
  depenseId,
  'cat-salaires',  // Category: Salaires et appointements (code 661)
  paiement.compte_tresorerie_id,
  paiement.date_paiement,
  paiement.montant_paye,
  paiement.devise || 'USD',
  salaireImpaye.nom_complet,  // Employee name
  `Paiement salaire - ${salaireImpaye.nom_complet} - ${salaireImpaye.matricule}`,
  paiement.reference_paiement,
  paiement.mode_paiement,
);
```

**Benefits:**
- ✅ Complete accounting integration
- ✅ Salary expenses appear in reports
- ✅ Better budget tracking
- ✅ Consistent with other expense flows

**Considerations:**
- Need to ensure `cat-salaires` category exists
- Need to handle partial payments (multiple expense records)
- Need to link expense to payment for audit trail

### Option 2: Keep Separate (Current Approach)

Keep salary payments separate from general expenses:

**Benefits:**
- ✅ Cleaner separation of concerns
- ✅ Dedicated salary payment tracking
- ✅ Simpler payment flow

**Drawbacks:**
- ❌ Incomplete expense reporting
- ❌ Need separate salary expense reports
- ❌ More complex accounting reconciliation

## Database Schema

### Current Tables:

```
paiements_salaires
├── id
├── salaire_impaye_id (FK)
├── montant_paye
├── devise
├── date_paiement
├── mode_paiement
├── reference_paiement
├── compte_tresorerie_id (FK)
├── effectue_par
└── notes

mouvements_tresorerie
├── id
├── compte_tresorerie_id (FK)
├── date_mouvement
├── type_mouvement (SORTIE)
├── montant
├── devise
├── libelle
├── type_source (PAIEMENT_SALAIRE)
├── source_id (paiement_id)
├── solde_avant
└── solde_apres

depenses (NOT USED for salaries)
├── id
├── categorie_id (FK) → should be 'cat-salaires'
├── compte_tresorerie_id (FK)
├── date_depense
├── montant
├── devise
├── beneficiaire
├── description
├── reference_piece
├── mode_paiement
└── statut
```

## Testing Scenario

### Current Behavior:

1. **Pay Salary:**
   - Employee: Amani Bisimwa
   - Amount: $48.00
   - Account: Caisse USD
   - Initial Balance: $1,000.00

2. **Results:**
   - ✅ `paiements_salaires`: Record created
   - ✅ `salaires_impayes`: Status updated to PAYE_TOTAL
   - ✅ `bulletins_paie`: Status updated to PAYE
   - ✅ `comptes_tresorerie`: Balance = $952.00
   - ✅ `mouvements_tresorerie`: SORTIE record created
   - ❌ `depenses`: NO record created

3. **Impact:**
   - Treasury balance shows $952.00 ✅
   - Expense report shows $0.00 for salaries ❌
   - Total expenses incomplete ❌

## Next Steps

**Decision Required:**

Should salary payments create expense records?

**If YES:**
1. Modify `db-payer-salaire` handler in `public/electron.cjs`
2. Add expense record creation after treasury update
3. Link expense to payment via reference
4. Add same handler to `electron/main.js` for development
5. Test with partial and full payments
6. Verify expense reports include salary payments

**If NO:**
1. Create separate salary expense report
2. Document that salaries are tracked separately
3. Ensure accounting reconciliation process accounts for this

## Summary

**Current Status:**
- ✅ Treasury balance: WORKING
- ✅ Payment tracking: WORKING
- ❌ Expense reporting: NOT INTEGRATED

**Recommendation:** Add expense record creation to complete the accounting integration.
