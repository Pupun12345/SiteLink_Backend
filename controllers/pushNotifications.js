const User = require("../models/User");

exports.saveFcmToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    await User.findByIdAndUpdate(userId, {
      fcmToken,
    });
    res.status(200).json({
      success: true,
      message: "FCM token saved",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};