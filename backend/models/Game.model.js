const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['trivia', 'guess_scene', 'dialogue', 'rapid_fire'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  timeLimit: {
    type: Number, // Total time limit or per question depending on game type
    default: 30
  },
  blurIntensity: {
    type: Number, // Max blur in px applied to Guess the Scene media (0 = no blur, 20 = heavy)
    default: 4,
    min: 0,
    max: 20
  },
  rewardPoints: {
    type: Number, // Base points for completing/winning the game
    default: 100
  },
  thumbnail: {
    type: String, // Preview image for the game hub
    default: ''
  },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    mediaUrl: { type: String, default: '' }, // Used for guess scene (blurred image)
    originalMediaUrl: { type: String, default: '' }, // Used to reveal after guess
    points: { type: Number, default: 10 }
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);
