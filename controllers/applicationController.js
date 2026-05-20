const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Job = require('../models/Job');

// @desc    Apply for a job
// @route   POST /api/applications/apply/:jobId
// @access  Private
exports.applyToJob = asyncHandler(async (req, res) => {
  const { resume, coverLetter } = req.body;
  const jobId = req.params.jobId;

  // 1. Check if the job exists
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // 2. Check if this candidate has already applied to this specific job
  const alreadyApplied = await Application.findOne({
    job: jobId,
    applicant: req.user._id,
  });

  if (alreadyApplied) {
    res.status(400);
    throw new Error('You have already applied for this job');
  }

  // 3. Create the application record
  const application = await Application.create({
    job: jobId,
    applicant: req.user._id,
    resume,
    coverLetter,
  });

  res.status(201).json({
    message: 'Application submitted successfully!',
    application,
  });
});

// @desc    Get all applications for a specific job (For Recruiters)
// @route   GET /api/applications/job/:jobId
// @access  Private
exports.getJobApplications = asyncHandler(async (req, res) => {
  const jobId = req.params.jobId;

  // 1. Find the job to verify ownership
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // 2. Ensure the logged-in user is the recruiter who actually posted the job
  if (job.recruiter.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view applications for this job');
  }

  // 3. Fetch applications and populate applicant details
  const applications = await Application.find({ job: jobId })
    .populate('applicant', 'name email')
    .sort('-createdAt');

  res.status(200).json(applications);
});