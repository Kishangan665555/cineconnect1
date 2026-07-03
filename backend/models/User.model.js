/**
 * models/User.model.js  –  Users collection
 *
 * Roles: user | theatre_owner | admin
 * Passwords are hashed via bcryptjs before save.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'],
    trim: true, minlength: 2, maxlength: 80,
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String, required: [true, 'Password is required'], minlength: 6,
  },
  phone: {
    type: String, trim: true,
    match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
  },
  city:   { type: String, default: 'Mumbai' },
  role:   { type: String, enum: ['user', 'admin', 'theatre_owner'], default: 'user' },
  approvalStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  avatar: { type: String, default: '' },          // base64 or URL
  username: { type: String, trim: true, default: '' },
  gender:   { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  bio:      { type: String, maxlength: 160, default: '' },
  movieInterests: [{ type: String }],

  // Bookings array (booking IDs)
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],

  // Soft delete
  isActive:  { type: Boolean, default: true },
  joinDate:  { type: Date, default: Date.now },

  // Legal Consent
  acceptedTerms:   { type: Boolean, default: false },
  termsAcceptedAt: { type: Date },
  termsVersion:    { type: String, default: '1.0' },

  // Password reset
  resetPasswordToken:   String,
  resetPasswordExpires: Date,

  // Refresh token for JWT rotation
  refreshToken: String,

  // Privacy — when true: hidden from show-mates, profile blocked, messaging disabled
  isPrivate: { type: Boolean, default: false },

  // Play Zone Gamification
  totalScore: { type: Number, default: 0 },
  playStreak: { type: Number, default: 0 },
  lastPlayedAt: { type: Date },
  badges: [{ type: String }],

  // Social graph
  followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // pending requests (for private accounts)
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    },
  },
});

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

// ── Instance method: compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Index ─────────────────────────────────────────────────────────────────────
// NOTE: email index is auto-created by unique:true — do NOT add a duplicate schema.index
userSchema.index({ role: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);
