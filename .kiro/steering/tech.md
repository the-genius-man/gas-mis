# Tech Stack

## Frontend
- **React 18.3** with **TypeScript 5.5** (strict mode)
- **React Router DOM 7.12** for client-side routing
- **Tailwind CSS 3.4** for styling (utility-first, no CSS modules)
- **Lucide React 0.344** for icons

## Desktop
- **Electron 39** for cross-platform desktop packaging
- **better-sqlite3 12.5** for local SQLite database
- **Electron Builder 26** for packaging installers (Windows NSIS, macOS DMG, Linux AppImage)
- IPC bridge via `public/preload.cjs` with context isolation enabled

## Web Backend
- **Supabase 2.89** (PostgreSQL + Auth + REST API)
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars

## Build & Dev Tools
- **Vite 5.4** as build tool and dev server
- `vite-plugin-electron` + `vite-plugin-electron-renderer` for Electron integration
- **ESLint 9.9** with TypeScript and React Hooks plugins
- **Vitest 4** for unit/property-based testing
- **fast-check 4.5** for property-based testing

## Export & Reporting
- **jsPDF 4** + **jsPDF AutoTable 5** — PDF generation
- **html2canvas 1.4** — HTML-to-image for PDF rendering
- **XLSX 0.18** — Excel import/export
- **qrcode.react 4** + **html5-qrcode 2.3** — QR code generation and scanning

## Common Commands

```bash
# Development
npm run dev                  # Web dev server → http://localhost:5173
npm run electron-dev         # Web + Electron together (hot-reload)
npm run dev:electron         # Electron-only dev mode

# Building
npm run build                # Production web build → dist/
npm run build:electron       # Build + package Electron app → dist-electron/
npm run build:electron:dir   # Build Electron without packaging

# Testing & Quality
npm run test                 # Run tests once
npm run test:watch           # Run tests in watch mode
npm run lint                 # Run ESLint

# Preview
npm run preview              # Preview production web build
```

## Environment Variables
```
VITE_SUPABASE_URL=...        # Required for web mode
VITE_SUPABASE_ANON_KEY=...   # Required for web mode
ELECTRON=true                # Set automatically by electron scripts
```
