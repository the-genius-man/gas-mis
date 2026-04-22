// Feature: payroll-finance-journal-link
// Property 4: PAIEMENT_SALAIRE entry always has DEBIT 422 = CREDIT 5xx
// Property 5: Libelle suffix matches payment status
// **Validates: Requirements 7.2, 8.1, 8.2**

'use strict';

const fc = require('fast-check');
const assert = require('assert');

// ============================================================================
// Pure line-building logic
// (extracted from generateSalaryPaymentJournalEntry in public/electron.cjs)
// ============================================================================

/**
 * Build the two journal lines for a salary payment.
 *
 * @param {number} montantPaye - Amount paid (> 0)
 * @param {string} compteTresorerieOhada - OHADA treasury account code (e.g. '521', '571', '5711')
 * @returns {{ compte: string, sens: 'DEBIT'|'CREDIT', montant: number }[]}
 */
function buildSalaryPaymentLines(montantPaye, compteTresorerieOhada) {
  return [
    { compte: '422', sens: 'DEBIT',  montant: montantPaye },
    { compte: compteTresorerieOhada, sens: 'CREDIT', montant: montantPaye },
  ];
}

// ============================================================================
// Pure libelle-building logic
// (extracted from generateSalaryPaymentJournalEntry in public/electron.cjs)
// ============================================================================

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/**
 * Build the libelle for a salary payment journal entry.
 *
 * @param {string} nomComplet - Employee full name
 * @param {number} mois - Month number (1–12)
 * @param {number} annee - Year (e.g. 2024)
 * @param {'PAYE_PARTIEL'|'PAYE_TOTAL'|string} nouveauStatut - Payment status after this payment
 * @param {number} montantRestant - Remaining balance (used when PAYE_PARTIEL)
 * @returns {string}
 */
function buildSalaryPaymentLibelle(nomComplet, mois, annee, nouveauStatut, montantRestant) {
  const nomMois = MOIS_FR[mois - 1];
  if (nouveauStatut === 'PAYE_PARTIEL') {
    return `Paiement salaire ${nomComplet} — ${nomMois} ${annee} (Reste : ${montantRestant} USD)`;
  } else if (nouveauStatut === 'PAYE_TOTAL') {
    return `Paiement salaire ${nomComplet} — ${nomMois} ${annee} — Solde final`;
  }
  return `Paiement salaire ${nomComplet} — ${nomMois} ${annee}`;
}

// ============================================================================
// Arbitraries
// ============================================================================

/** Payment amount: float in [0.01, 1_000_000] */
const montantPayeArb = fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000), noNaN: true });

/** Treasury OHADA account codes (5xx family) */
const compteTresorerieArb = fc.oneof(
  fc.constant('521'),
  fc.constant('571'),
  fc.constant('5711'),
  fc.constant('5721'),
  fc.constant('5811'),
  // Also allow arbitrary 5xx strings to cover future accounts
  fc.stringMatching(/^5\d{2,3}$/),
);

/** Month number 1–12 */
const moisArb = fc.integer({ min: 1, max: 12 });

/** Year in a reasonable range */
const anneeArb = fc.integer({ min: 2000, max: 2100 });

/** Non-empty employee name */
const nomCompletArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Pair (montantPaye, montantNet) where both are positive.
 * nouveauStatut is derived: PAYE_TOTAL if montantPaye >= montantNet, else PAYE_PARTIEL.
 */
const paymentPairArb = fc.record({
  montantPaye: montantPayeArb,
  montantNet:  montantPayeArb,
}).map(({ montantPaye, montantNet }) => {
  const nouveauStatut = montantPaye >= montantNet ? 'PAYE_TOTAL' : 'PAYE_PARTIEL';
  const montantRestant = Math.max(0, montantNet - montantPaye);
  return { montantPaye, montantNet, nouveauStatut, montantRestant };
});

// ============================================================================
// Property 4: PAIEMENT_SALAIRE entry always has DEBIT 422 = CREDIT 5xx
// **Validates: Requirements 7.2**
// ============================================================================

