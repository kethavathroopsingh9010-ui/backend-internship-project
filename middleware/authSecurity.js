const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const initSecurityHeaders = (app) => {
  app.use(helmet({
    contentSecurityPolicy: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true
  }));
};

const corsConfiguration = cors({
  origin: (process.env.ALLOWED_ORIGINS || '*').split(','), // Fallback to allow all during initial test staging
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint'],
  credentials: true
});

const createApiRateLimiter = (windowMs, maxRequests, errMsg) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, error: errMsg }
  });
};

module.exports = {
  initSecurityHeaders,
  corsConfiguration,
  createApiRateLimiter
};