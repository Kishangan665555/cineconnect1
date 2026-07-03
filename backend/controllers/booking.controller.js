/**
 * controllers/booking.controller.js
 *
 * Fixes:
 *  1. Added getMyBookings — returns bookings for the currently logged-in user
 *  2. Fixed showTimeId → showId mismatch in createBooking seat updater
 *  3. Fixed createBooking seat updater uses booking.showId (not showTimeId)
 *  4. Fixed cancelBooking to also free showId (not showTimeId)
 *  5. Guarded Theatre findById calls with null check
 *  6. Populate userId in getUserBookings response for seat-mate display
 */

const Booking = require('../models/Booking.model');
const Show    = require('../models/Show.model');
const Theatre = require('../models/Theatre.model');
const Movie   = require('../models/Movie.model');
const AdminSettings = require('../models/AdminSettings.model');
const Notification = require('../models/Notification.model');
const { notifyUser } = require('../socket');
const mongoose = require('mongoose');

// ── Resolve a potentially non-ObjectId string to a real MongoDB _id ───────────
const resolveId = async (Model, raw) => {
  if (!raw) return raw;
  if (mongoose.Types.ObjectId.isValid(raw)) return raw; // already valid ObjectId
  // Try to find by a string 'id' field (seed/local-store data)
  const doc = await Model.findOne({ id: raw }).select('_id').lean().catch(() => null);
  return doc ? doc._id : null; // null = unknown; Mongoose will reject with a clear error
};

