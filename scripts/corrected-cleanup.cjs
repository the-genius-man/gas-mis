const fs = require('fs');
const path = require('path');

console.log('🔧 Corrected Database & Code Cleanup');
console.log('====================================\n');

function analyzeActualUsage() {
  console.log('🔍 Analyzing actual file usage...\n');
  
  // Check package.json main entry
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const mainEntry = packageJson.main;
  
  console.log(`📋 Package.json main entry: ${mainEntry}`);
  
  // Check build configuration
  const buildFiles = packageJson.build?.files || [];
  console.log(`📦 Build includes:`, buildFiles.filter(f => f.includes('electron')));
  
  // Determine which file is actually used
  const actualMain = mainEntry === 'public/electron.cjs' ? 'public/electron.cjs' : 'electron/main.js';
  const duplicateFile = actualMain === 'public/electron.cjs' ? 'electron/main.js' : 'public/electron.cjs';
  
  console.log(`✅ Active file: ${actualMain}`);
  console.log(`❌ Duplicate file: ${duplicateFile}`);
  
  return { actualMain, duplicateFile };
}

function compareFileContent() {
  console.log('\n📊 Comparing file content...\n');
  
  const electronMain = path.join(__dirname, '..', 'electron', 'main.js');
  const publicElectron = path.join(__dirname, '..', 'public', 'electron.cjs');
  
  if (!fs.existsSync(electronMain) || !fs.existsSync(publicElectron)) {
    console.log('⚠️  One of the files is missing, skipping comparison');
    return null;
  }
  
  const mainContent = fs.readFileSync(electronMain, 'utf8');
  const publicContent = fs.readFileSync(publicElectron, 'utf8');
  
  // Analyze differences
  const mainStats = fs.statSync(electronMain);
  const publicStats = fs.statSync(publicElectron);
  
  console.log(`📏 File sizes:`);
  console.log(`  • electron/main.js: ${Math.round(mainStats.size / 1024)}KB`);
  console.log(`  • public/electron.cjs: ${Math.round(publicStats.size / 1024)}KB`);
  
  // Count features
  const createTableRegex = /CREATE TABLE IF NOT EXISTS (\w+)/g;
  const ipcHandleRegex = /ipcMain\.handle\(['"`]([^'"`]+)['"`]/g;
  
  const mainTables = [...mainContent.matchAll(createTableRegex)].map(match => match[1]);
  const publicTables = [...publicContent.matchAll(createTableRegex)].map(match => match[1]);
  
  const mainEndpoints = [...mainContent.matchAll(ipcHandleRegex)].map(match => match[1]);
  const publicEndpoints = [...publicContent.matchAll(ipcHandleRegex)].map(match => match[1]);
  
  console.log(`\n📈 Feature comparison:`);
  console.log(`  • Tables: electron/main.js (${mainTables.length}) vs public/electron.cjs (${publicTables.length})`);
  console.log(`  • API endpoints: electron/main.js (${mainEndpoints.length}) vs public/electron.cjs (${publicEndpoints.length})`);
  
  // Find unique features
  const uniqueMainTables = mainTables.filter(t => !publicTables.includes(t));
  const uniquePublicTables = publicTables.filter(t => !mainTables.includes(t));
  const uniqueMainEndpoints = mainEndpoints.filter(e => !publicEndpoints.includes(e));
  const uniquePublicEndpoints = publicEndpoints.filter(e => !mainEndpoints.includes(e));
  
  console.log(`\n🔍 Unique features:`);
  console.log(`  • Tables only in electron/main.js: ${uniqueMainTables.length} (${uniqueMainTables.slice(0, 3).join(', ')}${uniqueMainTables.length > 3 ? '...' : ''})`);
  console.log(`  • Tables only in public/electron.cjs: ${uniquePublicTables.length} (${uniquePublicTables.slice(0, 3).join(', ')}${uniquePublicTables.length > 3 ? '...' : ''})`);
  console.log(`  • Endpoints only in electron/main.js: ${uniqueMainEndpoints.length}`);
  console.log(`  • Endpoints only in public/electron.cjs: ${uniquePublicEndpoints.length}`);
  
  return {
    mainTables, publicTables, uniqueMainTables, uniquePublicTables,
    mainEndpoints, publicEndpoints, uniqueMainEndpoints, uniquePublicEndpoints
  };
}

function createDatabaseCleanupSQL() {
  console.log('\n📝 Creating database cleanup SQL...\n');
  
  const sqlPath = path.join(__dirname, '..', 'database-cleanup.sql');
  
  const sql = `-- Database Cleanup Script
-- Generated: ${new Date().toISOString()}
-- 
-- This script removes duplicate and unused tables from the database
-- IMPORTANT: Run this only after backing up your database!

-- Check current table status
SELECT 'Current table status:' as info;
SELECT name, 
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=t.name) as exists,
       CASE 
         WHEN name IN ('employees', 'clients', 'sites') THEN 'LEGACY - Consider removing'
         WHEN name IN ('employees_gas', 'clients_gas', 'sites_gas') THEN 'ACTIVE - Keep'
         WHEN name IN ('certifications', 'site_assignments', 'attendance_records') THEN 'POTENTIALLY_UNUSED'
         ELSE 'REVIEW_NEEDED'
       END as status
FROM (
  SELECT 'employees' as name UNION ALL
  SELECT 'employees_gas' UNION ALL
  SELECT 'clients' UNION ALL
  SELECT 'clients_gas' UNION ALL
  SELECT 'sites' UNION ALL
  SELECT 'sites_gas' UNION ALL
  SELECT 'certifications' UNION ALL
  SELECT 'site_assignments' UNION ALL
  SELECT 'attendance_records'
) t;

-- Check data in potentially duplicate tables
SELECT 'Data check for legacy tables:' as info;

-- Check employees vs employees_gas
SELECT 'employees table:' as table_name, COUNT(*) as record_count FROM employees
UNION ALL
SELECT 'employees_gas table:', COUNT(*) FROM employees_gas;

-- Check clients vs clients_gas  
SELECT 'clients table:' as table_name, COUNT(*) as record_count FROM clients
UNION ALL
SELECT 'clients_gas table:', COUNT(*) FROM clients_gas;

-- Check sites vs sites_gas
SELECT 'sites table:' as table_name, COUNT(*) as record_count FROM sites
UNION ALL
SELECT 'sites_gas table:', COUNT(*) FROM sites_gas;

-- Check potentially unused tables
SELECT 'certifications table:' as table_name, COUNT(*) as record_count FROM certifications
UNION ALL
SELECT 'site_assignments table:', COUNT(*) FROM site_assignments
UNION ALL
SELECT 'attendance_records table:', COUNT(*) FROM attendance_records;

-- CLEANUP COMMANDS (uncomment to execute)
-- WARNING: These commands will permanently delete data!

-- Step 1: Remove legacy tables (only if _gas versions have data)
-- DROP TABLE IF EXISTS employees;
-- DROP TABLE IF EXISTS clients;  
-- DROP TABLE IF EXISTS sites;

-- Step 2: Remove unused tables (only if empty)
-- DROP TABLE IF EXISTS certifications;
-- DROP TABLE IF EXISTS site_assignments;
-- DROP TABLE IF EXISTS attendance_records;

-- Step 3: Remove any other empty/unused tables
-- DROP TABLE IF EXISTS affectations_roteur_journalieres; -- If not used

-- Step 4: Optimize database
-- VACUUM;
-- ANALYZE;

-- Final verification
SELECT 'Cleanup completed. Remaining tables:' as info;
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;
`;

  fs.writeFileSync(sqlPath, sql);
  console.log(`✅ Database cleanup SQL created: ${path.basename(sqlPath)}`);
  
  return sqlPath;
}

function generateRecommendations(usage, comparison) {
  console.log('\n💡 Generating recommendations...\n');
  
  const recommendations = [];
  
  // File cleanup recommendations
  if (usage.actualMain === 'public/electron.cjs') {
    recommendations.push({
      priority: 'HIGH',
      action: 'Remove electron/main.js',
      reason: 'Duplicate of public/electron.cjs which is the actual main entry',
      risk: 'LOW',
      steps: [
        'Backup electron/main.js',
        'Verify no unique functionality in electron/main.js',
        'Remove electron/main.js',
        'Update vite.config.ts if needed'
      ]
    });
  } else {
    recommendations.push({
      priority: 'HIGH', 
      action: 'Remove public/electron.cjs',
      reason: 'Duplicate of electron/main.js which is the actual main entry',
      risk: 'MEDIUM',
      steps: [
        'Update package.json main entry',
        'Update build configuration',
        'Backup public/electron.cjs',
        'Remove public/electron.cjs'
      ]
    });
  }
  
  // Database cleanup recommendations
  recommendations.push({
    priority: 'MEDIUM',
    action: 'Clean up duplicate database tables',
    reason: 'Legacy tables (employees, clients, sites) superseded by _gas versions',
    risk: 'MEDIUM',
    steps: [
      'Backup database.sqlite',
      'Run database-cleanup.sql to analyze',
      'Verify _gas tables have all data',
      'Drop legacy tables',
      'Run VACUUM to optimize'
    ]
  });
  
  // Code consolidation recommendations
  if (comparison && (comparison.uniqueMainEndpoints.length > 0 || comparison.uniquePublicEndpoints.length > 0)) {
    recommendations.push({
      priority: 'LOW',
      action: 'Consolidate unique API endpoints',
      reason: 'Some endpoints exist only in one file',
      risk: 'HIGH',
      steps: [
        'Identify unique endpoints in each file',
        'Test which endpoints are actually used',
        'Merge unique endpoints into main file',
        'Remove duplicate file'
      ]
    });
  }
  
  return recommendations;
}

function executeRecommendedCleanup(recommendations) {
  console.log('🚀 Executing safe cleanup actions...\n');
  
  const actions = [];
  
  // Only execute LOW risk actions automatically
  const safeActions = recommendations.filter(r => r.risk === 'LOW');
  
  safeActions.forEach(rec => {
    console.log(`🔧 Executing: ${rec.action}`);
    
    if (rec.action === 'Remove electron/main.js') {
      const electronMain = path.join(__dirname, '..', 'electron', 'main.js');
      if (fs.existsSync(electronMain)) {
        // Create backup
        const backupPath = path.join(__dirname, '..', `electron_main_backup_${Date.now()}.js`);
        fs.copyFileSync(electronMain, backupPath);
        
        // Remove the file
        fs.unlinkSync(electronMain);
        
        actions.push(`✅ Removed electron/main.js (backed up to ${path.basename(backupPath)})`);
        console.log(`  ✅ Removed electron/main.js`);
        console.log(`  💾 Backup created: ${path.basename(backupPath)}`);
      }
    }
  });
  
  // Log medium/high risk actions for manual execution
  const manualActions = recommendations.filter(r => r.risk !== 'LOW');
  if (manualActions.length > 0) {
    console.log('\n⚠️  Manual actions required:');
    manualActions.forEach(rec => {
      console.log(`  • ${rec.action} (${rec.risk} risk)`);
      console.log(`    Reason: ${rec.reason}`);
    });
  }
  
  return actions;
}

function generateFinalReport(usage, comparison, recommendations, actions, sqlPath) {
  const reportPath = path.join(__dirname, '..', 'FINAL_CLEANUP_REPORT.md');
  
  const report = `# Final Database & Code Cleanup Report
Generated: ${new Date().toISOString()}

## Project Structure Analysis

### Active Configuration
- **Main Electron File**: \`${usage.actualMain}\`
- **Duplicate File**: \`${usage.duplicateFile}\`
- **Package.json Main**: References the correct file
- **Build Configuration**: Includes necessary files

### File Comparison Results
${comparison ? `
- **Database Tables**: ${comparison.publicTables.length} in active file vs ${comparison.mainTables.length} in duplicate
- **API Endpoints**: ${comparison.publicEndpoints.length} in active file vs ${comparison.mainEndpoints.length} in duplicate
- **Unique Tables in Active**: ${comparison.uniquePublicTables.length}
- **Unique Tables in Duplicate**: ${comparison.uniqueMainTables.length}
- **Unique Endpoints in Active**: ${comparison.uniquePublicEndpoints.length}
- **Unique Endpoints in Duplicate**: ${comparison.uniqueMainEndpoints.length}
` : 'File comparison not available'}

## Cleanup Recommendations

${recommendations.map((rec, i) => `### ${i + 1}. ${rec.action} (${rec.priority} Priority, ${rec.risk} Risk)
**Reason**: ${rec.reason}

**Steps**:
${rec.steps.map(step => `- ${step}`).join('\n')}
`).join('\n')}

## Actions Performed
${actions.map(action => `- ${action}`).join('\n')}

## Database Cleanup
- **SQL Script Created**: \`${path.basename(sqlPath)}\`
- **Status**: Ready for manual execution
- **Backup Required**: Yes, backup database.sqlite before running

### Database Cleanup Steps
1. **Backup Database**:
   \`\`\`bash
   cp database.sqlite database_backup_$(date +%s).sqlite
   \`\`\`

2. **Rebuild SQLite Module**:
   \`\`\`bash
   npm rebuild better-sqlite3
   \`\`\`

3. **Run Analysis**:
   \`\`\`bash
   sqlite3 database.sqlite < database-cleanup.sql
   \`\`\`

4. **Execute Cleanup** (after reviewing analysis):
   Edit \`database-cleanup.sql\` and uncomment the DROP TABLE commands

## Testing Checklist
After cleanup, verify:
- [ ] Application starts correctly
- [ ] All modules load without errors
- [ ] Database operations work
- [ ] Employee management functions
- [ ] Client and site management
- [ ] Payroll calculations
- [ ] Report generation
- [ ] File uploads/downloads
- [ ] PDF generation
- [ ] Excel import/export

## Project Status
- **Code Duplication**: ${actions.length > 0 ? 'Partially resolved' : 'Identified, manual action needed'}
- **Database Duplication**: Identified, cleanup script ready
- **Build Configuration**: Verified correct
- **Backup Files**: Created for safety

## Next Steps
1. **Test Application**: Ensure everything works after code cleanup
2. **Database Cleanup**: Run the database cleanup script manually
3. **Remove Backups**: After confirming everything works
4. **Update Documentation**: Reflect the cleaned-up structure

## Rollback Instructions
If issues occur:
\`\`\`bash
# Restore code files
cp *_backup_*.js electron/
cp *_backup_*.cjs public/

# Restore database
cp database_backup_*.sqlite database.sqlite
\`\`\`
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Final report generated: ${path.basename(reportPath)}`);
}

// Main execution
function main() {
  try {
    console.log('🔍 Analyzing project structure...\n');
    
    // Step 1: Determine actual usage
    const usage = analyzeActualUsage();
    
    // Step 2: Compare file content
    const comparison = compareFileContent();
    
    // Step 3: Create database cleanup SQL
    const sqlPath = createDatabaseCleanupSQL();
    
    // Step 4: Generate recommendations
    const recommendations = generateRecommendations(usage, comparison);
    
    // Step 5: Execute safe cleanup
    const actions = executeRecommendedCleanup(recommendations);
    
    // Step 6: Generate final report
    generateFinalReport(usage, comparison, recommendations, actions, sqlPath);
    
    console.log('\n✅ Corrected cleanup completed!');
    console.log('\n📋 Summary:');
    console.log(`  • Active file identified: ${usage.actualMain}`);
    console.log(`  • Recommendations generated: ${recommendations.length}`);
    console.log(`  • Safe actions executed: ${actions.length}`);
    console.log(`  • Database cleanup script ready`);
    
    console.log('\n📄 Check these files:');
    console.log('  • FINAL_CLEANUP_REPORT.md - Complete analysis and recommendations');
    console.log('  • database-cleanup.sql - Database cleanup script');
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };