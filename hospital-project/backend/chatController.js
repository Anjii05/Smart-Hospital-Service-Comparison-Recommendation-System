const { analyzeSymptomsAI } = require('./hospitalChatService');
const { pool } = require('./config/db');
/**
 * POST /api/chat
 * Body: { message: string, city?: string }
 * Returns AI response + verified hospitals for the suggested department
 */
async function chat(req, res) {
    try {
        const { message, city } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // AI symptom analysis
        const aiResult = analyzeSymptomsAI(message.trim());

        // Fetch verified hospitals for the detected department
        let hospitals = [];
        if (city && city.trim() !== '') {
            const query = `
        SELECT id, name, city, area, address, latitude, longitude,
               department, phone, rating, beds, is_emergency
        FROM hospitals
        WHERE is_verified = TRUE
          AND LOWER(TRIM(city)) = LOWER(TRIM(?))
          AND LOWER(department) = LOWER(?)
        ORDER BY rating DESC
        LIMIT 5
      `;
            const [rows] = await pool.execute(query, [city.trim(), aiResult.department]);
            hospitals = rows;

            // If no hospitals in detected dept, fall back to General in that city
            if (hospitals.length === 0 && aiResult.department !== 'General') {
                const [fallback] = await pool.execute(
                    `SELECT id, name, city, area, address, latitude, longitude,
                  department, phone, rating, beds, is_emergency
           FROM hospitals
           WHERE is_verified = TRUE
             AND LOWER(TRIM(city)) = LOWER(TRIM(?))
             AND department = 'General'
           ORDER BY rating DESC
           LIMIT 5`,
                    [city.trim()]
                );
                hospitals = fallback;
            }
        }

        return res.json({
            success: true,
            reply: aiResult.reply,
            department: aiResult.department,
            urgency: aiResult.urgency,
            confidence: aiResult.confidence,
            disclaimer: aiResult.disclaimer,
            hospitals,
        });
    } catch (err) {
        console.error('chat error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { chat };