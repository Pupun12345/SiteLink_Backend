const Job = require('../models/job');
const User = require('../models/User');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const { location, type, search } = req.query;

    let filter = {};

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name companyName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Get single job by ID with applicants
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name companyName');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Get sample applicants (workers who might have applied)
    const applicants = await User.find({ 
      userType: 'worker',
      verificationStatus: 'verified'
    })
    .select('name role profileImage createdAt')
    .limit(5)
    .sort({ createdAt: -1 });

    // Transform applicants data
    const transformedApplicants = applicants.map((applicant, index) => ({
      id: applicant._id,
      name: applicant.name,
      role: applicant.role || 'Worker',
      applied: index === 0 ? '2h ago' : index === 1 ? '5h ago' : new Date(applicant.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: index % 2 === 0 ? 'shortlisted' : 'pending',
      avatar: applicant.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg'
    }));

    // Format job data
    const jobData = {
      ...job.toJSON(),
      id: job.jobId,
      role: job.title,
      vendor: job.company,
      qty: job.quantity,
      apps: job.applicationsCount.toString(),
      date: new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      applicants: transformedApplicants
    };

    res.status(200).json({
      success: true,
      data: jobData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Invalid Job ID',
      error: error.message,
    });
  }
};

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      postedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create job',
      error: error.message,
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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
    res.status(400).json({
      success: false,
      message: 'Failed to update job',
      error: error.message,
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message,
    });
  }
};