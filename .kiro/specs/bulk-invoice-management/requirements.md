# Requirements Document

## Introduction

This feature enables bulk invoice creation, issuance, and printing for the Go Ahead Security Management Information System (GAS-MIS). Since invoices are typically issued monthly for all active clients, this feature streamlines the process by allowing users to generate invoices for multiple clients at once, review them, issue them in bulk, and print them for distribution.

## Glossary

- **Bulk_Invoice_Generator**: The system component responsible for creating multiple invoices simultaneously based on active client sites
- **Invoice_Batch**: A collection of invoices generated together for a specific billing period
- **Billing_Period**: The month and year for which invoices are being generated
- **Active_Site**: A site with `est_actif = true` that should be included in billing
- **Invoice_Preview**: A summary view of invoices before they are created or issued

## Requirements

### Requirement 1: Bulk Invoice Generation

**User Story:** As a finance manager, I want to generate invoices for all active clients at once, so that I can efficiently create monthly billing documents.

#### Acceptance Criteria

1. WHEN a user opens the bulk invoice wizard, THE Bulk_Invoice_Generator SHALL display a period selector for month and year
2. WHEN a user selects a billing period, THE Bulk_Invoice_Generator SHALL show all active clients with their active sites
3. THE Bulk_Invoice_Generator SHALL pre-calculate invoice amounts based on each site's `tarif_mensuel_client`
4. WHEN displaying client preview, THE Bulk_Invoice_Generator SHALL show total guards (effectif_jour + effectif_nuit) and total amount per client
5. THE Bulk_Invoice_Generator SHALL allow users to select/deselect individual clients from the batch
6. WHEN a user clicks "Generate Invoices", THE Bulk_Invoice_Generator SHALL create draft invoices for all selected clients
7. IF an invoice already exists for a client in the selected period, THEN THE Bulk_Invoice_Generator SHALL mark that client as "already invoiced" and exclude from generation

### Requirement 2: Bulk Invoice Review

**User Story:** As a finance manager, I want to review all generated invoices before issuing them, so that I can verify amounts and make corrections if needed.

#### Acceptance Criteria

1. WHEN invoices are generated, THE System SHALL display a summary table of all created invoices
2. THE System SHALL show for each invoice: client name, invoice number, total amount, number of sites, and status
3. WHEN a user clicks on an invoice row, THE System SHALL open the invoice detail for editing
4. THE System SHALL calculate and display batch totals: total invoices, total amount, total guards
5. WHEN reviewing invoices, THE System SHALL highlight any invoices with zero amount as warnings

### Requirement 3: Bulk Invoice Issuance

**User Story:** As a finance manager, I want to issue multiple invoices at once, so that I can efficiently finalize monthly billing.

#### Acceptance Criteria

1. THE System SHALL provide a "Select All" checkbox to select all draft invoices for issuance
2. WHEN a user selects invoices and clicks "Issue Selected", THE System SHALL change status from BROUILLON to ENVOYE for all selected invoices
3. THE System SHALL display a confirmation dialog showing the count and total amount before bulk issuance
4. IF any selected invoice has zero amount, THEN THE System SHALL warn the user and require confirmation
5. WHEN bulk issuance completes, THE System SHALL display a success message with the count of issued invoices

### Requirement 4: Bulk Invoice Printing

**User Story:** As a finance manager, I want to print multiple invoices at once, so that I can distribute physical copies to clients.

#### Acceptance Criteria

1. THE System SHALL provide a "Print Selected" button for selected invoices
2. WHEN a user clicks "Print Selected", THE System SHALL generate a printable document containing all selected invoices
3. THE Printable_Document SHALL include for each invoice: company header, invoice number, client details, site breakdown, amounts, and payment terms
4. THE System SHALL insert page breaks between invoices for proper printing
5. WHEN printing, THE System SHALL use a clean, professional invoice template suitable for business use

### Requirement 5: Invoice Template Design

**User Story:** As a business owner, I want invoices to have a professional appearance, so that they reflect well on the company.

#### Acceptance Criteria

1. THE Invoice_Template SHALL include the company name "Go Ahead Security" and logo placeholder
2. THE Invoice_Template SHALL display client information: company name, address, contact details
3. THE Invoice_Template SHALL show invoice details: number, emission date, due date, billing period
4. THE Invoice_Template SHALL list each site with: site name, number of guards, monthly rate
5. THE Invoice_Template SHALL display subtotal, additional charges (if any), previous balance, and total due
6. THE Invoice_Template SHALL include payment instructions and bank details section
7. THE Invoice_Template SHALL be formatted for A4 paper size
