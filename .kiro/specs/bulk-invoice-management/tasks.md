# Implementation Plan: Bulk Invoice Management

## Overview

This plan implements the bulk invoice management feature as a wizard-style modal component integrated into the existing InvoicesManagement screen. The implementation follows a step-by-step approach, building the wizard steps first, then adding bulk operations, and finally the print functionality.

## Tasks

- [x] 1. Create BulkInvoiceWizard component structure
  - [x] 1.1 Create BulkInvoiceWizard.tsx with wizard state management and step navigation
    - Create modal with header showing current step
    - Implement step state (1-4) with next/back navigation
    - Add period selector (month/year dropdowns) for Step 1
    - _Requirements: 1.1_

  - [x] 1.2 Implement client preview calculation logic
    - Create `calculateClientPreview()` function that filters active clients with active sites
    - Calculate totalGuards (sum of effectif_jour + effectif_nuit) per client
    - Calculate totalAmount (sum of tarif_mensuel_client) per client
    - Check for existing invoices in selected period
    - _Requirements: 1.2, 1.3, 1.4, 1.7_

  - [x] 1.3 Write property test for client preview calculations
    - **Property 2: Client Totals Calculation**
    - **Validates: Requirements 1.3, 1.4**

- [x] 2. Implement Step 2: Client Selection Preview
  - [x] 2.1 Create client preview list UI
    - Display table with: client name, sites count, total guards, total amount
    - Add checkbox for each client (disabled if already invoiced)
    - Show "Déjà facturé" badge for already invoiced clients
    - Add Select All / Deselect All buttons
    - Display batch summary (selected count, total amount)
    - _Requirements: 1.2, 1.4, 1.5, 1.7_

  - [x] 2.2 Write property test for active client filtering
    - **Property 1: Active Client Filtering**
    - **Validates: Requirements 1.2**

  - [x] 2.3 Write property test for duplicate invoice detection
    - **Property 3: Duplicate Invoice Detection**
    - **Validates: Requirements 1.7**

- [x] 3. Implement Step 3: Bulk Invoice Generation
  - [x] 3.1 Create bulk invoice generation function
    - Generate unique invoice numbers for each client
    - Create invoice with all active sites as details
    - Set status to BROUILLON
    - Calculate all totals (HT, TTC, total dû)
    - Handle errors per client without stopping batch
    - _Requirements: 1.6_

  - [x] 3.2 Add generation progress UI
    - Show progress indicator during generation
    - Display success/error count after completion
    - Auto-advance to Step 4 on success
    - _Requirements: 1.6_

  - [x] 3.3 Write property test for invoice generation completeness
    - **Property 4: Invoice Generation Completeness**
    - **Validates: Requirements 1.6**

- [x] 4. Implement Step 4: Review and Actions
  - [x] 4.1 Create invoice review table
    - Display generated invoices with: number, client, amount, sites, status
    - Add checkbox for each invoice
    - Highlight zero-amount invoices with warning style
    - Show batch totals (count, total amount, total guards)
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 4.2 Add invoice row click to open detail modal
    - Open existing InvoiceDetailModal on row click
    - Refresh list after modal closes
    - _Requirements: 2.3_

  - [x] 4.3 Write property test for batch totals accuracy
    - **Property 5: Batch Totals Accuracy**
    - **Validates: Requirements 2.4**

  - [x] 4.4 Write property test for zero amount warning
    - **Property 6: Zero Amount Warning**
    - **Validates: Requirements 2.5**

- [x] 5. Implement Bulk Issuance
  - [x] 5.1 Add bulk issuance functionality
    - Add "Émettre les sélectionnées" button
    - Show confirmation dialog with count and total
    - Warn if any selected invoice has zero amount
    - Update all selected invoices to ENVOYE status
    - Show success message with count
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.2 Write property test for bulk issuance status change
    - **Property 7: Bulk Issuance Status Change**
    - **Validates: Requirements 3.2**

- [x] 6. Implement Invoice Print Template
  - [x] 6.1 Create InvoicePrintTemplate component
    - Create A4-formatted invoice template
    - Include company header with "Go Ahead Security" and logo placeholder
    - Display client info: name, address, contact
    - Show invoice details: number, dates, period
    - List sites with guards and amounts
    - Display financial summary: subtotal, charges, previous balance, total
    - Add payment instructions section
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 6.2 Add print styles and page breaks
    - Add @media print CSS rules
    - Insert page-break-after between invoices
    - Hide non-printable elements
    - _Requirements: 4.4_

  - [x] 6.3 Write property test for print document completeness
    - **Property 8: Print Document Completeness**
    - **Validates: Requirements 4.3, 5.2, 5.3, 5.4, 5.5**

- [x] 7. Implement Bulk Print Functionality
  - [x] 7.1 Add print selected invoices feature
    - Add "Imprimer les sélectionnées" button
    - Render InvoicePrintTemplate with selected invoices
    - Trigger browser print dialog
    - _Requirements: 4.1, 4.2_

  - [x] 7.2 Write property test for print page breaks
    - **Property 9: Print Page Breaks**
    - **Validates: Requirements 4.4**

- [x] 8. Integration with InvoicesManagement
  - [x] 8.1 Add bulk invoice button to InvoicesManagement
    - Add "Facturation Mensuelle" button in header
    - Open BulkInvoiceWizard modal on click
    - Refresh invoice list after wizard closes
    - _Requirements: 1.1_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
