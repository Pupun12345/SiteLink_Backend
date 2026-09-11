const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  // Drives frontend tap-to-navigate routing — kept as a free-form string
  // enum so new notification types don't need a migration.
  type: {
    type: String,
    enum: [
      'job_approved',
      'job_rejected',
      'job_closed',
      'new_application',
      'application_status',
      'new_comment',
      'new_like',
      'vendor_verified',
      'vendor_rejected',
      'worker_verified',
      'worker_rejected',
      'subscription_activated',
      // Auto-payment (Razorpay Subscriptions). `subscription_renewed`
      // webhook se aata hai — app khuli hone ki zaroorat nahi, isliye
      // notification hi ek matra zariya hai user ko batane ka.
      'subscription_renewed',
      'autopay_cancelled',
      'autopay_failed',
      'phone_changed',
      'general',
    ],
    default: 'general',
  },
  // Extra ids the frontend needs to deep-link (jobId, applicationId, postId, etc.)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
