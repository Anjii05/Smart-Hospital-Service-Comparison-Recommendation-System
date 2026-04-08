const { analyzeSymptomsAI, DEPARTMENT_SEARCH_TERMS } = require('./services/chatService');
const { pool } = require('./config/database');
/**
 * POST /api/chat
 * Body: { message: string, city?: string }
 * Returns AI response + verified hospitals for the suggested department
 */
function buildDepartmentFilter(department) {
  return DEPARTMENT_SEARCH_TERMS[department] || DEPARTMENT_SEARCH_TERMS.General;
}

function hospitalMatchesDepartment(hospital, terms) {
  const haystack = [
    hospital.name,
    hospital.city,
    hospital.state,
    hospital.location,
    hospital.description,
    hospital.treatments
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

async function findHospitals({ department, city }) {
  const terms = buildDepartmentFilter(department);
  const queryParams = [];
  let cityClause = '';

  if (city && city.trim()) {
    cityClause = ' WHERE LOWER(h.city) = LOWER(?)';
    queryParams.push(city.trim());
  }

  const query = `
    SELECT
      h.id,
      h.name,
      h.city,
      h.state,
      h.location,
      h.latitude,
      h.longitude,
      h.rating,
      h.cost,
      h.description,
      h.treatments,
      (SELECT MIN(t.cost) FROM treatments t WHERE t.hospital_id = h.id) AS min_treatment_cost,
      (SELECT COUNT(*) FROM doctors d WHERE d.hospital_id = h.id) AS total_doctors,
      (SELECT COUNT(*) FROM doctors d WHERE d.hospital_id = h.id AND COALESCE(d.available, 1) = 1) AS available_doctors,
      (SELECT COUNT(*) FROM treatments t WHERE t.hospital_id = h.id) AS treatment_count,
      (SELECT COUNT(*) FROM reviews r WHERE r.hospital_id = h.id) AS review_count
    FROM hospitals h
    ${cityClause}
    ORDER BY h.rating DESC, h.name ASC
    LIMIT 50
  `;

  const [rows] = await pool.execute(query, queryParams);
  return rows
    .filter((hospital) => hospitalMatchesDepartment(hospital, terms))
    .slice(0, 5);
}

async function chat(req, res) {
    try {
        const { message, city } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // AI symptom analysis
        const aiResult = analyzeSymptomsAI(message.trim());

        // Fetch hospitals for the detected department
        let hospitals = [];
        try {
            hospitals = await findHospitals({ department: aiResult.department, city });
        } catch (lookupError) {
            console.error('chat hospital lookup error:', lookupError.message);
        }

        if (hospitals.length === 0 && aiResult.department !== 'General') {
            try {
                hospitals = await findHospitals({ department: 'General', city });
            } catch (fallbackError) {
                console.error('chat fallback lookup error:', fallbackError.message);
            }
        }

        return res.json({
            success: true,
            reply: aiResult.reply,
            department: aiResult.department,
            urgency: aiResult.urgency,
            confidence: aiResult.confidence,
            disclaimer: aiResult.disclaimer,
            hospitals: hospitals.map((hospital) => ({
                ...hospital,
                department: aiResult.department,
            })),
        });
    } catch (err) {
        console.error('chat error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { chat };
