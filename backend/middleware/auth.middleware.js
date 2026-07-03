/**
 * middleware/auth.middleware.js
 *
 * protect       – requires a valid JWT
 * authorize     – requires a specific role
 * optionalAuth  – attaches user if token present, but doesn't fail if absent
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Extract JWT from header: "Authorization: Bearer <token>"
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

/**
 * protect  –  Requires valid JWT. Attaches req.user on success.
 */
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Check user still exists and is active
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    next(err);
  }
};

/**
 * authorize(...roles)  –  Requires the authenticated user to have one of the given roles.
 * Must be used AFTER protect.
 *
 * Example: router.delete('/:id', protect, authorize('admin'), deleteMovie)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required roles: [${roles.join(', ')}]. Your role: ${req.user.role}`,
    });
  }
  next();
};

/**
 * optionalAuth  –  Attaches req.user if a valid token is present; doesn't fail if absent.
 * Useful for public endpoints that behave differently for logged-in users.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (user && user.isActive) req.user = user;
    }
  } catch { /* ignore */ }
  next();
};

module.exports = { protect, authorize, optionalAuth };
