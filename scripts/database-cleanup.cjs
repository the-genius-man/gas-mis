const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('🧹 Starting Database Cleanup Process...\n');

// Backup the current database
function backupDatabase() {
  const backupPath = path.join(__dirname, '..', `database_backup_${Date.now()}.sqlite`);
  try {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Database backed up to: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Failed to backup database:', error);
    throw error;
  }
}

function analyzeDatabase() {
  const db = new Database(dbPath);
  
  console.log('📊 Analyzing current database structure...\n');
  
  // Get all tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  console.log(`📋 Found ${tables.length} tables:`);
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`  • ${table.name} (${count.count} records)`);
  });
  
  // Identify potential duplicates and issues
  console.log('\n🔍 Identifying issues:');
  
  const issues = [];
  
  // Check for duplicate table patterns
  const duplicatePatterns = [
    { old: 'employees', new: 'employees_gas', reason: 'Legacy employees table superseded by employees_gas' },
    { old: 'clients', new: 'clients_gas', reason: 'Legacy clients table superseded by clients_gas' },
    { old: 'sites', new: 'sites_gas', reason: 'Legacy sites table superseded by sites_gas' },
  ];
  
  duplicatePatterns.forEach(pattern => {
    const oldExists = tables.find(t => t.name === pattern.old);
    const newExists = tables.find(t => t.name === pattern.new);
    
    if (oldExists && newExists) {
      const oldCount = db.prepare(`SELECT COUNT(*) as count FROM ${pattern.old}`).get();
      const newCount = db.prepare(`SELECT COUNT(*) as count FROM ${pattern.new}`).get();
      
      issues.push({
        type: 'DUPLICATE_TABLE',
        old: pattern.old,
        new: pattern.new,
        oldCount: oldCount.count,
        newCount: newCount.count,
        reason: pattern.reason
      });
    }
  });
  
  // Check for unused tables
  const potentiallyUnused = [
    'certifications',
    'site_assignments', 
    'attendance_records',
    'affectations_roteur_journalieres' // This was added but might not be used
  ];
  
  potentiallyUnused.forEach(tableName => {
    const table = tables.find(t => t.name === tableName);
    if (table) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      issues.push({
        type: 'POTENTIALLY_UNUSED',
        table: tableName,
        count: count.count,
        reason: 'Table exists but may not be actively used'
      });
    }
  });
  
  // Check for tables with no data
  const emptyTables = tables.filter(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    return count.count === 0;
  });
  
  if (emptyTables.length > 0) {
    issues.push({
      type: 'EMPTY_TABLES',
      tables: emptyTables.map(t => t.name),
      reason: 'Tables with no data that could be cleaned up'
    });
  }
  
  db.close();
  return { tables, issues };
}

