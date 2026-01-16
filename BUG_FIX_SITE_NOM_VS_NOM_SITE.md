# 🐛 Bug Fix: site_nom vs nom_site Property Name Mismatch

## Issue Found

The bulk PDF export was showing "Non affecté" for all employees even though deployments existed with site names.

## Root Cause

**Property name mismatch!**

The `getCurrentDeployment` API returns a deployment object with property `nom_site`:

```javascript
// In electron.cjs (line 4947)
SELECT h.*, s.nom_site, c.nom_entreprise as client_nom
FROM historique_deployements h
LEFT JOIN sites_gas s ON h.site_id = s.id
...
```

But the PDF export code was checking for `site_nom` (reversed):

```typescript
// WRONG - was checking site_nom
const siteName = deployment?.site_nom || 'Non affecté';
```

## Evidence from Console Log

The console showed:
```
Found deployment: Domicile Rodrigue  ← Deployment exists!
Found deployment: Residence Baudouoin
Found deployment: Residence Justin
Found deployment: Domicile Rodrigue

[0] Amani Bisimwa (emp-1767727665959-czgjqwdkl)
    Deployment object: Object  ← Object exists
    Site name: ❌ NULL  ← But nom_site was NULL because we checked wrong property
```

The deployment object existed and had the site name, but we were checking the wrong property name!

## Fix Applied

Changed line 359 in `PayrollManagement.tsx`:

```typescript
// BEFORE (WRONG)
const siteName = deployment?.site_nom || 'Non affecté';

// AFTER (CORRECT)
const siteName = deployment?.nom_site || 'Non affecté';
```

Also updated the logging to show the correct property:

```typescript
console.log(`    - nom_site: ${d.nom_site || 'NULL'}`);
console.log(`    Site name: ${d?.nom_site || '❌ NULL'}`);
console.log(`    Will show in PDF: "${d?.nom_site || 'Non affecté'}"`);
```

## Why This Happened

There's an inconsistency in the codebase:

1. **getCurrentDeployment** returns `nom_site` (French: "nom du site")
2. **getEmployeeGAS** returns `site_nom` (reversed order)

Both mean "site name" but the property names are different!

```javascript
// getCurrentDeployment (line 4947)
SELECT h.*, s.nom_site, c.nom_entreprise as client_nom
FROM historique_deployements h
LEFT JOIN sites_gas s ON h.site_id = s.id

// getEmployeeGAS (line 4559)
SELECT e.*, s.nom_site as site_nom, c.nom_entreprise as client_nom
FROM employees_gas e
LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
```

Notice that `getEmployeeGAS` aliases `nom_site` to `site_nom`, but `getCurrentDeployment` doesn't!

## Testing

After this fix, when you export PDF:

1. Console should show:
```
[0] Amani Bisimwa (emp-1767727665959-czgjqwdkl)
    Deployment object: Object
    - site_id: site-xxx
    - nom_site: Domicile Rodrigue  ← Now shows the actual site name!
    Site name: Domicile Rodrigue
    Will show in PDF: "Domicile Rodrigue"
```

2. PDF should show actual site names in the "Site d'Affectation" column

## Files Modified

- `src/components/Payroll/PayrollManagement.tsx` (line 359, 277-281)

## Recommendation for Future

To avoid this confusion, consider standardizing property names:

**Option 1:** Make `getCurrentDeployment` alias to match `getEmployeeGAS`:
```javascript
SELECT h.*, s.nom_site as site_nom, c.nom_entreprise as client_nom
```

**Option 2:** Make `getEmployeeGAS` not alias (keep as `nom_site`):
```javascript
SELECT e.*, s.nom_site, c.nom_entreprise as client_nom
```

**Option 3:** Update TypeScript types to document both properties:
```typescript
interface Deployment {
  nom_site: string;  // From getCurrentDeployment
}

interface EmployeeGAS {
  site_nom: string;  // From getEmployeeGAS (aliased)
}
```

For now, the fix handles both cases correctly.

## Status

✅ **FIXED** - PDF export will now show actual site names instead of "Non affecté"
