/**
 * controllers/seat.controller.js
 *
 * Seat locking system — 5-minute temporary hold during checkout.
 * Lock seats → confirm (convert to isBooked) → unlock (on timeout/cancel).
 * A cron job calls releaseExpiredLocks() every 2 minutes.
 */

const Theatre = require('../models/Theatre.model');

const LOCK_MINUTES = parseInt(process.env.SEAT_LOCK_MINUTES || '5', 10);

/**
 * POST /api/seats/lock
 * Body: { theatreId, screenId, seatIds: string[], showId }
 *
 * Locks the given seats for LOCK_MINUTES for the current user.
 * Returns 409 if any seat is already locked/booked by someone else.
 */
exports.lockSeats = async (req, res, next) => {
  try {
    const { theatreId, screenId, seatIds, showId } = req.body;
    if (!theatreId || !seatIds || !seatIds.length) {
      return res.status(400).json({ success: false, message: 'theatreId and seatIds required.' });
    }

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });

    // Find correct screen
    const screen = screenId
      ? theatre.screens.id(screenId)
      : theatre.screens[0];
    if (!screen) return res.status(404).json({ success: false, message: 'Screen not found.' });

    const now       = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);
    const uid       = req.user._id;

    // Check each seat
    for (const sid of seatIds) {
      const seat = screen.seats.find(s => s.seatId === sid);
      if (!seat) {
        return res.status(404).json({ success: false, message: `Seat ${sid} not found.` });
      }
      if (seat.isBooked) {
        return res.status(409).json({ success: false, message: `Seat ${sid} is already booked.` });
      }
      if (seat.isBlocked) {
        return res.status(409).json({ success: false, message: `Seat ${sid} is blocked by the theatre.` });
      }
      if (seat.isLocked && seat.lockedBy && !seat.lockedBy.equals(uid)) {
        const remaining = Math.ceil((seat.lockExpiresAt - now) / 1000 / 60);
        return res.status(409).json({
          success: false,
          message: `Seat ${sid} is held by another user. Try again in ${remaining} min.`,
        });
      }
    }

    // Lock all seats
    screen.seats.forEach(seat => {
      if (seatIds.includes(seat.seatId)) {
        seat.isLocked      = true;
        seat.lockedBy      = uid;
        seat.lockedAt      = now;
        seat.lockExpiresAt = expiresAt;
      }
    });
    await theatre.save();

    res.json({
      success: true,
      message: `${seatIds.length} seat(s) locked for ${LOCK_MINUTES} minutes.`,
      lockedSeats: seatIds,
      expiresAt,
      lockMinutes: LOCK_MINUTES,
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/seats/unlock
 * Body: { theatreId, screenId, seatIds: string[] }
 *
 * Releases locks held by the current user (e.g. on payment cancel / page leave).
 */
exports.unlockSeats = async (req, res, next) => {
  try {
    const { theatreId, screenId, seatIds } = req.body;
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });

    const screen = screenId ? theatre.screens.id(screenId) : theatre.screens[0];
    if (!screen) return res.status(404).json({ success: false, message: 'Screen not found.' });

    const uid = req.user._id;
    screen.seats.forEach(seat => {
      if (seatIds.includes(seat.seatId) && seat.isLocked && seat.lockedBy?.equals(uid)) {
        seat.isLocked      = false;
        seat.lockedBy      = null;
        seat.lockedAt      = null;
        seat.lockExpiresAt = null;
      }
    });
    await theatre.save();

    res.json({ success: true, message: 'Seats unlocked.' });
  } catch (err) { next(err); }
};

/**
 * GET /api/seats/:theatreId/status
 * Returns the current seat state for a theatre's first screen.
 */
exports.getSeatStatus = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const { screenId } = req.query;

    const theatre = await Theatre.findById(theatreId).select('screens');
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });

    const screen = screenId ? theatre.screens.id(screenId) : theatre.screens[0];
    if (!screen) return res.status(404).json({ success: false, message: 'Screen not found.' });

    // Return only necessary fields
    const seats = screen.seats.map(s => ({
      seatId: s.seatId, row: s.row, col: s.col,
      category: s.category, price: s.price,
      isBooked: s.isBooked, isBlocked: s.isBlocked,
      isLocked: s.isLocked,
      // Only expose who locked if it's the current user
      lockedByMe: s.lockedBy && req.user ? s.lockedBy.equals(req.user._id) : false,
      lockExpiresAt: s.lockExpiresAt,
    }));

    res.json({ success: true, data: { screenId: screen._id, name: screen.name, seats } });
  } catch (err) { next(err); }
};

/**
 * POST /api/seats/block  (theatre owner or admin)
 * Body: { theatreId, screenId, seatId, reason }
 */
exports.blockSeat = async (req, res, next) => {
  try {
    const { theatreId, screenId, seatId, reason = 'Blocked by owner' } = req.body;
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });

    // Auth: must be theatre owner or admin
    if (req.user.role !== 'admin' && !theatre.ownerId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    const screen = screenId ? theatre.screens.id(screenId) : theatre.screens[0];
    if (!screen) return res.status(404).json({ success: false, message: 'Screen not found.' });

    const seat = screen.seats.find(s => s.seatId === seatId);
    if (!seat) return res.status(404).json({ success: false, message: `Seat ${seatId} not found.` });

    seat.isBlocked     = true;
    seat.blockedReason = reason;
    await theatre.save();

    res.json({ success: true, message: `Seat ${seatId} blocked.`, data: seat });
  } catch (err) { next(err); }
};

/**
 * POST /api/seats/unblock  (theatre owner or admin)
 * Body: { theatreId, screenId, seatId }
 */
exports.unblockSeat = async (req, res, next) => {
  try {
    const { theatreId, screenId, seatId } = req.body;
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });

    if (req.user.role !== 'admin' && !theatre.ownerId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    const screen = screenId ? theatre.screens.id(screenId) : theatre.screens[0];
    const seat   = screen?.seats.find(s => s.seatId === seatId);
    if (!seat) return res.status(404).json({ success: false, message: `Seat ${seatId} not found.` });

    seat.isBlocked     = false;
    seat.blockedReason = '';
    await theatre.save();

    res.json({ success: true, message: `Seat ${seatId} unblocked.` });
  } catch (err) { next(err); }
};

/**
 * releaseExpiredLocks  –  Called by cron job every 2 minutes.
 * Finds all seats whose lockExpiresAt < now and releases them.
 * Returns the count of released locks.
 */
exports.releaseExpiredLocks = async () => {
  const now = new Date();
  const result = await Theatre.updateMany(
    { 'screens.seats.isLocked': true, 'screens.seats.lockExpiresAt': { $lt: now } },
    {
      $set: {
        'screens.$[].seats.$[seat].isLocked':      false,
        'screens.$[].seats.$[seat].lockedBy':      null,
        'screens.$[].seats.$[seat].lockedAt':      null,
        'screens.$[].seats.$[seat].lockExpiresAt': null,
      },
    },
    {
      arrayFilters: [{ 'seat.isLocked': true, 'seat.lockExpiresAt': { $lt: now } }],
      multi: true,
    }
  );
  return result.modifiedCount || 0;
};
