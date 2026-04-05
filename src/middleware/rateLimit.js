const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  message: { success: false, message: 'Too many requests, slow down!' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = limiter;
