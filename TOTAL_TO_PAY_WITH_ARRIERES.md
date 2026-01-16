# 💰 Total to Pay = Net Salary + Arriérés

## Implementation Summary

The payslip now shows the **total amount to pay** which includes both the current month's net salary AND any unpaid amounts from previous months (arriérés).

## Key Principle

✅ **Monthly salary calculation remains independent**  
✅ **Taxes calculated only on current month**  
✅ **Arriérés added AFTER all calculations**  
✅ **Employee receives: Current Month + Past Unpaid**  

---

## How It Works

### Monthly Salary Calculation (Unchanged)

```
1. Salaire Brut = Salaire de Base + Primes
   (Arriérés NOT included)

2. Social Deductions:
   - CNSS = Salaire Brut × 5%
   - ONEM = Salaire Brut × 1.5%
   - INPP = Salaire Brut × 0.5%

3. Salaire Imposable = Salaire Brut - Social Deductions

4. IPR = Progressive tax on Salaire Imposable

5. Salaire Net du Mois = Salaire Brut - All Deductions
```

### Total to Pay (New)

```
Montant Total à Payer = Salaire Net du Mois + Arriérés
```

---

## Example

### Employee with Arriérés

**Current Month (January 2026):**
- Salaire de Base: $500
- Primes: $50
- **Salaire Brut: $550** (arriérés NOT included)
- CNSS (5%): -$27.50
- ONEM (1.5%): -$8.25
- INPP (0.5%): -$2.75
- IPR: -$10
- **Salaire Net du Mois: $501.50**

**Arriérés (from previous months):**
- December 2025: $450 unpaid
- November 2025: $450 unpaid
- **Total Arriérés: $900**

**Total to Pay:**
```
Salaire Net du Mois:     $501.50
+ Arriérés:              $900.00
─────────────────────────────────
MONTANT TOTAL À PAYER:  $1,401.50
```

---

## PDF Display

### Structure

```
SALAIRE
  Salaire de Base:        $500.00
  Primes:                 $50.00
  ─────────────────────────────────
  SALAIRE BRUT:           $550.00

RETENUES SOCIALES
  CNSS (5%):              -$27.50
  ONEM (1.5%):            -$8.25
  INPP (0.5%):            -$2.75
  ─────────────────────────────────
  TOTAL RETENUES:         -$38.50

IMPOTS
  Salaire Imposable:      $511.50
  IPR:                    -$10.00

AUTRES RETENUES
  (if any)

┌─────────────────────────────────┐
│ SALAIRE NET DU MOIS    $501.50 │ ← Green box
└─────────────────────────────────┘

Arriérés (salaires impayés des mois précédents)
                          + $900.00

┌─────────────────────────────────┐
│ MONTANT TOTAL À PAYER $1,401.50│ ← Darker green box
└─────────────────────────────────┘
```

### If No Arriérés

If `arrieres = 0`, only shows:
```
┌─────────────────────────────────┐
│ SALAIRE NET DU MOIS    $501.50 │
└─────────────────────────────────┘
```

No "MONTANT TOTAL À PAYER" section appears.

---

## UI Display (Modal)

### With Arriérés

```
┌────────────────────────────────────────┐
│ Salaire Net du Mois                    │
│ Devise: USD                            │
│                              $501.50   │
│ ────────────────────────────────────── │
│ Arriérés (mois précédents)  + $900.00 │
│ ────────────────────────────────────── │
│ MONTANT TOTAL À PAYER     $1,401.50   │
└────────────────────────────────────────┘
```

### Without Arriérés

```
┌────────────────────────────────────────┐
│ Salaire Net du Mois                    │
│ Devise: USD                            │
│                              $501.50   │
└────────────────────────────────────────┘
```

---

## Benefits

### 1. Correct Accounting
- ✅ Each month's salary calculated independently
- ✅ Taxes based only on current month
- ✅ No compounding errors

### 2. Clear Communication
- ✅ Employee sees current month salary
- ✅ Employee sees past unpaid amounts
- ✅ Employee sees total they'll receive

### 3. Proper Tracking
- ✅ Current month tracked in `bulletins_paie`
- ✅ Unpaid amounts tracked in `salaires_impayes`
- ✅ Payments tracked in `paiements_salaires`

### 4. Flexibility
- ✅ Can pay current month only
- ✅ Can pay current month + partial arriérés
- ✅ Can pay current month + all arriérés

---

## Database Flow

### When Payroll is Validated

