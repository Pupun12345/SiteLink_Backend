const express = require('express');
const router = express.Router();
const { getAllPolicies, getSupportContact } = require('../controllers/legalController');
const { protect } = require('../middleware/auth');


router.get('/policies', protect, getAllPolicies);
router.get('/support-contact', protect, getSupportContact);

module.exports = router;