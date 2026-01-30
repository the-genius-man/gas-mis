const fs = require('fs');
const path = require('path');

// Simple SQLite execution without better-sqlite3
const { spawn } = require('child_process');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const sqlPath = path.join(__dirname, 'reset-roteur-data.sql');

console.log('🔄 Executing SQL script to reset roteur data...');
console.log('📍 Database:', dbPath);
console.log('📄 SQL file:', sqlPath);

// Check if sqlite3 command is available
const sqlite3Process = spawn('sqlite3', [dbPath, '.read ' + sqlPath], {
  stdio: 'inherit',
  shell: true
});

sqlite3Process.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ SQL script executed successfully!');
    console.log('💡 The database has been reset with fresh roteur assignment data.');
    console.log('🔄 Please refresh the application to see the changes.');
  } else {
    console.error(`❌ SQL script failed with exit code ${code}`);
    
    // Fallback: try to read and execute SQL manually
    console.log('\n🔄 Trying alternative approach...');
    
    try {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      console.log('📄 SQL content loaded. Please execute this manually in your SQLite browser:');
      console.log('\n' + '='.repeat(50));
      console.log(sqlContent);
      console.log('='.repeat(50));
    } catch (err) {
      console.error('❌ Could not read SQL file:', err.message);
    }
  }
});

sqlite3Process.on('error', (err) => {
  console.error('❌ Error executing sqlite3 command:', err.message);
  console.log('\n💡 Alternative: Please execute the SQL script manually using a SQLite browser or tool.');
  
  try {
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('\n📄 SQL content to execute:');
    console.log('\n' + '='.repeat(50));
    console.log(sqlContent);
    console.log('='.repeat(50));
  } catch (readErr) {
    console.error('❌ Could not read SQL file:', readErr.message);
  }
});