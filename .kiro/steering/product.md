# GAS-MIS — Go Ahead Security Management Information System

A full ERP system for a private security company operating in French-speaking Africa (primarily DRC). The app manages the full business lifecycle: employees, client contracts, site deployments, invoicing, payroll, operations, and inventory.

## Dual-Mode Architecture

The app runs in two distinct modes:

- **Web mode** — Browser app backed by Supabase (PostgreSQL + Auth). Used for finance and client-facing operations.
- **Desktop mode** — Electron app with a local SQLite database. Fully offline. Used for HR, operations, and field management.

Mode is detected at runtime via `isElectron()` / `window.electronAPI`. Shared UI components work in both modes.

## Core Modules

| Module    |  Description                                                      |
|-----------| ------------------------------------------------------------------|
| Finance   | Invoicing, payments, OHADA-compliant accounting                   |
| HR        | Employee records, certifications, leave, disciplinary actions     |
| Payroll   | Payslips, advances, deductions, arrears                           |
| Operations| Client/site management, guard assignments, roteur scheduling      |
| Logistics | Fleet and vehicle management                                      |
| Inventory | Equipment tracking with QR codes                                  |
| Reports   | Cross-module reporting and exports                                |
| Settings  | User management, RBAC roles                                       |

## Key Business Rules

- Accounting follows **OHADA** standards (Central/West Africa)
- Multi-currency: USD, CDF
- Four user roles: `ADMIN`, `FINANCE_MANAGER`, `OPERATIONS_MANAGER`, `ASSISTANT_OPERATIONS_MANAGER`
- All UI text, field names, and documentation are in **French**
- Database field names use French snake_case (e.g., `nom_entreprise`, `date_embauche`)
