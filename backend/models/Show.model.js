/**
 * models/Show.model.js  –  Shows / Screenings collection
 *
 * A "show" is one screening: a specific movie at a specific theatre screen
 * on a specific date + time. This gives us proper seat-locking per show.
 */

const mongoose = require('mongoose');

// ── Per-seat state for this show ───────────────────────────────────────────────
const showSeatSchema = new mongoose.Schema({
  seatId:        { type: String, required: true },   // "A1", "B12"
  row:           { type: String, required: true },
  col:           { type: Number, required: true },
  category:      { type: String, enum: ['normal', 'silver', 'gold', 'premium'], default: 'normal' },
  price:         { type: Number, required: true },

  // Booking state
  isBooked:      { type: Boolean, default: false },
  bookedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Owner block
  isBlocked:     { type: Boolean, default: false },
  blockedReason: { type: String, default: '' },

  // Temporary 5-min lock during checkout
  isLocked:      { type: Boolean, default: false },
  lockedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockedAt:      { type: Date, default: null },
  lockExpiresAt: { type: Date, default: null },
}, { _id: false });

// ── Main show schema ───────────────────────────────────────────────────────────
const showSchema = new mongoose.Schema({
  movieId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Movie',   default: null },
  theatreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },

  // Snapshot fields
  movieTitle:  { type: String, default: '' },
  theatreName: { type: String, default: '' },
  screenName:  { type: String, default: 'Screen 1' },

  date:     { type: String, required: true },  // "YYYY-MM-DD"
  time:     { type: String, required: true },  // "07:30 PM"
  language: { type: String, required: true },
  format:   { type: String, enum: ['2D', '3D', 'IMAX', '4DX', 'Dolby', '4K'], default: '2D' },

  // Pricing overrides (can differ per show)
  prices: {
    normal:  { type: Number, default: 120 },
    silver:  { type: Number, default: 180 },
    gold:    { type: Number, default: 250 },
    premium: { type: Number, default: 350 },
  },

  // Seat map for this specific show
  seats: [showSeatSchema],

  // Quick counts (updated on booking/cancellation)
  totalSeats:     { type: Number, default: 0 },
  availableSeats: { type: Number, default: 0 },
  bookedSeats:    { type: Number, default: 0 },

  // Flags
  isActive:       { type: Boolean, default: true },
  isCancelled:    { type: Boolean, default: false },
  isOwnerManaged: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Virtual: fill percentage ───────────────────────────────────────────────────
showSchema.virtual('fillPercentage').get(function () {
  if (!this.totalSeats) return 0;
  return Math.round(((this.totalSeats - this.availableSeats) / this.totalSeats) * 100);
});

// ── Indexes ────────────────────────────────────────────────────────────────────
showSchema.index({ movieId: 1, theatreId: 1, date: 1 });
showSchema.index({ theatreId: 1, date: 1 });
showSchema.index({ date: 1, language: 1 });
showSchema.index({ 'seats.isLocked': 1, 'seats.lockExpiresAt': 1 });

module.exports = mongoose.model('Show', showSchema);
