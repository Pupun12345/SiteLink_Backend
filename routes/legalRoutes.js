const express = require('express');
const router = express.Router();
const {
  getPrivacyPolicy,
  getTermsConditions,
  getAllLegalDocuments,
  createOrUpdateLegalDocument,
  deleteLegalDocument,
} = require('../controllers/legalController');
const { protect } = require('../middleware/auth');

// Public routes - anyone can view these
router.get('/privacy-policy', getPrivacyPolicy);
router.get('/terms-conditions', getTermsConditions);

// Admin routes - protected
router.get('/', protect, getAllLegalDocuments);
router.post('/', protect, createOrUpdateLegalDocument);
router.delete('/:type', protect, deleteLegalDocument);

module.exports = router;
