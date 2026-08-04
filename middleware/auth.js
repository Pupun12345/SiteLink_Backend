const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // CHECK IF TOKEN IS BLACKLISTED
    const blacklisted = await BlacklistedToken.findOne({ token });

    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been logged out',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // Get regular user
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked....Please Contact SiteLink Support For More Updates".',
        isBlocked: true,
      });
    }

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};


// Same as `protect` but never blocks the request — decodes the token if
// present/valid and sets req.user, otherwise proceeds as anonymous. Used on
// routes that are publicly browsable but want to personalize the response
// (e.g. GET /api/jobs marking which jobs the logged-in worker already applied to).
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isBlocked) {
      req.user = user;
    }
  } catch (error) {
    // Invalid/expired token — proceed as anonymous, don't block browsing.
  }

  next();
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// Require the logged-in user to be an admin.
// Uses userType (not role — role gets overwritten with the user's skill/designation
// during profile creation, so it cannot be trusted for authorization).
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

exports.applicable = async (req, res, next) => {
  const {id:applicantId}=req.user;

  const user=await User.findById(applicantId);

  if(user.userType!=='worker' || user.verificationStatus!=='verified'){
    return res.status(403).json({
      success: false,
      message: 'Not allow to apply to job',
    });
  }
  next();
}
