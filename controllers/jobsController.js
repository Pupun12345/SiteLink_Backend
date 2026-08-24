const Job = require('../models/job');
const User = require('../models/User');
const Application = require('../models/Application');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const Amenity = require('../models/amenities');
const PlanDetails = require('../models/PlanDetails');
const notifyUser = require('../utils/notifyUser');
const { hasActiveSubscription, subscriptionRequired } = require('../utils/subscription');

// Total workers a vendor has already committed across their jobs. Deactivated
// jobs still count (so delete+repost can't bypass the quota); only admin-
// rejected jobs are excluded. `quantity` is stored as a string, so convert.
// Plan ka worker quota MAHINE ka hai ("25 workers/month"), isliye sirf
// current calendar month ki jobs ginte hain — har mahine ki 1 taarikh ko
// quota apne aap reset ho jaata hai.
//
// Pehle ye vendor ki SAARI jobs ginta tha (koi date filter nahi), yani
// ek baar 25 workers post karne ke baad vendor kabhi dobara post nahi kar
// paata — chahe agla mahina aa jaaye ya subscription renew ho jaaye.
function _currentPeriodStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

/// Is mahine ab tak kitne workers post ho chuke.
/// Deactivated jobs bhi ginti hain (warna delete+repost se quota bypass ho
/// jaata); sirf admin-rejected jobs chhodte hain.
async function _workersUsed(vendorId) {
  const agg = await Job.aggregate([
    {
      $match: {
        postedBy: new mongoose.Types.ObjectId(vendorId),
        approvalStatus: { $ne: 'rejected' },
        createdAt: { $gte: _currentPeriodStart() },
      },
    },
    { $group: { _id: null, total: { $sum: { $convert: { input: '$quantity', to: 'int', onError: 0, onNull: 0 } } } } },
  ]);
  return agg.length ? agg[0].total : 0;
}

