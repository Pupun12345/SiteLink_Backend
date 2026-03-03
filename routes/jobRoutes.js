const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
} = require('../controllers/jobsController');

// GET all jobs
router.get('/', getJobs);

// GET single job
router.get('/:id', getJobById);

module.exports = router;