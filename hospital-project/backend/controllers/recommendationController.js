const { pool: db } = require('../config/database');

// Smart recommendation algorithm
// POST /api/recommendations
const getRecommendations = async (req, res) => {
  try {
    const {
      city,
      treatment,
      budget,         // max budget
      min_rating = 3,
      priority = 'balanced'  // 'cost', 'rating', 'balanced'
    } = req.body;

    if (!city && !treatment) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least a city or treatment to get recommendations'
      });
    }

    // Base query - fetch candidates
    let query = `
      SELECT DISTINCT h.id, h.name, h.city, h.state, h.image_url,
             h.rating, h.total_reviews, h.bed_count, h.short_description,
             h.emergency_available, h.is_verified
      FROM hospitals h
      LEFT JOIN treatments t ON t.hospital_id = h.id AND t.is_available = TRUE
      WHERE h.rating >= ?
    `;
    const params = [parseFloat(min_rating)];

    if (city) {
      query += ` AND LOWER(TRIM(h.city)) = LOWER(TRIM(?))`;
      params.push(city.trim());
    }
    if (treatment) {
      query += ` AND (LOWER(t.name) LIKE LOWER(?) OR LOWER(t.category) LIKE LOWER(?))`;
      params.push(`%${treatment}%`, `%${treatment}%`);
    }
    if (budget) {
      query += ` AND t.min_cost <= ?`;
      params.push(parseFloat(budget));
    }

    const [candidates] = await db.query(query, params);

    if (candidates.length === 0) {
      return res.json({
        success: true,
        message: 'No hospitals found matching your criteria. Try relaxing some filters.',
        data: []
      });
    }

    // Enrich with scoring data
    const scored = [];
    for (const h of candidates) {
      const [costData] = await db.query(
        `SELECT MIN(min_cost) as min_cost, COUNT(*) as treatment_count
         FROM treatments WHERE hospital_id = ? AND is_available = TRUE`,
        [h.id]
      );
      const [doctorCount] = await db.query(
        `SELECT COUNT(*) as count FROM doctors WHERE hospital_id = ?`, [h.id]
      );
      const [facilityCount] = await db.query(
        `SELECT COUNT(*) as count FROM facilities WHERE hospital_id = ? AND is_available = TRUE`, [h.id]
      );

      const minCost = costData[0]?.min_cost || 999999;
      const numDoctors = doctorCount[0]?.count || 0;
      const numFacilities = facilityCount[0]?.count || 0;
      const numTreatments = costData[0]?.treatment_count || 0;

      // Scoring algorithm (0-100)
      const ratingScore = (h.rating / 5) * 35;        // Up to 35 points for rating
      const reviewScore = Math.min(h.total_reviews / 5000, 1) * 15; // Up to 15 for volume

      let costScore = 0;
      if (budget && minCost > 0) {
        // Higher score if cost is significantly below budget
        costScore = Math.min(((budget - minCost) / budget), 1) * 25;
      } else {
        costScore = 15; // neutral if no budget given
      }

      const facilityScore = Math.min(numFacilities / 10, 1) * 15; // Up to 15 for facilities
      const doctorScore = Math.min(numDoctors / 5, 1) * 10;       // Up to 10 for doctors

      let totalScore = ratingScore + reviewScore + costScore + facilityScore + doctorScore;

      // Adjust by priority preference
      if (priority === 'cost' && budget) {
        totalScore += costScore * 0.5; // Boost cost factor
      } else if (priority === 'rating') {
        totalScore += ratingScore * 0.5; // Boost rating factor
      }

      // Bonus for verified hospitals
      if (h.is_verified) totalScore += 3;

      // Reason generation
      const reasons = [];
      if (h.rating >= 4.5) reasons.push(`Highly rated at ${h.rating}★`);
      if (h.total_reviews >= 1000) reasons.push(`${h.total_reviews.toLocaleString()} verified reviews`);
      if (budget && minCost <= budget * 0.7) reasons.push(`Cost well within your budget`);
      if (numDoctors >= 3) reasons.push(`${numDoctors} specialist doctors`);
      if (h.emergency_available) reasons.push('24/7 Emergency available');
      if (numFacilities >= 6) reasons.push(`${numFacilities} world-class facilities`);

      scored.push({
        ...h,
        starting_cost: minCost === 999999 ? 0 : minCost,
        treatment_count: numTreatments,
        doctor_count: numDoctors,
        facility_count: numFacilities,
        recommendation_score: Math.round(totalScore),
        match_reasons: reasons.slice(0, 4),
      });
    }

    // Sort by score descending
    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);

    // Return top 6
    const recommendations = scored.slice(0, 6);

    // Add rank
    recommendations.forEach((h, i) => {
      h.rank = i + 1;
    });

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
      filters_applied: { city, treatment, budget, min_rating, priority }
    });
  } catch (err) {
    console.error('getRecommendations error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
};

module.exports = { getRecommendations };