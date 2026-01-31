// Browser console test for roteur deployment functionality
// Copy and paste this into the browser console when the app is running

console.log('🧪 Testing Roteur Deployment Implementation in Browser...\n');

async function testRoteurDeployment() {
  try {
    // Test 1: Check if electronAPI is available
    console.log('1. Testing electronAPI availability...');
    if (window.electronAPI) {
      console.log('✅ electronAPI is available');
      console.log('Available methods:', Object.keys(window.electronAPI).filter(key => key.includes('roteur') || key.includes('deployment')));
    } else {
      console.log('❌ electronAPI not available - make sure you\'re running in Electron');
      return;
    }
    
    // Test 2: Test getting roteur assignments
    console.log('\n2. Testing roteur assignments...');
    try {
      const assignments = await window.electronAPI.getRoteurAssignments();
      console.log(`✅ Found ${assignments.length} roteur assignment(s)`);
      
      if (assignments.length > 0) {
        console.log('Sample assignment:', assignments[0]);
        
        // Check if weekly_assignments are properly parsed
        assignments.forEach((assignment, index) => {
          console.log(`Assignment ${index + 1}:`);
          console.log(`  - Roteur: ${assignment.roteur_nom}`);
          console.log(`  - Status: ${assignment.statut}`);
          console.log(`  - Weekly assignments:`, assignment.weekly_assignments);
        });
      }
    } catch (error) {
      console.log('❌ Error getting roteur assignments:', error.message);
    }
    
    // Test 3: Test getting employee deployments
    console.log('\n3. Testing employee deployments...');
    try {
      const employees = await window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' });
      const roteurs = employees.filter(emp => emp.poste === 'ROTEUR');
      
      console.log(`✅ Found ${roteurs.length} active roteur(s)`);
      
      if (roteurs.length > 0) {
        const testRoteur = roteurs[0];
        console.log(`Testing with roteur: ${testRoteur.nom_complet}`);
        
        const deployments = await window.electronAPI.getEmployeeDeployments(testRoteur.id);
        console.log(`✅ Found ${deployments.length} deployment record(s) for this roteur`);
        
        // Check for roteur_sites field
        const roteurDeployments = deployments.filter(dep => dep.roteur_sites);
        console.log(`✅ Found ${roteurDeployments.length} roteur deployment record(s) with roteur_sites field`);
        
        if (roteurDeployments.length > 0) {
          console.log('Sample roteur deployment:', roteurDeployments[0]);
          console.log('Roteur sites:', roteurDeployments[0].roteur_sites);
        }
      }
    } catch (error) {
      console.log('❌ Error testing employee deployments:', error.message);
    }
    
    // Test 4: Test deployment form restriction
    console.log('\n4. Testing deployment form restriction...');
    try {
      const employees = await window.electronAPI.getEmployeesGAS({ statut: 'ACTIF' });
      const roteurs = employees.filter(emp => emp.poste === 'ROTEUR');
      const guards = employees.filter(emp => emp.poste === 'GARDE');
      
      console.log(`✅ Deployment form should show ${guards.length} guards (roteurs filtered out)`);
      console.log(`✅ ${roteurs.length} roteurs should be filtered out from deployment form`);
      
      if (roteurs.length > 0) {
        console.log('Roteurs that should be filtered out:');
        roteurs.forEach(roteur => {
          console.log(`  - ${roteur.nom_complet} (${roteur.matricule})`);
        });
      }
    } catch (error) {
      console.log('❌ Error testing deployment form restriction:', error.message);
    }
    
    // Test 5: Test sites eligible for roteur
    console.log('\n5. Testing sites eligible for roteur...');
    try {
      const sites = await window.electronAPI.getSitesEligibleForRoteur();
      console.log(`✅ Found ${sites.length} site(s) eligible for roteur assignment`);
      
      if (sites.length > 0) {
        console.log('Sample eligible sites:');
        sites.slice(0, 3).forEach(site => {
          console.log(`  - ${site.nom_site} (${site.guard_count} guard(s))`);
        });
      }
    } catch (error) {
      console.log('❌ Error getting sites eligible for roteur:', error.message);
    }
    
    console.log('\n🎉 Browser tests completed!');
    console.log('\n📋 Next steps for manual testing:');
    console.log('1. Go to Operations > Rotation tab');
    console.log('2. Try creating a new roteur assignment');
    console.log('3. Check if deployment history shows roteur sites correctly');
    console.log('4. Try to deploy a roteur through HR (should be blocked)');
    console.log('5. Convert a roteur back to guard and check deployment history');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testRoteurDeployment();