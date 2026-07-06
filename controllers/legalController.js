const LegalPolicy =require('../models/LegalPolicy')


// Get all policies — all versions of both types (Admin)
exports.getAllPolicies = async (req, res) => {
  try {
    const policies = await LegalPolicy.find({isActive: true})
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ policyType: 1, version: -1 });

    res.status(200).json({ success: true, data: policies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching policies', error: error.message });
  }
};
