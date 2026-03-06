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