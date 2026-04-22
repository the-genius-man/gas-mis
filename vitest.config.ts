import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.property.test.cjs',
    ],
    exclude: [
      // Exclude tests that require better-sqlite3 (native module version mismatch)
      // or plain scripts without describe/test blocks
      'tests/avoir-numbering.property.test.cjs',
      'tests/avoir-overcredit.property.test.cjs',
      'tests/client-statement.property.test.cjs',
      'tests/en-retard-not-persisted.property.test.cjs',
      'tests/finance-flow-analysis.test.cjs',
      'tests/invoice-numbering.property.test.cjs',
      'tests/overdue-status.property.test.cjs',
      'tests/payment-status.property.test.cjs',
      'tests/aging-report.property.test.cjs',
      'node_modules/**',
    ],
    environmentMatchGlobs: [
      // Property tests in tests/ are pure Node (no DOM needed)
      ['tests/**', 'node'],
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
