const express = require('express');
const router = express.Router();

// Get reviews
router.get('/:hospitalId', (req, res) => {
  res.json([
    {
      hospitalId: req.params.hospitalId,
      user: "Test User",
      rating: 4,
      comment: "Good hospital"
    }
  ]);
});

// Add review
router.post('/', (req, res) => {
  res.json({
    message: "Review added successfully",
    data: req.body
  });
});

module.exports = router;