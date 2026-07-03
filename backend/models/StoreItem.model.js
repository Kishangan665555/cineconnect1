const mongoose = require('mongoose');

const storeItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  pointCost: { type: Number, required: true },
  thumbnail: { type: String },
  rewardType: { type: String, enum: ['coupon', 'badge', 'perk'], default: 'coupon' },
  discountPercent: { type: Number }, // Only if rewardType is coupon
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('StoreItem', storeItemSchema);
