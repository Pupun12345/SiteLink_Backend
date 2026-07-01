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
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: function (v) {
        const allowed = { vendor_basic: 2999, vendor_premium: 4999, worker: 99 };
        return allowed[this.plan] === v;
      },
      message: props => `Amount must be ₹2999 for vendor_basic, ₹4999 for vendor_premium, or ₹99 for worker`
    }
  },
}, {
  timestamps: true,
});

// Index for faster queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
