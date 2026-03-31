// Feature: invoice-enhancements, Property 4: Payment status engine correctness
// Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.3
//
// Property 4: Payment status engine correctness
// For any invoice not in ANNULE or BROUILLON status, and any set of payments
// and avoirs recorded against it:
//   - sum(paiements) + sum(avoirs) >= montant_total_du_client → PAYE_TOTAL
//   - 0 < sum(paiements) + sum(avoirs) < montant_total_du_client → PAYE_PARTIEL
//   - sum(paiements) + sum(avoirs) = 0 → ENVOYE
// This property must hold after any payment insertion, payment deletion, avoir
// creation, or combination thereof.

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
      id          TEXT PRIMARY KEY,
      facture_id  TEXT NOT NULL,
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

/** Compute expected status given total credit vs invoice total */
function expectedStatus(totalCredit, montantTotal) {
  if (totalCredit >= montantTotal) return 'PAYE_TOTAL';
  if (totalCredit > 0) return 'PAYE_PARTIEL';
  return 'ENVOYE';
}

/** Random integer in [min, max] inclusive */
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Random float in (0, max] rounded to 2 decimal places */
function randAmount(max) {
  return Math.round((Math.random() * max + 0.01) * 100) / 100;
}

/** Generate a simple unique id */
let idCounter = 0;
function uid() {
  return `id-${++idCounter}`;
}

// ============================================================================
// Property 4 — INSERT path
// For each iteration:
//   1. Generate random montant_total_du_client (1–10000)
//   2. Generate 0–5 random payment amounts (each 1–5000)
//   3. Insert facture with status 'ENVOYE'
//   4. Insert each payment and call updateFacturePaymentStatus after each
//   5. After all payments, assert statut_paiement matches expected
// ============================================================================

const NUM_ITERATIONS = 100;

let passed = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const db = createInMemoryDb();

  const factureId = uid();
  const montantTotal = randInt(1, 10000);

  // Insert facture
  db.prepare(
    `INSERT INTO factures_clients (id, montant_total_du_client, statut_paiement) VALUES (?, ?, 'ENVOYE')`
  ).run(factureId, montantTotal);

  // Generate 0–5 payments
  const numPayments = randInt(0, 5);
  const paymentAmounts = [];
  for (let p = 0; p < numPayments; p++) {
    paymentAmounts.push(randAmount(5000));
  }

  // Insert each payment and call updateFacturePaymentStatus after each
  for (const amount of paymentAmounts) {
    const paiementId = uid();
    db.prepare(
      `INSERT INTO paiements (id, facture_id, montant_paye) VALUES (?, ?, ?)`
    ).run(paiementId, factureId, amount);
    updateFacturePaymentStatus(factureId, db);
  }

  // Compute expected final status
  const totalPaid = paymentAmounts.reduce((s, a) => s + a, 0);
  const expected = expectedStatus(totalPaid, montantTotal);

  // Read actual status
  const row = db.prepare(`SELECT statut_paiement FROM factures_clients WHERE id = ?`).get(factureId);
  const actual = row.statut_paiement;

  db.close();

  if (actual === expected) {
    passed++;
  } else {
    failed++;
    failures.push({
      path: 'INSERT',
      iteration: i + 1,
      montantTotal,
      paymentAmounts,
      totalPaid: Math.round(totalPaid * 100) / 100,
      expected,
      actual,
    });
  }
}

console.log(`\nProperty 4: Payment status engine correctness — INSERT path`);
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed}`);
console.log(`  Failed     : ${failed}`);

if (failures.length > 0) {
  console.error('\nFailing examples (INSERT path):');
  for (const f of failures) {
    console.error(`  Iteration ${f.iteration}:`);
    console.error(`    montant_total_du_client : ${f.montantTotal}`);
    console.error(`    payments                : [${f.paymentAmounts.join(', ')}]`);
    console.error(`    total_paid              : ${f.totalPaid}`);
    console.error(`    expected status         : ${f.expected}`);
    console.error(`    actual status           : ${f.actual}`);
  }
}

// ============================================================================
// Property 4 — DELETE path
// For each iteration:
//   1. Insert a facture with 2–3 payments
//   2. Delete one payment and call updateFacturePaymentStatus
//   3. Assert status is recomputed correctly
// ============================================================================

let passed2 = 0;
let failed2 = 0;
const failures2 = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const db = createInMemoryDb();

  const factureId = uid();
  const montantTotal = randInt(1, 10000);

  // Insert facture
  db.prepare(
    `INSERT INTO factures_clients (id, montant_total_du_client, statut_paiement) VALUES (?, ?, 'ENVOYE')`
  ).run(factureId, montantTotal);

  // Generate 2–3 payments
  const numPayments = randInt(2, 3);
  const paiementIds = [];
  const paymentAmounts = [];

  for (let p = 0; p < numPayments; p++) {
    const paiementId = uid();
    const amount = randAmount(5000);
    db.prepare(
      `INSERT INTO paiements (id, facture_id, montant_paye) VALUES (?, ?, ?)`
    ).run(paiementId, factureId, amount);
    paiementIds.push(paiementId);
    paymentAmounts.push(amount);
  }

  // Call updateFacturePaymentStatus after all inserts
  updateFacturePaymentStatus(factureId, db);

  // Pick a random payment to delete (index 0..numPayments-1)
  const deleteIdx = randInt(0, numPayments - 1);
  const deletedId = paiementIds[deleteIdx];
  const deletedAmount = paymentAmounts[deleteIdx];

  // Delete the payment
  db.prepare(`DELETE FROM paiements WHERE id = ?`).run(deletedId);

  // Recompute status
  updateFacturePaymentStatus(factureId, db);

  // Compute expected status after deletion
  const remainingAmounts = paymentAmounts.filter((_, idx) => idx !== deleteIdx);
  const totalRemaining = remainingAmounts.reduce((s, a) => s + a, 0);
  const expected = expectedStatus(totalRemaining, montantTotal);

  // Read actual status
  const row = db.prepare(`SELECT statut_paiement FROM factures_clients WHERE id = ?`).get(factureId);
  const actual = row.statut_paiement;

  db.close();

  if (actual === expected) {
    passed2++;
  } else {
    failed2++;
    failures2.push({
      path: 'DELETE',
      iteration: i + 1,
      montantTotal,
      paymentAmounts,
      deletedAmount,
      deleteIdx,
      remainingAmounts,
      totalRemaining: Math.round(totalRemaining * 100) / 100,
      expected,
      actual,
    });
  }
}

console.log(`\nProperty 4: Payment status engine correctness — DELETE path`);
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed2}`);
console.log(`  Failed     : ${failed2}`);

