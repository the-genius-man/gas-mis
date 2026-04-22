# Implementation Plan: Payroll → Finance Journal Link

## Overview

When a payroll period is validated, the system automatically generates OHADA-compliant journal entries (661/422/431/447/432/433) in `BROUILLON` status in the accounting module. A manual trigger is also available from the payroll UI. All generation is idempotent and failures never block payroll validation.

## Tasks

- [x] 1. Add `generatePayrollJournalEntry` helper function in `electron.cjs`
  - [x] 1.1 Implement `generatePayrollJournalEntry(periodeId, db)` as a standalone function in `public/electron.cjs`
    - Query `periodes_paie` for the period (mois, annee)
    - Query `bulletins_paie WHERE periode_paie_id = ? AND salaire_brut > 0`
    - Aggregate: `totalBrut`, `totalNet`, `totalCNSS`, `totalIPR`, `totalONEM`, `totalINPP`
    - Build `lignes`: DEBIT 661 = totalBrut; CREDIT 422 = totalNet; CREDIT 431 if cnss > 0; CREDIT 447 if ipr > 0; CREDIT 432 if onem > 0; CREDIT 433 if inpp > 0
    - Verify balance: if sum(DEBIT) !== sum(CREDIT), log error and return `{ skipped: true, reason: 'unbalanced' }`
    - Set `numero_piece = "PAIE-YYYY-MM"`, `libelle = "Paie [Mois] [Année] — [N] employés"`, `date_ecriture` = last day of payroll month, `source_id = periodeId`, `type_operation = 'PAIE'`, `devise = 'USD'`
    - Insert header + all `lignes_ecritures` rows in a single `db.transaction`
    - Return `{ success: true, numeroPiece, ecritureId }` on success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.5, 6.6_

  - [x] 1.2 Write property test: journal entry balance invariant
    - **Property 1: Journal entry is always balanced (DEBIT = CREDIT)**
    - Generate random payslip arrays where `salaire_brut = salaire_net + cnss + ipr + onem + inpp`
    - Assert `sum(DEBIT lines) === sum(CREDIT lines)` for any valid input
    - _Requirements: 1.5_

  - [x] 1.3 Write property test: idempotency detection
    - **Property 2: Existing PAIE entry for same source_id is always detected**
    - Generate random `periodeId` strings; insert a mock entry with `source_id = periodeId` and `type_operation = 'PAIE'`; assert the idempotency check returns the existing entry
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Wire `generatePayrollJournalEntry` into `db-validate-payslips`
  - [x] 2.1 Add idempotency check inside `generatePayrollJournalEntry`
    - Query: `SELECT id, statut FROM ecritures_comptables WHERE source_id = ? AND type_operation = 'PAIE'`
    - If found with statut `VALIDE` or `CLOTURE`: return `{ skipped: true, reason: 'already_exists', statut }`
    - If found with statut `BROUILLON`: return `{ skipped: true, reason: 'brouillon_exists', ecritureId }`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Call `generatePayrollJournalEntry` at the end of `db-validate-payslips`
    - Call after the existing OHADA tracking block (after social charges creation)
    - Wrap in try/catch — journal failure must NOT throw or reject payroll validation
    - Modify return value to `{ success: true, journalEntry: { numeroPiece, skipped, reason } }`
    - _Requirements: 1.1, 6.1, 6.3, 6.4_

  - [x] 2.3 Write property test: error isolation
    - **Property 3: Journal generation failure does not propagate to payroll validation**
    - Simulate `generatePayrollJournalEntry` throwing; assert `db-validate-payslips` still returns `{ success: true }`
    - _Requirements: 6.1, 6.2_

- [x] 3. Add `db-generate-payroll-journal-entry` IPC handler for manual trigger
  - [x] 3.1 Implement `db-generate-payroll-journal-entry` in `public/electron.cjs`
    - Accept `{ periodeId, replaceExisting }`
    - Verify period exists and has status `VALIDEE` or `VERROUILLEE`; return `{ error }` otherwise
    - Idempotency check:
      - Existing `VALIDE`/`CLOTURE`: return `{ error: 'Écriture déjà validée/clôturée — remplacement impossible', statut }`
      - Existing `BROUILLON` and `replaceExisting !== true`: return `{ requiresConfirmation: true, existingId, numeroPiece }`
      - Existing `BROUILLON` and `replaceExisting === true`: delete existing entry and its `lignes_ecritures`, then regenerate
    - Call `generatePayrollJournalEntry(periodeId, db)` and return its result
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Expose `generatePayrollJournalEntry` in `public/preload.cjs`
    - Add `generatePayrollJournalEntry: (data) => ipcRenderer.invoke('db-generate-payroll-journal-entry', data)` to the `electronAPI` object
    - _Requirements: 3.2_

