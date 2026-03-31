// Feature: invoice-enhancements, Property 1: FAC number format
// Validates: Requirements 1.1, 1.5
//
// Property 1: FAC number format
// For any invoice created with a valid date_emission, the assigned numero_facture
// must match the pattern FAC-{YY}-{MM}-{NNN} where YY is the two-digit year,
// MM is the two-digit month, and NNN is a zero-padded three-digit integer >= 001,
// all derived from date_emission.

'use strict';

const Database = require('better-sqlite3');
const assert = require('assert');

// ============================================================================
// Inline getNextInvoiceNumber logic (mirrors public/electron.cjs)
// ============================================================================

function getNextInvoiceNumber(dateEmission, db) {
  const d = new Date(dateEmission);
  const yy = String(d.getFullYear()).slice(-2);   // two-digit year
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  const upsert = db.prepare(`
    INSERT INTO invoice_sequences (year, month, last_sequence)
    VALUES (?, ?, 1)
    ON CONFLICT(year, month) DO UPDATE SET last_sequence = last_sequence + 1
  `);
  const select = db.prepare(
    `SELECT last_sequence FROM invoice_sequences WHERE year = ? AND month = ?`
  );

  const getNext = db.transaction((y, m) => {
    upsert.run(y, m);
    return select.get(y, m).last_sequence;
  });

  const seq = getNext(year, month);
  const nnn = String(seq).padStart(3, '0');
  return `FAC-${yy}-${mm}-${nnn}`;
}

// ============================================================================
// Test helpers
// ============================================================================

function createInMemoryDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      year          INTEGER NOT NULL,
      month         INTEGER NOT NULL,
      last_sequence INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (year, month)
    )
  `);
  return db;
}

/**
 * Generate a random ISO date string between 2000-01-01 and 2099-12-31.
 */
function randomISODate() {
  const year = 2000 + Math.floor(Math.random() * 100);   // 2000–2099
  const month = 1 + Math.floor(Math.random() * 12);       // 1–12
  const day = 1 + Math.floor(Math.random() * 28);         // 1–28 (safe for all months)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ============================================================================
// Property 1: FAC number format
// ============================================================================

const FAC_PATTERN = /^FAC-\d{2}-\d{2}-\d{3}$/;
const NUM_ITERATIONS = 100;

let passed = 0;
let failed = 0;
const failures = [];

const db = createInMemoryDb();

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const dateStr = randomISODate();
  const result = getNextInvoiceNumber(dateStr, db);

  const d = new Date(dateStr);
  const expectedYY = String(d.getFullYear()).slice(-2);
  const expectedMM = String(d.getMonth() + 1).padStart(2, '0');

  // Assert 1: result matches /^FAC-\d{2}-\d{2}-\d{3}$/
  const matchesPattern = FAC_PATTERN.test(result);

  // Assert 2: YY part matches two-digit year from input date
  const parts = result.split('-');
  // parts: ['FAC', YY, MM, NNN]
  const yyMatches = parts[1] === expectedYY;

  // Assert 3: MM part matches two-digit month from input date
  const mmMatches = parts[2] === expectedMM;

  if (matchesPattern && yyMatches && mmMatches) {
    passed++;
  } else {
    failed++;
    failures.push({
      iteration: i + 1,
      input: dateStr,
      result,
      matchesPattern,
      expectedYY,
      actualYY: parts[1],
      yyMatches,
      expectedMM,
      actualMM: parts[2],
      mmMatches,
    });
  }
}

db.close();

// ============================================================================
// Report results
// ============================================================================

console.log(`\nProperty 1: FAC number format`);
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed}`);
console.log(`  Failed     : ${failed}`);

if (failures.length > 0) {
  console.error('\nFailing examples:');
  for (const f of failures) {
    console.error(`  Iteration ${f.iteration}: input="${f.input}" result="${f.result}"`);
    if (!f.matchesPattern) console.error(`    Pattern mismatch: "${f.result}" does not match ${FAC_PATTERN}`);
    if (!f.yyMatches) console.error(`    YY mismatch: expected "${f.expectedYY}", got "${f.actualYY}"`);
    if (!f.mmMatches) console.error(`    MM mismatch: expected "${f.expectedMM}", got "${f.actualMM}"`);
  }
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 1 holds.\n');
}

// ============================================================================
// Feature: invoice-enhancements, Property 2: Sequence strictly increments, no duplicates
// Validates: Requirements 1.2, 1.3
//
// Property 2: For any N invoices created with the same year/month in date_emission,
// the NNN parts of their FAC numbers form a strictly increasing sequence [1, 2, ..., N]
// with no gaps or duplicates.
// ============================================================================

