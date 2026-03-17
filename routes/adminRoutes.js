const express = require('express');
const {
  getPendingWorkers,
  getWorkerDetails,
  verifyWorker,
  rejectWorker,
  getPendingVendors,
  getVendors,
  getVendorDetails,
  verifyVendor,
  rejectVendor,
  rateVendor,
  getAllUsers,
  getUserDetails,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Admin-only user management
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/users/:id', protect, adminOnly, getUserDetails);

// Admin-only worker verification endpoints
router.get('/workers/pending', protect, adminOnly, getPendingWorkers);
router.put('/workers/:id/verify', protect, adminOnly, verifyWorker);
router.put('/workers/:id/reject', protect, adminOnly, rejectWorker);
router.get('/workers/:id', protect, adminOnly, getWorkerDetails);

// Admin-only vendor verification endpoints
router.get('/vendors/pending', protect, adminOnly, getPendingVendors);
router.put('/vendors/:id/verify', protect, adminOnly, verifyVendor);
router.put('/vendors/:id/reject', protect, adminOnly, rejectVendor);
router.put('/vendors/:id/rate', protect, adminOnly, rateVendor);
router.get('/vendors/:id', protect, adminOnly, getVendorDetails);
router.get('/vendors', protect, adminOnly, getVendors);

module.exports = router;
