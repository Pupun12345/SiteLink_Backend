const User = require("../models/User");
const sendNotification = require("../utils/sendNotification");

exports.saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
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

exports.sendPushNotification = async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.fcmToken) {
      return res.status(404).json({
        success: false,
        message: "FCM token not registered",
      });
    }

    await sendNotification(user.fcmToken, title, message);

    res.status(200).json({
      success: true,
      message: "Push notification sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  };
};
