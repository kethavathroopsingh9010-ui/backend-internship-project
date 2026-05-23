const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper func to generate JWT Tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc   Register a new user
// @route  POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body ;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`⚠️ [SIGNUP ATTEMPT] Email already registered: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user in database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user', 
    });

    // 👇 THIS WAS MISSING! SUCCESS LOG FOR SIGNUP
    console.log(`\n✨ [DATABASE SUCCESS] New user registered successfully!`);
    console.log(`   👉 Name: ${user.name}`);
    console.log(`   👉 Email: ${user.email}`);
    console.log(`   👉 Role: ${user.role}\n`);

    // 4. Respond with user info and JWT token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ BACKEND SIGNUP CRASH LOG:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ [LOGIN FAILED] Account not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Compare password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ [LOGIN FAILED] Wrong password for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 👇 THIS WAS MISSING! SUCCESS LOG FOR LOGIN
    console.log(`\n🔓 [DATABASE SUCCESS] User logged in securely!`);
    console.log(`   👉 Account: ${user.email}\n`);

    // 3. Send back user data + token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ BACKEND LOGIN CRASH LOG:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};