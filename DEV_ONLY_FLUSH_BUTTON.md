# 🔧 Development-Only Flush Button

## Change Applied

The "Réinitialiser" (Flush Payroll) button is now **only visible in development mode**.

## Implementation

```typescript
{/* Only show flush button in development */}
{import.meta.env.DEV && (
  <button
    onClick={handleFlushPayroll}
    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    title="Supprimer toutes les données de paie (DEV ONLY)"
  >
    <Trash2 className="w-5 h-5" />
    Réinitialiser
  </button>
)}
```

## How It Works

### Development Mode
- **Condition:** `import.meta.env.DEV === true`
- **Button:** ✅ Visible
- **Use case:** Testing, resetting data during development

### Production Mode
- **Condition:** `import.meta.env.DEV === false`
- **Button:** ❌ Hidden
- **Result:** Users cannot accidentally delete all payroll data

## Environment Detection

Vite automatically sets `import.meta.env.DEV`:
- **Development:** `npm run dev` → `DEV = true`
- **Production:** `npm run build` → `DEV = false`

## Testing

### In Development (Current)
1. Run `npm run dev` or `npm run electron-dev`
2. Go to Paie → Paie
3. ✅ You should see the red "Réinitialiser" button
4. Button works as expected

### In Production (After Build)
1. Build the app: `npm run build:electron`
2. Run the built application
3. Go to Paie → Paie
4. ❌ "Réinitialiser" button should NOT be visible
5. Only "Nouvelle Période" button visible

## Benefits

✅ **Safety:** Prevents accidental data deletion in production  
✅ **Convenience:** Available for testing during development  
✅ **Clean UI:** Production users don't see development tools  
✅ **No code changes needed:** Automatically switches based on environment  

## Alternative Access in Production

If you need to flush data in production (emergency only):

### Option 1: Database Tool
Use a SQLite database tool to manually run:
```sql
DELETE FROM remboursements_avances;
DELETE FROM paiements_salaires;
DELETE FROM salaires_impayes;
DELETE FROM bulletins_paie;
DELETE FROM periodes_paie;
```

### Option 2: Developer Console
In production, open DevTools console and run:
```javascript
await window.electronAPI.flushPayroll();
```
(The API function still exists, just the button is hidden)

### Option 3: Temporarily Enable
Edit the code to temporarily show the button:
```typescript
{(import.meta.env.DEV || true) && ( // Force show
  <button...>
```

## File Modified

- `src/components/Payroll/PayrollManagement.tsx` (lines ~575-585)

## Summary

✅ **Development:** Button visible and functional  
✅ **Production:** Button hidden for safety  
✅ **No restart needed:** Change takes effect immediately  

The flush functionality remains available through the API, but the UI button is only shown during development to prevent accidental data loss in production.
