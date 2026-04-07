const db = require('../config/db');

// GET /api/hospitals - List all hospitals with optional basic filter
const getAllHospitals = async (req, res) => {
  try {
    const [hospitals] = await db.query(
      `SELECT id, name, city, state, address, phone, image_url, rating, 
              total_reviews, bed_count, established_year, short_description,
              emergency_available, is_verified
       FROM hospitals
       ORDER BY rating DESC`
    );

    // Get min cost for each hospital
    for (let h of hospitals) {
      const [costs] = await db.query(
        `SELECT MIN(min_cost) as starting_cost FROM treatments WHERE hospital_id = ? AND is_available = TRUE`,
        [h.id]
      );
      h.starting_cost = costs[0].starting_cost || 0;
    }

    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (err) {
    console.error('getAllHospitals error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch hospitals' });
  }
};

// GET /api/hospitals/search?city=&treatment=&max_cost=&min_rating=
const searchHospitals = async (req, res) => {
  try {
    const { city, treatment, max_cost, min_rating, sort_by } = req.query;

    let baseQuery = `
      SELECT DISTINCT h.id, h.name, h.city, h.state, h.address, h.phone,
             h.image_url, h.rating, h.total_reviews, h.bed_count,
             h.established_year, h.short_description, h.emergency_available, h.is_verified
      FROM hospitals h
    `;

    const conditions = [];
    const params = [];

    // Join treatments only if treatment or max_cost filter is applied
    if (treatment || max_cost) {
      baseQuery += ` LEFT JOIN treatments t ON t.hospital_id = h.id AND t.is_available = TRUE`;
      if (treatment) {
        conditions.push(`(LOWER(t.name) LIKE LOWER(?) OR LOWER(t.category) LIKE LOWER(?))`);
        params.push(`%${treatment}%`, `%${treatment}%`);
      }
      if (max_cost) {
        conditions.push(`t.min_cost <= ?`);
        params.push(parseFloat(max_cost));
      }
    }

    // Case-insensitive city search (fixes the main bug)
    if (city && city.trim()) {
      conditions.push(`LOWER(TRIM(h.city)) = LOWER(TRIM(?))`);
      params.push(city.trim());
    }

    if (min_rating) {
      conditions.push(`h.rating >= ?`);
      params.push(parseFloat(min_rating));
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ` + conditions.join(' AND ');
    }

    // Sorting
    const sortOptions = {
      rating: 'h.rating DESC',
      cost_asc: 'h.id ASC',
      reviews: 'h.total_reviews DESC',
      name: 'h.name ASC',
    };
    baseQuery += ` ORDER BY ${sortOptions[sort_by] || 'h.rating DESC'}`;

    const [hospitals] = await db.query(baseQuery, params);

    // Attach starting_cost for each result
    for (let h of hospitals) {
      let costQuery = `SELECT MIN(min_cost) as starting_cost FROM treatments WHERE hospital_id = ? AND is_available = TRUE`;
      const costParams = [h.id];
      if (treatment) {
        costQuery = `SELECT MIN(min_cost) as starting_cost FROM treatments WHERE hospital_id = ? AND is_available = TRUE AND (LOWER(name) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))`;
        costParams.push(`%${treatment}%`, `%${treatment}%`);
      }
      const [costs] = await db.query(costQuery, costParams);
      h.starting_cost = costs[0]?.starting_cost || 0;
    }

    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (err) {
    console.error('searchHospitals error:', err);
    res.status(500).json({ success: false, error: 'Failed to search hospitals' });
  }
};

// GET /api/hospitals/cities - Get all available cities
const getCities = async (req, res) => {
  try {
    const [cities] = await db.query(
      `SELECT DISTINCT city, state FROM hospitals ORDER BY city ASC`
    );
    res.json({ success: true, data: cities });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch cities' });
  }
};

// GET /api/hospitals/treatment-categories - Get all treatment categories
const getTreatmentCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT DISTINCT category FROM treatments ORDER BY category ASC`
    );
    res.json({ success: true, data: categories.map(c => c.category) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

// GET /api/hospitals/:id - Full hospital detail
const getHospitalById = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Invalid hospital ID' });
  }

  try {
    // Hospital basic info
    const [hospitals] = await db.query(
      `SELECT * FROM hospitals WHERE id = ?`, [id]
    );
    if (hospitals.length === 0) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    const hospital = hospitals[0];

    // Treatments
    const [treatments] = await db.query(
      `SELECT * FROM treatments WHERE hospital_id = ? ORDER BY category, name`, [id]
    );

    // Doctors with availability
    const [doctors] = await db.query(
      `SELECT d.*, GROUP_CONCAT(
         CONCAT(a.day_of_week, ': ', TIME_FORMAT(a.start_time,'%h:%i %p'), ' - ', TIME_FORMAT(a.end_time,'%h:%i %p'))
         ORDER BY FIELD(a.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
         SEPARATOR ' | '
       ) as availability_schedule
       FROM doctors d
       LEFT JOIN availability a ON a.doctor_id = d.id
       WHERE d.hospital_id = ?
       GROUP BY d.id
       ORDER BY d.experience_years DESC`, [id]
    );

    // Facilities
    const [facilities] = await db.query(
      `SELECT * FROM facilities WHERE hospital_id = ? AND is_available = TRUE ORDER BY name`, [id]
    );

    // Reviews
    const [reviews] = await db.query(
      `SELECT * FROM reviews WHERE hospital_id = ? ORDER BY helpful_count DESC, created_at DESC LIMIT 10`, [id]
    );

    // Rating distribution
    const [ratingDist] = await db.query(
      `SELECT rating, COUNT(*) as count FROM reviews WHERE hospital_id = ? GROUP BY rating ORDER BY rating DESC`, [id]
    );

    res.json({
      success: true,
      data: {
        ...hospital,
        treatments,
        doctors,
        facilities,
        reviews,
        rating_distribution: ratingDist
      }
    });
  } catch (err) {
    console.error('getHospitalById error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch hospital details' });
  }
};