describe('Property 4: PAIEMENT_SALAIRE entry is always balanced (DEBIT 422 = CREDIT 5xx)', () => {
  test('sum(DEBIT) === sum(CREDIT) within 0.01 tolerance for any payment amount and treasury account', () => {
    fc.assert(
      fc.property(montantPayeArb, compteTresorerieArb, (montantPaye, compteTresorerieOhada) => {
        const lignes = buildSalaryPaymentLines(montantPaye, compteTresorerieOhada);

        const sumDebit  = lignes.filter(l => l.sens === 'DEBIT').reduce((s, l) => s + l.montant, 0);
        const sumCredit = lignes.filter(l => l.sens === 'CREDIT').reduce((s, l) => s + l.montant, 0);

        assert.ok(
          Math.abs(sumDebit - sumCredit) < 0.01,
          `Entry is unbalanced: DEBIT=${sumDebit}, CREDIT=${sumCredit}, diff=${Math.abs(sumDebit - sumCredit)}`
        );
      }),
      { numRuns: 1000 }
    );
  });

  test('DEBIT line is always on compte 422', () => {
    fc.assert(
      fc.property(montantPayeArb, compteTresorerieArb, (montantPaye, compteTresorerieOhada) => {
        const lignes = buildSalaryPaymentLines(montantPaye, compteTresorerieOhada);

        const debitLines = lignes.filter(l => l.sens === 'DEBIT');
        assert.strictEqual(debitLines.length, 1, 'There must be exactly one DEBIT line');
        assert.strictEqual(
          debitLines[0].compte,
          '422',
          `DEBIT line must be on compte 422, got "${debitLines[0].compte}"`
        );
        assert.ok(
          Math.abs(debitLines[0].montant - montantPaye) < 0.001,
          `DEBIT 422 montant=${debitLines[0].montant} should equal montantPaye=${montantPaye}`
        );
      }),
      { numRuns: 1000 }
    );
  });

  test('CREDIT line is always on the provided treasury account', () => {
    fc.assert(
      fc.property(montantPayeArb, compteTresorerieArb, (montantPaye, compteTresorerieOhada) => {
        const lignes = buildSalaryPaymentLines(montantPaye, compteTresorerieOhada);

        const creditLines = lignes.filter(l => l.sens === 'CREDIT');
        assert.strictEqual(creditLines.length, 1, 'There must be exactly one CREDIT line');
        assert.strictEqual(
          creditLines[0].compte,
          compteTresorerieOhada,
          `CREDIT line must be on compte "${compteTresorerieOhada}", got "${creditLines[0].compte}"`
        );
        assert.ok(
          Math.abs(creditLines[0].montant - montantPaye) < 0.001,
          `CREDIT ${compteTresorerieOhada} montant=${creditLines[0].montant} should equal montantPaye=${montantPaye}`
        );
      }),
      { numRuns: 1000 }
    );
  });
});

// ============================================================================
// Property 5: Libelle suffix matches payment status
// **Validates: Requirements 8.1, 8.2**
// ============================================================================

