const mongoose = require('mongoose');

/**
 * GameCategory — defines display metadata for each game category.
 * The `slug` field must match one of the game `type` enum values
 * (trivia | guess_scene | dialogue | rapid_fire) OR a custom slug.
 */
const gameCategorySchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,   // emoji or URL
    default: '🎮',
  },
  color: {
    type: String,   // CSS gradient or hex used for category card accent
    default: 'linear-gradient(135deg, #6366f1, #a855f7)',
  },
  order: {
    type: Number,   // display order on Play Zone page
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('GameCategory', gameCategorySchema);