/// Agle mahine ki 1 taarikh — app "resets on 1 Sep" dikha sake.
function _quotaResetsAt() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: shape a Job document into the summary object used by list endpoints.
// `applicationStatus` (pending/shortlisted/confirmed/rejected/hired/null) —
// the requesting worker's own Application.status for this job, if any —
// lets the browse list mark jobs already applied to (see getJobs below).
function _formatJobSummary(job, applicationStatus = null) {
  return {
    _id: job._id,
    title: job.title,
    company: job.company,
    location: job.location,
    latitude: job.latitude,
    longitude: job.longitude,
    workersNeeded: job.quantity,
    // Per-role breakdown — purani jobs me khaali, app tab title par
    // fallback kar deti hai.
    roles: job.roles || [],
    duration: job.duration || null,
    startDate: job.startDate || null,
    experience: job.experience || null,
    description: job.description || null,
    salary: job.salary,
    salaryType: job.salaryType,
    isUrgent: job.isUrgent,
    amenities: job.amenities,
    applicationsCount: job.applicationsCount || 0,
    status: job.status,
    approvalStatus: job.approvalStatus,
    isActive: job.isActive !== false, // false = vendor ne deactivate kiya
    postedAt: job.createdAt,
    hasApplied: !!applicationStatus,
    applicationStatus: applicationStatus || null,
    postedBy: {
      id: job.postedBy?._id,
      name: job.postedBy?.name,
      designation: job.postedBy?.designation,
      companyName: job.postedBy?.companyName
    }
  };
}

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const { location, search, salaryType, sort } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    // Deactivated jobs (vendor ne delete/deactivate kiye) discovery me nahi
    // dikhne chahiye — sirf approved + active.
    let filter = { "approvalStatus": "approved", "isActive": { $ne: false } };

    if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' };

    if (salaryType) {
      const allowedTypes = [
        'daily',
        'weekly',
        'monthly'
      ];
      if (
        !allowedTypes.includes(
          salaryType.toLowerCase()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid salary type.Salary type must be one of: daily, weekly, monthly',
        });
      }
      filter.salaryType =
        salaryType.toLowerCase();
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { company: { $regex: safeSearch, $options: 'i' } },
        { location: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const sortMap = {
      oldest: { createdAt: 1 },
      highestSalary: { salary: -1 },
      lowestSalary: { salary: 1 },
    };

    // Admin posts always pinned to top, then apply the requested sort.
    const baseSortOrder = sortMap[sort] || { createdAt: -1 };
    const sortOrder = { autoApproved: -1, ...baseSortOrder };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('postedBy', 'name companyName')
        .populate("amenities", "id name category icon")
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter),
    ]);

    // Worker logged in? Mark jobs already applied to (any status) so the
    // browse list can show "Applied" instead of "Apply" for them.
    let appliedStatusByJob = {};
    if (req.user?.userType === 'worker' && jobs.length) {
      const apps = await Application.find({
        applicant: req.user.id,
        job: { $in: jobs.map((j) => j._id) },
      }).select('job status').lean();
      appliedStatusByJob = apps.reduce((acc, a) => {
        acc[a.job.toString()] = a.status;
        return acc;
      }, {});
    }

    const data = jobs.map((job) =>
      _formatJobSummary(job, appliedStatusByJob[job._id.toString()] || null)
    );

    res.status(200).json({
      success: true,
      count: data.length,
      data,
      pagination: {
        current: page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Get jobs posted by the current user (any approvalStatus — pending/approved/rejected)
// @route   GET /api/jobs/my
// @access  Private
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .populate('postedBy', 'name companyName')
      .populate('amenities', 'id name category icon')
      .sort({ createdAt: -1 })
      .lean();

    const data = jobs.map((job) => ({
      ..._formatJobSummary(job),
      rejectionReason: job.rejectionReason || null,
    }));

    // Worker quota summary — vendor ko dikhane ke liye (kitne use kiye / bache).
    let quota = null;
    if (req.user.userType === 'vendor') {
      const hasActiveSub = hasActiveSubscription(req.user);

      let maxWorkers = 0;
      let planName = null;
      if (hasActiveSub && req.user.activePlan) {
        const plan = await PlanDetails.findById(req.user.activePlan).select('maxWorkers planName');
        maxWorkers = Number(plan?.maxWorkers) || 0;
        planName = plan?.planName || null;
      }

      // Wahi helper jo createJob me enforce karta hai — warna vendor ko
      // dikhne wala "10 bache hain" aur asli limit alag ho jaate, aur
      // post block hone par confusion hoti.
      const used = await _workersUsed(req.user.id);

      quota = {
        hasActiveSubscription: hasActiveSub,
        planName,
        maxWorkers,
        used,
        remaining: maxWorkers > 0 ? Math.max(maxWorkers - used, 0) : null,
        // Quota mahine ka hai — app "1 Sep ko reset hoga" dikha sake
        periodStart: _currentPeriodStart(),
        resetsAt: _quotaResetsAt(),
      };
    }

    res.status(200).json({
      success: true,
      count: data.length,
      data,
      quota,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your jobs',
      error: error.message,
    });
  }
};

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private
exports.applyToJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Job ID'
      });
    }

    const applicantId = req.user.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const user = await User.findById(applicantId);

    //check if user is exist or not
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a worker
    if (user.userType !== 'worker') {
      return res.status(403).json({
        success: false,
        message: 'Only workers can apply to jobs',
      });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not verified yet. Please wait for verification before applying to jobs.',
      });
    }

    // Job apply karna FREE hai — koi subscription gate nahi. Worker plan
    // ke features (skill rating, priority shortlisting, emergency support,
    // call/WhatsApp support) apply karne se alag hain; apply har verified
    // worker kar sakta hai.

    if (job.status === 'Closed' || job.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Job is closed'
      });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: applicantId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    const application = await Application.create({
      job: jobId,
      applicant: applicantId,
    });

    await Job.updateOne({ _id: jobId }, { $inc: { applicationsCount: 1 } });

    await application.populate('applicant', 'name profileImage userType');

    notifyUser(job.postedBy, {
      type: 'new_application',
      title: 'New Application',
      body: `${user.name || 'A worker'} applied to your job "${job.title}".`,
      data: { jobId: job._id, applicationId: application._id },
    }).catch((e) => console.error('[applyToJob] notifyUser failed:', e.message));

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to apply to job',
      error: error.message,
    });
  }
};

