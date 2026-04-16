# Requirements Document

## Introduction

This document defines the requirements for the **Payroll–Finance Journal Link** feature in GAS-MIS. Currently, when a payroll period is validated (status changes to `VALIDEE`), no journal entries are created in the OHADA accounting module. Finance and payroll are completely disconnected, forcing the accountant to manually re-enter payroll data into the journal.

This feature bridges that gap: upon payroll validation, the system automatically generates OHADA-compliant journal entries in `BROUILLON` status so the accountant can review and validate them in the Finance module without any manual data entry. A manual trigger is also provided in case the automatic generation was skipped or needs to be regenerated.

---

## Glossary

- **System**: The GAS-MIS Electron desktop application.
- **Journal_Generator**: The backend logic (IPC handler) responsible for creating OHADA journal entries from payroll data.
- **Payroll_Validator**: The existing `db-validate-payslips` IPC handler that transitions a payroll period from `CALCULEE` to `VALIDEE`.
- **Ecriture_Comptable**: An OHADA journal entry stored in the `ecritures_comptables` table, composed of one or more `lignes_ecritures` (debit/credit lines).
- **Ligne_Ecriture**: A single debit or credit line within an `Ecriture_Comptable`, referencing an OHADA account code.
- **Periode_Paie**: A payroll period record in the `periodes_paie` table, identified by month and year.
- **Bulletin_Paie**: An individual employee payslip record in the `bulletins_paie` table.
- **BROUILLON**: The initial status of a newly created `Ecriture_Comptable`, indicating it is pending accountant review.
- **VALIDEE**: The status of a `Periode_Paie` after all payslips have been validated by the payroll manager.
- **Compte 661**: OHADA account "Rémunérations du personnel" — records the gross salary expense (debit).
- **Compte 422**: OHADA account "Personnel, rémunérations dues" — records net salaries payable to employees (credit at payroll validation; debit when payment is made to clear the liability).
- **Compte 431**: OHADA account "CNSS" — records CNSS social contributions withheld (credit).
- **Compte 447**: OHADA account "IPR à payer" — records IPR (income tax) withheld (credit).
- **Compte 432**: OHADA account "ONEM" — records ONEM contributions withheld (credit).
- **Compte 433**: OHADA account "INPP" — records INPP contributions withheld (credit).
- **Compte 664**: OHADA account "Charges sociales patronales" — records employer social charges (debit).
- **Compte 431_patronal**: OHADA account "CNSS patronal" — records the employer share of CNSS (credit).
- **Idempotency**: The property that generating journal entries for a period that already has entries does not create duplicates.
- **source_id**: A field on `ecritures_comptables` that links the journal entry back to its originating document (here, the `Periode_Paie` id or `Paiement_Salaire` id depending on the entry type).
- **Payment_Generator**: The backend logic responsible for creating OHADA journal entries when an individual salary payment is recorded via `db-payer-salaire`.
- **Paiement_Salaire**: An individual salary payment record in the `paiements_salaires` table, created when a user pays one employee through the "Salaires Impayés" screen.
- **Salaire_Impaye**: A record in the `salaires_impayes` table tracking the outstanding salary balance for one employee in a given period, with fields `montant_paye`, `montant_restant`, and `statut` (`IMPAYE` / `PAYE_PARTIEL` / `PAYE_TOTAL`).
- **Compte 5xx**: OHADA treasury/bank accounts — e.g., 521 "Banque", 571 "Caisse". Used as the credit side when a salary payment is disbursed.
- **Compte 5711**: OHADA account "Caisse" — default treasury account used when no specific `compte_tresorerie` is linked to a payment.
- **PAIEMENT_SALAIRE**: The `type_operation` value used on `ecritures_comptables` for individual salary payment journal entries. This value already exists in the database CHECK constraint.
- **PAYE_TOTAL**: The `statut` value on `salaires_impayes` indicating the employee has been fully paid for the period.
- **PAYE_PARTIEL**: The `statut` value on `salaires_impayes` indicating the employee has been partially paid for the period.

---

## Requirements

### Requirement 1: Automatic Journal Entry Generation on Payroll Validation

**User Story:** As a finance manager, when payroll is validated for a period, I want the system to automatically create the corresponding OHADA journal entries in `BROUILLON` status, so that I can review and validate them in the accounting module without manual data entry.

