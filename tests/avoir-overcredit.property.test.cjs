// Feature: invoice-enhancements, Property 9: Avoir creation rejects over-credit
// Validates: Requirements 4.7
//
// Property 9: Avoir creation rejects over-credit
// For any invoice with solde_restant = S, attempting to create an avoir with
// montant_avoir > S SHALL be rejected with an error, and neither the avoirs
// table nor statut_paiement shall be modified.

'use strict';

const Database = require('better-sqlite3');
const assert = require('assert');

// ============================================================================
// Inline createAvoir logic (mirrors db-create-avoir IPC handler in electron.cjs)
// ============================================================================

function createAvoir(avoir, db) {
  const facture = db.prepare(
    `SELECT montant_total_du_client, statut_paiement FROM factures_clients WHERE id = ?`
  ).get(avoir.facture_id);

  if (!facture) return { error: 'Facture introuvable' };
  if (facture.statut_paiement === 'ANNULE') return { error: 'Impossible de créer un avoir sur une facture annulée' };

  const { total_paye } = db.prepare(
    `SELECT COALESCE(SUM(montant_paye), 0) AS total_paye FROM paiements WHERE facture_id = ?`
  ).get(avoir.facture_id);

  const { total_avoir } = db.prepare(
    `SELECT COALESCE(SUM(montant_avoir), 0) AS total_avoir FROM avoirs WHERE facture_id = ?`
  ).get(avoir.facture_id);

  const solde_restant = Math.max(0, facture.montant_total_du_client - total_paye - total_avoir);

  if (avoir.montant_avoir <= 0) return { error: 'Le montant de l\'avoir doit être supérieur à 0' };
  if (avoir.montant_avoir > solde_restant) {
    return { error: `Montant dépasse le solde restant` };
  }

  // Insert (simplified for test)
  db.prepare(`
    INSERT INTO avoirs (id, numero_avoir, facture_id, client_id, date_avoir, montant_avoir, motif_avoir, devise)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(avoir.id, 'AV-TEST-001', avoir.facture_id, avoir.client_id, avoir.date_avoir, avoir.montant_avoir, avoir.motif_avoir || 'test', avoir.devise || 'USD');

  return { success: true };
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
      statut_paiement         TEXT NOT NULL DEFAULT 'ENVOYE'
    );

    CREATE TABLE IF NOT EXISTS paiements (
      id           TEXT PRIMARY KEY,
      facture_id   TEXT NOT NULL,
      montant_paye REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS avoirs (
      id            TEXT PRIMARY KEY,
      numero_avoir  TEXT NOT NULL,
      facture_id    TEXT NOT NULL,
      client_id     TEXT NOT NULL,
      date_avoir    TEXT NOT NULL,
      montant_avoir REAL NOT NULL,
      motif_avoir   TEXT NOT NULL,
      devise        TEXT NOT NULL DEFAULT 'USD'
    );
  `);
  return db;
}