- [x] 4. Add "Générer écriture comptable" button to `PayrollManagement.tsx`
  - [x] 4.1 Add journal entry generation button to the period detail panel
    - Show button only when `selectedPeriod.statut === 'VALIDEE' || selectedPeriod.statut === 'VERROUILLEE'`
    - Button label: "Générer écriture comptable" with a `BookOpen` icon
    - On click: call `window.electronAPI.generatePayrollJournalEntry({ periodeId: selectedPeriod.id })`
    - If response has `requiresConfirmation: true`: show confirm dialog "Une écriture brouillon existe déjà (${numeroPiece}). La remplacer ?" — if confirmed, call again with `replaceExisting: true`
    - If response has `error` with `already_exists`/`VALIDE`/`CLOTURE`: show info alert (not an error)
    - On success: show alert "Écriture comptable ${numeroPiece} créée en brouillon. Consultez le Journal Comptable pour la valider."
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 4.2 Update `handleValidatePayslips` to show journal entry feedback in success message
    - After successful validation, check `result.journalEntry` from the IPC response
    - If `journalEntry.success`: append "Écriture comptable ${numeroPiece} créée en brouillon." to the success alert
    - If `journalEntry.skipped`: append "Écriture comptable déjà existante — non recréée." to the success alert
    - If no `journalEntry` (error was swallowed): show success alert without journal mention
    - _Requirements: 6.3, 6.4_

- [x] 5. Add PAIE type support to `JournalComptable.tsx`
  - [x] 5.1 Add "Paie" to the `type_operation` filter dropdown in `JournalComptable.tsx`
    - Add `{ value: 'PAIE', label: 'Paie' }` to the existing type filter options
    - Add a distinct badge style for `PAIE` type (e.g., purple/indigo background) in the type badge renderer
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Verify payroll entries display correctly in the journal expanded view
    - Confirm that clicking a PAIE entry expands to show all `lignes_ecritures` with account codes (661, 422, 431, 447, 432, 433), labels, and debit/credit amounts
    - Confirm the "Valider" and "Modifier" actions are available for BROUILLON PAIE entries
    - This is a verification task — fix any display issues found in `JournalComptable.tsx`
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 6. Add `generateSalaryPaymentJournalEntry` helper and wire into `db-payer-salaire`
  - [x] 6.1 Implement `generateSalaryPaymentJournalEntry(paiement, salaireImpaye, nouveauStatut, db)` as a standalone function in `public/electron.cjs`
    - Accept the full `paiement` object, the `salaireImpaye` record, the updated `nouveauStatut` after payment, and the `db` instance
    - Resolve the CREDIT account: if `paiement.compte_tresorerie_id` is set, query `comptes_tresorerie` for its `compte_ohada` field; otherwise default to `'5711'`
    - Build `lignes`: DEBIT 422 = `paiement.montant_paye`; CREDIT `{compte_tresorerie_ohada}` = `paiement.montant_paye`
    - Set `libelle`:
      - If `nouveauStatut === 'PAYE_PARTIEL'`: `"Paiement salaire {nom_complet} — {Mois} {Année} (Reste : {montant_restant} USD)"`
      - If `nouveauStatut === 'PAYE_TOTAL'`: `"Paiement salaire {nom_complet} — {Mois} {Année} — Solde final"`
    - Set `numero_piece = "SAL-YYYY-MM-{matricule}"` (use sequential number if no matricule)
    - Set `type_operation = 'PAIEMENT_SALAIRE'`, `source_id = paiementId`, `date_ecriture = paiement.date_paiement`, `devise = 'USD'`, `statut = 'BROUILLON'`
    - Insert header + 2 `lignes_ecritures` rows in a single `db.transaction`
    - Return `{ success: true, numeroPiece, ecritureId }` on success
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 8.1, 8.2_

  - [x] 6.2 Write property test: payment entry is always balanced
    - **Property 4: PAIEMENT_SALAIRE entry always has DEBIT 422 = CREDIT 5xx**
    - Generate random payment amounts and treasury account codes; assert `sum(DEBIT) === sum(CREDIT)` for all inputs
    - _Requirements: 7.2_

  - [x] 6.3 Write property test: libelle reflects payment status correctly
    - **Property 5: Libelle suffix matches payment status**
    - Generate random `(montant_paye, montant_net_du)` pairs; compute `nouveauStatut`; assert libelle contains `"Reste"` for PAYE_PARTIEL and `"Solde final"` for PAYE_TOTAL
    - _Requirements: 8.1, 8.2_

  - [x] 6.4 Wire `generateSalaryPaymentJournalEntry` into `db-payer-salaire` handler
    - Call after the treasury movement block (after `mouvements_tresorerie` insert), passing the newly created `paiementId`, the `salaireImpaye` record, `nouveauStatut`, and `nouveauMontantRestant`
    - Wrap in try/catch — journal failure must NOT throw or reject the salary payment
    - Modify return value to `{ success: true, id: paiementId, journalEntry: { numeroPiece, skipped, reason } }`
    - _Requirements: 7.1, 7.7_

  - [x] 6.5 Write property test: payment journal failure does not block salary payment
    - **Property 6: Journal generation failure does not propagate to salary payment**
    - Simulate `generateSalaryPaymentJournalEntry` throwing; assert `db-payer-salaire` still returns `{ success: true }`
    - _Requirements: 7.7_

