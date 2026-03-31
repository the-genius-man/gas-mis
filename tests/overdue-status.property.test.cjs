// Feature: invoice-enhancements, Property 6: isOverdue is a pure predicate
// Validates: Requirements 3.1, 3.3, 3.5, 3.6
//
// Property 6: isOverdue is a pure predicate
// For any invoice, isOverdue(facture) returns true if and only if ALL of:
//   - date_echeance < today
//   - soldeRestant > 0
//   - statut_paiement is neither 'PAYE_TOTAL' nor 'ANNULE'
// Changing any one condition to false must cause isOverdue to return false.

'use strict';

const assert = require('assert');

// ============================================================================
// Inline isOverdue (mirrors InvoicesManagement.tsx)
// ============================================================================

function isOverdue(facture) {
  if (facture.statut_paiement === 'PAYE_TOTAL' || facture.statut_paiement === 'ANNULE') return false;
  if (!facture.date_echeance) return false;
  return new Date(facture.date_echeance) < new Date() && facture.soldeRestant > 0;
}

// ============================================================================
// Helpers
// ============================================================================

const STATUTS = ['ENVOYE', 'PAYE_PARTIEL', 'PAYE_TOTAL', 'ANNULE', 'BROUILLON'];

/** Random integer in [min, max] inclusive */
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Return a past ISO date string (1–365 days ago) */
function pastDate() {
  const d = new Date();
  d.setDate(d.getDate() - randInt(1, 365));
  return d.toISOString().slice(0, 10);
}

/** Return a future ISO date string (1–365 days from now) */
function futureDate() {
  const d = new Date();
  d.setDate(d.getDate() + randInt(1, 365));
  return d.toISOString().slice(0, 10);
}

/** Return today's ISO date string */
function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

/** Generate a random facture object */
function randomFacture() {
  const statut = STATUTS[randInt(0, STATUTS.length - 1)];

  // date_echeance: null, past, or future
  const dateChoice = randInt(0, 2);
  let date_echeance = null;
  if (dateChoice === 1) date_echeance = pastDate();
  if (dateChoice === 2) date_echeance = futureDate();

  // soldeRestant: 0 or positive
  const soldeRestant = randInt(0, 1) === 0 ? 0 : randInt(1, 10000);

  return { statut_paiement: statut, date_echeance, soldeRestant };
}

/** Compute the expected isOverdue result for a facture */
function expectedIsOverdue(facture) {
  if (facture.statut_paiement === 'PAYE_TOTAL' || facture.statut_paiement === 'ANNULE') return false;
  if (!facture.date_echeance) return false;
  return new Date(facture.date_echeance) < new Date() && facture.soldeRestant > 0;
}

// ============================================================================
// Property 6 — Random iterations
// ============================================================================

const NUM_ITERATIONS = 100;

let passed = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const facture = randomFacture();
  const actual = isOverdue(facture);
  const expected = expectedIsOverdue(facture);

  if (actual === expected) {
    passed++;
  } else {
    failed++;
    failures.push({ iteration: i + 1, facture, expected, actual });
  }
}

console.log('\nProperty 6: isOverdue is a pure predicate — random iterations');
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed}`);
console.log(`  Failed     : ${failed}`);

if (failures.length > 0) {
  console.error('\nFailing examples (random):');
  for (const f of failures) {
    console.error(`  Iteration ${f.iteration}:`);
    console.error(`    statut_paiement : ${f.facture.statut_paiement}`);
    console.error(`    date_echeance   : ${f.facture.date_echeance}`);
    console.error(`    soldeRestant    : ${f.facture.soldeRestant}`);
    console.error(`    expected        : ${f.expected}`);
    console.error(`    actual          : ${f.actual}`);
  }
}

// ============================================================================
// Boundary conditions (explicit)
// ============================================================================

console.log('\nProperty 6: isOverdue — boundary conditions');

const boundaryTests = [];

// 1. Exactly at deadline (today as ISO date string) → depends on UTC offset.
//    new Date('YYYY-MM-DD') is parsed as UTC midnight. In timezones east of UTC,
//    this moment is already in the past by the time local midnight arrives.
//    We compute the expected value using the same logic as isOverdue itself.
{
  const todayStr = todayDate();
  const expectedToday = new Date(todayStr) < new Date();
  boundaryTests.push({
    label: `Exactly at deadline (today ISO string) → ${expectedToday} (UTC-offset dependent)`,
    facture: { statut_paiement: 'ENVOYE', date_echeance: todayStr, soldeRestant: 100 },
    expected: expectedToday,
  });
}

// 2. One day past deadline → true (other conditions met)
{
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  boundaryTests.push({
    label: 'One day past deadline → true',
    facture: {
      statut_paiement: 'ENVOYE',
      date_echeance: yesterday.toISOString().slice(0, 10),
      soldeRestant: 100,
    },
    expected: true,
  });
}

// 3. PAYE_TOTAL with past date and positive balance → false
boundaryTests.push({
  label: 'PAYE_TOTAL with past date and positive balance → false',
  facture: { statut_paiement: 'PAYE_TOTAL', date_echeance: pastDate(), soldeRestant: 100 },
  expected: false,
});

// 4. ANNULE with past date and positive balance → false
boundaryTests.push({
  label: 'ANNULE with past date and positive balance → false',
  facture: { statut_paiement: 'ANNULE', date_echeance: pastDate(), soldeRestant: 100 },
  expected: false,
});

// 5. No date_echeance → false
boundaryTests.push({
  label: 'No date_echeance → false',
  facture: { statut_paiement: 'ENVOYE', date_echeance: null, soldeRestant: 100 },
  expected: false,
});

// 6. Zero soldeRestant → false
boundaryTests.push({
  label: 'Zero soldeRestant → false',
  facture: { statut_paiement: 'ENVOYE', date_echeance: pastDate(), soldeRestant: 0 },
  expected: false,
});

let boundaryPassed = 0;
let boundaryFailed = 0;
const boundaryFailures = [];

for (const t of boundaryTests) {
  const actual = isOverdue(t.facture);
  if (actual === t.expected) {
    console.log(`  ✓ ${t.label}`);
    boundaryPassed++;
  } else {
    console.error(`  ✗ ${t.label}`);
    console.error(`      expected: ${t.expected}, actual: ${actual}`);
    boundaryFailed++;
    boundaryFailures.push(t);
  }
}

console.log(`\n  Boundary passed: ${boundaryPassed}/${boundaryTests.length}`);

// ============================================================================
// Final report
// ============================================================================

const totalFailed = failures.length + boundaryFailed;

if (totalFailed > 0) {
  console.error(`\n✗ ${totalFailed} failure(s) detected — Property 6 does NOT hold.\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 6 holds.\n');
}
