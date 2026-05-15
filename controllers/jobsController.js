const Job = require('../models/job');
const User = require('../models/User');
const Application= require('../models/Application');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const { location, search, salaryType, category, sort } = req.query;

    let filter = {};

    if (location) filter.location = { $regex: location, $options: 'i' };
    if (salaryType) filter.salaryType = salaryType;
    if (category) filter.title = { $regex: category, $options: 'i' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      oldest: { createdAt: 1 },
      highestSalary: { salary: -1 },
      lowestSalary: { salary: 1 },
    };

    const sortOrder = sortMap[sort] || { createdAt: -1 };

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name companyName')
      .sort(sortOrder)
      .lean();

    const data = await Promise.all(
      jobs.map(async (job) => {
        return {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          workersNeeded: job.quantity,
          duration: job.duration || null,
          salary: job.salary,
          salaryType: job.salaryType,
          isUrgent: job.isUrgent,
          postedAt: job.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: data.length,
      data,
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
    const applicantId = req.user.id;
    const { coverLetter, experience } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is a worker
    const user = await User.findById(applicantId);
    if (user.userType !== 'worker') {
      return res.status(403).json({
        success: false,
        message: 'Only workers can apply to jobs',
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
      coverLetter,
      experience,
    });

    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 }
    });

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
// @route   POST /api/jobs/:id/getJobDetails
// @access  Private
exports.getJobDetailsById=async(req,res)=>{
  try {
    const { id } = req.params;
    const job = await Job.findById(id)
      .populate('postedBy', 'title comapany location quantity salary salaryType isUrgent duration description experience')
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
// @route   POST /api/jobs/:id/getAppliedJobs
// @access  Private
exports.appliedJobs=async(req,res)=>{
  try {
    const {id:applicantID}=req.params;

    const data=await Application.find({applicant:applicantID})
    .populate('job', 'title company location salary salaryType isUrgent duration description experience')
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