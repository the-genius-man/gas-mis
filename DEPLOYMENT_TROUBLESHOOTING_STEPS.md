# 🔍 Deployment Troubleshooting - Step by Step Guide

## Issue: Bulk Payslip PDF Shows "Non affecté" Instead of Site Names

Let's systematically check each part of the data flow to identify where the issue is.

---

## Step 1: Check Browser Console Logs

When you click "Exporter PDF", the console should show detailed logs. Look for:

```
Starting PDF export for period: 1 2026
Number of payslips: 5
Employee IDs: ['emp-123', 'emp-456', ...]
Getting deployment for employee 1/5: emp-123
Found deployment: Site Alpha  ← Should see this
OR
Found employee site: Site Beta  ← Or this
OR
No site found for employee: emp-123  ← Problem if you see this
```

**What to check:**
- Are you seeing "No site found" for all employees?
- Are there any error messages?
- Copy the console output and share it

---

## Step 2: Verify Database Has Deployment Data

Open the browser console and run these queries to check the database:

### Query 1: Check if employees have site assignments

```javascript
// In browser console
await window.electronAPI.getEmployeesGAS().then(emps => {
  console.table(emps.map(e => ({
    Nom: e.nom_complet,
    Matricule: e.matricule,
    'Site ID': e.site_affecte_id,
    'Site Nom': e.site_nom,
    Statut: e.statut
  })));
});
```

**Expected Result:**
- Should show site_affecte_id and site_nom for deployed employees
- If both are NULL, employees don't have site assignments

### Query 2: Check if deployment records exist

```javascript
// Check a specific employee's deployments
const employeeId = 'emp-xxx'; // Replace with actual ID
await window.electronAPI.getEmployeeDeployments(employeeId).then(deps => {
  console.table(deps.map(d => ({
    Site: d.nom_site,
    'Date Début': d.date_debut,
    'Date Fin': d.date_fin,
    Actif: d.est_actif,
    Poste: d.poste
  })));
});
```

**Expected Result:**
- Should show at least one deployment with est_actif = 1
- If empty, no deployment records exist

### Query 3: Check current deployment directly

```javascript
// Test getCurrentDeployment for a specific employee
const employeeId = 'emp-xxx'; // Replace with actual ID
await window.electronAPI.getCurrentDeployment(employeeId).then(dep => {
  console.log('Current Deployment:', dep);
});
```

**Expected Result:**
- Should return an object with nom_site property
- If null, no active deployment exists

---

## Step 3: Check Database Directly (Electron Console)

If the browser console doesn't help, check the Electron main process console (where you started the app).

Look for these logs:
```
getSalairesImpayes called with filters: { employe_id: 'emp-123' }
Using simple employee query
Query executed successfully, returned X records
```

---

## Step 4: Manual Database Inspection

If you have access to the SQLite database file, run these SQL queries:

### Query 1: Check employees table
```sql
SELECT 
  id,
  matricule,
  nom_complet,
  site_affecte_id,
  statut
FROM employees_gas
WHERE statut = 'ACTIF'
LIMIT 10;
```

### Query 2: Check deployment history
```sql
SELECT 
  h.id,
  h.employe_id,
  e.nom_complet,
  h.site_id,
  s.nom_site,
  h.date_debut,
  h.date_fin,
  h.est_actif
FROM historique_deployements h
LEFT JOIN employees_gas e ON h.employe_id = e.id
LEFT JOIN sites_gas s ON h.site_id = s.id
WHERE h.est_actif = 1
LIMIT 10;
```

### Query 3: Check sites table
```sql
SELECT 
  id,
  nom_site,
  client_id,
  est_actif
FROM sites_gas
WHERE est_actif = 1
LIMIT 10;
```

---

## Step 5: Common Issues & Solutions

### Issue 1: No Deployment Records Exist

**Symptom:** `historique_deployements` table is empty or has no active deployments

**Solution:** Create deployments for employees

```javascript
// For each employee that needs a deployment
await window.electronAPI.createDeployment({
  employe_id: 'emp-123',
  site_id: 'site-456',
  date_debut: '2025-01-01',
  poste: 'JOUR',
  motif_affectation: 'EMBAUCHE',
  notes: 'Initial deployment'
});
```

### Issue 2: site_affecte_id is NULL

**Symptom:** Employees have NULL in site_affecte_id column

**Solution:** Update employees with site assignments

```javascript
// Update employee with site
await window.electronAPI.updateEmployeeGAS({
  id: 'emp-123',
  site_affecte_id: 'site-456',
  // ... other employee fields
});
```

### Issue 3: Multiple Active Deployments

**Symptom:** More than one deployment with est_actif = 1 for same employee