#### Acceptance Criteria

1. WHEN the Payroll_Validator transitions a `Periode_Paie` to `VALIDEE`, THE Journal_Generator SHALL create an `Ecriture_Comptable` of type `PAIE` in `BROUILLON` status within the same database transaction.
2. WHEN the Journal_Generator creates the salary expense entry, THE Journal_Generator SHALL include the following `Ligne_Ecriture` records:
   - One DEBIT line on Compte 661 for the sum of `salaire_brut` across all `Bulletin_Paie` records of the period.
   - One CREDIT line on Compte 422 for the sum of `salaire_net` across all `Bulletin_Paie` records of the period.
   - One CREDIT line on Compte 431 for the sum of `cnss` across all `Bulletin_Paie` records of the period (only if the total is greater than zero).
   - One CREDIT line on Compte 447 for the sum of `ipr` across all `Bulletin_Paie` records of the period (only if the total is greater than zero).
   - One CREDIT line on Compte 432 for the sum of `onem` across all `Bulletin_Paie` records of the period (only if the total is greater than zero).
   - One CREDIT line on Compte 433 for the sum of `inpp` across all `Bulletin_Paie` records of the period (only if the total is greater than zero).
3. WHEN the Journal_Generator creates the salary expense entry, THE Journal_Generator SHALL set the `libelle` to `"Paie [Mois] [Année] — [N] employés"` where `[Mois]` is the French month name, `[Année]` is the four-digit year, and `[N]` is the count of `Bulletin_Paie` records in the period.
4. WHEN the Journal_Generator creates the salary expense entry, THE Journal_Generator SHALL set `source_id` to the `Periode_Paie` id, `date_ecriture` to the last day of the payroll month, and `devise` to `USD`.
5. WHEN the Journal_Generator creates the salary expense entry, THE Journal_Generator SHALL verify that the total DEBIT equals the total CREDIT across all `Ligne_Ecriture` records before inserting; IF the entry is unbalanced, THEN THE Journal_Generator SHALL abort the entry creation and log an error without failing the payroll validation.
6. WHEN the Journal_Generator creates the salary expense entry, THE Journal_Generator SHALL set `numero_piece` to `"PAIE-[YYYY]-[MM]"` where `[YYYY]` is the four-digit year and `[MM]` is the zero-padded two-digit month.

---

### Requirement 2: Idempotent Journal Entry Generation

**User Story:** As a finance manager, I want the system to avoid creating duplicate journal entries if validation is triggered more than once for the same period, so that the accounting journal remains clean and accurate.

#### Acceptance Criteria

1. WHEN the Journal_Generator is invoked for a `Periode_Paie` that already has an `Ecriture_Comptable` with `source_id` equal to the period id and `type_operation` equal to `PAIE`, THE Journal_Generator SHALL skip creation and return without error.
2. WHEN the Journal_Generator is invoked for a `Periode_Paie` that already has an `Ecriture_Comptable` in `BROUILLON` status, THE Journal_Generator SHALL NOT create a second entry.
3. WHEN the Journal_Generator is invoked for a `Periode_Paie` that already has an `Ecriture_Comptable` in `VALIDE` or `CLOTURE` status, THE Journal_Generator SHALL NOT create a second entry and SHALL return a message indicating the entry already exists.

---

### Requirement 3: Manual Journal Entry Regeneration from Payroll UI

**User Story:** As a finance manager, I want to manually trigger journal entry generation for a validated payroll period from the payroll interface, so that I can regenerate entries if they were skipped, deleted, or need to be recreated.

#### Acceptance Criteria

1. WHEN a `Periode_Paie` has status `VALIDEE` or `VERROUILLEE`, THE Payroll_UI SHALL display a "Générer écriture comptable" action button for that period.
2. WHEN the user clicks "Générer écriture comptable", THE System SHALL invoke the Journal_Generator for the selected period and display a success or error message.
3. WHEN the Journal_Generator is invoked manually and an existing `BROUILLON` entry already exists for the period, THE System SHALL display a confirmation dialog asking whether to replace the existing entry before proceeding.
4. WHEN the user confirms replacement of an existing `BROUILLON` entry, THE Journal_Generator SHALL delete the existing `BROUILLON` entry and its `Ligne_Ecriture` records, then create a fresh entry.
5. WHEN the Journal_Generator is invoked manually and an existing `VALIDE` or `CLOTURE` entry already exists, THE System SHALL display an informational message and SHALL NOT allow replacement.
6. WHEN the Journal_Generator completes successfully via manual trigger, THE System SHALL display the `numero_piece` of the created entry so the accountant can locate it in the journal.

