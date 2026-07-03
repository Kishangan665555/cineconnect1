/**
 * models/Theatre.model.js  –  Theatres collection
 *
 * Each theatre has screens → rows/cols → seats (generated on creation).
 * Seat states: isBooked (confirmed booking), isBlocked (owner blocked),
 *              isLocked (temporary 5-min hold during checkout).
 */

const mongoose = require('mongoose');

// ── Seat ──────────────────────────────────────────────────────────────────────
const seatSchema = new mongoose.Schema({
  seatId:        { type: String, required: true },      // e.g. "A1", "B12"
  row:           { type: String, required: true },
  col:           { type: Number, required: true },
  category:      { type: String, enum: ['normal', 'silver', 'gold', 'premium'], default: 'normal' },
  price:         { type: Number, required: true },

  // State flags
  isBooked:      { type: Boolean, default: false },     // confirmed booking
  isBlocked:     { type: Boolean, default: false },     // owner blocked
  blockedReason: { type: String, default: '' },

  // Temporary lock (seat hold during checkout)
  isLocked:      { type: Boolean, default: false },
  lockedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockedAt:      { type: Date, default: null },
  lockExpiresAt: { type: Date, default: null },
}, { _id: false });

// ── Screen ────────────────────────────────────────────────────────────────────
const screenSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  rows:  { type: Number, required: true, min: 1, max: 26 },
  cols:  { type: Number, required: true, min: 1, max: 50 },
  seats: [seatSchema],
}, { _id: true });

// ── ShowTime ──────────────────────────────────────────────────────────────────
const showTimeSchema = new mongoose.Schema({
  time:     { type: String, required: true },     // "06:30 PM"
  date:     { type: String, required: true },     // "YYYY-MM-DD"
  language: { type: String, required: true },
  format:   { type: String, enum: ['2D', '3D', 'IMAX', '4DX', 'Dolby', '4K'], default: '2D' },
  availableSeats: { type: Number, default: 0 },
  totalSeats:     { type: Number, default: 0 },
  movieId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', default: null },
  isOwnerManaged: { type: Boolean, default: false },
  priceOverride: {
    normal:  { type: Number, default: null },
    silver:  { type: Number, default: null },
    gold:    { type: Number, default: null },
    premium: { type: Number, default: null },
  },
}, { _id: true });

// ── Theatre Approval Request (embedded) ───────────────────────────────────────
// Stored separately in ApprovalRequest model — see below.

// ── Theatre ───────────────────────────────────────────────────────────────────
const theatreSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Theatre name required'], trim: true },
  location: { type: String, required: true, trim: true },
  city:     { type: String, required: true, trim: true },
  image:    { type: String, default: '' },
  type:     { type: String, enum: ['IMAX', 'PVR', 'Standard', '4DX'], default: 'Standard' },
  amenities: [{ type: String }],

  screens:   [screenSchema],
  showTimes: [showTimeSchema],

  // Owner reference
  ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, default: '' },

  // Approval workflow
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:      { type: String, default: '' },
  reviewedAt:     { type: Date, default: null },

  isActive: { type: Boolean, default: false },   // becomes true on approval

  // Location coords (optional)
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  // Seat View Management data (uploaded by theatre owner)
  seatViewData: {
    view2DImage:   { type: String, default: '' },      // base64 or URL — 2D layout
    panoramaImage: { type: String, default: '' },      // equirectangular 360° panorama
    uploadedImages: [{ type: String }],               // raw uploads
    seatViewMapping: [{
      rowPrefix:     { type: String },                // e.g. "A", "B-C"
      panoramaImage: { type: String, default: '' },
      distance:      { type: Number, default: null },
      angle:         { type: Number, default: null },
    }],
    updatedAt: { type: Date, default: null },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Indexes ───────────────────────────────────────────────────────────────────
theatreSchema.index({ city: 1 });
theatreSchema.index({ ownerId: 1 });
theatreSchema.index({ approvalStatus: 1 });
theatreSchema.index({ city: 1, approvalStatus: 1, isActive: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);