// @desc    Get Job Details by ID
// @route   GET /api/jobs/:id/getJobDetails
// @access  Private
exports.getJobDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Job ID'
      });
    }


    const job = await Job.findById(id).select("title company location latitude longitude quantity roles salary salaryType isUrgent duration startDate description experience applicationsCount status approvalStatus postedBy amenities").populate("postedBy", "name designation companyName phone whatsappNumber").populate("amenities", "id name category icon")
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Vendor ka WhatsApp number sirf tabhi bhejo jab is worker ki application
    // confirm/hire ho chuki ho — pending/shortlisted/rejected me contact
    // leak nahi hona chahiye. Vendor khud apna job dekh raha ho to bhi allowed.
    const isOwner =
      !!(job.postedBy && req.user?.id && job.postedBy._id?.toString() === req.user.id);

    let contactUnlocked = false;
    let applicationStatus = null;
    if (req.user?.userType === 'worker') {
      const myApplication = await Application.findOne({
        job: id,
        applicant: req.user.id,
      }).select('status');
      applicationStatus = myApplication?.status || null;
      contactUnlocked = ['confirmed', 'hired'].includes(applicationStatus);
    } else {
      contactUnlocked = isOwner;
    }

    if (job.postedBy) {
      // Vendor ka asli/login number (`phone`) kabhi bahar nahi jaata — sirf
      // job ka owner apna dekh sakta hai. Worker ko hamesha wahi WhatsApp
      // number milta hai jo vendor ne profile me diya hai; na diya ho to
      // kuch nahi (app "not shared" dikhata hai), phone par fallback nahi.
      if (!isOwner) delete job.postedBy.phone;
      if (!contactUnlocked) delete job.postedBy.whatsappNumber;
    }

    job.hasApplied = !!applicationStatus;
    job.applicationStatus = applicationStatus;

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
}

