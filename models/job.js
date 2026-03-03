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
    type: {
      type: String, // Full-time, Part-time
      enum: ['Full-time', 'Part-time'],
      required: true,
    },
    salary: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    skills: [
      {
        type: String,
      },
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);