function cleanupDatabase(issues) {
  const db = new Database(dbPath);
  
  console.log('\n🧹 Starting cleanup process...\n');
  
  let cleanupActions = [];
  
  // Handle duplicate tables
  issues.filter(i => i.type === 'DUPLICATE_TABLE').forEach(issue => {
    console.log(`🔄 Processing duplicate: ${issue.old} -> ${issue.new}`);
    console.log(`   Old table: ${issue.oldCount} records`);
    console.log(`   New table: ${issue.newCount} records`);
    
    if (issue.oldCount === 0 || issue.newCount > 0) {
      // Safe to drop old table
      try {
        db.exec(`DROP TABLE IF EXISTS ${issue.old}`);
        cleanupActions.push(`Dropped legacy table: ${issue.old}`);
        console.log(`   ✅ Dropped ${issue.old}`);
      } catch (error) {
        console.log(`   ❌ Failed to drop ${issue.old}: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️  Skipping ${issue.old} - has data but new table is empty`);
    }
  });
  
  // Handle potentially unused tables
  issues.filter(i => i.type === 'POTENTIALLY_UNUSED').forEach(issue => {
    if (issue.count === 0) {
      console.log(`🗑️  Dropping empty unused table: ${issue.table}`);
      try {
        db.exec(`DROP TABLE IF EXISTS ${issue.table}`);
        cleanupActions.push(`Dropped unused empty table: ${issue.table}`);
        console.log(`   ✅ Dropped ${issue.table}`);
      } catch (error) {
        console.log(`   ❌ Failed to drop ${issue.table}: ${error.message}`);
      }
    } else {
      console.log(`⚠️  Keeping ${issue.table} - has ${issue.count} records`);
    }
  });
  
  // Clean up empty tables (except core ones we might need)
  const coreEmptyTables = [
    'plan_comptable', 'comptes_tresorerie', 'categories_depenses', 
    'tax_settings', 'deduction_types'
  ];
  
  const emptyTablesIssue = issues.find(i => i.type === 'EMPTY_TABLES');
  if (emptyTablesIssue) {
    emptyTablesIssue.tables.forEach(tableName => {
      if (!coreEmptyTables.includes(tableName)) {
        console.log(`🗑️  Considering empty table for removal: ${tableName}`);
        // For now, just log - don't auto-remove
        console.log(`   ⚠️  Keeping for safety - manual review needed`);
      }
    });
  }
  
  // Optimize database
  console.log('\n🔧 Optimizing database...');
  try {
    db.exec('VACUUM');
    db.exec('ANALYZE');
    cleanupActions.push('Database optimized (VACUUM + ANALYZE)');
    console.log('   ✅ Database optimized');
  } catch (error) {
    console.log(`   ❌ Optimization failed: ${error.message}`);
  }
  
  db.close();
  return cleanupActions;
}

function generateCleanupReport(backupPath, cleanupActions, finalAnalysis) {
  const reportPath = path.join(__dirname, '..', 'DATABASE_CLEANUP_REPORT.md');
  
  const report = `# Database Cleanup Report
Generated: ${new Date().toISOString()}

## Backup Information
- **Backup Location**: \`${backupPath}\`
- **Original Database**: \`${dbPath}\`

## Cleanup Actions Performed
${cleanupActions.map(action => `- ${action}`).join('\n')}

## Final Database Structure
${finalAnalysis.tables.map(table => {
  const db = new Database(dbPath);
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
  db.close();
  return `- **${table.name}**: ${count.count} records`;
}).join('\n')}

## Recommendations for Further Cleanup

### 1. Code Cleanup Needed
- Remove duplicate schema definitions in \`public/electron.cjs\`
- Consolidate database initialization in \`electron/main.js\`
- Remove unused API endpoints

### 2. File Duplications to Address
- \`electron/main.js\` and \`public/electron.cjs\` have duplicate table definitions
- Consider removing \`public/electron.cjs\` if not needed
- Consolidate database seeding scripts

### 3. Potential Schema Improvements
- Add proper foreign key constraints
- Add indexes for frequently queried columns
- Consider normalizing some denormalized fields

## Next Steps
1. Review this report
2. Test application functionality
3. Remove duplicate code files
4. Update documentation
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Cleanup report generated: ${reportPath}`);
}

// Main cleanup process
async function main() {
  try {
    // Step 1: Backup
    const backupPath = backupDatabase();
    
    // Step 2: Analyze
    const { tables, issues } = analyzeDatabase();
    
    console.log('\n🚨 Issues found:');
    issues.forEach(issue => {
      console.log(`  • ${issue.type}: ${issue.reason}`);
      if (issue.old && issue.new) {
        console.log(`    ${issue.old} (${issue.oldCount}) -> ${issue.new} (${issue.newCount})`);
      }
      if (issue.table) {
        console.log(`    ${issue.table} (${issue.count} records)`);
      }
      if (issue.tables) {
        console.log(`    ${issue.tables.join(', ')}`);
      }
    });
    
    // Step 3: Cleanup
    const cleanupActions = cleanupDatabase(issues);
    
    // Step 4: Final analysis
    const finalAnalysis = analyzeDatabase();
    
    // Step 5: Generate report
    generateCleanupReport(backupPath, cleanupActions, finalAnalysis);
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log(`📊 Tables before: ${tables.length}, after: ${finalAnalysis.tables.length}`);
    console.log(`🔧 Actions performed: ${cleanupActions.length}`);
    
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