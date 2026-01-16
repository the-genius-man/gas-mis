# 🔄 Restart Required

## Issue

You're seeing this error:
```
Error invoking remote method 'db-flush-payroll': 
Error: No handler registered for 'db-flush-payroll'
```

## Cause

The new `db-flush-payroll` handler was added to the Electron backend (`public/electron.cjs`), but Electron needs to be restarted to register the new IPC handler.

## Solution

**Restart the Electron application:**

### Option 1: Close and Reopen
1. Close the application completely
2. Reopen it
3. The new handler will be registered

### Option 2: If Running in Development
1. Stop the development server (Ctrl+C in terminal)
2. Restart with `npm run dev` or `npm start`
3. The new handler will be registered

## Verification

After restarting, the "Réinitialiser" button should work correctly.

## What Was Added

The following new features require the restart:

1. **Flush Payroll Handler** (`db-flush-payroll`)
   - Deletes all payroll data
   - Accessible via "Réinitialiser" button

2. **Lock Validation**
   - Prevents creating new periods if previous not locked
   - Already active (modified existing handler)

## After Restart

You should be able to:
- ✅ Click "Réinitialiser" button without errors
- ✅ Flush all payroll data
- ✅ See lock validation when creating new periods

---

**Note:** Whenever new IPC handlers are added to `electron.cjs`, a restart is required for them to be registered.
