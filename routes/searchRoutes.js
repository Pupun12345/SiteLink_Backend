const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  searchWorkers,
  searchVendors,
  searchJobs,
  searchSupport,
  globalSearch,
  getWorkerFilters,
  getVendorFilters,
  getJobFilters,
} = require('../controllers/searchController');

// Search routes
router.get('/workers', searchWorkers);
router.get('/vendors', searchVendors);
router.get('/jobs', searchJobs);
router.get('/support', protect, authorize('admin'), searchSupport);
router.get('/global', globalSearch);

// Filter options routes
router.get('/workers/filters', getWorkerFilters);
router.get('/vendors/filters', getVendorFilters);
router.get('/jobs/filters', getJobFilters);

module.exports = router;
