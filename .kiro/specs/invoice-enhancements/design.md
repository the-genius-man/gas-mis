# Design Document — Invoice Enhancements

## Overview

This document describes the technical design for six invoice feature enhancements to the Go Ahead SARLU billing system: sequential invoice numbering, automatic payment status transitions, overdue status computation, credit notes (avoirs), an invoice aging report, and per-client statements.

The system is a desktop Electron app with a React/TypeScript frontend, SQLite via `better-sqlite3` (synchronous API), and OHADA accounting standards for the DRC.

---

## Architecture

The enhancements follow the existing layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│  React/TypeScript Frontend                              │
│  InvoicesManagement  InvoiceDetailModal  InvoiceForm    │
│  InvoiceAgingReport  ClientStatement  CreditNoteForm    │
│  CreditNotePrintTemplate                                │
└────────────────────┬────────────────────────────────────┘
                     │ window.electronAPI (contextBridge)
┌────────────────────▼────────────────────────────────────┐
│  preload.cjs — IPC bridge                               │
└────────────────────┬────────────────────────────────────┘
                     │ ipcRenderer.invoke / ipcMain.handle
┌────────────────────▼────────────────────────────────────┐
│  electron.cjs — IPC handlers + SQLite (better-sqlite3)  │
│  getNextInvoiceNumber  updateFacturePaymentStatus        │
│  db-create-avoir  db-get-avoirs-for-facture             │
│  db-get-avoirs-for-client                               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  SQLite database                                        │
│  factures_clients  paiements  invoice_sequences         │
│  avoirs  avoir_sequences                                │
└─────────────────────────────────────────────────────────┘
```

All six features are additive — no existing tables are altered, no existing IPC channels are removed.

---

## Components and Interfaces

### Backend helpers (electron.cjs)

#### `getNextInvoiceNumber(dateEmission: string, db): string`

Atomically increments the `invoice_sequences` counter for the year/month derived from `dateEmission` and returns the formatted FAC number.

```js
// Pseudocode
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

  // better-sqlite3 is synchronous — wrap in a transaction for atomicity
  const getNext = db.transaction((y, m) => {
    upsert.run(y, m);
    return select.get(y, m).last_sequence;
  });

  const seq = getNext(year, month);
  const nnn = String(seq).padStart(3, '0');
  return `FAC-${yy}-${mm}-${nnn}`;
}
```

Called inside the `db-add-facture-gas` handler, replacing the client-side `generateInvoiceNumber`.

#### `getNextAvoirNumber(dateAvoir: string, db): string`

Same mechanism using `avoir_sequences`, returns `AV-YYYY-NNN`.

```js
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
```

#### `updateFacturePaymentStatus(factureId: string, db): void`

Recomputes the payment status of a facture by summing all paiements **and** avoirs for that facture, then updating `statut_paiement`. Must be called within the same transaction as the triggering payment or avoir operation.

```js
function updateFacturePaymentStatus(factureId, db) {
  const facture = db.prepare(
    `SELECT montant_total_du_client, statut_paiement FROM factures_clients WHERE id = ?`
  ).get(factureId);

  if (!facture) return;
  // Skip protected statuses
  if (facture.statut_paiement === 'ANNULE' || facture.statut_paiement === 'BROUILLON') return;

  const { total_paye } = db.prepare(
    `SELECT COALESCE(SUM(montant_paye), 0) AS total_paye FROM paiements WHERE facture_id = ?`
  ).get(factureId);

  const { total_avoir } = db.prepare(
    `SELECT COALESCE(SUM(montant_avoir), 0) AS total_avoir FROM avoirs WHERE facture_id = ?`
  ).get(factureId);

  const totalCredit = total_paye + total_avoir;
  let newStatus;

  if (totalCredit >= facture.montant_total_du_client) {
    newStatus = 'PAYE_TOTAL';
  } else if (totalCredit > 0) {
    newStatus = 'PAYE_PARTIEL';
  } else {
    newStatus = 'ENVOYE';
  }

  db.prepare(
    `UPDATE factures_clients SET statut_paiement = ? WHERE id = ?`
  ).run(newStatus, factureId);
}
```

### Frontend helpers (InvoicesManagement.tsx)

#### `isOverdue(facture: FactureWithPayments): boolean`

Pure function, no side effects.

```ts
function isOverdue(facture: FactureWithPayments): boolean {
  if (facture.statut_paiement === 'PAYE_TOTAL' || facture.statut_paiement === 'ANNULE') return false;
  if (!facture.date_echeance) return false;
  return new Date(facture.date_echeance) < new Date() && facture.soldeRestant > 0;
}
```

#### Updated `getStatusConfig`

```ts
function getStatusConfig(status: StatutFacture, overdue = false) {
  if (overdue) {
    return { label: 'En Retard', color: 'bg-red-100 text-red-800', icon: AlertCircle, bgColor: 'bg-red-50' };
  }
  // ... existing cases unchanged
}
```

### New Frontend Components

#### `CreditNoteForm.tsx`

Modal form for creating an avoir against an invoice.

```ts
interface CreditNoteFormProps {
  facture: FactureWithPayments;
  client?: ClientGAS;
  onClose: () => void;
  onSuccess: () => void;
}
```

Fields: `montant_avoir` (max = `soldeRestant`), `motif_avoir`, `date_avoir` (defaults to today), `devise` (inherited from facture).

On submit: calls `window.electronAPI.createAvoir(avoir)`. Displays validation error if `montant_avoir > soldeRestant`.

#### `CreditNotePrintTemplate.tsx`

A4 print template for avoirs, mirroring `InvoicePrintTemplateNew.tsx` structure.

```ts
interface CreditNotePrintTemplateProps {
  avoir: AvoirGAS;
  facture: FactureGAS;
  client?: ClientGAS;
}
```

Renders: AV number, original FAC number, client name, date, amount, motif, company header/footer.

#### `InvoiceAgingReport.tsx`

Modal component rendered from `InvoicesManagement`. Pure frontend computation from the already-loaded `factures` array.

```ts
interface InvoiceAgingReportProps {
  factures: FactureWithPayments[];
  clients: ClientGAS[];
  onClose: () => void;
}
```

Internal state: `clientFilter: string` (client_id or 'ALL').

Bucket assignment logic:

```ts
function getBucket(facture: FactureWithPayments): '0-30' | '31-60' | '61-90' | '90+' {
  if (!facture.date_echeance) return '0-30';
  const days = Math.floor((Date.now() - new Date(facture.date_echeance).getTime()) / 86400000);
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}
```

Only includes invoices where `soldeRestant > 0` and `statut_paiement !== 'ANNULE'`.

Export: calls `exportToExcel(rows, 'Rapport_Anciennete', 'Ancienneté')`.

#### `ClientStatement.tsx`

Modal component rendered from `InvoicesManagement`. Fetches invoices, payments, and avoirs for a specific client.

```ts
interface ClientStatementProps {
  client: ClientGAS;
  allFactures: FactureWithPayments[];
  onClose: () => void;
}
```

Internal state: `dateDebut: string`, `dateFin: string`, `paiements: PaiementGAS[]`, `avoirs: AvoirGAS[]`.

On mount / date change: filters `allFactures` by `client_id` and date range, fetches paiements and avoirs via `window.electronAPI.getAvoirsForClient(client.id)`.

Running balance computation:

```ts
// opening balance = sum of soldeRestant for invoices with date_emission < dateDebut
// then for each transaction in chronological order, adjust balance
```

Print: `window.print()` with `@media print` CSS hiding modal chrome, showing only statement content.

Export: `exportToExcel(rows, 'Releve_Client_' + client.nom_entreprise, 'Relevé')`.

---

## Data Models

### New SQLite Tables

#### `invoice_sequences`

```sql
CREATE TABLE IF NOT EXISTS invoice_sequences (
  year          INTEGER NOT NULL,
  month         INTEGER NOT NULL,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year, month)
);
```

#### `avoir_sequences`

```sql
CREATE TABLE IF NOT EXISTS avoir_sequences (
  year          INTEGER NOT NULL PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0
);
```

#### `avoirs`

```sql
CREATE TABLE IF NOT EXISTS avoirs (
  id            TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  numero_avoir  TEXT    NOT NULL UNIQUE,
  facture_id    TEXT    NOT NULL REFERENCES factures_clients(id) ON DELETE RESTRICT,
  client_id     TEXT    NOT NULL REFERENCES clients(id),
  date_avoir    TEXT    NOT NULL,
  montant_avoir REAL    NOT NULL CHECK (montant_avoir > 0),
  motif_avoir   TEXT    NOT NULL,
  devise        TEXT    NOT NULL DEFAULT 'USD',
  cree_le       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_avoirs_facture_id ON avoirs(facture_id);
CREATE INDEX IF NOT EXISTS idx_avoirs_client_id  ON avoirs(client_id);
```

### New TypeScript Types (src/types/index.ts)

```ts
export interface AvoirGAS {
  id: string;
  numero_avoir: string;
  facture_id: string;
  client_id: string;
  date_avoir: string;
  montant_avoir: number;
  motif_avoir: string;
  devise: DeviseClient;
  cree_le?: string;
  // Joined
  facture?: FactureGAS;
  client?: ClientGAS;
}

export interface AgingBucket {
  label: string;           // '0-30 jours', '31-60 jours', etc.
  invoices: FactureWithPayments[];
  totalSolde: number;
}

export interface StatementLine {
  date: string;
  reference: string;
  type: 'FACTURE' | 'PAIEMENT' | 'AVOIR';
  debit: number;           // invoice amount
  credit: number;          // payment or avoir amount
  balance: number;         // running balance
}
```

### Updated `getFacturePaiementsSummary` handler

The existing `db-get-facture-paiements-summary` handler must include avoir amounts in `solde_restant`:

```js
// In electron.cjs
ipcMain.handle('db-get-facture-paiements-summary', (event, factureId) => {
  const facture = db.prepare(`SELECT montant_total_du_client FROM factures_clients WHERE id = ?`).get(factureId);
  const { total_paye } = db.prepare(`SELECT COALESCE(SUM(montant_paye), 0) AS total_paye FROM paiements WHERE facture_id = ?`).get(factureId);
  const { total_avoir } = db.prepare(`SELECT COALESCE(SUM(montant_avoir), 0) AS total_avoir FROM avoirs WHERE facture_id = ?`).get(factureId);
  const montant_paye = total_paye + total_avoir;
  const solde_restant = Math.max(0, facture.montant_total_du_client - montant_paye);
  return { montant_paye, solde_restant };
});
```

### New IPC Handlers

| Channel | Direction | Description |
|---|---|---|
| `db-create-avoir` | renderer → main | Creates an avoir, calls `updateFacturePaymentStatus` in same transaction |
| `db-get-avoirs-for-facture` | renderer → main | Returns all avoirs for a given `facture_id` |
| `db-get-avoirs-for-client` | renderer → main | Returns all avoirs for a given `client_id`, optionally filtered by date range |

### New preload.cjs entries

```js
createAvoir: (avoir) => ipcRenderer.invoke('db-create-avoir', avoir),
getAvoirsForFacture: (factureId) => ipcRenderer.invoke('db-get-avoirs-for-facture', factureId),
getAvoirsForClient: (clientId, filters) => ipcRenderer.invoke('db-get-avoirs-for-client', clientId, filters),
```

---

## Data Flow

### Feature 1 — Sequential Invoice Numbering

```
InvoiceForm / BulkInvoiceWizard
  → removes generateInvoiceNumber() call
  → sends facture payload WITHOUT numero_facture to db-add-facture-gas

electron.cjs db-add-facture-gas handler
  → calls getNextInvoiceNumber(facture.date_emission, db) inside INSERT transaction
  → assigns returned FAC number to facture record
  → returns saved facture (with numero_facture) to renderer
```

### Feature 2 — Auto Payment Status

```
db-add-paiement-gas handler
  → BEGIN TRANSACTION
  → INSERT INTO paiements
  → updateFacturePaymentStatus(facture_id, db)
  → COMMIT

db-delete-paiement-gas handler
  → BEGIN TRANSACTION
  → DELETE FROM paiements WHERE id = ?
  → updateFacturePaymentStatus(facture_id, db)  [need to fetch facture_id before delete]
  → COMMIT
```

### Feature 3 — EN_RETARD Status

```
InvoicesManagement (already has factures loaded)
  → filteredFactures.filter(isOverdue) → enRetard count for stats card
  → statusFilter === 'EN_RETARD' → filteredFactures.filter(isOverdue)
  → table row render: getStatusConfig(f.statut_paiement, isOverdue(f))
```

No backend changes. Pure frontend computation.

### Feature 4 — Credit Notes

```
InvoiceDetailModal
  → "Créer un Avoir" button (visible when statut_paiement !== 'ANNULE')
  → opens CreditNoteForm modal

CreditNoteForm
  → validates montant_avoir <= soldeRestant (frontend guard)
  → calls window.electronAPI.createAvoir(avoir)

electron.cjs db-create-avoir handler
  → BEGIN TRANSACTION
  → getNextAvoirNumber(date_avoir, db)
  → INSERT INTO avoirs
  → updateFacturePaymentStatus(facture_id, db)
  → COMMIT
  → returns saved avoir

InvoiceDetailModal paiements tab
  → loads paiements + avoirs for facture
  → renders avoirs with distinct styling (credit note badge)
  → "Imprimer Avoir" button opens CreditNotePrintTemplate
```

### Feature 5 — Aging Report

```
InvoicesManagement
  → "Rapport d'Ancienneté" button → opens InvoiceAgingReport modal

InvoiceAgingReport
  → receives factures prop (already loaded, no extra fetch)
  → filters: soldeRestant > 0 && statut_paiement !== 'ANNULE'
  → groups by getBucket(facture)
  → renders 4 bucket sections + summary row + grand total
  → client filter dropdown → re-filters in useMemo
  → "Exporter Excel" → exportToExcel(rows, ...)
```

### Feature 6 — Client Statement

```
InvoicesManagement
  → "Relevé" button per unique client in filtered list
  → opens ClientStatement modal with client + allFactures

ClientStatement
  → date range picker (dateDebut, dateFin)
  → on change: filter allFactures by client_id + date range
  → fetch paiements: window.electronAPI.getPaiementsGAS per facture (or new bulk endpoint)
  → fetch avoirs: window.electronAPI.getAvoirsForClient(client.id, { dateDebut, dateFin })
  → compute opening balance from invoices before dateDebut
  → merge and sort all transactions chronologically
  → compute running balance
  → render statement table
  → "Imprimer" → window.print()
  → "Exporter Excel" → exportToExcel(rows, ...)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: FAC number format

*For any* invoice created with a valid `date_emission`, the assigned `numero_facture` must match the pattern `FAC-{YY}-{MM}-{NNN}` where YY is the two-digit year, MM is the two-digit month, and NNN is a zero-padded three-digit integer ≥ 001, all derived from `date_emission`.

**Validates: Requirements 1.1, 1.5**

### Property 2: Sequence strictly increments, no duplicates

*For any* N invoices created with the same year/month in `date_emission`, the NNN parts of their FAC numbers form a strictly increasing sequence with no repeated values.

**Validates: Requirements 1.2, 1.3 (edge-case: year reset is a special case of this property)**

### Property 3: Deleted sequence numbers are not reused

*For any* invoice that is created then deleted, a subsequently created invoice for the same year/month SHALL receive a NNN strictly greater than the deleted invoice's NNN.

**Validates: Requirements 1.6**

### Property 4: Payment status engine correctness

*For any* invoice not in ANNULE or BROUILLON status, and any set of payments and avoirs recorded against it:
- if `sum(paiements) + sum(avoirs) >= montant_total_du_client` → `statut_paiement = PAYE_TOTAL`
- if `0 < sum(paiements) + sum(avoirs) < montant_total_du_client` → `statut_paiement = PAYE_PARTIEL`
- if `sum(paiements) + sum(avoirs) = 0` → `statut_paiement = ENVOYE`

This property must hold after any payment insertion, payment deletion, avoir creation, or combination thereof.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.3**

### Property 5: Protected statuses are immutable

*For any* invoice with `statut_paiement = ANNULE` or `statut_paiement = BROUILLON`, recording or deleting any payment SHALL NOT change `statut_paiement`.

**Validates: Requirements 2.6**

### Property 6: isOverdue is a pure predicate

*For any* invoice, `isOverdue(facture)` returns `true` if and only if all three conditions hold simultaneously: `date_echeance < today`, `soldeRestant > 0`, and `statut_paiement` is neither `PAYE_TOTAL` nor `ANNULE`. Changing any one condition to false must cause `isOverdue` to return `false`.

**Validates: Requirements 3.1, 3.3, 3.5, 3.6**

### Property 7: EN_RETARD is never persisted

*For any* state of the database after any sequence of operations, no row in `factures_clients` shall have `statut_paiement = 'EN_RETARD'`.

**Validates: Requirements 3.2**

### Property 8: AV number format

*For any* avoir created with a valid `date_avoir`, the assigned `numero_avoir` must match the pattern `AV-{YYYY}-{NNN}` where YYYY is the four-digit year and NNN is a zero-padded three-digit integer ≥ 001.

**Validates: Requirements 4.1**

### Property 9: Avoir creation rejects over-credit

*For any* invoice with `solde_restant = S`, attempting to create an avoir with `montant_avoir > S` SHALL be rejected with an error, and neither the `avoirs` table nor `statut_paiement` shall be modified.

**Validates: Requirements 4.7**

### Property 10: Aging bucket assignment is exhaustive and correct

*For any* outstanding invoice (soldeRestant > 0, statut_paiement ≠ ANNULE), `getBucket(facture)` returns exactly one of `'0-30'`, `'31-60'`, `'61-90'`, `'90+'`, and the assignment is consistent with the days elapsed since `date_echeance` (or 0 days if no `date_echeance`).

**Validates: Requirements 5.2, 5.3**

### Property 11: Aging report bucket totals sum to grand total

*For any* set of outstanding invoices, the sum of `totalSolde` across all four buckets equals the sum of `soldeRestant` across all outstanding invoices.

**Validates: Requirements 5.9**

### Property 12: Aging report client filter completeness

*For any* client filter applied to the aging report, every row in the filtered result belongs to the selected client, and no invoice belonging to that client with a positive `soldeRestant` is omitted.

**Validates: Requirements 5.7**

### Property 13: Client statement closing balance invariant

*For any* client and any date range, the closing balance computed by `ClientStatement` satisfies:

`closing_balance = opening_balance + total_invoiced - total_paid - total_credited`

where `total_credited` is the sum of all avoir amounts within the period.

**Validates: Requirements 6.5, 6.9**

### Property 14: Client statement transaction completeness

*For any* client and date range, every invoice with `date_emission` within the range and every payment/avoir with `date_paiement`/`date_avoir` within the range for that client appears in the statement, and no transaction for a different client appears.

**Validates: Requirements 6.3, 6.4**

---

## Error Handling

### Backend

- `getNextInvoiceNumber` / `getNextAvoirNumber`: if the transaction fails, the error propagates to the IPC handler which returns `{ error: message }` to the renderer.
- `db-create-avoir`: validates `montant_avoir > 0` and `montant_avoir <= solde_restant` before inserting. Returns `{ error: 'Montant dépasse le solde restant de X devise' }` on violation.
- `updateFacturePaymentStatus`: silently skips if `facture_id` not found or status is protected. Errors in the status update roll back the enclosing transaction.
- All IPC handlers wrap their logic in try/catch and return `{ error: message }` on failure.

### Frontend

- `CreditNoteForm`: client-side validation prevents submission if `montant_avoir > soldeRestant`, showing an inline error message.
- `InvoiceAgingReport`: if `factures` prop is empty, renders an empty-state message.
- `ClientStatement`: if the date range yields no transactions, renders an empty-state message with the opening balance.
- All `electronAPI` calls check for `{ error }` in the response and display a user-facing alert.

---

## Testing Strategy

### Unit Tests

Focus on pure functions and specific examples:

- `isOverdue(facture)` — test all boundary conditions: exactly at deadline, one day past, PAYE_TOTAL, ANNULE, no date_echeance, zero solde.
- `getBucket(facture)` — test boundary values: 0 days, 30 days, 31 days, 60 days, 61 days, 90 days, 91 days, no date_echeance.
- `getStatusConfig(status, overdue)` — test that overdue=true returns EN_RETARD config regardless of stored status.
- `ClientStatement` running balance computation — test with a known sequence of transactions.
- `getNextInvoiceNumber` / `getNextAvoirNumber` — test format output for specific dates.

### Property-Based Tests

Use **fast-check** (TypeScript) for frontend properties and a lightweight property runner for backend Node.js logic.

Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: invoice-enhancements, Property {N}: {property_text}`

**Property 1 — FAC number format**
Generate random valid ISO date strings. For each, call `getNextInvoiceNumber(date, db)` and assert the result matches `/^FAC-\d{2}-\d{2}-\d{3}$/` and that YY/MM match the input date.

**Property 2 — Sequence strictly increments**
Generate a random N (1–20) and a random year/month. Create N invoices with that year/month. Extract NNN parts, assert they form `[1, 2, ..., N]` with no gaps or duplicates.

**Property 3 — Deleted numbers not reused**
Create an invoice, record its NNN, delete it, create another invoice for the same period, assert new NNN > deleted NNN.

**Property 4 — Payment status engine**
Generate a random `montant_total_du_client` and a random list of payment amounts. Insert them, then assert `statut_paiement` matches the expected status. Also test the delete path: insert payments, delete one, assert status is recomputed correctly.

**Property 5 — Protected statuses immutable**
Generate invoices with ANNULE or BROUILLON status. Attempt to insert a payment. Assert `statut_paiement` is unchanged.

**Property 6 — isOverdue pure predicate**
Generate random `FactureWithPayments` objects with arbitrary `date_echeance`, `soldeRestant`, and `statut_paiement`. Assert `isOverdue` returns the correct boolean for all combinations.

**Property 7 — EN_RETARD never persisted**
After any sequence of invoice/payment/avoir operations, query `SELECT COUNT(*) FROM factures_clients WHERE statut_paiement = 'EN_RETARD'` and assert it equals 0.

**Property 8 — AV number format**
Same as Property 1 but for `getNextAvoirNumber` and pattern `/^AV-\d{4}-\d{3}$/`.

**Property 9 — Avoir over-credit rejection**
Generate a random invoice with a known `solde_restant`. Generate a random `montant_avoir > solde_restant`. Assert `createAvoir` returns an error and the database is unchanged.

**Property 10 — Aging bucket assignment**
Generate random invoices with arbitrary `date_echeance` values. For each, assert `getBucket` returns the correct bucket based on days elapsed.

**Property 11 — Aging bucket totals**
Generate a random set of outstanding invoices. Compute buckets. Assert `sum(bucket.totalSolde) === sum(facture.soldeRestant)`.

**Property 12 — Aging client filter**
Generate a random set of invoices for multiple clients. Apply a random client filter. Assert all results belong to that client and no eligible invoice is missing.

**Property 13 — Closing balance invariant**
Generate a random client statement (opening balance, list of invoices, payments, avoirs). Assert `closing = opening + invoiced - paid - credited`.

**Property 14 — Statement transaction completeness**
Generate a random client, date range, and transaction set. Assert every in-range transaction for the client appears exactly once in the statement, and no out-of-range or other-client transaction appears.
