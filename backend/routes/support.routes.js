/**
 * routes/support.routes.js
 * Public support ticket submission
 */
const express = require('express');
const router  = express.Router();
const { createSupportTicket } = require('../controllers/ai.controller');
const { optionalAuth }        = require('../middleware/auth.middleware');

// Lightweight rate limit: 5 tickets per 10 mins per IP (spam prevention)
const ticketLimitStore = new Map();
function ticketRateLimit(req, res, next) {
  const ip     = req.ip || 'unknown';
  const now    = Date.now();
  const window = 10 * 60 * 1000; // 10 minutes
  const limit  = 5;

  const entry = ticketLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    ticketLimitStore.set(ip, { count: 1, resetAt: now + window });
    return next();
  }
  if (entry.count >= limit) {
    return res.status(429).json({
      success: false,
      message: 'Too many support requests. Please wait a few minutes.',
    });
  }
  entry.count++;
  next();
}

router.post('/ticket', ticketRateLimit, optionalAuth, createSupportTicket);

module.exports = router;
