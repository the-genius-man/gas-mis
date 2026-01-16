# 💰 Guide: Payment of Guards' Salaries

## Overview

The salary payment system is **already implemented and ready to use**. It tracks unpaid salaries (OHADA Account 422 - Personnel, Rémunérations Dues) and allows you to record payments.

---

## How to Access

1. Go to **Paie** (Payroll) module
2. Click on the **"Salaires Impayés"** tab
3. You'll see a list of all unpaid salaries

---

## Features

### 1. Dashboard Summary

Three summary cards show:
- **Total Dû** - Total amount owed to all employees
- **Total Payé** - Total amount already paid
- **Solde Restant** - Remaining balance to be paid

### 2. Salary List

Table showing:
- Employee name and matricule
- Period (month/year)
- Amount due (Montant Dû)
- Amount paid (Payé)
- Remaining balance (Restant)
- Due date (Échéance)
- Status badge:
  - 🔴 **Impayé** - Not paid
  - 🟡 **Partiel** - Partially paid
  - 🟢 **Payé** - Fully paid

### 3. Search & Filter

- **Search bar** - Search by employee name or matricule
- **Status filter** - Filter by payment status (Impayé, Partiel, Payé)

### 4. Payment Actions

For each unpaid salary, you can:

#### A. Record a Payment (💳 icon)
Click the credit card icon to open the payment modal:

**Payment Form Fields:**
- **Montant à Payer** - Amount to pay (can be partial or full)
- **Date de Paiement** - Payment date
- **Mode de Paiement** - Payment method:
  - Espèces (Cash)
  - Virement Bancaire (Bank Transfer)
  - Chèque (Check)
  - Mobile Money
- **Référence de Paiement** - Payment reference (optional)
- **Notes** - Additional notes (optional)

**Payment Process:**
1. Click 💳 icon next to the salary
2. Fill in the payment form
3. Click "Enregistrer le Paiement"
4. Confirm the payment
5. The system will:
   - Record the payment in `paiements_salaires` table
   - Update the salary status in `salaires_impayes` table
   - Update `montant_paye` and `montant_restant`
   - Change status to:
     - `PAYE_PARTIEL` if partial payment
     - `PAYE_TOTAL` if fully paid

#### B. View Payment History (👁️ icon)
Click the eye icon to see all payments made for that salary:
- Payment number
- Amount paid
- Date
- Payment method
- Reference
- Notes

---

## How Unpaid Salaries Are Created

Unpaid salaries are **automatically created** when you validate a payroll period:

1. Go to **Paie** → **Paie** tab
2. Calculate payroll for a period
3. Validate the payslips
4. System automatically creates records in `salaires_impayes` table for each employee

**Database Flow:**
```
Validate Payslips
    ↓
For each bulletin_paie:
    ↓
Create salaires_impayes record:
  - bulletin_paie_id
  - employe_id
  - montant_net_du = salaire_net
  - montant_paye = 0
  - montant_restant = salaire_net
  - statut = 'IMPAYE'
  - date_echeance = end of month
```

---

## Payment Scenarios

### Scenario 1: Full Payment

Employee salary: $500
1. Click 💳 icon
2. Enter amount: $500
3. Select payment method: Virement Bancaire
4. Enter reference: VIR-2026-001
5. Click "Enregistrer le Paiement"

**Result:**
- montant_paye = $500
- montant_restant = $0
- statut = 'PAYE_TOTAL'
- Badge shows 🟢 Payé

### Scenario 2: Partial Payment

Employee salary: $500
1. First payment: $300
   - montant_paye = $300
   - montant_restant = $200
   - statut = 'PAYE_PARTIEL'
   - Badge shows 🟡 Partiel

2. Second payment: $200
   - montant_paye = $500
   - montant_restant = $0
   - statut = 'PAYE_TOTAL'
   - Badge shows 🟢 Payé

### Scenario 3: Multiple Partial Payments

Employee salary: $1000
1. Payment 1: $300 (Cash)
2. Payment 2: $400 (Bank Transfer)
3. Payment 3: $300 (Mobile Money)

Each payment is recorded separately in the payment history.

---

## Database Tables

