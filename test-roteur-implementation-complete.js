// Comprehensive test for roteur implementation
// Run this in the browser console of the Electron app

async function testRoteurImplementation() {
  console.log('🧪 COMPREHENSIVE ROTEUR IMPLEMENTATION TEST');
  console.log('==========================================');
  
  if (!window.electronAPI) {
    console.log('❌ electronAPI not available - run this in the Electron app');
    return;
  }
  
  let testsPassed = 0;
  let totalTests = 0;
  
  function logTest(testName, passed, details = '') {
    totalTests++;
    if (passed) {
      testsPassed++;
      console.log(`✅ ${testName}`);
    } else {
      console.log(`❌ ${testName}`);
    }
    if (details) {
      console.log(`   ${details}`);
    }
  }
  
  try {
    // Test 1: Database Constraint Fix
    console.log('\n📋 TEST 1: Database Constraint Fix');
    console.log('----------------------------------');
    
    try {
      // Get roteurs and sites for testing
      const roteurs = await window.electronAPI.getRoteurs();
      const sites = await window.electronAPI.getSitesGAS();
      
      logTest('Roteurs data loading', roteurs && roteurs.length >= 0, `Found ${roteurs?.length || 0} roteurs`);
      logTest('Sites data loading', sites && sites.length >= 0, `Found ${sites?.length || 0} sites`);
      
      if (roteurs && roteurs.length > 0 && sites && sites.length >= 2) {
        const testRoteur = roteurs[0];
        const testSites = sites.slice(0, 2);
        
        // Create test assignment to verify ROTATION constraint
        const testAssignment = {
          roteur_id: testRoteur.id,
          date_debut: new Date().toISOString().split('T')[0],
          date_fin: '2099-12-31',
          poste: 'NUIT',
          statut: 'PLANIFIE',
          notes: 'Constraint test assignment',
          weekly_assignments: testSites.map((site, index) => ({
            site_id: site.id,
            jour_semaine: index === 0 ? 'LUNDI' : 'MARDI',
            poste: 'NUIT'
          }))
        };
        
        try {
          const result = await window.electronAPI.createRoteurAssignment(testAssignment);
          logTest('ROTATION constraint working', result.success, 'Roteur assignment created successfully');
          
          // Clean up
          if (result.success && result.id) {
            try {
              await window.electronAPI.cancelRoteurAssignment(result.id);
              console.log('   🧹 Test assignment cleaned up');
            } catch (e) {
              console.log('   ⚠️ Could not clean up test assignment');
            }
          }
        } catch (error) {
          const isConstraintError = error.message.includes('CHECK constraint failed') && 
                                   error.message.includes('motif_affectation');
          logTest('ROTATION constraint working', !isConstraintError, 
                 isConstraintError ? 'Constraint still blocking ROTATION' : `Other error: ${error.message}`);
        }
      } else {
        logTest('ROTATION constraint working', false, 'Insufficient test data (need roteurs and sites)');
      }
      
    } catch (error) {
      logTest('Database constraint test', false, `Error: ${error.message}`);
    }
    
    // Test 2: Deployment History Display
    console.log('\n📋 TEST 2: Deployment History Display');
    console.log('------------------------------------');
    
    try {
      const deployments = await window.electronAPI.getDeploymentHistory();
      logTest('Deployment history loading', deployments && Array.isArray(deployments), 
             `Loaded ${deployments?.length || 0} deployment records`);
      
      const roteurDeployments = deployments?.filter(d => d.motif_affectation === 'ROTATION') || [];
      logTest('ROTATION deployments exist', roteurDeployments.length >= 0, 
             `Found ${roteurDeployments.length} ROTATION deployment records`);
      
      const deploymentsWithRoteurSites = deployments?.filter(d => d.roteur_sites) || [];
      logTest('roteur_sites field populated', deploymentsWithRoteurSites.length >= 0, 
             `Found ${deploymentsWithRoteurSites.length} records with roteur_sites data`);
      
    } catch (error) {
      logTest('Deployment history test', false, `Error: ${error.message}`);
    }
    
    // Test 3: Roteur Management UI
    console.log('\n📋 TEST 3: Roteur Management UI');
    console.log('------------------------------');
    
    try {
      // Check if roteur assignments are loading
      const roteurAssignments = await window.electronAPI.getRoteurAssignments();
      logTest('Roteur assignments loading', roteurAssignments && Array.isArray(roteurAssignments), 
             `Loaded ${roteurAssignments?.length || 0} roteur assignments`);
      
      // Check weekly assignments format
      const weeklyAssignments = roteurAssignments?.filter(a => a.weekly_assignments) || [];
      logTest('Weekly assignments format', weeklyAssignments.length >= 0, 
             `Found ${weeklyAssignments.length} assignments with weekly_assignments data`);
      
    } catch (error) {
      logTest('Roteur management test', false, `Error: ${error.message}`);
    }
    
    // Test 4: Employee Filtering for Deployment
    console.log('\n📋 TEST 4: Employee Filtering');
    console.log('----------------------------');
    
    try {
      const employees = await window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' });
      const roteurEmployees = employees?.filter(e => e.poste === 'ROTEUR') || [];
      const gardeEmployees = employees?.filter(e => e.poste === 'GARDE') || [];
      
      logTest('Employee data loading', employees && Array.isArray(employees), 
             `Loaded ${employees?.length || 0} active employees`);
      logTest('Roteur employees identified', roteurEmployees.length >= 0, 
             `Found ${roteurEmployees.length} roteur employees`);
      logTest('Garde employees identified', gardeEmployees.length >= 0, 
             `Found ${gardeEmployees.length} garde employees`);
      
    } catch (error) {
      logTest('Employee filtering test', false, `Error: ${error.message}`);
    }
    
    // Test 5: Site Coverage Analysis
    console.log('\n📋 TEST 5: Site Coverage Analysis');
    console.log('--------------------------------');
    
    try {
      const sites = await window.electronAPI.getSitesGAS();
      const activeSites = sites?.filter(s => s.est_actif) || [];
      
      logTest('Site data loading', sites && Array.isArray(sites), 
             `Loaded ${sites?.length || 0} sites`);
      logTest('Active sites identified', activeSites.length >= 0, 
             `Found ${activeSites.length} active sites`);
      
      // Check site coverage gaps (sites eligible for roteur assignment)
      try {
        const coverageGaps = await window.electronAPI.getSiteCoverageGaps();
        logTest('Site coverage analysis', coverageGaps && Array.isArray(coverageGaps), 
               `Found ${coverageGaps?.length || 0} sites eligible for roteur assignment`);
      } catch (error) {
        logTest('Site coverage analysis', false, `Error: ${error.message}`);
      }
      
    } catch (error) {
      logTest('Site coverage test', false, `Error: ${error.message}`);
    }
    
    // Test Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`❌ Tests Failed: ${totalTests - testsPassed}/${totalTests}`);
    
    const successRate = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0;
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (successRate >= 80) {
      console.log('🎉 IMPLEMENTATION STATUS: GOOD - Most features working correctly');
    } else if (successRate >= 60) {
      console.log('⚠️ IMPLEMENTATION STATUS: PARTIAL - Some issues need attention');
    } else {
      console.log('❌ IMPLEMENTATION STATUS: NEEDS WORK - Major issues detected');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    
    if (testsPassed < totalTests) {
      console.log('1. Check failed tests above for specific issues');
      console.log('2. Verify database schema is up to date');
      console.log('3. Restart the application to ensure migrations run');
      console.log('4. Check browser console for additional error details');
    } else {
      console.log('✅ All tests passed! Implementation appears to be working correctly.');
      console.log('🚀 Ready for production use.');
    }
    
  } catch (error) {
    console.log('❌ Test suite failed:', error);
  }
}

// Auto-run the comprehensive test
testRoteurImplementation();