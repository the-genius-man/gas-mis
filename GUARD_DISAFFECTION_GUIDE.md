# How to Disaffect a Guard from a Site - UI Guide

## Overview
There are multiple ways to remove a guard's site assignment through the UI. Here's a comprehensive guide for each method.

## Method 1: Employee Form (Edit Employee) ⭐ **Recommended**

### Steps:
1. **Navigate to**: HR → Agents/Employees
2. **Find the employee** in the list
3. **Click the "Modifier" (Edit) button** (pencil icon)
4. **In the Employee Form**:
   - Scroll to the **"Site Affecté"** dropdown field
   - Select **"Non affecté"** from the dropdown
   - Click **"Enregistrer"** (Save)

### What Happens:
- ✅ Employee's `site_affecte_id` becomes NULL
- ✅ Active deployment is automatically closed
- ✅ Employee remains active but unassigned
- ✅ Deployment history is preserved

### Best For:
- Permanent removal from site
- Administrative changes
- Quick unassignment

---

## Method 2: End Deployment (Enhanced) ⭐ **NEW FEATURE**

### Steps:
1. **Navigate to**: HR → Agents/Employees
2. **Click on an employee** to open their details modal
3. **Go to the "Déploiements" tab**
4. **In the "Déploiement Actuel" section**, click **"Terminer"** button
5. **In the End Deployment Modal**:
   - Set the **end date**
   - Add **notes/reason** for ending the deployment
   - Click **"Terminer le Déploiement"**

### What Happens:
- ✅ Current deployment is ended with specified date
- ✅ Employee's `site_affecte_id` becomes NULL
- ✅ Deployment history shows end date and reason
- ✅ Employee remains active but unassigned

### Best For:
- Controlled end date (not necessarily today)
- Detailed record keeping with reasons
- Formal deployment termination

---

## Method 3: Transfer to Another Site

### Steps:
1. **Navigate to**: HR → Agents/Employees
2. **Click on an employee** to open their details modal
3. **Go to the "Déploiements" tab**
4. **Click "Transférer / Affecter"** button
5. **In the Deployment Form**:
   - Select the **new site** from dropdown
   - Set transfer details (date, reason, notes)
   - Click **"Transférer"**

### What Happens:
- ✅ Current deployment is automatically closed
- ✅ New deployment is created at the new site
- ✅ Employee's `site_affecte_id` is updated to new site
- ✅ Complete transfer history is maintained

### Best For:
- Moving guard to a different site
- Site reorganization
- Client requests for specific guards

---

## Method 4: Employee Termination (Removes from Site)

### Steps:
1. **Navigate to**: HR → Agents/Employees
2. **Find the employee** and click the **action menu (⋮)**
3. **Select "Terminer le contrat"**
4. **In the termination dialog**:
   - ✅ **Check** the box **"Retirer l'affectation du site"**
   - Select termination reason
   - Click confirm

### What Happens:
- ⚠️ Employee status becomes 'TERMINE'
- ✅ Site assignment is removed (if checkbox checked)
- ✅ Active deployment is closed
- ❌ Employee is no longer active

### Best For:
- Employee leaving the company
- Contract termination
- **NOT recommended** for simple site removal

---

## Method 5: Change Employee Role to ROTEUR

### Steps:
1. **Navigate to**: HR → Agents/Employees
2. **Click "Modifier" (Edit)** on the employee
3. **In the Employee Form**:
   - Change **"Poste"** to **"ROTEUR"**
   - Click **"Enregistrer"**

### What Happens:
- ✅ Site assignment is automatically cleared (ROTEUR cannot have fixed sites)
- ✅ Active deployment is closed
- ✅ Employee becomes available for rotational assignments

### Best For:
- Converting fixed guards to rotational guards
- Operational flexibility
- Temporary unassignment with future rotation plans

---

## Quick Reference Table

| Method | Employee Status | Site Assignment | Deployment | Best Use Case |
|--------|----------------|-----------------|------------|---------------|
| **Edit Employee Form** | Active | Removed | Closed | Quick unassignment |
| **End Deployment** | Active | Removed | Ended with date/reason | Formal termination |
| **Transfer** | Active | Changed | Closed → New | Move to different site |
| **Terminate Contract** | Terminated | Removed | Closed | Employee leaving |
| **Change to ROTEUR** | Active | Removed | Closed | Role change |

---

## UI Locations Summary

### Main Employee List
- **Path**: HR → Agents/Employees
- **Actions Available**: Edit, Terminate, View Details

### Employee Details Modal
- **Path**: Click on employee → Déploiements tab
- **Actions Available**: Transfer/Assign, End Deployment (NEW)

### Employee Form
- **Path**: Edit employee → Site Affecté dropdown
- **Actions Available**: Change site assignment, Set to "Non affecté"

---

## Data Impact

### When a Guard is Disaffected:
1. **`employees_gas.site_affecte_id`** → NULL
2. **`historique_deployements.est_actif`** → 0 (inactive)
3. **`historique_deployements.date_fin`** → Set to end date
4. **Employee status** → Remains 'ACTIF' (unless terminated)

### Site Capacity:
- Site capacity count is automatically updated
- Other guards can now be assigned to fill the vacancy
- Site shows reduced guard count in capacity displays

---

## Best Practices

1. **Use Method 1 (Edit Employee)** for quick administrative changes
2. **Use Method 2 (End Deployment)** for formal record keeping
3. **Use Method 3 (Transfer)** when moving to another site
4. **Avoid Method 4 (Termination)** unless employee is actually leaving
5. **Always add notes** when ending deployments for audit trail
6. **Check site capacity** after removing guards to ensure coverage

---

## Enhanced Feature Added

The **"End Deployment"** functionality has been enhanced with:
- ✅ **"Terminer" button** in current deployment section
- ✅ **End Deployment Modal** with date and reason fields
- ✅ **Proper validation** and confirmation
- ✅ **Clear visual feedback** about the action
- ✅ **Automatic refresh** of deployment history

This provides a dedicated, user-friendly way to formally end a guard's site assignment while maintaining complete audit trails.