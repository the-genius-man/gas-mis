const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

// ============================================================
// 1. sites_gas duplicates (by nom_site regardless of client)
// ============================================================
console.log('=== SITES_GAS DUPLICATE CHECK ===');

const dupSitesByName = db.prepare(`
  SELECT nom_site, COUNT(*) as cnt FROM sites_gas
  GROUP BY nom_site HAVING cnt > 1
  ORDER BY cnt DESC, nom_site
`).all();
console.log(`Duplicate site names (any client): ${dupSitesByName.length}`);
dupSitesByName.forEach(r => console.log(`  "${r.nom_site}" x${r.cnt}`));

const dupSitesByNameClient = db.prepare(`
  SELECT nom_site, client_id, COUNT(*) as cnt FROM sites_gas
  GROUP BY nom_site, client_id HAVING cnt > 1
`).all();
console.log(`\nDuplicate site+client combos: ${dupSitesByNameClient.length}`);

// ============================================================
// 2. All clients list
// ============================================================
console.log('\n=== ALL CLIENTS (clients_gas) ===');
const clients = db.prepare(`
  SELECT id, nom_entreprise, type_client, telephone, adresse_facturation
  FROM clients_gas ORDER BY nom_entreprise
`).all();
console.log(`Total: ${clients.length}`);
clients.forEach(c => console.log(`  [${c.type_client}] "${c.nom_entreprise}" | tel: ${c.telephone || '-'} | addr: ${c.adresse_facturation || '-'}`));

// ============================================================
// 3. All sites list
// ============================================================
console.log('\n=== ALL SITES (sites_gas) ===');
const sites = db.prepare(`
  SELECT s.id, s.nom_site, s.adresse_physique, s.est_actif,
         c.nom_entreprise as client_nom
  FROM sites_gas s
  LEFT JOIN clients_gas c ON s.client_id = c.id
  ORDER BY s.nom_site
`).all();
console.log(`Total: ${sites.length}`);
sites.forEach(s => console.log(`  "${s.nom_site}" → client: "${s.client_nom || 'ORPHAN'}" | addr: ${s.adresse_physique || '-'} | actif: ${s.est_actif}`));

// ============================================================
// 4. Cross-check: site names that match client names exactly
// ============================================================
console.log('\n=== SITES THAT MATCH CLIENT NAMES (exact) ===');
const siteMatchingClient = db.prepare(`
  SELECT s.id as site_id, s.nom_site, s.client_id,
         c_owner.nom_entreprise as owner_client,
         c_match.id as matched_client_id, c_match.nom_entreprise as matched_client_name
  FROM sites_gas s
  LEFT JOIN clients_gas c_owner ON s.client_id = c_owner.id
  JOIN clients_gas c_match ON LOWER(TRIM(s.nom_site)) = LOWER(TRIM(c_match.nom_entreprise))
  ORDER BY s.nom_site
`).all();
console.log(`Found ${siteMatchingClient.length} site(s) whose name matches a client name:`);
siteMatchingClient.forEach(r => {
  const isSameClient = r.client_id === r.matched_client_id;
  console.log(`  Site: "${r.nom_site}" (owner: "${r.owner_client}") → matches client: "${r.matched_client_name}" ${isSameClient ? '[SELF - site named after its own client]' : '[DIFFERENT CLIENT]'}`);
});

// ============================================================
// 5. Cross-check: fuzzy — site names contained in client names or vice versa
// ============================================================
console.log('\n=== FUZZY MATCHES (site name contained in client name or vice versa) ===');
const allSites = db.prepare('SELECT id, nom_site, client_id FROM sites_gas').all();
const allClients = db.prepare('SELECT id, nom_entreprise FROM clients_gas').all();

const fuzzyMatches = [];
for (const site of allSites) {
  const sn = site.nom_site.toLowerCase().trim();
  for (const client of allClients) {
    const cn = client.nom_entreprise.toLowerCase().trim();
    // Skip if it's the site's own client
    if (client.id === site.client_id) continue;
    // Check if one contains the other (min 6 chars to avoid noise)
    if (sn.length >= 6 && cn.length >= 6) {
      if (cn.includes(sn) || sn.includes(cn)) {
        fuzzyMatches.push({ site: site.nom_site, client: client.nom_entreprise, site_client_id: site.client_id });
      }
    }
  }
}
console.log(`Found ${fuzzyMatches.length} fuzzy match(es):`);
fuzzyMatches.forEach(m => {
  const owner = allClients.find(c => c.id === m.site_client_id);
  console.log(`  Site: "${m.site}" (belongs to: "${owner?.nom_entreprise || 'unknown'}") ↔ Client: "${m.client}"`);
});

// ============================================================
// 6. Orphan sites (client_id not in clients_gas)
// ============================================================
console.log('\n=== ORPHAN SITES (client not found) ===');
const orphans = db.prepare(`
  SELECT s.id, s.nom_site, s.client_id
  FROM sites_gas s
  LEFT JOIN clients_gas c ON s.client_id = c.id
  WHERE c.id IS NULL
`).all();
console.log(`Orphan sites: ${orphans.length}`);
orphans.forEach(s => console.log(`  "${s.nom_site}" (client_id: ${s.client_id})`));

db.close();
console.log('\nAnalysis complete.');
