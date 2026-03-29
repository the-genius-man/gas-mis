const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

// Row counts per table
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('=== TABLE ROW COUNTS ===');
tables.forEach(t => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM "${t.name}"`).get();
    console.log(`  ${t.name}: ${count.cnt}`);
  } catch(e) {
    console.log(`  ${t.name}: ERROR - ${e.message}`);
  }
});

// Check for duplicates in key tables
console.log('\n=== DUPLICATE CHECKS ===');

// clients_gas - duplicate by nom_entreprise
const dupClients = db.prepare(`
  SELECT nom_entreprise, COUNT(*) as cnt FROM clients_gas
  GROUP BY nom_entreprise HAVING cnt > 1
`).all();
console.log(`clients_gas duplicates (by nom_entreprise): ${dupClients.length}`);
dupClients.forEach(r => console.log(`  "${r.nom_entreprise}" x${r.cnt}`));

// sites_gas - duplicate by nom_site + client_id
const dupSites = db.prepare(`
  SELECT nom_site, client_id, COUNT(*) as cnt FROM sites_gas
  GROUP BY nom_site, client_id HAVING cnt > 1
`).all();
console.log(`sites_gas duplicates (by nom_site+client): ${dupSites.length}`);
dupSites.forEach(r => console.log(`  "${r.nom_site}" x${r.cnt}`));

// employees_gas - duplicate by matricule
const dupEmps = db.prepare(`
  SELECT matricule, COUNT(*) as cnt FROM employees_gas
  GROUP BY matricule HAVING cnt > 1
`).all();
console.log(`employees_gas duplicates (by matricule): ${dupEmps.length}`);
dupEmps.forEach(r => console.log(`  "${r.matricule}" x${r.cnt}`));

// factures_clients - duplicate by numero_facture
const dupFact = db.prepare(`
  SELECT numero_facture, COUNT(*) as cnt FROM factures_clients
  GROUP BY numero_facture HAVING cnt > 1
`).all();
console.log(`factures_clients duplicates (by numero_facture): ${dupFact.length}`);
dupFact.forEach(r => console.log(`  "${r.numero_facture}" x${r.cnt}`));

// factures_clients - same client + same period
const dupPeriod = db.prepare(`
  SELECT client_id, periode_mois, periode_annee, COUNT(*) as cnt
  FROM factures_clients
  GROUP BY client_id, periode_mois, periode_annee HAVING cnt > 1
`).all();
console.log(`factures_clients duplicates (same client+period): ${dupPeriod.length}`);
dupPeriod.forEach(r => console.log(`  client=${r.client_id} period=${r.periode_mois}/${r.periode_annee} x${r.cnt}`));

// paiements - duplicate by facture_id + date + montant
const dupPay = db.prepare(`
  SELECT facture_id, date_paiement, montant_paye, COUNT(*) as cnt
  FROM paiements
  GROUP BY facture_id, date_paiement, montant_paye HAVING cnt > 1
`).all();
console.log(`paiements duplicates: ${dupPay.length}`);
dupPay.forEach(r => console.log(`  facture=${r.facture_id} date=${r.date_paiement} amt=${r.montant_paye} x${r.cnt}`));

// bulletins_paie - duplicate by employe_id + periode_paie_id
const dupBulletins = db.prepare(`
  SELECT employe_id, periode_paie_id, COUNT(*) as cnt
  FROM bulletins_paie
  GROUP BY employe_id, periode_paie_id HAVING cnt > 1
`).all();
console.log(`bulletins_paie duplicates: ${dupBulletins.length}`);

// periodes_paie - duplicate by mois + annee
const dupPeriodes = db.prepare(`
  SELECT mois, annee, COUNT(*) as cnt FROM periodes_paie
  GROUP BY mois, annee HAVING cnt > 1
`).all();
console.log(`periodes_paie duplicates (mois+annee): ${dupPeriodes.length}`);
dupPeriodes.forEach(r => console.log(`  ${r.mois}/${r.annee} x${r.cnt}`));

// users - duplicate by nom_utilisateur
const dupUsers = db.prepare(`
  SELECT nom_utilisateur, COUNT(*) as cnt FROM users
  GROUP BY nom_utilisateur HAVING cnt > 1
`).all();
console.log(`users duplicates: ${dupUsers.length}`);
dupUsers.forEach(r => console.log(`  "${r.nom_utilisateur}" x${r.cnt}`));

// affectations_roteur - duplicate roteur+site+date_debut
const dupRoteur = db.prepare(`
  SELECT roteur_id, site_id, date_debut, COUNT(*) as cnt
  FROM affectations_roteur
  GROUP BY roteur_id, site_id, date_debut HAVING cnt > 1
`).all();
console.log(`affectations_roteur duplicates: ${dupRoteur.length}`);

db.close();
console.log('\nDone.');