**Solution:** Close old deployments (need to run SQL directly)

```sql
-- Find duplicates
SELECT employe_id, COUNT(*) as count
FROM historique_deployements
WHERE est_actif = 1
GROUP BY employe_id
HAVING count > 1;

-- Close old deployments (keep only the most recent)
UPDATE historique_deployements
SET est_actif = 0, date_fin = date('now')
WHERE id IN (
  SELECT id FROM historique_deployements h1
  WHERE est_actif = 1
  AND EXISTS (
    SELECT 1 FROM historique_deployements h2
    WHERE h2.employe_id = h1.employe_id
    AND h2.est_actif = 1
    AND h2.date_debut > h1.date_debut
  )
);
```

### Issue 4: Sites Don't Exist

**Symptom:** site_id references don't exist in sites_gas table

**Solution:** Create missing sites

```javascript
await window.electronAPI.addSiteGAS({
  id: 'site-456',
  client_id: 'client-123',
  nom_site: 'Site Alpha',
  adresse_physique: '123 Main St',
  effectif_jour_requis: 2,
  effectif_nuit_requis: 1,
  est_actif: 1
});
```

### Issue 5: API Functions Not Available

**Symptom:** `window.electronAPI.getCurrentDeployment is not a function`

**Solution:** Check TypeScript definitions and preload file

Verify in `public/preload.cjs`:
```javascript
getCurrentDeployment: (employeId) => ipcRenderer.invoke('db-get-current-deployment', employeId),
```

---

## Step 6: Test Individual Components

### Test 1: Test getCurrentDeployment

```javascript
// In browser console
const testEmployeeId = 'emp-xxx'; // Use actual employee ID
console.log('Testing getCurrentDeployment...');
const result = await window.electronAPI.getCurrentDeployment(testEmployeeId);
console.log('Result:', result);
console.log('Has nom_site?', result?.nom_site);
```

### Test 2: Test getEmployeeGAS

```javascript
// In browser console
const testEmployeeId = 'emp-xxx'; // Use actual employee ID
console.log('Testing getEmployeeGAS...');
const result = await window.electronAPI.getEmployeeGAS(testEmployeeId);
console.log('Result:', result);
console.log('Has site_nom?', result?.site_nom);
console.log('site_affecte_id:', result?.site_affecte_id);
```

### Test 3: Test Full Export Flow

```javascript
// In browser console - simulate what PDF export does
const payslips = await window.electronAPI.getPayslips('period-id-here');
console.log('Payslips:', payslips.length);

const employeeIds = payslips.map(p => p.employe_id);
console.log('Employee IDs:', employeeIds);

// Test deployment retrieval for first employee
const firstId = employeeIds[0];
console.log('Testing first employee:', firstId);

const deployment = await window.electronAPI.getCurrentDeployment(firstId);
console.log('Deployment:', deployment);

if (!deployment || !deployment.nom_site) {
  console.log('Trying fallback...');
  const employee = await window.electronAPI.getEmployeeGAS(firstId);
  console.log('Employee:', employee);
  console.log('Site from employee:', employee?.site_nom);
}
```

---

## Step 7: Quick Fix Script

If you need to quickly create deployments for all employees with site assignments:

```javascript
// Run in browser console
async function createMissingDeployments() {
  const employees = await window.electronAPI.getEmployeesGAS();
  
  for (const emp of employees) {
    if (emp.site_affecte_id && emp.statut === 'ACTIF') {
      // Check if deployment exists
      const currentDep = await window.electronAPI.getCurrentDeployment(emp.id);
      
      if (!currentDep) {
        console.log(`Creating deployment for ${emp.nom_complet}...`);
        try {
          await window.electronAPI.createDeployment({
            employe_id: emp.id,
            site_id: emp.site_affecte_id,
            date_debut: emp.date_embauche || '2025-01-01',
            poste: 'JOUR',
            motif_affectation: 'EMBAUCHE',
            notes: 'Auto-created deployment'
          });
          console.log(`✅ Created deployment for ${emp.nom_complet}`);
        } catch (error) {
          console.error(`❌ Failed for ${emp.nom_complet}:`, error);
        }
      } else {
        console.log(`✓ ${emp.nom_complet} already has deployment`);
      }
    }
  }
  console.log('Done!');
}

// Run it
createMissingDeployments();
```

---

## What to Share for Further Help

If the issue persists, please share:

1. **Browser Console Output** when clicking "Exporter PDF"
2. **Results from Step 2 queries** (employee and deployment data)
3. **Any error messages** from browser or Electron console
4. **Sample data** showing:
   - How many employees you have
   - How many have site_affecte_id set
   - How many have active deployments

This will help identify exactly where the data flow is breaking.

