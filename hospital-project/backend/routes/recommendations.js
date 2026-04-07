const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.json({ message: "Recommendations working ✅" });
});

module.exports = router;   // ✅ THIS LINE IS IMPORTANT