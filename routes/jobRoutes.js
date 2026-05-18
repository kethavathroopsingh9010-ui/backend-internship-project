const express = require('express');
const router = express.Router();
const { createJob, getJobs } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

// Both creating and getting jobs will require a valid login token now
router.route('/')
  .post(protect, createJob)
  .get(protect, getJobs);

module.exports = router;