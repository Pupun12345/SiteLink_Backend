const express = require('express');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getProfile,
  changePassword,
  createCustomerProfile,
  createWorkerProfile,
  createVendorProfile,
  editCustomerProfile,
  editWorkerProfile,
  editVendorProfile,
  getStates,
  getCitiesByState,
  getSkills,
} = require('../controllers/profileController');

const router = express.Router();

const customerUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
]);

const workerUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'workSamplesPhoto', maxCount: 5 },
  { name: 'experienceCertificate', maxCount: 1 },
  { name: 'governmentID', maxCount: 1 },
]);

const vendorUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'companyLogo', maxCount: 1 },
]);

router.get('/me', protect, getProfile);

// States & Cities (public)
router.get('/states', getStates);
router.get('/cities/:stateId', getCitiesByState);
// router.post('/location/:stateId/:cityId', protect, getLocationByIds);

router.get('/skills', protect, getSkills);

// Create profile
router.post('/create/worker', protect, workerUpload, createWorkerProfile);
router.post('/create/vendor', protect, vendorUpload, createVendorProfile);

// Edit profile
router.put('/edit/worker', protect, workerUpload, editWorkerProfile);
router.put('/edit/vendor', protect, vendorUpload, editVendorProfile);

module.exports = router;