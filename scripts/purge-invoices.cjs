const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

db.pragma('foreign_keys = OFF');

const run = db.transaction(() => {
  const payments = db.prepare('DELETE FROM paiements').run();
  const details = db.prepare('DELETE FROM factures_details').run();
  const invoices = db.prepare('DELETE FROM factures_clients').run();

  console.log(`Deleted ${payments.changes} payment(s)`);
  console.log(`Deleted ${details.changes} invoice detail(s)`);
  console.log(`Deleted ${invoices.changes} invoice(s)`);
});

run();
db.pragma('foreign_keys = ON');
db.close();
console.log('Done.');
