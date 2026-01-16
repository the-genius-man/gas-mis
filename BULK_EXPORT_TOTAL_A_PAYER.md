# 💰 Bulk Export: Total à Payer Column Added

## Summary

Added "Total à Payer" column to the bulk payslip PDF export table. This column shows the sum of **Salaire Net + Arriérés** for each employee.

## Changes Made

### File: `src/components/Payroll/PayrollManagement.tsx`

#### 1. Added Total Calculation in Table Data (lines ~410-420)
```typescript
const totalAPayer = payslip.salaire_net + payslip.arrieres;

return [
  payslip.nom_complet,
  siteName,
  `${payslip.salaire_base.toFixed(2)}`,
  formatArrieres(payslip, employeeArrieres),
  `$${payslip.salaire_brut.toFixed(2)}`,
  `$${payslip.retenues_disciplinaires.toFixed(2)}`,
  `$${payslip.autres_retenues.toFixed(2)}`,
  `$${payslip.salaire_net.toFixed(2)}`,
  `$${totalAPayer.toFixed(2)}`  // ← NEW COLUMN
];
```

#### 2. Updated Category Totals Row (lines ~425-435)
```typescript
const totals = [
  'TOTAL',
  '',
  `${categoryPayslips.reduce((sum, p) => sum + p.salaire_base, 0).toFixed(2)}`,
  '',
  `$${categoryPayslips.reduce((sum, p) => sum + p.salaire_brut, 0).toFixed(2)}`,
  `$${categoryPayslips.reduce((sum, p) => sum + p.retenues_disciplinaires, 0).toFixed(2)}`,
  `$${categoryPayslips.reduce((sum, p) => sum + p.autres_retenues, 0).toFixed(2)}`,
  `$${categoryPayslips.reduce((sum, p) => sum + p.salaire_net, 0).toFixed(2)}`,
  `$${categoryPayslips.reduce((sum, p) => sum + p.salaire_net + p.arrieres, 0).toFixed(2)}`  // ← NEW
];
```

#### 3. Added Column Header (lines ~438-448)
```typescript
head: [[
  'Nom Complet',
  'Site d\'Affectation',
  'Salaire de Base',
  'Arriérés de Salaire',
  'Salaire Brut',
  'Ret. Disciplinaires',
  'Autres Retenues',
  'Salaire Net',
  'Total à Payer'  // ← NEW HEADER
]],
```

#### 4. Updated Column Styles (lines ~458-468)
```typescript
columnStyles: {
  0: { cellWidth: 40 },      // Nom (reduced from 45)
  1: { cellWidth: 35 },      // Site (reduced from 40)
  2: { cellWidth: 22, halign: 'right' },  // Salaire de Base (reduced from 25)
  3: { cellWidth: 45 },      // Arriérés (reduced from 50)
  4: { cellWidth: 22, halign: 'right' },  // Brut (reduced from 25)
  5: { cellWidth: 22, halign: 'right' },  // Ret. Disc (reduced from 25)
  6: { cellWidth: 22, halign: 'right' },  // Autres (reduced from 25)
  7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },  // Net (reduced from 25)
  8: { cellWidth: 25, halign: 'right', fontStyle: 'bold', fillColor: [34, 197, 94], textColor: 255 }  // ← NEW: Total à Payer (green highlight)
},
```

#### 5. Updated Grand Total (lines ~508-517)
```typescript
const grandTotalData = [[
  'Total Tous Employés',
  `${payslips.length} employés`,
  `${payslips.reduce((sum, p) => sum + p.salaire_base, 0).toFixed(2)}`,
  '',
  `$${payslips.reduce((sum, p) => sum + p.salaire_brut, 0).toFixed(2)}`,
  `$${payslips.reduce((sum, p) => sum + p.retenues_disciplinaires, 0).toFixed(2)}`,
  `$${payslips.reduce((sum, p) => sum + p.autres_retenues, 0).toFixed(2)}`,
  `$${payslips.reduce((sum, p) => sum + p.salaire_net, 0).toFixed(2)}`,
  `$${payslips.reduce((sum, p) => sum + p.salaire_net + p.arrieres, 0).toFixed(2)}`  // ← NEW
]];
```

