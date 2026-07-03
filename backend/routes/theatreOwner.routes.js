/**
 * routes/theatreOwner.routes.js
 *
 * Fixed:
 *  - Added show CRUD routes (add/edit/delete/cancel a show)
 *  - Added bookings route for theatre owner
 *  - All protected with JWT via `protect` middleware
 */

const router = require('express').Router();
const ctrl   = require('../controllers/theatreOwner.controller');
const showCtrl = require('../controllers/show.controller');
const payoutCtrl = require('../controllers/payout.controller');
const { protect, ownerOrAdmin } = require('../middleware/auth');

// ── Public ─────────────────────────────────────────────────────────────────────
router.post('/register', ctrl.register);

// ── Protected — Theatre Owner Approval Status ───────────────────────────────────
router.get('/status', protect, ctrl.getStatus);

// ── Premium Dashboard APIs ─────────────────────────────────────────────────────
router.get('/dashboard',         protect, ctrl.getDashboard);
router.get('/analytics',         protect, ctrl.getAnalytics);
router.get('/seat-map/:showId',  protect, ctrl.getSeatMap);
router.get('/shows',             protect, ctrl.getOwnerShows);
router.get('/bookings',          protect, ctrl.getOwnerBookings);
router.get('/payouts',           protect, payoutCtrl.getOwnerPayouts);
router.get('/earnings',          protect, payoutCtrl.getTheatreOwnerEarnings);

// ── Show Management (Theatre Owner CRUD) ────────────────────────────────────────
// POST /api/theatre-owner/shows — create a new show
router.post('/shows',             protect, ownerOrAdmin, ctrl.createShow);

// PUT /api/theatre-owner/shows/:id — edit a show
router.put('/shows/:id',          protect, ownerOrAdmin, ctrl.updateShow);

// DELETE /api/theatre-owner/shows/:id — delete / deactivate a show
router.delete('/shows/:id',       protect, ownerOrAdmin, ctrl.deleteShow);

// POST /api/theatre-owner/shows/:id/cancel — mark a show cancelled
router.post('/shows/:id/cancel',  protect, ownerOrAdmin, ctrl.cancelShow);

// POST /api/theatre-owner/shows/:id/block-seat
router.post('/shows/:id/block-seat',   protect, ownerOrAdmin, showCtrl.blockSeat);
// POST /api/theatre-owner/shows/:id/unblock-seat
router.post('/shows/:id/unblock-seat', protect, ownerOrAdmin, showCtrl.unblockSeat);

module.exports = router;
