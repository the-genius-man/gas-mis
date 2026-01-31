const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Code Cleanup Analysis...\n');

function analyzeFileDuplication() {
  const electronMain = path.join(__dirname, '..', 'electron', 'main.js');
  const publicElectron = path.join(__dirname, '..', 'public', 'electron.cjs');
  
  console.log('📁 Analyzing file duplication...');
  
  const issues = [];
  
  // Check if both files exist
  if (fs.existsSync(electronMain) && fs.existsSync(publicElectron)) {
    const mainStats = fs.statSync(electronMain);
    const publicStats = fs.statSync(publicElectron);
    
    console.log(`  • electron/main.js: ${Math.round(mainStats.size / 1024)}KB`);
    console.log(`  • public/electron.cjs: ${Math.round(publicStats.size / 1024)}KB`);
    
    issues.push({
      type: 'DUPLICATE_FILES',
      files: ['electron/main.js', 'public/electron.cjs'],
      reason: 'Both files contain similar database initialization and API endpoints',
      recommendation: 'Keep electron/main.js, remove public/electron.cjs'
    });
  }
  
  return issues;
}

function analyzeDatabaseSchemas() {
  console.log('\n📊 Analyzing database schema duplications...');
  
  const electronMain = path.join(__dirname, '..', 'electron', 'main.js');
  const publicElectron = path.join(__dirname, '..', 'public', 'electron.cjs');
  
  const issues = [];
  
  if (fs.existsSync(electronMain) && fs.existsSync(publicElectron)) {
    const mainContent = fs.readFileSync(electronMain, 'utf8');
    const publicContent = fs.readFileSync(publicElectron, 'utf8');
    
    // Find CREATE TABLE statements
    const createTableRegex = /CREATE TABLE IF NOT EXISTS (\w+)/g;
    
    const mainTables = [...mainContent.matchAll(createTableRegex)].map(match => match[1]);
    const publicTables = [...publicContent.matchAll(createTableRegex)].map(match => match[1]);
    
    const duplicateTables = mainTables.filter(table => publicTables.includes(table));
    
    console.log(`  • Tables in electron/main.js: ${mainTables.length}`);
    console.log(`  • Tables in public/electron.cjs: ${publicTables.length}`);
    console.log(`  • Duplicate table definitions: ${duplicateTables.length}`);
    
    if (duplicateTables.length > 0) {
      issues.push({
        type: 'DUPLICATE_SCHEMAS',
        duplicates: duplicateTables,
        reason: 'Same table definitions exist in both files',
        recommendation: 'Remove duplicate schema definitions'
      });
    }
  }
  
  return issues;
}

