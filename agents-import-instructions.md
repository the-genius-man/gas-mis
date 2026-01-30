# Agents/Guards Import Instructions

## Summary
✅ **Agents Excel data successfully processed!**
- **139 employees** will be created from `agents_guards.xlsx`
- **136 active employees** (guards, supervisors, admin)
- **3 inactive employees**
- **SQL file generated**: `import-agents.sql`

## Employee Categories Detected
- **GARDE**: Regular security guards (majority)
- **SUPERVISEUR**: Supervisors (if fonction contains "superviseur")
- **ADMINISTRATION**: Admin staff (if fonction contains "admin" or "bureau")
- **ROTEUR**: Rotating guards (if fonction contains "roteur" or "roulant")

## Data Mapping from Excel
- **empID** → Used for fallback matricule if needed
- **nom, postnom, prenom** → Combined into `nom_complet`
- **sexe** → `genre` (M/F)
- **maritalStatus** → `etat_civil` (CELIBATAIRE, MARIE, DIVORCE, VEUF)
- **fonction** → Determines `categorie` and `poste`
- **matricule** → Employee ID/badge number
- **dateAffectation** → `date_embauche` (converted from Excel date)
- **statusGuard** → `statut` (ACTIF/INACTIF)
- **Telephone** → Contact phone number

## Import Options

### Option 1: Using SQLite Command Line (Recommended)
```bash
sqlite3 database.sqlite ".read import-agents.sql"
```

### Option 2: Using DB Browser for SQLite (GUI)
1. Open DB Browser for SQLite
2. Open `database.sqlite`
3. Go to Execute SQL tab
4. Copy and paste contents of `import-agents.sql`
5. Click Execute

### Option 3: Manual Execution
Execute the SQL statements in smaller batches if needed.

## Verification Queries

After import, verify the data:

```sql
-- Check total employees
SELECT COUNT(*) as total_employees FROM employees_gas;

-- Check by status
SELECT statut, COUNT(*) as count FROM employees_gas GROUP BY statut;

-- Check by category
SELECT categorie, COUNT(*) as count FROM employees_gas GROUP BY categorie;

-- Check by position
SELECT poste, COUNT(*) as count FROM employees_gas GROUP BY poste;

-- View first few employees
SELECT matricule, nom_complet, poste, statut FROM employees_gas LIMIT 10;
```

Expected results:
- **Total employees**: 139
- **Active**: 136, **Inactive**: 3
- **Categories**: Mostly GARDE, some SUPERVISEUR/ADMINISTRATION

## Sample Employee Data

The import includes employees like:
- **KABONGO RUBESHUZA DANIEL** (S07G22DAR) - Active Guard
- **PATRICK MISHONA ANDERSON** (S05G21PAM) - Active Guard
- **AMANI MIRINDI CHRISTIAN** (S01G23CHM) - Active Guard
- And 136 more employees...

## Integration with Existing System

After importing employees, you can:
1. **Assign guards to sites** through the deployment system
2. **Set up roteur schedules** for rotating guards
3. **Configure payroll** with salary information
4. **Manage leave requests** and provisions
5. **Track disciplinary actions** if needed

## Next Steps

1. **Execute the SQL import** using one of the methods above
2. **Restart the Electron app** to see the imported employees
3. **Navigate to HR → Employees Management** to view the imported staff
4. **Begin assigning guards to client sites** through the deployment system
5. **Set up payroll information** for salary management

## Files Generated

- ✅ `import-agents.sql` - Complete employee SQL statements
- ✅ `generate-agents-import-sql.cjs` - Script to regenerate if needed
- ✅ This instruction file

## Troubleshooting

If you encounter issues:
1. **Check database permissions** - ensure `database.sqlite` is writable
2. **Verify SQL syntax** - the generated SQL uses standard SQLite syntax
3. **Check for duplicates** - the SQL uses `INSERT OR IGNORE` to prevent duplicates
4. **Restart Electron app** after import to refresh the data

---

**Status**: ✅ Ready for import - Agents SQL file generated successfully!
**Data Quality**: ✅ 139 employees processed with proper categorization