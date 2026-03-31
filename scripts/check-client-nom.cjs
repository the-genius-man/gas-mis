const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

// Add column if it doesn't exist
try {
  db.exec(`ALTER TABLE factures_clients ADD COLUMN client_nom TEXT`);
  console.log('Column client_nom added.');
} catch (e) {
  console.log('Column already exists.');
}

// Backfill
const result = db.prepare(`
  UPDATE factures_clients
  SET client_nom = (
    SELECT nom_entreprise FROM clients_gas WHERE clients_gas.id = factures_clients.client_id
  )
  WHERE client_nom IS NULL OR client_nom = ''
`).run();
console.log(`Backfilled ${result.changes} invoice(s).`);

const total = db.prepare('SELECT COUNT(*) as cnt FROM factures_clients').get();
const withName = db.prepare('SELECT COUNT(*) as cnt FROM factures_clients WHERE client_nom IS NOT NULL').get();
const stillMissing = db.prepare('SELECT COUNT(*) as cnt FROM factures_clients WHERE client_nom IS NULL').get();

console.log(`Total: ${total.cnt} | With name: ${withName.cnt} | Still missing: ${stillMissing.cnt}`);
db.close();
