const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

function showClient(name) {
  const rows = db.prepare(`SELECT id, nom_entreprise, type_client, telephone, adresse_facturation FROM clients_gas WHERE nom_entreprise LIKE ? ORDER BY nom_entreprise`).all(`%${name}%`);
  rows.forEach(r => console.log(`  CLIENT [${r.type_client}] "${r.nom_entreprise}" id=${r.id} tel=${r.telephone||'-'} addr=${r.adresse_facturation||'-'}`));
  return rows;
}

function showSites(name) {
  const rows = db.prepare(`
    SELECT s.id, s.nom_site, s.client_id, s.tarif_mensuel_client, s.est_actif, c.nom_entreprise as client_nom
    FROM sites_gas s LEFT JOIN clients_gas c ON s.client_id = c.id
    WHERE s.nom_site LIKE ? ORDER BY s.nom_site
  `).all(`%${name}%`);
  rows.forEach(r => console.log(`  SITE "${r.nom_site}" id=${r.id} client="${r.client_nom}" tarif=${r.tarif_mensuel_client} actif=${r.est_actif}`));
  return rows;
}

function showInvoices(clientId) {
  const rows = db.prepare(`SELECT id, numero_facture, statut_paiement, montant_total_du_client FROM factures_clients WHERE client_id = ?`).all(clientId);
  rows.forEach(r => console.log(`    INVOICE ${r.numero_facture} status=${r.statut_paiement} amt=${r.montant_total_du_client}`));
  return rows;
}

console.log('\n========== BISIMWA RODRIGUE ==========');
showClient('Bisimwa');
showSites('Bisimwa');
showSites('Rodrigue');

console.log('\n========== SAVE COMMUNITIES ==========');
showClient('Save');
showSites('Save');

console.log('\n========== HERMAN HANGI ==========');
showClient('Herman');
showSites('Herman');

console.log('\n========== ALBERT / BULIMWENGU ==========');
showClient('Albert');
showClient('Bulimwengu');
showClient('ALBERT');
showSites('Albert');
showSites('Bulimwengu');

console.log('\n========== JOELLE MWAMINI ==========');
showClient('Joelle');
showClient('JOELLE');
showSites('Joelle');
showSites('JOELLE');

console.log('\n========== COEUR SANS FRONTIERES ==========');
showClient('Coeur');
showClient('COEUR');
showClient('CSF');
showSites('Coeur');
showSites('COEUR');
showSites('CSF');

console.log('\n========== PACIFIQUE ==========');
showClient('Pacifique');
showClient('PACIFIQUE');
showSites('Pacifique');
showSites('PACIFIQUE');

console.log('\n========== JUSTIN BALOLA ==========');
showClient('Justin');
showClient('Balola');
showSites('Justin');
showSites('Balola');
showSites('Virunga');
showSites('Entrepot');

console.log('\n========== VIRUNGA ==========');
showClient('Virunga');
showSites('Virunga');

db.close();
