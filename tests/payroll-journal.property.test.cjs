// Feature: payroll-finance-journal-link, Property 1: Journal entry balance invariant
// Validates: Requirements 1.5
//
// Property 1: Journal entry is always balanced (DEBIT = CREDIT)
// For any array of payslips where salaire_brut = salaire_net + cnss + ipr + onem + inpp,
// the generated journal lines must satisfy sum(DEBIT) === sum(CREDIT) within 0.01 tolerance.
// This mirrors the aggregation + line-building logic in generatePayrollJournalEntry
// (public/electron.cjs) without touching SQLite.

'use strict';

const fc = require('fast-check');
const assert = require('assert');

// ============================================================================
// Pure aggregation + line-building logic
// (extracted from generatePayrollJournalEntry in public/electron.cjs)
// ============================================================================

/**
 * Build OHADA journal lines from an array of payslip objects.
 * Returns { lignes, sumDebit, sumCredit }.
 *
 * @param {{ salaire_brut: number, salaire_net: number, cnss: number, ipr: number, onem: number, inpp: number }[]} bulletins
 */
function buildPayrollJournalLines(bulletins) {
  // Aggregate totals (mirrors step 3 in generatePayrollJournalEntry)
  let totalBrut = 0, totalNet = 0, totalCNSS = 0, totalIPR = 0, totalONEM = 0, totalINPP = 0;
  for (const b of bulletins) {
    totalBrut += b.salaire_brut || 0;
    totalNet  += b.salaire_net  || 0;
    totalCNSS += b.cnss         || 0;
    totalIPR  += b.ipr          || 0;
    totalONEM += b.onem         || 0;
    totalINPP += b.inpp         || 0;
  }

  // Build journal lines (mirrors step 4 in generatePayrollJournalEntry)
  const lignes = [];

  // DEBIT 661 — Rémunérations du personnel (gross salary expense)
  lignes.push({ compte: '661', sens: 'DEBIT',  montant: totalBrut });

  // CREDIT 422 — Personnel, rémunérations dues (net salaries payable)
  lignes.push({ compte: '422', sens: 'CREDIT', montant: totalNet });

  // CREDIT 431 — CNSS (only if > 0)
  if (totalCNSS > 0) {
    lignes.push({ compte: '431', sens: 'CREDIT', montant: totalCNSS });
  }

  // CREDIT 447 — IPR à payer (only if > 0)
  if (totalIPR > 0) {
    lignes.push({ compte: '447', sens: 'CREDIT', montant: totalIPR });
  }

  // CREDIT 432 — ONEM (only if > 0)
  if (totalONEM > 0) {
    lignes.push({ compte: '432', sens: 'CREDIT', montant: totalONEM });
  }

  // CREDIT 433 — INPP (only if > 0)
  if (totalINPP > 0) {
    lignes.push({ compte: '433', sens: 'CREDIT', montant: totalINPP });
  }

  const sumDebit  = lignes.filter(l => l.sens === 'DEBIT').reduce((s, l) => s + l.montant, 0);
  const sumCredit = lignes.filter(l => l.sens === 'CREDIT').reduce((s, l) => s + l.montant, 0);

  return { lignes, sumDebit, sumCredit };
}

// ============================================================================
// Arbitraries
// ============================================================================

/**
 * Generate a single payslip where salaire_brut = salaire_net + cnss + ipr + onem + inpp.
 * This constraint guarantees the journal entry will be balanced.
 */
const payslipArb = fc.record({
  salaire_net: fc.float({ min: 0, max: 100000, noNaN: true }),
  cnss:        fc.float({ min: 0, max: 10000,  noNaN: true }),
  ipr:         fc.float({ min: 0, max: 10000,  noNaN: true }),
  onem:        fc.float({ min: 0, max: 10000,  noNaN: true }),
  inpp:        fc.float({ min: 0, max: 10000,  noNaN: true }),
}).map(({ salaire_net, cnss, ipr, onem, inpp }) => ({
  salaire_brut: salaire_net + cnss + ipr + onem + inpp,
  salaire_net,
  cnss,
  ipr,
  onem,
  inpp,
}));

/** Array of at least 1 payslip */
const payslipsArb = fc.array(payslipArb, { minLength: 1 });

// ============================================================================
// Property 1: Journal entry is always balanced (DEBIT = CREDIT)
// **Validates: Requirements 1.5**
// ============================================================================

