# 🔧 Fix: Arriérés (Arrears) Not Included in Monthly Salary Calculation

## Problem Statement

The system was incorrectly adding unpaid salaries from previous months (arriérés) to the current month's gross salary (salaire_brut). This caused:

1. **Incorrect salary calculations** - Each month's salary was inflated by previous unpaid amounts
2. **Incorrect tax calculations** - Social deductions (CNSS, ONEM, INPP) and IPR were calculated on inflated amounts
3. **Compounding effect** - If Month 1 wasn't paid, Month 2 would include Month 1's salary, making it double

### Example of the Problem

**WRONG (Before Fix):**
- Month 1: Salary = $500, Not paid → Unpaid = $500
- Month 2: Salary = $500 + $500 (arriérés) = $1000 ← WRONG!
  - CNSS calculated on $1000
  - IPR calculated on $1000
  - Net salary inflated

**CORRECT (After Fix):**
- Month 1: Salary = $500, Not paid → Unpaid = $500
- Month 2: Salary = $500 (separate calculation)
  - CNSS calculated on $500
  - IPR calculated on $500
  - Arriérés = $500 (tracked separately for information)

---

## Root Cause

### 1. Payroll Calculation (electron.cjs)

**Line 1311 (BEFORE):**
```javascript
const salaireBrut = salaireBase + primes + arrieres; // ← WRONG!
```

This added arriérés to the gross salary, which then affected all subsequent calculations.

### 2. Payslip Edit Form (PayslipEditForm.tsx)

**Lines 84-85 (BEFORE):**
```typescript
const salaireBrut = payslip.mode_remuneration === 'JOURNALIER'
  ? formData.jours_travailles * formData.taux_journalier + formData.primes + formData.arrieres // ← WRONG!
  : formData.salaire_base + formData.primes + formData.arrieres; // ← WRONG!
```

Same issue when manually editing payslips.

---

## Solution Applied

### 1. Fixed Payroll Calculation (electron.cjs)

**Line 1311 (AFTER):**
```javascript
// Salaire brut = base salary + bonuses ONLY (arriérés NOT included)
// Arriérés are tracked separately and shown on payslip for information
const salaireBrut = salaireBase + primes;
```

**Changes:**
- Removed `+ arrieres` from the calculation
- Added comment explaining that arriérés are tracked separately
- Arriérés are still calculated and stored in the `arrieres` field for display

### 2. Fixed Payslip Edit Form (PayslipEditForm.tsx)

**Lines 84-87 (AFTER):**
```typescript
// NOTE: Arriérés are NOT included in salaire_brut calculation
// They are tracked separately for display purposes only
const salaireBrut = payslip.mode_remuneration === 'JOURNALIER'
  ? formData.jours_travailles * formData.taux_journalier + formData.primes
  : formData.salaire_base + formData.primes;
```

**Changes:**
- Removed `+ formData.arrieres` from both calculations
- Added comment explaining the logic

### 3. Updated PDF Display (PayslipDetail.tsx)

