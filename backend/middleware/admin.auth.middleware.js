/**
 * middleware/admin.auth.middleware.js
 *
 * Middleware exclusively for Admin routes.
 * Completely separate from the regular user auth middleware.
 *
 * Usage:
 *   const { protectAdmin, superAdminOnly, requirePermission } = require('./admin.auth.middleware');
 *
 *   router.get('/list', protectAdmin, superAdminOnly, listAdmins);
 *   router.post('/movies', protectAdmin, requirePermission('manageMovies'), addMovie);
 */

const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin.model');

const JWT_SECRET = process.env.JWT_SECRET || 'cineconnect_jwt_secret_2024';

// ─────────────────────────────────────────────────────────────────────────────
// protectAdmin
// Verifies the JWT is a valid ADMIN token (type: 'admin_access')
// Attaches req.admin with the full admin document
// ─────────────────────────────────────────────────────────────────────────────
exports.protectAdmin = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin token required.',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.slice(7);

    // 2. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Admin session expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token.',
        code: 'INVALID_TOKEN',
      });
    }

    // 3. Verify this is an admin token (not a regular user token)
    if (decoded.role !== 'admin' || decoded.type !== 'admin_access') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint requires an admin token.',
        code: 'NOT_ADMIN_TOKEN',
      });
    }

    // 4. Load admin from DB — verify they still exist and are active
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found.',
        code: 'ADMIN_NOT_FOUND',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account has been deactivated.',
        code: 'ADMIN_INACTIVE',
      });
    }

    // 5. Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Admin account is temporarily locked.',
        code: 'ADMIN_LOCKED',
      });
    }

    // ✅ Attach admin to request
    req.admin = admin;
    next();
  } catch (err) {
    console.error('[Admin Auth Middleware]', err.message);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// superAdminOnly
// Requires the authenticated admin to have isSuperAdmin: true
// Must be used AFTER protectAdmin
// ─────────────────────────────────────────────────────────────────────────────
exports.superAdminOnly = (req, res, next) => {
  if (!req.admin?.isSuperAdmin && req.admin?.adminRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin privileges required.',
      code: 'NOT_SUPER_ADMIN',
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// requirePermission(permissionKey)
// Checks a specific permission in admin.permissions
// Must be used AFTER protectAdmin
//
// Example: requirePermission('manageMovies')
// ─────────────────────────────────────────────────────────────────────────────
exports.requirePermission = (permissionKey) => (req, res, next) => {
  // Super admins bypass all permission checks
  if (req.admin?.isSuperAdmin) return next();

  if (!req.admin?.permissions?.[permissionKey]) {
    return res.status(403).json({
      success: false,
      message: `Access denied. You don't have '${permissionKey}' permission.`,
      code: 'INSUFFICIENT_PERMISSION',
      required: permissionKey,
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// logAdminAction (non-blocking middleware — logs actions without blocking response)
// ─────────────────────────────────────────────────────────────────────────────
exports.logAdminAction = (action) => async (req, _res, next) => {
  // Run async in background — don't block request
  setImmediate(async () => {
    try {
      if (req.admin?._id) {
        const admin = await Admin.findById(req.admin._id);
        if (admin) {
          await admin.addActivity(
            action,
            `${req.method} ${req.originalUrl}`,
            req.ip || '',
            req.headers['user-agent'] || ''
          );
        }
      }
    } catch { /* non-critical */ }
  });
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// rateLimit (simple in-memory rate limiter for admin login)
// Limits: 10 requests per minute per IP on login route
// ─────────────────────────────────────────────────────────────────────────────
const loginAttemptMap = new Map(); // ip -> { count, resetAt }

exports.adminLoginRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const WINDOW = 60 * 1000; // 1 minute
  const MAX_ATTEMPTS = 10;

  const record = loginAttemptMap.get(ip);

  if (!record || record.resetAt < now) {
    loginAttemptMap.set(ip, { count: 1, resetAt: now + WINDOW });
    return next();
  }

  record.count += 1;

  if (record.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      message: `Too many login attempts. Try again in ${retryAfter} seconds.`,
      code: 'RATE_LIMITED',
    });
  }

  next();
};

// Clean up the map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttemptMap.entries()) {
    if (record.resetAt < now) loginAttemptMap.delete(ip);
  }
}, 5 * 60 * 1000);
