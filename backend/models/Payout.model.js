/**
 * models/Payout.model.js
 * Tracks payouts made from the platform (Admin) to Theatre Owners.
 */

const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  theatreOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  theatreId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' },
  amount:         { type: Number, required: true },
  status:         { type: String, enum: ['pending', 'paid'], default: 'pending' },
  transactionId:  { type: String, default: '' },
  paymentMethod:  { type: String, enum: ['Bank Transfer', 'UPI', 'Razorpay', 'Cash'], default: 'Bank Transfer' },
  periodStart:    { type: Date, required: true },
  periodEnd:      { type: Date, required: true },
  paidAt:         { type: Date },
  adminNote:      { type: String, default: '' },
}, { timestamps: true });

payoutSchema.index({ theatreOwnerId: 1, status: 1 });

module.exports = mongoose.model('Payout', payoutSchema);
