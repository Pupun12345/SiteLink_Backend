const LegalPolicy = require('../models/LegalPolicy')
const PlatformSettings = require('../models/PlatformSettings')
const { hasActiveSubscription, subscriptionRequired } = require('../utils/subscription')


// Get all policies — all versions of all types (Admin)
exports.getAllPolicies = async (req, res) => {
  try {
    // Public endpoint — sirf wahi fields bhejo jo app ko chahiye.
    // createdBy/lastUpdatedBy populate NAHI karte, warna admin ka
    // naam+email publicly expose ho jaata.
    const policies = await LegalPolicy.find({ isActive: true })
      .select('policyType title content version updatedAt')
      .sort({ policyType: 1, version: -1 });

    res.status(200).json({ success: true, data: policies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching policies', error: error.message });
  }
};

// Get support contact info (app's "Contact Support" screen) — admin-managed,
// same PlatformSettings doc the admin panel edits under Platform Settings.
//
// Paid feature: sirf active plan wale users ko support ka contact milta
// hai (worker aur vendor dono). Admin hamesha allowed — warna support
// team apna hi contact nahi dekh paati.
exports.getSupportContact = async (req, res) => {
  try {
    if (req.user?.userType !== 'admin' && !hasActiveSubscription(req.user)) {
      return res.status(403).json(subscriptionRequired(
        'Contact Support is available on a paid plan. Please subscribe to a plan to reach our support team.'
      ));
    }

    const settings = await PlatformSettings.getOrCreateSettings();
    res.status(200).json({ success: true, data: settings.supportContact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching support contact', error: error.message });
  }
};
