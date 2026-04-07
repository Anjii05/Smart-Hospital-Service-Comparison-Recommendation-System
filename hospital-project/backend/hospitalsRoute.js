// =============================================================
//  hospitalsRoute.js  –  Complete fixed hospital filter API
//  Drop this into your Express app:  app.use('/api', hospitalsRouter)
// =============================================================

const express = require('express');
const router  = express.Router();
const db      = require('./db');          // your mysql2/promise pool

// ─── Spell-correction map ─────────────────────────────────────
// Catches common frontend typos before they hit the DB
const TREATMENT_ALIASES = {
  'cardic':          'Cardiology',
  'cardiac':         'Cardiology',
  'cardiology':      'Cardiology',
  'neuro':           'Neurology',
  'neurology':       'Neurology',
  'ortho':           'Orthopedics',
  'orthopedic':      'Orthopedics',
  'orthopedics':     'Orthopedics',
  'onco':            'Oncology',
  'oncology':        'Oncology',
  'pedia':           'Pediatrics',
  'pediatric':       'Pediatrics',
  'pediatrics':      'Pediatrics',
  'gyno':            'Gynecology',
  'gynecology':      'Gynecology',
  'gynaecology':     'Gynecology',
  'general':         'General',
  'ent':             'ENT',
  'skin':            'Dermatology',
  'dermatology':     'Dermatology',
  'urology':         'Urology',
  'gastro':          'Gastroenterology',
  'gastroenterology':'Gastroenterology',
  'ophthalmology':   'Ophthalmology',
  'eye':             'Ophthalmology',
  'psychiatry':      'Psychiatry',
  'pulmonology':     'Pulmonology',
  'lung':            'Pulmonology',
};

function normalizeTreatment(raw) {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return TREATMENT_ALIASES[key] || raw.trim();   // return corrected or original
}

function normalizeCity(raw) {
  if (!raw) return null;
  return raw.trim();   // trimmed; SQL handles case-insensitivity via LOWER()
}

function normalizeEmergency(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (raw === true  || raw === 1 || String(raw).toLowerCase() === 'true'  || raw === '1' || raw === 'yes') return 1;
  if (raw === false || raw === 0 || String(raw).toLowerCase() === 'false' || raw === '0' || raw === 'no')  return 0;
  return null;   // "Any" or unrecognised → skip filter
}

// =============================================================
//  GET /api/hospitals
//  Query params: city, max_cost, treatment, emergency, min_rating
// =============================================================
router.get('/hospitals', async (req, res) => {
  try {
    // ── 1. Read & normalise every param ──────────────────────
    const city      = normalizeCity(req.query.city);
    const maxCost   = req.query.max_cost   ? parseFloat(req.query.max_cost)   : null;
    const minRating = req.query.min_rating ? parseFloat(req.query.min_rating) : null;
    const treatment = normalizeTreatment(req.query.treatment);
    const emergency = normalizeEmergency(req.query.emergency);

    // ── 2. Build WHERE clauses dynamically ───────────────────
    const conditions = [];
    const values     = [];

    if (city) {
      // Case-insensitive partial match  →  "davangere" matches "Davangere"
      conditions.push('LOWER(h.city) LIKE LOWER(?)');
      values.push(`%${city}%`);
    }

    if (maxCost !== null && !isNaN(maxCost)) {
      // Numeric column – straight comparison, no quoting issues
      conditions.push('h.cost_per_day <= ?');
      values.push(maxCost);
    }

    if (minRating !== null && !isNaN(minRating)) {
      conditions.push('h.rating >= ?');
      values.push(minRating);
    }

    if (treatment) {
      // LIKE on a comma-separated column  →  "%Cardiology%" hits "General,Cardiology,Neurology"
      conditions.push('LOWER(h.treatments) LIKE LOWER(?)');
      values.push(`%${treatment}%`);
    }

    if (emergency !== null) {
      conditions.push('h.emergency = ?');
      values.push(emergency);
    }

    const WHERE = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // ── 3. Final SQL ──────────────────────────────────────────
    const sql = `
      SELECT
        h.id,
        h.name,
        h.city,
        h.address,
        h.phone,
        h.rating,
        h.cost_per_day,
        h.treatments,
        h.emergency,
        h.latitude,
        h.longitude
      FROM hospitals h
      ${WHERE}
      ORDER BY h.rating DESC
    `;

    // ── 4. Debug logging (remove in production) ───────────────
    console.log('\n─── Hospital Query Debug ───────────────────');
    console.log('SQL :', sql.replace(/\s+/g, ' ').trim());
    console.log('Vals:', values);
    console.log('────────────────────────────────────────────\n');

    // ── 5. Execute ────────────────────────────────────────────
    const [rows] = await db.execute(sql, values);

    console.log(`✅  Rows returned: ${rows.length}`);

    return res.json({ success: true, count: rows.length, data: rows });

  } catch (err) {
    console.error('❌  /api/hospitals error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// =============================================================
//  GET /api/hospitals/debug-db
//  Sanity-check endpoint – shows distinct cities, treatments etc.
//  Remove or protect this route in production.
// =============================================================
router.get('/hospitals/debug-db', async (req, res) => {
  try {
    const [cities]     = await db.execute('SELECT DISTINCT city     FROM hospitals ORDER BY city');
    const [treatments] = await db.execute('SELECT DISTINCT treatments FROM hospitals');
    const [costRange]  = await db.execute('SELECT MIN(cost_per_day) AS min_cost, MAX(cost_per_day) AS max_cost FROM hospitals');
    const [emStates]   = await db.execute('SELECT DISTINCT emergency FROM hospitals');

    return res.json({
      cities:     cities.map(r => r.city),
      treatments: treatments.map(r => r.treatments),   // raw strings from DB
      costRange:  costRange[0],
      emergency:  emStates.map(r => r.emergency),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
