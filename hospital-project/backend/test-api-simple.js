// Test API directly
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/hospitals',
  method: 'GET',
  headers: {
    'X-API-Key': 'hospital-api-key-prod-2024'
  }
};

const timeout = setTimeout(() => {
  console.log('❌ Request timed out after 10 seconds');
  process.exit(1);
}, 10000);

const req = http.request(options, (res) => {
  clearTimeout(timeout);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ API Response:');
      console.log(`   Success: ${json.success}`);
      console.log(`   Count: ${json.count}`);
      console.log(`   Source: ${json.source}`);
      if (json.data && json.data.length > 0) {
        console.log(`   First hospital: ${json.data[0].name}`);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  clearTimeout(timeout);
  console.error('❌ Request error:', err.message);
  process.exit(1);
});

req.end();
