const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

db.pragma('foreign_keys = OFF');

const run = db.transaction(() => {

  // ============================================================
  // 1. clients_gas — keep the OLDEST record (smallest rowid/cree_le)
  //    delete the newer duplicate
  // ============================================================
  const dupClients = db.prepare(`
    SELECT nom_entreprise, COUNT(*) as cnt FROM clients_gas
    GROUP BY nom_entreprise HAVING cnt > 1
  `).all();

  console.log(`\nCleaning ${dupClients.length} duplicate client names...`);
  let clientsRemoved = 0;

  for (const dup of dupClients) {
    // Get all rows for this name, ordered oldest first
    const rows = db.prepare(`
      SELECT id, cree_le FROM clients_gas
      WHERE nom_entreprise = ?
      ORDER BY cree_le ASC, id ASC
    `).all(dup.nom_entreprise);

    // Keep the first (oldest), delete the rest
    const keepId = rows[0].id;
    const deleteIds = rows.slice(1).map(r => r.id);

    for (const delId of deleteIds) {
      // Reassign any sites_gas referencing the duplicate client to the kept client
      const sitesUpdated = db.prepare(`
        UPDATE sites_gas SET client_id = ? WHERE client_id = ?
      `).run(keepId, delId);
      if (sitesUpdated.changes > 0) {
        console.log(`  Reassigned ${sitesUpdated.changes} site(s) from duplicate client ${delId} → ${keepId}`);
      }

      // Reassign any factures_clients
      const facturesUpdated = db.prepare(`
        UPDATE factures_clients SET client_id = ? WHERE client_id = ?
      `).run(keepId, delId);
      if (facturesUpdated.changes > 0) {
        console.log(`  Reassigned ${facturesUpdated.changes} facture(s) from duplicate client ${delId} → ${keepId}`);
      }

      // Delete the duplicate client
      db.prepare(`DELETE FROM clients_gas WHERE id = ?`).run(delId);
      clientsRemoved++;
    }
  }
  console.log(`  Removed ${clientsRemoved} duplicate client rows.`);

  // ============================================================
  // 2. affectations_roteur — keep oldest, delete duplicates
  // ============================================================
  const dupRoteur = db.prepare(`
    SELECT roteur_id, site_id, date_debut, COUNT(*) as cnt
    FROM affectations_roteur
    GROUP BY roteur_id, site_id, date_debut HAVING cnt > 1
  `).all();

  console.log(`\nCleaning ${dupRoteur.length} duplicate roteur assignments...`);
  let roteurRemoved = 0;

  for (const dup of dupRoteur) {
    const rows = db.prepare(`
      SELECT id FROM affectations_roteur
      WHERE roteur_id = ? AND site_id = ? AND date_debut = ?
      ORDER BY cree_le ASC, id ASC
    `).all(dup.roteur_id, dup.site_id, dup.date_debut);

    const deleteIds = rows.slice(1).map(r => r.id);
    for (const delId of deleteIds) {
      db.prepare(`DELETE FROM affectations_roteur WHERE id = ?`).run(delId);
      roteurRemoved++;
    }
  }
  console.log(`  Removed ${roteurRemoved} duplicate roteur assignment rows.`);

  // ============================================================
  // 3. Verify final counts
  // ============================================================
  console.log('\n=== FINAL COUNTS ===');
  const clientCount = db.prepare('SELECT COUNT(*) as cnt FROM clients_gas').get();
  const siteCount = db.prepare('SELECT COUNT(*) as cnt FROM sites_gas').get();
  const roteurCount = db.prepare('SELECT COUNT(*) as cnt FROM affectations_roteur').get();
  console.log(`  clients_gas: ${clientCount.cnt}`);
  console.log(`  sites_gas: ${siteCount.cnt}`);
  console.log(`  affectations_roteur: ${roteurCount.cnt}`);

  // Verify no more duplicates
  const remainingDupClients = db.prepare(`
    SELECT COUNT(*) as cnt FROM (
      SELECT nom_entreprise FROM clients_gas GROUP BY nom_entreprise HAVING COUNT(*) > 1
    )
  `).get();
  console.log(`  Remaining client duplicates: ${remainingDupClients.cnt}`);

  const remainingDupRoteur = db.prepare(`
    SELECT COUNT(*) as cnt FROM (
      SELECT roteur_id FROM affectations_roteur
      GROUP BY roteur_id, site_id, date_debut HAVING COUNT(*) > 1
    )
  `).get();
  console.log(`  Remaining roteur duplicates: ${remainingDupRoteur.cnt}`);
});

run();
db.pragma('foreign_keys = ON');
db.close();
console.log('\nCleanup complete.');
