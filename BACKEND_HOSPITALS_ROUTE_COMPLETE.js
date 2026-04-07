/**
 * HOSPITAL FILTERING - COMPLETE FIXED BACKEND CODE
 * File: backend/routes/hospitals.js
 * 
 * ✅ Features:
 * - Case-insensitive filtering (city, treatment)
 * - Partial match for treatment (LIKE %value%)
 * - Correct numeric filtering for max_cost
 * - Proper boolean handling for emergency
 * - Subquery-based service filtering (no problematic JOINs)
 * - Comprehensive debug logging
 * - Proper error handling
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// GET /api/hospitals - MAIN FILTERING ENDPOINT
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { city, min_rating, max_cost, treatment, emergency } = req.query;

    // Build WHERE clause for hospital-level filters
    let whereConditions = [];
    let params = [];

    // CITY FILTER - Case-insensitive partial match
    if (city && city.trim()) {
      whereConditions.push(`LOWER(h.city) LIKE LOWER(?)`);
      params.push(`%${city.trim()}%`);
    }

    // MIN_RATING FILTER - Numeric comparison
    if (min_rating) {
      const rating = parseFloat(min_rating);
      if (!isNaN(rating)) {
        whereConditions.push(`h.rating >= ?`);
        params.push(rating);
      }
    }

    // EMERGENCY FILTER - Boolean
    if (emergency === 'true') {
      whereConditions.push(`h.emergency_available = TRUE`);
    }

    // Build subquery for service-level filters (max_cost, treatment)
    let serviceSubquery = '';
    if (max_cost || treatment) {
      serviceSubquery = `AND EXISTS (
        SELECT 1 FROM services s WHERE s.hospital_id = h.id`;
      
      // MAX_COST FILTER - Find hospitals with at least one service <= max_cost
      if (max_cost) {
        const cost = parseFloat(max_cost);
        if (!isNaN(cost)) {
          serviceSubquery += ` AND s.cost <= ?`;
          params.push(cost);
        }
      }

      // TREATMENT FILTER - Case-insensitive partial match on service_name
      if (treatment && treatment.trim()) {
        serviceSubquery += ` AND LOWER(s.service_name) LIKE LOWER(?)`;
        params.push(`%${treatment.trim()}%`);
      }

      serviceSubquery += `)`;
    }

    // Build complete query
    let query = `
      SELECT DISTINCT h.*,
        (SELECT MIN(s.cost) FROM services s WHERE s.hospital_id = h.id) AS min_cost,
        (SELECT COUNT(DISTINCT d.id) FROM doctors d WHERE d.hospital_id = h.id AND d.available = TRUE) AS available_doctors,
        (SELECT COUNT(DISTINCT s.id) FROM services s WHERE s.hospital_id = h.id) AS total_services
      FROM hospitals h
      WHERE 1=1
    `;

    if (whereConditions.length > 0) {
      query += ` AND (${whereConditions.join(' AND ')})`;
    }
    
    query += serviceSubquery;
    query += ` ORDER BY h.rating DESC, h.id ASC`;

    // Debug logging
    console.log('\n📋 FILTER QUERY EXECUTION');
    console.log('Query params received:', { city, min_rating, max_cost, treatment, emergency });
    console.log('SQL Query:', query);
    console.log('SQL Params:', params);

    const [hospitals] = await db.query(query, params);

    console.log(`✅ Query executed: Found ${hospitals.length} hospital(s)\n`);

    res.json({
      success: true,
      count: hospitals.length,
      data: hospitals,
      debug: {
        filters_applied: { city, min_rating, max_cost, treatment, emergency },
        query: query,
        params_count: params.length
      }
    });
  } catch (err) {
    console.error('❌ Error in hospitals filter:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to filter hospitals: ' + err.message,
      debug: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// ==========================================
// GET /api/hospitals/:id - SINGLE HOSPITAL DETAILS
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [[hospital]] = await db.query('SELECT * FROM hospitals WHERE id = ?', [id]);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const [doctors] = await db.query('SELECT * FROM doctors WHERE hospital_id = ?', [id]);
    const [services] = await db.query('SELECT * FROM services WHERE hospital_id = ?', [id]);
    const [facilities] = await db.query('SELECT * FROM facilities WHERE hospital_id = ?', [id]);
    const [reviews] = await db.query('SELECT * FROM reviews WHERE hospital_id = ? ORDER BY created_at DESC', [id]);

    res.json({ success: true, data: { ...hospital, doctors, services, facilities, reviews } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// DEBUG ENDPOINTS - FOR TROUBLESHOOTING
// ==========================================

// Get all available cities
router.get('/debug/cities', async (req, res) => {
  try {
    const [cities] = await db.query(`
      SELECT DISTINCT LOWER(city) as city, COUNT(*) as hospital_count
      FROM hospitals
      GROUP BY LOWER(city)
      ORDER BY city ASC
    `);

    res.json({
      success: true,
      message: 'Available cities in database',
      cities: cities.map(c => c.city),
      total: cities.length,
      data: cities
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all available services
router.get('/debug/services', async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT DISTINCT LOWER(service_name) as service_name, COUNT(*) as count, 
             MIN(cost) as min_cost, MAX(cost) as max_cost
      FROM services
      GROUP BY LOWER(service_name)
      ORDER BY service_name ASC
    `);

    res.json({
      success: true,
      message: 'Available services in database (case-insensitive)',
      services: services.map(s => s.service_name),
      total: services.length,
      data: services
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get specific hospital's services
router.get('/debug/hospital/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const [services] = await db.query(`
      SELECT * FROM services WHERE hospital_id = ? ORDER BY cost ASC
    `, [id]);

    res.json({
      success: true,
      hospital_id: id,
      service_count: services.length,
      data: services
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
