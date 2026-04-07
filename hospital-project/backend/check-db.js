const { pool } = require('../config/db');
const { attachDistances, sortByDistance } = require('../services/distanceService');

/**
 * GET /api/hospitals
 * Query: city, department, lat, lon, limit
 * Returns ONLY verified hospitals for the exact city
 */
async function getHospitals(req, res) {
  try {
    const { city, department, lat, lon, limit = 20 } = req.query;

    if (!city || city.trim() === '') {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    // Base query - EXACT city match only (no nearby cities)
    let query = `
      SELECT id, name, city, area, address, latitude, longitude,
             department, phone, rating, beds, is_emergency, created_at
      FROM hospitals
      WHERE is_verified = TRUE
        AND LOWER(TRIM(city)) = LOWER(TRIM(?))
    `;
    const params = [city.trim()];

    // Optional department filter
    if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
      query += ` AND LOWER(department) = LOWER(?)`;
      params.push(department.trim());
    }

    query += ` ORDER BY rating DESC`;

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return res.json({
        success: true,
        count: 0,
        hospitals: [],
        message: `No verified hospitals found in ${city}`,
      });
    }

    // Attach distances if user coordinates provided
    let hospitals = rows;
    if (lat && lon) {
      const userLat = parseFloat(lat);
      const userLon = parseFloat(lon);
      if (!isNaN(userLat) && !isNaN(userLon)) {
        hospitals = attachDistances(rows, userLat, userLon);
        hospitals = sortByDistance(hospitals);
      }
    }

    // Apply limit
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    hospitals = hospitals.slice(0, limitNum);

    return res.json({
      success: true,
      count: hospitals.length,
      city: city.trim(),
      hospitals,
    });
  } catch (err) {
    console.error('getHospitals error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /api/hospitals/:id
 */
async function getHospitalById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT * FROM hospitals WHERE id = ? AND is_verified = TRUE`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    return res.json({ success: true, hospital: rows[0] });
  } catch (err) {
    console.error('getHospitalById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /api/cities - list all cities with verified hospitals
 */
async function getCities(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT city, COUNT(*) as hospital_count
       FROM hospitals
       WHERE is_verified = TRUE
       GROUP BY city
       ORDER BY hospital_count DESC`
    );
    return res.json({ success: true, cities: rows });
  } catch (err) {
    console.error('getCities error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /api/departments
 */
async function getDepartments(req, res) {
  try {
    const [rows] = await pool.execute(`SELECT * FROM departments ORDER BY name`);
    return res.json({ success: true, departments: rows });
  } catch (err) {
    console.error('getDepartments error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getHospitals, getHospitalById, getCities, getDepartments };