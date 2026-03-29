const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

db.pragma('foreign_keys = OFF');

const run = db.transaction(() => {

  // Get all duplicate site groups (same nom_site + client_id)
  const dupGroups = db.prepare(`
    SELECT nom_site, client_id, COUNT(*) as cnt FROM sites_gas
    GROUP BY nom_site, client_id HAVING cnt > 1
    ORDER BY nom_site
  `).all();

  console.log(`\nCleaning ${dupGroups.length} duplicate site groups...`);
  let removed = 0;

  for (const dup of dupGroups) {
    // Get all rows for this site+client, prefer actif=1, then oldest
    const rows = db.prepare(`
      SELECT id, est_actif, tarif_mensuel_client, cree_le FROM sites_gas
      WHERE nom_site = ? AND client_id = ?
      ORDER BY est_actif DESC, tarif_mensuel_client DESC, cree_le ASC
    `).all(dup.nom_site, dup.client_id);

    const keepId = rows[0].id;
    const deleteIds = rows.slice(1).map(r => r.id);

    console.log(`  "${dup.nom_site}" x${dup.cnt} → keeping ${keepId} (actif=${rows[0].est_actif}, tarif=${rows[0].tarif_mensuel_client})`);

    for (const delId of deleteIds) {
      // Reassign factures_details referencing the duplicate site
      const detailsUpdated = db.prepare(`
        UPDATE factures_details SET site_id = ? WHERE site_id = ?
      `).run(keepId, delId);
      if (detailsUpdated.changes > 0) {
        console.log(`    Reassigned ${detailsUpdated.changes} facture_detail(s) from site ${delId} → ${keepId}`);
      }

      // Reassign historique_deployements
      const histUpdated = db.prepare(`
        UPDATE historique_deployements SET site_id = ? WHERE site_id = ?
      `).run(keepId, delId);
      if (histUpdated.changes > 0) {
        console.log(`    Reassigned ${histUpdated.changes} deployment(s) from site ${delId} → ${keepId}`);
      }

      // Reassign affectations_roteur
      const roteurUpdated = db.prepare(`
        UPDATE affectations_roteur SET site_id = ? WHERE site_id = ?
      `).run(keepId, delId);
      if (roteurUpdated.changes > 0) {
        console.log(`    Reassigned ${roteurUpdated.changes} roteur assignment(s) from site ${delId} → ${keepId}`);
      }

      // Reassign employees_gas.site_affecte_id
      const empUpdated = db.prepare(`
        UPDATE employees_gas SET site_affecte_id = ? WHERE site_affecte_id = ?
      `).run(keepId, delId);
      if (empUpdated.changes > 0) {
        console.log(`    Reassigned ${empUpdated.changes} employee(s) from site ${delId} → ${keepId}`);
      }

      db.prepare(`DELETE FROM sites_gas WHERE id = ?`).run(delId);
      removed++;
    }
  }

  console.log(`\nRemoved ${removed} duplicate site rows.`);

  // Final counts
  const siteCount = db.prepare('SELECT COUNT(*) as cnt FROM sites_gas').get();
  const remaining = db.prepare(`
    SELECT COUNT(*) as cnt FROM (
      SELECT nom_site, client_id FROM sites_gas
      GROUP BY nom_site, client_id HAVING COUNT(*) > 1
    )
  `).get();
  console.log(`\nFinal sites_gas count: ${siteCount.cnt}`);
  console.log(`Remaining duplicates: ${remaining.cnt}`);
});

run();
db.pragma('foreign_keys = ON');
db.close();
console.log('Done.');
