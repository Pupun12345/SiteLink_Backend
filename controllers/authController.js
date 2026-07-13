const User = require('../models/User');
const { sendTokenResponse } = require('../utils/tokenUtils');
const { generateOTP, getOTPExpiry } = require('../utils/otpUtils');
const { validationResult } = require('express-validator');
const BlacklistedToken = require('../models/BlacklistedToken');
const admin = require('../config/firebase');

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

    const otp =
      process.env.NODE_ENV === "production"
        ? generateOTP()
        : "123456";
    const otpExpire = getOTPExpiry();

    // TODO: integrate a real SMS provider and send `otp` there instead of exposing it here.
    const isProduction = process.env.NODE_ENV === 'production';

    const existingUser = await User.findOne({ phone });

    if (existingUser && existingUser.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked....Please Contact SiteLink For More Updates',
      });
    }

    if (existingUser) {
      existingUser.otp = otp;
      existingUser.otpExpire = otpExpire;
      existingUser.otpAttempts = 0;
      await existingUser.save();
      if (!isProduction) console.log(`[DEV ONLY] OTP for +91${phone}: ${otp}`);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to +91' + phone,
        data: { phone, expiresIn: '10 minutes', ...(isProduction ? {} : { otp }) },
      });
    }

    const user = await User.create({ phone, otp, otpExpire, otpAttempts: 0, isPhoneVerified: false });
    if (!isProduction) console.log(`[DEV ONLY] OTP for +91${phone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'Registration successful. OTP sent to +91' + phone,
      data: {
        phone: user.phone,
        expiresIn: '10 minutes',
        ...(isProduction ? {} : { otp }),
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

// @desc    Resend OTP to an existing phone number
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number. Please register first.',
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const otp = isProduction ? generateOTP() : '123456';

    user.otp = otp;
    user.otpExpire = getOTPExpiry();
    user.otpAttempts = 0;
    await user.save();

    if (!isProduction) console.log(`[DEV ONLY] Resent OTP for +91${phone}: ${otp}`);

    // TODO: send `otp` via a real SMS provider in production.
    res.status(200).json({
      success: true,
      message: 'OTP resent to +91' + phone,
      data: { phone, expiresIn: '10 minutes', ...(isProduction ? {} : { otp }) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
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

    const wasAlreadyVerified = user.isPhoneVerified;

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
    if (!user.otpExpire || user.otpExpire < Date.now()) {
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

    sendTokenResponse(user, 200, res, wasAlreadyVerified);
  } catch (error) {
    next(error);
  }
};


// @desc    Google Firebase Authentication
// @route   POST /api/auth/google-login
// @access  Public
exports.googleAuthLogin = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing. Send JSON with Content-Type: application/json' });
    }
    const { firebaseIdToken, deviceToken, deviceType } = req.body;

    if (!firebaseIdToken) {
      return res.status(400).json({ success: false, message: 'Firebase ID token is required' });
    }

    // Decode header without verifying to check algorithm
    try {
      const headerB64 = firebaseIdToken.split('.')[0];
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
      if (header.alg !== 'RS256') {
        return res.status(400).json({ success: false, message: `Invalid token: expected Firebase ID token (RS256) but got ${header.alg}. Do not send your app JWT here.` });
      }
    } catch {
      return res.status(400).json({ success: false, message: 'Malformed token' });
    }

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
    } catch (e) {
      console.error('Firebase token verification failed:', e.code, e.message);
      return res.status(401).json({ success: false, message: `Invalid or expired Firebase token: ${e.code}` });
    }

    const { uid, email, name, picture, firebase: { sign_in_provider } } = decodedToken;

    // Only allow Google sign-in via this endpoint
    if (sign_in_provider !== 'google.com') {
      return res.status(400).json({ success: false, message: 'Only Google sign-in is supported on this endpoint' });
    }

    // Find or create user
    let user = await User.findOne({ firebaseUid: uid });
    const isExist = !!user;

    if (!user) {
      // Check if email already registered via phone auth
      if (email) user = await User.findOne({ email });

      if (user) {
        // Link Google to existing account
        user.firebaseUid = uid;
        user.authProvider = 'google';
      } else {
        // Create new user
        user = new User({
          firebaseUid: uid,
          email,
          name: name || null,
          profileImage: picture || null,
          authProvider: 'google',
          isPhoneVerified: true, // Assume Google accounts are verified(as we dont require any otp verification for google auth)
        });
      }
    }

    // Update device info on every login
    if (deviceToken) user.deviceToken = deviceToken;
    if (deviceType) user.deviceType = deviceType;
    await user.save();

    sendTokenResponse(user, 200, res, isExist);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Server error during Google authentication' });
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

// @desc    Register a vendor (phone + email + password, no OTP)
// @route   POST /api/auth/vendor/register
// @access  Public
exports.vendorRegister = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, email, password } = req.body;

    if (!phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone, email and password are required',
      });
    }

    // Reject if phone or email already in use
    const existing = await User.findOne({ $or: [{ phone }, { email: email.toLowerCase() }] });
    if (existing) {
      const field = existing.phone === phone ? 'phone number' : 'email';
      return res.status(400).json({
        success: false,
        message: `This ${field} is already registered`,
      });
    }

    const user = await User.create({
      name: name || null,
      phone,
      email: email.toLowerCase(),
      password,               // hashed by pre-save hook
      userType: 'vendor',
      authProvider: 'phone',
      isPhoneVerified: false,
      isVerified: false,
      verificationStatus: 'pending',
    });

    // Auto-login after registration. Vendor is 'pending' until an admin verifies.
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Vendor login with phone/email + password
// @route   POST /api/auth/vendor/login
// @access  Public
exports.vendorLogin = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or phone, and password',
      });
    }

    const query = email ? { email: email.toLowerCase() } : { phone };
    const user = await User.findOne(query).select('+password');

    // Same generic message whether the account is missing or the password is wrong
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.userType !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'This account is not a vendor account. Please use the correct login.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res, true);
  } catch (error) {
    next(error);
  }
};

// @desc    List vendors awaiting verification
// @route   GET /api/auth/admin/vendors/pending
// @access  Private (admin only)
exports.getPendingVendors = async (req, res, next) => {
  try {
    const vendors = await User.find({ userType: 'vendor', verificationStatus: 'pending' })
      .select('name phone email companyName gstNumber panNumber city workState createdAt verificationStatus isVerified')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: vendors.length, data: vendors });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify (approve) a vendor
// @route   PUT /api/auth/admin/vendors/:id/verify
// @access  Private (admin only)
exports.verifyVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.userType !== 'vendor') {
      return res.status(400).json({ success: false, message: 'This user is not a vendor' });
    }

    user.isVerified = true;
    user.verificationStatus = 'verified';
    user.verificationReviewedAt = new Date();
    user.verificationRejectedReason = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Vendor verified successfully',
      data: { id: user._id, verificationStatus: user.verificationStatus, isVerified: user.isVerified },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a vendor's verification
// @route   PUT /api/auth/admin/vendors/:id/reject
// @access  Private (admin only)
exports.rejectVendor = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.userType !== 'vendor') {
      return res.status(400).json({ success: false, message: 'This user is not a vendor' });
    }

    user.isVerified = false;
    user.verificationStatus = 'rejected';
    user.verificationReviewedAt = new Date();
    user.verificationRejectedReason = reason || null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Vendor verification rejected',
      data: { id: user._id, verificationStatus: user.verificationStatus, verificationRejectedReason: user.verificationRejectedReason },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vendor forgot password — send an OTP to the registered phone
// @route   POST /api/auth/vendor/forgot-password
// @access  Public
exports.vendorForgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;

    const user = await User.findOne({ phone, userType: 'vendor' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No vendor account found with this phone number' });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const otp = isProduction ? generateOTP() : '123456';

    user.otp = otp;
    user.otpExpire = getOTPExpiry();
    user.otpAttempts = 0;
    await user.save();

    if (!isProduction) console.log(`[DEV ONLY] Password-reset OTP for +91${phone}: ${otp}`);

    // TODO: send `otp` via a real SMS provider in production.
    res.status(200).json({
      success: true,
      message: 'OTP sent to +91' + phone,
      data: { phone, expiresIn: '10 minutes', ...(isProduction ? {} : { otp }) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vendor reset password using the OTP
// @route   POST /api/auth/vendor/reset-password
// @access  Public
exports.vendorResetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Phone, OTP and new password are required' });
    }

    const user = await User.findOne({ phone, userType: 'vendor' }).select('+otp +otpExpire +otpAttempts +password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No vendor account found with this phone number' });
    }

    if (!user.otp) {
      return res.status(400).json({ success: false, message: 'No active OTP. Please request a new one.' });
    }

    if (user.otp !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;

      if (user.otpAttempts >= 3) {
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpAttempts = 0;
        await user.save();
        return res.status(400).json({ success: false, message: 'Maximum OTP attempts reached. Please request a new OTP.' });
      }

      await user.save();
      return res.status(400).json({ success: false, message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.` });
    }

    if (!user.otpExpire || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Valid OTP — set the new password (hashed by the pre-save hook) and clear OTP.
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    next(error);
  }
};
