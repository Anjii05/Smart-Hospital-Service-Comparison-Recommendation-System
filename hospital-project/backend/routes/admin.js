const express = require('express');
const router = express.Router();
const {
    requireAdmin,
    addHospital,
    verifyHospital,
    unverifyHospital,
    deleteHospital,
    getPendingHospitals,
    getAllHospitals,
} = require('../controllers/adminController');

// All admin routes require the admin key
router.use(requireAdmin);

router.post('/add-hospital', addHospital);
router.put('/verify/:id', verifyHospital);
router.put('/unverify/:id', unverifyHospital);
router.delete('/delete/:id', deleteHospital);
router.get('/pending', getPendingHospitals);
router.get('/all', getAllHospitals);

module.exports = router;