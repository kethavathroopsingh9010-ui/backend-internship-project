// ─── 1. CORE SYSTEM MODULE IMPORTS ──────────────────────────────────────────
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const morgan = require('morgan'); 
const connectDB = require('./config/db'); 

// Production Security & Service Imports
const { initSecurityHeaders, corsConfiguration, createApiRateLimiter } = require('./middleware/authSecurity');
const RealtimeHub = require('./services/RealtimeHub');

// ─── 2. LOAD INFRASTRUCTURE CONFIGURATIONS ──────────────────────────────────
dotenv.config();

// ─── 3. INITIALIZE APPLICATION AND HTTP WRAPPERS ────────────────────────────
const app = express(); 
const server = http.createServer(app);

// 🚀 Bootstrap Socket.io Layer Engine using our HTTP server layout
const io = RealtimeHub.bootstrap(server);
app.set('io', io); // Exposes the 'io' websocket instance across your controllers

// ─── 4. MOUNT PRODUCTION SECURITY & GLOBAL MIDDLEWARES ──────────────────────
initSecurityHeaders(app);       // Mounts Helmet HTTP armor protections
app.use(corsConfiguration);     // Mounts strict production CORS rules whitelist
app.use(express.json());        // Handles raw incoming JSON parsing vectors
app.use(morgan('dev'));         // Mounted for runtime console profiling logs

// Global Rate Limiting: Prevent DDoS or brute force API mining (15 mins window, max 100 requests)
const globalLimiter = createApiRateLimiter(15 * 60 * 1000, 100, 'Too many requests from this device.');
app.use('/api/', globalLimiter);

// ─── 5. CONNECT PRIMARY DATABASE CLUSTER ───────────────────────────────────
connectDB(); // Fires up your verified Mongoose connection profile parameters

// ─── 6. ROUTE ENDPOINT ROUTING DEFINITIONS ──────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes')); 
app.use('/api/applications', require('./routes/applicationRoutes'));

// ─── 7. CENTRALIZED ERROR PROCESSING HANDLERS ──────────────────────────────
// 🚀 FIXED: Destructured the individual middleware functions from the exported object
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

app.use(notFound);       // Catches fallback unmapped routes and converts them to 404 errors
app.use(errorHandler);   // Processes global exceptions and sends back standard secure JSON formats

// ─── 8. FIRE UP NETWORK LISTENER PORT ───────────────────────────────────────
// Uses port 8080 for clean container routing configurations
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Production-grade server running smoothly on port: ${PORT}`);
});