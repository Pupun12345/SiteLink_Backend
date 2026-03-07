const User = require('../models/User');

// Get list of workers pending document verification
exports.getPendingWorkers = async (req, res) => {
  try {
    const workers = await User.find({
      userType: 'worker',
      verificationStatus: 'pending',
    }).select('name phone role experience city profileImage verificationStatus');

    return res.json({
      success: true,
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    console.error('getPendingWorkers error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get worker details (for verification screen)
exports.getWorkerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await User.findById(id).select(
      'name age phone experience city dailyRate profileImage aadhaarFrontImage aadhaarBackImage certificates verificationStatus isVerified skills'
    );

    if (!worker || worker.userType !== 'worker') {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    return res.json({ success: true, data: worker });
  } catch (error) {
    console.error('getWorkerDetails error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify worker documents
exports.verifyWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await User.findById(id);

    if (!worker || worker.userType !== 'worker') {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    worker.verificationStatus = 'verified';
    worker.isVerified = true;
    worker.verificationRejectedReason = null;
    worker.verificationReviewedAt = new Date();

    await worker.save({ validateModifiedOnly: true });

    // TODO: send notification to worker (email/SMS)

    return res.json({
      success: true,
      message: 'Worker verified successfully',
      data: {
        id: worker._id,
        verificationStatus: worker.verificationStatus,
        isVerified: worker.isVerified,
      },
    });
  } catch (error) {
    console.error('verifyWorker error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reject worker verification with a reason
exports.rejectWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const worker = await User.findById(id);

    if (!worker || worker.userType !== 'worker') {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    worker.verificationStatus = 'rejected';
    worker.isVerified = false;
    worker.verificationRejectedReason = reason.trim();
    worker.verificationReviewedAt = new Date();

    await worker.save({ validateModifiedOnly: true });

    // TODO: send notification to worker (email/SMS) with rejection reason

    return res.json({
      success: true,
      message: 'Worker verification rejected',
      data: {
        id: worker._id,
        verificationStatus: worker.verificationStatus,
        rejectionReason: worker.verificationRejectedReason,
      },
    });
  } catch (error) {
    console.error('rejectWorker error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Requirement = require('../models/Requirement');

// @desc    Get total workers count
// @route   GET /api/admin/stats/workers
// @access  Private/Admin
exports.getTotalWorkers = async (req, res) => {
  try {
    const totalWorkers = await User.countDocuments({ userType: 'worker' });
    
    // Additional stats
    const verifiedWorkers = await User.countDocuments({ 
      userType: 'worker', 
      isVerified: true 
    });
    
    const newWorkersThisMonth = await User.countDocuments({
      userType: 'worker',
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalWorkers,
        verified: verifiedWorkers,
        newThisMonth: newWorkersThisMonth,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching worker stats',
      error: error.message,
    });
  }
};

// @desc    Get total vendors count
// @route   GET /api/admin/stats/vendors
// @access  Private/Admin
exports.getTotalVendors = async (req, res) => {
  try {
    const totalVendors = await User.countDocuments({ userType: 'vendor' });
    
    // Additional stats
    const verifiedVendors = await User.countDocuments({ 
      userType: 'vendor', 
      isVerified: true 
    });
    
    const newVendorsThisMonth = await User.countDocuments({
      userType: 'vendor',
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalVendors,
        verified: verifiedVendors,
        newThisMonth: newVendorsThisMonth,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendor stats',
      error: error.message,
    });
  }
};

// @desc    Get pending verifications
// @route   GET /api/admin/verifications?status=pending
// @access  Private/Admin
exports.getPendingVerifications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    // Filter by verification status
    if (status === 'pending') {
      filter.isVerified = false;
      filter.$or = [
        { userType: 'worker', aadhaarNumber: { $ne: null } },
        { userType: 'vendor', gstNumber: { $ne: null } },
        { userType: 'vendor', panNumber: { $ne: null } }
      ];
    } else if (status === 'verified') {
      filter.isVerified = true;
    }
    
    const skip = (page - 1) * limit;
    
    const verifications = await User.find(filter)
      .select('name phone email userType isVerified aadhaarNumber gstNumber panNumber companyName createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);
    
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: verifications.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: verifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching verifications',
      error: error.message,
    });
  }
};

// @desc    Get active subscriptions
// @route   GET /api/admin/subscriptions?status=active
// @access  Private/Admin
exports.getSubscriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    // Additional filter for active subscriptions (not expired)
    if (status === 'active') {
      filter.endDate = { $gte: new Date() };
    }
    
    const skip = (page - 1) * limit;
    
    const subscriptions = await Subscription.find(filter)
      .populate('user', 'name phone email userType companyName')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Subscription.countDocuments(filter);
    
    // Calculate total revenue from active subscriptions
    const revenueStats = await Subscription.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);
    
    res.status(200).json({
      success: true,
      count: subscriptions.length,
      total,
      totalRevenue: revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscriptions',
      error: error.message,
    });
  }
};

// @desc    Get total revenue
// @route   GET /api/admin/revenue?period=month
// @access  Private/Admin
exports.getRevenue = async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    // Calculate date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
        
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
        
      case 'month':
        if (year && month) {
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 1);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        break;
        
      case 'year':
        if (year) {
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 12, 1);
        } else {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 1);
        }
        break;
        
      case 'all':
        startDate = new Date(0); // Beginning of time
        endDate = new Date();
        break;
        
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    
    // Get revenue from transactions
    const revenueData = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          avgTransaction: { $avg: '$amount' },
        },
      },
    ]);
    
    // Get revenue breakdown by type
    const revenueByType = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: '$type',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Get daily revenue for the period (for charts)
    const dailyRevenue = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);
    
    res.status(200).json({
      success: true,
      period,
      startDate,
      endDate,
      data: {
        summary: revenueData.length > 0 ? revenueData[0] : {
          totalRevenue: 0,
          totalTransactions: 0,
          avgTransaction: 0,
        },
        byType: revenueByType,
        daily: dailyRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching revenue',
      error: error.message,
    });
  }
};

