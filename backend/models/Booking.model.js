/**
 * models/Booking.model.js  –  Bookings collection
 */

const mongoose = require('mongoose');

const seatDetailSchema = new mongoose.Schema({
  seatId:   { type: String, required: true },
  row:      { type: String, required: true },
  col:      { type: Number, required: true },
  category: { type: String, enum: ['normal', 'silver', 'gold', 'premium'], required: true },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  // References — stored as Mixed so they work with both MongoDB ObjectIds and
  // local seed-data string IDs (e.g. "m1", "th3"). Snapshot fields below are
  // the single source of truth for receipts; refs are only for lookups.
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  movieId:   { type: mongoose.Schema.Types.Mixed, ref: 'Movie',   default: null },
  theatreId: { type: mongoose.Schema.Types.Mixed, ref: 'Theatre', default: null },
  showId:    { type: String, required: true },   // ShowTime._id (as string)

  // Snapshot fields (denormalised so receipts work even if movie/theatre changes)
  movieTitle:   { type: String, required: true },
  theatreName:  { type: String, required: true },
  moviePoster:  { type: String, default: '' },  // snapshot poster URL/base64
  showDate:     { type: String, required: true },  // YYYY-MM-DD
  showTime:     { type: String, required: true },  // "06:30 PM"
  showLanguage: { type: String, default: '' },
  showFormat:   { type: String, default: '2D' },

  // Seats
  seats:       [{ type: String }],               // ["A5", "A6"]
  seatDetails: [seatDetailSchema],

  // Pricing
  totalAmount:  { type: Number, required: true },
  discount:     { type: Number, default: 0 },
  finalAmount:  { type: Number, required: true },
  couponCode:   { type: String, default: '' },
  adminCommission: { type: Number, default: 0 },
  ownerPayout:     { type: Number, default: 0 },

  // Payment
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Cash', 'online', 'Razorpay', 'Demo Payment'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
  },
  transactionId: { type: String, default: '' },

  // Booking lifecycle
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'confirmed',
  },
  bookingDate:  { type: Date, default: Date.now },
  cancelledAt:  { type: Date, default: null },
  cancelledBy:  { type: String, enum: ['user', 'theatre_owner', 'admin', null], default: null },
  refundAmount: { type: Number, default: 0 },
  refundStatus: { type: String, enum: ['none', 'pending', 'processing', 'success', 'rejected'], default: 'none' },
  refundId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Refund', default: null },

  // Post-show
  hasRated: { type: Boolean, default: false },

  // QR / ticket code
  ticketCode: { type: String, unique: true, sparse: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Pre-save: generate unique ticket code ─────────────────────────────────────
bookingSchema.pre('save', function (next) {
  if (!this.ticketCode) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand  = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.ticketCode = `BMS-${stamp}-${rand}`;
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
bookingSchema.index({ userId: 1 });
bookingSchema.index({ theatreId: 1 });
bookingSchema.index({ movieId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: -1 });
// NOTE: ticketCode index is auto-created by unique:true — do NOT add schema.index()

module.exports = mongoose.model('Booking', bookingSchema);
