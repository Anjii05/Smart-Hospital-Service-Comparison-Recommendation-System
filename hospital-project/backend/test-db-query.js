// Quick test to check database content
const db = require('./config/db');

async function testQuery() {
  try {
    const [hospitals] = await db.query('SELECT id, name, city, rating FROM hospitals LIMIT 5');
    console.log('✅ Sample hospitals from DB:');
    console.log(JSON.stringify(hospitals, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

testQuery();
