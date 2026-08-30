const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: null,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [
      /^[6-9]\d{9}$/,
      'Please provide a valid 10-digit phone number',
    ],
    default: undefined,
  },
  // Staged new phone number while an OTP-verified change is in progress —
  // `phone` itself is only overwritten once the OTP for this is confirmed.
  pendingPhone: {
    type: String,
    select: false,
    default: null,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    default: null,
  },
  userType: {
    type: String,
    enum: ['customer', 'vendor', 'worker', 'admin'],
    default: null,
  },
  profileImage: {
    type: String,
    default: null,
  },
  isProfileCreated: {
    type: Boolean,
    default: false,
  },
  // Worker-specific fields
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },
  primarySkill: { type: String, default: null },
  skills: {
    type: [
      {
        skillId: { type: Number, required: true },
        skillName: { type: String, required: true }
      }
    ],
    default: [],
  },
  experience: { type: String, default: null },
  experienceDescription: { type: String, default: null },
  workState: { type: String, default: null },
  city: {
    type: String,
    trim: true,
    default: null,
  },
  willingtoRelocate: { type: Boolean, default: false },
  // 'weekly' bhi allowed — worker reg/edit UI aur jobs API dono
  // daily/weekly/monthly offer karte hain.
  salaryType: { type: String, enum: ['daily', 'weekly', 'monthly', 'hourly', 'project-based'], default: null },
  salary: { type: Number, default: null },
  governmentID: { type: String, default: null },
  // Worker ek se zyada certificate laga sakta hai (alag-alag company /
  // alag-alag skill ka), isliye array hai.
  //
  // NOTE: pehle ye single String tha. Purane users ke DB me abhi bhi
  // string padi hai — Mongoose array path par scalar value ko apne aap
  // ek-element array me cast kar deta hai, isliye purana data padhne me
  // toota nahi.
  experienceCertificate: { type: [String], default: [] },
  workSamplesPhoto: { type: [String], default: [] },
  age: {
    type: Number,
    min: [18, 'Age must be at least 18'],
    max: [100, 'Age must be less than 100'],
    default: null,
  },
  location: {
    type: String,
    default: null,
  },
  // Vendor/Contractor-specific fields
  designation: { type: String, trim: true, default: null },
  workArea: { type: String, trim: true, default: null },
  companyLogo: {
    type: String,
    default: null,
  },
  gstCertificate: {
    type: String,
    default: null,
  },
  panCardImage: {
    type: String,
    default: null,
  },
  companyName: {
    type: String,
    trim: true,
    default: null,
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    default: null,
    match: [
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Please provide a valid GST number',
    ],
  },
  website: {
    type: String,
    default: null,
    match: [
      /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*\/?$/,
      'Please provide a valid website URL',
    ],
  },
  whatsappNumber: {
    type: String,
    trim: true,
    default: null,
    match: [
      /^[6-9]\d{9}$/,
      'Please provide a valid 10-digit WhatsApp number',
    ],
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    default: null,
    match: [
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      'Please provide a valid PAN number',
    ]
  },

  // Google / Social Auth
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
    default: undefined,
  },
  authProvider: {
    type: String,
    enum: ['phone', 'google', 'apple'],
    default: 'phone',
  },
  deviceToken: { type: String, default: null },
  deviceType: { type: String, enum: ['android', 'ios', 'web'], default: null },
  fcmToken: { type: String, default: null },

  // Common fields
  isBlocked: {
    type: Boolean,
    default: false,
  },
  language: {
    type: String,
    enum: ['hindi', 'english'],
    default: 'english'
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  subscription: {
    type: Boolean,
    default: false,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
  },
  // Razorpay subscription state
  activePlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlanDetails',
    default: null,
  },
  subscriptionStatus: {
    type: String,
    enum: ['inactive', 'active', 'expired'],
    default: 'inactive',
  },
  subscriptionExpiresAt: {
    type: Date,
    default: null,
  },
  lastPaymentId: {
    type: String,
    default: null,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  verificationRejectedReason: {
    type: String,
    default: null,
  },
  verificationReviewedAt: {
    type: Date,
    default: null,
  },
  // ── Worker performance rating (AUTOMATIC — koi manually nahi deta) ──
  // Application outcomes se calculate hoti hai (utils/workerRating.js) aur
  // yahan denormalized rakhi jaati hai, taaki applicant list / job feed
  // har worker ke liye alag query na kare.
  // 0 = abhi tak koi job complete nahi ki (naya worker) — UI "New" dikhata
  // hai, 0.0 stars nahi (warna naya worker "kharaab" lagta hai).
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  jobsCompleted: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Kitne outcomes par rating bani hai — UI isse "(12 jobs)" dikhata hai
  // aur user samajh paata hai ki rating kitni bharosemand hai.
  ratedJobsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  ratingUpdatedAt: {
    type: Date,
    default: null,
  },

  // Admin ka manual rating — alag cheez hai, automatic wali se mat milao.
  adminRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5'],
    default: null,
  },
  adminRatingComment: {
    type: String,
    default: null,
  },
  ratedAt: {
    type: Date,
    default: null,
  },
  otp: {
    type: String,
    select: false, // Don't return OTP by default in queries
  },
  otpExpire: {
    type: Date,
    select: false, // Don't return OTP expiration by default
  },
  otpAttempts: {
    type: Number,
    default: 0,
    select: false, // Don't return OTP attempts by default
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);