const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

db.pragma('foreign_keys = OFF');

// Helper: merge duplicate client into master
function mergeClient(masterId, dupId, dupName) {
  // Reassign sites
  const s = db.prepare(`UPDATE sites_gas SET client_id = ? WHERE client_id = ?`).run(masterId, dupId);
  // Reassign invoices
  const f = db.prepare(`UPDATE factures_clients SET client_id = ? WHERE client_id = ?`).run(masterId, dupId);
  // Delete duplicate client
  db.prepare(`DELETE FROM clients_gas WHERE id = ?`).run(dupId);
  console.log(`  Merged "${dupName}" → master: sites=${s.changes}, invoices=${f.changes}, client deleted`);
}

// Helper: rename a site
function renameSite(siteId, newName) {
  db.prepare(`UPDATE sites_gas SET nom_site = ? WHERE id = ?`).run(newName, siteId);
  console.log(`  Renamed site ${siteId} → "${newName}"`);
}

const run = db.transaction(() => {

  // ================================================================
  // 1. BISIMWA RODRIGUE
  //    Keep: "Bisimwa Rodrigue" (6cee5ed6)
  //    Merge: "Rodrigue Bisimwa" (522c6fac) → has site "Domicile Rodrigue"
  //    Keep separate: (Chantier) and (Famille) — different billing entities
  // ================================================================
  console.log('\n--- BISIMWA RODRIGUE ---');
  mergeClient(
    '6cee5ed6-c088-469c-987b-db278ec23423', // Bisimwa Rodrigue (master)
    '522c6fac-fee4-419a-baf0-f97b091f9745', // Rodrigue Bisimwa (duplicate)
    'Rodrigue Bisimwa'
  );

  // ================================================================
  // 2. SAVE COMMUNITIES
  //    Keep: "Save Communities in Conflicts" (d41c1123)
  //    Merge: "Save Communities in Conflits (SCC)" (283ad8b1)
  // ================================================================
  console.log('\n--- SAVE COMMUNITIES ---');
  mergeClient(
    'd41c1123-6684-48d3-8021-22f461f00660', // Save Communities in Conflicts (master)
    '283ad8b1-dbc6-4ed4-a76c-537e9849821e', // Save Communities in Conflits (SCC)
    'Save Communities in Conflits (SCC)'
  );
  // Rename the merged site to match master
  renameSite('274c2ab7-5ec0-4f1b-8d1c-4216465cb0ae', 'Save Communities - Site 77');

  // ================================================================
  // 3. HERMAN HANGI
  //    Keep: "Herman Hangi" (12232ce2)
  //    Merge: "Herman Hangi (poulailller)" (63da05b2)
  //    Rename site to clarify it's the poulailler property
  // ================================================================
  console.log('\n--- HERMAN HANGI ---');
  mergeClient(
    '12232ce2-2e86-4b42-817b-89b2bcb6853f', // Herman Hangi (master)
    '63da05b2-db8b-45a9-9030-7034e9e42649', // Herman Hangi (poulailller)
    'Herman Hangi (poulailller)'
  );
  renameSite('69b13725-4bef-4fdc-bbf3-00489df1f097', 'Herman Hangi - Poulailler');

  // ================================================================
  // 4. ALBERT / BULIMWENGU
  //    Keep: "Bulimwengu Walanga Albert" (871890ba) — most complete record
  //    Merge: "ALBERT" (39a830da) and "Albert BULIMWENGU" (a27bc0ce)
  //    Rename sites for clarity
  // ================================================================
  console.log('\n--- ALBERT / BULIMWENGU ---');
  mergeClient(
    '871890ba-2194-48da-9a83-b62a78be4323', // Bulimwengu Walanga Albert (master)
    '39a830da-f205-4d4c-9f20-84065d6929e3', // ALBERT
    'ALBERT'
  );
  mergeClient(
    '871890ba-2194-48da-9a83-b62a78be4323', // Bulimwengu Walanga Albert (master)
    'a27bc0ce-8bd9-43d7-a2d5-1280593c7de6', // Albert BULIMWENGU
    'Albert BULIMWENGU'
  );
  // Rename all 3 sites under one client with clear names
  renameSite('d45c16ec-e8e4-4eff-b49f-fdd93da50ec9', 'Bulimwengu Albert - Site Kyeshero');
  renameSite('84480acc-19b8-4c18-958e-d915a6d70de9', 'Bulimwengu Albert - Site 50');
  renameSite('84b495c7-3fe5-4ae1-8cec-e8c9fbc69dd6', 'Bulimwengu Albert - Site 49');

  // ================================================================
  // 5. JOELLE MWAMINI
  //    Keep: "JOELLE MWAMINI" (81b60f1b)
  //    Merge: "Residence Joelle MWAMINI" (2042300e)
  //    Rename merged site
  // ================================================================
  console.log('\n--- JOELLE MWAMINI ---');
  mergeClient(
    '81b60f1b-cee1-4e81-bdcb-c2554a0fd262', // JOELLE MWAMINI (master)
    '2042300e-766c-4260-8cc9-9157d2e9c33f', // Residence Joelle MWAMINI
    'Residence Joelle MWAMINI'
  );
  renameSite('2ca54846-c3e1-4b1f-8a79-512e8f606f0c', 'Joelle MWAMINI - Residence');

  // ================================================================
  // 6. COEUR SANS FRONTIERES
  //    Keep: "COEUR SANS FRONTIERES" (19057807) as master
  //    Merge: "Coeur-Sans- Frontiere" (7f6cdeaf) — same Himbi location
  //    Keep separate: KIWANJA x2, SAKE, KIHINDO, KANYARUCHINYA — different towns
  //    Also merge the two KIWANJA duplicates: keep "Coeur Sans Frontieres KIWANJA" (4eb1080d)
  //    Merge: "Coeur Sans Frontieres/ KIWANJA" (4d3376e5) — same location, typo variant
  // ================================================================
  console.log('\n--- COEUR SANS FRONTIERES ---');
  mergeClient(
    '19057807-e45c-4fdf-ac18-951abafb145a', // COEUR SANS FRONTIERES (master)
    '7f6cdeaf-8779-4c69-a6e1-4ec6ec253072', // Coeur-Sans- Frontiere
    'Coeur-Sans- Frontiere'
  );
  renameSite('f1565186-a946-4b6e-af46-f46701c50955', 'COEUR SANS FRONTIERES - Site Himbi 2');

  // Merge the two KIWANJA clients
  mergeClient(
    '4eb1080d-62ce-47bf-b21f-c3a66915fb0e', // Coeur Sans Frontieres KIWANJA (master, has tel)
    '4d3376e5-8d9f-494d-9e3c-4eab903f6d14', // Coeur Sans Frontieres/ KIWANJA (typo)
    'Coeur Sans Frontieres/ KIWANJA'
  );
  renameSite('271ccd6f-a58d-49b6-b306-2bdf8caa210c', 'Coeur Sans Frontieres KIWANJA - Site 62');

  // ================================================================
  // 7. PACIFIQUE
  //    These are two different people/locations — keep both clients
  //    Each already has their own site. No merge needed.
  //    Just ensure site names are clear.
  // ================================================================
  console.log('\n--- PACIFIQUE (no merge, just rename sites) ---');
  renameSite('5952cd99-098b-4044-9dab-1d0ec8279bfb', 'Pacifique - Site 2 (Kyeshero)');
  renameSite('a6ee993a-176a-4243-a2ae-717c72d096d1', 'Pacifique - Site 1');

  // ================================================================
  // 8. JUSTIN BALOLA — Entrepot Virunga disambiguation
  //    Justin Balola has: "Entrepot Virunga" (fabbb281, tarif=140) — rename to avoid confusion
  //    Virunga client has: "Entrepot Virunga" (d87f005d, tarif=70) — keep as-is
  // ================================================================
  console.log('\n--- JUSTIN BALOLA / VIRUNGA disambiguation ---');
  renameSite('fabbb281-cda0-4cb2-8d63-dbbc4338ea41', 'Entrepot Virunga (Justin Balola)');

  // ================================================================
  // Final summary
  // ================================================================
  const clientCount = db.prepare('SELECT COUNT(*) as cnt FROM clients_gas').get();
  const siteCount = db.prepare('SELECT COUNT(*) as cnt FROM sites_gas').get();
  console.log(`\n=== FINAL COUNTS ===`);
  console.log(`  clients_gas: ${clientCount.cnt}`);
  console.log(`  sites_gas: ${siteCount.cnt}`);
});

run();
db.pragma('foreign_keys = ON');
db.close();
console.log('\nAll merges complete.');