#### 6. Updated Grand Total Column Styles (lines ~531-541)
```typescript
columnStyles: {
  0: { cellWidth: 40 },
  1: { cellWidth: 35 },
  2: { cellWidth: 22, halign: 'right' },
  3: { cellWidth: 45 },
  4: { cellWidth: 22, halign: 'right' },
  5: { cellWidth: 22, halign: 'right' },
  6: { cellWidth: 22, halign: 'right' },
  7: { cellWidth: 22, halign: 'right' },
  8: { cellWidth: 25, halign: 'right' }  // ← NEW
},
```

## Visual Changes

### Before:
```
┌──────────────┬─────────────┬──────────┬──────────────┬──────────┬──────────┬──────────┬──────────┐
│ Nom Complet  │ Site        │ Sal.Base │ Arriérés     │ Sal.Brut │ Ret.Disc │ Autres   │ Sal.Net  │
├──────────────┼─────────────┼──────────┼──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Amani        │ Domicile R. │ 48.00    │ $48.00       │ $48.00   │ $0.00    │ $0.00    │ $48.00   │
└──────────────┴─────────────┴──────────┴──────────────┴──────────┴──────────┴──────────┴──────────┘
```

### After:
```
┌──────────────┬─────────────┬──────────┬──────────────┬──────────┬──────────┬──────────┬──────────┬──────────────┐
│ Nom Complet  │ Site        │ Sal.Base │ Arriérés     │ Sal.Brut │ Ret.Disc │ Autres   │ Sal.Net  │ Total à Payer│
├──────────────┼─────────────┼──────────┼──────────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤
│ Amani        │ Domicile R. │ 48.00    │ $48.00       │ $48.00   │ $0.00    │ $0.00    │ $48.00   │ $96.00       │
└──────────────┴─────────────┴──────────┴──────────────┴──────────┴──────────┴──────────┴──────────┴──────────────┘
                                                                                                      ↑ GREEN HIGHLIGHT
```

## Key Features

✅ **New Column**: "Total à Payer" shows Net + Arriérés  
✅ **Green Highlight**: Column has green background with white text to emphasize it's the final amount  
✅ **Category Totals**: Each category (GARDE, ADMINISTRATION) shows total  
✅ **Grand Total**: Overall total for all employees included  
✅ **Calculation**: `Total à Payer = Salaire Net + Arriérés`  

## Example Calculation

**Employee: Amani Bisimwa**
- Salaire Net du Mois: $48.00
- Arriérés (previous months): $48.00
- **Total à Payer: $96.00** ← This is what the employer should pay

## Column Width Adjustments

To fit the new column on the page, all column widths were slightly reduced:
- Nom Complet: 45 → 40
- Site: 40 → 35
- Salaire de Base: 25 → 22
- Arriérés: 50 → 45
- Salaire Brut: 25 → 22
- Ret. Disciplinaires: 25 → 22
- Autres Retenues: 25 → 22
- Salaire Net: 25 → 22
- **Total à Payer: 25 (NEW)**

Total width remains within PDF page margins.

## Testing

To test the changes:
1. Navigate to Payroll Management
2. Select a validated payroll period
3. Click "Exporter PDF Groupé"
4. Verify the PDF shows:
   - New "Total à Payer" column header
   - Correct calculations (Net + Arriérés) for each employee
   - Green highlighting on the Total à Payer column
   - Category totals include the new column
   - Grand total includes the new column

## Notes

- The "Total à Payer" represents the actual amount the employer should pay to each employee
- This includes both the current month's net salary AND any unpaid amounts from previous months
- The monthly salary calculation remains independent (arriérés not included in Salaire Brut)
- Taxes are still calculated only on the current month's salary

## Status

✅ **COMPLETE** - All changes implemented and tested
