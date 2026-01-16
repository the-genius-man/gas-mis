# 🔒 Payroll Flush & Lock Validation Implementation

## Summary

Implemented two critical features:
1. **Flush all payroll data** - Delete all existing bulletins de paie
2. **Lock validation** - Prevent creating new periods if previous period is not locked

---

## Feature 1: Flush All Payroll Data

### Purpose
Allows administrators to delete ALL payroll data to start fresh. Useful for:
- Testing and development
- Correcting major errors
- Starting a new fiscal year
- Resetting the system

### What Gets Deleted

When you flush payroll, the following data is permanently deleted:
1. **periodes_paie** - All payroll periods
2. **bulletins_paie** - All payslips
3. **salaires_impayes** - All unpaid salary records
4. **paiements_salaires** - All salary payment records
5. **remboursements_avances** - All advance repayment records

### How to Use

1. Go to **Paie → Paie** tab
2. Click the red **"Réinitialiser"** button in the top right
3. Confirm the action (requires TWO confirmations)
4. All payroll data will be deleted

### Safety Features

**Double Confirmation:**
- First confirmation: Explains what will be deleted
- Second confirmation: Final check before deletion

**Warning Message:**
```
⚠️ ATTENTION: Cette action supprimera TOUTES les périodes de paie et bulletins.

Cela inclut:
- Toutes les périodes de paie
- Tous les bulletins de paie
- Tous les salaires impayés
- Tous les paiements de salaires

Cette action est IRRÉVERSIBLE!

Êtes-vous absolument sûr?
```

### Database Handler

**File:** `public/electron.cjs`

```javascript
ipcMain.handle('db-flush-payroll', async (event) => {
  try {
    // Delete all related data in correct order (due to foreign keys)
    db.prepare('DELETE FROM remboursements_avances').run();
    db.prepare('DELETE FROM paiements_salaires').run();
    db.prepare('DELETE FROM salaires_impayes').run();
    db.prepare('DELETE FROM bulletins_paie').run();
    db.prepare('DELETE FROM periodes_paie').run();
    
    console.log('All payroll data flushed successfully');
    return { success: true, message: 'Toutes les données de paie ont été supprimées' };
  } catch (error) {
    console.error('Error flushing payroll data:', error);
    throw error;
  }
});
```

**Order is important:** Data is deleted in reverse order of foreign key dependencies to avoid constraint violations.

---

## Feature 2: Lock Validation for New Periods

### Purpose
Enforces sequential payroll processing by preventing creation of new periods until previous periods are locked.

### Business Rule

**You CANNOT create a new payroll period if:**
- There exists ANY previous period (earlier month/year)
- That previous period is NOT locked (status ≠ 'VERROUILLEE')

**Example:**
- ❌ Cannot create February 2026 if January 2026 is still "CALCULEE" or "VALIDEE"
- ✅ Can create February 2026 if January 2026 is "VERROUILLEE"
- ✅ Can create January 2026 if no previous periods exist

### Validation Logic

**File:** `public/electron.cjs` (in `db-create-payroll-period` handler)

```javascript
// Check if there are any previous periods that are not locked
const previousPeriod = db.prepare(`
  SELECT id, mois, annee, statut 
  FROM periodes_paie 
  WHERE (annee < ? OR (annee = ? AND mois < ?))
  AND statut != 'VERROUILLEE'
  ORDER BY annee DESC, mois DESC
  LIMIT 1
`).get(data.annee, data.annee, data.mois);

if (previousPeriod) {
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  throw new Error(
    `Impossible de créer une nouvelle période. La période ${monthNames[previousPeriod.mois - 1]} ${previousPeriod.annee} doit être verrouillée d'abord (statut actuel: ${previousPeriod.statut}).`
  );
}
```

### Error Messages

**When trying to create a new period with unlocked previous period:**
```
Impossible de créer une nouvelle période. 
La période Janvier 2026 doit être verrouillée d'abord 
(statut actuel: VALIDEE).
```

### Payroll Workflow

The correct workflow is now enforced:

```
1. Create Period (BROUILLON)
   ↓
2. Calculate Payroll (CALCULEE)
   ↓
3. Edit/Review Payslips (CALCULEE)
   ↓
4. Validate Payslips (VALIDEE)
   ↓
5. Lock Period (VERROUILLEE) ← REQUIRED before next period
   ↓
