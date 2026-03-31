# Requirements Document

## Introduction

This document defines the requirements for six invoice feature enhancements to the Go Ahead SARLU billing system — a desktop Electron application using SQLite (better-sqlite3), React/TypeScript frontend, and OHADA accounting standards for the DRC.

The enhancements cover: sequential invoice numbering, automatic payment status transitions, overdue status computation, credit notes (avoirs), an invoice aging report, and per-client statements.

---

## Glossary

- **System**: The Go Ahead SARLU billing desktop application.
- **Invoice_Generator**: The backend IPC handler responsible for creating invoice records in the database.
- **Payment_Handler**: The backend IPC handler `db-add-paiement-gas` that records client payments.
- **Status_Engine**: The `updateFacturePaymentStatus` helper function in `electron.cjs`.
- **Sequence_Manager**: The atomic SQLite-based counter that assigns sequential invoice and credit note numbers.
- **Credit_Note**: An avoir document that reduces the outstanding balance of a referenced invoice.
- **Aging_Report**: A report grouping outstanding invoices by days-overdue buckets.
- **Client_Statement**: A per-client document listing all invoices and payments with a running balance for a selected period.
- **EN_RETARD**: A computed display status for invoices whose `date_echeance` is in the past and whose `solde_restant` is greater than zero.
- **PAYE_TOTAL**: The stored status indicating an invoice is fully paid.
- **PAYE_PARTIEL**: The stored status indicating an invoice has been partially paid.
- **solde_restant**: The outstanding balance of an invoice, computed as `montant_total_du_client` minus the sum of all recorded payments.
- **FAC number**: An invoice number in the format `FAC-YYYY-NNN` (e.g., `FAC-2026-001`).
- **AV number**: A credit note number in the format `AV-YYYY-NNN` (e.g., `AV-2026-001`).

---

## Requirements

### Requirement 1: Sequential Invoice Numbering

**User Story:** As a finance manager, I want invoices to be numbered sequentially per year in the format FAC-YY-MM-NNN, so that invoice numbers are predictable, auditable, and compliant with OHADA traceability requirements.

#### Acceptance Criteria

1. WHEN the Invoice_Generator creates a new invoice, THE Sequence_Manager SHALL assign a FAC number in the format `FAC-{YY}-{MM}-{NNN}` where `YY` is the two-digit emission year, `MM` is the two-digit emission month and `NNN` is a zero-padded three-digit sequence number starting at 001.
2. WHEN the Invoice_Generator creates multiple invoices in the same year, THE Sequence_Manager SHALL assign strictly incrementing sequence numbers with no gaps or duplicates.
3. WHEN the Invoice_Generator creates the first invoice of a new calendar year, THE Sequence_Manager SHALL reset the sequence counter to 001 for that year.
4. WHEN two or more invoice creation requests are processed concurrently, THE Sequence_Manager SHALL use a SQLite transaction with an exclusive lock to guarantee that each request receives a unique sequence number.
5. THE Sequence_Manager SHALL derive the year for the sequence from the `date_emission` field of the invoice, not from the server clock at insertion time.
6. WHEN an invoice is deleted, THE Sequence_Manager SHALL NOT reuse the sequence number of the deleted invoice.
7. THE System SHALL migrate existing invoices to retain their current `numero_facture` values without renumbering them.

---

### Requirement 2: Automatic Payment Status Transitions

**User Story:** As a finance manager, I want the invoice status to update automatically when a payment is recorded, so that I do not have to manually change the status after each payment.

#### Acceptance Criteria

1. WHEN a payment is recorded and the sum of all payments for the invoice equals or exceeds `montant_total_du_client`, THE Status_Engine SHALL set `statut_paiement` to `PAYE_TOTAL`.
2. WHEN a payment is recorded and the sum of all payments for the invoice is greater than zero but less than `montant_total_du_client`, THE Status_Engine SHALL set `statut_paiement` to `PAYE_PARTIEL`.
3. WHEN a payment is deleted and the remaining sum of payments drops to zero, THE Status_Engine SHALL revert `statut_paiement` to `ENVOYE` if the invoice was previously in `PAYE_PARTIEL` or `PAYE_TOTAL`.
4. WHEN a payment is deleted and the remaining sum of payments is greater than zero but less than `montant_total_du_client`, THE Status_Engine SHALL set `statut_paiement` to `PAYE_PARTIEL`.
5. THE Status_Engine SHALL execute the status update within the same SQLite transaction as the payment insertion or deletion to prevent inconsistent state.
6. IF the invoice `statut_paiement` is `ANNULE` or `BROUILLON`, THEN THE Status_Engine SHALL NOT modify the status regardless of payment amounts.

---

### Requirement 3: Overdue Status (EN_RETARD)

**User Story:** As a finance manager, I want overdue invoices to be visually identified as EN_RETARD in the invoice list and statistics, so that I can prioritize collection efforts without storing a redundant status in the database.

#### Acceptance Criteria