// @desc    Get active requirements
// @route   GET /api/admin/stats/requirements
// @access  Private/Admin
exports.getActiveRequirements = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    if (status) {
      filter.status = status;
    } else {
      // By default, show active requirements
      filter.status = 'active';
    }
    
    if (category) {
      filter.category = category;
    }
    
    const skip = (page - 1) * limit;
    
    const requirements = await Requirement.find(filter)
      .populate('user', 'name phone email userType')
      .populate('responses.vendor', 'name companyName phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Requirement.countDocuments(filter);
    
    // Get stats by status
    const statsByStatus = await Requirement.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Get stats by category
    const statsByCategory = await Requirement.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    
    res.status(200).json({
      success: true,
      count: requirements.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      stats: {
        byStatus: statsByStatus,
        byCategory: statsByCategory,
      },
      data: requirements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching requirements',
      error: error.message,
    });
  }
};

// @desc    Get dashboard overview stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get all key metrics
    const [
      totalWorkers,
      totalVendors,
      totalCustomers,
      pendingVerifications,
      activeSubscriptions,
      activeRequirements,
      revenueThisMonth,
    ] = await Promise.all([
      User.countDocuments({ userType: 'worker' }),
      User.countDocuments({ userType: 'vendor' }),
      User.countDocuments({ userType: 'customer' }),
      User.countDocuments({ 
        isVerified: false,
        $or: [
          { userType: 'worker', aadhaarNumber: { $ne: null } },
          { userType: 'vendor', gstNumber: { $ne: null } }
        ]
      }),
      Subscription.countDocuments({ 
        status: 'active',
        endDate: { $gte: new Date() }
      }),
      Requirement.countDocuments({ status: 'active' }),
      Transaction.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalWorkers,
        totalVendors,
        totalCustomers,
        totalUsers: totalWorkers + totalVendors + totalCustomers,
        pendingVerifications,
        activeSubscriptions,
        activeRequirements,
        revenueThisMonth: revenueThisMonth.length > 0 ? revenueThisMonth[0].total : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats',
      error: error.message,
    });
  }
};

// @desc    Update user verification status
// @route   PUT /api/admin/verify/:userId
// @access  Private/Admin
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    user.isVerified = isVerified;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating verification status',
      error: error.message,
    });
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      userType, 
      isVerified, 
      search,
      sortBy,
      order,
      page = 1, 
      limit = 20 
    } = req.query;
    
    let filter = {};
    
    if (userType) {
      filter.userType = userType;
    }
    
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }
    
    let sort = {};
    if (sortBy) {
      sort[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }
    
    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password -otp -otpExpire -otpAttempts -resetPasswordToken -resetPasswordExpire')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);
    
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message,
    });
  }
};
