# Implementation Plan: Invoice Enhancements

## Overview

Incremental implementation of six invoice features: sequential numbering, auto payment status, overdue display, credit notes, aging report, and client statement. Each task builds on the previous, wiring everything together at the end.

## Tasks

- [x] 1. Database schema migrations
  - Create `invoice_sequences` table with `(year, month)` primary key
  - Create `avoir_sequences` table with `year` primary key
  - Create `avoirs` table with all fields and indexes (`idx_avoirs_facture_id`, `idx_avoirs_client_id`)
  - Add schema creation calls in the Electron app startup (electron.cjs) using `CREATE TABLE IF NOT EXISTS`
  - _Requirements: 1.1, 1.4, 4.1, 4.2_

- [x] 2. Sequential invoice numbering (backend)
  - [x] 2.1 Implement `getNextInvoiceNumber(dateEmission, db)` in electron.cjs
    - Use `INSERT ... ON CONFLICT DO UPDATE` upsert on `invoice_sequences`
    - Wrap in a `db.transaction` for atomicity
    - Return formatted `FAC-{YY}-{MM}-{NNN}` string derived from `date_emission`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Write property test for FAC number format (Property 1)
    - **Property 1: FAC number format**
    - **Validates: Requirements 1.1, 1.5**
    - Generate random valid ISO date strings; assert result matches `/^FAC-\d{2}-\d{2}-\d{3}$/` and YY/MM match input date

  - [x] 2.3 Write property test for sequence strict increment (Property 2)
    - **Property 2: Sequence strictly increments, no duplicates**
    - **Validates: Requirements 1.2, 1.3**
    - Generate random N (1–20) and year/month; create N invoices; assert NNN parts form `[1, 2, ..., N]`

  - [x] 2.4 Write property test for deleted numbers not reused (Property 3)
    - **Property 3: Deleted sequence numbers are not reused**
    - **Validates: Requirements 1.6**
    - Create invoice, record NNN, delete it, create another for same period, assert new NNN > deleted NNN

  - [x] 2.5 Wire `getNextInvoiceNumber` into `db-add-facture-gas` handler
    - Call inside the INSERT transaction, replacing any client-side `generateInvoiceNumber` logic
    - Return the saved facture (with `numero_facture`) to the renderer
    - _Requirements: 1.1, 1.7_

- [ ] 3. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 4. Automatic payment status transitions (backend)
  - [x] 4.1 Implement `updateFacturePaymentStatus(factureId, db)` in electron.cjs
    - Sum `paiements.montant_paye` + `avoirs.montant_avoir` for the facture
    - Skip if `statut_paiement` is `ANNULE` or `BROUILLON`
    - Set `PAYE_TOTAL`, `PAYE_PARTIEL`, or `ENVOYE` accordingly
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.2 Write property test for payment status engine (Property 4)
    - **Property 4: Payment status engine correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.3**
    - Generate random `montant_total_du_client` and payment lists; assert `statut_paiement` matches expected status after inserts and deletes

  - [x] 4.3 Write property test for protected statuses (Property 5)
    - **Property 5: Protected statuses are immutable**
    - **Validates: Requirements 2.6**
    - Insert payments against ANNULE/BROUILLON invoices; assert `statut_paiement` is unchanged

  - [x] 4.4 Wire `updateFacturePaymentStatus` into `db-add-paiement-gas` and `db-delete-paiement-gas` handlers
    - Call within the same SQLite transaction as the payment INSERT/DELETE
    - For delete: fetch `facture_id` before deleting the payment row
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 4.5 Update `db-get-facture-paiements-summary` handler to include avoir amounts in `solde_restant`
    - Sum `paiements.montant_paye + avoirs.montant_avoir` for `montant_paye`
    - Compute `solde_restant = max(0, montant_total_du_client - montant_paye)`
    - _Requirements: 2.1, 4.3_

