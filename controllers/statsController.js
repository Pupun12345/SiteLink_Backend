const users=require('../models/User');

exports.totalWorkers=async (req, res) => {
    try {
        let workersCount = await users.countDocuments({ userType: 'worker' });
        res.json({
            success: true,
            data: {
                totalWorkers: workersCount
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching total workers',
            error: error.message
        });
    }
}
// Get summary statistics for the admin dashboard
exports.overview = async (req, res) => {
  try {
    const totalWorkers = await users.countDocuments({ userType: 'worker' });
    const verifiedWorkers = await users.countDocuments({ userType: 'worker', verificationStatus: 'verified' });
    const pendingWorkers = await users.countDocuments({ userType: 'worker', verificationStatus: 'pending' });
    const rejectedWorkers = await users.countDocuments({ userType: 'worker', verificationStatus: 'rejected' });

    const totalVendors = await users.countDocuments({ userType: 'vendor' });
    const verifiedVendors = await users.countDocuments({ userType: 'vendor', verificationStatus: 'verified' });
    const pendingVendors = await users.countDocuments({ userType: 'vendor', verificationStatus: 'pending' });
    const rejectedVendors = await users.countDocuments({ userType: 'vendor', verificationStatus: 'rejected' });

    // Placeholder data for features not yet tracked in the database.
    const activeSites = 14;
    const budgetUtilization = 68.4;

    res.json({
      success: true,
      data: {
        totalWorkers,
        verifiedWorkers,
        pendingWorkers,
        rejectedWorkers,
        totalVendors,
        verifiedVendors,
        pendingVendors,
        rejectedVendors,
        activeSites,
        budgetUtilization,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard overview',
      error: error.message,
    });
  }
};
exports.totalVendors=async (req, res) => {
    try {
        let workersCount = await users.countDocuments({ userType: 'vendor' });
        res.json({
            success: true,
            data: {
                totalVendors: workersCount
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching total vendors',
            error: error.message
        });
    }
}