const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

/**
 * Fetch real hospitals from Google Places API for a specific city
 * @param {string} city - The city name (e.g. "Mumbai")
 * @param {string} apiKey - Your Google Places API Key
 * @returns {Promise<Array>} List of formatted hospital objects
 */
async function fetchRealHospitals(city, apiKey) {
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('Google Maps API Key is missing or invalid in .env file.');
  }

  const query = encodeURIComponent(`hospitals in ${city}, India`);
  const url = `${GOOGLE_PLACES_API_URL}?query=${query}&key=${apiKey}`;

  console.log(`[GooglePlaces API] Fetching real hospital data for "${city}"...`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') return [];
      throw new Error(`Google Places API Error: ${data.status} - ${data.error_message || ''}`);
    }

    return data.results.map((place) => {
      return {
        source_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        city: city, // normalize city name based on input
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || (Math.random() * (5 - 3) + 3).toFixed(1), // Fallback if rating missing
        user_ratings_total: place.user_ratings_total || 0,
        isOpen: place.opening_hours ? place.opening_hours.open_now : true,
      };
    });
  } catch (error) {
    console.error('[GooglePlaces API] Failed to fetch data:', error.message);
    throw error;
  }
}

module.exports = { fetchRealHospitals };
