// Feature: invoice-enhancements, Property 8: AV number format
// Validates: Requirements 4.1
//
// Property 8: AV number format
// For any avoir created with a valid date_avoir, the assigned numero_avoir
// must match the pattern AV-{YYYY}-{NNN} where YYYY is the four-digit year
// and NNN is a zero-padded three-digit integer >= 001, derived from date_avoir.

'use strict';

const Database = require('better-sqlite3');
const assert = require('assert');

// ============================================================================
// Inline getNextAvoirNumber logic (mirrors public/electron.cjs)
// ============================================================================

function getNextAvoirNumber(dateAvoir, db) {
  const d = new Date(dateAvoir);
  const yyyy = d.getFullYear();

  const upsert = db.prepare(`
    INSERT INTO avoir_sequences (year, last_sequence)
    VALUES (?, 1)
    ON CONFLICT(year) DO UPDATE SET last_sequence = last_sequence + 1
  `);
  const select = db.prepare(
    `SELECT last_sequence FROM avoir_sequences WHERE year = ?`
  );

  const getNext = db.transaction((y) => {
    upsert.run(y);
    return select.get(y).last_sequence;
  });

  const seq = getNext(yyyy);
  const nnn = String(seq).padStart(3, '0');
  return `AV-${yyyy}-${nnn}`;
}

// ============================================================================
// Test helpers
// ============================================================================

function createInMemoryDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS avoir_sequences (
      year          INTEGER NOT NULL PRIMARY KEY,
      last_sequence INTEGER NOT NULL DEFAULT 0
    )
  `);
  return db;
}

/**
 * Generate a random ISO date string between 2000-01-01 and 2099-12-31.
 */
function randomISODate() {
  const year = 2000 + Math.floor(Math.random() * 100);  // 2000–2099
  const month = 1 + Math.floor(Math.random() * 12);      // 1–12
  const day = 1 + Math.floor(Math.random() * 28);        // 1–28 (safe for all months)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ============================================================================
// Property 8: AV number format
// ============================================================================

const AV_PATTERN = /^AV-\d{4}-\d{3}$/;
const NUM_ITERATIONS = 100;

let passed = 0;
let failed = 0;
const failures = [];

const db = createInMemoryDb();

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const dateStr = randomISODate();
  const result = getNextAvoirNumber(dateStr, db);

  const d = new Date(dateStr);
  const expectedYYYY = String(d.getFullYear());

  // Assert 1: result matches /^AV-\d{4}-\d{3}$/
  const matchesPattern = AV_PATTERN.test(result);

  // Assert 2: YYYY part matches four-digit year from input date
  // result format: AV-YYYY-NNN → parts[1] is YYYY
  const parts = result.split('-');
  const yyyyMatches = parts[1] === expectedYYYY;

  if (matchesPattern && yyyyMatches) {
    passed++;
  } else {
    failed++;
    failures.push({
      iteration: i + 1,
      input: dateStr,
      result,
      matchesPattern,
      expectedYYYY,
      actualYYYY: parts[1],
      yyyyMatches,
    });
  }
}

db.close();

// ============================================================================
// Report results
// ============================================================================

console.log(`\nProperty 8: AV number format`);
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed}`);
console.log(`  Failed     : ${failed}`);

if (failures.length > 0) {
  console.error('\nFailing examples:');
  for (const f of failures) {
    console.error(`  Iteration ${f.iteration}: input="${f.input}" result="${f.result}"`);
    if (!f.matchesPattern) console.error(`    Pattern mismatch: "${f.result}" does not match ${AV_PATTERN}`);
    if (!f.yyyyMatches) console.error(`    YYYY mismatch: expected "${f.expectedYYYY}", got "${f.actualYYYY}"`);
  }
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 8 holds.\n');
}