describe('Property 1: Journal entry balance invariant', () => {
  test('sum(DEBIT) === sum(CREDIT) for any valid payslip array', () => {
    fc.assert(
      fc.property(payslipsArb, (bulletins) => {
        const { sumDebit, sumCredit } = buildPayrollJournalLines(bulletins);

        // The balance invariant: DEBIT must equal CREDIT within floating-point tolerance
        assert.ok(
          Math.abs(sumDebit - sumCredit) < 0.01,
          `Journal entry is unbalanced: DEBIT=${sumDebit.toFixed(4)}, CREDIT=${sumCredit.toFixed(4)}, diff=${Math.abs(sumDebit - sumCredit).toFixed(6)}`
        );
      }),
      { numRuns: 1000, verbose: true }
    );
  });

  test('DEBIT line 661 equals sum of all salaire_brut', () => {
    fc.assert(
      fc.property(payslipsArb, (bulletins) => {
        const { lignes } = buildPayrollJournalLines(bulletins);
        const debit661 = lignes.find(l => l.compte === '661' && l.sens === 'DEBIT');
        const expectedBrut = bulletins.reduce((s, b) => s + b.salaire_brut, 0);

        assert.ok(debit661, 'DEBIT line on compte 661 must always exist');
        assert.ok(
          Math.abs(debit661.montant - expectedBrut) < 0.001,
          `661 DEBIT=${debit661.montant} but expected totalBrut=${expectedBrut}`
        );
      }),
      { numRuns: 500 }
    );
  });

  test('CREDIT line 422 equals sum of all salaire_net', () => {
    fc.assert(
      fc.property(payslipsArb, (bulletins) => {
        const { lignes } = buildPayrollJournalLines(bulletins);
        const credit422 = lignes.find(l => l.compte === '422' && l.sens === 'CREDIT');
        const expectedNet = bulletins.reduce((s, b) => s + b.salaire_net, 0);

        assert.ok(credit422, 'CREDIT line on compte 422 must always exist');
        assert.ok(
          Math.abs(credit422.montant - expectedNet) < 0.001,
          `422 CREDIT=${credit422.montant} but expected totalNet=${expectedNet}`
        );
      }),
      { numRuns: 500 }
    );
  });

  test('conditional CREDIT lines (431, 447, 432, 433) only appear when their total > 0', () => {
    fc.assert(
      fc.property(payslipsArb, (bulletins) => {
        const { lignes } = buildPayrollJournalLines(bulletins);

        const totalCNSS = bulletins.reduce((s, b) => s + b.cnss, 0);
        const totalIPR  = bulletins.reduce((s, b) => s + b.ipr,  0);
        const totalONEM = bulletins.reduce((s, b) => s + b.onem, 0);
        const totalINPP = bulletins.reduce((s, b) => s + b.inpp, 0);

        const has431 = lignes.some(l => l.compte === '431');
        const has447 = lignes.some(l => l.compte === '447');
        const has432 = lignes.some(l => l.compte === '432');
        const has433 = lignes.some(l => l.compte === '433');

        // Each conditional account appears if and only if its total > 0
        assert.strictEqual(has431, totalCNSS > 0, `431 presence mismatch: totalCNSS=${totalCNSS}`);
        assert.strictEqual(has447, totalIPR  > 0, `447 presence mismatch: totalIPR=${totalIPR}`);
        assert.strictEqual(has432, totalONEM > 0, `432 presence mismatch: totalONEM=${totalONEM}`);
        assert.strictEqual(has433, totalINPP > 0, `433 presence mismatch: totalINPP=${totalINPP}`);
      }),
      { numRuns: 500 }
    );
  });
});

// ============================================================================
// Idempotency check logic
// (mirrors the check inside generatePayrollJournalEntry in public/electron.cjs)
// ============================================================================

/**
 * Check whether a PAIE journal entry already exists for the given periodeId.
 *
 * @param {string} periodeId
 * @param {{ source_id: string, type_operation: string, statut: string, id: string|number, numero_piece: string }[]} existingEntries
 * @returns {{ skipped: true, reason: string, statut?: string, ecritureId?: string|number } | null}
 */
function checkIdempotency(periodeId, existingEntries) {
  const existing = existingEntries.find(
    e => e.source_id === periodeId && e.type_operation === 'PAIE'
  );
  if (!existing) return null;
  if (existing.statut === 'VALIDE' || existing.statut === 'CLOTURE') {
    return { skipped: true, reason: 'already_exists', statut: existing.statut };
  }
  if (existing.statut === 'BROUILLON') {
    return { skipped: true, reason: 'brouillon_exists', ecritureId: existing.id };
  }
  return null;
}

// ============================================================================
// Property 2: Existing PAIE entry for same source_id is always detected
// **Validates: Requirements 2.1, 2.2, 2.3**
// ============================================================================

