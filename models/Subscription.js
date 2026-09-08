const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['vendor_basic', 'vendor_premium', 'worker'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled'],
    default: 'active',
  },
  // ── Auto-payment (Razorpay Subscriptions) ────────────────────────
  // `isRecurring: false` = ek baar ka payment (purana flow). true =
  // Razorpay har cycle par khud charge karta hai.
  isRecurring: {
    type: Boolean,
    default: false,
  },
  razorpaySubscriptionId: {
    type: String,
    default: null,
    index: true,
  },
  // User ne auto-pay band kiya? Razorpay par turant cancel ho jaata
  // hai par current cycle ke end tak plan chalta rehta hai — isliye
  // ye `status` se alag field hai.
  autoRenewCancelledAt: {
    type: Date,
    default: null,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  // Plan pricing is admin-managed (PlanDetails.amount) and can change, so
  // this just guards against a bad/negative value rather than a fixed price.
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
});

// Index for faster queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
