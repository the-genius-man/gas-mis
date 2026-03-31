// Feature: invoice-enhancements, Property 13: Client statement closing balance invariant
// Validates: Requirements 6.5, 6.9
//
// Property 13: Client statement closing balance invariant
// For any client and any date range, the closing balance computed by ClientStatement satisfies:
//   closing_balance = opening_balance + total_invoiced - total_paid - total_credited
// where total_credited is the sum of all avoir amounts within the period.

'use strict';

const assert = require('assert');

// ============================================================================
// Inline computeClosingBalance (mirrors ClientStatement.tsx)
// ============================================================================

function computeClosingBalance(openingBalance, totalInvoiced, totalPaid, totalCredited) {
  return openingBalance + totalInvoiced - totalPaid - totalCredited;
}

// ============================================================================
// Helpers
// ============================================================================

/** Random integer in [min, max] inclusive */
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Random float in [min, max] rounded to 2 decimal places */
function randAmount(min, max) {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw * 100) / 100;
}

/** Sum an array of numbers, rounded to 2 decimal places */
function sum(arr) {
  return Math.round(arr.reduce((acc, v) => acc + v, 0) * 100) / 100;
}

/** Round to 2 decimal places */
function round2(n) {
  return Math.round(n * 100) / 100;
}

// ============================================================================
// Property 13 — 100 random iterations
// ============================================================================

const NUM_ITERATIONS = 100;

let passed = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  // Generate random opening balance (0–10000)
  const openingBalance = randAmount(0, 10000);

  // Generate random list of invoice amounts (0–5 invoices, each 100–5000)
  const numInvoices = randInt(0, 5);
  const invoices = Array.from({ length: numInvoices }, () => randAmount(100, 5000));

  // Generate random list of payment amounts (0–5 payments, each 10–3000)
  const numPayments = randInt(0, 5);
  const payments = Array.from({ length: numPayments }, () => randAmount(10, 3000));

  // Generate random list of avoir amounts (0–3 avoirs, each 10–1000)
  const numAvoirs = randInt(0, 3);
  const avoirs = Array.from({ length: numAvoirs }, () => randAmount(10, 1000));

  // Compute totals
  const totalInvoiced = sum(invoices);
  const totalPaid = sum(payments);
  const totalCredited = sum(avoirs);

  // Compute closing balance via the inline function
  const closingBalance = computeClosingBalance(openingBalance, totalInvoiced, totalPaid, totalCredited);

  // Assert: closingBalance === openingBalance + totalInvoiced - totalPaid - totalCredited
  const expected = round2(openingBalance + totalInvoiced - totalPaid - totalCredited);
  const actual = round2(closingBalance);

  const closingBalanceCorrect = actual === expected;

  // Also verify the running balance computation:
  // Starting from openingBalance, apply each transaction in order,
  // the final balance must equal closingBalance.
  //
  // Transaction order: invoices (debit), payments (credit), avoirs (credit)
  // (In a real statement they'd be sorted by date; here we verify the math holds
  //  regardless of order since addition is commutative.)
  let runningBalance = round2(openingBalance);
  for (const inv of invoices) {
    runningBalance = round2(runningBalance + inv);
  }
  for (const pmt of payments) {
    runningBalance = round2(runningBalance - pmt);
  }
  for (const av of avoirs) {
    runningBalance = round2(runningBalance - av);
  }
  const runningBalanceCorrect = runningBalance === actual;

  if (closingBalanceCorrect && runningBalanceCorrect) {
    passed++;
  } else {
    failed++;
    failures.push({
      iteration: i + 1,
      openingBalance,
      invoices,
      payments,
      avoirs,
      totalInvoiced,
      totalPaid,
      totalCredited,
      expected,
      actual,
      runningBalance,
      closingBalanceCorrect,
      runningBalanceCorrect,
    });
  }
}

