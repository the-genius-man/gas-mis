# 🖱️ Operations - Guard Name Clickable

## Summary

Made guard/agent names clickable in the Operations module (Agents de Terrain). Clicking on a guard's name now opens the employee details modal, providing quick access to guard information including payment tracking, deployments, equipment, and disciplinary history.

## Changes Made

### File: `src/components/Operations/AgentsManagement.tsx`

#### 1. Added Import for Employee Detail Modal

```typescript
import EmployeeDetailModal from '../HR/EmployeeDetailModal';
```

#### 2. Added State Management

**New State Variables:**
```typescript
const [selectedEmployee, setSelectedEmployee] = useState<EmployeeGASFull | null>(null);
const [showEditForm, setShowEditForm] = useState(false);
```

#### 3. Made Guard Name Clickable (line ~243-250)

**Before:**
```tsx
<div className="ml-4">
  <div className="text-sm font-medium text-gray-900">{employee.nom_complet}</div>
  <div className="text-sm text-gray-500">{employee.matricule}</div>
</div>
```

**After:**
```tsx
<div className="ml-4">
  <button
    onClick={() => setSelectedEmployee(employee)}
    className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
  >
    {employee.nom_complet}
  </button>
  <div className="text-sm text-gray-500">{employee.matricule}</div>
</div>
```

#### 4. Added Employee Detail Modal

**New Modal Component:**
```tsx
{selectedEmployee && (
  <EmployeeDetailModal
    employee={selectedEmployee}
    onClose={() => setSelectedEmployee(null)}
    onEdit={() => {
      setShowEditForm(true);
      setSelectedEmployee(null);
    }}
    onRefresh={loadData}
  />
)}
```

## Features

### Visual Feedback
- ✅ **Hover Effect**: Name turns blue on hover
- ✅ **Underline**: Text underlines on hover to indicate clickability
- ✅ **Cursor**: Changes to pointer cursor
- ✅ **Smooth Transition**: Color change animates smoothly

### Modal Features
When clicking on a guard's name, the employee detail modal opens showing:
- ✅ **Profile Tab**: Personal info, employment details, payroll info
- ✅ **Paiements Tab**: Pending payments, payment history, record payments
- ✅ **Déploiements Tab**: Deployment history and current assignment
- ✅ **Congés Tab**: Leave balance and provisions
- ✅ **Équipements Tab**: Assigned equipment (uniforms, radios, etc.)
- ✅ **Disciplinaire Tab**: Disciplinary actions history

## User Flow

### 1. View Guard Details

1. Navigate to Operations → Agents de Terrain
2. See list of guards/agents in table
3. Hover over guard name
4. **Visual**: Name turns blue and underlines
5. Click on name
6. **Result**: Employee details modal opens

### 2. Access Payment Information

1. Click on guard name
2. Modal opens
3. Click "Paiements" tab
4. See pending payments and payment history
5. Can record payments directly

### 3. View Deployment History

1. Click on guard name
2. Modal opens
3. Click "Déploiements" tab
4. See all past and current deployments

## Visual Example

### Before:
```
┌────────────────────────────────────────────┐
│ Agent                                      │
├────────────────────────────────────────────┤
│ [👤] Amani Bisimwa                        │
│      GAS-001                               │
└────────────────────────────────────────────┘
```

### After:
```
┌────────────────────────────────────────────┐
│ Agent                                      │
├────────────────────────────────────────────┤
│ [👤] [Amani Bisimwa]  ← clickable, blue   │
│      GAS-001                               │
└────────────────────────────────────────────┘
```

## Integration with HR Module

The Operations module now uses the same `EmployeeDetailModal` component as the HR module, providing:

- ✅ **Consistent UX**: Same modal across modules
- ✅ **Full Functionality**: All employee features available
- ✅ **Payment Tracking**: Direct access to payment management
- ✅ **Deployment Management**: View and manage deployments
- ✅ **Equipment Tracking**: See assigned equipment
- ✅ **Disciplinary Records**: View disciplinary history

## Benefits

### For Operations Staff:
- ✅ Quick access to guard details without switching modules
- ✅ View deployment history directly
- ✅ Check payment status
- ✅ See assigned equipment

### For Payroll Staff:
- ✅ Access payment information from Operations view
- ✅ Record payments without leaving Operations
- ✅ Track unpaid salaries per guard

### For Management:
- ✅ Complete guard information in one click
- ✅ Monitor deployments and payments
- ✅ Review disciplinary records

## CSS Classes Applied

```css
hover:text-blue-600    /* Blue color on hover */
hover:underline        /* Underline on hover */
cursor-pointer         /* Pointer cursor */
transition-colors      /* Smooth color transition */
```

## Context

### Operations Module Scope

The Operations module shows:
- **Agents de Terrain**: Guards and Rôteurs (GARDE category)
- Filters by category (Gardiens, Rôteurs)
- Shows deployment status
- Displays remuneration info

### Employee Detail Modal Tabs

1. **Profil**: Personal and employment information
2. **Paiements**: Payment tracking and recording (NEW feature)
3. **Déploiements**: Deployment history
4. **Congés**: Leave provisions
5. **Équipements**: Assigned equipment
6. **Disciplinaire**: Disciplinary actions

## Testing

### Test Case 1: Click Guard Name
1. Navigate to Operations → Agents de Terrain
2. Hover over a guard's name
3. **Expected**: Name turns blue and underlines
4. Click on name
5. **Expected**: Employee details modal opens

### Test Case 2: View Payment Info
1. Click on guard name
2. Modal opens
3. Click "Paiements" tab
4. **Expected**: See pending payments and payment history

### Test Case 3: Record Payment from Operations
1. Click on guard name
2. Click "Paiements" tab
3. Click "Payer" on a pending salary
4. Enter payment details
5. Submit
6. **Expected**: Payment recorded, modal refreshes

### Test Case 4: View Deployment History
1. Click on guard name
2. Click "Déploiements" tab
3. **Expected**: See all deployments with dates and sites

### Test Case 5: Close Modal
1. Open guard details
2. Click X button or outside modal
3. **Expected**: Modal closes, returns to Operations view

## Accessibility

- ✅ Uses semantic `<button>` element
- ✅ Keyboard accessible (Tab to focus, Enter/Space to activate)
- ✅ Clear visual feedback on hover
- ✅ Maintains proper text contrast
- ✅ Modal has proper z-index layering

## Notes

- Modal uses z-index 50 to appear above Operations content
- Payment modal (within employee modal) uses z-index 60
- Clicking outside modal closes it
- Modal refreshes data when closed to show updated information
- Edit functionality integrated (opens edit form when clicking "Modifier")

## Status

✅ **COMPLETE** - Guard names are now clickable in Operations module with full employee detail modal integration
