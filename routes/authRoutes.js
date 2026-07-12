const express = require('express');
const { body } = require('express-validator');
const {
  register,
  verifyOtp,
  logout,
  getMe,
  googleAuthLogin,
  vendorRegister,
  vendorLogin,
  getPendingVendors,
  verifyVendor,
  rejectVendor,
} = require('../controllers/authController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const phoneValidation = body('phone')
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Please provide a valid 10-digit phone number');

const otpValidation = body('otp')
  .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  .isNumeric().withMessage('OTP must contain only numbers');

const emailValidation = body('email')
  .isEmail().withMessage('Please provide a valid email');

const passwordValidation = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters');

// ---- Worker / customer: phone + OTP ----
router.post('/register', [phoneValidation], register);
router.post('/verify-otp', [phoneValidation, otpValidation], verifyOtp);
router.post('/google-login', googleAuthLogin);

// ---- Vendor: phone + email + password (no OTP) ----
router.post('/vendor/register', [phoneValidation, emailValidation, passwordValidation], vendorRegister);
router.post('/vendor/login', vendorLogin);

// ---- Admin: vendor verification management ----
router.get('/admin/vendors/pending', protect, requireAdmin, getPendingVendors);
router.put('/admin/vendors/:id/verify', protect, requireAdmin, verifyVendor);
router.put('/admin/vendors/:id/reject', protect, requireAdmin, rejectVendor);

// ---- Common private routes ----
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
