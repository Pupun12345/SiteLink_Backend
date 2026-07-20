const LegalPolicy = require('../models/LegalPolicy')
const PlatformSettings = require('../models/PlatformSettings')


// Get all policies — all versions of all types (Admin)
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

// Get support contact info (app's "Contact Support" screen) — admin-managed,
// same PlatformSettings doc the admin panel edits under Platform Settings.
exports.getSupportContact = async (req, res) => {
  try {
    const settings = await PlatformSettings.getOrCreateSettings();
    res.status(200).json({ success: true, data: settings.supportContact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching support contact', error: error.message });
  }
};
