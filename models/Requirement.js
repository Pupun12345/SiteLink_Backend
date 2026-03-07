const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  category: {
    type: String,
    enum: ['construction', 'renovation', 'maintenance', 'interior', 'other'],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  budget: {
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
  },
  status: {
    type: String,
    enum: ['active', 'in_progress', 'completed', 'cancelled'],
    default: 'active',
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  preferredStartDate: {
    type: Date,
  },
  responses: [{
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: String,
    quotedPrice: Number,
    respondedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Index for faster queries
requirementSchema.index({ user: 1, status: 1 });
requirementSchema.index({ status: 1, createdAt: -1 });
requirementSchema.index({ category: 1, status: 1 });
requirementSchema.index({ location: 1, status: 1 });

module.exports = mongoose.model('Requirement', requirementSchema);
