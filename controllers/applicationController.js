const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

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

// ─── APPEND THIS TO YOUR EXISTING applicationController.js ───────────────────
const JobApplication = require('../models/jobApplicationModel');


// @desc    Apply for a specific gig or internship opening
// @route   POST /api/applications/apply/:jobId
exports.applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { workerId } = req.body; // Passed directly from phone session storage

    // Find the targeted job to extract who the owning client is
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job listing not found.' });
    }

    // Guard Clause: Prevent multiple application spamming from the same user account
    const alreadyApplied = await JobApplication.findOne({ job: jobId, worker: workerId });
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already submitted an application to this slot!' });
    }

    // Create the clean tracking document entry row
    const application = await JobApplication.create({
      job: jobId,
      client: job.client || job.clientId,
      worker: workerId,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ message: 'Server failure parsing job request tracking systems', error: error.message });
  }
};