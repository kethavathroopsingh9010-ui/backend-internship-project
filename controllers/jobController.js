const Job = require('../models/Job');

// @desc    Create a new job posting (Recruiters only)
// @route   POST /api/jobs
// @access  Private
exports.createJob = async (req, res) => {
  try {
    const { title, company, description, requirements, salary, location } = req.body;

    // req.user was attached by our protect middleware
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
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all job postings (Open to all authenticated users)
// @route   GET /api/jobs
// @access  Private
exports.getJobs = async (req, res) => {
  try {
    // .populate('recruiter', 'name email') pulls the recruiter's name/email instead of just showing an ID string
    const jobs = await Job.find().populate('recruiter', 'name email');
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};