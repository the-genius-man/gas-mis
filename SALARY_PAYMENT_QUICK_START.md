# 🚀 Quick Start: Paying Guard Salaries

## Step-by-Step Guide

### Step 1: Access Salary Payment Module

1. Open the application
2. Click on **"Paie"** in the main navigation
3. Click on the **"Salaires Impayés"** tab

You'll see a dashboard with three summary cards and a list of unpaid salaries.

---

### Step 2: Review Unpaid Salaries

The table shows all unpaid salaries with:
- Employee name and matricule
- Period (month/year)
- Amount due, paid, and remaining
- Due date
- Status (Impayé, Partiel, Payé)

**Use the search bar** to find specific employees by name or matricule.

**Use the status filter** to show only:
- Impayé (unpaid)
- Paiement partiel (partially paid)
- Payé total (fully paid)

---

### Step 3: Record a Payment

#### For Full Payment:

1. Find the employee in the list
2. Click the **💳 (credit card)** icon in the Actions column
3. A payment modal will open showing:
   - Employee name
   - Remaining balance (Solde Restant)
4. Fill in the form:
   - **Montant à Payer**: Leave as is (full amount) or enter partial amount
   - **Date de Paiement**: Select payment date
   - **Mode de Paiement**: Choose payment method
     - Espèces (Cash)
     - Virement Bancaire (Bank Transfer)
     - Chèque (Check)
     - Mobile Money
   - **Référence de Paiement**: Enter reference (e.g., VIR-2026-001)
   - **Notes**: Add any notes (optional)
5. Click **"Enregistrer le Paiement"**
6. Confirm the payment
7. Done! The salary status will update automatically

#### For Partial Payment:

Same process, but:
- Enter a smaller amount in "Montant à Payer"
- The status will change to "Paiement partiel" (yellow badge)
- You can make additional payments later until fully paid

---

### Step 4: View Payment History

To see all payments made for a salary:

1. Find the employee in the list
2. Click the **👁️ (eye)** icon in the Actions column
3. A modal will show:
   - Employee details
   - Total amount due
   - Remaining balance
   - List of all payments with:
     - Payment number
     - Amount paid
     - Date
     - Payment method
     - Reference
     - Notes

---

## Example Scenarios

### Scenario 1: Pay Full Salary

**Employee:** Amani Bisimwa  
**Salary Due:** $500  
**Action:** Pay full amount

1. Click 💳 icon
2. Amount: $500 (already filled)
3. Date: 2026-01-15
4. Method: Virement Bancaire
5. Reference: VIR-2026-001
6. Click "Enregistrer le Paiement"

**Result:** Status changes to 🟢 Payé (green badge)

---

### Scenario 2: Pay Partial Salary

**Employee:** Chantal Mwamini  
**Salary Due:** $800  
**Action:** Pay $500 now, rest later

**First Payment:**
1. Click 💳 icon
2. Amount: $500
3. Date: 2026-01-15
4. Method: Espèces
5. Click "Enregistrer le Paiement"

**Result:** 
- Status: 🟡 Partiel (yellow badge)
- Remaining: $300

**Second Payment (later):**
1. Click 💳 icon again
2. Amount: $300 (remaining balance)
3. Date: 2026-01-25
4. Method: Mobile Money
5. Click "Enregistrer le Paiement"

**Result:** Status changes to 🟢 Payé (green badge)

---

### Scenario 3: Multiple Employees, Same Day

**Action:** Pay 5 employees on payday

1. Filter by status: "Impayé"
2. For each employee:
   - Click 💳 icon
   - Verify amount
   - Enter same date (e.g., 2026-01-31)
   - Select payment method
   - Enter reference (VIR-2026-001, VIR-2026-002, etc.)
   - Click "Enregistrer le Paiement"
3. All salaries updated at once

---

## Dashboard Summary Cards

### Total Dû (Blue Card)
Shows total amount owed to all employees across all periods.

### Total Payé (Green Card)
Shows total amount already paid to employees.

### Solde Restant (Red Card)
Shows remaining balance to be paid. This is your current liability.

**Goal:** Keep "Solde Restant" as low as possible by paying salaries on time.

---

## Payment Methods Explained

### Espèces (Cash)
- Direct cash payment to employee
- No reference needed (but recommended for tracking)
- Use for small amounts or emergency payments

### Virement Bancaire (Bank Transfer)
- Electronic transfer to employee's bank account
- **Always enter reference** (transaction ID)
- Most common method for regular salaries

### Chèque (Check)
- Payment by check
- Enter check number as reference
- Less common but available

### Mobile Money
- Payment via mobile money services (M-Pesa, Orange Money, etc.)
- Enter transaction ID as reference
- Popular in DRC

---

## Tips for Efficient Payment Processing

### 1. Batch Payments
Pay multiple employees on the same day (e.g., end of month) to streamline the process.

### 2. Use Consistent References
Format: `VIR-YYYY-NNN` (e.g., VIR-2026-001, VIR-2026-002)
- VIR = Virement (transfer)
- YYYY = Year
- NNN = Sequential number

### 3. Add Notes for Special Cases
Use the notes field for:
- "Paiement anticipé" (advance payment)
- "Paiement retardé - raison X" (delayed payment - reason X)
- "Paiement partiel - accord avec employé" (partial payment - agreed with employee)

### 4. Check Payment History Before Paying
Click 👁️ icon to verify no duplicate payments.

### 5. Use Search for Quick Access
Type employee name or matricule to quickly find their salary.

---

## Common Questions

### Q: Can I pay more than the remaining balance?
**A:** No, the system prevents overpayment. Maximum amount is the "Solde Restant".

### Q: Can I delete a payment if I made a mistake?
**A:** Currently, payments cannot be deleted through the UI. Contact system administrator if needed.

### Q: What happens if I pay partial amount?
**A:** The status changes to "Paiement partiel" (yellow badge). You can make additional payments until fully paid.

### Q: Can I see all payments for all employees?
**A:** Yes, go to Paie → Rapports for comprehensive payment reports.

### Q: When are unpaid salaries created?
**A:** Automatically when you validate payslips in the Paie module.

---

## Keyboard Shortcuts

- **Tab** - Navigate between form fields
- **Enter** - Submit payment form (when focused on button)
- **Esc** - Close modal

---

## Status Badges Explained

| Badge | Status | Meaning |
|-------|--------|---------|
| 🔴 Impayé | IMPAYE | Not paid at all |
| 🟡 Partiel | PAYE_PARTIEL | Partially paid, balance remaining |
| 🟢 Payé | PAYE_TOTAL | Fully paid, no balance |

---

## What's Next?

After paying salaries:

1. ✅ **Verify payments** - Check payment history (👁️ icon)
2. ✅ **Generate reports** - Go to Paie → Rapports
3. ✅ **Check OHADA summary** - View Account 422 balance
4. ✅ **Export records** - Use Excel export in reports

---

## Need Help?

If you encounter issues:

1. Check browser console (F12) for error messages
2. Verify employee has unpaid salary in the list
3. Ensure payment amount is valid (≤ remaining balance)
4. Try refreshing the page
5. Refer to `SALARY_PAYMENT_GUIDE.md` for detailed documentation

---

## Summary

✅ Access: Paie → Salaires Impayés  
✅ Pay: Click 💳 icon → Fill form → Submit  
✅ History: Click 👁️ icon → View all payments  
✅ Track: Use summary cards and status badges  

The salary payment system is ready to use immediately!