- [x] 7. Add PAIEMENT_SALAIRE type support to `JournalComptable.tsx`
  - [x] 7.1 Add "Paiement Salaire" to the `type_operation` filter dropdown
    - Add `{ value: 'PAIEMENT_SALAIRE', label: 'Paiement Salaire' }` to the existing type filter options
    - Add a distinct badge style for `PAIEMENT_SALAIRE` (e.g., teal/emerald background) in the type badge renderer
    - _Requirements: 8.3, 8.4_

  - [x] 7.2 Verify PAIEMENT_SALAIRE entries display correctly in the expanded view
    - Confirm DEBIT 422 and CREDIT 5xx lines show with account codes, labels, and amounts
    - Confirm "Valider" and "Modifier" actions are available for BROUILLON entries
    - Fix any display issues found
    - _Requirements: 8.5_

- [ ] 8. Optional: Add employer social charges entry generation
  - [ ] 8.1 Extend `generatePayrollJournalEntry` to optionally generate a second entry for employer charges
    - Accept optional `includeChargesPatronales` flag (default: false)
    - Calculate employer CNSS = totalCNSS * (13/5) (employer rate 13% vs employee rate 5%)
    - If employer CNSS > 0: create second `Ecriture_Comptable` with DEBIT 664 / CREDIT 431, `numero_piece = "CHARGES-YYYY-MM"`, `libelle = "Charges patronales [Mois] [Année]"`
    - Return both entries in result
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Checkpoint — Run all tests and verify end-to-end flow
  - Run `npm run test` and ensure all property tests (Properties 1–6) pass
  - Manually verify payroll validation flow: validate period → journal shows PAIE-YYYY-MM in BROUILLON → validate in journal → Grand Livre shows 661, 422, 431, 447
  - Manually verify individual payment flow: pay one employee partially → journal shows SAL-YYYY-MM-{matricule} with DEBIT 422 / CREDIT 5xx and "(Reste : X USD)" in libelle → pay remaining balance → libelle shows "Solde final"
  - Verify manual trigger button works for a VERROUILLEE period
  - Verify idempotency: clicking "Générer écriture comptable" twice shows confirmation dialog on second click
  - Verify PAIEMENT_SALAIRE filter in journal shows only salary disbursement entries

## Notes

- `generatePayrollJournalEntry` and `generateSalaryPaymentJournalEntry` are plain functions, not IPC handlers — called internally by their respective handlers
- The `ecritures_comptables` table already has `type_operation IN ('PAIE', 'PAIEMENT_SALAIRE', ...)` and `source_id` columns — no schema migration needed
- Balance check: use `Math.abs(debit - credit) < 0.01` tolerance for rounding
- To resolve the CREDIT treasury account for Task 6.1: query `SELECT compte_ohada FROM comptes_tresorerie WHERE id = ?`; if the column doesn't exist yet, add it or default to '5711'
- Task 8 (employer charges) is optional — implement only if requested
- All amounts are in USD
