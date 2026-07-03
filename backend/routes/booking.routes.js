/**
 * routes/booking.routes.js
 *
 * Fixed: added /my route for currently-logged-in user's bookings
 * and ensured verify route is properly ordered before /:id wildcard.
 */

const router = require('express').Router();
const ctrl   = require('../controllers/booking.controller');
const { protect, adminOnly } = require('../middleware/auth');

// Must come before /:id wildcard
router.get('/my',                  protect, ctrl.getMyBookings);
router.get('/my/all',              protect, ctrl.getMyBookingsAll);
router.get('/my/stats',            protect, ctrl.getMyBookingsStats);
router.get('/verify/:bookingId',   protect, ctrl.verifyBooking);
router.get('/user/:userId',        protect, ctrl.getUserBookings);
router.get('/theatre/:theatreId',  protect, ctrl.getTheatreBookings);

// Wildcard
router.get('/',                    protect, adminOnly, ctrl.getAllBookings);
router.get('/:id',                 protect, ctrl.getBooking);

router.post('/',                   protect, ctrl.createBooking);
router.put('/:id/cancel',          protect, ctrl.cancelBooking);

module.exports = router;
