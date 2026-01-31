const { app, BrowserWindow } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// Test the rotation constraint fix
async function testRotationConstraint() {
  console.log('🧪 Testing ROTATION constraint fix...');
  
  try {
    // Open database
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    // Test 1: Check if ROTATION is now allowed in motif_affectation
    console.log('\n1. Testing ROTATION value in motif_affectation...');
    
    const testId = `test-rotation-${Date.now()}`;
    const testEmployeeId = `test-emp-${Date.now()}`;
    const testSiteId = `test-site-${Date.now()}`;
    
    try {
      // Try to insert a record with ROTATION motif
      const insertStmt = db.prepare(`
        INSERT INTO historique_deployements 
        (id, employe_id, site_id, date_debut, motif_affectation, roteur_sites) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        testId,
        testEmployeeId,
        testSiteId,
        '2024-01-01',
        'ROTATION',
        'Site A, Site B, Site C'
      );
      
      console.log('✅ ROTATION value accepted - constraint updated successfully!');
      
      // Clean up test record
      db.prepare(`DELETE FROM historique_deployements WHERE id = ?`).run(testId);
      console.log('🧹 Test record cleaned up');
      
    } catch (error) {
      if (error.message.includes('CHECK constraint failed')) {
        console.log('❌ ROTATION value still rejected - constraint not updated');
        console.log('Error:', error.message);
      } else {
        console.log('⚠️ Unexpected error:', error.message);
      }
    }
    
    // Test 2: Check all valid motif_affectation values
    console.log('\n2. Testing all expected motif_affectation values...');
    
    const expectedValues = [
      'EMBAUCHE', 'TRANSFERT', 'REMPLACEMENT', 'ROTATION', 
      'DEMANDE_EMPLOYE', 'DEMANDE_CLIENT', 'DISCIPLINAIRE', 
      'REORGANISATION', 'FIN_CONTRAT_SITE', 'AUTRE'
    ];
    
    let successCount = 0;
    
    for (const motif of expectedValues) {
      const testId = `test-${motif.toLowerCase()}-${Date.now()}`;
      try {
        const insertStmt = db.prepare(`
          INSERT INTO historique_deployements 
          (id, employe_id, site_id, date_debut, motif_affectation) 
          VALUES (?, ?, ?, ?, ?)
        `);
        
        insertStmt.run(testId, testEmployeeId, testSiteId, '2024-01-01', motif);
        
        // Clean up immediately
        db.prepare(`DELETE FROM historique_deployements WHERE id = ?`).run(testId);
        
        console.log(`✅ ${motif}: Accepted`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ ${motif}: Rejected - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Results: ${successCount}/${expectedValues.length} values accepted`);
    
    if (successCount === expectedValues.length) {
      console.log('🎉 All motif_affectation values are working correctly!');
    } else {
      console.log('⚠️ Some values are still being rejected by the constraint');
    }
    
    // Test 3: Check roteur_sites column exists
    console.log('\n3. Testing roteur_sites column...');
    
    try {
      const testStmt = db.prepare(`
        SELECT roteur_sites FROM historique_deployements LIMIT 1
      `);
      testStmt.all();
      console.log('✅ roteur_sites column exists and is accessible');
    } catch (error) {
      console.log('❌ roteur_sites column issue:', error.message);
    }
    
    db.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRotationConstraint().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});