---

### Requirement 4: Optional Employer Social Charges Entry

**User Story:** As a finance manager, I want the system to optionally generate a separate journal entry for employer social charges (charges patronales), so that the full cost of employment is recorded in the accounting module.

#### Acceptance Criteria

1. WHERE employer social charges generation is enabled, THE Journal_Generator SHALL create a second `Ecriture_Comptable` of type `PAIE` in `BROUILLON` status for the employer share of CNSS.
2. WHEN the Journal_Generator creates the employer charges entry, THE Journal_Generator SHALL include:
   - One DEBIT line on Compte 664 for the total employer CNSS contribution amount.
   - One CREDIT line on Compte 431 for the same total employer CNSS contribution amount.
3. WHEN the Journal_Generator creates the employer charges entry, THE Journal_Generator SHALL set the `libelle` to `"Charges patronales [Mois] [Année]"` and `numero_piece` to `"CHARGES-[YYYY]-[MM]"`.
4. WHEN the Journal_Generator creates the employer charges entry, THE Journal_Generator SHALL set `source_id` to the `Periode_Paie` id and `date_ecriture` to the last day of the payroll month.
5. IF the total employer CNSS contribution amount is zero, THEN THE Journal_Generator SHALL NOT create the employer charges entry.

---

### Requirement 5: Journal Entry Visibility in Finance Module

**User Story:** As a finance manager, I want payroll-generated journal entries to appear in the accounting journal with clear identification, so that I can easily find, review, and validate them.

#### Acceptance Criteria

1. WHEN the Finance module's journal list is displayed, THE System SHALL show payroll-generated entries with `type_operation` equal to `PAIE` and the label "Paie" in the type filter and type badge.
2. WHEN a payroll-generated `Ecriture_Comptable` is displayed in the journal, THE System SHALL show the `numero_piece` (e.g., `PAIE-2025-06`) and the `libelle` (e.g., `Paie Juin 2025 — 42 employés`) in the journal row.
3. WHEN the accountant expands a payroll-generated entry in the journal, THE System SHALL display all `Ligne_Ecriture` records with their OHADA account codes, account labels, debit amounts, and credit amounts.
4. WHEN a payroll-generated entry has `BROUILLON` status, THE System SHALL allow the accountant to validate it using the existing "Valider" action in the journal UI.
5. WHEN a payroll-generated entry has `BROUILLON` status, THE System SHALL allow the accountant to edit it using the existing "Modifier" action in the journal UI.

---

### Requirement 6: Data Integrity and Error Handling

**User Story:** As a system administrator, I want journal entry generation failures to be handled gracefully without blocking payroll validation, so that payroll operations are never interrupted by accounting errors.

#### Acceptance Criteria

1. IF the Journal_Generator encounters a database error during entry creation, THEN THE System SHALL log the error with the `Periode_Paie` id and continue the payroll validation without throwing an exception to the UI.
2. IF the Journal_Generator produces an unbalanced entry (total debit ≠ total credit), THEN THE System SHALL abort the entry creation, log the discrepancy amounts, and continue the payroll validation.
3. WHEN the Journal_Generator completes successfully during automatic generation, THE System SHALL include a notification in the payroll validation success message indicating that a journal entry was created (e.g., "Bulletins validés. Écriture comptable PAIE-2025-06 créée en brouillon.").
4. WHEN the Journal_Generator is skipped due to an existing entry, THE System SHALL include a notification in the payroll validation success message indicating that the entry already existed.
5. IF a `Bulletin_Paie` has `salaire_brut` equal to zero, THEN THE Journal_Generator SHALL exclude that bulletin from all aggregated totals.
6. THE Journal_Generator SHALL use a SQLite transaction to ensure that either all `Ligne_Ecriture` records and the `Ecriture_Comptable` header are inserted together, or none are inserted.

