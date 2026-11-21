import rateLimit from 'express-rate-limit';

// Login failures are throttled per client IP. Tests stay deterministic and do not
// share a production-style throttle bucket.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req, res) => res.status(429).json({
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again later.' },
  }),
});
