const express = require('express');
const router = express.Router();
const { getPolicyByType, getPolicyVersions, getPolicyVersion, getAllPolicies, createOrUpdatePolicy, activatePolicyVersion, deletePolicyVersion } = require('../controllers/legalController');
const {authorize} = require('../middleware/auth');

// Public routes - accessible to all users
// Get current version of a policy
router.get('/policies/:policyType', getPolicyByType);

// Get all versions of a specific policy (metadata only)
router.get('/policies/:policyType/versions', getPolicyVersions);

// Get specific version of a policy
router.get(
    '/policies/:policyType/versions/:version',
    getPolicyVersion
);

// Admin routes - require authentication
// Get all active policies (metadata only)
router.get('/policies', authorize, getAllPolicies);

// Create or update a policy (creates new version)
router.post('/policies', authorize, createOrUpdatePolicy);

// Activate a specific policy version
router.put('/policies/:id/activate', authorize, activatePolicyVersion);

// Delete a policy version
router.delete('/policies/:id', authorize, deletePolicyVersion);

module.exports = router;
