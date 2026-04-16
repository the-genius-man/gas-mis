# Project Structure

## Root Layout

```
gas-mis/
├── src/                    # React application source
├── electron/               # Electron main/preload scripts (dev)
├── public/                 # Static assets + Electron main process (prod)
│   ├── electron.cjs        # Electron main process
│   └── preload.cjs         # IPC bridge (exposes window.electronAPI)
├── supabase/               # Supabase migrations and config
├── tests/                  # Test files (Vitest + fast-check)
├── scripts/                # Utility/maintenance scripts
├── dist/                   # Web production build output
├── dist-electron/          # Electron packaged output
├── database.sqlite         # Local SQLite database (desktop mode)
├── vite.config.ts          # Vite config (handles both web and Electron)
├── tailwind.config.js      # Tailwind config
├── vitest.config.ts        # Vitest config
└── package.json
```

## `src/` Structure

```
src/
├── App.tsx                 # Root component — module routing, mode detection
├── main.tsx                # React entry point
├── index.css               # Global styles
│
├── components/             # Feature components, one folder per module
│   ├── common/             # Shared UI: BulkActions, Pagination, PermissionGuard, FileUpload
│   ├── Layout/             # Header, Sidebar (navigation filtered by RBAC role)
│   ├── Auth/               # Login screen
│   ├── Dashboard/          # Dashboard views and KPI widgets
│   ├── Finance/            # Invoicing, payments, OHADA accounting (largest module)
│   ├── HR/                 # Employee records, leave, certifications, disciplinary
│   ├── Payroll/            # Payslips, advances, deductions, arrears
│   ├── Operations/         # Clients, sites, guard assignments, roteur scheduling
│   ├── Logistics/          # Fleet and vehicle management
│   ├── Inventory/          # Equipment with QR code tracking
│   ├── Reports/            # Cross-module reporting
│   ├── Settings/           # User management, app settings
│   ├── Disciplinary/       # Disciplinary action forms and history
│   └── Alerts/             # System alerts (expiring certs, insurance, etc.)
│
├── contexts/
│   ├── AppContext.tsx       # Global state (employees, clients, sites) via useReducer
│   └── AuthContext.tsx      # Auth state and current user
│
├── hooks/
│   └── usePagination.ts    # Shared pagination hook
│
├── services/
│   └── database.ts         # TypeScript interface for window.electronAPI (desktop IPC)
│
├── lib/
│   └── supabase.ts         # Supabase client initialization
│
├── types/
│   └── index.ts            # All TypeScript types and interfaces (single source of truth)
│
└── utils/
    ├── permissions.ts      # RBAC: ROLE_PERMISSIONS map, hasPermission(), canAccessModule()
    ├── pdfExport.ts        # PDF generation helpers (jsPDF)
    ├── pdfCompanyHeader.ts # Reusable company header for PDF documents
    ├── excelExport.ts      # Excel export helpers (XLSX)
    ├── exportFilename.ts   # Consistent export filename generation
    └── sampleData.ts       # Seed/sample data for development
```

## Key Conventions

- **One component per file**, named in PascalCase matching the filename
- **All types** live in `src/types/index.ts` — do not scatter type definitions
- **Database field names** use French snake_case (`nom_entreprise`, `date_embauche`)
- **Component props** interfaces are defined directly above the component
- **Event handlers** are prefixed with `handle` (e.g., `handleSubmit`, `handleDelete`)
- **Constants** use UPPER_SNAKE_CASE (e.g., `ROLE_PERMISSIONS`)
- **Async operations** always wrapped in try/catch with explicit loading/error state
- **Debug logs** use emoji prefixes for easy filtering (e.g., `🔍 [MODULE] message`)

## Adding a New Module

1. Create `src/components/YourModule/` with component files
2. Add types to `src/types/index.ts`
3. Add permissions to `src/utils/permissions.ts` under each relevant role
4. Register the module in `src/App.tsx` (import + `activeModule` switch)
5. Add a sidebar entry in `src/components/Layout/Sidebar.tsx` (respects RBAC)
6. If desktop mode needs DB access, add IPC handlers in `public/electron.cjs` and expose them in `public/preload.cjs`

## Root-Level Markdown Files

The root contains many `*.md` files documenting past fixes and implementation notes (e.g., `ARRIERES_FIX_SUMMARY.md`, `OHADA_COMPLIANCE_COMPLETE.md`). These are historical reference docs — not active specs. Active specs live in `.kiro/specs/`.
