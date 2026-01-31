const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

console.log('🧹 Cleaning up legacy roteur assignments...\n');

try {
  // Check current assignments
  const currentAssignments = db.prepare(`
    SELECT id, roteur_nom, site_nom, weekly_assignments, statut
    FROM affectations_roteur 
    WHERE statut IN ('EN_COURS', 'PLANIFIE')
  `).all();
  
  console.log(`📊 Found ${currentAssignments.length} active assignments:`);
  currentAssignments.forEach(assignment => {
    const hasWeeklyData = assignment.weekly_assignments && assignment.weekly_assignments.trim() !== '' && assignment.weekly_assignments !== 'null';
    console.log(`  - ${assignment.roteur_nom} → ${assignment.site_nom} (${hasWeeklyData ? 'NEW' : 'LEGACY'})`);
  });
  
  // Find legacy assignments (those without weekly_assignments data)
  const legacyAssignments = currentAssignments.filter(a => 
    !a.weekly_assignments || a.weekly_assignments.trim() === '' || a.weekly_assignments === 'null'
  );
  
  if (legacyAssignments.length === 0) {
    console.log('\n✅ No legacy assignments found. All assignments have weekly data.');
    return;
  }
  
  console.log(`\n🔍 Found ${legacyAssignments.length} legacy assignments to clean up:`);
  legacyAssignments.forEach(assignment => {
    console.log(`  - ID: ${assignment.id} | ${assignment.roteur_nom} → ${assignment.site_nom}`);
  });
  
  console.log('\n⚠️  To clean up legacy assignments, uncomment the deletion code below and run again.');
  console.log('⚠️  This will remove old assignments so you can test the new weekly system.');
  
  // UNCOMMENT THE LINES BELOW TO ACTUALLY DELETE LEGACY ASSIGNMENTS
  /*
  console.log('\n🗑️  Deleting legacy assignments...');
  const deleteStmt = db.prepare('DELETE FROM affectations_roteur WHERE id = ?');
  
  legacyAssignments.forEach(assignment => {
    deleteStmt.run(assignment.id);
    console.log(`  ✅ Deleted: ${assignment.roteur_nom} → ${assignment.site_nom}`);
  });
  
  console.log(`\n✅ Cleaned up ${legacyAssignments.length} legacy assignments.`);
  console.log('✅ You can now create new weekly assignments through the UI.');
  */
  
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  db.close();
}