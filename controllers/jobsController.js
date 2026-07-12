const Job = require('../models/job');
const User = require('../models/User');
const Application = require('../models/Application');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const Amenity = require('../models/amenities');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    let filter = { "approvalStatus": "approved" };

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

    const sortOrder = sortMap[sort] || { createdAt: -1 };

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

    const data = jobs.map((job) => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      latitude: job.latitude,
      longitude: job.longitude,
      workersNeeded: job.quantity,
      duration: job.duration || null,
      salary: job.salary,
      salaryType: job.salaryType,
      isUrgent: job.isUrgent,
      amenities: job.amenities,
      applicationsCount: job.applicationsCount || 0,
      status: job.status,
      approvalStatus: job.approvalStatus,
      postedAt: job.createdAt,
      postedBy: {
        id: job.postedBy?._id,
        name: job.postedBy?.name,
        designation: job.postedBy?.designation,
        companyName: job.postedBy?.companyName
      }
    }));

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


    const job = await Job.findById(id).select("title company location latitude longitude quantity salary salaryType isUrgent duration description experience applicationsCount status approvalStatus postedBy amenities").populate("postedBy", "name designation companyName").populate("amenities", "id name category icon")
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

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
      .populate('job', 'title company location latitude longitude salary salaryType isUrgent duration description experience status approvalStatus')
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
    const { title, company, location, latitude, longitude, quantity, salary, salaryType, isUrgent, duration, description, experience, amenities } = req.body;

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

    const workersNeeded = Number(quantity);
    if (
      isNaN(workersNeeded) ||
      workersNeeded <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      latitude: latitude ? latitude.trim() : null,
      longitude: longitude ? longitude.trim() : null,
      quantity: workersNeeded,
      salary: parsedSalary,
      salaryType: salaryType,
      isUrgent: isUrgent,
      duration: duration,
      description: description.trim(),
      amenities: amenityObjectIds,
      experience: exp,
      postedBy: req.user.id,
      isActive: true,
      approvalStatus: 'approved',
      autoApproved: true,
      approvedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Job created and published successfully',
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

    await Job.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete job', error: error.message });
  }
};

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
      rating: w.adminRating != null ? w.adminRating : null,
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
      .populate('applicant', 'name profileImage primarySkill skills experience phone city workState isVerified adminRating')
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

    const job = await Job.findById(id).select('postedBy');
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
