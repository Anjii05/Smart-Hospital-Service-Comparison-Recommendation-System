const { geocodeCity, searchOsmHospitalsNearCoordinates } = require('./services/osmHospitals');

async function test() {
  const city = "Davangere";
  console.log(`--- Testing Geocoding for "${city}" ---`);
  try {
    const geo = await geocodeCity(city);
    console.log('Geo result:', JSON.stringify(geo, null, 2));
    
    if (geo) {
      console.log(`--- Testing OSM Fetch for (${geo.lat}, ${geo.lon}) ---`);
      const osm = await searchOsmHospitalsNearCoordinates(geo.lat, geo.lon, 25);
      console.log('OSM Count:', osm.data.length);
      console.log('OSM Message:', osm.meta.message);
      if (osm.data.length > 0) {
        console.log('First Result:', osm.data[0].name);
      }
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
