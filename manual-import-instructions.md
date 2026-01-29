# Manual Customer Import Instructions

## Summary
✅ **Excel data successfully processed!**
- **79 unique clients** will be created
- **82 sites** will be created (some clients have multiple sites)
- **SQL file generated**: `import-customers.sql`

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
5. **Click Execute**

## Option 3: Manual Copy-Paste (Small batches)

Since the SQL file is large (161 statements), you can execute it in smaller batches:

1. **Open your preferred SQLite tool**
2. **Connect to**: `database.sqlite`
3. **Copy and execute** statements in batches of 10-20 at a time

## Verification

After import, verify the data:

```sql
-- Check clients count
SELECT COUNT(*) as clients_count FROM clients_gas WHERE statut = 'ACTIF';

-- Check sites count  
SELECT COUNT(*) as sites_count FROM sites_gas WHERE est_actif = 1;

-- View first few clients
SELECT nom_entreprise, contact_nom, telephone FROM clients_gas LIMIT 5;
```

Expected results:
- **Clients**: 79 active clients
- **Sites**: 82 active sites

## Sample Data Preview

The import includes clients like:
- James Batende (Residence James)
- Souzy Musukali (Residence Souzy)  
- Bio Kivu (Bio Kivu)
- Save Communities in Conflicts
- Belle Vie Logistique
- And 74 more...

## Next Steps

1. **Execute the SQL import** using one of the methods above
2. **Restart the Electron app** to see the imported data
3. **Navigate to Finance → Clients Management** to view the imported clients
4. **Test the Excel import button** - it should now show "Fonctionnalité d'importation non disponible" because the data is already imported

## Files Generated

- ✅ `import-customers.sql` - Complete SQL statements (61KB)
- ✅ `generate-import-sql.cjs` - Script to regenerate SQL if needed
- ✅ This instruction file

## Troubleshooting

If you encounter issues:
1. **Check database permissions** - ensure `database.sqlite` is writable
2. **Verify SQL syntax** - the generated SQL uses standard SQLite syntax
3. **Check for duplicates** - the SQL uses `INSERT OR IGNORE` for clients to prevent duplicates
4. **Restart Electron app** after import to refresh the data

---

**Status**: ✅ Ready for import - SQL file generated successfully!