/**
 * models/Notification.model.js
 *
 * Real-time notification system storage.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Notification title is required'], 
    trim: true 
  },
  message: { 
    type: String, 
    required: [true, 'Notification message is required'], 
    trim: true 
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'payment', 'booking', 'offer', 'verification'],
    default: 'info',
  },
  senderRole: {
    type: String,
    enum: ['system', 'admin'],
    default: 'admin',
  },
  targetRole: {
    type: String,
    enum: ['all_users', 'all_theatre_owners', 'specific_user', 'specific_theatre_owner'],
    required: true,
  },
  targetUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Can also refer to Theatre Owner, so logic checks role
    default: null 
  },
  readStatus: { 
    type: Boolean, 
    default: false 
  },
  actionLink: {
    type: String,
    default: null,
  },
  deliveredAt: { 
    type: Date, 
    default: null 
  },
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt
  toJSON: { virtuals: true },
});

// ── Indexes ───────────────────────────────────────────────────────────────────
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ targetRole: 1 });
notificationSchema.index({ targetUserId: 1 });
notificationSchema.index({ readStatus: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