// GET /api/hospitals/compare?ids=1,2,3
const compareHospitals = async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    return res.status(400).json({ success: false, error: 'Please provide hospital IDs' });
  }

  const idList = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  if (idList.length < 2) {
    return res.status(400).json({ success: false, error: 'Please provide at least 2 hospital IDs' });
  }
  if (idList.length > 4) {
    return res.status(400).json({ success: false, error: 'You can compare up to 4 hospitals at a time' });
  }

  try {
    const placeholders = idList.map(() => '?').join(',');

    const [hospitals] = await db.query(
      `SELECT id, name, city, state, address, phone, image_url, rating,
              total_reviews, bed_count, established_year, short_description, emergency_available
       FROM hospitals WHERE id IN (${placeholders})`, idList
    );

    const result = [];
    for (const h of hospitals) {
      const [treatments] = await db.query(
        `SELECT name, category, min_cost, max_cost, success_rate FROM treatments WHERE hospital_id = ? AND is_available = TRUE ORDER BY category`, [h.id]
      );
      const [facilities] = await db.query(
        `SELECT name FROM facilities WHERE hospital_id = ? AND is_available = TRUE`, [h.id]
      );
      const [doctors] = await db.query(
        `SELECT name, specialization, experience_years FROM doctors WHERE hospital_id = ?`, [h.id]
      );
      const [cost] = await db.query(
        `SELECT MIN(min_cost) as min_cost, MAX(max_cost) as max_cost FROM treatments WHERE hospital_id = ? AND is_available = TRUE`, [h.id]
      );

      result.push({
        ...h,
        treatments,
        facilities: facilities.map(f => f.name),
        doctors,
        cost_range: cost[0]
      });
    }

    // Keep original ID order
    result.sort((a, b) => idList.indexOf(a.id) - idList.indexOf(b.id));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('compareHospitals error:', err);
    res.status(500).json({ success: false, error: 'Failed to compare hospitals' });
  }
};

module.exports = {
  getAllHospitals,
  searchHospitals,
  getHospitalById,
  compareHospitals,
  getCities,
  getTreatmentCategories
};