**Line 101 (AFTER):**
```typescript
salaryData.push(['ℹ️ Arriérés (Info)', `$${payslip.arrieres.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`]);
```

**Changes:**
- Changed label from "Arriérés (Salaires impayés)" to "ℹ️ Arriérés (Info)"
- Added ℹ️ emoji to indicate it's informational only
- Moved it to show BEFORE "SALAIRE BRUT" to clarify it's not included

---

## What Arriérés Are Now

### Definition
Arriérés = Unpaid or partially paid salaries from **previous months only**

### Purpose
- **Informational** - Shows employee how much is owed from past months
- **Tracking** - Helps monitor outstanding payments
- **Transparency** - Employee can see their total outstanding balance

### NOT Used For
- ❌ Salary calculation
- ❌ Tax calculation (CNSS, ONEM, INPP, IPR)
- ❌ Social deductions
- ❌ Net salary calculation

### Used For
- ✅ Display on payslip (information only)
- ✅ Tracking in `salaires_impayes` table
- ✅ Payment management in "Salaires Impayés" module

---

## How It Works Now

### Payroll Calculation Flow

```
1. Get employee base salary
   ↓
2. Calculate primes (bonuses)
   ↓
3. Calculate arriérés (for display only)
   ↓
4. Calculate SALAIRE BRUT = base + primes
   (arriérés NOT included)
   ↓
5. Calculate social deductions on SALAIRE BRUT
   - CNSS = salaire_brut × 5%
   - ONEM = salaire_brut × 1.5%
   - INPP = salaire_brut × 0.5%
   ↓
6. Calculate IPR on (salaire_brut - social deductions)
   ↓
7. Calculate NET SALARY = brut - deductions
   ↓
8. Store arriérés in bulletin_paie.arrieres field
   (for display purposes only)
```

### Database Structure

**bulletins_paie table:**
```sql
CREATE TABLE bulletins_paie (
  ...
  salaire_base REAL,
  primes REAL,
  arrieres REAL,           -- Stored for display, NOT in calculation
  salaire_brut REAL,       -- = salaire_base + primes (NOT + arrieres)
  cnss REAL,               -- Calculated on salaire_brut
  onem REAL,               -- Calculated on salaire_brut
  inpp REAL,               -- Calculated on salaire_brut
  ipr REAL,                -- Calculated on (salaire_brut - social)
  salaire_net REAL,        -- Final net salary
  ...
)
```

### Payslip Display

**On PDF and UI:**
```
SALAIRE
  Salaire de Base:        $500.00
  Primes:                 $50.00
  ℹ️ Arriérés (Info):     $300.00  ← Informational only
  ─────────────────────────────────
  SALAIRE BRUT:           $550.00  ← Does NOT include arriérés

RETENUES SOCIALES
  CNSS (5%):              -$27.50  ← Calculated on $550, not $850
  ONEM (1.5%):            -$8.25
  INPP (0.5%):            -$2.75
  ─────────────────────────────────
  TOTAL RETENUES:         -$38.50

SALAIRE NET:              $511.50
```

---

## Impact on Existing Data

### For New Payrolls
- ✅ Will calculate correctly from now on
- ✅ Arriérés shown as information only
- ✅ Taxes calculated on correct amounts

### For Existing Payrolls (Already Calculated)
- ⚠️ **Already calculated payslips are NOT automatically recalculated**
- ⚠️ If you have existing payslips with incorrect calculations, you need to:
  1. Delete the incorrect period (if not yet validated)
  2. Recalculate the payroll
  3. OR manually edit each payslip to correct the amounts

### How to Fix Existing Payslips

If you have payslips that were calculated with the old (wrong) logic:

**Option 1: Recalculate (Recommended)**
1. Go to Paie → Paie
2. Find the period with incorrect calculations
3. If status is "BROUILLON" or "CALCULEE":
   - Delete the period
   - Create new period
   - Calculate again (will use new logic)

**Option 2: Manual Edit**
1. Go to Paie → Paie
2. Select the period
3. For each payslip, click Edit (✏️ icon)
4. The form will recalculate using the new logic
5. Save the payslip

**Option 3: Leave As-Is**
- If the period is already validated and paid, you may choose to leave it
- Future periods will calculate correctly

---

## Testing the Fix

### Test Case 1: New Employee, First Month

**Setup:**
- Employee: John Doe
- Salary: $500/month
- Month: January 2026

**Expected Result:**
- Salaire Base: $500
- Arriérés: $0 (no previous unpaid salaries)
- Salaire Brut: $500
- CNSS: $25 (5% of $500)
- Net: ~$450

### Test Case 2: Employee with Unpaid Previous Month

**Setup:**
- Employee: Jane Smith
- Salary: $500/month
- Month 1 (Dec 2025): Calculated but NOT paid
- Month 2 (Jan 2026): Calculate now

**Expected Result for Month 2:**
- Salaire Base: $500
- Arriérés: $500 (from Dec 2025) ← Shown for info
- Salaire Brut: $500 ← Does NOT include arriérés
- CNSS: $25 (5% of $500, NOT $1000)
- Net: ~$450

**Verify:**
- Go to Salaires Impayés tab
- Should see TWO separate entries:
  - Dec 2025: $500 unpaid
  - Jan 2026: $500 unpaid (if not paid)

### Test Case 3: Multiple Unpaid Months

**Setup:**
- Employee: Bob Johnson
- Salary: $600/month
- Months 1-3: Calculated but NOT paid
- Month 4: Calculate now

**Expected Result for Month 4:**
- Salaire Base: $600
- Arriérés: $1800 (3 × $600) ← Shown for info
- Salaire Brut: $600 ← Does NOT include arriérés
- CNSS: $30 (5% of $600, NOT $2400)
- Net: ~$540

---

## Files Modified

1. **public/electron.cjs** (line ~1311)
   - Removed arriérés from salaire_brut calculation
   - Added explanatory comments

2. **src/components/Payroll/PayslipEditForm.tsx** (lines ~84-87)
   - Removed arriérés from salaire_brut calculation
   - Added explanatory comments

3. **src/components/Payroll/PayslipDetail.tsx** (line ~101)
   - Changed arriérés label to "ℹ️ Arriérés (Info)"
   - Clarified it's informational only

---

## Summary

✅ **Fixed:** Arriérés no longer included in monthly salary calculation  
✅ **Fixed:** Taxes calculated on correct amounts  
✅ **Fixed:** Each month has independent salary calculation  
✅ **Improved:** Arriérés clearly marked as informational  
✅ **Maintained:** Arriérés still tracked and displayed for transparency  

### Key Points

1. **Each month is independent** - Month 2's salary is NOT affected by Month 1's payment status
2. **Arriérés are informational** - They show what's owed from past months but don't affect current calculations
3. **Taxes are correct** - Social deductions and IPR calculated only on current month's salary
4. **Payment tracking separate** - Use "Salaires Impayés" module to track and pay outstanding balances

The system now correctly separates:
- **Current month's salary** (calculated fresh each month)
- **Previous months' unpaid balances** (tracked separately as arriérés)

This aligns with proper accounting practices where each period's salary is calculated independently, and outstanding balances are tracked separately.
