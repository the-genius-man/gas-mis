# Database & Code Cleanup Report
Generated: 2026-01-31T08:36:18.481Z

## File Duplication Analysis

### Duplicate Files Found
- **electron/main.js** (171KB) vs **public/electron.cjs** (312KB)

### Content Issues
- **DUPLICATE_SCHEMAS**: 17 duplicates found (examples: employees, clients_gas, sites_gas, factures_clients, factures_details)
- **DUPLICATE_ENDPOINTS**: 92 duplicates found (examples: db-get-roteurs, db-get-roteur-assignments, db-create-roteur-assignment, db-update-roteur-assignment, db-get-site-coverage-gaps)

## File References Check
### package.json
- References public/electron.cjs: true
- References public/preload.cjs: true
- References electron/main.js: false

### index.html
- References public/electron.cjs: false
- References public/preload.cjs: false
- References electron/main.js: false

### vite.config.ts
- References public/electron.cjs: false
- References public/preload.cjs: false
- References electron/main.js: true

### electron/main.js
- References public/electron.cjs: false
- References public/preload.cjs: false
- References electron/main.js: false

## Backup Files Created
- **public/electron.cjs** → `electron_backup_1769848578363.cjs`
- **public/preload.cjs** → `preload_backup_1769848578378.cjs`

## Cleanup Actions Performed
- ⚠️  Kept public/electron.cjs (still referenced)
- ⚠️  Kept public/preload.cjs (still referenced)

## Database Issues Identified

### Duplicate Tables (Manual Review Needed)
Based on code analysis, these tables appear to be duplicated:
- `employees` vs `employees_gas` (legacy vs new)
- `clients` vs `clients_gas` (legacy vs new)  
- `sites` vs `sites_gas` (legacy vs new)

### Recommended Database Cleanup
```sql
-- After confirming employees_gas has all data
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS sites;

-- Remove unused tables (if empty)
DROP TABLE IF EXISTS certifications;
DROP TABLE IF EXISTS site_assignments;
DROP TABLE IF EXISTS attendance_records;

-- Optimize database
VACUUM;
ANALYZE;
```

## Next Steps

### Immediate
- [x] Remove duplicate code files
- [x] Create backups of removed files
- [ ] Test application functionality

### Database Cleanup (Manual)
- [ ] Rebuild better-sqlite3: `npm rebuild better-sqlite3`
- [ ] Run database analysis: `node scripts/check-table-structure.sql`
- [ ] Remove duplicate/unused tables
- [ ] Optimize database with VACUUM

### Code Cleanup
- [ ] Remove unused imports in remaining files
- [ ] Consolidate error handling patterns
- [ ] Update documentation

## Testing Checklist
After cleanup, verify:
- [ ] Electron app starts correctly
- [ ] Database operations work
- [ ] All modules load properly
- [ ] File uploads/downloads work
- [ ] PDF generation works
- [ ] Excel import/export works

## Rollback Instructions
If issues occur, restore from backups:
```bash
# Restore files from backups (check timestamps)
cp *_backup_*.cjs public/
```
