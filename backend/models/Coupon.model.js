/**
 * models/Coupon.model.js  –  Coupons collection
 */

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, uppercase: true },
  description:  { type: String, default: '' },
  discount:     { type: Number, required: true, min: 1 },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  maxDiscount:  { type: Number, default: null },    // cap for % coupons
  minAmount:    { type: Number, required: true, default: 0 },
  validTill:    { type: Date, required: true },
  isActive:     { type: Boolean, default: true },
  usageLimit:   { type: Number, default: null },   // null = unlimited
  usageCount:   { type: Number, default: 0 },
  usedBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Virtual: is expired ───────────────────────────────────────────────────────
couponSchema.virtual('isExpired').get(function () {
  return new Date() > new Date(this.validTill);
});

// ── Virtual: is available ─────────────────────────────────────────────────────
couponSchema.virtual('isAvailable').get(function () {
  if (!this.isActive) return false;
  if (this.isExpired) return false;
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return false;
  return true;
});

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);