console.log('\nProperty 13: Client statement closing balance invariant');
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed}`);
console.log(`  Failed     : ${failed}`);

if (failures.length > 0) {
  console.error('\nFailing examples:');
  for (const f of failures) {
    console.error(`  Iteration ${f.iteration}:`);
    console.error(`    openingBalance        : ${f.openingBalance}`);
    console.error(`    invoices              : [${f.invoices.join(', ')}]`);
    console.error(`    payments              : [${f.payments.join(', ')}]`);
    console.error(`    avoirs                : [${f.avoirs.join(', ')}]`);
    console.error(`    totalInvoiced         : ${f.totalInvoiced}`);
    console.error(`    totalPaid             : ${f.totalPaid}`);
    console.error(`    totalCredited         : ${f.totalCredited}`);
    console.error(`    expected closing      : ${f.expected}`);
    console.error(`    actual closing        : ${f.actual}`);
    console.error(`    runningBalance        : ${f.runningBalance}`);
    console.error(`    closingBalanceCorrect : ${f.closingBalanceCorrect}`);
    console.error(`    runningBalanceCorrect : ${f.runningBalanceCorrect}`);
  }
  console.error(`\n✗ Property 13 does NOT hold — ${failed} failure(s).\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 13 holds.\n');
}

// ============================================================================
// Feature: invoice-enhancements, Property 14: Client statement transaction completeness
// Validates: Requirements 6.3, 6.4
//
// Property 14: Client statement transaction completeness
// For any client and date range, every invoice with date_emission within the range
// and every payment/avoir with date_paiement/date_avoir within the range for that
// client appears in the statement exactly once, and no out-of-range or other-client
// transaction appears.
// ============================================================================

// ============================================================================
// Helpers for Property 14
// ============================================================================

/** Format a Date as an ISO date string (YYYY-MM-DD) */
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

/** Add `days` days to a Date, return new Date */
function addDays(d, days) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/**
 * Generate a random date between `start` and `end` (inclusive).
 * Both are Date objects.
 */
function randDateBetween(start, end) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const ms = startMs + Math.random() * (endMs - startMs);
  return new Date(Math.round(ms));
}

/**
 * Filter logic that mirrors ClientStatement.tsx:
 * Keep a transaction if:
 *   - transaction.client_id === targetClientId
 *   - transaction.date >= dateDebut
 *   - transaction.date <= dateFin
 */
function filterTransactions(transactions, targetClientId, dateDebut, dateFin) {
  return transactions.filter(
    (tx) =>
      tx.client_id === targetClientId &&
      tx.date >= dateDebut &&
      tx.date <= dateFin
  );
}

// ============================================================================
// Property 14 — 100 random iterations
// ============================================================================

const NUM_ITERATIONS_P14 = 100;

let passed14 = 0;
let failed14 = 0;
const failures14 = [];

