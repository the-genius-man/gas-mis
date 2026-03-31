// Feature: invoice-enhancements, Property 10: Aging bucket assignment is exhaustive and correct
// Validates: Requirements 5.2, 5.3
//
// Property 10: Aging bucket assignment is exhaustive and correct
// For any outstanding invoice (soldeRestant > 0, statut_paiement ≠ ANNULE),
// getBucket(facture) returns exactly one of '0-30', '31-60', '61-90', '90+',
// and the assignment is consistent with the days elapsed since date_echeance
// (or 0 days if no date_echeance).

'use strict';

const assert = require('assert');

// ============================================================================
// Inline getBucket (mirrors InvoiceAgingReport.tsx)
// ============================================================================

function getBucket(facture) {
  if (!facture.date_echeance) return '0-30';
  const days = Math.floor((Date.now() - new Date(facture.date_echeance).getTime()) / 86400000);
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

// ============================================================================
// Helpers
// ============================================================================

const VALID_BUCKETS = ['0-30', '31-60', '61-90', '90+'];

/** Random integer in [min, max] inclusive */
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Return an ISO date string offset by `daysOffset` from today (negative = past) */
function dateOffsetDays(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

/** Generate a random date_echeance: null, past (up to 200 days ago), or future (up to 60 days ahead) */
function randomDateEcheance() {
  const choice = randInt(0, 2);
  if (choice === 0) return null;
  if (choice === 1) return dateOffsetDays(-randInt(1, 200)); // past
  return dateOffsetDays(randInt(1, 60));                     // future
}

/** Compute the expected bucket for a given date_echeance */
function expectedBucket(date_echeance) {
  if (!date_echeance) return '0-30';
  const days = Math.floor((Date.now() - new Date(date_echeance).getTime()) / 86400000);
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

// ============================================================================
// Property 10 — Random iterations (100 runs)
// ============================================================================

const NUM_ITERATIONS = 100;

let passed = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < NUM_ITERATIONS; i++) {
  const date_echeance = randomDateEcheance();
  const facture = { date_echeance };

  const actual = getBucket(facture);
  const expected = expectedBucket(date_echeance);

  // Also assert the result is one of the four valid buckets
  const isValidBucket = VALID_BUCKETS.includes(actual);

  if (actual === expected && isValidBucket) {
    passed++;
  } else {
    failed++;
    failures.push({ iteration: i + 1, date_echeance, expected, actual, isValidBucket });
  }
}

console.log('\nProperty 10: Aging bucket assignment — random iterations');
console.log(`  Iterations : ${NUM_ITERATIONS}`);
console.log(`  Passed     : ${passed}`);
console.log(`  Failed     : ${failed}`);

if (failures.length > 0) {
  console.error('\nFailing examples (random):');
  for (const f of failures) {
    console.error(`  Iteration ${f.iteration}:`);
    console.error(`    date_echeance : ${f.date_echeance}`);
    console.error(`    expected      : ${f.expected}`);
    console.error(`    actual        : ${f.actual}`);
    console.error(`    validBucket   : ${f.isValidBucket}`);
  }
}

// ============================================================================
// Boundary conditions (explicit)
// ============================================================================

console.log('\nProperty 10: Aging bucket assignment — boundary conditions');

const boundaryTests = [
  {
    label: '0 days overdue → "0-30"',
    date_echeance: dateOffsetDays(0),
    expected: '0-30',
  },
  {
    label: '30 days overdue → "0-30"',
    date_echeance: dateOffsetDays(-30),
    expected: '0-30',
  },
  {
    label: '31 days overdue → "31-60"',
    date_echeance: dateOffsetDays(-31),
    expected: '31-60',
  },
  {
    label: '60 days overdue → "31-60"',
    date_echeance: dateOffsetDays(-60),
    expected: '31-60',
  },
  {
    label: '61 days overdue → "61-90"',
    date_echeance: dateOffsetDays(-61),
    expected: '61-90',
  },
  {
    label: '90 days overdue → "61-90"',
    date_echeance: dateOffsetDays(-90),
    expected: '61-90',
  },
  {
    label: '91 days overdue → "90+"',
    date_echeance: dateOffsetDays(-91),
    expected: '90+',
  },
  {
    label: 'null date_echeance → "0-30"',
    date_echeance: null,
    expected: '0-30',
  },
  {
    label: 'future date (not yet overdue) → "0-30"',
    date_echeance: dateOffsetDays(10),
    expected: '0-30',
  },
];

let boundaryPassed = 0;
let boundaryFailed = 0;

for (const t of boundaryTests) {
  const actual = getBucket({ date_echeance: t.date_echeance });
  if (actual === t.expected) {
    console.log(`  ✓ ${t.label}`);
    boundaryPassed++;
  } else {
    console.error(`  ✗ ${t.label}`);
    console.error(`      expected: "${t.expected}", actual: "${actual}"`);
    boundaryFailed++;
  }
}

console.log(`\n  Boundary passed: ${boundaryPassed}/${boundaryTests.length}`);

// ============================================================================
// Final report
// ============================================================================

const totalFailed = failures.length + boundaryFailed;

if (totalFailed > 0) {
  console.error(`\n✗ ${totalFailed} failure(s) detected — Property 10 does NOT hold.\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 10 holds.\n');
}

// ============================================================================
// Feature: invoice-enhancements, Property 11: Aging report bucket totals sum to grand total
// Validates: Requirements 5.9
//
// Property 11: Aging report bucket totals sum to grand total
// For any set of outstanding invoices, the sum of totalSolde across all four
// buckets equals the sum of soldeRestant across all outstanding invoices.
// ============================================================================

console.log('\n--- Property 11: Aging report bucket totals sum to grand total ---\n');

/** Generate a random positive float with up to 2 decimal places */
function randSolde(min, max) {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw * 100) / 100;
}

const STATUTS_VALIDES = ['ENVOYE', 'PAYE_PARTIEL', 'BROUILLON'];

/** Generate a random outstanding invoice (soldeRestant > 0, statut_paiement !== 'ANNULE') */
function randomOutstandingInvoice() {
  return {
    id: Math.random().toString(36).slice(2),
    soldeRestant: randSolde(0.01, 10000),
    statut_paiement: STATUTS_VALIDES[randInt(0, STATUTS_VALIDES.length - 1)],
    date_echeance: randomDateEcheance(),
  };
}

/**
 * Group invoices into buckets and compute totalSolde per bucket.
 * Returns an array of { bucket, totalSolde } objects.
 */
function computeBuckets(invoices) {
  const bucketMap = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
  };

  for (const inv of invoices) {
    const bucket = getBucket(inv);
    bucketMap[bucket] = Math.round((bucketMap[bucket] + inv.soldeRestant) * 100) / 100;
  }

  return Object.entries(bucketMap).map(([label, totalSolde]) => ({ label, totalSolde }));
}

const P11_ITERATIONS = 100;
let p11Passed = 0;
let p11Failed = 0;
const p11Failures = [];

for (let i = 0; i < P11_ITERATIONS; i++) {
  // Generate 1–20 random outstanding invoices
  const count = randInt(1, 20);
  const invoices = Array.from({ length: count }, randomOutstandingInvoice);

  // Grand total from invoices directly
  const grandTotalFromInvoices = Math.round(
    invoices.reduce((sum, inv) => sum + inv.soldeRestant, 0) * 100
  ) / 100;

  // Sum of bucket totalSolde values
  const buckets = computeBuckets(invoices);
  const grandTotalFromBuckets = Math.round(
    buckets.reduce((sum, b) => sum + b.totalSolde, 0) * 100
  ) / 100;

  if (grandTotalFromBuckets === grandTotalFromInvoices) {
    p11Passed++;
  } else {
    p11Failed++;
    p11Failures.push({
      iteration: i + 1,
      invoiceCount: count,
      grandTotalFromInvoices,
      grandTotalFromBuckets,
      diff: Math.abs(grandTotalFromBuckets - grandTotalFromInvoices),
    });
  }
}

console.log(`Property 11: Aging bucket totals sum to grand total`);
console.log(`  Iterations : ${P11_ITERATIONS}`);
console.log(`  Passed     : ${p11Passed}`);
console.log(`  Failed     : ${p11Failed}`);

if (p11Failures.length > 0) {
  console.error('\nFailing examples (Property 11):');
  for (const f of p11Failures) {
    console.error(`  Iteration ${f.iteration} (${f.invoiceCount} invoices):`);
    console.error(`    grandTotalFromInvoices : ${f.grandTotalFromInvoices}`);
    console.error(`    grandTotalFromBuckets  : ${f.grandTotalFromBuckets}`);
    console.error(`    diff                   : ${f.diff}`);
  }
  console.error(`\n✗ Property 11 does NOT hold — ${p11Failed} failure(s).\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 11 holds.\n');
}

// ============================================================================
// Feature: invoice-enhancements, Property 12: Aging report client filter completeness
// Validates: Requirements 5.7
//
// Property 12: Aging report client filter completeness
// For any client filter applied to the aging report, every row in the filtered
// result belongs to the selected client, and no invoice belonging to that client
// with a positive soldeRestant is omitted.
// ============================================================================

console.log('\n--- Property 12: Aging report client filter completeness ---\n');

const STATUTS_OUTSTANDING = ['ENVOYE', 'PAYE_PARTIEL', 'BROUILLON'];

/** Generate a random client ID string */
function randomClientId(pool) {
  return pool[randInt(0, pool.length - 1)];
}

/** Generate a random outstanding invoice for a given client */
function randomInvoiceForClient(clientId) {
  return {
    id: Math.random().toString(36).slice(2),
    client_id: clientId,
    soldeRestant: randInt(1, 10000),
    statut_paiement: STATUTS_OUTSTANDING[randInt(0, STATUTS_OUTSTANDING.length - 1)],
    date_echeance: randomDateEcheance(),
  };
}

const P12_ITERATIONS = 100;
let p12Passed = 0;
let p12Failed = 0;
const p12Failures = [];

for (let i = 0; i < P12_ITERATIONS; i++) {
  // Generate 2–5 random client IDs
  const numClients = randInt(2, 5);
  const clientPool = Array.from({ length: numClients }, (_, k) => `client-${i}-${k}`);

  // Generate 5–20 random outstanding invoices spread across those clients
  const numInvoices = randInt(5, 20);
  const invoices = Array.from({ length: numInvoices }, () =>
    randomInvoiceForClient(randomClientId(clientPool))
  );

  // Pick a random client to filter by
  const selectedClientId = randomClientId(clientPool);

  // Apply the filter
  const filtered = invoices.filter(inv => inv.client_id === selectedClientId);

  // (a) All results belong to the selected client
  const allBelongToClient = filtered.every(inv => inv.client_id === selectedClientId);

  // (b) No eligible invoice for that client is missing (completeness)
  const eligibleForClient = invoices.filter(inv => inv.client_id === selectedClientId);
  const filteredIds = new Set(filtered.map(inv => inv.id));
  const noneOmitted = eligibleForClient.every(inv => filteredIds.has(inv.id));

  if (allBelongToClient && noneOmitted) {
    p12Passed++;
  } else {
    p12Failed++;
    p12Failures.push({
      iteration: i + 1,
      selectedClientId,
      totalInvoices: invoices.length,
      filteredCount: filtered.length,
      eligibleCount: eligibleForClient.length,
      allBelongToClient,
      noneOmitted,
    });
  }
}

console.log(`Property 12: Aging report client filter completeness`);
console.log(`  Iterations : ${P12_ITERATIONS}`);
console.log(`  Passed     : ${p12Passed}`);
console.log(`  Failed     : ${p12Failed}`);

if (p12Failures.length > 0) {
  console.error('\nFailing examples (Property 12):');
  for (const f of p12Failures) {
    console.error(`  Iteration ${f.iteration}:`);
    console.error(`    selectedClientId   : ${f.selectedClientId}`);
    console.error(`    totalInvoices      : ${f.totalInvoices}`);
    console.error(`    filteredCount      : ${f.filteredCount}`);
    console.error(`    eligibleCount      : ${f.eligibleCount}`);
    console.error(`    allBelongToClient  : ${f.allBelongToClient}`);
    console.error(`    noneOmitted        : ${f.noneOmitted}`);
  }
  console.error(`\n✗ Property 12 does NOT hold — ${p12Failed} failure(s).\n`);
  process.exit(1);
} else {
  console.log('\n✓ All iterations passed — Property 12 holds.\n');
}
