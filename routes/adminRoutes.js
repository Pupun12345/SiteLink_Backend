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
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getTotalWorkers,
  getTotalVendors,
  getPendingVerifications,
  getSubscriptions,
  getRevenue,
  getActiveRequirements,
  getDashboardStats,
  verifyUser,
  getAllUsers,
} = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Dashboard overview
router.get('/dashboard', getDashboardStats);

// Stats routes
router.get('/stats/workers', getTotalWorkers);
router.get('/stats/vendors', getTotalVendors);
router.get('/stats/requirements', getActiveRequirements);

// Verification routes
router.get('/verifications', getPendingVerifications);
router.put('/verify/:userId', verifyUser);

// Subscription routes
router.get('/subscriptions', getSubscriptions);

// Revenue routes
router.get('/revenue', getRevenue);

// User management routes
router.get('/users', getAllUsers);

module.exports = router;