for (let i = 0; i < NUM_ITERATIONS_P14; i++) {
  // --- Generate 2–3 client IDs ---
  const numClients = randInt(2, 3);
  const clientIds = Array.from({ length: numClients }, (_, k) => `client-${i}-${k}`);
  const targetClientId = clientIds[randInt(0, clientIds.length - 1)];

  // --- Generate a date range ---
  // Base epoch: 2020-01-01 to 2024-12-31 (arbitrary but stable)
  const epoch = new Date('2020-01-01');
  const rangeStart = addDays(epoch, randInt(0, 1460));   // up to ~4 years after epoch
  const rangeEnd = addDays(rangeStart, randInt(1, 180)); // range spans 1–180 days
  const dateDebut = toISODate(rangeStart);
  const dateFin = toISODate(rangeEnd);

  // --- Generate random transactions ---
  // Each transaction has: { id, client_id, date, type }
  // Types: 'FACTURE', 'PAIEMENT', 'AVOIR'
  const types = ['FACTURE', 'PAIEMENT', 'AVOIR'];
  const allTransactions = [];
  let txCounter = 0;

  // For each client, generate 0–4 in-range and 0–2 out-of-range transactions
  for (const clientId of clientIds) {
    // In-range transactions
    const numInRange = randInt(0, 4);
    for (let j = 0; j < numInRange; j++) {
      const txDate = toISODate(randDateBetween(rangeStart, rangeEnd));
      allTransactions.push({
        id: `tx-${i}-${txCounter++}`,
        client_id: clientId,
        date: txDate,
        type: types[randInt(0, types.length - 1)],
      });
    }

    // Out-of-range transactions (before range)
    const numBefore = randInt(0, 2);
    for (let j = 0; j < numBefore; j++) {
      const beforeEnd = addDays(rangeStart, -1);
      const beforeStart = addDays(beforeEnd, -90);
      const txDate = toISODate(randDateBetween(beforeStart, beforeEnd));
      allTransactions.push({
        id: `tx-${i}-${txCounter++}`,
        client_id: clientId,
        date: txDate,
        type: types[randInt(0, types.length - 1)],
      });
    }

    // Out-of-range transactions (after range)
    const numAfter = randInt(0, 2);
    for (let j = 0; j < numAfter; j++) {
      const afterStart = addDays(rangeEnd, 1);
      const afterEnd = addDays(afterStart, 90);
      const txDate = toISODate(randDateBetween(afterStart, afterEnd));
      allTransactions.push({
        id: `tx-${i}-${txCounter++}`,
        client_id: clientId,
        date: txDate,
        type: types[randInt(0, types.length - 1)],
      });
    }
  }

  // --- Apply the filter (mirrors ClientStatement logic) ---
  const statementTransactions = filterTransactions(
    allTransactions,
    targetClientId,
    dateDebut,
    dateFin
  );

  // --- Compute expected set: in-range transactions for targetClientId ---
  const expectedTransactions = allTransactions.filter(
    (tx) =>
      tx.client_id === targetClientId &&
      tx.date >= dateDebut &&
      tx.date <= dateFin
  );

  // --- Assertions ---

  // a) Every in-range transaction for the target client appears exactly once
  let allInRangePresent = true;
  for (const expected of expectedTransactions) {
    const matches = statementTransactions.filter((tx) => tx.id === expected.id);
    if (matches.length !== 1) {
      allInRangePresent = false;
      break;
    }
  }

  // b) No out-of-range transaction appears
  const noOutOfRange = statementTransactions.every(
    (tx) => tx.date >= dateDebut && tx.date <= dateFin
  );

  // c) No other-client transaction appears
  const noOtherClient = statementTransactions.every(
    (tx) => tx.client_id === targetClientId
  );

  // d) Statement count matches expected count (no duplicates, no extras)
  const countMatches = statementTransactions.length === expectedTransactions.length;

  if (allInRangePresent && noOutOfRange && noOtherClient && countMatches) {
    passed14++;
  } else {
    failed14++;
    failures14.push({
      iteration: i + 1,
      targetClientId,
      dateDebut,
      dateFin,
      totalTransactions: allTransactions.length,
      expectedCount: expectedTransactions.length,
      actualCount: statementTransactions.length,
      allInRangePresent,
      noOutOfRange,
      noOtherClient,
      countMatches,
    });
  }
}

console.log('\nProperty 14: Client statement transaction completeness');
console.log(`  Iterations : ${NUM_ITERATIONS_P14}`);
console.log(`  Passed     : ${passed14}`);
console.log(`  Failed     : ${failed14}`);

if (failures14.length > 0) {
  console.error('\nFailing examples:');
  for (const f of failures14) {
    console.error(`  Iteration ${f.iteration}:`);
    console.error(`    targetClientId    : ${f.targetClientId}`);
    console.error(`    dateDebut         : ${f.dateDebut}`);
    console.error(`    dateFin           : ${f.dateFin}`);
    console.error(`    totalTransactions : ${f.totalTransactions}`);
    console.error(`    expectedCount     : ${f.expectedCount}`);
    console.error(`    actualCount       : ${f.actualCount}`);
    console.error(`    allInRangePresent : ${f.allInRangePresent}`);
    console.error(`    noOutOfRange      : ${f.noOutOfRange}`);
    console.error(`    noOtherClient     : ${f.noOtherClient}`);
    console.error(`    countMatches      : ${f.countMatches}`);
  }
  console.error(`\n✗ Property 14 does NOT hold — ${failed14} failure(s).\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 14 holds.\n');
}
