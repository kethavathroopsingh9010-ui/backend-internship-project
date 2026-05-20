const express = require('express');
const router = express.Router();
const { applyToJob, getJobApplications } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware'); // Reusing your JWT guard

// Both routes require a valid login token
router.post('/apply/:jobId', protect, applyToJob);
router.get('/job/:jobId', protect, getJobApplications);

module.exports = router;