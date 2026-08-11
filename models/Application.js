const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'confirmed', 'rejected', 'hired'],
    default: 'pending',
  },
  // Kaam khatam hone ke baad vendor sirf FACT mark karta hai — score nahi.
  // Worker ki rating inhi outcomes se automatically nikalti hai
  // (utils/workerRating.js). Sirf hired application par set hota hai.
  outcome: {
    type: String,
    enum: ['completed', 'left_early', 'no_show'],
    default: null,
  },
  outcomeAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });
// Rating recompute ek worker ke saare outcomes padhta hai — ye index
// usse ek hi seek me kara deta hai.
applicationSchema.index({ applicant: 1, outcome: 1 });

module.exports = mongoose.model('Application', applicationSchema);