### salaires_impayes (Account 422)
```sql
CREATE TABLE salaires_impayes (
  id TEXT PRIMARY KEY,
  bulletin_paie_id TEXT NOT NULL,
  employe_id TEXT NOT NULL,
  periode_paie_id TEXT NOT NULL,
  matricule TEXT,
  nom_complet TEXT,
  montant_net_du REAL NOT NULL,      -- Total amount owed
  montant_paye REAL DEFAULT 0,       -- Amount paid so far
  montant_restant REAL NOT NULL,     -- Remaining balance
  devise TEXT DEFAULT 'USD',
  date_echeance TEXT NOT NULL,       -- Due date
  statut TEXT DEFAULT 'IMPAYE',      -- IMPAYE, PAYE_PARTIEL, PAYE_TOTAL
  compte_comptable TEXT DEFAULT '4211',
  notes TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### paiements_salaires
```sql
CREATE TABLE paiements_salaires (
  id TEXT PRIMARY KEY,
  salaire_impaye_id TEXT NOT NULL,
  montant_paye REAL NOT NULL,
  devise TEXT DEFAULT 'USD',
  date_paiement TEXT NOT NULL,
  mode_paiement TEXT,                -- ESPECES, VIREMENT, CHEQUE, MOBILE_MONEY
  reference_paiement TEXT,
  compte_tresorerie_id TEXT,
  effectue_par TEXT,
  notes TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP
)
```

---

## API Functions

### 1. Get Unpaid Salaries
```typescript
window.electronAPI.getSalairesImpayes(filters)
```

**Filters:**
- `employe_id` - Filter by employee
- `periode_paie_id` - Filter by period
- `statut` - Filter by status

**Returns:** Array of SalaireImpaye objects

### 2. Get Payment History
```typescript
window.electronAPI.getPaiementsSalaires(salaireImpayeId)
```

**Returns:** Array of PaiementSalaire objects for that salary

### 3. Record Payment
```typescript
window.electronAPI.payerSalaire({
  salaire_impaye_id: string,
  montant_paye: number,
  devise: string,
  date_paiement: string,
  mode_paiement: 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY',
  reference_paiement?: string,
  notes?: string,
  effectue_par: string
})
```

**Process:**
1. Validates payment amount doesn't exceed remaining balance
2. Creates payment record in `paiements_salaires`
3. Updates `salaires_impayes`:
   - Adds to `montant_paye`
   - Subtracts from `montant_restant`
   - Updates `statut` based on remaining balance
4. Returns success

---

## OHADA Accounting Integration

The salary payment system follows OHADA accounting standards:

**Account 422 - Personnel, Rémunérations Dues**

When payroll is validated:
```
Debit:  641 - Rémunérations du personnel
Credit: 422 - Personnel, rémunérations dues
```

When salary is paid:
```
Debit:  422 - Personnel, rémunérations dues
Credit: 5xx - Trésorerie (Cash/Bank)
```

---

## Reports & Tracking

The unpaid salaries data is used in:

1. **Payroll Reports** - Shows unpaid salary totals
2. **OHADA Summary** - Account 422 balance
3. **Employee Payslips** - Shows arriérés (arrears) from unpaid salaries

---

## Tips & Best Practices

### 1. Regular Payments
- Pay salaries on time to avoid accumulating arrears
- Use the due date (date_echeance) to prioritize payments

### 2. Payment References
- Always enter payment references for bank transfers
- Use consistent reference format: VIR-YYYY-NNN

### 3. Partial Payments
- If you can't pay full salary, record partial payments
- This keeps accurate records and shows employees you're paying gradually

### 4. Payment History
- Use the 👁️ icon to review all payments made to an employee
- Useful for audits and reconciliation

### 5. Search & Filter
- Use search to quickly find specific employees
- Use status filter to see only unpaid or partially paid salaries

---

## Troubleshooting

### Issue 1: No Unpaid Salaries Showing

**Cause:** No payroll has been validated yet

**Solution:**
1. Go to Paie → Paie tab
2. Create a payroll period
3. Calculate payroll
4. Validate payslips
5. Unpaid salaries will be created automatically

### Issue 2: Can't Record Payment

**Cause:** Amount exceeds remaining balance

**Solution:** Enter an amount less than or equal to the "Solde Restant"

### Issue 3: Payment Not Updating

**Cause:** Database error or validation issue

**Solution:**
1. Check browser console for errors
2. Verify payment amount is valid
3. Ensure date is in correct format
4. Try refreshing the page

---

## Next Steps

The salary payment feature is ready to use! Here's what you can do:

1. ✅ **View unpaid salaries** - Go to Paie → Salaires Impayés
2. ✅ **Record payments** - Click 💳 icon to pay salaries
3. ✅ **Track payment history** - Click 👁️ icon to see payment details
4. ✅ **Monitor balances** - Use summary cards to track totals

The system is fully functional and integrated with the payroll module.

---

## Files Reference

- `src/components/Payroll/UnpaidSalariesManagement.tsx` - Main component
- `src/components/Payroll/PayrollModule.tsx` - Integration
- `public/electron.cjs` - Database handlers (lines 1846-1950)
- `src/types/index.ts` - TypeScript types

---

## Summary

✅ Salary payment feature is **fully implemented**
✅ Integrated into Payroll module
✅ Supports full and partial payments
✅ Tracks payment history
✅ OHADA compliant (Account 422)
✅ Ready to use immediately

No additional development needed - the feature is complete and working!
