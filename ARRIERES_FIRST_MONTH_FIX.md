# 🔧 Fix: Arriérés Not Showing First Month in Bulk Export

## Problem

When viewing the bulk payslip export for a given month (e.g., February 2026), the arriérés column was NOT showing unpaid salaries from the first/previous month (e.g., January 2026).

### Root Cause

The issue was in the date comparison logic. The system stores `date_echeance` as the **15th of the month AFTER** the payroll period:

- **January 2026 payroll** → `date_echeance` = **February 15, 2026**
- **February 2026 payroll** → `date_echeance` = **March 15, 2026**

The old filter logic was:
```javascript
const salaireDate = new Date(s.date_echeance); // Feb 15, 2026
const currentDate = new Date(selectedPeriod.annee, selectedPeriod.mois - 1); // Feb 1, 2026
return salaireDate < currentDate; // Feb 15 < Feb 1 = FALSE ❌
```

This meant January's unpaid salary (due Feb 15) was NOT shown when viewing February payroll because Feb 15 is NOT less than Feb 1.

## Solution

Fixed the date comparison to properly calculate the **payroll period** from the due date, then compare periods instead of dates.

### File: `src/components/Payroll/PayrollManagement.tsx`

#### 1. Fixed Arriérés Filter Logic (lines ~300-320)

**Before:**
```javascript
return salairesImpayes.filter((s: any) => {
  const salaireDate = new Date(s.date_echeance);
  const currentDate = new Date(selectedPeriod.annee, selectedPeriod.mois - 1);
  return salaireDate < currentDate && 
         (s.statut === 'IMPAYE' || s.statut === 'PAYE_PARTIEL') &&
         s.montant_restant > 0;
});
```

**After:**
```javascript
return salairesImpayes.filter((s: any) => {
  // date_echeance is set to 15th of the month AFTER the payroll period
  // So January 2026 payroll has date_echeance = Feb 15, 2026
  // We need to check if this unpaid salary is from a period BEFORE the current one
  const echeanceDate = new Date(s.date_echeance);
  const echeanceYear = echeanceDate.getFullYear();
  const echeanceMonth = echeanceDate.getMonth() + 1; // 1-12
  
  // The payroll period is one month before the due date
  // So if due date is Feb 15, the period is January
  const salairePeriodYear = echeanceMonth === 1 ? echeanceYear - 1 : echeanceYear;
  const salairePeriodMonth = echeanceMonth === 1 ? 12 : echeanceMonth - 1;
  
  // Compare with current period
  const isPreviousPeriod = 
    (salairePeriodYear < selectedPeriod.annee) ||
    (salairePeriodYear === selectedPeriod.annee && salairePeriodMonth < selectedPeriod.mois);
  
  return isPreviousPeriod && 
         (s.statut === 'IMPAYE' || s.statut === 'PAYE_PARTIEL') &&
         s.montant_restant > 0;
});
```

#### 2. Fixed Month Display in formatArrieres (lines ~380-390)

**Before:**
```javascript
const months = employeeArrieres.map((s: any) => {
  const date = new Date(s.date_echeance);
  return `${getMonthNameFr(date.getMonth() + 1)} ${date.getFullYear()}`;
}).join(', ');
```

This would show "Fév 2026" for January's unpaid salary (because due date is Feb 15).

**After:**
```javascript
const months = employeeArrieres.map((s: any) => {
  // date_echeance is 15th of month AFTER the payroll period
  // So we need to subtract 1 month to get the actual payroll period
  const echeanceDate = new Date(s.date_echeance);
  const echeanceMonth = echeanceDate.getMonth() + 1; // 1-12
  const echeanceYear = echeanceDate.getFullYear();
  
  // Calculate the actual payroll period (one month before due date)
  const periodMonth = echeanceMonth === 1 ? 12 : echeanceMonth - 1;
  const periodYear = echeanceMonth === 1 ? echeanceYear - 1 : echeanceYear;
  
  return `${getMonthNameFr(periodMonth)} ${periodYear}`;
}).join(', ');
```

Now it correctly shows "Jan 2026" for January's unpaid salary.

## Example Scenario

### Setup:
1. **January 2026**: Created payroll, validated, but NOT paid
   - Salaire Net: $48.00
   - Status: IMPAYE
   - Due Date: February 15, 2026

2. **February 2026**: Created new payroll period
   - Salaire Net: $48.00
   - Arriérés: $48.00 (from January)

### Before Fix:
```
FÉVRIER 2026 - Bulk Export
┌──────────────┬──────────────┬──────────┐
│ Nom          │ Arriérés     │ Sal.Net  │
├──────────────┼──────────────┼──────────┤
│ Amani        │ $0.00        │ $48.00   │  ❌ January not shown!
└──────────────┴──────────────┴──────────┘
```

### After Fix:
```
FÉVRIER 2026 - Bulk Export
┌──────────────┬──────────────────────┬──────────┐
│ Nom          │ Arriérés             │ Sal.Net  │
├──────────────┼──────────────────────┼──────────┤
│ Amani        │ $48.00 (Jan 2026)    │ $48.00   │  ✅ January shown!
└──────────────┴──────────────────────┴──────────┘
```

## Logic Explanation

### Date Calculation:

**Given:** `date_echeance` = February 15, 2026

**Calculate payroll period:**
```javascript
echeanceMonth = 2 (February)
echeanceYear = 2026

// Period is one month before due date
periodMonth = 2 - 1 = 1 (January)
periodYear = 2026
```

**Result:** This unpaid salary is from **January 2026**

### Period Comparison:

**Viewing:** February 2026 payroll (`selectedPeriod.mois = 2, selectedPeriod.annee = 2026`)

**Check if January is before February:**
```javascript
isPreviousPeriod = 
  (2026 < 2026) ||  // FALSE
  (2026 === 2026 && 1 < 2)  // TRUE ✅

Result: TRUE - January is before February, so show it as arriérés
```

## Edge Cases Handled

### 1. December → January (Year Boundary)
**Given:** `date_echeance` = January 15, 2026 (for December 2025 payroll)

```javascript
echeanceMonth = 1 (January)
echeanceYear = 2026

// Special case: when echeanceMonth === 1
periodMonth = 12 (December)
periodYear = 2026 - 1 = 2025
```

**Result:** December 2025 ✅

### 2. Multiple Unpaid Months
**Given:** January, February, March all unpaid

**Viewing:** April 2026 payroll

**Result:** Shows "48.00 (Jan 2026, Fév 2026, Mar 2026)" ✅

## Testing

### Test Case 1: First Month Unpaid
1. Create January 2026 payroll
2. Validate but don't pay
3. Create February 2026 payroll
4. Export bulk PDF for February
5. **Expected:** Arriérés column shows "$48.00 (Jan 2026)"

### Test Case 2: Multiple Months Unpaid
1. Create January, February, March 2026 payrolls
2. Validate all but don't pay
3. Create April 2026 payroll
4. Export bulk PDF for April
5. **Expected:** Arriérés column shows "$144.00 (Jan 2026, Fév 2026, Mar 2026)"

### Test Case 3: Year Boundary
1. Create December 2025 payroll
2. Validate but don't pay
3. Create January 2026 payroll
4. Export bulk PDF for January 2026
5. **Expected:** Arriérés column shows "$48.00 (Déc 2025)"

## Status

✅ **COMPLETE** - Arriérés now correctly show all previous unpaid months including the first month