- [ ] 5. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 6. Overdue status — EN_RETARD (frontend)
  - [x] 6.1 Implement `isOverdue(facture)` pure function in InvoicesManagement.tsx
    - Returns `true` iff `date_echeance < today`, `soldeRestant > 0`, and status is not `PAYE_TOTAL` or `ANNULE`
    - _Requirements: 3.1, 3.2_

  - [x] 6.2 Write property test for `isOverdue` pure predicate (Property 6)
    - **Property 6: isOverdue is a pure predicate**
    - **Validates: Requirements 3.1, 3.3, 3.5, 3.6**
    - Generate random `FactureWithPayments` objects; assert `isOverdue` returns correct boolean for all combinations

  - [x] 6.3 Write property test for EN_RETARD never persisted (Property 7)
    - **Property 7: EN_RETARD is never persisted**
    - **Validates: Requirements 3.2**
    - After any sequence of operations, query `factures_clients WHERE statut_paiement = 'EN_RETARD'`; assert count = 0

  - [x] 6.4 Update `getStatusConfig` to accept `overdue` flag and return EN_RETARD config
    - Return `{ label: 'En Retard', color: 'bg-red-100 text-red-800', icon: AlertCircle }` when `overdue = true`
    - _Requirements: 3.3_

  - [x] 6.5 Wire EN_RETARD into invoice list rendering, status filter, and statistics card
    - Pass `isOverdue(f)` to `getStatusConfig` in table row render
    - Add `EN_RETARD` option to status filter dropdown; filter using `isOverdue`
    - Count overdue invoices for the "En Retard" statistics card
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [x] 7. Credit notes — Avoir (backend + frontend)
  - [x] 7.1 Implement `getNextAvoirNumber(dateAvoir, db)` in electron.cjs
    - Use `avoir_sequences` table with year-only key
    - Return formatted `AV-{YYYY}-{NNN}` string
    - _Requirements: 4.1_

  - [x] 7.2 Write property test for AV number format (Property 8)
    - **Property 8: AV number format**
    - **Validates: Requirements 4.1**
    - Generate random ISO date strings; assert result matches `/^AV-\d{4}-\d{3}$/`

  - [x] 7.3 Implement `db-create-avoir` IPC handler in electron.cjs
    - Validate `montant_avoir > 0` and `montant_avoir <= solde_restant`; return `{ error }` on violation
    - Call `getNextAvoirNumber`, INSERT into `avoirs`, call `updateFacturePaymentStatus` — all in one transaction
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

  - [x] 7.4 Write property test for avoir over-credit rejection (Property 9)
    - **Property 9: Avoir creation rejects over-credit**
    - **Validates: Requirements 4.7**
    - Generate invoice with known `solde_restant`; attempt avoir with `montant_avoir > solde_restant`; assert error returned and DB unchanged

  - [x] 7.5 Implement `db-get-avoirs-for-facture` and `db-get-avoirs-for-client` IPC handlers in electron.cjs
    - `db-get-avoirs-for-facture`: SELECT all avoirs WHERE `facture_id = ?`
    - `db-get-avoirs-for-client`: SELECT all avoirs WHERE `client_id = ?`, optionally filtered by date range
    - _Requirements: 4.5, 4.8, 6.4_

  - [x] 7.6 Add `createAvoir`, `getAvoirsForFacture`, `getAvoirsForClient` to preload.cjs
    - Wire each to the corresponding `ipcRenderer.invoke` call
    - _Requirements: 4.3, 4.5, 4.8_

  - [x] 7.7 Add `AvoirGAS`, `AgingBucket`, `StatementLine` TypeScript interfaces to `src/types/index.ts`
    - _Requirements: 4.2_

  - [x] 7.8 Create `CreditNoteForm.tsx` modal component
    - Fields: `montant_avoir` (max = `soldeRestant`), `motif_avoir`, `date_avoir`, `devise`
    - Client-side validation: reject if `montant_avoir > soldeRestant` with inline error
    - On submit: call `window.electronAPI.createAvoir(avoir)`, handle `{ error }` response
    - _Requirements: 4.4, 4.7_

  - [x] 7.9 Create `CreditNotePrintTemplate.tsx` A4 print component
    - Mirror `InvoicePrintTemplateNew.tsx` structure
    - Show: AV number, original FAC number, client name, date, amount, motif, company header/footer
    - _Requirements: 4.6_

  - [x] 7.10 Wire credit notes into `InvoiceDetailModal`
    - Add "Créer un Avoir" button (visible when `statut_paiement !== 'ANNULE'`)
    - In payment history tab: fetch avoirs via `getAvoirsForFacture`, render with credit note badge and "Imprimer Avoir" button
    - _Requirements: 4.4, 4.5_

