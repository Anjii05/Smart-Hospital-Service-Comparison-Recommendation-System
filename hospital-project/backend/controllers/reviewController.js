const { pool: db } = require('../config/database');

// GET /api/reviews/:hospitalId - Get reviews for a specific hospital
exports.getReviewsByHospital = async (req, res) => {
  const { hospitalId } = req.params;
  const { page = 1, limit = 5 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [reviews] = await db.query(
      `SELECT * FROM reviews WHERE hospital_id = ?
       ORDER BY helpful_count DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [hospitalId, parseInt(limit), offset]
    );

    const [total] = await db.query(
      `SELECT COUNT(*) as count FROM reviews WHERE hospital_id = ?`, [hospitalId]
    );

    const [stats] = await db.query(
      `SELECT 
         AVG(rating) as avg_rating,
         COUNT(*) as total,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews WHERE hospital_id = ?`,
      [hospitalId]
    );

    res.json({
      success: true,
      data: reviews,
      stats: stats[0],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
};

// POST /api/reviews - Add a new review
exports.addReview = async (req, res) => {
  const { hospital_id, reviewer_name, rating, title, comment, treatment_received } = req.body;
  if (!hospital_id || !reviewer_name || !rating) {
    return res.status(400).json({ success: false, error: 'hospital_id, reviewer_name, and rating are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO reviews (hospital_id, reviewer_name, rating, title, comment, treatment_received)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hospital_id, reviewer_name, rating, title, comment, treatment_received]
    );

    // Recalculate hospital rating
    await db.query(
      `UPDATE hospitals h
       SET rating = (SELECT ROUND(AVG(rating),1) FROM reviews WHERE hospital_id = h.id),
           total_reviews = (SELECT COUNT(*) FROM reviews WHERE hospital_id = h.id)
       WHERE id = ?`,
      [hospital_id]
    );

    res.status(201).json({ success: true, message: 'Review submitted successfully', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
};