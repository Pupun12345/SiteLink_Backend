const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════════════
//  ADMIN PANEL ALERT — admin ke Notifications page par dikhta hai
// ═══════════════════════════════════════════════════════════════════
// Admin backend isi DB ki `notifications` collection padhta hai, par
// uska schema alag hai (title/message/recipientType…) — hamara
// `models/Notification` user ke push-notification ke liye hai
// (recipient/body). Isliye yahan model ke bina seedha collection me
// admin wale format me likhte hain.
//
// Fail ho to sirf log — user ki request isse kabhi fail nahi honi chahiye.
async function notifyAdmin({
  title,
  message,
  type = 'Verification',
  category = 'info',
  priority = 'medium',
  userId,
  actionUrl,
  actionText,
  metadata = {},
}) {
  try {
    const now = new Date();
    await mongoose.connection.collection('notifications').insertOne({
      title,
      message,
      type,
      category,
      priority,
      status: 'Unread',
      recipientType: 'admin',
      recipients: [],
      relatedEntity: userId
        ? { entityType: 'User', entityId: new mongoose.Types.ObjectId(String(userId)) }
        : undefined,
      actionUrl,
      actionText,
      metadata,
      isSystemGenerated: true,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    console.error('[notifyAdmin] failed:', err.message);
  }
}

module.exports = notifyAdmin;
