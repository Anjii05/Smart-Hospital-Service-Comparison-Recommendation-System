const express = require('express');

// ✅ FIXED DB IMPORT
const db = require('../db');

const { hydrateCity } = require('../services/hydrator');

const router = express.Router();

// ✅ Debug (remove later)
console.log("DB QUERY TYPE:", typeof db.query);

// ✅ Safety check
function ensureDb() {
  if (!db || typeof db.query !== 'function') {
    throw new Error("Database not initialized properly. Check db import.");
  }
}

// ------------------ BASIC UTIL ------------------

function asyncHandler(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

// ------------------ FETCH HOSPITALS ------------------

async function fetchHospitalCards(filters = {}) {
  ensureDb();

  const [rows] = await db.query(`
    SELECT * FROM hospitals
    WHERE is_verified = TRUE
    ORDER BY rating DESC
  `);

  return rows;
}

// ------------------ NEAREST HOSPITAL ------------------

async function fetchNearestHospitals({ lat, lng }) {
  ensureDb();

  const [rows] = await db.query(`
    SELECT *,
    (6371 * acos(
      cos(radians(?)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(?)) +
      sin(radians(?)) * sin(radians(latitude))
    )) AS distance
    FROM hospitals
    WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    ORDER BY distance ASC
    LIMIT 5
  `, [lat, lng, lat]);

  return rows;
}

// ------------------ ROUTES ------------------

// Health check
router.get('/health', asyncHandler(async (req, res) => {
  ensureDb();

  const [[result]] = await db.query('SELECT 1 AS ok');

  res.json({
    success: true,
    db: result.ok === 1 ? 'connected' : 'error'
  });
}));

// Get hospitals
router.get('/hospitals', asyncHandler(async (req, res) => {
  const data = await fetchHospitalCards(req.query);

  res.json({
    success: true,
    count: data.length,
    data
  });
}));

// Get nearest hospitals
router.get('/nearest', asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "lat & lng required" });
  }

  const data = await fetchNearestHospitals({
    lat: Number(lat),
    lng: Number(lng)
  });

  res.json({
    success: true,
    count: data.length,
    data
  });
}));

// ------------------ EXPORT ------------------

module.exports = router;