```sql
-- Create payslip with current month calculation
INSERT INTO bulletins_paie (
  salaire_base,    -- $500
  primes,          -- $50
  arrieres,        -- $900 (for display only)
  salaire_brut,    -- $550 (NOT including arriérés)
  cnss,            -- $27.50 (calculated on $550)
  salaire_net      -- $501.50
)

-- Create unpaid salary record
INSERT INTO salaires_impayes (
  montant_net_du,      -- $501.50 (current month only)
  montant_restant,     -- $501.50
  statut               -- 'IMPAYE'
)
```

### When Payment is Made

**Option 1: Pay Current Month Only**
```sql
UPDATE salaires_impayes 
SET montant_paye = 501.50,
    montant_restant = 0,
    statut = 'PAYE_TOTAL'
WHERE periode_paie_id = 'current_month'
```
Employee receives: $501.50  
Arriérés remain unpaid

**Option 2: Pay Current Month + Arriérés**
```sql
-- Pay current month
UPDATE salaires_impayes 
SET montant_paye = 501.50,
    montant_restant = 0,
    statut = 'PAYE_TOTAL'
WHERE periode_paie_id = 'current_month'

-- Pay arriérés (previous months)
UPDATE salaires_impayes 
SET montant_paye = montant_paye + 900,
    montant_restant = montant_restant - 900,
    statut = CASE 
      WHEN montant_restant - 900 = 0 THEN 'PAYE_TOTAL'
      ELSE 'PAYE_PARTIEL'
    END
WHERE periode_paie_id IN ('dec_2025', 'nov_2025')
```
Employee receives: $1,401.50  
All amounts paid

---

## Important Notes

### ⚠️ Arriérés Field in bulletins_paie

The `arrieres` field in `bulletins_paie` table is **for display purposes only**:
- ✅ Shows on payslip for employee information
- ✅ Used to calculate "MONTANT TOTAL À PAYER"
- ❌ NOT used in salary calculations
- ❌ NOT used in tax calculations

### ⚠️ Actual Unpaid Tracking

Actual unpaid amounts are tracked in `salaires_impayes` table:
- Each month creates a separate record
- Tracks payment status independently
- Allows partial payments
- Maintains payment history

### ⚠️ Payment Flexibility

The employer can choose:
1. **Pay current month only** - Arriérés accumulate
2. **Pay current + partial arriérés** - Reduce debt gradually
3. **Pay current + all arriérés** - Clear all debt

The payslip shows the total available to pay, but actual payment amount is flexible.

---

## Files Modified

1. **src/components/Payroll/PayslipDetail.tsx**
   - PDF: Changed "SALAIRE NET A PAYER" to "SALAIRE NET DU MOIS"
   - PDF: Added arriérés section after net salary
   - PDF: Added "MONTANT TOTAL À PAYER" when arriérés > 0
   - UI: Changed label to "Salaire Net du Mois"
   - UI: Added arriérés and total section in green box

---

## Testing

### Test Case 1: No Arriérés

**Setup:**
- Employee: New employee
- Current month salary: $500
- Arriérés: $0

**Expected:**
- PDF shows: "SALAIRE NET DU MOIS: $500"
- PDF does NOT show: "MONTANT TOTAL À PAYER"
- UI shows: "Salaire Net du Mois: $500"
- UI does NOT show: Arriérés section

### Test Case 2: With Arriérés

**Setup:**
- Employee: Has unpaid previous months
- Current month salary: $500
- Arriérés: $1,000

**Expected:**
- PDF shows: "SALAIRE NET DU MOIS: $500"
- PDF shows: "Arriérés: + $1,000"
- PDF shows: "MONTANT TOTAL À PAYER: $1,500"
- UI shows all three sections

### Test Case 3: Verify Calculation

**Setup:**
- Salaire de Base: $600
- Arriérés: $800

**Verify:**
- Salaire Brut = $600 (NOT $1,400)
- CNSS = $30 (5% of $600, NOT $1,400)
- Salaire Net ≈ $540
- Montant Total à Payer = $540 + $800 = $1,340

---

## Summary

✅ **Salaire Net du Mois** - Current month's net salary (after all deductions)  
✅ **Arriérés** - Unpaid amounts from previous months  
✅ **Montant Total à Payer** - What employee should receive (Net + Arriérés)  

The monthly salary calculation is completely independent and correct. Arriérés are simply added at the end to show the total amount the employee should receive.

This is the proper accounting approach! 🎯
