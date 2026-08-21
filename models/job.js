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
    latitude: {
      type: String,
      default: null,
    },
    longitude: {
      type: String,
      default: null,
    },
    quantity: {
      type: String,
      default: '1',
    },
    // Ek job me kai roles ho sakte hain, har ek ki apni count —
    // "2 Welder + 1 Mason + 3 Helper". Pehle ye sirf title me
    // ("Welder +3 more Required") aur description ke free text me
    // ("Roles: 2 x Welder, ...") jaata tha, isliye app ise theek se
    // dikha hi nahi sakti thi aur role ke hisaab se filter bhi tootta tha.
    //
    // `quantity` inka total hi rehta hai — plan ka worker quota wahi
    // padhta hai, isliye dono ko sync rakhna zaroori hai.
    // Purani jobs me ye khaali hai; app tab title/description par
    // fallback karti hai.
    roles: {
      type: [
        {
          _id: false,
          skill: { type: String, required: true, trim: true },
          quantity: { type: Number, required: true, min: 1 },
        },
      ],
      default: [],
    },
    salary: {
      type: Number,
    },
    salaryType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: String,
    },
    // Kaam kab shuru hoga. Pehle ye sirf description ke free text me
    // ("Start: 12 Sep 2026") jaata tha, isliye app ise theek se dikha hi
    // nahi sakti thi — aur worker ko "Start" ki jagah job ki posting date
    // dikh jaati thi. Purani jobs me null.
    startDate: {
      type: Date,
      default: null,
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
    likes: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          likedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    comments: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          userName: String,
          userImage: String,
          comment: String,
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    amenities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Amenities"
      }
    ],
  },
  { timestamps: true }
);

jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ isActive: 1, createdAt: -1 });

// Generate job ID
jobSchema.virtual('jobId').get(function () {
  return `REQ-${this._id.toString().slice(-4).toUpperCase()}`;
});

// Add contentType virtual for unified feed
jobSchema.virtual('contentType').get(function () {
  return 'job';
});

jobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);