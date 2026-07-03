/**
 * models/Conversation.model.js
 * One-to-one conversation between two users.
 * Identified by a sorted pair of participant IDs for fast O(1) lookup.
 */
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Always exactly 2 participants, stored sorted so lookup is symmetric
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage:   { type: String, default: '' },
  lastMessageAt: { type: Date,   default: Date.now },
}, { timestamps: true });

// Compound index for fast "find conversation between A and B"
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
