const User = require('../models/User');
const { sendTokenResponse, generateToken } = require('../utils/tokenUtils');
const { generateOTP, getOTPExpiry } = require('../utils/otpUtils');
const { validationResult } = require('express-validator');
const BlacklistedToken = require('../models/BlacklistedToken');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { phone } = req.body;


    // Check if user already exists
    const userExists = await User.findOne({ phone });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this phone number',
        isExist:true,
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpire = getOTPExpiry();


    // Create user data object
    const userData = {
      phone,
      otp,
      otpExpire,
      otpAttempts: 0,
      isPhoneVerified: false,
    };


    // Create user with OTP (not verified yet)
    const user = await User.create(userData);
    console.log(`OTP for +91${phone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'Registration successful. OTP sent to +91' + phone,
      data: {
        phone: user.phone,
        otp: otp,
        expiresIn: '10 minutes',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // Validate phone & OTP
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number and OTP',
      });
    }

    // Find user with OTP and phone
    const user = await User.findOne({ phone }).select('+otp +otpExpire +otpAttempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      // Increment OTP attempts
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      // Check if max attempts reached
      if (user.otpAttempts >= 3) {
        // Clear OTP and require resend
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpAttempts = 0;
        await user.save();

        return res.status(400).json({
          success: false,
          message: 'Maximum OTP attempts reached. Please request a new OTP.',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`,
      });
    }

    // Check if OTP has expired
    if (user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify user and clear OTP fields
    user.isPhoneVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};


// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
      });
    }

    // Save token to blacklist
    await BlacklistedToken.create({ token });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
