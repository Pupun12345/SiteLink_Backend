const express = require('express');
const { body } = require('express-validator');
const upload = require('../middleware/upload');
const { handleUpload } = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { otpRequestLimiter, authLimiter } = require('../middleware/rateLimiter');
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
  languages,
  sendPhoneChangeOtp,
  verifyPhoneChangeOtp,
} = require('../controllers/profileController');

const router = express.Router();

const newPhoneValidation = body('newPhone')
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Please provide a valid 10-digit phone number');

const otpValidation = body('otp')
  .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  .isNumeric().withMessage('OTP must contain only numbers');

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
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'panCardImage', maxCount: 1 },
]);

router.get('/me', protect, getProfile);

// States & Cities (public)
router.get('/states', getStates);
router.get('/cities/:stateId', getCitiesByState);

//Language Route
router.post('/language', protect, languages);

//Skills Route
router.get('/skills', protect, getSkills);

// Create profile
router.post('/create/worker', protect, handleUpload(workerUpload), createWorkerProfile);
router.post('/create/vendor', protect, handleUpload(vendorUpload), createVendorProfile);

// Edit profile
router.put('/edit/worker', protect, handleUpload(workerUpload), editWorkerProfile);
router.put('/edit/vendor', protect, handleUpload(vendorUpload), editVendorProfile);

// Change phone number — OTP-gated (any role)
router.post('/phone/send-otp', protect, otpRequestLimiter, [newPhoneValidation], sendPhoneChangeOtp);
router.post('/phone/verify-otp', protect, authLimiter, [otpValidation], verifyPhoneChangeOtp);

module.exports = router;