const mongoose = require('mongoose');

const userScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  score: {
    type: Number,
    required: true,
    default: 0
  },
  accuracy: {
    type: Number, // Percentage of correct answers (0-100)
    default: 0
  },
  speedBonus: {
    type: Number,
    default: 0
  },
  streakMultiplier: {
    type: Number,
    default: 1
  },
  timeSpent: {
    type: Number, // In seconds
    default: 0
  },
  weeklyCycle: {
    type: String, // String representation of the week, e.g., '2024-W15' for weekly leaderboard scoping
    index: true
  }
}, {
  timestamps: true
});

userScoreSchema.index({ score: -1, createdAt: 1 }); // Optimize leaderboard queries

module.exports = mongoose.model('UserScore', userScoreSchema);
