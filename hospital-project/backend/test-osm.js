#!/usr/bin/env node
/**
 * Test OpenStreetMap hospital geocoding and fetching
 */

const { geocodeCity, searchHospitalsByCityIndia } = require('./services/osmHospitals');

async function testOSMService() {
  console.log('=== Testing OpenStreetMap Service ===\n');
  
  const testCities = ['Davangere', 'Bangalore', 'Chennai', 'Jaipur'];
  
  for (const city of testCities) {
    console.log(`\nTesting: ${city}`);
    console.log('---');
    
    try {
      // Test geocoding first
      console.log(`1️⃣  Geocoding "${city}"...`);
      const geoResult = await geocodeCity(city);
      
      if (!geoResult) {
        console.log(`   ❌ Could not geocode "${city}"`);
        continue;
      }
      
      console.log(`   ✅ Geocoded: ${geoResult.displayName}`);
      console.log(`      Coordinates: ${geoResult.lat}, ${geoResult.lon}`);
      
      // Now test hospital search
      console.log(`2️⃣  Searching for hospitals near ${city}...`);
      const result = await searchHospitalsByCityIndia(city);
      
      console.log(`   ✅ Found ${result.data.length} hospitals`);
      console.log(`   Source: ${result.meta.source}`);
      
      if (result.data.length > 0) {
        console.log(`   Top results:`);
        result.data.slice(0, 3).forEach((h, i) => {
          console.log(`     ${i+1}. ${h.name} - ${h.location} (${h.distance_km} km away)`);
        });
      } else {
        console.log(`   ℹ️  ${result.meta.message}`);
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      if (err.stack) {
        console.error(`      Stack: ${err.stack.split('\n').slice(0, 3).join('\n      ')}`);
      }
    }
  }
  
  console.log('\n=== Test Complete ===');
}

testOSMService().catch(console.error);
