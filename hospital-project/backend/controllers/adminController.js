const { pool } = require('../config/db');

/**
 * Middleware: Check admin secret key
 */
function requireAdmin(req, res, next) {
    const key = req.headers['x-admin-key'] || req.query.adminKey;
    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Invalid admin key' });
    }
    next();
}

/**
 * POST /api/admin/add-hospital
 * Add a new hospital (unverified by default)
 */
async function addHospital(req, res) {
    try {
        const { name, city, area, address, latitude, longitude, department, phone, email, beds, is_emergency } = req.body;

        if (!name || !city || !department) {
            return res.status(400).json({ success: false, message: 'name, city, and department are required' });
        }

        // Check for duplicate
        const [existing] = await pool.execute(
            `SELECT id FROM hospitals WHERE LOWER(name) = LOWER(?) AND LOWER(city) = LOWER(?) AND LOWER(department) = LOWER(?)`,
            [name.trim(), city.trim(), department.trim()]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Hospital already exists with this name, city, and department' });
        }

        const [result] = await pool.execute(
            `INSERT INTO hospitals (name, city, area, address, latitude, longitude, department, phone, email, beds, is_emergency, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [
                name.trim(),
                city.trim(),
                area?.trim() || null,
                address?.trim() || null,
                latitude ? parseFloat(latitude) : null,
                longitude ? parseFloat(longitude) : null,
                department.trim(),
                phone?.trim() || null,
                email?.trim() || null,
                beds ? parseInt(beds) : 0,
                is_emergency ? 1 : 0,
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Hospital added. Pending verification.',
            id: result.insertId,
        });
    } catch (err) {
        console.error('addHospital error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * PUT /api/admin/verify/:id
 * Mark hospital as verified
 */
async function verifyHospital(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.execute(
            `UPDATE hospitals SET is_verified = TRUE WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        return res.json({ success: true, message: 'Hospital verified successfully' });
    } catch (err) {
        console.error('verifyHospital error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * PUT /api/admin/unverify/:id
 * Revoke hospital verification
 */
async function unverifyHospital(req, res) {
    try {
        const { id } = req.params;
        await pool.execute(`UPDATE hospitals SET is_verified = FALSE WHERE id = ?`, [id]);
        return res.json({ success: true, message: 'Hospital unverified' });
    } catch (err) {
        console.error('unverifyHospital error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * DELETE /api/admin/delete/:id
 */
async function deleteHospital(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.execute(`DELETE FROM hospitals WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        return res.json({ success: true, message: 'Hospital deleted' });
    } catch (err) {
        console.error('deleteHospital error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * GET /api/admin/pending
 * List all unverified hospitals
 */
async function getPendingHospitals(req, res) {
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM hospitals WHERE is_verified = FALSE ORDER BY created_at DESC`
        );
        return res.json({ success: true, count: rows.length, hospitals: rows });
    } catch (err) {
        console.error('getPendingHospitals error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * GET /api/admin/all
 * List all hospitals (verified + unverified)
 */
async function getAllHospitals(req, res) {
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM hospitals ORDER BY is_verified DESC, created_at DESC`
        );
        return res.json({ success: true, count: rows.length, hospitals: rows });
    } catch (err) {
        console.error('getAllHospitals error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = {
    requireAdmin,
    addHospital,
    verifyHospital,
    unverifyHospital,
    deleteHospital,
    getPendingHospitals,
    getAllHospitals,
};