# 🚀 Quick Start: Troubleshooting "Non affecté" in PDF

## TL;DR - Do This Now

### 1. Open Browser Console (F12)

### 2. Run This Diagnostic Script

```javascript
async function quickCheck() {
  console.log('🔍 Quick Deployment Check\n');
  
  const employees = await window.electronAPI.getEmployeesGAS();
  const active = employees.filter(e => e.statut === 'ACTIF');
  
  console.log(`Total Active Employees: ${active.length}`);
  
  let hasDeployment = 0;
  let hasSite = 0;
  let noSite = 0;
  
  for (const emp of active) {
    const dep = await window.electronAPI.getCurrentDeployment(emp.id);
    if (dep && dep.nom_site) {
      hasDeployment++;
    } else if (emp.site_affecte_id && emp.site_nom) {
      hasSite++;
    } else {
      noSite++;
      console.log(`  ❌ ${emp.nom_complet} - No site`);
    }
  }
  
  console.log(`\n✅ Has Deployment: ${hasDeployment}`);
  console.log(`ℹ️  Has Site (fallback): ${hasSite}`);
  console.log(`❌ No Site: ${noSite}`);
  
  if (noSite > 0) {
    console.log('\n⚠️  Some employees have no site assignment!');
    console.log('Run createMissingDeployments() to fix (see below)');
  } else {
    console.log('\n✅ All employees have sites! PDF should work.');
  }
}

quickCheck();
```

### 3. If It Shows "No Site" Employees, Run This Fix

```javascript
async function createMissingDeployments() {
  const employees = await window.electronAPI.getEmployeesGAS();
  const active = employees.filter(e => e.statut === 'ACTIF' && e.site_affecte_id);
  
  for (const emp of active) {
    const dep = await window.electronAPI.getCurrentDeployment(emp.id);
    if (!dep) {
      try {
        await window.electronAPI.createDeployment({
          employe_id: emp.id,
          site_id: emp.site_affecte_id,
          date_debut: emp.date_embauche || '2025-01-01',
          poste: 'JOUR',
          motif_affectation: 'EMBAUCHE',
          notes: 'Auto-created'
        });
        console.log(`✅ ${emp.nom_complet}`);
      } catch (error) {
        console.error(`❌ ${emp.nom_complet}:`, error.message);
      }
    }
  }
  console.log('Done!');
}

createMissingDeployments();
```

### 4. Try Exporting PDF Again

1. Go to Payroll Management
2. Click "Exporter PDF"
3. Check the console output - you should see site names now

---

## What If It Still Doesn't Work?

### Check Console When Exporting

When you click "Exporter PDF", you should see:

```
================================================================================
DEPLOYMENT DATA RETRIEVED:
================================================================================
[0] Employee Name (emp-id)
    Site name: Site Alpha  ← Should NOT be "❌ NULL"
    Will show in PDF: "Site Alpha"
```

If you see "❌ NULL", that employee has no site.

### Share This Information

If the issue persists, share:
1. Output from `quickCheck()`
2. Console output when clicking "Exporter PDF"
3. Screenshot of the PDF showing "Non affecté"

---

## For More Details

See these files:
- `DEPLOYMENT_DIAGNOSTIC_SCRIPT.md` - Full diagnostic script
- `DEPLOYMENT_DEBUGGING_ENHANCED.md` - Complete explanation
- `DEPLOYMENT_DATA_FLOW_DOCUMENTATION.md` - How deployments work
- `DEPLOYMENT_TROUBLESHOOTING_STEPS.md` - Step-by-step guide