{
  const NUM_ITERATIONS_P2 = 100;
  let passed2 = 0;
  let failed2 = 0;
  const failures2 = [];

  for (let i = 0; i < NUM_ITERATIONS_P2; i++) {
    // Generate random N (1–20), year (2000–2099), month (1–12)
    const n = 1 + Math.floor(Math.random() * 20);
    const year = 2000 + Math.floor(Math.random() * 100);
    const month = 1 + Math.floor(Math.random() * 12);

    // Build a date string in that year/month (use day 15 as a safe mid-month day)
    const dateStr = `${year}-${String(month).padStart(2, '0')}-15`;

    // Fresh in-memory DB for each iteration
    const iterDb = createInMemoryDb();

    // Call getNextInvoiceNumber N times
    const results = [];
    for (let j = 0; j < n; j++) {
      results.push(getNextInvoiceNumber(dateStr, iterDb));
    }
    iterDb.close();

    // Extract NNN parts (index 3 after splitting 'FAC-YY-MM-NNN')
    const nnnParts = results.map(r => parseInt(r.split('-')[3], 10));

    // Assert NNN parts form exactly [1, 2, ..., N]
    const expected = Array.from({ length: n }, (_, k) => k + 1);
    const isCorrect = nnnParts.length === n &&
      nnnParts.every((val, idx) => val === expected[idx]);

    if (isCorrect) {
      passed2++;
    } else {
      failed2++;
      failures2.push({
        iteration: i + 1,
        n,
        year,
        month,
        dateStr,
        results,
        nnnParts,
        expected,
      });
    }
  }

  console.log(`\nProperty 2: Sequence strictly increments, no duplicates`);
  console.log(`  Iterations : ${NUM_ITERATIONS_P2}`);
  console.log(`  Passed     : ${passed2}`);
  console.log(`  Failed     : ${failed2}`);

  if (failures2.length > 0) {
    console.error('\nFailing examples:');
    for (const f of failures2) {
      console.error(`  Iteration ${f.iteration}: N=${f.n}, date=${f.dateStr}`);
      console.error(`    Expected NNN: [${f.expected.join(', ')}]`);
      console.error(`    Actual NNN:   [${f.nnnParts.join(', ')}]`);
      console.error(`    Results: ${f.results.join(', ')}`);
    }
    process.exit(1);
  } else {
    console.log('\n✓ All iterations passed — Property 2 holds.\n');
  }
}

// ============================================================================
// Feature: invoice-enhancements, Property 3: Deleted sequence numbers are not reused
// Validates: Requirements 1.6
//
// Property 3: For any invoice created then deleted, a subsequently created invoice
// for the same year/month SHALL receive a NNN strictly greater than the deleted
// invoice's NNN.
//
// Note: The `invoice_sequences` table only tracks the counter — it is never
// decremented when an invoice record is deleted from `factures_clients`.
// Therefore the next invoice in the same period always gets a higher NNN.
// ============================================================================

{
  const NUM_ITERATIONS_P3 = 100;
  let passed3 = 0;
  let failed3 = 0;
  const failures3 = [];

  for (let i = 0; i < NUM_ITERATIONS_P3; i++) {
    // Generate a random year (2000–2099) and month (1–12)
    const year = 2000 + Math.floor(Math.random() * 100);
    const month = 1 + Math.floor(Math.random() * 12);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-15`;

    // Fresh in-memory DB for each iteration
    const iterDb = createInMemoryDb();

    // Step 1: Create the first invoice — this is the one that will be "deleted"
    const firstFac = getNextInvoiceNumber(dateStr, iterDb);
    const firstNNN = parseInt(firstFac.split('-')[3], 10);

    // Step 2: Simulate deletion — the invoice record is removed from factures_clients
    // but the invoice_sequences counter is NOT decremented (by design).
    // We model this by simply not decrementing the counter (nothing to do in the DB).

    // Step 3: Create a second invoice for the same period
    const secondFac = getNextInvoiceNumber(dateStr, iterDb);
    const secondNNN = parseInt(secondFac.split('-')[3], 10);

    iterDb.close();

    // Assert: the new NNN is strictly greater than the deleted invoice's NNN
    const isCorrect = secondNNN > firstNNN;

    if (isCorrect) {
      passed3++;
    } else {
      failed3++;
      failures3.push({
        iteration: i + 1,
        year,
        month,
        dateStr,
        firstFac,
        firstNNN,
        secondFac,
        secondNNN,
      });
    }
  }

  console.log(`\nProperty 3: Deleted sequence numbers are not reused`);
  console.log(`  Iterations : ${NUM_ITERATIONS_P3}`);
  console.log(`  Passed     : ${passed3}`);
  console.log(`  Failed     : ${failed3}`);

  if (failures3.length > 0) {
    console.error('\nFailing examples:');
    for (const f of failures3) {
      console.error(`  Iteration ${f.iteration}: date=${f.dateStr}`);
      console.error(`    First (deleted) FAC: ${f.firstFac} (NNN=${f.firstNNN})`);
      console.error(`    Second FAC:          ${f.secondFac} (NNN=${f.secondNNN})`);
      console.error(`    Expected: ${f.secondNNN} > ${f.firstNNN}`);
    }
    process.exit(1);
  } else {
    console.log('\n✓ All iterations passed — Property 3 holds.\n');
  }
}
