const User = require("../models/User");
const Notification = require("../models/Notification");
const sendNotification = require("../utils/sendNotification");
const mongoose = require("mongoose");

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

// ═══════════════════════════════════════════════════════════════════
//  IN-APP NOTIFICATION HISTORY — /api/notifications
// ═══════════════════════════════════════════════════════════════════

// @desc    List the current user's notifications (paginated, newest first)
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: req.user.id }),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark one notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all of the current user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete one notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
