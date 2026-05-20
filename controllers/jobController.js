const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private
exports.createJob = asyncHandler(async (req, res) => {
  const { title, company, description, requirements, salary, location } = req.body;

  // Basic Input Validation Optimization
  if (!title || !company || !description) {
    res.status(400);
    throw new Error('Please fill in all required fields (Title, Company, Description)');
  }

  const job = await Job.create({
    recruiter: req.user._id,
    title,
    company,
    description,
    requirements,
    salary,
    location,
  });

  res.status(201).json({ message: 'Job posted successfully', job });
});

// @desc    Get all job postings
// @route   GET /api/jobs
// @access  Private
exports.getJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find().populate('recruiter', 'name email');
  res.status(200).json(jobs);
});