const express = require('express');
const router = express.Router();
const { getAppConfig } = require('../controllers/appConfigController');

// Public — app ko login se pehle bhi maintenance notice chahiye hota hai.
router.get('/', getAppConfig);

module.exports = router;
