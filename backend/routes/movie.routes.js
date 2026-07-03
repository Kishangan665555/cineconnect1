/**
 * routes/movie.routes.js
 *
 * Full MongoDB-backed movie routes.
 * Public: GET list, GET by id, GET now-showing, coming-soon, trending
 * Protected: rate (user), like/dislike/interest (user)
 * Admin-only: create, update, delete
 */

const router = require('express').Router();
const ctrl   = require('../controllers/movie.controller');
const { protect, adminOnly } = require('../middleware/auth');

// ── Public routes ─────────────────────────────────────────────────────────────
// Named aliases — must be before /:id wildcard
router.get('/now-showing',  ctrl.getNowShowing);
router.get('/coming-soon',  ctrl.getComingSoon);
router.get('/trending',     ctrl.getTrending);

// Main list + single
router.get('/',             ctrl.getMovies);
router.get('/:id',          ctrl.getMovie);

// ── Protected — authenticated user ────────────────────────────────────────────
router.post('/:id/rate',    protect, ctrl.rateMovie);
router.post('/:id/like',    protect, ctrl.toggleLike);

// ── Admin only ────────────────────────────────────────────────────────────────
router.post('/',            protect, adminOnly, ctrl.createMovie);
router.put('/:id',          protect, adminOnly, ctrl.updateMovie);
router.delete('/:id',       protect, adminOnly, ctrl.deleteMovie);

module.exports = router;