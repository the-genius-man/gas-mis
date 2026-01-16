# 🔧 Deployment Diagnostic Script

## Run This in Browser Console to Diagnose the Issue

Copy and paste this entire script into your browser console (F12 → Console tab) while the app is running:

```javascript
// ============================================================================
// DEPLOYMENT DIAGNOSTIC SCRIPT
// ============================================================================

console.log('🔍 Starting Deployment Diagnostic...\n');

async function runDiagnostics() {
  try {
    // Step 1: Check if API functions exist
    console.log('📋 Step 1: Checking API Functions...');
    console.log('  ✓ getCurrentDeployment exists:', typeof window.electronAPI.getCurrentDeployment === 'function');
    console.log('  ✓ getEmployeeGAS exists:', typeof window.electronAPI.getEmployeeGAS === 'function');
    console.log('  ✓ getEmployeesGAS exists:', typeof window.electronAPI.getEmployeesGAS === 'function');
    console.log('  ✓ getPayslips exists:', typeof window.electronAPI.getPayslips === 'function');
    console.log('');

    // Step 2: Get all employees
    console.log('📋 Step 2: Fetching All Employees...');
    const employees = await window.electronAPI.getEmployeesGAS();
    console.log(`  Found ${employees.length} employees`);
    
    const activeEmployees = employees.filter(e => e.statut === 'ACTIF');
    console.log(`  Active employees: ${activeEmployees.length}`);
    
    const employeesWithSite = activeEmployees.filter(e => e.site_affecte_id);
    console.log(`  Employees with site_affecte_id: ${employeesWithSite.length}`);
    console.log('');

    // Step 3: Check each active employee's deployment status
    console.log('📋 Step 3: Checking Deployment Status for Each Employee...');
    console.log('');
    
    const results = [];
    
    for (let i = 0; i < activeEmployees.length; i++) {
      const emp = activeEmployees[i];
      console.log(`  [${i + 1}/${activeEmployees.length}] ${emp.nom_complet} (${emp.matricule})`);
      
      const result = {
        nom: emp.nom_complet,
        matricule: emp.matricule,
        id: emp.id,
        site_affecte_id: emp.site_affecte_id,
        site_nom_from_employee: emp.site_nom,
        has_current_deployment: false,
        deployment_site: null,
        final_site: null,
        status: 'UNKNOWN'
      };
      
      // Check current deployment
      try {
        const deployment = await window.electronAPI.getCurrentDeployment(emp.id);
        if (deployment && deployment.nom_site) {
          result.has_current_deployment = true;
          result.deployment_site = deployment.nom_site;
          result.final_site = deployment.nom_site;
          result.status = 'HAS_DEPLOYMENT';
          console.log(`    ✅ Has deployment: ${deployment.nom_site}`);
        } else {
          console.log(`    ⚠️  No current deployment found`);
        }
      } catch (error) {
        console.log(`    ❌ Error getting deployment:`, error.message);
        result.status = 'ERROR_DEPLOYMENT';
      }
      
      // Check employee site as fallback
      if (!result.has_current_deployment) {
        if (emp.site_affecte_id && emp.site_nom) {
          result.final_site = emp.site_nom;
          result.status = 'HAS_SITE_AFFECTE';
          console.log(`    ℹ️  Fallback to site_affecte: ${emp.site_nom}`);
        } else if (emp.site_affecte_id) {
          result.status = 'SITE_ID_NO_NAME';
          console.log(`    ⚠️  Has site_affecte_id but no site_nom`);
        } else {
          result.status = 'NO_SITE';
          console.log(`    ❌ No site assignment at all`);
        }
      }
      
      results.push(result);
      console.log('');
    }
    
    // Step 4: Summary
    console.log('📊 Step 4: Summary Report');
    console.log('='.repeat(80));
    console.table(results.map(r => ({
      'Nom': r.nom,
      'Matricule': r.matricule,
      'Site Affecté ID': r.site_affecte_id || 'NULL',
      'Site (Employee)': r.site_nom_from_employee || 'NULL',
      'Site (Deployment)': r.deployment_site || 'NULL',
      'Site Final': r.final_site || '❌ Non affecté',
      'Status': r.status
    })));
    console.log('');
    
    // Step 5: Status breakdown
    console.log('📊 Status Breakdown:');
    const statusCounts = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} employees`);
    });
    console.log('');
    
    // Step 6: Recommendations
    console.log('💡 Recommendations:');
    console.log('');
    
    const noSite = results.filter(r => r.status === 'NO_SITE');
    if (noSite.length > 0) {
      console.log(`  ⚠️  ${noSite.length} employees have NO site assignment`);
      console.log('     Action: Assign sites to these employees or create deployments');
      console.log('     Employees:', noSite.map(r => r.nom).join(', '));
      console.log('');
    }
    
    const siteIdNoName = results.filter(r => r.status === 'SITE_ID_NO_NAME');
    if (siteIdNoName.length > 0) {
      console.log(`  ⚠️  ${siteIdNoName.length} employees have site_affecte_id but site name is missing`);
      console.log('     Action: Check if sites_gas table has these site IDs');
      console.log('     Employees:', siteIdNoName.map(r => r.nom).join(', '));
      console.log('');
    }
    
    const hasDeployment = results.filter(r => r.status === 'HAS_DEPLOYMENT');
    if (hasDeployment.length > 0) {
      console.log(`  ✅ ${hasDeployment.length} employees have active deployments - GOOD!`);
      console.log('');
    }
    
    const hasSiteAffecte = results.filter(r => r.status === 'HAS_SITE_AFFECTE');
    if (hasSiteAffecte.length > 0) {
      console.log(`  ℹ️  ${hasSiteAffecte.length} employees using site_affecte fallback`);
      console.log('     Recommendation: Create deployment records for better tracking');
      console.log('');
    }
    
    // Step 7: Test PDF export data retrieval
    console.log('📋 Step 7: Testing PDF Export Data Retrieval...');
    console.log('');
    
    // Get current period
    const periods = await window.electronAPI.getPayrollPeriods();
    if (periods.length > 0) {
      const currentPeriod = periods[0];
      console.log(`  Testing with period: ${currentPeriod.mois}/${currentPeriod.annee}`);
      
      const payslips = await window.electronAPI.getPayslips(currentPeriod.id);
      console.log(`  Found ${payslips.length} payslips`);
      
      if (payslips.length > 0) {
        console.log('  Testing deployment retrieval for first 3 payslips:');
        
        for (let i = 0; i < Math.min(3, payslips.length); i++) {
          const payslip = payslips[i];
          console.log(`    [${i + 1}] ${payslip.nom_complet}`);
          
          // Try getCurrentDeployment
          const deployment = await window.electronAPI.getCurrentDeployment(payslip.employe_id);
          if (deployment && deployment.nom_site) {
            console.log(`      ✅ Deployment: ${deployment.nom_site}`);
          } else {
            console.log(`      ⚠️  No deployment, trying fallback...`);
            
            // Try getEmployeeGAS
            const employee = await window.electronAPI.getEmployeeGAS(payslip.employe_id);
            if (employee && employee.site_nom) {
              console.log(`      ✅ Employee site: ${employee.site_nom}`);
            } else {
              console.log(`      ❌ No site found - will show "Non affecté"`);
            }
          }
        }
      }
    } else {
      console.log('  ⚠️  No payroll periods found');
    }
    console.log('');
    
    // Final verdict
    console.log('🎯 FINAL VERDICT:');
    console.log('='.repeat(80));
    
    const problemEmployees = results.filter(r => !r.final_site);
    if (problemEmployees.length === 0) {
      console.log('  ✅ ALL EMPLOYEES HAVE SITE ASSIGNMENTS!');
      console.log('  ✅ PDF export should work correctly');
      console.log('');
      console.log('  If PDF still shows "Non affecté", the issue is in the PDF generation code.');
      console.log('  Check the browser console when clicking "Exporter PDF" for errors.');
    } else {
      console.log(`  ❌ ${problemEmployees.length} employees will show "Non affecté" in PDF`);
      console.log('');
      console.log('  Problem employees:');
      problemEmployees.forEach(r => {
        console.log(`    - ${r.nom} (${r.matricule}): ${r.status}`);
      });
      console.log('');
      console.log('  NEXT STEPS:');
      console.log('  1. Create deployments for these employees, OR');
      console.log('  2. Assign sites to these employees');
      console.log('');
      console.log('  Run the fix script below to auto-create deployments:');
    }
    
    console.log('');
    console.log('✅ Diagnostic Complete!');
    console.log('');
    
    return results;
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the diagnostic
runDiagnostics().then(results => {
  console.log('📦 Results stored in variable: diagnosticResults');
  window.diagnosticResults = results;
});
```

---

## After Running the Diagnostic

The script will tell you exactly what's wrong. Based on the results, you may need to run one of these fix scripts:

### Fix Script 1: Create Deployments for Employees with site_affecte_id

```javascript
async function createMissingDeployments() {
  console.log('🔧 Creating missing deployments...\n');
  
  const employees = await window.electronAPI.getEmployeesGAS();
  const activeEmployees = employees.filter(e => e.statut === 'ACTIF' && e.site_affecte_id);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const emp of activeEmployees) {
    // Check if deployment already exists
    const currentDep = await window.electronAPI.getCurrentDeployment(emp.id);
    
    if (currentDep) {
      console.log(`  ⏭️  ${emp.nom_complet}: Already has deployment`);
      skipped++;
      continue;
    }
    
    try {
      await window.electronAPI.createDeployment({
        employe_id: emp.id,
        site_id: emp.site_affecte_id,
        date_debut: emp.date_embauche || '2025-01-01',
        poste: 'JOUR',
        motif_affectation: 'EMBAUCHE',
        notes: 'Auto-created from diagnostic script'
      });
      console.log(`  ✅ ${emp.nom_complet}: Deployment created`);
      created++;
    } catch (error) {
      console.error(`  ❌ ${emp.nom_complet}: Failed -`, error.message);
      errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log('\n✅ Done! Run the diagnostic again to verify.');
}

// Run it
createMissingDeployments();
```

### Fix Script 2: Assign Sites to Employees Without site_affecte_id

This requires manual intervention - you need to know which site each employee should be assigned to.

```javascript
// Example: Assign a specific employee to a site
async function assignEmployeeToSite(employeeId, siteId) {
  try {
    const employee = await window.electronAPI.getEmployeeGAS(employeeId);
    if (!employee) {
      console.error('Employee not found');
      return;
    }
    
    await window.electronAPI.updateEmployeeGAS({
      ...employee,
      site_affecte_id: siteId
    });
    
    console.log(`✅ Assigned ${employee.nom_complet} to site ${siteId}`);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

// Usage:
// assignEmployeeToSite('employee-id-here', 'site-id-here');
```

---

## What to Share if Issue Persists

If the diagnostic shows all employees have sites but PDF still shows "Non affecté", share:

1. The complete console output from the diagnostic script
2. The console output when clicking "Exporter PDF" button
3. A screenshot of the PDF showing "Non affecté"

This will help identify if the issue is in the data retrieval or PDF generation logic.
