// Test script to verify roteur deployment implementation
const Database = require('better-sqlite3');
const path = require('path');

// Test database schema and roteur deployment functionality
async function testRoteurDeployment() {
  console.log('🧪 Testing Roteur Deployment Implementation...\n');
  
  try {
    // Test 1: Check if roteur_sites column exists
    console.log('1. Testing database schema...');
    const db = new Database('./database.sqlite');
    
    const tableInfo = db.prepare("PRAGMA table_info(historique_deployements)").all();
    const roteurSitesColumn = tableInfo.find(col => col.name === 'roteur_sites');
    
    if (roteurSitesColumn) {
      console.log('✅ roteur_sites column exists in historique_deployements table');
      console.log(`   Type: ${roteurSitesColumn.type}, Nullable: ${roteurSitesColumn.notnull === 0 ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ roteur_sites column NOT found in historique_deployements table');
    }
    
    // Test 2: Check existing deployment records
    console.log('\n2. Testing existing deployment records...');
    const deployments = db.prepare(`
      SELECT id, employe_id, site_id, roteur_sites, motif_affectation, cree_par, est_actif
      FROM historique_deployements 
      WHERE cree_par = 'SYSTEM_ROTEUR' OR motif_affectation = 'ROTATION'
      ORDER BY cree_le DESC
      LIMIT 5
    `).all();
    
    console.log(`Found ${deployments.length} roteur deployment record(s):`);
    deployments.forEach((dep, index) => {
      console.log(`   ${index + 1}. ID: ${dep.id}`);
      console.log(`      Employee: ${dep.employe_id}`);
      console.log(`      Primary Site: ${dep.site_id}`);
      console.log(`      Roteur Sites: ${dep.roteur_sites || 'NULL'}`);
      console.log(`      Motif: ${dep.motif_affectation}`);
      console.log(`      Created By: ${dep.cree_par || 'NULL'}`);
      console.log(`      Active: ${dep.est_actif ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    // Test 3: Check roteur assignments
    console.log('3. Testing roteur assignments...');
    const roteurAssignments = db.prepare(`
      SELECT id, roteur_id, site_id, weekly_assignments, statut
      FROM affectations_roteur 
      WHERE statut IN ('PLANIFIE', 'EN_COURS')
      ORDER BY cree_le DESC
      LIMIT 3
    `).all();
    
    console.log(`Found ${roteurAssignments.length} active roteur assignment(s):`);
    roteurAssignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ID: ${assignment.id}`);
      console.log(`      Roteur: ${assignment.roteur_id}`);
      console.log(`      Primary Site: ${assignment.site_id}`);
      console.log(`      Status: ${assignment.statut}`);
      
      if (assignment.weekly_assignments) {
        try {
          const weeklyAssignments = JSON.parse(assignment.weekly_assignments);
          console.log(`      Weekly Assignments: ${weeklyAssignments.length} day(s)`);
          weeklyAssignments.forEach(wa => {
            const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            console.log(`        - ${dayNames[wa.day_of_week]}: ${wa.site_nom || wa.site_id} (${wa.poste})`);
          });
        } catch (e) {
          console.log(`      Weekly Assignments: Invalid JSON - ${assignment.weekly_assignments}`);
        }
      } else {
        console.log(`      Weekly Assignments: NULL`);
      }
      console.log('');
    });
    
    // Test 4: Check employees with roteur poste
    console.log('4. Testing roteur employees...');
    const roteurs = db.prepare(`
      SELECT id, nom_complet, matricule, poste, statut
      FROM employees_gas 
      WHERE poste = 'ROTEUR' AND statut = 'ACTIF'
      LIMIT 5
    `).all();
    
    console.log(`Found ${roteurs.length} active roteur(s):`);
    roteurs.forEach((roteur, index) => {
      console.log(`   ${index + 1}. ${roteur.nom_complet} (${roteur.matricule})`);
      console.log(`      Poste: ${roteur.poste}, Status: ${roteur.statut}`);
    });
    
    // Test 5: Check sites eligible for roteur
    console.log('\n5. Testing sites eligible for roteur...');
    const eligibleSites = db.prepare(`
      SELECT s.id, s.nom_site, COUNT(e.id) as guard_count
      FROM sites_gas s
      LEFT JOIN employees_gas e ON e.site_affecte_id = s.id AND e.statut = 'ACTIF' AND e.poste = 'GARDE'
      WHERE s.est_actif = 1
      GROUP BY s.id
      HAVING guard_count = 1
      LIMIT 5
    `).all();
    
    console.log(`Found ${eligibleSites.length} site(s) eligible for roteur (exactly 1 guard):`);
    eligibleSites.forEach((site, index) => {
      console.log(`   ${index + 1}. ${site.nom_site} (${site.guard_count} guard)`);
    });
    
    db.close();
    console.log('\n🎉 Database tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testRoteurDeployment();