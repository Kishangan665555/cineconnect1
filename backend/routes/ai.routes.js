/**
 * routes/ai.routes.js
 * AI chat + status + movie recommendations — with lightweight rate limiting
 */
const express = require('express');
const router  = express.Router();
const {
  chat, getUserContext, getAIStatus, getMovieRecommendations,
} = require('../controllers/ai.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

// ── Simple in-memory rate limiter (20 requests / 60 min per IP) ──────────────
const rateLimitStore = new Map(); // ip → { count, resetAt }

function aiRateLimit(req, res, next) {
  const ip    = req.ip || req.connection?.remoteAddress || 'unknown';
  const now   = Date.now();
  const limit = parseInt(process.env.AI_RATE_LIMIT || '30');   // per hour
  const window = 60 * 60 * 1000; // 1 hour

  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + window });
    return next();
  }
  if (entry.count >= limit) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a moment before trying again.',
    });
  }
  entry.count++;
  next();
}

// Clean up rate limit store every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 60 * 60 * 1000);

// ── Routes ─────────────────────────────────────────────────────────────────────
router.post('/chat',             aiRateLimit, optionalAuth, chat);
router.get('/context',           protect,                   getUserContext);
router.get('/status',                                       getAIStatus);
router.get('/recommendations',   optionalAuth,              getMovieRecommendations);

module.exports = router;

