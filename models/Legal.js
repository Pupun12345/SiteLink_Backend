const mongoose = require('mongoose');

const legalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['privacy-policy', 'terms-conditions'],
    required: [true, 'Please specify the document type'],
    unique: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Please provide content'],
  },
  version: {
    type: String,
    default: '1.0',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  effectiveDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries
legalSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('Legal', legalSchema);
