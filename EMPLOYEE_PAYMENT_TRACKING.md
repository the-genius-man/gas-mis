# 💰 Employee Payment Tracking Feature

## Summary

Added a comprehensive payment tracking system to the Employee Details modal, allowing users to:
- View all pending payments (unpaid salaries) for an employee
- See payment summary statistics
- Record payments directly from the employee details
- View payment history

## Changes Made

### File: `src/components/HR/EmployeeDetailModal.tsx`

#### 1. Added New "Paiements" Tab

**New Tab Type:**
```typescript
type TabType = 'profile' | 'deployments' | 'leave' | 'equipment' | 'disciplinary' | 'payments';
```

**Tab Configuration:**
```typescript
{ id: 'payments' as TabType, label: 'Paiements', icon: DollarSign }
```

#### 2. Added State Management

**New State Variables:**
```typescript
const [unpaidSalaries, setUnpaidSalaries] = useState<any[]>([]);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedSalary, setSelectedSalary] = useState<any>(null);
```

#### 3. Load Unpaid Salaries

**Updated loadDetails Function:**
```typescript
const unpaid = await window.electronAPI.getSalairesImpayes({ 
  employe_id: employee.id 
});
setUnpaidSalaries(unpaid || []);
```

#### 4. Payments Tab Content

**Features:**
- **Summary Cards** showing:
  - Total Impayé (red card)
  - Partiellement Payé (yellow card)
  - Total Payé (green card)

- **Pending Payments List** showing:
  - Period (month/year)
  - Status badge (IMPAYE, PAYE_PARTIEL)
  - Montant Net Dû
  - Déjà Payé
  - Restant
  - Échéance date
  - "Payer" button

- **Payment History** showing:
  - Completed payments (PAYE_TOTAL)
  - Period and payment date
  - Amount paid

#### 5. Payment Modal Component

**New Component: PaymentModal**

**Features:**
- Displays salary information (employee, period, amounts)
- Payment form with fields:
  - Montant à Payer (with "pay full amount" button)
  - Date de Paiement
  - Mode de Paiement (Espèces, Virement, Chèque, Mobile Money)
  - Référence de Paiement
  - Notes
- Validation:
  - Amount must be positive
  - Amount cannot exceed remaining balance
- Calls `window.electronAPI.payerSalaire()`
- Refreshes data on success

## User Flow

### 1. View Employee Payments

1. Open employee details from HR module
2. Click "Paiements" tab
3. See summary cards with totals
4. View list of pending payments

### 2. Record a Payment

1. Click "Payer" button on a pending salary
2. Payment modal opens showing:
   - Employee name
   - Period (e.g., "Janvier 2026")
   - Montant Dû and Restant
3. Enter payment details:
   - Amount (defaults to full remaining amount)
   - Date
   - Payment method
   - Reference (optional)
   - Notes (optional)
4. Click "Enregistrer"
5. Payment is recorded
6. List refreshes automatically

### 3. View Payment History

1. Scroll down in Payments tab
2. See "Historique des Paiements" section
3. View all completed payments with dates

## UI Components

### Summary Cards

```
┌─────────────────────────────────────┐
│ TOTAL IMPAYÉ                        │
│ $144.00                             │
│ 3 période(s)                        │
└─────────────────────────────────────┘
```

### Pending Payment Card

```
┌─────────────────────────────────────────────────┐
│ Janvier 2026  [IMPAYE]                          │
│                                                 │
│ Montant Net Dû    Déjà Payé                   │
│ $48.00            $0.00                        │
│                                                 │
│ Restant           Échéance                     │
│ $48.00            15/02/2026                   │
│                                    [Payer]     │
└─────────────────────────────────────────────────┘
```

### Payment Modal

```
┌─────────────────────────────────────┐
│ Enregistrer un Paiement        [X]  │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Amani Bisimwa                   │ │
│ │ Période: Janvier 2026           │ │
│ │                                 │ │
│ │ Montant Dû    Restant          │ │
│ │ $48.00        $48.00           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Montant à Payer *                   │
│ $ [48.00]                           │
│ Payer le montant total              │
│                                     │
│ Date de Paiement *                  │
│ [2026-01-16]                        │
│                                     │
│ Mode de Paiement *                  │
│ [Espèces ▼]                         │
│                                     │
│ Référence de Paiement               │
│ [N° de transaction...]              │
│                                     │
│ Notes                               │
│ [Notes additionnelles...]           │
│                                     │
│ [Annuler]  [Enregistrer]           │
└─────────────────────────────────────┘
```

## Period Calculation

The system correctly calculates the payroll period from the due date:

```typescript
// date_echeance is 15th of month AFTER payroll period
// So January 2026 payroll has date_echeance = Feb 15, 2026

const echeanceDate = new Date(salary.date_echeance);
const periodMonth = echeanceDate.getMonth() === 0 ? 12 : echeanceDate.getMonth();
const periodYear = echeanceDate.getMonth() === 0 ? echeanceDate.getFullYear() - 1 : echeanceDate.getFullYear();
```

**Example:**
- Due Date: February 15, 2026
- Period: January 2026 ✅

## API Integration

### Get Unpaid Salaries
```typescript
window.electronAPI.getSalairesImpayes({ 
  employe_id: employee.id 
})
```

**Returns:**
```typescript
[
  {
    id: string,
    bulletin_paie_id: string,
    employe_id: string,
    periode_paie_id: string,
    matricule: string,
    nom_complet: string,
    montant_net_du: number,
    montant_paye: number,
    montant_restant: number,
    devise: string,
    date_echeance: string,
    statut: 'IMPAYE' | 'PAYE_PARTIEL' | 'PAYE_TOTAL',
    ...
  }
]
```

### Record Payment
```typescript
window.electronAPI.payerSalaire({
  salaire_impaye_id: string,
  montant_paye: number,
  devise: string,
  date_paiement: string,
  mode_paiement: 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY',
  reference_paiement: string | null,
  compte_tresorerie_id: null, // Not using treasury account
  effectue_par: string,
  notes: string | null
})
```

## Payment Status Flow

```
IMPAYE
  ↓ (partial payment)
PAYE_PARTIEL
  ↓ (remaining payment)
PAYE_TOTAL
```

## Features

### ✅ Implemented

1. **View Pending Payments**
   - List all unpaid salaries for employee
   - Show status (IMPAYE, PAYE_PARTIEL)
   - Display amounts (dû, payé, restant)
   - Show due dates

2. **Payment Summary**
   - Total unpaid amount
   - Partially paid amount
   - Total paid amount
   - Count of periods in each status

3. **Record Payments**
   - Pay full or partial amounts
   - Select payment method
   - Add payment reference
   - Add notes
   - Validation of amounts

4. **Payment History**
   - View completed payments
   - See payment dates
   - Track payment amounts

5. **Auto-Refresh**
   - Data refreshes after payment
   - Modal closes on success
   - Updated totals displayed

### ❌ Not Implemented (By Design)

1. **Treasury Integration**
   - Payments do NOT update treasury balance
   - `compte_tresorerie_id` set to `null`
   - Finance module handles treasury separately

2. **Expense Records**
   - Payments do NOT create expense records
   - Tracked separately in payroll system

## Benefits

### For HR/Payroll Staff:
- ✅ Quick access to employee payment status
- ✅ Record payments without leaving employee details
- ✅ See complete payment history
- ✅ Track partial payments

### For Management:
- ✅ Monitor unpaid salaries per employee
- ✅ Track payment progress
- ✅ Audit trail of all payments

### For Accounting:
- ✅ Separate tracking from general expenses
- ✅ Dedicated salary payment records
- ✅ Payment method and reference tracking

## Testing Scenarios

### Test Case 1: View Pending Payments
1. Open employee with unpaid salaries
2. Click "Paiements" tab
3. **Expected:** See list of pending payments with correct amounts

### Test Case 2: Pay Full Amount
1. Click "Payer" on a pending salary
2. Keep default amount (full remaining)
3. Select payment method
4. Click "Enregistrer"
5. **Expected:** 
   - Payment recorded
   - Status changes to PAYE_TOTAL
   - Moves to payment history
   - Summary cards update

### Test Case 3: Partial Payment
1. Click "Payer" on a pending salary
2. Enter partial amount (e.g., $20 of $48)
3. Record payment
4. **Expected:**
   - Status changes to PAYE_PARTIEL
   - Montant Payé shows $20
   - Restant shows $28
   - Still appears in pending list

### Test Case 4: Complete Partial Payment
1. Click "Payer" on partially paid salary
2. Pay remaining amount
3. **Expected:**
   - Status changes to PAYE_TOTAL
   - Moves to payment history
   - Summary updates

### Test Case 5: Multiple Periods
1. Employee with 3 unpaid months
2. Pay one month
3. **Expected:**
   - Only that month marked as paid
   - Other months remain unpaid
   - Summary shows correct totals

## Notes

- Payment modal uses z-index 60 to appear above employee details modal (z-index 50)
- Period calculation handles year boundaries correctly (Dec → Jan)
- Month names displayed in French
- Currency symbol ($) used throughout
- Validation prevents overpayment
- Loading states during API calls
- Error messages displayed in modal

## Status

✅ **COMPLETE** - Employee payment tracking fully implemented and integrated
