const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes'); 

// Loading environment variables
dotenv.config();

// Connecting to MongoDB
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json()); // Essential for parsing incoming req.body JSON

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes); 

// Base Test Route
app.get('/', (req, res) => {
  res.send('API is running successfully...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));