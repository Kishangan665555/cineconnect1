/**
 * models/SupportTicket.model.js
 * Support tickets submitted via the AI Chatbot contact form
 */
const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  // Submitter info (may differ from logged-in user for pre-login submissions)
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true, lowercase: true },

  // Optional link to user account if logged in
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Issue categorization
  issueType: {
    type: String,
    enum: [
      'booking_help', 'cancel_ticket', 'refund', 'payment_failed',
      'login_signup', 'account_issue', 'razorpay_issue', 'coupon_offer',
      'movie_info', 'theatre_info', 'ticket_download', 'bug_report',
      'feature_request', 'speak_to_human', 'other'
    ],
    default: 'other',
  },

  subject: { type: String, default: '' },
  message: { type: String, required: true },

  // Admin management
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'escalated', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  adminReply:    { type: String, default: '' },
  resolvedAt:    { type: Date, default: null },
  resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },

  // Sentiment (set by backend sentiment check)
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'angry'],
    default: 'neutral',
  },

  // Context snapshot
  userAgent: { type: String, default: '' },
  page:      { type: String, default: '' },   // which page user was on
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Indexes
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ email: 1 });
supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ priority: 1, status: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