// @desc    Get Applied Job Details by ID
// @route   GET /api/jobs/getAppliedJobs
// @access  Private
exports.appliedJobs = async (req, res) => {
  try {
    const applicantID = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(applicantID)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Applicant ID'
      });
    }

    const data = await Application.find({ applicant: applicantID })
      // `postedBy` bhi chahiye: app company name live profile se leti hai
      // (stored `company` me purani jobs me vendor ka personal naam pada
      // hai). Nested populate ke bina applied list me wahi galat naam
      // dikhta rehta.
      .populate({
        path: 'job',
        select: 'title company location latitude longitude quantity roles salary salaryType isUrgent duration startDate description experience status approvalStatus postedBy',
        populate: { path: 'postedBy', select: 'name companyName' },
      })
      .lean();

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
}

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private
exports.createJob = async (req, res) => {
  try {
    const { title, company, location, latitude, longitude, quantity, salary, salaryType, isUrgent, duration, description, experience, amenities, roles, startDate } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account verification required for posting jobs. Please wait for your account to be verified before creating a job.'
      });
    }

    if (user.userType === 'worker' || user.userType === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only Vendor or Admin can create jobs'
      });
    }

    if (!title || !company || !location || !description || !experience) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (salaryType && !['daily', 'weekly', 'monthly'].includes(salaryType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salary type.Salary type must be one of: daily, weekly, monthly',
      });
    }

    const parsedSalary = Number(salary);
    if (
      isNaN(parsedSalary) ||
      parsedSalary < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salary'
      });
    }

    if (experience && isNaN(experience)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Experience value.Experience must be a number'
      });
    }

    const exp = Number(experience);
    if (
      isNaN(exp) ||
      exp < 0 ||
      exp > 60
    ) {
      return res.status(400).json({
        success: false,
        message: 'Experience must be between 0 and 60 years'
      });
    }

    // Validate Amenities
    let amenityObjectIds = [];
    if (!Array.isArray(amenities)) {
      return res.status(400).json({
        success: false,
        message: "Amenities must be an array.",
      });
    }
    if (amenities.length > 0) {
      const amenityDocs = await Amenity.find({
        id: { $in: amenities },
      }).select("_id");

      if (amenityDocs.length !== amenities.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected amenities are invalid.",
        });
      }
      amenityObjectIds = amenityDocs.map((amenity) => amenity._id);
    }

    // Kaam kab shuru hoga (optional). Parse na ho to saaf error — chup-chaap
    // null save karne se vendor ko lagta hai date chali gayi.
    let parsedStartDate = null;
    if (startDate !== undefined && startDate !== null && `${startDate}`.trim() !== '') {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid start date' });
      }
    }

    // ── Per-role breakdown (optional) ──────────────────────────────────
    // Aaya ho to yahi authoritative hai aur `quantity` iska total ban
    // jaata hai — warna dono alag ho sakte the aur plan ka quota (jo
    // `quantity` padhta hai) galat gina jaata.
    let parsedRoles = [];
    if (roles !== undefined) {
      if (!Array.isArray(roles)) {
        return res.status(400).json({ success: false, message: 'roles must be an array' });
      }
      for (const r of roles) {
        const skill = (r?.skill ?? '').toString().trim();
        const qty = Number(r?.quantity);
        if (!skill) {
          return res.status(400).json({ success: false, message: 'Each role needs a skill name' });
        }
        if (!Number.isFinite(qty) || qty < 1) {
          return res.status(400).json({ success: false, message: `Invalid quantity for role "${skill}"` });
        }
        parsedRoles.push({ skill, quantity: Math.floor(qty) });
      }
    }

    const workersNeeded = parsedRoles.length
      ? parsedRoles.reduce((sum, r) => sum + r.quantity, 0)
      : Number(quantity);

    if (
      isNaN(workersNeeded) ||
      workersNeeded <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // ── Subscription gate + worker quota (vendors only; admin exempt) ──
    if (user.userType === 'vendor') {
      if (!hasActiveSubscription(user) || !user.activePlan) {
        return res.status(403).json(subscriptionRequired(
          'An active subscription is required to post jobs. Please subscribe to a plan.'
        ));
      }

      const plan = await PlanDetails.findById(user.activePlan);
      const maxWorkers = Number(plan?.maxWorkers) || 0;

      // Worker-count cap sirf tab lagti hai jab admin ne plan par maxWorkers
      // set kiya ho (> 0). Deactivated jobs bhi count hote hain.
      if (maxWorkers > 0) {
        const used = await _workersUsed(user._id);
        const remaining = maxWorkers - used;

        if (workersNeeded > remaining) {
          return res.status(403).json({
            success: false,
            code: 'WORKER_QUOTA_EXCEEDED',
            // Quota mahine ka hai — message me "this month" aur reset date
            // dono batate hain, warna vendor ko lagta hai limit permanent hai.
            message: remaining <= 0
              ? `You've used all ${maxWorkers} workers on your plan this month. It resets on ${_quotaResetsAt().toDateString()}, or upgrade to post more now.`
              : `Your plan allows ${maxWorkers} workers per month. Only ${remaining} left this month — you can't post ${workersNeeded} in this job.`,
            data: {
              maxWorkers,
              used,
              remaining,
              resetsAt: _quotaResetsAt(),
            },
          });
        }
      }
    }

    // Admin- and vendor-posted jobs go live immediately; other roles need admin approval.
    const isAutoApproved = user.userType === 'admin' || user.userType === 'vendor';

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      latitude: latitude ? latitude.trim() : null,
      longitude: longitude ? longitude.trim() : null,
      quantity: workersNeeded,
      roles: parsedRoles,
      salary: parsedSalary,
      salaryType: salaryType,
      isUrgent: isUrgent,
      duration: duration,
      startDate: parsedStartDate,
      description: description.trim(),
      amenities: amenityObjectIds,
      experience: exp,
      postedBy: req.user.id,
      isActive: true,
      approvalStatus: isAutoApproved ? 'approved' : 'pending',
      autoApproved: isAutoApproved,
      approvedBy: isAutoApproved ? req.user.id : null,
      approvedAt: isAutoApproved ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: isAutoApproved
        ? 'Job created and published successfully'
        : 'Job submitted successfully. It will be visible once approved by an admin.',
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message,
    });
  }
};

// @desc    Like/Unlike a job
// @route   PUT /api/jobs/:id/like
// @access  Private
exports.likeUnlikeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(id).select('likes');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const alreadyLiked = job.likes.some(like => like.userId.toString() === userId.toString());

    const updatedJob = alreadyLiked
      ? await Job.findByIdAndUpdate(
          id,
          { $pull: { likes: { userId } }, $inc: { likesCount: -1 } },
          { new: true }
        ).select('likesCount')
      : await Job.findByIdAndUpdate(
          id,
          { $push: { likes: { userId, likedAt: new Date() } }, $inc: { likesCount: 1 } },
          { new: true }
        ).select('likesCount');

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Job unliked' : 'Job liked',
      data: { _id: updatedJob._id, likesCount: Math.max(0, updatedJob.likesCount) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error liking/unliking job', error: error.message });
  }
};

