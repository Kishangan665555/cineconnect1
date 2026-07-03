/**
 * models/Message.model.js
 * Enhanced message schema supporting text, image, and movie sharing.
 */
const mongoose = require('mongoose');

const movieDataSchema = new mongoose.Schema({
  movieId: { type: String, default: '' },
  title:   { type: String, default: '' },
  poster:  { type: String, default: '' },
  year:    { type: String, default: '' },
  genre:   { type: String, default: '' },
  rating:  { type: String, default: '' },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'movie'],
    default: 'text',
  },
  // Text content
  text: { type: String, trim: true, maxlength: 4000, default: '' },
  // Image message
  imageUrl: { type: String, default: '' },
  // Movie share
  movieData: { type: movieDataSchema, default: null },
  // Delivery status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent',
  },
}, { timestamps: true });

// Compound index for fast paginated fetch
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