---

### Requirement 7: Individual Salary Payment Journal Entry

**User Story:** As a finance manager, when an individual employee salary is paid through the "Salaires Impayés" screen, I want the system to automatically create the corresponding OHADA journal entry, so that each disbursement is recorded in the accounting module without manual data entry.

#### Acceptance Criteria

1. WHEN `db-payer-salaire` records a payment in `paiements_salaires`, THE Payment_Generator SHALL create an `Ecriture_Comptable` of type `PAIEMENT_SALAIRE` in `BROUILLON` status.
2. WHEN the Payment_Generator creates the salary payment entry, THE Payment_Generator SHALL include the following `Ligne_Ecriture` records:
   - One DEBIT line on Compte 422 for the amount paid (clears the salary liability created at payroll validation).
   - One CREDIT line on the treasury account corresponding to `compte_tresorerie_id` if provided (using the OHADA account code stored on that treasury record, e.g., 521 for bank, 571 for cash).
   - IF no `compte_tresorerie_id` is provided, THEN THE Payment_Generator SHALL use Compte 5711 as the CREDIT account.
3. WHEN the Payment_Generator creates the salary payment entry, THE Payment_Generator SHALL set `source_id` to the `paiementId` of the newly created `paiements_salaires` record.
4. WHEN the Payment_Generator creates the salary payment entry, THE Payment_Generator SHALL set `numero_piece` to `"SAL-[YYYY]-[MM]-[matricule]"` where `[YYYY]` is the four-digit year, `[MM]` is the zero-padded two-digit month, and `[matricule]` is the employee's matricule; IF no matricule is available, THE Payment_Generator SHALL use a zero-padded sequential number instead.
5. WHEN the Payment_Generator creates the salary payment entry, THE Payment_Generator SHALL set `libelle` to `"Paiement salaire [Nom Employé] — [Mois] [Année]"` where `[Nom Employé]` is the employee's full name, `[Mois]` is the French month name, and `[Année]` is the four-digit year.
6. WHEN the Payment_Generator creates the salary payment entry, THE Payment_Generator SHALL set `date_ecriture` to the date of the payment and `devise` to `USD`.
7. IF the Payment_Generator encounters a database error during entry creation, THEN THE System SHALL log the error with the `paiementId` and continue the salary payment recording without throwing an exception to the UI, so that the payment itself is never blocked by an accounting failure.
8. THE Payment_Generator SHALL use a SQLite transaction to ensure that either all `Ligne_Ecriture` records and the `Ecriture_Comptable` header are inserted together, or none are inserted.

---

### Requirement 8: Partial Payment Tracking and Outstanding Balance Visibility

**User Story:** As a finance manager, I want each salary payment journal entry to reflect the remaining balance after payment, and I want to be able to filter the journal by salary disbursements, so that I can track outstanding salary liabilities from the Finance module without switching to the payroll screen.

#### Acceptance Criteria

1. WHEN the Payment_Generator creates a salary payment entry and the corresponding `Salaire_Impaye` record has `statut` equal to `PAYE_PARTIEL` after the payment, THE Payment_Generator SHALL append the remaining balance to the `libelle` in the format `"Paiement salaire [Nom Employé] — [Mois] [Année] (Reste : [montant_restant] USD)"`.
2. WHEN the Payment_Generator creates a salary payment entry and the corresponding `Salaire_Impaye` record has `statut` equal to `PAYE_TOTAL` after the payment, THE Payment_Generator SHALL set the `libelle` to `"Paiement salaire [Nom Employé] — [Mois] [Année] — Solde final"`.
3. WHEN the Finance module's journal list is displayed, THE System SHALL allow filtering by `type_operation` equal to `PAIEMENT_SALAIRE` so that the accountant can view all salary disbursement entries in isolation.
4. WHEN the Finance module's journal list is displayed, THE System SHALL show entries with `type_operation` equal to `PAIEMENT_SALAIRE` with the label "Paiement Salaire" in the type filter and type badge.
5. WHEN the accountant expands a `PAIEMENT_SALAIRE` entry in the journal, THE System SHALL display the DEBIT line on Compte 422 and the CREDIT line on the treasury account with their respective amounts, account codes, and account labels.
