/**
 * controllers/admin.auth.controller.js
 *
 * Separate Admin Authentication — completely independent from user auth.
 *
 * Endpoints:
 *  POST   /api/admin/auth/login          – Admin login
 *  POST   /api/admin/auth/logout         – Admin logout (clears refresh token)
 *  GET    /api/admin/auth/me             – Get current admin profile
 *  PUT    /api/admin/auth/me             – Update admin profile
 *  PUT    /api/admin/auth/change-password – Change admin password
 *  POST   /api/admin/auth/refresh        – Refresh JWT token
 *  POST   /api/admin/auth/create         – Super admin creates new admin
 *  GET    /api/admin/auth/list           – Super admin lists all admins
 *  PUT    /api/admin/auth/toggle/:id     – Super admin activate/deactivate admin
 *  DELETE /api/admin/auth/:id            – Super admin delete admin
 */

const jwt   = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin  = require('../models/Admin.model');

const JWT_SECRET         = process.env.JWT_SECRET         || 'cineconnect_jwt_secret_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'cineconnect_refresh_secret_2024';
const JWT_EXPIRE         = process.env.JWT_EXPIRE         || '2h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

// ── Token generators ─────────────────────────────────────────────────────────
const signAccessToken = (adminId, adminRole, isSuperAdmin) =>
  jwt.sign(
    { id: adminId, role: 'admin', adminRole, isSuperAdmin, type: 'admin_access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );

const signRefreshToken = (adminId) =>
  jwt.sign(
    { id: adminId, type: 'admin_refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRE }
  );

// ── Helper: send token response ───────────────────────────────────────────────
const sendTokenResponse = (admin, statusCode, res, message = 'Success') => {
  const accessToken  = signAccessToken(admin._id, admin.adminRole, admin.isSuperAdmin);
  const refreshToken = signRefreshToken(admin._id);

  // Store hashed refresh token in DB
  Admin.findByIdAndUpdate(admin._id, {
    $set: { refreshToken: bcrypt.hashSync(refreshToken, 10) }
  }).exec();

  // Cookie options for refresh token
  const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     '/api/admin',
  };

  res
    .status(statusCode)
    .cookie('adminRefreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      message,
      accessToken,
      refreshToken, // also send in body for non-cookie clients
      expiresIn: JWT_EXPIRE,
      admin: {
        id:           admin._id,
        name:         admin.name,
        email:        admin.email,
        adminRole:    admin.adminRole,
        isSuperAdmin: admin.isSuperAdmin,
        permissions:  admin.permissions,
        avatar:       admin.avatar,
        lastLogin:    admin.lastLogin,
      },
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/login
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find admin — explicitly select password (it's excluded by default)
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
        code: 'ACCOUNT_LOCKED',
        lockUntil: admin.lockUntil,
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account has been deactivated. Contact super admin.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Compare password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      await admin.incLoginAttempts();
      const attemptsLeft = Math.max(0, 5 - (admin.loginAttempts + 1));
      return res.status(401).json({
        success: false,
        message: attemptsLeft > 0
          ? `Invalid credentials. ${attemptsLeft} attempt(s) remaining.`
          : 'Account locked due to too many failed attempts.',
        code: 'INVALID_CREDENTIALS',
        attemptsLeft,
      });
    }

    // ✅ Successful login — reset attempts, update last login
    await Admin.findByIdAndUpdate(admin._id, {
      $set:   { lastLogin: new Date(), lastLoginIp: req.ip || '', loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    });

    // Log activity
    try {
      await admin.addActivity(
        'LOGIN',
        `Logged in from ${req.ip || 'unknown IP'}`,
        req.ip || '',
        req.headers['user-agent'] || ''
      );
    } catch { /* non-critical */ }

    sendTokenResponse(admin, 200, res, 'Login successful');
  } catch (err) {
    console.error('[Admin Auth] Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    // Clear refresh token in DB
    if (req.admin?._id) {
      await Admin.findByIdAndUpdate(req.admin._id, { $unset: { refreshToken: 1 } });
    }

    // Clear cookie
    res.clearCookie('adminRefreshToken', { path: '/api/admin' });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
exports.refresh = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const token = req.cookies?.adminRefreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    if (decoded.type !== 'admin_refresh') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    // Find admin
    const admin = await Admin.findById(decoded.id).select('+refreshToken');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin not found or inactive' });
    }

    // Generate new access token only
    const accessToken = signAccessToken(admin._id, admin.adminRole, admin.isSuperAdmin);

    res.json({
      success: true,
      accessToken,
      expiresIn: JWT_EXPIRE,
      admin: {
        id:           admin._id,
        name:         admin.name,
        email:        admin.email,
        adminRole:    admin.adminRole,
        isSuperAdmin: admin.isSuperAdmin,
        permissions:  admin.permissions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/auth/me
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/auth/me
// ─────────────────────────────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { $set: { name, phone, avatar } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const admin = await Admin.findById(req.admin._id).select('+password');
    const isMatch = await admin.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    // Log activity
    try {
      await admin.addActivity('PASSWORD_CHANGED', 'Admin changed their password', req.ip || '');
    } catch { /* non-critical */ }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/create  [super_admin only]
// ─────────────────────────────────────────────────────────────────────────────
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, adminRole, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'An admin with this email already exists',
      });
    }

    const newAdmin = await Admin.create({
      name,
      email,
      password,
      phone:     phone     || '',
      adminRole: adminRole || 'manager',
      isSuperAdmin: adminRole === 'super_admin',
      permissions: permissions || {
        manageMovies:   true,
        manageTheatres: true,
        manageBookings: true,
        manageCoupons:  true,
        manageUsers:    false,
        manageAdmins:   false,
        viewReports:    true,
      },
    });

    // Log activity on creator
    try {
      const creator = await Admin.findById(req.admin._id);
      await creator.addActivity('CREATED_ADMIN', `Created admin: ${email}`, req.ip || '');
    } catch { /* non-critical */ }

    res.status(201).json({
      success: true,
      message: `Admin account created for ${newAdmin.email}`,
      admin: newAdmin,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/auth/list  [super_admin only]
// ─────────────────────────────────────────────────────────────────────────────
exports.listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({})
      .select('-password -refreshToken -twoFactorSecret')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/auth/toggle/:id  [super_admin only]
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Can't deactivate yourself
    if (admin._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      success: true,
      message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      admin,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/auth/permissions/:id  [super_admin only]
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePermissions = async (req, res) => {
  try {
    const { permissions, adminRole } = req.body;
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: { permissions, adminRole, isSuperAdmin: adminRole === 'super_admin' } },
      { new: true, runValidators: true }
    );
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/auth/:id  [super_admin only]
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/auth/activity  [super_admin only]
// ─────────────────────────────────────────────────────────────────────────────
exports.getActivityLog = async (req, res) => {
  try {
    const admins = await Admin.find({})
      .select('name email adminRole activityLog')
      .sort({ updatedAt: -1 });

    // Flatten all activity logs with admin info
    const allActivity = admins.flatMap(a =>
      a.activityLog.map(log => ({
        ...log,
        adminName:  a.name,
        adminEmail: a.email,
        adminRole:  a.adminRole,
      }))
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 200);

    res.json({ success: true, count: allActivity.length, activity: allActivity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
