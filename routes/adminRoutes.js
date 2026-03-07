const express = require('express');
const {
  getPendingWorkers,
  getWorkerDetails,
  verifyWorker,
  rejectWorker,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Admin-only worker verification endpoints
router.get('/workers/pending', protect, adminOnly, getPendingWorkers);
router.get('/workers/:id', protect, adminOnly, getWorkerDetails);
router.put('/workers/:id/verify', protect, adminOnly, verifyWorker);
router.put('/workers/:id/reject', protect, adminOnly, rejectWorker);

module.exports = router;
