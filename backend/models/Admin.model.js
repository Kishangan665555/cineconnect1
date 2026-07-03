/**
 * models/Admin.model.js
 * Separate Admin collection — completely independent from regular Users
 *
 * Features:
 *  - bcrypt password hashing
 *  - Role-based permissions (super_admin, manager, moderator)
 *  - Login attempt tracking & account locking
 *  - Activity log
 *  - JWT refresh token storage
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const activitySchema = new mongoose.Schema({
  action:    { type: String, required: true },
  detail:    { type: String, default: '' },
  ip:        { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const adminSchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────────────────────
  name: {
    type: String, required: [true, 'Admin name is required'],
    trim: true, minlength: 2, maxlength: 80,
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String, required: [true, 'Password is required'], minlength: 8,
    select: false, // never returned in queries by default
  },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },

  // ── Role & Permissions ────────────────────────────────────────────────────
  // super_admin : full access (can manage admins)
  // manager     : can manage movies, theatres, bookings, coupons
  // moderator   : read-only + can review approval requests
  adminRole: {
    type: String,
    enum: ['super_admin', 'manager', 'moderator'],
    default: 'manager',
  },
  permissions: {
    manageMovies:    { type: Boolean, default: true },
    manageTheatres:  { type: Boolean, default: true },
    manageBookings:  { type: Boolean, default: true },
    manageCoupons:   { type: Boolean, default: true },
    manageUsers:     { type: Boolean, default: false },
    manageAdmins:    { type: Boolean, default: false },
    viewReports:     { type: Boolean, default: true },
  },

  // ── Security ─────────────────────────────────────────────────────────────
  isActive:        { type: Boolean, default: true },
  isSuperAdmin:    { type: Boolean, default: false },
  loginAttempts:   { type: Number, default: 0 },
  lockUntil:       { type: Date },
  lastLogin:       { type: Date },
  lastLoginIp:     { type: String, default: '' },
  passwordChangedAt: { type: Date },

  // JWT refresh token (hashed)
  refreshToken: { type: String, select: false },

  // Password reset
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },

  // ── Activity Log ──────────────────────────────────────────────────────────
  activityLog: {
    type: [activitySchema],
    default: [],
    // keep only last 100 entries
    validate: {
      validator: (arr) => arr.length <= 100,
      message: 'Activity log exceeds 100 entries',
    },
  },

  // ── 2FA (optional future use) ─────────────────────────────────────────────
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret:  { type: String, select: false },

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.twoFactorSecret;
      return ret;
    },
  },
});

// ── Virtual: is account locked ────────────────────────────────────────────────
adminSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── Pre-save: hash password ───────────────────────────────────────────────────
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  next();
});

// ── Method: compare password ─────────────────────────────────────────────────
adminSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ── Method: increment login attempts (lock after 5) ───────────────────────────
adminSchema.methods.incLoginAttempts = async function () {
  // If lock has expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set:   { loginAttempts: 1 },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  // Lock for 15 minutes after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 };
  }
  return this.updateOne(updates);
};

// ── Method: add activity log entry ───────────────────────────────────────────
adminSchema.methods.addActivity = async function (action, detail = '', ip = '', userAgent = '') {
  // Keep only last 99 + new entry
  const log = this.activityLog.slice(-99);
  log.push({ action, detail, ip, userAgent, timestamp: new Date() });
  this.activityLog = log;
  await this.save();
};

// ── Indexes ──────────────────────────────────────────────────────────────────
// NOTE: email index is auto-created by unique:true — do NOT add a duplicate schema.index
adminSchema.index({ adminRole: 1 });
adminSchema.index({ isActive: 1 });

module.exports = mongoose.model('Admin', adminSchema);
