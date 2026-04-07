const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Calculate distance in kilometers between two coordinates.
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

// GET /api/hospitals
router.get('/', async (req, res) => {
  const { city, max_cost, treatment, lat, lon } = req.query;

  console.log('Query params:', req.query);

  try {
    const hasLocationFilter = lat !== undefined || lon !== undefined;

    if (hasLocationFilter && (lat === undefined || lon === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Both lat and lon are required together'
      });
    }

    const latitude = lat !== undefined ? Number(lat) : null;
    const longitude = lon !== undefined ? Number(lon) : null;

    if (hasLocationFilter && (Number.isNaN(latitude) || Number.isNaN(longitude))) {
      return res.status(400).json({
        success: false,
        message: 'lat and lon must be valid numbers'
      });
    }

    if (!city && !max_cost && !treatment && !hasLocationFilter) {
      const [topHospitals] = await db.query(
        'SELECT * FROM hospitals ORDER BY rating DESC LIMIT 10'
      );

      return res.json({
        success: true,
        message: 'Top hospitals',
        data: topHospitals
      });
    }

    let query = `
      SELECT h.*
      FROM hospitals h
      WHERE 1=1
    `;
    const params = [];

    if (city) {
      query += ' AND LOWER(h.city) LIKE LOWER(?)';
      params.push(`%${city}%`);
    }

    if (max_cost !== undefined && max_cost !== '') {
      const budgetLimit = Number(max_cost);

      if (Number.isNaN(budgetLimit)) {
        return res.status(400).json({
          success: false,
          message: 'max_cost must be a valid number'
        });
      }

      query += ' AND h.cost <= ?';
      params.push(budgetLimit);
    }

    query += ' ORDER BY h.rating DESC';

    const [results] = await db.query(query, params);

    if (results.length === 0) {
      return res.json({
        success: true,
        message: 'No hospitals found',
        data: []
      });
    }

    let finalResults = results;

    if (hasLocationFilter) {
      finalResults = results.map(hospital => ({
        ...hospital,
        distance: getDistance(
          latitude,
          longitude,
          Number(hospital.latitude),
          Number(hospital.longitude)
        )
      }));
    }

    return res.json({
      success: true,
      count: finalResults.length,
      data: finalResults
    });
  } catch (err) {
    console.error('Error fetching hospitals:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/hospitals/nearest
router.post('/nearest', async (req, res) => {
  const { lat, lon } = req.body;

  if (lat === undefined || lon === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const latitude = Number(lat);
  const longitude = Number(lon);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude must be valid numbers'
    });
  }

  try {
    const [results] = await db.query('SELECT * FROM hospitals');

    const sorted = results
      .map(hospital => ({
        ...hospital,
        distance: getDistance(
          latitude,
          longitude,
          Number(hospital.latitude),
          Number(hospital.longitude)
        )
      }))
      .sort((a, b) => a.distance - b.distance);

    return res.json({
      success: true,
      data: sorted.slice(0, 5)
    });
  } catch (err) {
    console.error('Error fetching nearest hospitals:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/hospitals/recommendations
router.post('/recommendations', async (req, res) => {
  const { budget } = req.body;
  let numericBudget = null;

  if (budget !== undefined && budget !== '') {
    numericBudget = Number(budget);

    if (Number.isNaN(numericBudget)) {
      return res.status(400).json({
        success: false,
        message: 'budget must be a valid number'
      });
    }
  }

  try {
    const [results] = await db.query('SELECT * FROM hospitals');

    const scored = results
      .map(hospital => {
        let score = Number(hospital.rating) * 2;

        if (numericBudget !== null && hospital.cost && Number(hospital.cost) <= numericBudget) {
          score += 5;
        }

        return { ...hospital, score };
      })
      .sort((a, b) => b.score - a.score);

    return res.json({
      success: true,
      data: scored.slice(0, 5)
    });
  } catch (err) {
    console.error('Error generating recommendations:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
