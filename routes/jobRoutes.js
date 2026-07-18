const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobDetailsById,
  applyToJob,
  appliedJobs,
  createJob,
  likeUnlikeJob,
  addJobComment,
  updateJobComment,
  deleteJobComment,
  getJobComments,
  deleteJob,
  getJobApplicants,
  updateApplicantStatus,
  getPendingJobs,
  approveJob,
  rejectJob,
  getMyJobs,
} = require('../controllers/jobsController');
const { protect, applicable, requireAdmin } = require('../middleware/auth');

// GET all jobs
router.get('/', getJobs);

router.get("/getAppliedJobs", protect, appliedJobs);

// GET jobs posted by the current user, any approvalStatus — must come before '/:id'
router.get('/my', protect, getMyJobs);

// GET jobs awaiting approval (admin only) — must come before '/:id'
router.get('/admin/pending', protect, requireAdmin, getPendingJobs);

// GET single job (protected — vendor contact gating needs req.user)
router.get('/:id', protect, getJobDetailsById);

// POST apply to job (protected)
router.post('/:id/apply', protect,applicable, applyToJob);

// GET applicants for a job (job owner / admin)
router.get('/:id/applicants', protect, getJobApplicants);

// PUT update an applicant's status (job owner / admin)
router.put('/:id/applicants/:applicationId/status', protect, updateApplicantStatus);

// POST create job (protected)
router.post('/', protect, createJob);

// Approve / reject a pending job (admin only)
router.put('/:id/approve', protect, requireAdmin, approveJob);
router.put('/:id/reject', protect, requireAdmin, rejectJob);

// Like/Unlike a job
router.put('/:id/like', protect, likeUnlikeJob);

// Comments for jobs
router.post('/:id/comments', protect, addJobComment);
router.put('/:jobId/comments/:commentId', protect, updateJobComment);
router.delete('/:jobId/comments/:commentId', protect, deleteJobComment);
router.get('/:id/comments', getJobComments);

// Delete job
router.delete('/:id', protect, deleteJob);

module.exports = router;