const express = require('express');
const {
  getPendingWorkers,
  getWorkerDetails,
  verifyWorker,
  rejectWorker,
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
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Dashboard overview
router.get('/dashboard', getDashboardStats);

// Admin-only worker verification endpoints
router.get('/workers/pending', getPendingWorkers);
router.get('/workers/:id', getWorkerDetails);
router.put('/workers/:id/verify', verifyWorker);
router.put('/workers/:id/reject', rejectWorker);

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