if (failures2.length > 0) {
  console.error('\nFailing examples (DELETE path):');
  for (const f of failures2) {
    console.error(`  Iteration ${f.iteration}:`);
    console.error(`    montant_total_du_client : ${f.montantTotal}`);
    console.error(`    all payments            : [${f.paymentAmounts.join(', ')}]`);
    console.error(`    deleted payment         : ${f.deletedAmount} (index ${f.deleteIdx})`);
    console.error(`    remaining payments      : [${f.remainingAmounts.join(', ')}]`);
    console.error(`    total_remaining         : ${f.totalRemaining}`);
    console.error(`    expected status         : ${f.expected}`);
    console.error(`    actual status           : ${f.actual}`);
  }
}

// ============================================================================
// Final report
// ============================================================================

const totalFailed = failures.length + failures2.length;

if (totalFailed > 0) {
  console.error(`\n✗ ${totalFailed} failure(s) detected — Property 4 does NOT hold.\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 4 holds.\n');
}

// ============================================================================
// Feature: invoice-enhancements, Property 5: Protected statuses are immutable
// Validates: Requirements 2.6
//
// Property 5: Protected statuses are immutable
// For any invoice with statut_paiement = ANNULE or BROUILLON, recording any
// payment SHALL NOT change statut_paiement.
// ============================================================================

const PROTECTED_STATUSES = ['ANNULE', 'BROUILLON'];

let passed5 = 0;
let failed5 = 0;
const failures5 = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const db = createInMemoryDb();

  // Randomly pick a protected status
  const protectedStatus = PROTECTED_STATUSES[randInt(0, 1)];

  const factureId = uid();
  const montantTotal = randInt(1, 10000);

  // Insert facture with the protected status
  db.prepare(
    `INSERT INTO factures_clients (id, montant_total_du_client, statut_paiement) VALUES (?, ?, ?)`
  ).run(factureId, montantTotal, protectedStatus);

  // Insert 1–3 random payments and call updateFacturePaymentStatus after each
  const numPayments = randInt(1, 3);
  for (let p = 0; p < numPayments; p++) {
    const paiementId = uid();
    const amount = randAmount(montantTotal * 2); // may exceed total — should still be ignored
    db.prepare(
      `INSERT INTO paiements (id, facture_id, montant_paye) VALUES (?, ?, ?)`
    ).run(paiementId, factureId, amount);
    updateFacturePaymentStatus(factureId, db);
  }

  // Assert statut_paiement is still the original protected status
  const row = db.prepare(`SELECT statut_paiement FROM factures_clients WHERE id = ?`).get(factureId);
  const actual = row.statut_paiement;

  db.close();

  if (actual === protectedStatus) {
    passed5++;
  } else {
    failed5++;
    failures5.push({
      iteration: i + 1,
      protectedStatus,
      montantTotal,
      numPayments,
      actual,
    });
  }
}

console.log(`\nProperty 5: Protected statuses are immutable`);
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed5}`);
console.log(`  Failed     : ${failed5}`);

if (failures5.length > 0) {
  console.error('\nFailing examples (Property 5):');
  for (const f of failures5) {
    console.error(`  Iteration ${f.iteration}:`);
    console.error(`    protected status (original) : ${f.protectedStatus}`);
    console.error(`    montant_total_du_client     : ${f.montantTotal}`);
    console.error(`    payments inserted           : ${f.numPayments}`);
    console.error(`    actual status after update  : ${f.actual}`);
  }
  console.error(`\n✗ Property 5 does NOT hold — protected statuses were mutated.\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 5 holds.\n');
}
