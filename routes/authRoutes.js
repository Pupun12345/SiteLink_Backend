const express = require('express');
const { body } = require('express-validator');
const {
  register,
  verifyOtp,
  logout,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const phoneValidation = body('phone')
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Please provide a valid 10-digit phone number');

const otpValidation = body('otp')
  .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  .isNumeric().withMessage('OTP must contain only numbers');

// Public routes
router.post('/register', [phoneValidation], register);
router.post('/verify-otp', [phoneValidation, otpValidation], verifyOtp);

// Private routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;