// Helper to format a comment
function _formatComment(c) {
  return {
    _id: c._id,
    comment: c.comment,
    userId: c.userId._id,
    userName: c.userId.name,
    userImage: c.userId.profileImage || null,
    userType: c.userId.userType,
    isVerified: c.userId.verificationStatus === 'verified',
    likesCount: c.likesCount,
    isEdited: c.isEdited,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// @desc    Add comment to a job
// @route   POST /api/jobs/:id/comments
// @access  Private
exports.addJobComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, parentComment = null } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }
    if (comment.length > 500) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters' });
    }

    const jobExists = await Job.exists({ _id: id });
    if (!jobExists) return res.status(404).json({ success: false, message: 'Job not found' });

    const commentData = { userId, comment: comment.trim(), parentComment, jobId: id };
    const newComment = await Comment.create(commentData);
    await newComment.populate('userId', 'name profileImage userType verificationStatus');
    await Job.updateOne({ _id: id }, { $inc: { commentsCount: 1 } });

    res.status(201).json({
      success: true,
      message: parentComment ? 'Reply added successfully' : 'Comment added successfully',
      data: _formatComment(newComment),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};

// @desc    Update a job comment
// @route   PUT /api/jobs/:jobId/comments/:commentId
// @access  Private
exports.updateJobComment = async (req, res) => {
  try {
    const { jobId, commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters' });
    }

    const existingComment = await Comment.findOne({ _id: commentId, jobId, status: 'active' }).populate('userId', 'name profileImage userType verificationStatus');

    if (!existingComment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (existingComment.userId._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this comment' });
    }

    existingComment.comment = comment.trim();
    existingComment.isEdited = true;
    existingComment.editedAt = new Date();
    await existingComment.save();

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: _formatComment(existingComment),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update comment', error: error.message });
  }
};

// @desc    Delete a job comment
// @route   DELETE /api/jobs/:jobId/comments/:commentId
// @access  Private
exports.deleteJobComment = async (req, res) => {
  try {
    const { jobId, commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findOne({ _id: commentId, jobId, status: 'active' });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.userId.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    comment.status = 'deleted';
    await comment.save();
    await Job.updateOne({ _id: jobId }, { $inc: { commentsCount: -1 } });

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete comment', error: error.message });
  }
};

// @desc    Get comments for a job
// @route   GET /api/jobs/:id/comments
// @access  Public
exports.getJobComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    const job = await Job.findById(id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const filter = { jobId: id, parentComment: null, status: 'active' };

    const sortMap = { oldest: { createdAt: 1 }, popular: { likesCount: -1, createdAt: -1 } };
    const sortCriteria = sortMap[sortBy] || { createdAt: -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find(filter)
      .populate('userId', 'name profileImage userType verificationStatus')
      .populate({
        path: 'replies',
        match: { status: 'active' },
        populate: { path: 'userId', select: 'name profileImage userType verificationStatus' },
        options: { sort: { createdAt: 1 }, limit: 3 }
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    const totalComments = await Comment.countDocuments(filter);

    const transformedComments = comments.map(comment => ({
      ..._formatComment(comment),
      editedAt: comment.editedAt,
      replies: (comment.replies || []).map(reply => ({
        ..._formatComment(reply),
        editedAt: reply.editedAt,
      }))
    }));

    res.status(200).json({
      success: true,
      data: transformedComments,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: totalComments,
        pages: Math.ceil(totalComments / parseInt(limit))
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch comments', error: error.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (job.postedBy?.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this job' });
    }

    // Soft-deactivate instead of hard delete: job public discovery se hat
    // jaata hai lekin vendor ki quota me count hota rehta hai (delete karke
    // dobara post karke worker-limit bypass nahi kar sakte).
    job.isActive = false;
    job.status = 'Closed';
    await job.save();

    // Jinke applications abhi bhi pending/shortlisted the unhe batao ki job
    // band ho gayi — already confirmed/hired/rejected workers ko spam nahi.
    const affected = await Application.find({
      job: job._id,
      status: { $in: ['pending', 'shortlisted'] },
    }).select('applicant');
    await Promise.all(
      affected.map((a) =>
        notifyUser(a.applicant, {
          title: 'Job Closed',
          body: `"${job.title}" has been closed by the vendor.`,
          type: 'job_closed',
          data: { jobId: job._id.toString() },
        })
      )
    );

    res.status(200).json({ success: true, message: 'Job deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete job', error: error.message });
  }
};

// @desc    List jobs awaiting admin approval
// @route   GET /api/jobs/admin/pending
// @access  Private (admin only)
exports.getPendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ approvalStatus: 'pending' })
      .populate('postedBy', 'name companyName phone email userType')
      .populate('amenities', 'id name category icon')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending jobs', error: error.message });
  }
};

