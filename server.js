const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes'); 
const { notFound, errorHandler } = require('./middleware/errorMiddleware'); 
const applicationRoutes = require('./routes/applicationRoutes'); 

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
app.use('/api/applications', applicationRoutes); 

// Base Test Route
app.get('/', (req, res) => {
  res.send('API is running successfully...');
});

// Error Handling Middlewares (Must be at the very bottom, after all routes)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));