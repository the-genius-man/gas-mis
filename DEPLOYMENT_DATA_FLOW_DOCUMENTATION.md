# 📊 Guard Deployment Data Flow - Complete Documentation

## Overview

This document explains how guard deployments are stored in the database and how the bulk payslip PDF export accesses the current deployed site information.

---

## 🗄️ Database Schema

### **1. Employee Storage (`employees_gas` table)**

```sql
CREATE TABLE employees_gas (
  id TEXT PRIMARY KEY,
  matricule TEXT UNIQUE NOT NULL,
  nom_complet TEXT NOT NULL,
  categorie TEXT CHECK(categorie IN ('GARDE', 'ADMINISTRATION')),
  poste TEXT CHECK(poste IN ('GARDE', 'ROTEUR', ...)),
  site_affecte_id TEXT REFERENCES sites_gas(id),  -- ⭐ Current site assignment
  salaire_base REAL DEFAULT 0,
  statut TEXT CHECK(statut IN ('ACTIF', 'INACTIF', 'SUSPENDU', 'TERMINE')),
  -- ... other fields
)
```

**Key Field:**
- `site_affecte_id`: Stores the current site where the employee is assigned

### **2. Deployment History (`historique_deployements` table)**

```sql
CREATE TABLE historique_deployements (
  id TEXT PRIMARY KEY,
  employe_id TEXT NOT NULL REFERENCES employees_gas(id),
  site_id TEXT NOT NULL REFERENCES sites_gas(id),
  date_debut TEXT NOT NULL,
  date_fin TEXT,                    -- NULL if deployment is active
  poste TEXT CHECK(poste IN ('JOUR', 'NUIT', 'MIXTE')),
  motif_affectation TEXT CHECK(motif_affectation IN (
    'EMBAUCHE', 'TRANSFERT', 'DEMANDE_CLIENT', 
    'DISCIPLINAIRE', 'REORGANISATION', 'AUTRE'
  )),
  notes TEXT,
  est_actif INTEGER DEFAULT 1,      -- ⭐ 1 = active deployment, 0 = ended
  cree_par TEXT,
  cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
  modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
)
```

**Key Fields:**
- `est_actif`: Indicates if this is the current active deployment (1) or historical (0)
- `date_fin`: NULL for active deployments, has a date when deployment ends

### **3. Sites (`sites_gas` table)**

```sql
CREATE TABLE sites_gas (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  nom_site TEXT NOT NULL,           -- ⭐ Site name displayed in PDF
  adresse_physique TEXT,
  effectif_jour_requis INTEGER,
  effectif_nuit_requis INTEGER,
  est_actif INTEGER DEFAULT 1,
  -- ... other fields
)
```

**Key Field:**
- `nom_site`: The site name that appears in the PDF export

---

## 🔄 How Deployments Are Created

### **Method 1: During Employee Creation**

**File:** `public/electron.cjs` - `db-create-employee-gas` handler

```javascript
// When creating a new employee with a site assignment
if (employee.site_affecte_id) {
  const deploymentId = 'dep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  db.prepare(`
    INSERT INTO historique_deployements (
      id, employe_id, site_id, date_debut, poste, motif_affectation, est_actif
    ) VALUES (?, ?, ?, ?, ?, 'EMBAUCHE', 1)
  `).run(deploymentId, employee.id, employee.site_affecte_id, employee.date_embauche, 'JOUR');
}
```

**What Happens:**
1. Employee is created with `site_affecte_id` set
2. A deployment record is automatically created in `historique_deployements`
3. The deployment is marked as active (`est_actif = 1`)
4. Motif is set to 'EMBAUCHE' (new hire)

### **Method 2: During Employee Update (Transfer)**

**File:** `public/electron.cjs` - `db-update-employee-gas` handler

```javascript
// When updating employee's site assignment
if (employee.site_affecte_id !== currentEmployee.site_affecte_id) {
  // Close current deployment
  db.prepare(`
    UPDATE historique_deployements 
    SET est_actif = 0, date_fin = CURRENT_DATE, modifie_le = CURRENT_TIMESTAMP
    WHERE employe_id = ? AND est_actif = 1
  `).run(employee.id);

  // Create new deployment
  const deploymentId = 'dep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  db.prepare(`
    INSERT INTO historique_deployements (
      id, employe_id, site_id, date_debut, poste, motif_affectation, est_actif
    ) VALUES (?, ?, ?, CURRENT_DATE, ?, 'TRANSFERT', 1)
  `).run(deploymentId, employee.id, employee.site_affecte_id, 'JOUR');
}
```

**What Happens:**
1. Old deployment is closed (`est_actif = 0`, `date_fin` set)
2. New deployment is created with new site
3. New deployment is marked as active
4. Motif is set to 'TRANSFERT'

### **Method 3: Manual Deployment Creation**

**File:** `public/electron.cjs` - `db-create-deployment` handler

