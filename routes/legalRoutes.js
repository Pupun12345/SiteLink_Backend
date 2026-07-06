const express = require('express');
const router = express.Router();
const { getAllPolicies } = require('../controllers/legalController');
const { protect } = require('../middleware/auth');


router.get('/policies', protect, getAllPolicies);

module.exports = router;