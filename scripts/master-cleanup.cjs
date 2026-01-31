const { main: databaseCleanup } = require('./database-cleanup.cjs');
const { main: codeCleanup } = require('./code-cleanup.cjs');

console.log('🚀 Starting Master Cleanup Process');
console.log('=====================================\n');

async function runMasterCleanup() {
  try {
    console.log('Phase 1: Database Cleanup');
    console.log('-------------------------');
    await databaseCleanup();
    
    console.log('\n\nPhase 2: Code Cleanup');
    console.log('---------------------');
    await codeCleanup();
    
    console.log('\n\n🎉 Master Cleanup Completed Successfully!');
    console.log('==========================================');
    console.log('\n📋 Summary:');
    console.log('• Database structure optimized');
    console.log('• Duplicate tables removed');
    console.log('• Duplicate code files cleaned up');
    console.log('• Backup files created for safety');
    console.log('\n📄 Check the generated reports:');
    console.log('• DATABASE_CLEANUP_REPORT.md');
    console.log('• CODE_CLEANUP_REPORT.md');
    console.log('\n⚠️  Next Steps:');
    console.log('1. Review the cleanup reports');
    console.log('2. Test the application thoroughly');
    console.log('3. Remove backup files once confirmed working');
    console.log('4. Update documentation if needed');
    
  } catch (error) {
    console.error('\n❌ Master cleanup failed:', error);
    console.log('\n🔄 You can run individual cleanup scripts:');
    console.log('• node scripts/database-cleanup.cjs');
    console.log('• node scripts/code-cleanup.cjs');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMasterCleanup();
}

module.exports = { runMasterCleanup };