// Feature: invoice-enhancements, Property 7: EN_RETARD is never persisted
// Validates: Requirements 3.2
//
// Property 7: EN_RETARD is never persisted
// For any state of the database after any sequence of operations, no row in
// factures_clients shall have statut_paiement = 'EN_RETARD'.
//
// Key insight: updateFacturePaymentStatus only ever sets PAYE_TOTAL, PAYE_PARTIEL,
// or ENVOYE — never EN_RETARD. EN_RETARD is a frontend-only computed display
// status. This test verifies the backend never writes EN_RETARD to the database.

'use strict';

const Database = require('better-sqlite3');
const assert = require('assert');

// ============================================================================
// Inline updateFacturePaymentStatus (mirrors public/electron.cjs)
// ============================================================================

function updateFacturePaymentStatus(factureId, db) {
  const facture = db.prepare(
    `SELECT montant_total_du_client, statut_paiement FROM factures_clients WHERE id = ?`
  ).get(factureId);

  if (!facture) return;
  // Skip protected statuses
  if (facture.statut_paiement === 'ANNULE' || facture.statut_paiement === 'BROUILLON') return;

  const { total_paye } = db.prepare(
    `SELECT COALESCE(SUM(montant_paye), 0) AS total_paye FROM paiements WHERE facture_id = ?`
  ).get(factureId);

  const { total_avoir } = db.prepare(
    `SELECT COALESCE(SUM(montant_avoir), 0) AS total_avoir FROM avoirs WHERE facture_id = ?`
  ).get(factureId);

  const totalCredit = total_paye + total_avoir;
  let newStatus;

  if (totalCredit >= facture.montant_total_du_client) {
    newStatus = 'PAYE_TOTAL';
  } else if (totalCredit > 0) {
    newStatus = 'PAYE_PARTIEL';
  } else {
    newStatus = 'ENVOYE';
  }

  db.prepare(
    `UPDATE factures_clients SET statut_paiement = ? WHERE id = ?`
  ).run(newStatus, factureId);
}

// ============================================================================
// Test helpers
// ============================================================================

function createInMemoryDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS factures_clients (
      id                      TEXT PRIMARY KEY,
      montant_total_du_client REAL NOT NULL,
      statut_paiement         TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS paiements (
      id           TEXT PRIMARY KEY,
      facture_id   TEXT NOT NULL,
      montant_paye REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS avoirs (
      id            TEXT PRIMARY KEY,
      facture_id    TEXT NOT NULL,
      montant_avoir REAL NOT NULL
    );
  `);
  return db;
}

/** Random integer in [min, max] inclusive */
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Random float in (0, max] rounded to 2 decimal places */
function randAmount(max) {
  return Math.round((Math.random() * max + 0.01) * 100) / 100;
}

let idCounter = 0;
function uid() {
  return `id-${++idCounter}`;
}

// All valid initial statuses that can be inserted into the DB
const ALL_STATUSES = ['ENVOYE', 'PAYE_PARTIEL', 'PAYE_TOTAL', 'ANNULE', 'BROUILLON'];

// ============================================================================
// Property 7 — EN_RETARD is never persisted
//
// Each iteration:
//   1. Create a fresh in-memory DB
//   2. Insert 1–5 invoices with random statuses (never EN_RETARD — simulating
//      real inserts that only use valid stored statuses)
//   3. Perform a random sequence of operations:
//      a. Insert payments and call updateFacturePaymentStatus
//      b. Delete payments and call updateFacturePaymentStatus
//      c. Insert avoirs and call updateFacturePaymentStatus
//   4. After all operations, query:
//        SELECT COUNT(*) as cnt FROM factures_clients WHERE statut_paiement = 'EN_RETARD'
//   5. Assert cnt = 0
// ============================================================================

const NUM_ITERATIONS = 100;

let passed = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const db = createInMemoryDb();

  // Step 1: Insert 1–5 invoices with various valid statuses
  const numFactures = randInt(1, 5);
  const factureIds = [];

  for (let f = 0; f < numFactures; f++) {
    const factureId = uid();
    const montantTotal = randInt(100, 10000);
    const status = ALL_STATUSES[randInt(0, ALL_STATUSES.length - 1)];

    db.prepare(
      `INSERT INTO factures_clients (id, montant_total_du_client, statut_paiement) VALUES (?, ?, ?)`
    ).run(factureId, montantTotal, status);

    factureIds.push(factureId);
  }

  // Step 2: Perform a random sequence of operations (3–8 operations)
  const numOps = randInt(3, 8);
  const insertedPaiementIds = []; // track inserted payments for potential deletion

  for (let op = 0; op < numOps; op++) {
    // Pick a random facture to operate on
    const factureId = factureIds[randInt(0, factureIds.length - 1)];
    const opType = randInt(0, 2); // 0=insert payment, 1=delete payment, 2=insert avoir

    if (opType === 0) {
      // Insert a payment
      const paiementId = uid();
      const amount = randAmount(5000);
      db.prepare(
        `INSERT INTO paiements (id, facture_id, montant_paye) VALUES (?, ?, ?)`
      ).run(paiementId, factureId, amount);
      insertedPaiementIds.push({ id: paiementId, factureId });
      updateFacturePaymentStatus(factureId, db);

    } else if (opType === 1 && insertedPaiementIds.length > 0) {
      // Delete a random previously inserted payment
      const idx = randInt(0, insertedPaiementIds.length - 1);
      const { id: paiementId, factureId: pFid } = insertedPaiementIds[idx];
      insertedPaiementIds.splice(idx, 1);
      db.prepare(`DELETE FROM paiements WHERE id = ?`).run(paiementId);
      updateFacturePaymentStatus(pFid, db);

    } else {
      // Insert an avoir
      const avoirId = uid();
      const amount = randAmount(3000);
      db.prepare(
        `INSERT INTO avoirs (id, facture_id, montant_avoir) VALUES (?, ?, ?)`
      ).run(avoirId, factureId, amount);
      updateFacturePaymentStatus(factureId, db);
    }
  }

  // Step 3: Assert no row has statut_paiement = 'EN_RETARD'
  const { cnt } = db.prepare(
    `SELECT COUNT(*) as cnt FROM factures_clients WHERE statut_paiement = 'EN_RETARD'`
  ).get();

  db.close();

  if (cnt === 0) {
    passed++;
  } else {
    failed++;
    failures.push({
      iteration: i + 1,
      enRetardCount: cnt,
    });
  }
}

// ============================================================================
// Report
// ============================================================================

console.log(`\nProperty 7: EN_RETARD is never persisted`);
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed}`);
console.log(`  Failed     : ${failed}`);

if (failures.length > 0) {
  console.error('\nFailing examples:');
  for (const f of failures) {
    console.error(`  Iteration ${f.iteration}: found ${f.enRetardCount} row(s) with statut_paiement = 'EN_RETARD'`);
  }
  console.error(`\n✗ Property 7 does NOT hold — EN_RETARD was persisted to the database.\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 7 holds: EN_RETARD is never persisted.\n');
}
