// Test API endpoint
const axios = require('axios');

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'X-API-Key': 'hospital-api-key-prod-2024',
    'Content-Type': 'application/json'
  }
});

async function test() {
  try {
    console.log('📡 Testing /api/hospitals endpoint...');
    const response = await API.get('/hospitals');
    console.log('\n✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('❌ Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ No response from server', error.message);
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

test();