// @desc    Approve a pending job
// @route   PUT /api/jobs/:id/approve
// @access  Private (admin only)
exports.approveJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Job ID' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.approvalStatus = 'approved';
    job.approvedBy = req.user.id;
    job.approvedAt = new Date();
    job.rejectionReason = null;
    await job.save();

    notifyUser(job.postedBy, {
      type: 'job_approved',
      title: 'Job Approved',
      body: `Your job "${job.title}" has been approved and is now live.`,
      data: { jobId: job._id },
    }).catch((e) => console.error('[approveJob] notifyUser failed:', e.message));

    res.status(200).json({
      success: true,
      message: 'Job approved successfully',
      data: job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve job', error: error.message });
  }
};

// @desc    Reject a pending job
// @route   PUT /api/jobs/:id/reject
// @access  Private (admin only)
exports.rejectJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Job ID' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.approvalStatus = 'rejected';
    job.approvedBy = req.user.id;
    job.approvedAt = new Date();
    job.rejectionReason = reason || null;
    await job.save();

    notifyUser(job.postedBy, {
      type: 'job_rejected',
      title: 'Job Rejected',
      body: reason
        ? `Your job "${job.title}" was rejected: ${reason}`
        : `Your job "${job.title}" was rejected.`,
      data: { jobId: job._id },
    }).catch((e) => console.error('[rejectJob] notifyUser failed:', e.message));

    res.status(200).json({
      success: true,
      message: 'Job rejected successfully',
      data: job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject job', error: error.message });
  }
};

/// Worker ki rating doosron (vendor) ko dikhani hai? Ye plan ka feature
/// hai, isliye active subscription ke bina nahi dikhti.
function _workerRatingVisible(worker) {
  return hasActiveSubscription(worker);
}

// Helper: shape an Application's populated applicant into the `worker` object the app expects.
function _formatApplicant(application) {
  const w = application.applicant || {};
  return {
    _id: application._id,
    worker: {
      _id: w._id,
      name: w.name,
      profileImage: w.profileImage || null,
      primarySkill: w.primarySkill || null,
      skills: w.skills || [],
      totalExperience: w.experience || null,
      phone: w.phone || null,
      workCity: w.city || null,
      workState: w.workState || null,
      isVerified: w.isVerified === true,
      // Rating SIRF admin deta hai (admin panel se). Pehle ye job
      // outcomes se automatically banti thi — wo poora system hata diya
      // gaya, kyunki kaam poora hua ya nahi, ye platform ka mamla nahi
      // hai. Platform ka kaam yahin khatam: vendor ne job post ki,
      // worker ne apply kiya, vendor ne confirm kiya.
      //
      // PAID PERK: rating vendor ko dikhna worker plan ka feature hai
      // ("Skill Rating & Verification"). Plan na ho to null jaata hai aur
      // app rating wali jagah kuch nahi dikhati. Worker apni rating apni
      // profile me hamesha dekh sakta hai.
      rating: _workerRatingVisible(w)
        ? (w.adminRating != null ? w.adminRating : null)
        : null,
      ratingComment: _workerRatingVisible(w)
        ? (w.adminRatingComment || null)
        : null,
      // Registration me diye gaye documents — vendor applicant ko theek se
      // parakh sake. Paths hain; app inhe media base URL ke saath jodti hai.
      governmentID: w.governmentID || null,
      experienceCertificate: w.experienceCertificate || null,
      workSamplesPhoto: w.workSamplesPhoto || [],
    },
    coverLetter: application.coverLetter || null,
    experience: w.experience || null,
    status: application.status,
    createdAt: application.createdAt,
  };
}

// @desc    Get all applicants for a job (job owner / admin only)
// @route   GET /api/jobs/:id/applicants
// @access  Private
exports.getJobApplicants = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Job ID' });
    }

    const job = await Job.findById(id).select('postedBy');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const isOwner = job.postedBy?.toString() === req.user.id;
    const isAdmin = req.user.userType === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applicants for this job' });
    }

    const applications = await Application.find({ job: id })
      .populate('applicant', 'name profileImage primarySkill skills experience phone city workState isVerified adminRating adminRatingComment subscriptionStatus subscriptionExpiresAt governmentID experienceCertificate workSamplesPhoto')
      .sort({ createdAt: -1 })
      .lean();

    const data = applications.map(_formatApplicant);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an applicant's status (job owner / admin only)
