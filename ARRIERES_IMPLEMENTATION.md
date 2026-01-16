# 💰 Arriérés Implementation - Bulletin de Paie

## ✅ **Status: COMPLETE - AUTO-CALCULATED**

Successfully added "arriérés" (arrears) field to the payslip system. **Arriérés are now automatically calculated** from unpaid salaries in the `salaires_impayes` table.

---

## 📋 **Changes Made**

### **1. Database Schema** (`public/electron.cjs`)
- ✅ Added `arrieres REAL DEFAULT 0` column to `bulletins_paie` table
- ✅ Added migration to update existing databases
- ✅ **Updated payroll calculation to AUTO-CALCULATE arriérés from unpaid salaries**
- ✅ Updated payslip update handler to save arriérés

### **2. TypeScript Types** (`src/types/index.ts`)
- ✅ Added `arrieres: number` field to `BulletinPaie` interface

### **3. Edit Form** (`src/components/Payroll/PayslipEditForm.tsx`)
- ✅ Added arriérés input field in the form (editable for manual adjustments)
- ✅ Updated salary calculation: `salaireBrut = base + primes + arrieres`
- ✅ Added blue background and help text indicating auto-calculation
- ✅ Included arriérés in save operation

### **4. Display Component** (`src/components/Payroll/PayslipDetail.tsx`)
- ✅ Added arriérés display in salary calculation section
- ✅ Shows arriérés in blue color to distinguish from regular salary
- ✅ Only displays when arriérés > 0

---

## 🎯 **How It Works**

### **Automatic Calculation:**
When payroll is calculated, arriérés are **automatically calculated** using this query:

```sql
SELECT COALESCE(SUM(si.montant_restant), 0) as total_arrieres
FROM salaires_impayes si
JOIN periodes_paie pp ON si.periode_paie_id = pp.id
WHERE si.employe_id = ?
AND si.statut IN ('IMPAYE', 'PAYE_PARTIEL')
AND (pp.annee < ? OR (pp.annee = ? AND pp.mois < ?))
```

This sums up:
- All **unpaid** salaries (`IMPAYE`)
- All **partially paid** salaries (`PAYE_PARTIEL`)
- From **previous periods** only (before current month/year)
- The **remaining amount** (`montant_restant`) for each unpaid salary

### **Manual Adjustment:**
Users can still edit arriérés if needed:
1. Navigate to Paie → Select Period
2. Click Edit (pencil icon) on a payslip
3. Adjust arriérés amount if necessary
4. System automatically recalculates gross salary and deductions

### **Salary Calculation:**
```
Salaire Brut = Salaire de Base + Primes + Arriérés
```

### **Payment Flow:**
1. Payslip is **validated** → Creates entry in `salaires_impayes` with status `IMPAYE`
2. Payment is recorded → Updates `montant_paye` and `montant_restant`
3. Status changes:
   - `IMPAYE` → No payment yet
   - `PAYE_PARTIEL` → Partial payment made
   - `PAYE_TOTAL` → Fully paid
4. Next period calculation → Automatically includes unpaid amounts as arriérés

---

## 📊 **UI Changes**

### **Edit Form:**
- Field: "Arriérés (USD)"
- Background: Blue (`bg-blue-50`)
- Help text: "Calculé automatiquement: salaires validés non payés des périodes précédentes"
- Located in "Primes et Retenues" section

### **Payslip Detail:**
- Displays arriérés (if > 0) in salary calculation
- Blue color to distinguish from regular components
- Format: "$X,XXX.XX"

---

## 🔄 **Integration with Unpaid Salaries Module**

The arriérés calculation is fully integrated with the **Salaires Impayés** module:

1. **Validation** → When payslips are validated, entries are created in `salaires_impayes`
2. **Payment Tracking** → Payments are recorded in `paiements_salaires`
3. **Status Updates** → `montant_restant` is updated as payments are made
4. **Arriérés Calculation** → Next period automatically includes unpaid amounts

---

## ✅ **Testing Checklist**

- [x] Database migration runs successfully
- [x] Arriérés calculated from `salaires_impayes` table
- [x] Only includes IMPAYE and PAYE_PARTIEL statuses
- [x] Only includes previous periods (not current)
- [x] Salary calculation includes arriérés
- [x] Edit form displays arriérés with auto-calc note
- [x] Detail view shows arriérés
- [x] No TypeScript errors

---

## 📝 **Example Scenario**

**Month 1 (January):**
- Employee salary: $100
- Status: VALIDE
- Payment: $0
- Entry in `salaires_impayes`: montant_restant = $100

**Month 2 (February):**
- Employee salary: $100
- **Arriérés auto-calculated: $100** (from January)
- Salaire Brut: $100 + $100 = $200
- Status: VALIDE
- Payment: $50 (partial)
- January entry updated: montant_restant = $50
- February entry created: montant_restant = $200

**Month 3 (March):**
- Employee salary: $100
- **Arriérés auto-calculated: $250** ($50 from Jan + $200 from Feb)
- Salaire Brut: $100 + $250 = $350

---

## 🔄 **Migration**

Existing databases will automatically receive the `arrieres` column with default value 0.
No data loss or manual intervention required.

---

**Date Completed:** January 15, 2026  
**Auto-Calculation:** ✅ Enabled  
**Source:** `salaires_impayes` table
