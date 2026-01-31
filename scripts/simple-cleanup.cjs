const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Simple Cleanup Process...\n');

function backupFiles() {
  const filesToBackup = [
    'public/electron.cjs',
    'public/preload.cjs'
  ];
  
  const backups = [];
  
  filesToBackup.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      const backupPath = path.join(__dirname, '..', `${path.basename(filePath, path.extname(filePath))}_backup_${Date.now()}${path.extname(filePath)}`);
      fs.copyFileSync(fullPath, backupPath);
      backups.push({ original: filePath, backup: path.basename(backupPath) });
      console.log(`✅ Backed up ${filePath} to ${path.basename(backupPath)}`);
    }
  });
  
  return backups;
}

function analyzeFileDuplication() {
  console.log('📁 Analyzing file duplication...\n');
  
  const electronMain = path.join(__dirname, '..', 'electron', 'main.js');
  const publicElectron = path.join(__dirname, '..', 'public', 'electron.cjs');
  
  const analysis = {
    duplicateFiles: [],
    issues: []
  };
  
  if (fs.existsSync(electronMain) && fs.existsSync(publicElectron)) {
    const mainStats = fs.statSync(electronMain);
    const publicStats = fs.statSync(publicElectron);
    
    console.log(`📊 File sizes:`);
    console.log(`  • electron/main.js: ${Math.round(mainStats.size / 1024)}KB`);
    console.log(`  • public/electron.cjs: ${Math.round(publicStats.size / 1024)}KB`);
    
    analysis.duplicateFiles.push({
      main: 'electron/main.js',
      duplicate: 'public/electron.cjs',
      mainSize: Math.round(mainStats.size / 1024),
      duplicateSize: Math.round(publicStats.size / 1024)
    });
    
    // Analyze content similarity
    const mainContent = fs.readFileSync(electronMain, 'utf8');
    const publicContent = fs.readFileSync(publicElectron, 'utf8');
    
    // Count CREATE TABLE statements
    const createTableRegex = /CREATE TABLE IF NOT EXISTS (\w+)/g;
    const mainTables = [...mainContent.matchAll(createTableRegex)].map(match => match[1]);
    const publicTables = [...publicContent.matchAll(createTableRegex)].map(match => match[1]);
    const duplicateTables = mainTables.filter(table => publicTables.includes(table));
    
    // Count API endpoints
    const ipcHandleRegex = /ipcMain\.handle\(['"`]([^'"`]+)['"`]/g;
    const mainEndpoints = [...mainContent.matchAll(ipcHandleRegex)].map(match => match[1]);
    const publicEndpoints = [...publicContent.matchAll(ipcHandleRegex)].map(match => match[1]);
    const duplicateEndpoints = mainEndpoints.filter(endpoint => publicEndpoints.includes(endpoint));
    
    console.log(`\n🔍 Content analysis:`);
    console.log(`  • Tables in electron/main.js: ${mainTables.length}`);
    console.log(`  • Tables in public/electron.cjs: ${publicTables.length}`);
    console.log(`  • Duplicate table definitions: ${duplicateTables.length}`);
    console.log(`  • API endpoints in electron/main.js: ${mainEndpoints.length}`);
    console.log(`  • API endpoints in public/electron.cjs: ${publicEndpoints.length}`);
    console.log(`  • Duplicate API endpoints: ${duplicateEndpoints.length}`);
    
    if (duplicateTables.length > 0) {
      analysis.issues.push({
        type: 'DUPLICATE_SCHEMAS',
        count: duplicateTables.length,
        examples: duplicateTables.slice(0, 5)
      });
    }
    
    if (duplicateEndpoints.length > 0) {
      analysis.issues.push({
        type: 'DUPLICATE_ENDPOINTS',
        count: duplicateEndpoints.length,
        examples: duplicateEndpoints.slice(0, 5)
      });
    }
  }
  
  return analysis;
}

function checkFileReferences() {
  console.log('\n🔍 Checking file references...\n');
  
  const filesToCheck = [
    'package.json',
    'index.html',
    'vite.config.ts',
    'electron/main.js'
  ];
  
  const references = {};
  
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      references[file] = {
        referencesPublicElectron: content.includes('public/electron.cjs'),
        referencesPublicPreload: content.includes('public/preload.cjs'),
        referencesElectronMain: content.includes('electron/main.js')
      };
      
      console.log(`📄 ${file}:`);
      console.log(`  • References public/electron.cjs: ${references[file].referencesPublicElectron}`);
      console.log(`  • References public/preload.cjs: ${references[file].referencesPublicPreload}`);
      console.log(`  • References electron/main.js: ${references[file].referencesElectronMain}`);
    }
  });
  
  return references;
}

function performCleanup(analysis, references, backups) {
  console.log('\n🧹 Performing cleanup...\n');
  
  const actions = [];
  
  // Check if public files are safe to remove
  const publicElectronReferenced = Object.values(references).some(ref => ref.referencesPublicElectron);
  const publicPreloadReferenced = Object.values(references).some(ref => ref.referencesPublicPreload);
  
  console.log(`📋 Safety check:`);
  console.log(`  • public/electron.cjs referenced: ${publicElectronReferenced}`);
  console.log(`  • public/preload.cjs referenced: ${publicPreloadReferenced}`);
  
  // Remove public/electron.cjs if not referenced
  const publicElectron = path.join(__dirname, '..', 'public', 'electron.cjs');
  if (fs.existsSync(publicElectron) && !publicElectronReferenced) {
    fs.unlinkSync(publicElectron);
    actions.push('✅ Removed duplicate public/electron.cjs');
    console.log('🗑️  Removed public/electron.cjs');
  } else if (publicElectronReferenced) {
    actions.push('⚠️  Kept public/electron.cjs (still referenced)');
    console.log('⚠️  Kept public/electron.cjs (still referenced)');
  }
  
  // Remove public/preload.cjs if not referenced
  const publicPreload = path.join(__dirname, '..', 'public', 'preload.cjs');
  if (fs.existsSync(publicPreload) && !publicPreloadReferenced) {
    fs.unlinkSync(publicPreload);
    actions.push('✅ Removed duplicate public/preload.cjs');
    console.log('🗑️  Removed public/preload.cjs');
  } else if (publicPreloadReferenced) {
    actions.push('⚠️  Kept public/preload.cjs (still referenced)');
    console.log('⚠️  Kept public/preload.cjs (still referenced)');
  }
  
  return actions;
}

function generateReport(analysis, references, backups, actions) {
  const reportPath = path.join(__dirname, '..', 'CLEANUP_REPORT.md');
  
  const report = `# Database & Code Cleanup Report
Generated: ${new Date().toISOString()}

## File Duplication Analysis

### Duplicate Files Found
${analysis.duplicateFiles.map(file => 
  `- **${file.main}** (${file.mainSize}KB) vs **${file.duplicate}** (${file.duplicateSize}KB)`
).join('\n')}

### Content Issues
${analysis.issues.map(issue => 
  `- **${issue.type}**: ${issue.count} duplicates found${issue.examples ? ` (examples: ${issue.examples.join(', ')})` : ''}`
).join('\n')}

## File References Check
${Object.entries(references).map(([file, refs]) => 
  `### ${file}
- References public/electron.cjs: ${refs.referencesPublicElectron}
- References public/preload.cjs: ${refs.referencesPublicPreload}
- References electron/main.js: ${refs.referencesElectronMain}`
).join('\n\n')}

## Backup Files Created
${backups.map(backup => `- **${backup.original}** → \`${backup.backup}\``).join('\n')}

## Cleanup Actions Performed
${actions.map(action => `- ${action}`).join('\n')}

## Database Issues Identified

### Duplicate Tables (Manual Review Needed)
Based on code analysis, these tables appear to be duplicated:
- \`employees\` vs \`employees_gas\` (legacy vs new)
- \`clients\` vs \`clients_gas\` (legacy vs new)  
- \`sites\` vs \`sites_gas\` (legacy vs new)

### Recommended Database Cleanup
\`\`\`sql
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
\`\`\`

## Next Steps

### Immediate
- [x] Remove duplicate code files
- [x] Create backups of removed files
- [ ] Test application functionality

### Database Cleanup (Manual)
- [ ] Rebuild better-sqlite3: \`npm rebuild better-sqlite3\`
- [ ] Run database analysis: \`node scripts/check-table-structure.sql\`
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
\`\`\`bash
# Restore files from backups (check timestamps)
cp *_backup_*.cjs public/
\`\`\`
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Cleanup report generated: ${reportPath}`);
}

// Main process
function main() {
  try {
    console.log('🚀 Starting simple cleanup process...\n');
    
    // Step 1: Create backups
    const backups = backupFiles();
    
    // Step 2: Analyze duplications
    const analysis = analyzeFileDuplication();
    
    // Step 3: Check file references
    const references = checkFileReferences();
    
    // Step 4: Perform safe cleanup
    const actions = performCleanup(analysis, references, backups);
    
    // Step 5: Generate report
    generateReport(analysis, references, backups, actions);
    
    console.log('\n✅ Simple cleanup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  • Files backed up: ${backups.length}`);
    console.log(`  • Duplicate files found: ${analysis.duplicateFiles.length}`);
    console.log(`  • Issues identified: ${analysis.issues.length}`);
    console.log(`  • Actions performed: ${actions.length}`);
    
    console.log('\n⚠️  Next steps:');
    console.log('1. Review CLEANUP_REPORT.md');
    console.log('2. Test the application');
    console.log('3. Run database cleanup manually if needed');
    console.log('4. Remove backup files once confirmed working');
    
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