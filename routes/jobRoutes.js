const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobDetailsById,
  applyToJob,
  appliedJobs,
} = require('../controllers/jobsController');
const { protect,applicable } = require('../middleware/auth');

// GET all jobs
router.get('/', getJobs);

// GET single job
router.get('/:id', getJobDetailsById);

// POST apply to job (protected)
router.post('/:id/apply', protect,applicable, applyToJob);

router.post("/:id/getAppliedJobs", protect, appliedJobs);

module.exports = router;