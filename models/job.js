const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    quantity: {
      type: String,
      default: '1',
    },
    salary: {
      type: Number,
    },
    salaryType: {
      type: String,
      enum: ['daily', 'monthly'],
      default: 'daily',
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Open', 'Filled', 'Closed', 'Cancelled'],
      default: 'Open',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Generate job ID
jobSchema.virtual('jobId').get(function() {
  return `REQ-${this._id.toString().slice(-4).toUpperCase()}`;
});

jobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);