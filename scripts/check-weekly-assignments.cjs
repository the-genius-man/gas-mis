const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking weekly_assignments data in database...\n');

try {
  // Check table structure
  const tableInfo = db.prepare("PRAGMA table_info(affectations_roteur)").all();
  console.log('📋 Table structure:');
  tableInfo.forEach(col => {
    if (col.name === 'weekly_assignments') {
      console.log(`  ✅ ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`);
    }
  });
  
  // Check current assignments
  const assignments = db.prepare(`
    SELECT id, roteur_nom, site_nom, weekly_assignments, 
           typeof(weekly_assignments) as type,
           length(weekly_assignments) as length,
           statut
    FROM affectations_roteur 
    WHERE statut IN ('EN_COURS', 'PLANIFIE')
    ORDER BY id DESC
    LIMIT 5
  `).all();
  
  console.log('\n📊 Current assignments:');
  assignments.forEach(assignment => {
    console.log(`  ID: ${assignment.id}`);
    console.log(`  Roteur: ${assignment.roteur_nom}`);
    console.log(`  Site: ${assignment.site_nom}`);
    console.log(`  Status: ${assignment.statut}`);
    console.log(`  Weekly assignments type: ${assignment.type}`);
    console.log(`  Weekly assignments length: ${assignment.length}`);
    console.log(`  Weekly assignments content: ${assignment.weekly_assignments}`);
    console.log('  ---');
  });
  
  // Try to parse JSON if it's a string
  console.log('\n🔍 Attempting to parse weekly_assignments as JSON:');
  assignments.forEach(assignment => {
    if (assignment.weekly_assignments) {
      try {
        const parsed = JSON.parse(assignment.weekly_assignments);
        console.log(`  ID ${assignment.id}: Successfully parsed as JSON, length: ${parsed.length}`);
        if (parsed.length > 0) {
          console.log(`    First assignment: ${JSON.stringify(parsed[0])}`);
        }
      } catch (error) {
        console.log(`  ID ${assignment.id}: Failed to parse as JSON - ${error.message}`);
      }
    } else {
      console.log(`  ID ${assignment.id}: weekly_assignments is null/empty`);
    }
  });
  
} catch (error) {
  console.error('❌ Error checking database:', error);
} finally {
  db.close();
}