1. THE System SHALL compute EN_RETARD as a display-only status: an invoice is EN_RETARD when its `date_echeance` is strictly before the current date, its `solde_restant` is greater than zero, and its `statut_paiement` is neither `PAYE_TOTAL` nor `ANNULE`.
2. THE System SHALL NOT store EN_RETARD in the `statut_paiement` column of the `factures_clients` table.
3. WHEN the invoice list renders a status badge, THE System SHALL display the EN_RETARD badge (red) for invoices meeting the EN_RETARD criteria, overriding the stored status badge.
4. WHEN the status filter dropdown is rendered, THE System SHALL include an EN_RETARD option that filters the invoice list to show only invoices meeting the EN_RETARD criteria.
5. WHEN the statistics cards are computed, THE System SHALL count EN_RETARD invoices and display the count in the "En Retard" statistics card.
6. WHEN an invoice transitions to `PAYE_TOTAL` or `ANNULE`, THE System SHALL no longer display it as EN_RETARD.

---

### Requirement 4: Credit Notes (Avoir)

**User Story:** As a finance manager, I want to create a credit note against an existing invoice to correct billing errors or grant discounts, so that the client's outstanding balance is reduced and the transaction is traceable.

#### Acceptance Criteria

1. WHEN a credit note is created against an invoice, THE System SHALL assign an AV number in the format `AV-{YYYY}-{NNN}` where `YYYY` is the four-digit creation year and `NNN` is a zero-padded three-digit sequence number starting at 001, using the same atomic Sequence_Manager mechanism as FAC numbers.
2. THE System SHALL store each credit note in a dedicated `avoirs` table with fields: `id`, `numero_avoir`, `facture_id` (reference to original invoice), `client_id`, `date_avoir`, `montant_avoir`, `motif_avoir`, `devise`, and `cree_le`.
3. WHEN a credit note is saved, THE Status_Engine SHALL recompute the `solde_restant` of the referenced invoice by subtracting the credit note amount from the outstanding balance, and update `statut_paiement` accordingly using the same rules as Requirement 2.
4. THE System SHALL display a "Créer un Avoir" action button in the invoice detail modal for invoices with `statut_paiement` not equal to `ANNULE`.
5. WHEN a credit note is created, THE System SHALL display the credit note number, referenced invoice number, amount, and motif in the payment history tab of the invoice detail modal.
6. THE System SHALL provide a printable credit note document using the same A4 print template structure as invoices, showing: AV number, original invoice number, client name, date, amount, motif, and company footer.
7. WHEN a credit note amount exceeds the `solde_restant` of the referenced invoice, THE System SHALL reject the creation and display an error message indicating the maximum creditable amount.
8. THE System SHALL list all credit notes for a client in the client statement (Requirement 6).

---

### Requirement 5: Invoice Aging Report

**User Story:** As a finance manager, I want a report showing outstanding invoices grouped by age buckets, so that I can assess collection risk and prioritize follow-up actions.

#### Acceptance Criteria

1. THE System SHALL provide an aging report accessible from the invoices module via a dedicated "Rapport d'Ancienneté" button.
2. THE System SHALL group outstanding invoices (solde_restant > 0, statut_paiement not ANNULE) into four age buckets based on days elapsed since `date_echeance`: 0–30 days, 31–60 days, 61–90 days, and 90+ days.
3. WHEN an invoice has no `date_echeance`, THE System SHALL place it in the 0–30 days bucket.
4. THE System SHALL display for each invoice row: client name, invoice number, emission date, total amount, amount paid, outstanding balance, and days overdue.
5. THE System SHALL display a summary row per bucket showing the count of invoices and the total outstanding balance for that bucket.
6. THE System SHALL display a grand total row showing the total outstanding balance across all buckets.
7. THE System SHALL allow filtering the aging report by client.
8. THE System SHALL allow exporting the aging report to Excel using the existing `exportToExcel` utility.
9. FOR ALL outstanding invoices, the sum of amounts across all four buckets SHALL equal the total outstanding balance of all non-cancelled invoices with a positive solde_restant.

---

### Requirement 6: Client Statement

**User Story:** As a finance manager, I want to generate a printable client statement showing all invoices and payments for a specific client over a selected period, so that I can share an account summary with the client.

#### Acceptance Criteria

1. THE System SHALL provide a "Relevé de Compte" action accessible per client from the invoices list (via a button in the client row or filter context).
2. THE System SHALL allow the user to select a date range (date_debut and date_fin) for the statement period.
3. THE System SHALL list all invoices for the selected client within the period, ordered by date_emission ascending, showing: invoice number, emission date, period (mois/année), total amount, and amount paid.
4. THE System SHALL list all payments and credit notes for the selected client within the period, ordered by date_paiement ascending, showing: date, reference, mode, and amount.
5. THE System SHALL compute and display a running balance column: starting from the opening balance (sum of all unpaid amounts before date_debut), incrementing by each invoice amount, and decrementing by each payment and credit note amount.
6. THE System SHALL display the opening balance, total invoiced, total paid, total credited, and closing balance as a summary section.
7. THE System SHALL provide a print action that renders the statement as a printable A4 document using the company header (logo, RCCM, ID NAT, IMPOT) and footer (address, phone, bank details) consistent with the existing invoice print template.
8. THE System SHALL allow exporting the client statement to Excel using the existing `exportToExcel` utility.
9. FOR ALL client statements, the closing balance SHALL equal the opening balance plus total invoiced minus total paid minus total credited.
