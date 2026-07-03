/**
 * models/TheatreOwnerRequest.model.js
 *
 * Stores the full 3-step theatre owner registration data
 * for admin review & approval workflow.
 */

const mongoose = require('mongoose');

const theatreOwnerRequestSchema = new mongoose.Schema({
  // ── Link to user account ────────────────────────────────────────────────────
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Step 1: Basic Details ────────────────────────────────────────────────────
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },

  // ── Step 2: Profile & Verification ───────────────────────────────────────────
  avatar:          { type: String, default: '' },          // base64 or URL
  theatreName:     { type: String, required: true, trim: true },
  theatreLocation: { type: String, required: true, trim: true },
  theatreCity:     { type: String, required: true, trim: true },
  aadhaarNumber:   { type: String, required: true },        // stored masked: XXXX-XXXX-1234
  aadhaarFront:    { type: String, default: '' },           // base64 image
  aadhaarBack:     { type: String, default: '' },           // base64 image
  panNumber:       { type: String, default: '' },
  gstNumber:       { type: String, default: '' },
  licenseNumber:   { type: String, default: '' },

  // ── Step 3: Bank Details ─────────────────────────────────────────────────────
  bankAccountHolder: { type: String, required: true, trim: true },
  bankName:          { type: String, required: true, trim: true },
  bankAccountNumber: { type: String, required: true },      // stored masked: ****XXXX
  bankIfsc:          { type: String, required: true, trim: true, uppercase: true },
  bankBranch:        { type: String, default: '' },
  upiId:             { type: String, default: '' },

  // ── Approval Workflow ────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote:   { type: String, default: '' },
  reviewedAt:  { type: Date, default: null },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  submittedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      // Always mask sensitive fields when sending to client
      if (ret.aadhaarNumber) {
        ret.aadhaarNumberMasked = 'XXXX-XXXX-' + ret.aadhaarNumber.slice(-4);
      }
      if (ret.bankAccountNumber) {
        ret.bankAccountNumberMasked = '****' + ret.bankAccountNumber.slice(-4);
      }
      return ret;
    },
  },
});

// ── Indexes ───────────────────────────────────────────────────────────────────
theatreOwnerRequestSchema.index({ userId: 1 });
theatreOwnerRequestSchema.index({ status: 1 });
theatreOwnerRequestSchema.index({ email: 1 });
theatreOwnerRequestSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('TheatreOwnerRequest', theatreOwnerRequestSchema);
