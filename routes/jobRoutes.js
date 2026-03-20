const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} = require('../controllers/jobsController');
const { protect } = require('../middleware/auth');

// GET all jobs
router.get('/', getJobs);

// GET single job
router.get('/:id', getJobById);

// POST create job (protected)
router.post('/', protect, createJob);

// PUT update job (protected)
router.put('/:id', protect, updateJob);

// DELETE job (protected)
router.delete('/:id', protect, deleteJob);

module.exports = router;