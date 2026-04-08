/**
 * ============================================================
 * COMPLETE HOSPITAL API ROUTES
 * ============================================================
 * Features:
 * - Search & Filter Hospitals
 * - Hospital Details
 * - Compare Multiple Hospitals
 * - Find Nearest Hospitals
 * - Get Recommendations
 * - Add Reviews
 * 
 * Usage: app.use('/api', require('./routes/hospitals-complete'))
 */

const express = require('express');
const router = express.Router();
const { pool: db } = require('../config/database');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { geocodeCity, searchOsmHospitalsNearCoordinates, searchHospitalsByCityIndia } = require('../services/osmHospitals');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Recommendation scoring algorithm
 * Weights: Rating (30%), Price (25%), Treatment Match (25%), Distance (20%)
 */
function calculateRecommendationScore(hospital, preferences) {
  let score = 0;

  // Rating score (30%)
  if (preferences.minRating) {
    const rating = hospital.rating || 3.8; // Default to mid-range for OSM
    const ratingScore = Math.min((rating / 5) * 100, 100);
    score += (ratingScore / 100) * 30;
  }

  // Cost score (25%) - lower is better
  if (preferences.maxCost && hospital.min_cost) {
    const costScore = Math.max(0, 100 - (hospital.min_cost / preferences.maxCost * 100));
    score += (costScore / 100) * 25;
  }

  // Treatment match (25%)
  if (preferences.treatment) {
    let match = false;
    
    if (hospital.treatments) {
      const treatments = hospital.treatments.split(',').map(t => t.trim().toLowerCase());
      match = treatments.some(t => t.includes(preferences.treatment.toLowerCase()));
    } else if (hospital.source === 'openstreetmap') {
      // 🏥 BENEFIT OF THE DOUBT: Assume OSM hospitals support common treatments 
      // if they haven't been hydrated yet.
      match = true; 
    }
    
    score += (match ? 25 : 5);
  }

  // Distance score (20%) - closer is better
  if (preferences.latitude && preferences.longitude && hospital.latitude && hospital.longitude) {
    const distance = calculateDistance(
      preferences.latitude, preferences.longitude,
      hospital.latitude, hospital.longitude
    );
    const distanceScore = Math.max(0, 100 - (distance / 25 * 100)); // 25km = max penalty
    score += (distanceScore / 100) * 20;
  }

  return Math.round(score);
}

function getHospitalSummaryFields(alias = 'h') {
  return `
    ${alias}.*,
    (SELECT MIN(t.cost) FROM treatments t WHERE t.hospital_id = ${alias}.id) AS min_treatment_cost,
    (SELECT MIN(t.cost) FROM treatments t WHERE t.hospital_id = ${alias}.id) AS min_cost,
    (SELECT COUNT(DISTINCT d.id) FROM doctors d WHERE d.hospital_id = ${alias}.id) AS total_doctors,
    (SELECT COUNT(DISTINCT d.id) FROM doctors d WHERE d.hospital_id = ${alias}.id AND COALESCE(d.available, 1) = 1) AS available_doctors,
    (SELECT COUNT(DISTINCT t.id) FROM treatments t WHERE t.hospital_id = ${alias}.id) AS treatment_count,
    (SELECT COUNT(DISTINCT t.id) FROM treatments t WHERE t.hospital_id = ${alias}.id) AS total_services,
    (SELECT COUNT(*) FROM reviews r WHERE r.hospital_id = ${alias}.id) AS review_count
  `;
}

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/hospitals
 * Search and filter hospitals
 * Query params: city, min_rating, max_cost, treatment, emergency
 */
