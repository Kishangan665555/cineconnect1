/**
 * models/Movie.model.js  –  Movies collection
 */

const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const castMemberSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  role:  { type: String, trim: true, default: '' },
  image: { type: String, default: '' },  // base64 or URL
}, { _id: false });

const userRatingSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating:   { type: Number, required: true, min: 1, max: 10 },
  review:   { type: String, default: '' },
  date:     { type: Date, default: Date.now },
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────

const movieSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Movie title is required'], trim: true },
  genre:       [{ type: String, trim: true }],
  language:    [{ type: String, trim: true }],
  duration:    { type: Number, required: true, min: 1 },    // in minutes
  rating:      { type: Number, default: 0, min: 0, max: 10 },
  aiRating:    { type: Number, default: 0, min: 0, max: 10 },
  votes:       { type: Number, default: 0 },
  releaseDate: { type: String, required: true },             // YYYY-MM-DD
  certificate: { type: String, enum: ['U', 'UA', 'A', 'S'], default: 'UA' },
  director:    { type: String, default: '' },
  trailerUrl:  { type: String, default: '' },
  description: { type: String, default: '' },

  // Images (URLs or base64)
  poster: { type: String, default: '' },
  banner: { type: String, default: '' },

  // Flags
  isNowShowing: { type: Boolean, default: false },
  isComingSoon: { type: Boolean, default: false },
  isTrending:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },

  // Relations
  cast:        [{ type: String }],
  castMembers: [castMemberSchema],
  userRatings: [userRatingSchema],

  // Engagement
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  interests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Virtual: average user rating ──────────────────────────────────────────────
movieSchema.virtual('avgUserRating').get(function () {
  if (!this.userRatings || !this.userRatings.length) return null;
  const sum = this.userRatings.reduce((s, r) => s + r.rating, 0);
  return parseFloat((sum / this.userRatings.length).toFixed(1));
});

// ── Indexes ───────────────────────────────────────────────────────────────────
// NOTE: Do NOT use { title: 'text', language: 'text' } — MongoDB treats a field named
// 'language' as a text-index language override, causing errors with array values.
// Use a regular index on title for performance; search uses $regex in controller.
movieSchema.index({ title: 1 });
movieSchema.index({ isNowShowing: 1 });
movieSchema.index({ isComingSoon: 1 });
movieSchema.index({ isTrending: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ languages: 1 });    // safe field name — avoids MongoDB language override
movieSchema.index({ releaseDate: -1 });

module.exports = mongoose.model('Movie', movieSchema);
