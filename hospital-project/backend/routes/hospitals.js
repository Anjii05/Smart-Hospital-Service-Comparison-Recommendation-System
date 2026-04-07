const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

//
// 📏 Distance function (FIXED: returns number)
//
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

//
// 🏥 GET ALL HOSPITALS
//
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;

    let query = "SELECT * FROM hospitals WHERE 1=1";
    let params = [];

    if (city) {
      query += " AND LOWER(city) = ?";
      params.push(city.toLowerCase().trim());
    }

    query += " ORDER BY rating DESC";

    const [results] = await pool.query(query, params);

    res.json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 📍 NEAREST (GET) — MAIN FIXED ROUTE
//
router.get('/nearest', async (req, res) => {
  try {
    const { lat, lng, radius = 25 } = req.query;

    const emergency = req.query.emergency === 'true';

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat & lng required"
      });
    }

    const [results] = await pool.query("SELECT * FROM hospitals");

    let filtered = results.map(h => {
      const distance = getDistance(
        parseFloat(lat),
        parseFloat(lng),
        h.latitude,
        h.longitude
      );

      return { ...h, distance };
    });

    // ✅ FILTER BY RADIUS
    filtered = filtered.filter(h => h.distance <= radius);

    // ✅ EMERGENCY FILTER (if needed)
    if (emergency) {
      filtered = filtered.filter(h => h.emergency === 1);
    }

    // ✅ SORT BY DISTANCE
    filtered.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: filtered.length,
      data: filtered.slice(0, 10) // limit results
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//
// 📍 NEAREST (POST)
//
router.post('/nearest', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude required"
      });
    }

    const [results] = await pool.query("SELECT * FROM hospitals");

    const sorted = results.map(h => ({
      ...h,
      distance: getDistance(lat, lng, h.latitude, h.longitude)
    })).sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: sorted.slice(0, 5)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 🤖 RECOMMENDATIONS
//
router.post('/recommendations', async (req, res) => {
  try {
    const { max_budget, location, priority, treatment } = req.body;

    let query = "SELECT * FROM hospitals WHERE 1=1";
    let params = [];

    if (location) {
      query += " AND LOWER(city) = ?";
      params.push(location.toLowerCase().trim());
    }

    const [results] = await pool.query(query, params);

    const scored = results.map(h => {
      let score = h.rating * 2;

      let b = max_budget || req.body.budget;
      if (b && h.cost && h.cost <= b) score += 5;
      
      if (priority === 'rating') score += h.rating * 3;
      if (priority === 'cost' && h.cost) score += (100000 / h.cost);
      
      // We can improve this score calculation if needed, 
      // but for now let's just make it basic.
      h.recommendation_score = Math.round(score * 10) / 10;

      return { ...h, score };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: scored.slice(0, 5)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// ⚖️ COMPARE HOSPITALS
//
router.post('/compare', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: "No ids provided" });
    }

    // Prepare query for IN clause
    const placeholders = ids.map(() => '?').join(',');
    const query = `SELECT * FROM hospitals WHERE id IN (${placeholders})`;

    const [results] = await pool.query(query, ids);

    res.json({
      success: true,
      data: results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 🏥 GET BY ID
//
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await pool.query(
      "SELECT * FROM hospitals WHERE id = ?",
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found"
      });
    }

    res.json({
      success: true,
      data: results[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;