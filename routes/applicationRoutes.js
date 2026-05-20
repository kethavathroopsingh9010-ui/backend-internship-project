const express = require('express');
const router = express.Router();
const { applyToJob, getJobApplications } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

// Paths streamlined to exactly match specification requirements
router.post('/:jobId', protect, applyToJob); // Hits: POST /api/applications/:jobId
router.get('/job/:jobId', protect, getJobApplications); // Hits: GET /api/applications/job/:jobId

module.exports = router;