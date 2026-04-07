const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { message } = req.body;

    res.json({
        success: true,
        reply: `You said: ${message}`
    });
});

module.exports = router;