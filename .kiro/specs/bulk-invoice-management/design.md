# Design Document: Bulk Invoice Management

## Overview

This feature adds bulk invoice management capabilities to the GAS-MIS Finance module. It enables finance managers to efficiently generate, review, issue, and print monthly invoices for all active clients in a single workflow. The implementation follows a wizard-style interface with four main steps: Period Selection → Client Preview → Invoice Generation → Review & Actions.

## Architecture

The bulk invoice feature integrates with the existing Finance module and uses the same database tables (`factures_clients`, `factures_details`, `clients_gas`, `sites_gas`). The feature is implemented as a modal wizard component that orchestrates the bulk operations.

```
┌─────────────────────────────────────────────────────────────────┐
│                    InvoicesManagement                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              BulkInvoiceWizard (Modal)                   │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │ Step 1  │→ │ Step 2  │→ │ Step 3  │→ │ Step 4  │    │    │
│  │  │ Period  │  │ Preview │  │ Generate│  │ Review  │    │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              InvoicePrintTemplate                        │    │
│  │  (Hidden component for print rendering)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### BulkInvoiceWizard Component

Main wizard component managing the bulk invoice workflow.

```typescript
interface BulkInvoiceWizardProps {
  clients: ClientGAS[];
  sites: SiteGAS[];
  existingInvoices: FactureGAS[];
  onClose: () => void;
  onSuccess: () => void;
}

interface WizardState {
  step: 1 | 2 | 3 | 4;
  periode_mois: number;
  periode_annee: number;
  selectedClientIds: Set<string>;
  generatedInvoices: FactureGAS[];
  selectedInvoiceIds: Set<string>;
  isGenerating: boolean;
  isIssuing: boolean;
}
```

### ClientPreviewItem Interface

Represents a client with calculated totals for preview.

```typescript
interface ClientPreviewItem {
  client: ClientGAS;
  sites: SiteGAS[];
  totalGuards: number;        // Sum of effectif_jour + effectif_nuit
  totalAmount: number;        // Sum of tarif_mensuel_client
  isAlreadyInvoiced: boolean; // Has invoice for selected period
  existingInvoiceId?: string;
}
```

### InvoicePrintTemplate Component

Printable invoice template component.

```typescript
interface InvoicePrintTemplateProps {
  invoices: FactureGAS[];
  clients: ClientGAS[];
  sites: SiteGAS[];
}
```

## Data Models

### Bulk Generation Request

```typescript
interface BulkGenerationRequest {
  clientIds: string[];
  periode_mois: number;
  periode_annee: number;
  date_emission: string;
}
```

### Bulk Generation Result

```typescript
interface BulkGenerationResult {
  success: boolean;
  generatedCount: number;
  invoices: FactureGAS[];
  errors: { clientId: string; error: string }[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Active Client Filtering
*For any* set of clients and sites in the database, the preview list SHALL only include clients that have at least one active site (`est_actif = true`).
**Validates: Requirements 1.2**

### Property 2: Client Totals Calculation
*For any* client in the preview, the displayed `totalGuards` SHALL equal the sum of (`effectif_jour_requis` + `effectif_nuit_requis`) across all active sites, and `totalAmount` SHALL equal the sum of `tarif_mensuel_client` across all active sites.
**Validates: Requirements 1.3, 1.4**

### Property 3: Duplicate Invoice Detection
*For any* client that has an existing invoice for the selected billing period (matching `periode_mois` and `periode_annee`), the client SHALL be marked as `isAlreadyInvoiced = true` and excluded from bulk generation.
**Validates: Requirements 1.7**

### Property 4: Invoice Generation Completeness
*For any* set of selected clients, after bulk generation completes, each selected client (not already invoiced) SHALL have exactly one new invoice with status `BROUILLON` for the specified period.
**Validates: Requirements 1.6**

### Property 5: Batch Totals Accuracy
*For any* batch of generated invoices, the displayed batch totals SHALL equal: `totalInvoices` = count of invoices, `totalAmount` = sum of all `montant_total_du_client`, `totalGuards` = sum of all `total_gardiens_factures`.
**Validates: Requirements 2.4**

### Property 6: Zero Amount Warning
*For any* invoice in the review list with `montant_total_du_client = 0`, the invoice row SHALL be visually highlighted as a warning.
**Validates: Requirements 2.5**

### Property 7: Bulk Issuance Status Change
*For any* set of selected draft invoices, after bulk issuance, all selected invoices SHALL have `statut_paiement = 'ENVOYE'`.
**Validates: Requirements 3.2**

### Property 8: Print Document Completeness
*For any* invoice in the print output, the rendered document SHALL contain: company header, invoice number, client name, client address, emission date, due date, billing period, site breakdown with guards and amounts, subtotal, total due, and payment section.
**Validates: Requirements 4.3, 5.2, 5.3, 5.4, 5.5**

### Property 9: Print Page Breaks
*For any* print output containing multiple invoices, there SHALL be a page break element between each invoice.
**Validates: Requirements 4.4**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| No active clients | Display message "Aucun client actif trouvé" |
| All clients already invoiced | Display message with count, disable generation |
| Generation fails for some clients | Continue with others, show error summary |
| Database error during bulk operation | Rollback transaction, show error message |
| Print fails | Show browser print dialog error |

## Testing Strategy

### Unit Tests
- Test `calculateClientTotals()` function with various site configurations
- Test `checkExistingInvoices()` function for duplicate detection
- Test invoice number generation uniqueness

### Property-Based Tests
- Property 1: Generate random clients/sites, verify only active ones shown
- Property 2: Generate random site data, verify totals calculation
- Property 4: Generate invoices for random client selection, verify completeness
- Property 5: Generate random invoice batches, verify batch totals
- Property 7: Select random draft invoices, verify status change

### Integration Tests
- Full wizard flow from period selection to invoice generation
- Bulk issuance with mixed invoice states
- Print preview generation with multiple invoices

### Testing Framework
- Use Vitest for unit and property-based tests
- Use fast-check library for property-based testing
- Minimum 100 iterations per property test