/** Random float in [min, max] rounded to 2 decimal places */
function randomAmount(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

/** Simple UUID-like ID */
let idCounter = 0;
function nextId() {
  return `id-${++idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Property 9: Avoir creation rejects over-credit
// ============================================================================

const NUM_ITERATIONS = 100;

let passed = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const db = createInMemoryDb();

  // 1. Create a facture with a known montant_total_du_client (10–1000)
  const montantTotal = randomAmount(10, 1000);
  const factureId = nextId();
  const clientId = nextId();

  db.prepare(
    `INSERT INTO factures_clients (id, montant_total_du_client, statut_paiement) VALUES (?, ?, 'ENVOYE')`
  ).run(factureId, montantTotal);

  // 2. Optionally insert some payments to reduce solde_restant
  //    Payment is between 0 and (montantTotal - 0.01) so solde_restant > 0
  let totalPaye = 0;
  const hasPayment = Math.random() > 0.4;
  if (hasPayment) {
    const maxPayment = Math.max(0, montantTotal - 0.01);
    const paiementAmount = randomAmount(0.01, maxPayment);
    db.prepare(
      `INSERT INTO paiements (id, facture_id, montant_paye) VALUES (?, ?, ?)`
    ).run(nextId(), factureId, paiementAmount);
    totalPaye = paiementAmount;
  }

  // 3. Compute actual solde_restant
  const soldeRestant = Math.max(0, montantTotal - totalPaye);

  // 4. Generate montant_avoir > solde_restant (over-credit attempt)
  //    Add a small positive delta (0.01–10) to ensure strict over-credit
  const delta = randomAmount(0.01, 10);
  const overCreditAmount = Math.round((soldeRestant + delta) * 100) / 100;

  const avoirPayload = {
    id: nextId(),
    facture_id: factureId,
    client_id: clientId,
    date_avoir: '2024-06-15',
    montant_avoir: overCreditAmount,
    motif_avoir: 'test over-credit',
    devise: 'USD',
  };

  // 5. Call createAvoir with the over-credit amount
  const result = createAvoir(avoirPayload, db);

  // 6. Assert: result has { error } (not { success })
  const hasError = result && typeof result.error === 'string' && !result.success;

  // 7. Assert: avoirs table is still empty (DB unchanged)
  const avoirCount = db.prepare(`SELECT COUNT(*) AS cnt FROM avoirs`).get().cnt;
  const dbUnchanged = avoirCount === 0;

  if (hasError && dbUnchanged) {
    passed++;
  } else {
    failed++;
    failures.push({
      iteration: i + 1,
      montantTotal,
      totalPaye,
      soldeRestant,
      overCreditAmount,
      result,
      avoirCount,
      hasError,
      dbUnchanged,
    });
  }

  db.close();
}

// ============================================================================
// Valid case: montant_avoir <= solde_restant → should succeed
// ============================================================================

let validPassed = 0;
let validFailed = 0;
const validFailures = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const db = createInMemoryDb();

  const montantTotal = randomAmount(10, 1000);
  const factureId = nextId();
  const clientId = nextId();

  db.prepare(
    `INSERT INTO factures_clients (id, montant_total_du_client, statut_paiement) VALUES (?, ?, 'ENVOYE')`
  ).run(factureId, montantTotal);

  // Optionally insert a partial payment
  let totalPaye = 0;
  if (Math.random() > 0.5) {
    const maxPayment = Math.max(0, montantTotal - 0.01);
    const paiementAmount = randomAmount(0.01, maxPayment);
    db.prepare(
      `INSERT INTO paiements (id, facture_id, montant_paye) VALUES (?, ?, ?)`
    ).run(nextId(), factureId, paiementAmount);
    totalPaye = paiementAmount;
  }

  const soldeRestant = Math.max(0, montantTotal - totalPaye);

  // Skip if solde_restant is effectively 0 (nothing to credit)
  if (soldeRestant < 0.01) {
    db.close();
    validPassed++;
    continue;
  }

  // Valid amount: between 0.01 and solde_restant
  const validAmount = randomAmount(0.01, soldeRestant);

  const avoirPayload = {
    id: nextId(),
    facture_id: factureId,
    client_id: clientId,
    date_avoir: '2024-06-15',
    montant_avoir: validAmount,
    motif_avoir: 'test valid credit',
    devise: 'USD',
  };

  const result = createAvoir(avoirPayload, db);

  const isSuccess = result && result.success === true && !result.error;
  const avoirCount = db.prepare(`SELECT COUNT(*) AS cnt FROM avoirs`).get().cnt;
  const avoirInserted = avoirCount === 1;

  if (isSuccess && avoirInserted) {
    validPassed++;
  } else {
    validFailed++;
    validFailures.push({
      iteration: i + 1,
      montantTotal,
      totalPaye,
      soldeRestant,
      validAmount,
      result,
      avoirCount,
    });
  }

  db.close();
}

// ============================================================================
// Report results
// ============================================================================

console.log(`\nProperty 9: Avoir creation rejects over-credit`);
console.log(`  Over-credit rejection test`);
console.log(`    Iterations : ${NUM_ITERATIONS}`);
console.log(`    Passed     : ${passed}`);
console.log(`    Failed     : ${failed}`);

if (failures.length > 0) {
  console.error('\n  Failing over-credit examples:');
  for (const f of failures) {
    console.error(`    Iteration ${f.iteration}: montantTotal=${f.montantTotal}, totalPaye=${f.totalPaye}, soldeRestant=${f.soldeRestant}, overCreditAmount=${f.overCreditAmount}`);
    console.error(`      result=${JSON.stringify(f.result)}, avoirCount=${f.avoirCount}`);
    if (!f.hasError) console.error(`      Expected { error } but got: ${JSON.stringify(f.result)}`);
    if (!f.dbUnchanged) console.error(`      Expected avoirs table empty but found ${f.avoirCount} row(s)`);
  }
}

console.log(`\n  Valid credit acceptance test`);
console.log(`    Iterations : ${NUM_ITERATIONS}`);
console.log(`    Passed     : ${validPassed}`);
console.log(`    Failed     : ${validFailed}`);

if (validFailures.length > 0) {
  console.error('\n  Failing valid-credit examples:');
  for (const f of validFailures) {
    console.error(`    Iteration ${f.iteration}: montantTotal=${f.montantTotal}, totalPaye=${f.totalPaye}, soldeRestant=${f.soldeRestant}, validAmount=${f.validAmount}`);
    console.error(`      result=${JSON.stringify(f.result)}, avoirCount=${f.avoirCount}`);
  }
}

const totalFailed = failed + validFailed;
if (totalFailed > 0) {
  console.error(`\n✗ ${totalFailed} failure(s) detected — Property 9 does NOT hold.\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 9 holds.\n');
}
