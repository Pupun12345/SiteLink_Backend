const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    // Sirf photo/video wala post bilkul valid hai (social feed hai), isliye
    // content required NAHI hai. "Poora khaali post" na ban jaaye — ye
    // controller me check hota hai (content ya media, kuch to ho).
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Post content cannot exceed 1000 characters'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 images allowed per post',
      },
    },
    video: {
      type: String,
      default: null,
    },
    feeling: {
      type: String,
      default: null,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    posterName: {
      type: String,
      required: true,
    },
    posterImage: {
      type: String,
      default: null,
    },
    posterType: {
      type: String,
      enum: ['worker', 'vendor', 'admin'],
      required: true,
    },
    // Feed me name ke neeche 'vendor'/'worker' ki jagah yeh dikhta hai —
    // vendor ka designation, worker ka primarySkill. Post banate waqt
    // snapshot le lete hain taaki baad me profile badle to purani post
    // ka context na badle.
    posterDesignation: {
      type: String,
      default: null,
    },
    companyName: {
      type: String,
      default: null,
    },
    verification: {
      type: String,
      enum: ['verified', 'pending', 'unverified'],
      default: 'unverified',
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
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    autoApproved: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ postedBy: 1, createdAt: -1 });
postSchema.index({ posterType: 1, createdAt: -1 });
postSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);