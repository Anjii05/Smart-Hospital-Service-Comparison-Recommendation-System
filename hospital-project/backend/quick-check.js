// Quick check with timeout
const db = require('./config/db');

const timeout = setTimeout(() => {
  console.log('❌ Database query timed out after 5 seconds');
  process.exit(1);
}, 5000);

async function check() {
  try {
    console.log('Testing DB connection...');
    const result = await db.query('SELECT 1');
    clearTimeout(timeout);
    console.log('✅ Database connection OK');
    
    const [keys] = await db.query('SELECT COUNT(*) as count FROM api_keys');
    console.log(`✅ API Keys: ${keys[0].count}`);
    
    const [hospitals] = await db.query('SELECT COUNT(*) as count FROM hospitals');
    console.log(`✅ Hospitals: ${hospitals[0].count}`);
    
    process.exit(0);
  } catch (err) {
    clearTimeout(timeout);
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

check();
