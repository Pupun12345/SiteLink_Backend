const express = require('express');
const router = express.Router();
const { getAllPolicies, getSupportContact } = require('../controllers/legalController');
const { protect } = require('../middleware/auth');


// Public — Terms/Privacy signup se PEHLE padhne milne chahiye (login screen
// ka "By continuing you agree to..." wahi se khulta hai), aur Play Store bhi
// publicly accessible privacy policy maangta hai.
router.get('/policies', getAllPolicies);

router.get('/support-contact', protect, getSupportContact);

module.exports = router;