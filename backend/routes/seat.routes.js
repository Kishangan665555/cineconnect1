/**
 * routes/seat.routes.js
 */

const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/seat.controller');

router.post('/lock',          protect, ctrl.lockSeats);
router.post('/unlock',        protect, ctrl.unlockSeats);
router.post('/block',         protect, authorize('theatre_owner', 'admin'), ctrl.blockSeat);
router.post('/unblock',       protect, authorize('theatre_owner', 'admin'), ctrl.unblockSeat);
router.get('/:theatreId/status', protect, ctrl.getSeatStatus);

module.exports = router;
