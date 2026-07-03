/**
 * routes/show.routes.js
 *
 * Full wiring to show.controller.js — previously this file used
 * inline Theatre queries and ignored the dedicated controller.
 * Fixed: all endpoints now routed + full seat management connected.
 */

const router = require('express').Router();
const ctrl   = require('../controllers/show.controller');
const { protect, ownerOrAdmin } = require('../middleware/auth');

// ── Public / user-accessible ──────────────────────────────────────────────────
// GET /api/shows?movieId=&city=&date=&language=&theatreId=
router.get('/',    ctrl.getShows);

// GET /api/shows/:id  → full seat map
router.get('/:id', ctrl.getShow);

// ── Seat locking (checkout hold, 5 min) ─────────────────────────────────────
router.post('/:id/lock',   protect, ctrl.lockSeats);
router.post('/:id/unlock', protect, ctrl.unlockSeats);

// ── Theatre owner / admin only ────────────────────────────────────────────────
router.post('/',              protect, ownerOrAdmin, ctrl.createShow);
router.put('/:id',            protect, ownerOrAdmin, ctrl.updateShow);
router.delete('/:id',         protect, ownerOrAdmin, ctrl.deleteShow);
router.post('/:id/block-seat',   protect, ownerOrAdmin, ctrl.blockSeat);
router.post('/:id/unblock-seat', protect, ownerOrAdmin, ctrl.unblockSeat);

module.exports = router;
