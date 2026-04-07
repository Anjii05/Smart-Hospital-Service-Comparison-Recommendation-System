const db = require('../config/db');

/**
 * API Key Authentication Middleware
 * Validates X-API-Key header against database
 * Attaches user info to req.apiKey for logging/auditing
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API Key required. Please provide X-API-Key header.'
      });
    }

    // Query database for API key
    const [[keyRecord]] = await db.query(
      'SELECT * FROM api_keys WHERE api_key = ? AND is_active = TRUE',
      [apiKey]
    );

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive API key'
      });
    }

    // Attach key info to request for logging/auditing
    req.apiKeyInfo = {
      key: apiKey,
      app_name: keyRecord.app_name,
      created_by: keyRecord.created_by,
      created_at: keyRecord.created_at
    };

    // Log API usage
    console.log(`✅ API Access: ${keyRecord.app_name} | Route: ${req.method} ${req.path}`);

    next();
  } catch (err) {
    console.error('API Key Auth Error:', err);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

module.exports = apiKeyAuth;
