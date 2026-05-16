const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

// Defined API endpoints
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;