/**
 * models/ApprovalRequest.model.js  –  Theatre approval requests
 */

const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName:  { type: String, required: true },
  ownerEmail: { type: String, required: true },

  // Theatre data submitted for review
  theatreData: {
    name:      { type: String, required: true },
    location:  { type: String, required: true },
    city:      { type: String, required: true },
    image:     { type: String, default: '' },
    type:      { type: String, enum: ['IMAX', 'PVR', 'Standard', '4DX'], default: 'Standard' },
    amenities: [{ type: String }],
    screens: [{
      name: String,
      rows: Number,
      cols: Number,
    }],
  },

  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:   { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt:  { type: Date, default: null },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // If approved, reference the created theatre
  theatreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

approvalRequestSchema.index({ ownerId: 1 });
approvalRequestSchema.index({ status: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