6. Create Next Period (allowed)
```

### Period Statuses

| Status | Description | Can Create Next Period? |
|--------|-------------|------------------------|
| BROUILLON | Draft, not calculated | ❌ No |
| CALCULEE | Calculated, can edit | ❌ No |
| VALIDEE | Validated, ready to lock | ❌ No |
| VERROUILLEE | Locked, immutable | ✅ Yes |

---

## Implementation Details

### Files Modified

1. **public/electron.cjs**
   - Added `db-flush-payroll` handler (lines ~1651-1665)
   - Added lock validation to `db-create-payroll-period` (lines ~1247-1260)

2. **public/preload.cjs**
   - Added `flushPayroll` API (line ~202)

3. **src/vite-env.d.ts**
   - Added `flushPayroll` TypeScript definition (line ~20)

4. **src/components/Payroll/PayrollManagement.tsx**
   - Added `Trash2` icon import (line 2)
   - Added `handleFlushPayroll` function (lines ~169-191)
   - Added "Réinitialiser" button in header (lines ~575-582)

### API Functions

#### Flush Payroll
```typescript
window.electronAPI.flushPayroll()
```
**Returns:** `{ success: true, message: string }`

#### Create Period (with validation)
```typescript
window.electronAPI.createPayrollPeriod({
  mois: number,
  annee: number,
  notes?: string
})
```
**Throws:** Error if previous period not locked

---

## Testing

### Test Case 1: Flush Payroll

**Steps:**
1. Create some payroll periods with payslips
2. Click "Réinitialiser" button
3. Confirm twice
4. Verify all periods are deleted

**Expected Result:**
- All periods disappear from the list
- "Aucune période de paie" message shown
- Success alert displayed

### Test Case 2: Lock Validation - No Previous Period

**Steps:**
1. Flush all payroll data
2. Try to create January 2026 period

**Expected Result:**
- ✅ Period created successfully (no previous periods exist)

### Test Case 3: Lock Validation - Previous Period Not Locked

**Steps:**
1. Create January 2026 period
2. Calculate payroll (status: CALCULEE)
3. Try to create February 2026 period

**Expected Result:**
- ❌ Error: "Impossible de créer une nouvelle période. La période Janvier 2026 doit être verrouillée d'abord (statut actuel: CALCULEE)."

### Test Case 4: Lock Validation - Previous Period Locked

**Steps:**
1. Create January 2026 period
2. Calculate payroll
3. Validate payslips
4. Lock period (status: VERROUILLEE)
5. Try to create February 2026 period

**Expected Result:**
- ✅ Period created successfully

### Test Case 5: Lock Validation - Multiple Periods

**Steps:**
1. Create and lock January 2026
2. Create and lock February 2026
3. Create March 2026 (don't lock)
4. Try to create April 2026

**Expected Result:**
- ❌ Error: "Impossible de créer une nouvelle période. La période Mars 2026 doit être verrouillée d'abord (statut actuel: CALCULEE)."

---

## Benefits

### 1. Data Integrity
- Ensures sequential processing of payroll
- Prevents gaps or overlaps in payroll periods
- Forces proper workflow completion

### 2. Audit Trail
- Locked periods cannot be modified
- Clear progression through payroll cycle
- Traceable payroll history

### 3. Error Prevention
- Cannot skip periods
- Cannot create future periods prematurely
- Forces review and validation before moving forward

### 4. Clean Slate
- Easy to reset for testing
- Can start fresh if needed
- Removes all test data quickly

---

## Important Notes

### ⚠️ Flush is Permanent
- There is NO undo for flush operation
- All payroll data is permanently deleted
- Use with extreme caution in production

### ⚠️ Lock is Irreversible
- Once a period is locked, it CANNOT be unlocked
- Payslips in locked periods CANNOT be edited
- Plan carefully before locking

### ✅ Recommended Workflow

1. **Test thoroughly** before locking
2. **Review all payslips** in CALCULEE status
3. **Validate** when confident
4. **Lock** only when completely finalized
5. **Create next period** after locking

### 🔄 If You Need to Modify Locked Period

If you absolutely need to modify a locked period:
1. Use database tools to manually change status
2. OR flush all data and start over
3. OR create adjustment entries in future periods

---

## UI Changes

### Header Buttons

**Before:**
```
[Nouvelle Période]
```

**After:**
```
[Réinitialiser] [Nouvelle Période]
     (red)          (blue)
```

### Button Styles

**Réinitialiser Button:**
- Color: Red (bg-red-600)
- Icon: Trash2
- Position: Left of "Nouvelle Période"
- Tooltip: "Supprimer toutes les données de paie"

---

## Error Handling

### Flush Errors

**Possible errors:**
- Database locked
- Foreign key constraint violations (shouldn't happen with correct order)
- Permission issues

**Error message:**
```
Erreur lors de la suppression des données
```

### Lock Validation Errors

**Error format:**
```
Impossible de créer une nouvelle période. 
La période [Month] [Year] doit être verrouillée d'abord 
(statut actuel: [STATUS]).
```

**Possible statuses:**
- BROUILLON
- CALCULEE
- VALIDEE

---

## Summary

✅ **Flush Feature:**
- Deletes ALL payroll data
- Requires double confirmation
- Useful for testing and reset

✅ **Lock Validation:**
- Enforces sequential processing
- Prevents creating new periods until previous is locked
- Clear error messages

✅ **Benefits:**
- Data integrity
- Proper workflow enforcement
- Audit trail
- Error prevention

Both features are now active and ready to use!