```javascript
ipcMain.handle('db-create-deployment', async (event, deployment) => {
  // Close previous deployment
  db.prepare(`
    UPDATE historique_deployements 
    SET est_actif = 0, date_fin = ?, modifie_le = CURRENT_TIMESTAMP
    WHERE employe_id = ? AND est_actif = 1
  `).run(deployment.date_debut, deployment.employe_id);

  // Create new deployment
  const deploymentId = 'dep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  db.prepare(`
    INSERT INTO historique_deployements (
      id, employe_id, site_id, date_debut, poste, motif_affectation, notes, est_actif
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    deploymentId,
    deployment.employe_id,
    deployment.site_id,
    deployment.date_debut,
    deployment.poste,
    deployment.motif_affectation,
    deployment.notes
  );

  // Update employee's site_affecte_id
  db.prepare(`
    UPDATE employees_gas 
    SET site_affecte_id = ?, modifie_le = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(deployment.site_id, deployment.employe_id);
});
```

**What Happens:**
1. Previous active deployment is closed
2. New deployment record is created
3. Employee's `site_affecte_id` is updated to match
4. Only one deployment can be active (`est_actif = 1`) at a time

---

## 📤 How Bulk Payslip PDF Accesses Deployment Data

### **Step 1: User Initiates Export**

**File:** `src/components/Payroll/PayrollManagement.tsx`

```javascript
const handleExportAllPDF = async () => {
  // Get all payslips for the selected period
  const payslips = [...]; // Already loaded from bulletins_paie table
  
  // Extract employee IDs
  const employeeIds = payslips.map(p => p.employe_id);
```

### **Step 2: Retrieve Deployment Data (Dual-Source Approach)**

```javascript
const deploymentsPromises = employeeIds.map(async (id, index) => {
  try {
    // PRIMARY SOURCE: Get current deployment from historique_deployements
    if (window.electronAPI.getCurrentDeployment) {
      const deployment = await window.electronAPI.getCurrentDeployment(id);
      if (deployment && deployment.nom_site) {
        return deployment; // Returns: { site_nom: "Site Name", ... }
      }
    }
    
    // FALLBACK SOURCE: Get from employee's site_affecte_id
    if (window.electronAPI.getEmployeeGAS) {
      const employee = await window.electronAPI.getEmployeeGAS(id);
      if (employee && employee.site_nom) {
        return { site_nom: employee.site_nom };
      }
    }
    
    return null; // No site found
  } catch (error) {
    console.error('Error getting deployment:', error);
    return null;
  }
});

// Wait for all deployment data to load
const deployments = await Promise.all(deploymentsPromises);
```

### **Step 3: Primary Source - getCurrentDeployment**

**File:** `public/electron.cjs`

```javascript
ipcMain.handle('db-get-current-deployment', async (event, employeId) => {
  try {
    const deployment = db.prepare(`
      SELECT h.*, 
             s.nom_site,                    -- ⭐ Site name from sites_gas
             c.nom_entreprise as client_nom -- Client name
      FROM historique_deployements h
      LEFT JOIN sites_gas s ON h.site_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE h.employe_id = ? 
        AND h.est_actif = 1                 -- ⭐ Only active deployment
    `).get(employeId);

    return deployment || null;
  } catch (error) {
    console.error('Error fetching current deployment:', error);
    throw error;
  }
});
```

**Query Breakdown:**
1. **FROM historique_deployements h**: Start with deployment history
2. **WHERE h.employe_id = ?**: Filter by specific employee
3. **AND h.est_actif = 1**: Only get active deployment (not historical)
4. **LEFT JOIN sites_gas s**: Join to get site name
5. **LEFT JOIN clients_gas c**: Join to get client name

**Returns:**
```javascript
{
  id: "dep-123",
  employe_id: "emp-456",
  site_id: "site-789",
  nom_site: "Site Alpha",        // ⭐ This is what appears in PDF
  client_nom: "Client XYZ",
  date_debut: "2025-01-01",
  date_fin: null,
  poste: "JOUR",
  motif_affectation: "EMBAUCHE",
  est_actif: 1
}
```

### **Step 4: Fallback Source - getEmployeeGAS**

**File:** `public/electron.cjs`

```javascript
ipcMain.handle('db-get-employee-gas', async (event, id) => {
  try {
    const employee = db.prepare(`
      SELECT e.*, 
             s.nom_site as site_nom,        -- ⭐ Site name from site_affecte_id
             c.nom_entreprise as client_nom
      FROM employees_gas e
      LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE e.id = ?
    `).get(id);

    return employee;
  } catch (error) {
    console.error('Error fetching employee GAS:', error);
    throw error;
  }
});
```

**Query Breakdown:**
1. **FROM employees_gas e**: Start with employee record
2. **LEFT JOIN sites_gas s ON e.site_affecte_id**: Join to get site name
3. **WHERE e.id = ?**: Filter by specific employee

**Returns:**
```javascript
{
  id: "emp-456",
  matricule: "G001",
  nom_complet: "John Doe",
  site_affecte_id: "site-789",
  site_nom: "Site Alpha",        // ⭐ Fallback site name
  client_nom: "Client XYZ",
  // ... other employee fields
}
```

### **Step 5: Use Deployment Data in PDF**

```javascript
// For each payslip, get corresponding deployment
const tableData = categoryPayslips.map((payslip, index) => {
  const deployment = deployments[payslips.indexOf(payslip)];
  
  return [
    payslip.nom_complet,
    deployment?.site_nom || 'Non affecté',  // ⭐ Site name in PDF
    `${payslip.salaire_base.toFixed(2)}`,
    // ... other columns
  ];
});
```

---

## 🔍 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    BULK PAYSLIP PDF EXPORT                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Get Payslips   │
                    │  for Period     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Extract Employee│
                    │      IDs        │
                    └────────┬────────┘
                             │
                             ▼
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────┐                  ┌──────────────────┐
│ PRIMARY SOURCE:   │                  │ FALLBACK SOURCE: │
│getCurrentDeployment│                 │ getEmployeeGAS   │
└────────┬──────────┘                  └────────┬─────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────────────┐          ┌──────────────────────┐
│ historique_deployements │          │   employees_gas      │
│   WHERE est_actif = 1   │          │ + site_affecte_id    │
│   JOIN sites_gas        │          │   JOIN sites_gas     │
└────────┬────────────────┘          └────────┬─────────────┘
         │                                     │
         └──────────┬──────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  nom_site     │ ⭐ Site Name
            │  (from sites) │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Display in   │
            │  PDF Table    │
            └───────────────┘
```

---

## 🎯 Key Points

### **Why Two Sources?**

1. **Primary (historique_deployements):**
   - ✅ More accurate - tracks actual deployment history
   - ✅ Includes deployment details (date, shift, reason)
   - ✅ Maintains historical record
   - ❌ May not exist if employee was created without deployment

2. **Fallback (employees_gas.site_affecte_id):**
   - ✅ Always available if site is assigned
   - ✅ Simpler to query
   - ❌ No historical tracking
   - ❌ Less detailed information

### **Data Consistency Rules**

1. **Only ONE active deployment** per employee at a time (`est_actif = 1`)
2. **When transferring**, old deployment is closed before new one is created
3. **site_affecte_id** should always match the active deployment's site_id
4. **Historical deployments** have `est_actif = 0` and `date_fin` set

### **Common Scenarios**

#### **Scenario 1: New Employee with Site**
```
1. Create employee with site_affecte_id = "site-123"
2. Auto-create deployment: est_actif = 1, site_id = "site-123"
3. PDF export finds deployment via getCurrentDeployment ✅
```

#### **Scenario 2: Employee Transfer**
```
1. Update employee: site_affecte_id = "site-456"
2. Close old deployment: est_actif = 0, date_fin = today
3. Create new deployment: est_actif = 1, site_id = "site-456"
4. PDF export finds new deployment via getCurrentDeployment ✅
```

#### **Scenario 3: Employee Without Deployment Record**
```
1. Employee has site_affecte_id = "site-789"
2. No active deployment in historique_deployements
3. getCurrentDeployment returns null
4. Fallback to getEmployeeGAS finds site via site_affecte_id ✅
```

#### **Scenario 4: Employee Without Site**
```
1. Employee has site_affecte_id = null
2. No deployment record exists
3. Both sources return null
4. PDF shows "Non affecté" ✅
```

---

## 🔧 Troubleshooting

### **Issue: Sites not showing in PDF**

**Check:**
1. Does employee have `site_affecte_id` set?
   ```sql
   SELECT id, nom_complet, site_affecte_id FROM employees_gas WHERE id = ?
   ```

2. Does active deployment exist?
   ```sql
   SELECT * FROM historique_deployements 
   WHERE employe_id = ? AND est_actif = 1
   ```

3. Does site exist in sites_gas?
   ```sql
   SELECT * FROM sites_gas WHERE id = ?
   ```

### **Issue: Wrong site showing**

**Check:**
1. Is there more than one active deployment?
   ```sql
   SELECT COUNT(*) FROM historique_deployements 
   WHERE employe_id = ? AND est_actif = 1
   ```
   Should return 1 or 0, never more than 1

2. Does site_affecte_id match active deployment?
   ```sql
   SELECT e.site_affecte_id, h.site_id
   FROM employees_gas e
   LEFT JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
   WHERE e.id = ?
   ```
   Both should be the same

---

## 📝 Summary

**Deployment Storage:**
- Primary: `historique_deployements` table with `est_actif = 1` for current deployment
- Secondary: `employees_gas.site_affecte_id` as fallback
- Site names come from `sites_gas.nom_site`

**PDF Access:**
- Dual-source approach for reliability
- Primary: Query active deployment with site JOIN
- Fallback: Query employee with site JOIN
- Graceful handling when no site is found

**Data Integrity:**
- Only one active deployment per employee
- site_affecte_id synced with active deployment
- Historical deployments preserved with est_actif = 0

