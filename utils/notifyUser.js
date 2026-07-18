const User = require('../models/User');
const Notification = require('../models/Notification');
const sendNotification = require('./sendNotification');

// Persists an in-app notification record, then best-effort pushes it via
// FCM if the user has a token. Push failures never break the caller's
// main flow (e.g. approving a job must succeed even if the push fails).
const notifyUser = async (userId, { title, body, type = 'general', data = {} }) => {
  if (!userId) return null;

  const record = await Notification.create({
    recipient: userId,
    title,
    body,
    type,
    data,
  });

  try {
    const user = await User.findById(userId).select('fcmToken');
    if (user?.fcmToken) {
      await sendNotification(user.fcmToken, title, body, { type, ...data });
    }
  } catch (error) {
    console.error(`[notifyUser] push failed for user ${userId}:`, error.message);
  }

  return record;
};

module.exports = notifyUser;