// @route   PUT /api/jobs/:id/applicants/:applicationId/status
// @access  Private
exports.updateApplicantStatus = async (req, res) => {
  try {
    const { id, applicationId } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'shortlisted', 'confirmed', 'rejected', 'hired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: 'Invalid Job ID or Application ID' });
    }

    const job = await Job.findById(id).select('postedBy title');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const isOwner = job.postedBy?.toString() === req.user.id;
    const isAdmin = req.user.userType === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }

    const application = await Application.findOne({ _id: applicationId, job: id });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found for this job' });
    }

    application.status = status;
    await application.save();

    notifyUser(application.applicant, {
      type: 'application_status',
      title: 'Application Update',
      body: `Your application for "${job.title}" is now ${status}.`,
      data: { jobId: job._id, applicationId: application._id, status },
    }).catch((e) => console.error('[updateApplicantStatus] notifyUser failed:', e.message));

    res.status(200).json({
      success: true,
      message: `Applicant ${status} successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.fetchAllAmenities = async (req, res) => {
  try {
    const data = await Amenity.find().sort({ category: 1, id: 1 });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch amenities",
      error: error.message,
    });
  }
};

exports.getGroupedAmenities = async (req, res) => {
  try {
    const data = await amenities
      .find()
      .sort({ category: 1, id: 1 })
      .select("_id id name category icon");

    const grouped = {};

    data.forEach((amenity) => {
      if (!grouped[amenity.category]) {
        grouped[amenity.category] = {
          category: amenity.category,
          icon: amenity.icon,
          amenities: [],
        };
      }

      grouped[amenity.category].amenities.push({
        _id: amenity._id,
        id: amenity.id,
        name: amenity.name,
      });
    });

    return res.status(200).json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch amenities",
      error: error.message,
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Amenity.distinct("category");
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.addAmenities = async (req, res) => {
  try {
    const { name, category } = req.body;

    const userId = req.user.id;

    const user = await User.findById(userId).select("userType");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.userType === "worker" ||
      user.userType === "customer"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add amenities",
      });
    }

    const CATEGORY_ICONS = {
      "Financial Benefits": "💰",
      "Accommodation & Food": "🏠",
      "Travel": "🚌",
      "Safety & Medical": "🛡️",
      "Leave": "📅",
      "Work & Career": "📈",
      "Employee Rewards": "🏆",
    };

    if (!CATEGORY_ICONS[category]) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const existingAmenity = await Amenity.findOne({ name });

    if (existingAmenity) {
      return res.status(400).json({
        success: false,
        message: "Amenity already exists",
      });
    }

    const lastAmenity = await Amenity.findOne().sort({ id: -1 });

    const nextId = lastAmenity ? lastAmenity.id + 1 : 1;

    const amenity = await Amenity.create({
      id: nextId,
      name,
      category,
      icon: CATEGORY_ICONS[category],
      createdBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Amenity added successfully",
      data: amenity,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;

    const user = await User.findById(req.user.id).select("userType");

    if (!user || user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update amenities",
      });
    }

    const CATEGORY_ICONS = {
      "Financial Benefits": "💰",
      "Accommodation & Food": "🏠",
      "Travel": "🚌",
      "Safety & Medical": "🛡️",
      "Leave": "📅",
      "Work & Career": "📈",
      "Employee Rewards": "🏆",
    };

    if (category && !CATEGORY_ICONS[category]) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Prevent duplicate names
    if (name) {
      const existingAmenity = await Amenity.findOne({
        name,
        _id: { $ne: id },
      });

      if (existingAmenity) {
        return res.status(400).json({
          success: false,
          message: "Amenity with this name already exists",
        });
      }
    }

    const amenity = await Amenity.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(category && {
          category,
          icon: CATEGORY_ICONS[category],
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Amenity updated successfully",
      data: amenity,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteAmenity = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id).select("userType");

    if (!user || user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete amenities",
      });
    }

    // Check if any job is using this amenity
    const jobUsingAmenity = await Job.findOne({
      amenities: id,
    });

    if (jobUsingAmenity) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete amenity because it is being used in one or more jobs.",
      });
    }

    const amenity = await Amenity.findByIdAndDelete(id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Amenity deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
