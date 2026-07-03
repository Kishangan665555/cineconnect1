/**
 * routes/admin.dashboard.routes.js
 *
 * Admin-protected routes for the full dashboard.
 * All routes require a valid admin JWT.
 *
 * Mounted at: /api/admin
 */

const router = require('express').Router();
const {
  protectAdmin,
  superAdminOnly,
  requirePermission,
  logAdminAction,
} = require('../middleware/admin.auth.middleware');

// Controllers
const movieCtrl   = require('../controllers/movie.controller');
const theatreCtrl = require('../controllers/theatre.controller');
const bookingCtrl = require('../controllers/booking.controller');
const couponCtrl  = require('../controllers/coupon.controller');
const userCtrl    = require('../controllers/user.controller');
const adminNotifCtrl = require('../controllers/admin.notification.controller');
const payoutCtrl  = require('../controllers/payout.controller');
const settingsCtrl= require('../controllers/adminSettings.controller');
const refundCtrl  = require('../controllers/refund.controller');

// ── All admin routes require admin token ──────────────────────────────────────
router.use(protectAdmin);

// ── Dashboard Stats ───────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const Movie   = require('../models/Movie.model');
    const Theatre = require('../models/Theatre.model');
    const Booking = require('../models/Booking.model');
    const User    = require('../models/User.model');
    const Admin   = require('../models/Admin.model');

    const [
      totalMovies, totalTheatres, totalBookings,
      totalUsers, totalAdmins,
      confirmedBookings, cancelledBookings,
      revenueResult,
    ] = await Promise.all([
      Movie.countDocuments(),
      Theatre.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments(),
      Admin.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookings = await Booking.countDocuments({ createdAt: { $gte: today } });

    // Recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('movieId', 'title');

    res.json({
      success: true,
      stats: {
        totalMovies, totalTheatres, totalBookings,
        totalUsers, totalAdmins, confirmedBookings,
        cancelledBookings, totalRevenue, todayBookings,
      },
      recentBookings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Movies ────────────────────────────────────────────────────────────────────
router.get('/movies',           requirePermission('manageMovies'), movieCtrl.getMovies);
router.get('/movies/:id',       requirePermission('manageMovies'), movieCtrl.getMovie);
router.post('/movies',          requirePermission('manageMovies'), logAdminAction('ADD_MOVIE'), movieCtrl.createMovie);
router.put('/movies/:id',       requirePermission('manageMovies'), logAdminAction('UPDATE_MOVIE'), movieCtrl.updateMovie);
router.delete('/movies/:id',    requirePermission('manageMovies'), logAdminAction('DELETE_MOVIE'), movieCtrl.deleteMovie);

// ── Theatres ──────────────────────────────────────────────────────────────────
router.get('/theatres',          requirePermission('manageTheatres'), theatreCtrl.getTheatres);
router.get('/theatres/:id',      requirePermission('manageTheatres'), theatreCtrl.getTheatre);
router.post('/theatres',         requirePermission('manageTheatres'), logAdminAction('ADD_THEATRE'), theatreCtrl.createTheatre);
router.put('/theatres/:id',      requirePermission('manageTheatres'), logAdminAction('UPDATE_THEATRE'), theatreCtrl.updateTheatre);
router.delete('/theatres/:id',   requirePermission('manageTheatres'), logAdminAction('DELETE_THEATRE'), theatreCtrl.deleteTheatre);

// Approval requests
router.get('/approvals',         requirePermission('manageTheatres'), theatreCtrl.getApprovalRequests || ((req, res) => res.json({ success: true, requests: [] })));
router.put('/approvals/:id',     requirePermission('manageTheatres'), logAdminAction('REVIEW_APPROVAL'), theatreCtrl.reviewApproval || ((req, res) => res.json({ success: true })));

// ── Bookings ──────────────────────────────────────────────────────────────────
router.get('/bookings',          requirePermission('manageBookings'), bookingCtrl.getBookings);
router.get('/bookings/:id',      requirePermission('manageBookings'), bookingCtrl.getBooking);
router.put('/bookings/:id/cancel', requirePermission('manageBookings'), logAdminAction('CANCEL_BOOKING'), bookingCtrl.cancelBooking);

// ── Coupons ───────────────────────────────────────────────────────────────────
router.get('/coupons',           requirePermission('manageCoupons'), couponCtrl.getCoupons);
router.post('/coupons',          requirePermission('manageCoupons'), logAdminAction('ADD_COUPON'), couponCtrl.createCoupon);
router.put('/coupons/:id',       requirePermission('manageCoupons'), logAdminAction('UPDATE_COUPON'), couponCtrl.updateCoupon);
router.delete('/coupons/:id',    requirePermission('manageCoupons'), logAdminAction('DELETE_COUPON'), couponCtrl.deleteCoupon);

// ── Users (super admin or manageUsers) ───────────────────────────────────────
router.get('/users',                   requirePermission('manageUsers'), userCtrl.getUsers);
router.get('/users/:id/bookings',      requirePermission('manageUsers'), userCtrl.getUserBookings);
router.put('/users/:id',               requirePermission('manageUsers'), logAdminAction('UPDATE_USER'), userCtrl.updateUser);
router.put('/users/:id/toggle',        requirePermission('manageUsers'), logAdminAction('TOGGLE_USER'), userCtrl.toggleUser);
router.delete('/users/:id',            superAdminOnly, logAdminAction('DELETE_USER'), userCtrl.deleteUser);

// ── Notifications ─────────────────────────────────────────────────────────────
router.post('/notify-all',       logAdminAction('SEND_NOTIFICATION'), adminNotifCtrl.sendNotification);
router.get('/notifications',     adminNotifCtrl.getAllNotifications);

// ── Admin Management ──────────────────────────────────────────────────────────
// These are in admin.auth.routes.js at /api/admin/auth/*

// ── Theatre Owner Management ──────────────────────────────────────────────────
const toCtrl = require('../controllers/theatreOwner.controller');
router.get('/theatre-owners',              requirePermission('manageUsers'), toCtrl.getAllRequests);
router.get('/theatre-owners/:id',          requirePermission('manageUsers'), toCtrl.getRequestDetail);
router.put('/theatre-owners/:id/approve',  requirePermission('manageUsers'), logAdminAction('APPROVE_THEATRE_OWNER'), toCtrl.approveRequest);
router.put('/theatre-owners/:id/reject',   requirePermission('manageUsers'), logAdminAction('REJECT_THEATRE_OWNER'), toCtrl.rejectRequest);

// ── Settings & Payouts ────────────────────────────────────────────────────────
router.get('/settings',          requirePermission('manageUsers'), settingsCtrl.getSettings);
router.put('/settings',          requirePermission('manageUsers'), logAdminAction('UPDATE_SETTINGS'), settingsCtrl.updateSettings);

router.get('/payouts',           requirePermission('manageUsers'), payoutCtrl.getAllPayouts);
router.post('/payouts',          requirePermission('manageUsers'), logAdminAction('CREATE_PAYOUT'), payoutCtrl.generatePayout);
router.get('/payout-summary',    requirePermission('manageUsers'), payoutCtrl.getAdminPayoutSummary);

// ── Refunds ───────────────────────────────────────────────────────────────────
router.get('/refunds',           requirePermission('manageBookings'), refundCtrl.getAllRefunds);
router.put('/refunds/:id/status',requirePermission('manageBookings'), logAdminAction('UPDATE_REFUND'), refundCtrl.updateRefundStatus);

// ── AI Support Tickets ────────────────────────────────────────────────────────
const aiCtrl = require('../controllers/ai.controller');
router.get('/support/tickets',          protectAdmin, aiCtrl.getAdminSupportTickets);
router.patch('/support/tickets/:id',    protectAdmin, logAdminAction('UPDATE_TICKET'), aiCtrl.updateSupportTicket);
router.get('/support/chat-sessions',    protectAdmin, aiCtrl.getAdminChatSessions);
router.get('/support/chat-sessions/:sessionId', protectAdmin, aiCtrl.getAdminChatSession);

module.exports = router;