router.get('/', async (req, res) => {
  try {
    console.log('🏥 /api/hospitals called');
    console.log('   Query params:', req.query);

    const { city, min_rating, max_cost, treatment, emergency, sort } = req.query;

    let whereConditions = [];
    let params = [];

    // City filter
    if (city && city.trim()) {
      whereConditions.push(`LOWER(h.city) LIKE LOWER(?)`);
      params.push(`${city.trim()}%`);
    }

    // Rating filter
    if (min_rating) {
      const rating = parseFloat(min_rating);
      if (!isNaN(rating)) {
        whereConditions.push(`h.rating >= ?`);
        params.push(rating);
      }
    }

    // Emergency filter
    if (emergency === 'true' || emergency === '1') {
      whereConditions.push(`h.emergency_available = TRUE`);
    }

    // Build base query
    let query = `
      SELECT DISTINCT ${getHospitalSummaryFields('h')}
      FROM hospitals h
      WHERE 1=1
    `;

    if (whereConditions.length > 0) {
      query += ` AND ${whereConditions.join(' AND ')}`;
    }

    // Treatment filter (treatments-level)
    if (max_cost || treatment) {
      query += ` AND EXISTS (
        SELECT 1 FROM treatments t WHERE t.hospital_id = h.id`;

      if (max_cost) {
        const cost = parseFloat(max_cost);
        if (!isNaN(cost)) {
          query += ` AND t.cost <= ?`;
          params.push(cost);
        }
      }

      if (treatment && treatment.trim()) {
        query += ` AND LOWER(t.name) LIKE LOWER(?)`;
        params.push(`%${treatment.trim()}%`);
      }

      query += `)`;
    }

    let orderClause = 'h.rating DESC, h.id ASC';
    if (sort === 'cost_asc') {
      orderClause = 'COALESCE(min_treatment_cost, min_cost, h.cost, 0) ASC, h.rating DESC, h.id ASC';
    } else if (sort === 'name_asc' || sort === 'name') {
      orderClause = 'h.name ASC, h.rating DESC, h.id ASC';
    }

    query += ` ORDER BY ${orderClause}`;

    const [hospitals] = await db.query(query, params);

    console.log(`   ✅ Found ${hospitals.length} hospitals in database`);
    if (hospitals.length > 0) {
      console.log(`   Sample: ${hospitals[0].name}`);
    }

    // Try OSM fallback if no results and city provided
    let source = 'database';
    if (hospitals.length === 0 && city) {
      try {
        console.log(`   🔍 Fallback to OpenStreetMap for city: ${city}...`);

        // Create a timeout promise that rejects after 60 seconds
        const osmPromise = searchHospitalsByCityIndia(city, { radiusKm: 6 });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OSM request timeout after 60s')), 60000)
        );

        const osmResult = await Promise.race([osmPromise, timeoutPromise]);

        if (osmResult.data && osmResult.data.length > 0) {
          // Background hydration — fire and forget, don't block the response
          try {
            const { hydrateCity } = require('../services/hydrator');
            hydrateCity(city).catch(e => console.error('   ❌ Background hydration failed:', e.message));
          } catch (hydrationErr) {
            console.error('   ⚠️ Hydration module error:', hydrationErr.message);
          }

          hospitals.push(...osmResult.data);
          source = 'openstreetmap';
          console.log(`   ✅ Found ${osmResult.data.length} hospitals from OpenStreetMap`);
        } else {
          console.log(`   ⚠️ No hospitals found on OpenStreetMap for "${city}"`);
        }
      } catch (osmErr) {
        console.error(`   ❌ OSM fallback error: ${osmErr.message}`);
      }
    }

    const responseData = {
      success: true,
      count: hospitals.length,
      source,
      data: hospitals
    };

    console.log(`   📤 Sending response with ${hospitals.length} hospitals`);
    res.json(responseData);
  } catch (err) {
    console.error('❌ Hospital filter error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint (no auth required)
 */
router.get('/health', async (req, res) => {
  try {
    const [[result]] = await db.query('SELECT 1 as status');
    res.json({
      success: true,
      status: 'API is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'API error',
      database: 'disconnected',
      error: err.message
    });
  }
});

/**
 * GET /api/hospitals/nearest
 * Find nearest hospitals by coordinates or place name
 */
router.get('/nearest', async (req, res) => {
  try {
    const queryData = { ...req.query, ...req.body };
    const { place, city, radius = 50 } = queryData;
    
    // Support both long and short coordinate names
    let latitude = queryData.latitude || queryData.lat;
    let longitude = queryData.longitude || queryData.lng;

    const finalPlace = place || city;
    const finalRadius = parseFloat(radius);

    let lat, lon, centerLabel;

    // 1. Resolve Location
    if (latitude && longitude) {
      lat = parseFloat(latitude);
      lon = parseFloat(longitude);
      centerLabel = "Your Location";
    } else if (finalPlace && String(finalPlace).trim()) {
      console.log(`🌍 Finding nearest hospitals for place: ${finalPlace}`);
      const geo = await geocodeCity(String(finalPlace).trim());
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
        centerLabel = geo.displayName;
      }
    }

    if (!lat || !lon) {
      const msg = finalPlace 
        ? `Could not resolve location for "${finalPlace}". Try another city name.`
        : 'Could not detect your location. Please type a city name.';
      return res.status(400).json({ success: false, message: msg });
    }

    // 2. Search Local Database
    console.log(`🔎 Searching DB for hospitals within ${finalRadius}km of (${lat}, ${lon})...`);
    
    let dbHospitals = [];
    if (finalPlace) {
      const [cityMatches] = await db.query(
        `SELECT ${getHospitalSummaryFields('h')} FROM hospitals h WHERE LOWER(city) LIKE LOWER(?)`, 
        [`${finalPlace.trim()}%`]
      );
      if (cityMatches.length > 0) {
        console.log(`✅ Found ${cityMatches.length} quick city matches in DB.`);
        dbHospitals = cityMatches;
      }
    }

    if (dbHospitals.length === 0) {
      const [allHospitals] = await db.query(`SELECT ${getHospitalSummaryFields('h')} FROM hospitals h`);
      dbHospitals = allHospitals;
    }
    
    const localNearby = dbHospitals
      .map(h => ({
        ...h,
        source: 'local',
        distance_km: h.latitude && h.longitude ?
          calculateDistance(lat, lon, h.latitude, h.longitude) :
          null
      }))
      .filter(h => h.distance_km !== null && h.distance_km <= finalRadius)
      .sort((a, b) => a.distance_km - b.distance_km);

    let finalResults = [...localNearby];
    let source = localNearby.length > 0 ? 'local' : 'none';

    if (localNearby.length < 3) {
      console.log(`🔄 Low local results (${localNearby.length}). Fetching from OpenStreetMap...`);
      try {
        const osmResult = await searchOsmHospitalsNearCoordinates(lat, lon, finalRadius);
        if (osmResult && osmResult.data && osmResult.data.length > 0) {
          const localNames = new Set(localNearby.map(h => h.name.toLowerCase().trim()));
          const filteredOsm = osmResult.data.filter(h => !localNames.has(h.name.toLowerCase().trim()));
          
          finalResults = [...localNearby, ...filteredOsm];
          source = localNearby.length > 0 ? 'mixed' : 'openstreetmap';
        }
      } catch (osmErr) {
        console.error('⚠️ OSM fallback failed:', osmErr.message);
      }
    }

    res.json({
      success: true,
      center: { latitude: lat, longitude: lon, label: centerLabel },
      radius_km: finalRadius,
      count: finalResults.length,
      source,
      data: finalResults.sort((a, b) => a.distance_km - b.distance_km).slice(0, 50)
    });

  } catch (err) {
    console.error('❌ Nearest hospitals error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Alias for POST
router.post('/nearest', (req, res) => {
  req.query = { ...req.query, ...req.body };
  return router.handle(req, res);
});

/**
 * POST /api/hospitals/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least 2 hospital IDs in array format'
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    const [hospitals] = await db.query(`SELECT ${getHospitalSummaryFields('h')} FROM hospitals h WHERE id IN (${placeholders})`, ids);

    if (hospitals.length === 0) {
      return res.status(404).json({ success: false, message: 'No hospitals found' });
    }

    const comparisonData = await Promise.all(
      hospitals.map(async (h) => {
        const [treatments] = await db.query('SELECT * FROM treatments WHERE hospital_id = ?', [h.id]);
        const [facilities] = await db.query('SELECT * FROM facilities WHERE hospital_id = ?', [h.id]);
        const [doctors] = await db.query(
          'SELECT COUNT(*) as total, SUM(IF(available=TRUE, 1, 0)) as available FROM doctors WHERE hospital_id = ?',
          [h.id]
        );
        const [reviews] = await db.query(
          'SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews WHERE hospital_id = ?',
          [h.id]
        );

        return {
          ...h,
          services: treatments.map(t => ({ name: t.name, cost: t.cost })),
          facilities: facilities.map(f => f.name),
          doctor_info: doctors[0],
          review_info: reviews[0],
          available_doctors: Number(doctors[0]?.available || 0),
          total_doctors: Number(doctors[0]?.total || 0),
          review_count: Number(reviews[0]?.total || 0),
          review_summary: {
            total_reviews: Number(reviews[0]?.total || 0),
            avg_rating: Number(reviews[0]?.avg_rating || 0)
          },
          treatment_count: treatments.length,
          min_treatment_cost: treatments.length > 0 ? Math.min(...treatments.map(t => t.cost)) : h.cost,
          min_cost: treatments.length > 0 ? Math.min(...treatments.map(t => t.cost)) : h.cost,
          max_cost: treatments.length > 0 ? Math.max(...treatments.map(t => t.cost)) : h.cost
        };
      })
    );

    res.json({
      success: true,
      comparison_count: hospitals.length,
      data: comparisonData
    });
  } catch (err) {
    console.error('❌ Compare error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/hospitals/recommendations
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { latitude, longitude, treatment, budget, city } = req.body;

    const preferences = {
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      treatment,
      maxCost: budget ? parseFloat(budget) : null,
      minRating: 3.5
    };

    console.log(`🎯 Recommendation request: city=${city}, treatment=${treatment}, budget=${budget}`);

    // 1. Initial Attempt: Database Search
    let query = `SELECT DISTINCT ${getHospitalSummaryFields('h')} FROM hospitals h WHERE 1=1`;
    let params = [];

    if (city) {
      query += ` AND LOWER(h.city) LIKE LOWER(?)`;
      params.push(`${city.trim()}%`);
    }

    if (treatment) {
      query += ` AND EXISTS (
        SELECT 1 FROM treatments t 
        WHERE t.hospital_id = h.id 
        AND LOWER(t.name) LIKE LOWER(?)
      )`;
      params.push(`%${treatment.trim()}%`);
    }

    let [hospitals] = await db.query(query, params);
    let source = 'database';

    // 2. Fallback: OpenStreetMap (if 0 results and city provided)
    if (hospitals.length === 0 && city) {
      console.log(`   🔍 Recommendations: 0 DB results for ${city}. Trying OSM fallback (extended 25km radius)...`);
      try {
        const osmTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OSM recommendation timeout')), 60000)
        );
        const osmResult = await Promise.race([
          searchHospitalsByCityIndia(city, { radiusKm: 25 }),
          osmTimeoutPromise
        ]);
        if (osmResult.data && osmResult.data.length > 0) {
          // Background hydration — fire and forget
          try {
            const { hydrateCity } = require('../services/hydrator');
            hydrateCity(city).catch(e => console.error('   ❌ Background hydration failed:', e.message));
          } catch (hydrationErr) {
            console.error('   ⚠️ Hydration module error:', hydrationErr.message);
          }

          hospitals = osmResult.data;
          source = 'openstreetmap';
        }
      } catch (osmErr) {
        console.error(`   ❌ Recommendations OSM error: ${osmErr.message}`);
      }
    }

    if (hospitals.length === 0) {
      return res.json({ 
        success: true, 
        count: 0, 
        message: city ? `No hospitals found in "${city}" for your requirements.` : 'No matching hospitals found.', 
        data: [] 
      });
    }

    // 3. Scoring & Details
    const hospitalsWithCosts = await Promise.all(
      hospitals.map(async (h) => {
        // If from OSM, we don't have DB treatments yet (unless hydrated fast), 
        // so we use the price field from the OSM result or a default.
        let min_cost = 0;
        if (h.source === 'openstreetmap') {
          min_cost = h.min_cost || 0;
        } else {
          const [treatments] = await db.query(
            'SELECT MIN(cost) as min_cost FROM treatments WHERE hospital_id = ?',
            [h.id]
          );
          min_cost = treatments[0]?.min_cost || h.cost || 0;
        }

        return {
          ...h,
          min_cost,
          min_treatment_cost: min_cost,
          available_doctors: Number(h.available_doctors || 0),
          total_doctors: Number(h.total_doctors || 0),
          treatment_count: Number(h.treatment_count || h.total_services || 0),
          review_count: Number(h.review_count || 0)
        };
      })
    );

    const recommendations = hospitalsWithCosts
      .map(h => ({
        ...h,
        recommendation_score: calculateRecommendationScore(h, preferences)
      }))
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 10);

    console.log(`   📤 Sending ${recommendations.length} recommendations from ${source}`);

    res.json({
      success: true,
      count: recommendations.length,
      source,
      preferences,
      data: recommendations
    });
  } catch (err) {
    console.error('❌ Recommendations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/hospitals/:id
 * Get detailed information about a single hospital
 */
router.get('/:id', async (req, res) => {
  try {
    let { id } = req.params;

    // 🏥 IGNORE "nearest" path if it hits this dynamic route
    if (id === 'nearest' || id === 'search' || id === 'compare' || id === 'recommendations') {
      return res.status(404).json({ success: false, message: 'Invalid hospital ID provided.' });
    }

    let hospital = null;

    // 1. Try numeric ID first
    if (!isNaN(parseInt(id)) && !id.toString().includes('osm')) {
      const [[result]] = await db.query('SELECT * FROM hospitals WHERE id = ?', [id]);
      hospital = result;
    } 
    
    // 2. Fallback to string-based ID (OSM or Name)
    if (!hospital) {
      console.log(`   🔍 Searching for string-based ID: ${id}`);
      // Find hospital by its name or common name (if ID was osm-node-etc, it might be saved in db now)
      const [[result]] = await db.query(
        'SELECT * FROM hospitals WHERE LOWER(name) = LOWER(?) OR id = ?', 
        [id.replace(/-/g, ' '), id]
      );
      hospital = result;
    }

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital details not found or yet to be saved. Try refreshing.' });
    }

    // Standardize IDs for subsequent queries
    const hospitalId = hospital.id;

    // Fetch related data (synchronized to use 'treatments' table)
    const [doctors] = await db.query('SELECT * FROM doctors WHERE hospital_id = ? ORDER BY specialization', [hospitalId]);
    const [treatments] = await db.query('SELECT * FROM treatments WHERE hospital_id = ? ORDER BY cost ASC', [hospitalId]);
    const [facilities] = await db.query('SELECT * FROM facilities WHERE hospital_id = ?', [hospitalId]);
    const [reviews] = await db.query('SELECT * FROM reviews WHERE hospital_id = ? ORDER BY created_at DESC', [hospitalId]);
    const totalDoctors = doctors.length;
    const availableDoctors = doctors.filter(d => d.available).length;
    const treatmentCount = treatments.length;
    const reviewCount = reviews.length;

    res.json({
      success: true,
      data: {
        ...hospital,
        doctors,
        services: treatments, // Map treatments back to 'services' field for frontend compatibility
        treatments,
        facilities,
        reviews,
        min_treatment_cost: treatments.length > 0 ? Math.min(...treatments.map((t) => t.cost)) : hospital.cost,
        total_doctors: totalDoctors,
        available_doctors: availableDoctors,
        treatment_count: treatmentCount,
        review_count: reviewCount,
        stats: {
          total_doctors: totalDoctors,
          available_doctors: availableDoctors,
          total_services: treatmentCount,
          total_facilities: facilities.length,
          total_reviews: reviewCount,
          avg_rating: hospital.rating
        }
      }
    });
  } catch (err) {
    console.error('❌ Hospital detail error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