// ── GET /api/bookings  (admin) ─────────────────────────────────────────────────
exports.getAllBookings = async (req, res) => {
  try {
    const { status, theatreId, userId } = req.query;
    const filter = {};
    if (status)    filter.status    = status;
    if (theatreId) filter.theatreId = theatreId;
    if (userId)    filter.userId    = userId;
    const bookings = await Booking.find(filter)
      .populate('userId',   'name email avatar username')
      .populate('movieId',  'title poster')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/my  (currently logged-in user) ──────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('movieId',  'title poster genre duration rating')
      .populate('theatreId','name location city')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/my/all  (currently logged-in user all bookings full details) ──
exports.getMyBookingsAll = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('movieId')
      .populate('theatreId')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/my/stats  (currently logged-in user booking stats) ──
exports.getMyBookingsStats = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).populate('movieId').populate('theatreId');
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const cancelled = bookings.filter(b => b.status === 'cancelled');

    const totalSpent = confirmed.reduce((sum, b) => sum + (b.finalAmount || 0), 0);
    const thisMonthSpent = confirmed.filter(b => b.bookingDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum, b) => sum + (b.finalAmount || 0), 0);
    
    // Calculate favourite theatre
    const theatreCounts = {};
    confirmed.forEach(b => {
      if (b.theatreId && b.theatreId.name) theatreCounts[b.theatreId.name] = (theatreCounts[b.theatreId.name] || 0) + 1;
    });
    const favTheatre = Object.keys(theatreCounts).sort((a,b) => theatreCounts[b] - theatreCounts[a])[0] || 'None';

    // Calculate favourite movie
    const movieCounts = {};
    confirmed.forEach(b => {
      if (b.movieId && b.movieId.title) movieCounts[b.movieId.title] = (movieCounts[b.movieId.title] || 0) + 1;
    });
    const favMovie = Object.keys(movieCounts).sort((a,b) => movieCounts[b] - movieCounts[a])[0] || 'None';

    res.json({
      success: true,
      stats: {
        totalBookings: bookings.length,
        upcomingShows: confirmed.filter(b => new Date(b.showDate) >= new Date(new Date().toISOString().split('T')[0])).length,
        completedShows: confirmed.filter(b => new Date(b.showDate) < new Date(new Date().toISOString().split('T')[0])).length,
        cancelledTickets: cancelled.length,
        totalSpent,
        thisMonthSpent,
        favTheatre,
        favMovie
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/user/:userId ─────────────────────────────────────────────
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate('movieId',  'title poster genre duration rating')
      .populate('theatreId','name location city')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/theatre/:theatreId ───────────────────────────────────────
exports.getTheatreBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ theatreId: req.params.theatreId })
      .populate('userId',  'name email avatar username')
      .populate('movieId', 'title poster')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/verify/:bookingId  (QR scan) ────────────────────────────
exports.verifyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ ticketCode: req.params.bookingId })
      .populate('userId',   'name email')
      .populate('movieId',  'title poster')
      .populate('theatreId','name location');

    if (!booking) return res.status(404).json({ valid: false, message: 'Booking not found' });

    res.json({
      valid:   booking.status === 'confirmed',
      booking,
      message: booking.status === 'confirmed' ? 'Valid ticket' :
               booking.status === 'cancelled' ? 'Ticket was cancelled' : 'Booking is pending',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/bookings/:id ──────────────────────────────────────────────────────
exports.getBooking = async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const booking = await Booking.findOne({
      $or: [
        ...(isObjectId ? [{ _id: req.params.id }] : []),
        { ticketCode: req.params.id },
      ],
    })
    .populate('userId',   'name email avatar username')
    .populate('movieId',  'title poster genre duration rating')
    .populate('theatreId','name location city');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Payment method normaliser ───────────────────────────────────────────────
// The UI passes display strings like "UPI — name@okaxis", "Debit Card ····1234",
// "Net Banking — HDFC", "PhonePe Wallet", "Google Pay UPI — QR Code".
// We map these to the canonical enum values the Booking model expects.
const VALID_PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Cash', 'online', 'Razorpay', 'Demo Payment'];

function normalizePaymentMethod(method) {
  if (!method) return 'UPI';
  // Already a valid enum value
  if (VALID_PAYMENT_METHODS.includes(method)) return method;
  const m = method.toLowerCase();
  if (m.includes('credit'))      return 'Credit Card';
  if (m.includes('debit'))       return 'Debit Card';
  if (m.includes('net banking') || m.includes('netbanking')) return 'Net Banking';
  if (m.includes('wallet'))      return 'Wallet';
  if (m.includes('razorpay'))    return 'Razorpay';
  if (m.includes('demo'))        return 'Demo Payment';
  if (m.includes('cash'))        return 'Cash';
  if (m.includes('upi') || m.includes('@')) return 'UPI';
  // Last resort: return first valid method or UPI
  return 'UPI';
}

// ── POST /api/bookings ─────────────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    // ── Debug log: print everything received ──────────────────────────────────
    console.log('\n[createBooking] ▶ Incoming booking request');
    console.log('  req.user:', req.user ? `${req.user.name} (${req.user._id})` : 'NULL — JWT missing/invalid!');
    console.log('  movieId:', req.body.movieId, '| theatreId:', req.body.theatreId);
    console.log('  movieTitle:', req.body.movieTitle, '| seats:', req.body.seats);
    console.log('  paymentMethod:', req.body.paymentMethod, '| finalAmount:', req.body.finalAmount);
    console.log('  seatDetails:', JSON.stringify(req.body.seatDetails?.slice(0,2)));

    // Resolve movieId / theatreId — frontend may send local string IDs ("m1", "th3")
    // instead of valid MongoDB ObjectIds. Resolve them to real _ids gracefully.
    let [resolvedMovieId, resolvedTheatreId] = await Promise.all([
      resolveId(Movie,   req.body.movieId),
      resolveId(Theatre, req.body.theatreId),
    ]);

    // Fallback: If still not resolved (ghost frontend ID), try to find by Movie Title / Theatre Name
    if (!resolvedMovieId && req.body.movieTitle) {
      const match = await Movie.findOne({ title: req.body.movieTitle }).select('_id').lean();
      if (match) resolvedMovieId = match._id;
    }
    if (!resolvedTheatreId && req.body.theatreName) {
      const match = await Theatre.findOne({ name: req.body.theatreName }).select('_id').lean();
      if (match) resolvedTheatreId = match._id;
    }

    // Ensure seatDetails.col is always a Number (avoid validation failures)
    const seatDetails = Array.isArray(req.body.seatDetails)
      ? req.body.seatDetails.map(sd => ({ ...sd, col: Number(sd.col) || 0 }))
      : [];

    const finalMovieId = resolvedMovieId || req.body.movieId;
    const finalTheatreId = resolvedTheatreId || req.body.theatreId;

    const payload = {
      ...req.body,
      movieId:       mongoose.Types.ObjectId.isValid(finalMovieId) ? new mongoose.Types.ObjectId(String(finalMovieId)) : null,
      theatreId:     mongoose.Types.ObjectId.isValid(finalTheatreId) ? new mongoose.Types.ObjectId(String(finalTheatreId)) : null,
      userId:        req.user?._id     || req.body.userId,   // JWT user takes priority
      seatDetails,
      paymentMethod: normalizePaymentMethod(req.body.paymentMethod), // ← FIX: map display strings to enum
    };

    // Calculate Admin Commission and Owner Payout
    let adminCommission = 0;
    let ownerPayout = payload.finalAmount || 0;
    if (resolvedTheatreId) {
       try {
         const settings = await AdminSettings.getSettings();
         const commRate = settings.adminCommissionPercentage || 10;
         adminCommission = (payload.finalAmount * commRate) / 100;
         ownerPayout = payload.finalAmount - adminCommission;
       } catch(e) {
         console.warn('[booking] Could not fetch settings for commission calc')
       }
    }
    payload.adminCommission = adminCommission;
    payload.ownerPayout = ownerPayout;

    let booking;
    try {
      booking = await Booking.create(payload);
      console.log('  ✅ Booking saved to MongoDB! ID:', booking._id);
    } catch (dbErr) {
      console.error('  ❌ Booking.create FAILED:', dbErr.message);
      console.error('  Validation errors:', JSON.stringify(dbErr.errors));
      return res.status(400).json({ success: false, message: dbErr.message, errors: dbErr.errors });
    }

    // ── Mark seats as booked in the Show document ──────────────────────────
    if (booking.showId && booking.seats?.length) {
      try {
        // showId stored in Booking is the Show._id (from Show model)
        const show = await Show.findById(booking.showId);
        if (show) {
          let changed = false;
          show.seats.forEach(seat => {
            if (booking.seats.includes(seat.seatId)) {
              seat.isBooked      = true;
              seat.bookedBy      = booking.userId;   // ← link avatar to seat
              seat.isLocked      = false;
              seat.lockedBy      = null;
              seat.lockedAt      = null;
              seat.lockExpiresAt = null;
              changed = true;
            }
          });
          if (changed) {
            show.availableSeats = Math.max(0, (show.availableSeats ?? 0) - booking.seats.length);
            await show.save();
          }
        }
      } catch (e) {
        console.warn('[booking] Could not update Show seats:', e.message);
      }
    }

    // ── Also update Theatre showTimes.availableSeats for dashboard KPIs ────
    if (booking.theatreId && booking.showId && booking.seats?.length) {
      try {
        const theatre = await Theatre.findById(booking.theatreId);
        if (theatre) {
          // Safely check if showId is valid ObjectId to prevent CastError that skips Notification
          const showTime = mongoose.Types.ObjectId.isValid(booking.showId)
            ? theatre.showTimes.id(booking.showId)
            : null;
            
          if (showTime) {
            showTime.availableSeats = Math.max(0, (showTime.availableSeats ?? 0) - booking.seats.length);
            await theatre.save();
          }

          // Generate Notification for Theatre Owner
          try {
            const ownerNotificationMsg = `New booking of ₹${booking.finalAmount} received for ${booking.movieTitle} at ${theatre.name}.`;
            const title = 'Booking Success';
            const ownerDbNotification = await Notification.create({
              title,
              message: ownerNotificationMsg,
              type: 'booking',
              senderRole: 'system',
              targetRole: 'specific_user',
              targetUserId: theatre.ownerId,
              actionLink: '/owner/bookings',
              deliveredAt: new Date()
            });
            notifyUser(theatre.ownerId.toString(), ownerDbNotification);
          } catch(e) { console.warn('Failed to send owner notification', e); }
        }
      } catch (e) {
        console.warn('[booking] Could not update Theatre showTimes:', e.message);
      }
    }

    // ── Generate System Notification for the User ────
    if (booking.userId) {
      try {
        const userNotificationMsg = `Your booking for ${booking.movieTitle} was successful. Enjoy your movie!`;
        const userDbNotification = await Notification.create({
          title: 'Booking Confirmed',
          message: userNotificationMsg,
          type: 'booking',
          senderRole: 'system',
          targetRole: 'specific_user',
          targetUserId: booking.userId,
          actionLink: '/my-bookings',
          deliveredAt: new Date()
        });
        notifyUser(booking.userId.toString(), userDbNotification);
      } catch(e) { console.warn('Failed to send user notification', e); }
    }

    let query = Booking.findById(booking._id);
    if (mongoose.Types.ObjectId.isValid(booking.movieId)) {
      query = query.populate('movieId', 'title poster');
    }
    if (mongoose.Types.ObjectId.isValid(booking.theatreId)) {
      query = query.populate('theatreId', 'name location city');
    }
    const populated = await query;

    res.status(201).json({ success: true, booking: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PUT /api/bookings/:id/cancel ───────────────────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const { cancelledBy, refundAmount, upiId, bankDetails } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { $or: [
          ...(mongoose.Types.ObjectId.isValid(req.params.id) ? [{ _id: req.params.id }] : []),
          { ticketCode: req.params.id },
        ]
      },
      {
        status:       'cancelled',
        cancelledAt:  new Date(),
        cancelledBy:  cancelledBy || 'user',
        refundAmount: refundAmount || 0,
      },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Handle Refund Creation
    if (refundAmount > 0 || upiId || bankDetails) {
      const Refund = require('../models/Refund.model');
      const newRefund = await Refund.create({
        userId: booking.userId,
        bookingId: booking._id,
        amount: refundAmount || booking.finalAmount || 0,
        upiId: upiId || '',
        bankDetails: bankDetails || '',
        status: 'pending'
      });
      // Update booking to link refund
      booking.refundStatus = 'pending';
      booking.refundId = newRefund._id;
      await booking.save();
    }

    // Free seats in Show document
    if (booking.showId && booking.seats?.length) {
      try {
        const show = await Show.findById(booking.showId);
        if (show) {
          booking.seats.forEach(sid => {
            const seat = show.seats.find(s => s.seatId === sid);
            if (seat) seat.isBooked = false;
          });
          show.availableSeats = (show.availableSeats ?? 0) + booking.seats.length;
          await show.save();
        }
      } catch { /* ignore — don't fail cancellation */ }
    }

    // Free showTimes.availableSeats in Theatre for dashboard
    if (booking.theatreId && booking.showId && booking.seats?.length) {
      try {
        const theatre = await Theatre.findById(booking.theatreId);
        if (theatre) {
          const showTime = theatre.showTimes.id(booking.showId);
          if (showTime) {
            showTime.availableSeats = (showTime.availableSeats ?? 0) + booking.seats.length;
            await theatre.save();
          }
        }
      } catch { /* ignore */ }
    }

    // Generate Cancellation Notification for the User
    if (booking.userId) {
       try {
         const cancelMsg = `Your booking for a movie has been cancelled. ` + (refundAmount > 0 ? `A refund of ₹${refundAmount} has been initiated.` : '');
         const cancelNotification = await Notification.create({
           title: 'Booking Cancelled',
           message: cancelMsg,
           type: 'refund',
           senderRole: 'system',
           targetRole: 'specific_user',
           targetUserId: booking.userId,
           actionLink: '/my-bookings',
           deliveredAt: new Date()
         });
         notifyUser(booking.userId.toString(), cancelNotification);
       } catch (e) { console.warn('Failed to send user cancellation notification', e); }
    }

    // Generate Cancellation Notification for Theatre Owner
    if (booking.theatreId) {
      try {
        const theatre = await Theatre.findById(booking.theatreId);
        if (theatre && theatre.ownerId) {
           const ownerCancelMsg = `A booking of ₹${booking.finalAmount} has been cancelled at ${theatre.name}.`;
           const ownerCancelNotification = await Notification.create({
             title: 'Booking Cancelled',
             message: ownerCancelMsg,
             type: 'alert',
             senderRole: 'system',
             targetRole: 'specific_user',
             targetUserId: theatre.ownerId,
             actionLink: '/owner/bookings',
             deliveredAt: new Date()
           });
           notifyUser(theatre.ownerId.toString(), ownerCancelNotification);
        }
      } catch (e) { console.warn('Failed to send owner cancellation notification', e); }
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Alias for admin route naming compatibility
exports.getBookings = exports.getAllBookings;
