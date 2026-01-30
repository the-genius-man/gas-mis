const Database = require('better-sqlite3');
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('🔄 Resetting roteur assignment data...');
console.log('📍 Database path:', dbPath);

let db;
try {
  db = new Database(dbPath);
  console.log('✅ Connected to SQLite database');
} catch (err) {
  console.error('❌ Error opening database:', err.message);
  process.exit(1);
}

// Function to run SQL
function runSQL(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(params);
  } catch (err) {
    throw err;
  }
}

// Function to get data
function getSQL(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(params);
  } catch (err) {
    throw err;
  }
}

function resetRoteurData() {
  try {
    console.log('\n🗑️  Clearing existing roteur assignment data...');
    
    // Clear existing roteur assignments
    runSQL('DELETE FROM affectations_roteur');
    console.log('✅ Cleared affectations_roteur table');
    
    // Get available roteurs (employees with poste = 'ROTEUR')
    const roteurs = getSQL(`
      SELECT id, nom_complet, matricule 
      FROM employees_gas 
      WHERE poste = 'ROTEUR' AND statut = 'ACTIF'
      LIMIT 3
    `);
    
    console.log(`\n👥 Found ${roteurs.length} active roteurs:`, roteurs.map(r => r.nom_complet));
    
    // Get available sites (sites with exactly 1 guard that need roteur coverage)
    const sites = getSQL(`
      SELECT s.id, s.nom_site, s.client_nom, 
             COUNT(d.id) as guard_count
      FROM sites_gas s
      LEFT JOIN deployments d ON s.id = d.site_id AND d.statut = 'ACTIF'
      GROUP BY s.id, s.nom_site, s.client_nom
      HAVING guard_count = 1
      LIMIT 10
    `);
    
    console.log(`\n🏢 Found ${sites.length} sites needing roteur coverage:`, sites.map(s => s.nom_site));
    
    if (roteurs.length === 0) {
      console.log('\n⚠️  No active roteurs found. Creating sample roteur...');
      
      // Create a sample roteur
      runSQL(`
        INSERT INTO employees_gas (
          nom_complet, matricule, poste, categorie, statut, 
          date_embauche, telephone, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        'Jean ROTEUR', 'ROT001', 'ROTEUR', 'GARDE', 'ACTIF',
        '2024-01-01', '+237 6XX XX XX XX'
      ]);
      
      // Get the created roteur
      const newRoteurs = getSQL(`
        SELECT id, nom_complet, matricule 
        FROM employees_gas 
        WHERE poste = 'ROTEUR' AND statut = 'ACTIF'
      `);
      roteurs.push(...newRoteurs);
      console.log('✅ Created sample roteur:', newRoteurs[0]?.nom_complet);
    }
    
    if (sites.length === 0) {
      console.log('\n⚠️  No sites needing roteur coverage found. Creating sample sites...');
      
      // Create sample sites
      const sampleSites = [
        { nom: 'Site Alpha', client: 'Client A' },
        { nom: 'Site Beta', client: 'Client B' },
        { nom: 'Site Gamma', client: 'Client C' },
        { nom: 'Site Delta', client: 'Client D' },
        { nom: 'Site Echo', client: 'Client E' }
      ];
      
      for (const site of sampleSites) {
        runSQL(`
          INSERT INTO sites_gas (
            nom_site, client_nom, adresse, statut, created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))
        `, [site.nom, site.client, 'Adresse exemple', 'ACTIF']);
        
        // Get the site ID
        const siteResult = getSQL('SELECT id FROM sites_gas WHERE nom_site = ?', [site.nom]);
        const siteId = siteResult[0]?.id;
        
        if (siteId) {
          // Create a deployment for this site (1 guard)
          runSQL(`
            INSERT INTO deployments (
              employee_id, site_id, poste, statut, date_debut, created_at
            ) SELECT 
              (SELECT id FROM employees_gas WHERE categorie = 'GARDE' AND poste != 'ROTEUR' AND statut = 'ACTIF' LIMIT 1),
              ?, 'JOUR', 'ACTIF', date('now'), datetime('now')
            WHERE EXISTS (SELECT 1 FROM employees_gas WHERE categorie = 'GARDE' AND poste != 'ROTEUR' AND statut = 'ACTIF')
          `, [siteId]);
        }
      }
      
      // Refresh sites list
      const newSites = getSQL(`
        SELECT s.id, s.nom_site, s.client_nom, 
               COUNT(d.id) as guard_count
        FROM sites_gas s
        LEFT JOIN deployments d ON s.id = d.site_id AND d.statut = 'ACTIF'
        GROUP BY s.id, s.nom_site, s.client_nom
        HAVING guard_count <= 1
        LIMIT 10
      `);
      sites.push(...newSites);
      console.log('✅ Created sample sites with deployments');
    }
    
    console.log('\n🔄 Creating sample weekly roteur assignments...');
    
    // Create sample weekly assignments for each roteur
    for (let i = 0; i < Math.min(roteurs.length, 2); i++) {
      const roteur = roteurs[i];
      const availableSites = sites.slice(i * 3, (i + 1) * 3); // Give each roteur different sites
      
      if (availableSites.length === 0) continue;
      
      // Create a weekly assignment
      const assignmentResult = runSQL(`
        INSERT INTO affectations_roteur (
          roteur_id, site_id, date_debut, date_fin, poste, statut, 
          notes, weekly_assignments, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        roteur.id,
        availableSites[0].id, // Primary site
        '2024-01-01',
        '2099-12-31', // Far future for ongoing rotation
        'JOUR',
        'EN_COURS',
        `Rotation hebdomadaire pour ${roteur.nom_complet}`,
        JSON.stringify([
          {
            day_of_week: 1, // Monday
            site_id: availableSites[0]?.id,
            site_nom: availableSites[0]?.nom_site,
            poste: 'JOUR',
            notes: 'Rotation lundi'
          },
          {
            day_of_week: 3, // Wednesday  
            site_id: availableSites[1]?.id || availableSites[0]?.id,
            site_nom: availableSites[1]?.nom_site || availableSites[0]?.nom_site,
            poste: 'JOUR',
            notes: 'Rotation mercredi'
          },
          {
            day_of_week: 5, // Friday
            site_id: availableSites[2]?.id || availableSites[0]?.id,
            site_nom: availableSites[2]?.nom_site || availableSites[0]?.nom_site,
            poste: 'NUIT',
            notes: 'Rotation vendredi soir'
          }
        ])
      ]);
      
      console.log(`✅ Created weekly assignment for ${roteur.nom_complet} (ID: ${assignmentResult.lastInsertRowid})`);
    }
    
    // Verify the created data
    console.log('\n📊 Verifying created data...');
    
    const assignments = getSQL(`
      SELECT ar.id, ar.roteur_id, ar.site_id, ar.statut, ar.weekly_assignments,
             e.nom_complet as roteur_nom,
             s.nom_site
      FROM affectations_roteur ar
      JOIN employees_gas e ON ar.roteur_id = e.id
      JOIN sites_gas s ON ar.site_id = s.id
      WHERE ar.statut IN ('EN_COURS', 'PLANIFIE')
    `);
    
    console.log(`\n✅ Created ${assignments.length} roteur assignments:`);
    assignments.forEach(assignment => {
      console.log(`  - ${assignment.roteur_nom} → ${assignment.nom_site} (${assignment.statut})`);
      
      try {
        const weeklyAssignments = JSON.parse(assignment.weekly_assignments || '[]');
        console.log(`    Weekly schedule: ${weeklyAssignments.length} days assigned`);
        weeklyAssignments.forEach(wa => {
          const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
          console.log(`      ${dayNames[wa.day_of_week]}: ${wa.site_nom} (${wa.poste})`);
        });
      } catch (e) {
        console.log(`    Weekly assignments: Invalid JSON`);
      }
    });
    
    console.log('\n🎉 Database reset complete!');
    console.log('\n📝 Summary:');
    console.log(`   - ${roteurs.length} active roteurs`);
    console.log(`   - ${sites.length} sites available for roteur coverage`);
    console.log(`   - ${assignments.length} weekly roteur assignments created`);
    console.log('\n💡 The planning calendar should now display the weekly assignments correctly.');
    
  } catch (error) {
    console.error('❌ Error resetting data:', error);
    throw error;
  }
}

// Run the reset
resetRoteurData();

try {
  db.close();
  console.log('✅ Database connection closed');
} catch (err) {
  console.error('❌ Error closing database:', err.message);
}