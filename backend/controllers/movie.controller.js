/**
 * controllers/movie.controller.js
 *
 * All movie operations backed by MongoDB via Mongoose.
 *
 * Fixes:
 *  1. rateMovie: userId now uses req.user._id (ObjectId) not req.body.userId (string)
 *  2. toggleLike: userId from authenticated user, not client-supplied string
 *  3. All responses use consistent { success, data/movie/movies } shape
 *  4. getMovies: supports search via regex (text index may not be configured yet)
 *  5. createMovie supports multipart or JSON body (poster/banner as base64 or URL)
 *  6. deleteMovie returns success:true shape
 */

const Movie   = require('../models/Movie.model');
const Booking = require('../models/Booking.model');
const mongoose = require('mongoose');

// ── GET /api/movies ────────────────────────────────────────────────────────────
exports.getMovies = async (req, res) => {
  try {
    const { status, genre, language, search, city, limit } = req.query;
    const filter = { isActive: { $ne: false } };

    if (status === 'now')      filter.isNowShowing = true;
    if (status === 'soon')     filter.isComingSoon  = true;
    if (status === 'trending') filter.isTrending    = true;

    if (genre)    filter.genre    = { $in: Array.isArray(genre) ? genre : [genre] };
    if (language) filter.language = { $in: Array.isArray(language) ? language : [language] };

    // Full-text search if text index is available, else regex
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { director:    { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const q = Movie.find(filter).sort({ releaseDate: -1 });
    if (limit) q.limit(parseInt(limit, 10));

    const movies = await q;
    res.json({ success: true, movies, count: movies.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/movies/:id ────────────────────────────────────────────────────────
exports.getMovie = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
    res.json({ success: true, movie });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/movies  (admin only) ─────────────────────────────────────────────
exports.createMovie = async (req, res) => {
  try {
    const {
      title, genre, language, duration, rating, aiRating,
      releaseDate, certificate, director, trailerUrl, description,
      poster, banner, isNowShowing, isComingSoon, isTrending,
      cast, castMembers,
    } = req.body;

    if (!title)       return res.status(400).json({ success: false, message: 'Title is required' });
    const finalDuration = Number(duration) || 120;
    const finalReleaseDate = releaseDate || new Date().toISOString().split('T')[0];

    const movie = await Movie.create({
      title, director: director || '',
      genre:       Array.isArray(genre)    ? genre    : (genre    ? [genre]    : []),
      language:    Array.isArray(language) ? language : (language ? [language] : []),
      duration:    finalDuration,
      rating:      Number(rating)   || 0,
      aiRating:    Number(aiRating) || 0,
      releaseDate: finalReleaseDate, certificate: certificate || 'UA',
      trailerUrl:  trailerUrl  || '',
      description: description || '',
      poster:      poster  || '',
      banner:      banner  || '',
      isNowShowing: Boolean(isNowShowing),
      isComingSoon: Boolean(isComingSoon),
      isTrending:   Boolean(isTrending),
      cast:        Array.isArray(cast) ? cast : [],
      castMembers: Array.isArray(castMembers) ? castMembers : [],
    });

    res.status(201).json({ success: true, movie });
  } catch (err) {
    console.error('Error creating movie:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PUT /api/movies/:id  (admin only) ─────────────────────────────────────────
exports.updateMovie = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    // Normalize arrays
    const update = { ...req.body };
    if (update.genre    && !Array.isArray(update.genre))    update.genre    = [update.genre];
    if (update.language && !Array.isArray(update.language)) update.language = [update.language];
    if (update.duration) update.duration = Number(update.duration);

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

    res.json({ success: true, movie });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/movies/:id  (admin only) ──────────────────────────────────────
exports.deleteMovie = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }
    // Soft-delete: mark as inactive
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/movies/:id/rate  (authenticated user) ───────────────────────────
exports.rateMovie = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    const { rating, review, bookingId } = req.body;
    const userId   = req.user._id;          // ObjectId from JWT middleware
    const userName = req.user.name || req.user.username || 'Anonymous';

    if (!rating || Number(rating) < 1 || Number(rating) > 10) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 10' });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

    // Remove any existing rating from this user (compare as string to handle both ObjectId and string)
    movie.userRatings = movie.userRatings.filter(
      r => String(r.userId) !== String(userId)
    );

    movie.userRatings.push({
      userId,
      userName,
      rating:  Number(rating),
      review:  review || '',
      date:    new Date(),
    });

    // Recalculate aggregate rating
    const avg    = movie.userRatings.reduce((s, r) => s + r.rating, 0) / movie.userRatings.length;
    movie.rating = Math.round(avg * 10) / 10;
    movie.votes  = movie.userRatings.length;

    await movie.save();

    // Mark booking as rated
    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      try {
        await Booking.findByIdAndUpdate(bookingId, { hasRated: true });
      } catch { /* non-critical */ }
    }

    res.json({ success: true, movie });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/movies/:id/like ─────────────────────────────────────────────────
exports.toggleLike = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    const { action } = req.body;   // action: 'like' | 'dislike' | 'interest'
    const userId = req.user._id;   // ObjectId from JWT — never trust client-supplied userId

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

    const toggle = (arr, uid) => {
      const idx = arr.findIndex(id => String(id) === String(uid));
      if (idx === -1) { arr.push(uid); return true; }
      arr.splice(idx, 1); return false;
    };

    if (action === 'like') {
      const added = toggle(movie.likes, userId);
      if (added) movie.dislikes = movie.dislikes.filter(id => String(id) !== String(userId));
    } else if (action === 'dislike') {
      const added = toggle(movie.dislikes, userId);
      if (added) movie.likes = movie.likes.filter(id => String(id) !== String(userId));
    } else if (action === 'interest') {
      toggle(movie.interests, userId);
    } else {
      return res.status(400).json({ success: false, message: "action must be 'like', 'dislike', or 'interest'" });
    }

    await movie.save();

    res.json({
      success: true,
      likes:     movie.likes.length,
      dislikes:  movie.dislikes.length,
      interests: movie.interests.length,
      isLiked:      movie.likes.some(id => String(id) === String(userId)),
      isDisliked:   movie.dislikes.some(id => String(id) === String(userId)),
      isInterested: movie.interests.some(id => String(id) === String(userId)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/movies/now-showing  (quick alias) ─────────────────────────────────
exports.getNowShowing = async (req, res) => {
  try {
    const movies = await Movie.find({ isNowShowing: true, isActive: { $ne: false } })
      .sort({ releaseDate: -1 })
      .limit(20);
    res.json({ success: true, movies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/movies/coming-soon ────────────────────────────────────────────────
exports.getComingSoon = async (req, res) => {
  try {
    const movies = await Movie.find({ isComingSoon: true, isActive: { $ne: false } })
      .sort({ releaseDate: 1 })
      .limit(20);
    res.json({ success: true, movies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/movies/trending ───────────────────────────────────────────────────
exports.getTrending = async (req, res) => {
  try {
    const movies = await Movie.find({ isTrending: true, isActive: { $ne: false } })
      .sort({ rating: -1, votes: -1 })
      .limit(10);
    res.json({ success: true, movies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
