const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, '..', 'database.sqlite');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check if table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='tax_settings'
  `).get();
  
  console.log('\n=== Tax Settings Table ===');
  console.log('Table exists:', !!tableExists);
  
  if (tableExists) {
    // Get all tax settings
    const settings = db.prepare('SELECT * FROM tax_settings').all();
    console.log('\nNumber of settings:', settings.length);
    console.log('\nSettings:');
    settings.forEach(setting => {
      console.log(`\n- ${setting.setting_name}:`);
      console.log(`  Value: ${setting.setting_value}`);
      console.log(`  Description: ${setting.description}`);
      console.log(`  Category: ${setting.category}`);
    });
  } else {
    console.log('\n⚠️  Table does not exist! Run the app once to create it.');
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
