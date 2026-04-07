// routes/doctors.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/doctors?hospital_id=X
router.get('/', async (req, res) => {
  const { hospital_id } = req.query;
  try {
    let query = `
      SELECT d.*, GROUP_CONCAT(
        CONCAT(a.day_of_week, ': ', TIME_FORMAT(a.start_time,'%h:%i %p'), '-', TIME_FORMAT(a.end_time,'%h:%i %p'))
        ORDER BY FIELD(a.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
        SEPARATOR ' | '
      ) as schedule
      FROM doctors d
      LEFT JOIN availability a ON a.doctor_id = d.id
    `;
    const params = [];
    if (hospital_id) {
      query += ` WHERE d.hospital_id = ?`;
      params.push(parseInt(hospital_id));
    }
    query += ` GROUP BY d.id ORDER BY d.experience_years DESC`;
    const [doctors] = await db.query(query, params);
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch doctors' });
  }
});

module.exports = router;