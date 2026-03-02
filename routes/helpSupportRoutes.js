const express = require('express');
const router = express.Router();
const {
  createSupport,
  getAllSupports,
  getSupportById,
} = require('../controllers/helpSupportController');
const { protect } = require('../middleware/auth');

// public: allow anyone (including unauthenticated) to submit a ticket
router.post('/', createSupport);

// admin routes
router.get('/', protect, getAllSupports);
router.get('/:id', protect, getSupportById);

module.exports = router;
