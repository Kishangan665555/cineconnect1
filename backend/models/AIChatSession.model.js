/**
 * models/AIChatSession.model.js
 * Stores AI chat conversation history per session
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  tokens:    { type: Number, default: 0 },
}, { _id: false });

const aiChatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  messages:  [messageSchema],
  totalTokens: { type: Number, default: 0 },

  // Session metadata
  language: { type: String, enum: ['en', 'hi', 'kn'], default: 'en' },
  page:     { type: String, default: '' },   // page where session started

  // Escalation
  escalatedToHuman: { type: Boolean, default: false },
  escalatedAt:      { type: Date, default: null },

  // Sentiment analysis aggregate
  overallSentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'angry'],
    default: 'neutral',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Auto-expire sessions after 30 days
aiChatSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
aiChatSessionSchema.index({ userId: 1 });

module.exports = mongoose.model('AIChatSession', aiChatSessionSchema);
