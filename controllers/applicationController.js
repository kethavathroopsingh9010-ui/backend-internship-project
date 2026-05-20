const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Job = require('../models/Job');

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private
exports.applyToJob = asyncHandler(async (req, res) => {
  const { resumeLink, coverLetter } = req.body; 
  const jobId = req.params.jobId;

  // REQUIREMENT GAURD: Recruiters should NOT be allowed to apply
  if (req.user.role === 'recruiter') {
    res.status(403);
    throw new Error('Access denied. Recruiters are not allowed to apply for jobs.');
  }

  // REQUIREMENT GUARD: Validation for empty fields
  if (!resumeLink || !coverLetter) {
    res.status(400);
    throw new Error('Please fill in all required fields (resumeLink, coverLetter)');
  }

  // REQUIREMENT GUARD: Validate job existence before applying
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // REQUIREMENT GUARD: Prevent duplicate applications
  const alreadyApplied = await Application.findOne({
    job: jobId,
    applicant: req.user._id,
  });

  if (alreadyApplied) {
    res.status(400);
    throw new Error('You have already applied for this job');
  }

  const application = await Application.create({
    job: jobId,
    applicant: req.user._id,
    resumeLink, 
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

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  if (job.recruiter.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view applications for this job');
  }

  const applications = await Application.find({ job: jobId })
    .populate('applicant', 'name email') 
    .sort('-createdAt');

  res.status(200).json(applications);
});