// Query to check API keys table
const db = require('./config/db');

async function checkApiKeys() {
  try {
    console.log('Checking api_keys table...');
    const [keys] = await db.query('SELECT id, api_key, app_name, is_active FROM api_keys LIMIT 5');
    console.log('Found API keys:');
    console.log(JSON.stringify(keys, null, 2));
    
    console.log('\nChecking hospitals table...');
    const [hospitals] = await db.query('SELECT id, name, city FROM hospitals LIMIT 3');
    console.log('Found hospitals:');
    console.log(JSON.stringify(hospitals, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkApiKeys();