- [ ] 8. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 9. Invoice aging report (frontend)
  - [x] 9.1 Implement `getBucket(facture)` pure function
    - Returns `'0-30' | '31-60' | '61-90' | '90+'` based on days since `date_echeance`
    - No `date_echeance` → `'0-30'`
    - _Requirements: 5.2, 5.3_

  - [x] 9.2 Write property test for aging bucket assignment (Property 10)
    - **Property 10: Aging bucket assignment is exhaustive and correct**
    - **Validates: Requirements 5.2, 5.3**
    - Generate random invoices with arbitrary `date_echeance`; assert `getBucket` returns correct bucket

  - [x] 9.3 Write property test for aging bucket totals (Property 11)
    - **Property 11: Aging report bucket totals sum to grand total**
    - **Validates: Requirements 5.9**
    - Generate random outstanding invoices; assert `sum(bucket.totalSolde) === sum(facture.soldeRestant)`

  - [x] 9.4 Write property test for aging client filter completeness (Property 12)
    - **Property 12: Aging report client filter completeness**
    - **Validates: Requirements 5.7**
    - Generate invoices for multiple clients; apply random client filter; assert all results belong to that client and no eligible invoice is missing

  - [x] 9.5 Create `InvoiceAgingReport.tsx` modal component
    - Receive `factures` and `clients` props (no extra fetch needed)
    - Filter: `soldeRestant > 0 && statut_paiement !== 'ANNULE'`
    - Group by `getBucket` using `useMemo`
    - Render 4 bucket sections with per-invoice rows, bucket summary rows, and grand total row
    - Client filter dropdown; "Exporter Excel" button calling `exportToExcel`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 9.6 Add "Rapport d'Ancienneté" button to `InvoicesManagement` and wire `InvoiceAgingReport` modal
    - _Requirements: 5.1_

- [x] 10. Client statement (frontend)
  - [x] 10.1 Create `ClientStatement.tsx` modal component
    - Date range picker (`dateDebut`, `dateFin`)
    - Filter `allFactures` by `client_id` and date range
    - Fetch avoirs via `getAvoirsForClient(client.id, { dateDebut, dateFin })`
    - Compute opening balance from invoices with `date_emission < dateDebut`
    - Merge and sort all transactions chronologically; compute running balance
    - Render statement table with columns: date, reference, type, debit, credit, balance
    - Summary section: opening balance, total invoiced, total paid, total credited, closing balance
    - "Imprimer" button (`window.print()`) and "Exporter Excel" button (`exportToExcel`)
    - Use company header/footer consistent with invoice print template
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 10.2 Write property test for closing balance invariant (Property 13)
    - **Property 13: Client statement closing balance invariant**
    - **Validates: Requirements 6.5, 6.9**
    - Generate random statement data; assert `closing = opening + invoiced - paid - credited`

  - [x] 10.3 Write property test for statement transaction completeness (Property 14)
    - **Property 14: Client statement transaction completeness**
    - **Validates: Requirements 6.3, 6.4**
    - Generate random client, date range, and transaction set; assert every in-range transaction appears exactly once and no out-of-range or other-client transaction appears

  - [x] 10.4 Add "Relevé de Compte" button per client in `InvoicesManagement` and wire `ClientStatement` modal
    - _Requirements: 6.1_

- [ ] 11. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** (frontend) with a minimum of 100 iterations each
- All IPC handlers wrap logic in try/catch and return `{ error: message }` on failure
- EN_RETARD is never stored in the database — it is a pure frontend computation
