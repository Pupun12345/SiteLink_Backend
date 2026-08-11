const PlatformSettings = require('../models/PlatformSettings');

// App-level config — app har launch/resume par yahan se padhta hai.
//
// PUBLIC hai (koi token nahi): maintenance notice login se pehle bhi dikhna
// chahiye, aur agar baaki APIs kabhi band ki jayein tab bhi yeh chalta rahe.
// Isliye response me sirf non-sensitive fields hain.
exports.getAppConfig = async (req, res) => {
  try {
    const settings = await PlatformSettings.getOrCreateSettings();
    const m = settings.maintenance || {};

    res.status(200).json({
      success: true,
      data: {
        maintenance: {
          enabled: !!m.enabled,
          title: m.title || 'Under Maintenance',
          message: m.message || '',
          until: m.until || null,
          // App isi stamp ko yaad rakhta hai — same notice dobara nahi dikhata,
          // lekin admin ke message badalte hi phir se dikh jaata hai.
          updatedAt: m.updatedAt || null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching app config',
      error: error.message,
    });
  }
};