describe('Property 2: Idempotency detection', () => {
  // Arbitrary for a non-empty periodeId string
  const periodeIdArb = fc.oneof(
    fc.string({ minLength: 1 }),
    fc.uuid()
  );

  // Arbitrary for a valid PAIE entry statut
  const statutArb = fc.constantFrom('BROUILLON', 'VALIDE', 'CLOTURE');

  // Arbitrary for a single existing PAIE entry matching a given periodeId
  const existingEntryArb = (periodeId) =>
    fc.record({
      id:            fc.oneof(fc.integer({ min: 1, max: 999999 }), fc.uuid()),
      numero_piece:  fc.string({ minLength: 1 }),
      statut:        statutArb,
    }).map(({ id, numero_piece, statut }) => ({
      source_id:       periodeId,
      type_operation:  'PAIE',
      statut,
      id,
      numero_piece,
    }));

  test('checkIdempotency returns non-null when a matching PAIE entry exists', () => {
    fc.assert(
      fc.property(
        periodeIdArb.chain(periodeId =>
          existingEntryArb(periodeId).map(entry => ({ periodeId, entry }))
        ),
        ({ periodeId, entry }) => {
          const result = checkIdempotency(periodeId, [entry]);
          assert.notStrictEqual(
            result,
            null,
            `Expected non-null result for periodeId="${periodeId}" with statut="${entry.statut}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('checkIdempotency returns null when no matching entry exists', () => {
    fc.assert(
      fc.property(
        periodeIdArb,
        fc.array(
          fc.record({
            source_id:      fc.string({ minLength: 1 }),
            type_operation: fc.constantFrom('PAIE', 'VENTE', 'ACHAT'),
            statut:         statutArb,
            id:             fc.integer({ min: 1, max: 999999 }),
            numero_piece:   fc.string({ minLength: 1 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (periodeId, entries) => {
          // Remove any accidental match so the "no match" case is guaranteed
          const filteredEntries = entries.filter(
            e => !(e.source_id === periodeId && e.type_operation === 'PAIE')
          );
          const result = checkIdempotency(periodeId, filteredEntries);
          assert.strictEqual(
            result,
            null,
            `Expected null when no PAIE entry matches periodeId="${periodeId}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('statut VALIDE → reason is "already_exists" and statut is preserved', () => {
    fc.assert(
      fc.property(
        periodeIdArb.chain(periodeId =>
          fc.record({
            id:           fc.integer({ min: 1, max: 999999 }),
            numero_piece: fc.string({ minLength: 1 }),
          }).map(({ id, numero_piece }) => ({
            periodeId,
            entry: { source_id: periodeId, type_operation: 'PAIE', statut: 'VALIDE', id, numero_piece },
          }))
        ),
        ({ periodeId, entry }) => {
          const result = checkIdempotency(periodeId, [entry]);
          assert.ok(result, 'result must not be null for VALIDE entry');
          assert.strictEqual(result.skipped, true);
          assert.strictEqual(result.reason, 'already_exists', `reason should be "already_exists" for VALIDE`);
          assert.strictEqual(result.statut, 'VALIDE');
        }
      ),
      { numRuns: 300 }
    );
  });

  test('statut CLOTURE → reason is "already_exists" and statut is preserved', () => {
    fc.assert(
      fc.property(
        periodeIdArb.chain(periodeId =>
          fc.record({
            id:           fc.integer({ min: 1, max: 999999 }),
            numero_piece: fc.string({ minLength: 1 }),
          }).map(({ id, numero_piece }) => ({
            periodeId,
            entry: { source_id: periodeId, type_operation: 'PAIE', statut: 'CLOTURE', id, numero_piece },
          }))
        ),
        ({ periodeId, entry }) => {
          const result = checkIdempotency(periodeId, [entry]);
          assert.ok(result, 'result must not be null for CLOTURE entry');
          assert.strictEqual(result.skipped, true);
          assert.strictEqual(result.reason, 'already_exists', `reason should be "already_exists" for CLOTURE`);
          assert.strictEqual(result.statut, 'CLOTURE');
        }
      ),
      { numRuns: 300 }
    );
  });

  test('statut BROUILLON → reason is "brouillon_exists" and ecritureId is set', () => {
    fc.assert(
      fc.property(
        periodeIdArb.chain(periodeId =>
          fc.record({
            id:           fc.integer({ min: 1, max: 999999 }),
            numero_piece: fc.string({ minLength: 1 }),
          }).map(({ id, numero_piece }) => ({
            periodeId,
            entry: { source_id: periodeId, type_operation: 'PAIE', statut: 'BROUILLON', id, numero_piece },
          }))
        ),
        ({ periodeId, entry }) => {
          const result = checkIdempotency(periodeId, [entry]);
          assert.ok(result, 'result must not be null for BROUILLON entry');
          assert.strictEqual(result.skipped, true);
          assert.strictEqual(result.reason, 'brouillon_exists', `reason should be "brouillon_exists" for BROUILLON`);
          assert.strictEqual(result.ecritureId, entry.id, `ecritureId should match the entry's id`);
        }
      ),
      { numRuns: 300 }
    );
  });

  test('only entries with type_operation="PAIE" are matched (other types are ignored)', () => {
    fc.assert(
      fc.property(
        periodeIdArb,
        fc.constantFrom('VENTE', 'ACHAT', 'OD', 'PAIEMENT_SALAIRE'),
        statutArb,
        (periodeId, otherType, statut) => {
          const nonPaieEntry = {
            source_id:      periodeId,
            type_operation: otherType,
            statut,
            id:             1,
            numero_piece:   'TEST-001',
          };
          const result = checkIdempotency(periodeId, [nonPaieEntry]);
          assert.strictEqual(
            result,
            null,
            `Non-PAIE entry (type="${otherType}") must not trigger idempotency for periodeId="${periodeId}"`
          );
        }
      ),
      { numRuns: 300 }
    );
  });
});

// ============================================================================
// Error isolation pattern
// (mirrors the try/catch wrapping in db-validate-payslips in public/electron.cjs)
// ============================================================================

/**
 * Simulate the error-isolation wrapper used in db-validate-payslips.
 * Payroll validation always succeeds; journal generation is wrapped in try/catch
 * so any failure is swallowed and never blocks payroll.
 *
 * @param {string} periodeId
 * @param {(periodeId: string) => any} generateJournalFn
 * @returns {{ success: boolean, journalEntry: any }}
 */
function validatePayslipsWithJournal(periodeId, generateJournalFn) {
  // Simulate payroll validation (always succeeds)
  const payrollResult = { success: true };

  // Journal generation — wrapped in try/catch, never blocks payroll
  let journalEntry = null;
  try {
    journalEntry = generateJournalFn(periodeId);
  } catch (err) {
    // swallowed — journal failure is non-blocking
  }

  return { ...payrollResult, journalEntry };
}

// ============================================================================
// Property 3: Journal generation failure does not propagate to payroll validation
// **Validates: Requirements 6.1, 6.2**
// ============================================================================

describe('Property 3: Error isolation — journal failure does not block payroll', () => {
  // Arbitrary for a non-empty periodeId string
  const periodeIdArb = fc.oneof(
    fc.string({ minLength: 1 }),
    fc.uuid()
  );

  test('when generateJournalFn throws any error, result.success is still true', () => {
    fc.assert(
      fc.property(
        periodeIdArb,
        fc.oneof(fc.string(), fc.anything()),
        (periodeId, errorValue) => {
          const throwingFn = () => { throw errorValue; };
          const result = validatePayslipsWithJournal(periodeId, throwingFn);

          assert.strictEqual(
            result.success,
            true,
            `Expected success=true even when journal throws; periodeId="${periodeId}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('when generateJournalFn throws, journalEntry is null in the result', () => {
    fc.assert(
      fc.property(
        periodeIdArb,
        fc.oneof(fc.string(), fc.anything()),
        (periodeId, errorValue) => {
          const throwingFn = () => { throw errorValue; };
          const result = validatePayslipsWithJournal(periodeId, throwingFn);

          assert.strictEqual(
            result.journalEntry,
            null,
            `Expected journalEntry=null when journal throws; periodeId="${periodeId}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('when generateJournalFn succeeds, success is true and journalEntry contains the result', () => {
    fc.assert(
      fc.property(
        periodeIdArb,
        fc.record({
          success:      fc.constant(true),
          numeroPiece:  fc.string({ minLength: 1 }),
          ecritureId:   fc.integer({ min: 1, max: 999999 }),
        }),
        (periodeId, journalResult) => {
          const successFn = () => journalResult;
          const result = validatePayslipsWithJournal(periodeId, successFn);

          assert.strictEqual(
            result.success,
            true,
            `Expected success=true when journal succeeds; periodeId="${periodeId}"`
          );
          assert.deepStrictEqual(
            result.journalEntry,
            journalResult,
            `Expected journalEntry to equal the return value of generateJournalFn`
          );
        }
      ),
      { numRuns: 500 }
    );
  });
});