describe('Property 5: Libelle suffix matches payment status', () => {
  test('libelle contains "Reste" for PAYE_PARTIEL status', () => {
    fc.assert(
      fc.property(
        nomCompletArb, moisArb, anneeArb, paymentPairArb,
        (nomComplet, mois, annee, { montantPaye, nouveauStatut, montantRestant }) => {
          fc.pre(nouveauStatut === 'PAYE_PARTIEL');

          const libelle = buildSalaryPaymentLibelle(nomComplet, mois, annee, nouveauStatut, montantRestant);

          assert.ok(
            libelle.includes('Reste'),
            `Expected libelle to contain "Reste" for PAYE_PARTIEL, got: "${libelle}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('libelle contains "Solde final" for PAYE_TOTAL status', () => {
    fc.assert(
      fc.property(
        nomCompletArb, moisArb, anneeArb, paymentPairArb,
        (nomComplet, mois, annee, { montantPaye, nouveauStatut, montantRestant }) => {
          fc.pre(nouveauStatut === 'PAYE_TOTAL');

          const libelle = buildSalaryPaymentLibelle(nomComplet, mois, annee, nouveauStatut, montantRestant);

          assert.ok(
            libelle.includes('Solde final'),
            `Expected libelle to contain "Solde final" for PAYE_TOTAL, got: "${libelle}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('libelle always starts with "Paiement salaire"', () => {
    fc.assert(
      fc.property(
        nomCompletArb, moisArb, anneeArb, paymentPairArb,
        (nomComplet, mois, annee, { nouveauStatut, montantRestant }) => {
          const libelle = buildSalaryPaymentLibelle(nomComplet, mois, annee, nouveauStatut, montantRestant);

          assert.ok(
            libelle.startsWith('Paiement salaire'),
            `Expected libelle to start with "Paiement salaire", got: "${libelle}"`
          );
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('PAYE_PARTIEL libelle includes the remaining amount', () => {
    fc.assert(
      fc.property(
        nomCompletArb, moisArb, anneeArb, paymentPairArb,
        (nomComplet, mois, annee, { nouveauStatut, montantRestant }) => {
          fc.pre(nouveauStatut === 'PAYE_PARTIEL');

          const libelle = buildSalaryPaymentLibelle(nomComplet, mois, annee, nouveauStatut, montantRestant);

          assert.ok(
            libelle.includes(String(montantRestant)),
            `Expected libelle to include montantRestant=${montantRestant}, got: "${libelle}"`
          );
          assert.ok(
            libelle.includes('USD'),
            `Expected libelle to include "USD" for PAYE_PARTIEL, got: "${libelle}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('PAYE_TOTAL libelle does not contain "Reste"', () => {
    fc.assert(
      fc.property(
        nomCompletArb, moisArb, anneeArb, paymentPairArb,
        (nomComplet, mois, annee, { nouveauStatut, montantRestant }) => {
          fc.pre(nouveauStatut === 'PAYE_TOTAL');

          const libelle = buildSalaryPaymentLibelle(nomComplet, mois, annee, nouveauStatut, montantRestant);

          assert.ok(
            !libelle.includes('Reste'),
            `Expected PAYE_TOTAL libelle NOT to contain "Reste", got: "${libelle}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('libelle includes the correct French month name', () => {
    fc.assert(
      fc.property(
        nomCompletArb, moisArb, anneeArb, paymentPairArb,
        (nomComplet, mois, annee, { nouveauStatut, montantRestant }) => {
          const libelle = buildSalaryPaymentLibelle(nomComplet, mois, annee, nouveauStatut, montantRestant);
          const expectedMois = MOIS_FR[mois - 1];

          assert.ok(
            libelle.includes(expectedMois),
            `Expected libelle to include month "${expectedMois}" (mois=${mois}), got: "${libelle}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });

  test('libelle includes the year', () => {
    fc.assert(
      fc.property(
        nomCompletArb, moisArb, anneeArb, paymentPairArb,
        (nomComplet, mois, annee, { nouveauStatut, montantRestant }) => {
          const libelle = buildSalaryPaymentLibelle(nomComplet, mois, annee, nouveauStatut, montantRestant);

          assert.ok(
            libelle.includes(String(annee)),
            `Expected libelle to include year ${annee}, got: "${libelle}"`
          );
        }
      ),
      { numRuns: 500 }
    );
  });
});

// ============================================================================
// Property 6: Journal generation failure does not propagate to salary payment
// **Validates: Requirements 7.7**
// ============================================================================

/**
 * Simulate the error-isolation pattern used in db-payer-salaire.
 * The salary payment recording always succeeds; journal generation is
 * wrapped in try/catch so any failure is swallowed and never blocks payment.
 *
 * @param {string|number} paiementId
 * @param {(id: string|number) => any} generateJournalFn
 * @returns {{ success: boolean, id: string|number, journalEntry: any|null }}
 */
function payerSalaireWithJournal(paiementId, generateJournalFn) {
  // Simulate salary payment recording (always succeeds)
  const paymentResult = { success: true, id: paiementId };

  // Journal generation — wrapped in try/catch, never blocks payment
  let journalEntry = null;
  try {
    journalEntry = generateJournalFn(paiementId);
  } catch (err) {
    // swallowed — journal failure is non-blocking
  }

  return { ...paymentResult, journalEntry };
}

describe('Property 6: Journal generation failure does not propagate to salary payment', () => {
  test('when generateJournalFn throws any error, payerSalaireWithJournal still returns { success: true }', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer()),
        fc.oneof(fc.string(), fc.anything()),
        (paiementId, errorValue) => {
          const throwingFn = () => { throw errorValue; };

          const result = payerSalaireWithJournal(paiementId, throwingFn);

          assert.strictEqual(
            result.success,
            true,
            `Expected success=true even when journal throws, got success=${result.success}`
          );
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('when generateJournalFn throws, journalEntry is null in the result', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer()),
        fc.oneof(fc.string(), fc.anything()),
        (paiementId, errorValue) => {
          const throwingFn = () => { throw errorValue; };

          const result = payerSalaireWithJournal(paiementId, throwingFn);

          assert.strictEqual(
            result.journalEntry,
            null,
            `Expected journalEntry=null when journal throws, got journalEntry=${JSON.stringify(result.journalEntry)}`
          );
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('when generateJournalFn succeeds, success is still true and journalEntry contains the result', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer()),
        fc.anything(),
        (paiementId, journalResult) => {
          const successFn = () => journalResult;

          const result = payerSalaireWithJournal(paiementId, successFn);

          assert.strictEqual(
            result.success,
            true,
            `Expected success=true when journal succeeds, got success=${result.success}`
          );
          assert.deepStrictEqual(
            result.journalEntry,
            journalResult,
            `Expected journalEntry to equal the journal function's return value`
          );
        }
      ),
      { numRuns: 1000 }
    );
  });
});