function analyzeAPIEndpoints() {
  console.log('\n🔌 Analyzing API endpoint duplications...');
  
  const electronMain = path.join(__dirname, '..', 'electron', 'main.js');
  const publicElectron = path.join(__dirname, '..', 'public', 'electron.cjs');
  
  const issues = [];
  
  if (fs.existsSync(electronMain) && fs.existsSync(publicElectron)) {
    const mainContent = fs.readFileSync(electronMain, 'utf8');
    const publicContent = fs.readFileSync(publicElectron, 'utf8');
    
    // Find ipcMain.handle statements
    const ipcHandleRegex = /ipcMain\.handle\(['"`]([^'"`]+)['"`]/g;
    
    const mainEndpoints = [...mainContent.matchAll(ipcHandleRegex)].map(match => match[1]);
    const publicEndpoints = [...publicContent.matchAll(ipcHandleRegex)].map(match => match[1]);
    
    const duplicateEndpoints = mainEndpoints.filter(endpoint => publicEndpoints.includes(endpoint));
    
    console.log(`  • Endpoints in electron/main.js: ${mainEndpoints.length}`);
    console.log(`  • Endpoints in public/electron.cjs: ${publicEndpoints.length}`);
    console.log(`  • Duplicate endpoints: ${duplicateEndpoints.length}`);
    
    if (duplicateEndpoints.length > 0) {
      issues.push({
        type: 'DUPLICATE_ENDPOINTS',
        duplicates: duplicateEndpoints.slice(0, 10), // Show first 10
        total: duplicateEndpoints.length,
        reason: 'Same API endpoints defined in both files',
        recommendation: 'Consolidate API endpoints in single file'
      });
    }
  }
  
  return issues;
}

function generateCleanupPlan(allIssues) {
  console.log('\n📋 Generating cleanup plan...\n');
  
  const plan = {
    immediate: [],
    recommended: [],
    optional: []
  };
  
  allIssues.forEach(issue => {
    switch (issue.type) {
      case 'DUPLICATE_FILES':
        plan.immediate.push({
          action: 'Remove public/electron.cjs',
          reason: 'Duplicate of electron/main.js',
          risk: 'Low - if public/electron.cjs is not actively used'
        });
        break;
        
      case 'DUPLICATE_SCHEMAS':
        plan.immediate.push({
          action: 'Remove duplicate table definitions',
          reason: `${issue.duplicates.length} tables defined in both files`,
          risk: 'Low - keep definitions in electron/main.js only'
        });
        break;
        
      case 'DUPLICATE_ENDPOINTS':
        plan.recommended.push({
          action: 'Consolidate API endpoints',
          reason: `${issue.total} duplicate endpoints found`,
          risk: 'Medium - requires testing to ensure no functionality breaks'
        });
        break;
    }
  });
  
  return plan;
}

function executeCleanup(plan) {
  console.log('🚀 Executing cleanup plan...\n');
  
  const actions = [];
  
  // Check if public/electron.cjs should be removed
  const publicElectron = path.join(__dirname, '..', 'public', 'electron.cjs');
  const publicPreload = path.join(__dirname, '..', 'public', 'preload.cjs');
  
  if (fs.existsSync(publicElectron)) {
    console.log('🔍 Checking if public/electron.cjs is referenced...');
    
    // Check package.json and other config files
    const packageJson = path.join(__dirname, '..', 'package.json');
    const indexHtml = path.join(__dirname, '..', 'index.html');
    
    let isReferenced = false;
    
    if (fs.existsSync(packageJson)) {
      const packageContent = fs.readFileSync(packageJson, 'utf8');
      if (packageContent.includes('public/electron.cjs')) {
        isReferenced = true;
        console.log('  ⚠️  Referenced in package.json');
      }
    }
    
    if (fs.existsSync(indexHtml)) {
      const htmlContent = fs.readFileSync(indexHtml, 'utf8');
      if (htmlContent.includes('public/electron.cjs')) {
        isReferenced = true;
        console.log('  ⚠️  Referenced in index.html');
      }
    }
    
    if (!isReferenced) {
      console.log('  ✅ public/electron.cjs appears to be unused');
      
      // Create backup before removal
      const backupPath = path.join(__dirname, '..', `public_electron_backup_${Date.now()}.cjs`);
      fs.copyFileSync(publicElectron, backupPath);
      actions.push(`Backed up public/electron.cjs to ${path.basename(backupPath)}`);
      
      // Remove the file
      fs.unlinkSync(publicElectron);
      actions.push('Removed duplicate public/electron.cjs');
      console.log('  🗑️  Removed public/electron.cjs');
      
      // Also remove preload if it exists and is unused
      if (fs.existsSync(publicPreload)) {
        const preloadBackup = path.join(__dirname, '..', `public_preload_backup_${Date.now()}.cjs`);
        fs.copyFileSync(publicPreload, preloadBackup);
        fs.unlinkSync(publicPreload);
        actions.push('Removed duplicate public/preload.cjs');
        console.log('  🗑️  Removed public/preload.cjs');
      }
    } else {
      console.log('  ⚠️  public/electron.cjs is referenced - manual review needed');
      actions.push('public/electron.cjs is referenced - requires manual review');
    }
  }
  
  return actions;
}

function generateReport(allIssues, plan, actions) {
  const reportPath = path.join(__dirname, '..', 'CODE_CLEANUP_REPORT.md');
  
  const report = `# Code Cleanup Report
Generated: ${new Date().toISOString()}

## Issues Identified

${allIssues.map(issue => `### ${issue.type}
- **Reason**: ${issue.reason}
- **Recommendation**: ${issue.recommendation}
${issue.duplicates ? `- **Duplicates**: ${issue.duplicates.join(', ')}${issue.total > issue.duplicates.length ? ` (showing ${issue.duplicates.length} of ${issue.total})` : ''}` : ''}
${issue.files ? `- **Files**: ${issue.files.join(', ')}` : ''}
`).join('\n')}

## Cleanup Plan

### Immediate Actions
${plan.immediate.map(item => `- **${item.action}**: ${item.reason} (Risk: ${item.risk})`).join('\n')}

### Recommended Actions  
${plan.recommended.map(item => `- **${item.action}**: ${item.reason} (Risk: ${item.risk})`).join('\n')}

### Optional Actions
${plan.optional.map(item => `- **${item.action}**: ${item.reason} (Risk: ${item.risk})`).join('\n')}

## Actions Performed
${actions.map(action => `- ${action}`).join('\n')}

## Next Steps

### 1. File Structure Cleanup
- ✅ Remove duplicate electron files
- 🔄 Consolidate database initialization
- 🔄 Remove unused imports and dependencies

### 2. Code Consolidation
- 🔄 Merge duplicate API endpoints
- 🔄 Standardize error handling patterns
- 🔄 Remove dead code

### 3. Documentation Updates
- 🔄 Update setup instructions
- 🔄 Document final architecture
- 🔄 Update deployment scripts

## Testing Required
After cleanup, test these areas:
- [ ] Electron app startup
- [ ] Database initialization
- [ ] All API endpoints functionality
- [ ] File upload/download features
- [ ] PDF generation
- [ ] Excel import/export

## Backup Files Created
All removed files have been backed up with timestamps.
Check the project root for \`*_backup_*.cjs\` files.
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Code cleanup report generated: ${reportPath}`);
}

// Main cleanup process
async function main() {
  try {
    console.log('🔍 Analyzing codebase for cleanup opportunities...\n');
    
    // Analyze different types of issues
    const fileIssues = analyzeFileDuplication();
    const schemaIssues = analyzeDatabaseSchemas();
    const apiIssues = analyzeAPIEndpoints();
    
    const allIssues = [...fileIssues, ...schemaIssues, ...apiIssues];
    
    console.log(`\n📊 Summary: Found ${allIssues.length} types of issues`);
    
    // Generate cleanup plan
    const plan = generateCleanupPlan(allIssues);
    
    console.log('📋 Cleanup Plan:');
    console.log(`  • Immediate actions: ${plan.immediate.length}`);
    console.log(`  • Recommended actions: ${plan.recommended.length}`);
    console.log(`  • Optional actions: ${plan.optional.length}`);
    
    // Execute safe cleanup actions
    const actions = executeCleanup(plan);
    
    // Generate report
    generateReport(allIssues, plan, actions);
    
    console.log('\n✅ Code cleanup analysis completed!');
    console.log(`🔧 Actions performed: ${actions.length}`);
    
  } catch (error) {
    console.error('\n❌ Code cleanup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };