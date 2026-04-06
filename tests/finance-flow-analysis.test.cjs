/**
 * Finance Flow Static Analysis Tests
 * Verifies that all three layers are wired correctly by inspecting
 * the electron.cjs source code directly.
 *
 * Run with: node tests/finance-flow-analysis.test.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../public/electron.cjs'), 'utf8');

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ─── Helper: find a handler block ────────────────────────────────────────────
function getHandlerBlock(handlerName) {
  const start = src.indexOf(`ipcMain.handle('${handlerName}'`);
  if (start === -1) return '';
  // Find the next ipcMain.handle to bound the block
  const next = src.indexOf('ipcMain.handle(', start + 10);
  return next === -1 ? src.slice(start) : src.slice(start, next);
}

// ─── FLOW 1: Pay invoice from Facturation (db-add-paiement-gas) ──────────────
console.log('\n── Flow 1: Pay invoice from Facturation (db-add-paiement-gas) ──');
{
  const block = getHandlerBlock('db-add-paiement-gas');

  check('Handler exists', block.length > 0);
  check('Layer 1 — inserts into paiements table', block.includes("INSERT INTO paiements"));
  check('Layer 1 — calls updateFacturePaymentStatus', block.includes('updateFacturePaymentStatus'));
  check('Layer 2 — inserts into entrees table', block.includes("INSERT INTO entrees"));
  check('Layer 2 — entrees source_type = PAIEMENT_CLIENT', block.includes("'PAIEMENT_CLIENT'"));
  check('Layer 2 — entrees uses crypto.randomUUID()', block.includes('crypto.randomUUID()'));
  check('Layer 3 — calls createEcritureComptable', block.includes('createEcritureComptable'));
  check('Layer 3 — journal entry Débit 512 or 571', block.includes("'571'") || block.includes("'512'"));
  check('Layer 3 — journal entry Crédit 411', block.includes("'411'"));
  check('compteId declared before treasury try block', 
    block.includes('let compteId') && 
    block.indexOf('let compteId') < block.indexOf('INSERT INTO entrees'));
}

// ─── FLOW 2: Pay invoice from Entrées (db-add-entree PAIEMENT_CLIENT) ────────
console.log('\n── Flow 2: Pay invoice from Entrées (db-add-entree) ──');
{
  const block = getHandlerBlock('db-add-entree');

  check('Handler exists', block.length > 0);
  check('Layer 1 — inserts into paiements when PAIEMENT_CLIENT', 
    block.includes("INSERT INTO paiements") && block.includes("PAIEMENT_CLIENT"));
  check('Layer 1 — uses updateFacturePaymentStatus (not manual calc)', 
    block.includes('updateFacturePaymentStatus') && !block.includes("let newStatus"));
  check('Layer 2 — inserts into entrees table', block.includes("INSERT INTO entrees"));
  check('Layer 3 — calls createEcritureComptable for PAIEMENT_CLIENT', 
    block.includes('createEcritureComptable'));
  check('Layer 3 — journal entry Débit 512 or 571', 
    block.includes("'571'") || block.includes("'512'"));
  check('Layer 3 — journal entry Crédit 411 for client payments', 
    block.includes("'411'"));
  check('Layer 3 — journal entry for non-invoice entries (DEPOT/AUTRE)', 
    block.includes("'47'"));
}

// ─── FLOW 3: Invoice sent (ENVOYE) → journal entry ───────────────────────────
console.log('\n── Flow 3: Invoice sent (ENVOYE) → journal entry ──');
{
  const block = getHandlerBlock('db-update-facture-gas');

  check('Handler exists', block.length > 0);
  check('Checks for ENVOYE status transition', block.includes("=== 'ENVOYE'"));
  check('Checks previous status was BROUILLON', block.includes("=== 'BROUILLON'"));
  check('Creates journal entry on ENVOYE', block.includes('createEcritureComptable'));
  check('Journal entry Débit 411 (Clients)', block.includes("'411'"));
  check('Journal entry Crédit 706 (Services)', block.includes("'706'"));
}

// ─── FLOW 4: Créances clients reduction ──────────────────────────────────────
console.log('\n── Flow 4: Créances clients — solde_restant computation ──');
{
  const block = getHandlerBlock('db-get-facture-paiements-summary');

  check('Handler exists', block.length > 0);
  check('Sums paiements.montant_paye', block.includes('SUM(montant_paye)'));
  check('Sums avoirs.montant_avoir', block.includes('SUM(montant_avoir)'));
  check('Combines both: total_paye + total_avoir', block.includes('total_paye + total_avoir'));
  check('Computes solde_restant = max(0, total - paid)', 
    block.includes('Math.max(0') && block.includes('montant_total_du_client'));
}

// ─── FLOW 5: Delete payment → cleanup all layers ─────────────────────────────
console.log('\n── Flow 5: Delete payment → cleanup all layers ──');
{
  const block = getHandlerBlock('db-delete-paiement-gas');

  check('Handler exists', block.length > 0);
  check('Layer 1 — deletes from paiements', block.includes("DELETE FROM paiements"));
  check('Layer 1 — calls updateFacturePaymentStatus after delete', 
    block.includes('updateFacturePaymentStatus'));
  check('Layer 2 — deletes from entrees', block.includes("DELETE FROM entrees"));
  check('Layer 3 — deletes from ecritures_comptables', 
    block.includes("DELETE FROM ecritures_comptables"));
  check('Layer 3 — deletes from lignes_ecritures', 
    block.includes("DELETE FROM lignes_ecritures"));
}

// ─── FLOW 6: Expense → journal entry ─────────────────────────────────────────
console.log('\n── Flow 6: Expense (db-add-depense) → journal entry ──');
{
  const block = getHandlerBlock('db-add-depense');

  check('Handler exists', block.length > 0);
  check('Creates journal entry', block.includes('createEcritureComptable'));
  check('Journal type = DEPENSE', block.includes("'DEPENSE'"));
  check('Debit charge account (6x)', block.includes("|| '63'"));
  check('Credit treasury account (512/571)', 
    block.includes("'571'") || block.includes("'512'"));
}

// ─── FLOW 7: Expense update → journal entry update ───────────────────────────
console.log('\n── Flow 7: Expense update (db-update-depense) → journal update ──');
{
  const block = getHandlerBlock('db-update-depense');

  check('Handler exists', block.length > 0);
  check('Finds existing ecriture by source_id', 
    block.includes("source_id = ?") && block.includes("type_operation = 'DEPENSE'"));
  check('Updates ecriture header', block.includes("UPDATE ecritures_comptables SET"));
  check('Replaces lines (DELETE + INSERT)', 
    block.includes("DELETE FROM lignes_ecritures") && block.includes("INSERT INTO lignes_ecritures"));
}

// ─── FLOW 8: createEcritureComptable helper ───────────────────────────────────
console.log('\n── Flow 8: createEcritureComptable helper ──');
{
  const helperStart = src.indexOf('function createEcritureComptable(');
  const helperEnd = src.indexOf('\nfunction ', helperStart + 10);
  const block = helperStart === -1 ? '' : src.slice(helperStart, helperEnd);

  check('Helper function exists', block.length > 0);
  check('Inserts into ecritures_comptables', block.includes("INSERT INTO ecritures_comptables"));
  check('Inserts into lignes_ecritures', block.includes("INSERT INTO lignes_ecritures"));
  check('Status defaults to BROUILLON', block.includes("'BROUILLON'"));
  check('Never throws — catches errors silently', block.includes('catch'));
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} checks`);
if (failed > 0) {
  console.error(`\n✗ ${failed} check(s) failed — see above for details.\n`);
  process.exit(1);
} else {
  console.log('\n✓ All checks passed — finance flows are correctly wired.\n');
}
