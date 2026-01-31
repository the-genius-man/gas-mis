// Simple test to check if ROTATION constraint is working
// This will run in the browser console where electronAPI is available

async function testRotationConstraint() {
  console.log('🧪 Testing ROTATION constraint through electronAPI...');
  
  if (!window.electronAPI) {
    console.log('❌ electronAPI not available - run this in the Electron app');
    return;
  }
  
  try {
    // Test 1: Try to create a test roteur assignment
    console.log('\n1. Testing roteur assignment creation...');
    
    // First, get available roteurs and sites
    const roteurs = await window.electronAPI.getRoteurs();
    const sites = await window.electronAPI.getSitesGAS();
    
    if (!roteurs || roteurs.length === 0) {
      console.log('⚠️ No roteurs found - cannot test roteur assignment');
      return;
    }
    
    if (!sites || sites.length < 2) {
      console.log('⚠️ Need at least 2 sites to test roteur assignment');
      return;
    }
    
    const testRoteur = roteurs[0];
    const testSites = sites.slice(0, 2); // Use first 2 sites
    
    console.log(`📋 Using roteur: ${testRoteur.nom_complet}`);
    console.log(`📋 Using sites: ${testSites.map(s => s.nom_site).join(', ')}`);
    
    // Create a test weekly assignment
    const testAssignment = {
      roteur_id: testRoteur.id,
      date_debut: new Date().toISOString().split('T')[0],
      date_fin: '2099-12-31',
      poste: 'NUIT',
      statut: 'PLANIFIE',
      notes: 'Test assignment for constraint validation',
      weekly_assignments: testSites.map((site, index) => ({
        site_id: site.id,
        jour_semaine: index === 0 ? 'LUNDI' : 'MARDI',
        poste: 'NUIT'
      }))
    };
    
    console.log('📤 Creating test assignment...');
    
    try {
      const result = await window.electronAPI.createRoteurAssignment(testAssignment);
      
      if (result.success) {
        console.log('✅ Roteur assignment created successfully!');
        console.log('✅ This means ROTATION motif_affectation is now working');
        console.log('📊 Result:', result);
        
        // Clean up - cancel the test assignment
        try {
          await window.electronAPI.cancelRoteurAssignment(result.id);
          console.log('🧹 Test assignment cleaned up');
        } catch (cleanupError) {
          console.log('⚠️ Could not clean up test assignment:', cleanupError.message);
        }
        
      } else {
        console.log('❌ Roteur assignment creation failed');
        console.log('Error:', result.error || 'Unknown error');
      }
      
    } catch (error) {
      if (error.message.includes('CHECK constraint failed') && error.message.includes('motif_affectation')) {
        console.log('❌ ROTATION constraint still not working');
        console.log('Database constraint error:', error.message);
      } else {
        console.log('⚠️ Other error (not constraint related):', error.message);
      }
    }
    
    // Test 2: Check deployment history for existing roteur assignments
    console.log('\n2. Checking existing deployment history...');
    
    try {
      const deployments = await window.electronAPI.getDeploymentHistory();
      const roteurDeployments = deployments.filter(d => d.motif_affectation === 'ROTATION');
      
      console.log(`📊 Found ${roteurDeployments.length} deployment records with ROTATION motif`);
      
      if (roteurDeployments.length > 0) {
        console.log('✅ ROTATION motif is being stored successfully');
        roteurDeployments.slice(0, 3).forEach((dep, index) => {
          console.log(`   ${index + 1}. ${dep.nom_complet || 'Unknown'} - ${dep.roteur_sites || 'No sites'}`);
        });
      } else {
        console.log('ℹ️ No existing ROTATION deployments found (this is normal for new installations)');
      }
      
    } catch (error) {
      console.log('⚠️ Could not check deployment history:', error.message);
    }
    
    console.log('\n🏁 Constraint test completed');
    
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

// Auto-run the test
testRotationConstraint();