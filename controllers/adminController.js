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
  }
};
