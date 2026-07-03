const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  upiId: { type: String, default: '' },
  bankDetails: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'rejected'],
    default: 'pending'
  },
  adminResponse: { type: String, default: '' },
}, {
  timestamps: true
});

refundSchema.index({ userId: 1 });
refundSchema.index({ status: 1 });

module.exports = mongoose.model('Refund', refundSchema);
