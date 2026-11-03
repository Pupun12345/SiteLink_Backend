const express = require('express');
const { body } = require('express-validator');
const { OTP_LENGTH } = require('../utils/otpUtils');
const { protect } = require('../middleware/auth');
const { otpRequestLimiter, authLimiter } = require('../middleware/rateLimiter');
const {
  getProfile,
  createWorkerProfile,
  createVendorProfile,
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
  .isLength({ min: OTP_LENGTH, max: OTP_LENGTH })
  .withMessage(`OTP must be ${OTP_LENGTH} digits`)
  .isNumeric().withMessage('OTP must contain only numbers');

router.get('/me', protect, getProfile);

// States & Cities (public)
router.get('/states', getStates);
router.get('/cities/:stateId', getCitiesByState);

router.post('/language', protect, languages);
router.get('/skills', protect, getSkills);

// Create profile — JSON body only (Cloudinary URLs from direct upload)
router.post('/create/worker', protect, createWorkerProfile);
router.post('/create/vendor', protect, createVendorProfile);

// Edit profile
router.put('/edit/worker', protect, editWorkerProfile);
router.put('/edit/vendor', protect, editVendorProfile);

// Change phone number — OTP-gated
router.post('/phone/send-otp', protect, otpRequestLimiter, [newPhoneValidation], sendPhoneChangeOtp);
router.post('/phone/verify-otp', protect, authLimiter, [otpValidation], verifyPhoneChangeOtp);

module.exports = router;