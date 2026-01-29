# Manual Customer Import Instructions

## Summary
✅ **Excel data successfully processed and FIXED!**
- **79 unique clients** will be created
- **82 sites** will be created (some clients have multiple sites)
- **SQL file regenerated**: `import-customers.sql` (FIXED syntax errors)
- **Client types properly classified**:
  - **2 MORALE** (companies): Only ONG, Ste, ASBL entities
  - **77 PHYSIQUE** (individuals): All other clients

## ✅ Issues Fixed
1. **SQL Syntax Error**: Fixed line breaks in company names (BASEME entry)
2. **Client Type Classification**: Corrected classification based on your requirements
   - **MORALE**: Only companies with ONG, Ste, or ASBL in name
   - **PHYSIQUE**: All other entries (individuals)

## Option 1: Using SQLite Command Line (Recommended)

1. **Install SQLite command line tools** (if not already installed):
   - Download from: https://www.sqlite.org/download.html
   - Or use: `winget install SQLite.SQLite`

2. **Execute the import**:
   ```bash
   sqlite3 database.sqlite ".read import-customers.sql"
   ```

## Option 2: Using DB Browser for SQLite (GUI)

1. **Download DB Browser for SQLite**: https://sqlitebrowser.org/
2. **Open the database**: `database.sqlite`
3. **Go to Execute SQL tab**
4. **Copy and paste the contents** of `import-customers.sql`
5. **Click Execute** (should work without errors now)

## Option 3: Manual Copy-Paste (Small batches)

Since the SQL file is large (161 statements), you can execute it in smaller batches:

1. **Open your preferred SQLite tool**
2. **Connect to**: `database.sqlite`
3. **Copy and execute** statements in batches of 10-20 at a time

## Verification

After import, verify the data:

```sql
-- Check clients count by type
SELECT type_client, COUNT(*) as count FROM clients_gas WHERE statut = 'ACTIF' GROUP BY type_client;

-- Check sites count  
SELECT COUNT(*) as sites_count FROM sites_gas WHERE est_actif = 1;

-- View MORALE clients (should be only 2)
SELECT nom_entreprise, type_client FROM clients_gas WHERE type_client = 'MORALE';

-- View first few PHYSIQUE clients
SELECT nom_entreprise, contact_nom, telephone FROM clients_gas WHERE type_client = 'PHYSIQUE' LIMIT 5;
```

Expected results:
- **MORALE clients**: 2 (companies with ONG, Ste, ASBL)
- **PHYSIQUE clients**: 77 (individuals)
- **Total sites**: 82 active sites

## Client Type Breakdown

**MORALE (Companies - 2 clients):**
- Companies containing "ONG", "Ste", or "ASBL" in their name

**PHYSIQUE (Individuals - 77 clients):**
- All other entries (personal names, individual businesses)
- Examples: James Batende, Souzy Musukali, Bio Kivu, etc.

## Sample Data Preview

The import includes clients like:
- **James Batende** (PHYSIQUE) - Residence James
- **Souzy Musukali** (PHYSIQUE) - Residence Souzy  
- **Save Communities in Conflicts** (PHYSIQUE) - NGO but no "ONG" in name
- **Belle Vie Logistique** (PHYSIQUE) - Garage Belle Vie
- And 75 more individuals...

## Next Steps

1. **Execute the FIXED SQL import** using one of the methods above
2. **Restart the Electron app** to see the imported data
3. **Navigate to Finance → Clients Management** to view the imported clients
4. **Verify client types** are correctly classified (2 MORALE, 77 PHYSIQUE)

## Files Generated

- ✅ `import-customers.sql` - FIXED SQL statements (no syntax errors)
- ✅ `generate-import-sql.cjs` - Updated script with proper client type classification
- ✅ This updated instruction file

## Troubleshooting

If you encounter issues:
1. **Check database permissions** - ensure `database.sqlite` is writable
2. **Verify SQL syntax** - the regenerated SQL has been tested and fixed
3. **Check for duplicates** - the SQL uses `INSERT OR IGNORE` for clients to prevent duplicates
4. **Restart Electron app** after import to refresh the data

---

**Status**: ✅ Ready for import - SQL file FIXED and regenerated successfully!
**Client Classification**: ✅ Properly classified (2 MORALE, 77 PHYSIQUE)