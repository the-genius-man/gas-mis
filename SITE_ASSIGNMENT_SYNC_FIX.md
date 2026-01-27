# Site Assignment Synchronization Fix

## Problem Description

**Issue**: Data inconsistency between employee list view and employee details view for site assignments.

### Symptoms Observed:
- **Employee List**: Shows "Non affecté" (Not assigned) in the SITE AFFECTÉ column
- **Employee Details**: Shows active deployment to a specific site (e.g., "Residence Baudouoin")

### Root Cause:
The application uses **two different data sources** for site information:

1. **Employee List Query** (`getEmployeesGAS`):
   ```sql
   SELECT e.*, s.nom_site as site_nom
   FROM employees_gas e
   LEFT JOIN sites_gas s ON e.site_affecte_id = s.id  -- Uses site_affecte_id
   ```

2. **Employee Details Query** (`getCurrentDeployment`):
   ```sql
   SELECT h.*, s.nom_site
   FROM historique_deployements h
   LEFT JOIN sites_gas s ON h.site_id = s.id  -- Uses deployment site_id
   WHERE h.employe_id = ? AND h.est_actif = 1
   ```

### Data Inconsistency:
- `employees_gas.site_affecte_id` = NULL or incorrect value
- `historique_deployements.site_id` = Correct active deployment site
- **Result**: Two different views show different information

## Solution Implemented

### 1. Enhanced Data Consistency Check
Added new issue detection in `db-check-data-consistency`:

```javascript
// Check for employees with active deployments but mismatched site_affecte_id
const employeesWithMismatchedSites = db.prepare(`
  SELECT 
    e.id, e.nom_complet, e.matricule,
    e.site_affecte_id as employee_site_id,
    s1.nom_site as employee_site_name,
    h.site_id as deployment_site_id,
    s2.nom_site as deployment_site_name
  FROM employees_gas e
  JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
  LEFT JOIN sites_gas s1 ON e.site_affecte_id = s1.id
  JOIN sites_gas s2 ON h.site_id = s2.id
  WHERE e.poste != 'ROTEUR' 
    AND e.statut = 'ACTIF'
    AND (e.site_affecte_id IS NULL OR e.site_affecte_id != h.site_id)
`).all();
```

### 2. New Sync Function
Added `db-sync-site-assignments` handler:

```javascript
// Update employees_gas.site_affecte_id to match their active deployment
const result = db.prepare(`
  UPDATE employees_gas 
  SET site_affecte_id = (
    SELECT h.site_id 
    FROM historique_deployements h 
    WHERE h.employe_id = employees_gas.id AND h.est_actif = 1
  ),
  modifie_le = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT e.id
    FROM employees_gas e
    JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
    WHERE e.poste != 'ROTEUR' 
      AND e.statut = 'ACTIF'
      AND (e.site_affecte_id IS NULL OR e.site_affecte_id != h.site_id)
  )
`).run();
```

### 3. Updated Maintenance Tab UI
Added new section in Settings → Maintenance:

- **"Synchronisation des Affectations de Site"** button
- Detects and fixes site assignment mismatches
- Shows count of employees synchronized
- Automatically re-runs consistency check after sync

## How to Fix the Issue

### Option 1: Use Maintenance Tab (Recommended)
1. Open the application
2. Go to **Settings** → **Maintenance** tab (Admin only)
3. Click **"Vérifier"** to check for issues
4. Look for **"Employés avec incohérence entre site_affecte_id et déploiement actif"**
5. Click **"Synchroniser"** in the **"Synchronisation des Affectations de Site"** section
6. Verify the fix by checking the employee list again

### Option 2: Direct Database Query
Run this SQL query directly on the database:

```sql
UPDATE employees_gas 
SET site_affecte_id = (
  SELECT h.site_id 
  FROM historique_deployements h 
  WHERE h.employe_id = employees_gas.id AND h.est_actif = 1
),
modifie_le = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT e.id
  FROM employees_gas e
  JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
  WHERE e.poste != 'ROTEUR' 
    AND e.statut = 'ACTIF'
    AND (e.site_affecte_id IS NULL OR e.site_affecte_id != h.site_id)
);
```

## Expected Result

After applying the fix:
- **Chantal Mwamini** should show **"Residence Baudouoin"** in both the employee list and details view
- All employees with active deployments will have consistent site information across all views
- The maintenance tab will show **"Aucun problème de cohérence détecté"**

## Prevention

This fix also ensures that future employee updates maintain data consistency by:
1. Automatically updating `site_affecte_id` when deployments are created/updated
2. Regular consistency checks available in the maintenance tab
3. Enhanced error detection for similar issues

## Files Modified

1. **`electron/main.js`**:
   - Enhanced `db-check-data-consistency` with new issue type
   - Added `db-sync-site-assignments` handler

2. **`electron/preload.js`**:
   - Added `syncSiteAssignments` method

3. **`src/components/Settings/SettingsPage.tsx`**:
   - Added sync functionality to MaintenanceTab
   - Added UI for site assignment synchronization
   - Added display for new issue type

## Technical Details

### Data Flow:
1. **Employee Creation**: `site_affecte_id` → Auto-create deployment
2. **Employee Update**: Site change → Close old deployment → Create new deployment → Update `site_affecte_id`
3. **Deployment Management**: Create/End deployment → Update `site_affecte_id`

### Consistency Rules:
- `employees_gas.site_affecte_id` should always match `historique_deployements.site_id` for active deployments
- ROTEUR employees must have `site_affecte_id = NULL`
- Only one active deployment per employee (`est_actif = 1`)

This fix resolves the immediate data inconsistency while providing tools to prevent and detect similar issues in the future.