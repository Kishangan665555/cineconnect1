/**
 * controllers/show.controller.js
 *
 * Full CRUD for Shows + seat locking + live seat map.
 */

const Show    = require('../models/Show.model');
const Theatre = require('../models/Theatre.model');
const Movie   = require('../models/Movie.model');

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ── Seat generator (mirrors Theatre model) ─────────────────────────────────────
const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PRICING     = { normal: 120, silver: 180, gold: 250, premium: 350 };

function generateShowSeats(rows, cols, priceOverrides = {}) {
  const seats = [];
  for (let r = 0; r < rows; r++) {
    const rowLetter = ROW_LETTERS[r] ?? String(r);
    let cat = 'normal';
    if      (r >= Math.floor(rows * 0.75)) cat = 'premium';
    else if (r >= Math.floor(rows * 0.50)) cat = 'gold';
    else if (r >= Math.floor(rows * 0.25)) cat = 'silver';
    const price = priceOverrides[cat] || PRICING[cat];
    for (let c = 1; c <= cols; c++) {
      seats.push({
        seatId: `${rowLetter}${c}`, row: rowLetter, col: c, category: cat, price,
        isBooked: false, isBlocked: false, isLocked: false,
        lockedBy: null, lockedAt: null, lockExpiresAt: null,
      });
    }
  }
  return seats;
}

// ── GET /api/shows  (query: theatreId, movieId, date, language) ───────────────
exports.getShows = async (req, res, next) => {
  try {
    const { theatreId, movieId, date, language, city } = req.query;
    const filter = { isActive: true };
    if (theatreId) filter.theatreId = theatreId;
    if (movieId)   filter.movieId   = movieId;
    if (date)      filter.date      = date;
    if (language)  filter.language  = language;

    let shows = await Show.find(filter)
      .populate('movieId',   'title poster rating duration genre certificate')
      .populate('theatreId', 'name location city type amenities image')
      .sort({ date: 1, time: 1 })
      .select('-seats');   // don't send full seat map in list view

    // Filter by city if provided
    if (city) {
      shows = shows.filter(s =>
        s.theatreId && s.theatreId.city &&
        s.theatreId.city.toLowerCase() === city.toLowerCase()
      );
    }

    res.json({ success: true, data: shows, count: shows.length });
  } catch (err) { next(err); }
};

// ── GET /api/shows/:id  (full seat map) ───────────────────────────────────────
exports.getShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movieId',   'title poster rating duration description genre castMembers certificate language')
      .populate('theatreId', 'name location city type amenities image screens');

    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    // Release expired locks on the fly
    const now = new Date();
    let modified = false;
    show.seats.forEach(seat => {
      if (seat.isLocked && seat.lockExpiresAt && seat.lockExpiresAt < now) {
        seat.isLocked = false;
        seat.lockedBy = null;
        seat.lockedAt = null;
        seat.lockExpiresAt = null;
        modified = true;
      }
    });
    if (modified) await show.save();

    res.json({ success: true, data: show });
  } catch (err) { next(err); }
};

// ── POST /api/shows  (admin or theatre owner) ─────────────────────────────────
exports.createShow = async (req, res, next) => {
  try {
    const {
      movieId, theatreId, screenName,
      date, time, language, format,
      prices, rows = 10, cols = 20,
    } = req.body;

    // Verify movie & theatre exist
    const [movie, theatre] = await Promise.all([
      Movie.findById(movieId),
      Theatre.findById(theatreId),
    ]);
    if (!movie)   return res.status(404).json({ success: false, message: 'Movie not found.' });
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found.' });

    // Only admin or theatre owner
    if (req.user.role !== 'admin' && !theatre.ownerId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    // Use theatre screen dimensions if available
    const screen = theatre.screens?.[0];
    const r = screen?.rows || rows;
    const c = screen?.cols || cols;

    const seats = generateShowSeats(r, c, prices || {});
    const totalSeats = seats.length;

    const show = await Show.create({
      movieId, theatreId,
      movieTitle:  movie.title,
      theatreName: theatre.name,
      screenName:  screenName || screen?.name || 'Screen 1',
      date, time, language, format: format || '2D',
      prices: prices || {},
      seats, totalSeats, availableSeats: totalSeats,
      isOwnerManaged: req.user.role === 'theatre_owner',
    });

    res.status(201).json({ success: true, message: 'Show created.', data: show });
  } catch (err) { next(err); }
};

// ── PUT /api/shows/:id  (admin or owner) ─────────────────────────────────────
exports.updateShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const theatre = await Theatre.findById(show.theatreId);
    if (req.user.role !== 'admin' && (!theatre || !theatre.ownerId.equals(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    // Don't allow changing seats via this route
    const { seats: _seats, ...updateData } = req.body;
    Object.assign(show, updateData);
    await show.save();

    res.json({ success: true, message: 'Show updated.', data: show });
  } catch (err) { next(err); }
};

// ── DELETE /api/shows/:id  (admin or owner) ───────────────────────────────────
exports.deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const theatre = await Theatre.findById(show.theatreId);
    if (req.user.role !== 'admin' && (!theatre || !theatre.ownerId.equals(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    show.isActive = false;
    await show.save();
    res.json({ success: true, message: 'Show deactivated.' });
  } catch (err) { next(err); }
};

// ── POST /api/shows/:id/lock  (authenticated user) ───────────────────────────
// Lock seats for 5 minutes during checkout
exports.lockSeats = async (req, res, next) => {
  try {
    const { seatIds } = req.body;
    if (!seatIds || !seatIds.length) {
      return res.status(400).json({ success: false, message: 'No seats specified.' });
    }

    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const now = new Date();
    const lockExpiry = new Date(now.getTime() + LOCK_DURATION_MS);
    const userId = req.user._id;
    const conflicts = [];

    // Check each seat
    for (const sid of seatIds) {
      const seat = show.seats.find(s => s.seatId === sid);
      if (!seat) { conflicts.push(`${sid} not found`); continue; }
      if (seat.isBooked)  { conflicts.push(`${sid} already booked`); continue; }
      if (seat.isBlocked) { conflicts.push(`${sid} is blocked`); continue; }
      if (seat.isLocked && seat.lockExpiresAt > now && !seat.lockedBy?.equals(userId)) {
        conflicts.push(`${sid} held by another user`);
      }
    }

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Seat conflict: ${conflicts.join(', ')}`,
        conflicts,
      });
    }

    // First release any stale locks by this user on other seats
    show.seats.forEach(seat => {
      if (seat.isLocked && seat.lockedBy?.equals(userId)) {
        seat.isLocked = false;
        seat.lockedBy = null;
        seat.lockedAt = null;
        seat.lockExpiresAt = null;
      }
    });

    // Apply new locks
    show.seats.forEach(seat => {
      if (seatIds.includes(seat.seatId)) {
        seat.isLocked      = true;
        seat.lockedBy      = userId;
        seat.lockedAt      = now;
        seat.lockExpiresAt = lockExpiry;
      }
    });

    await show.save();

    res.json({
      success: true,
      message: `${seatIds.length} seat(s) locked for 5 minutes.`,
      lockedUntil: lockExpiry,
      seatIds,
    });
  } catch (err) { next(err); }
};

// ── POST /api/shows/:id/unlock  (authenticated user) ─────────────────────────
exports.unlockSeats = async (req, res, next) => {
  try {
    const { seatIds } = req.body;
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const userId = req.user._id;
    show.seats.forEach(seat => {
      if (
        seatIds.includes(seat.seatId) &&
        seat.isLocked &&
        seat.lockedBy?.equals(userId)
      ) {
        seat.isLocked = false;
        seat.lockedBy = null;
        seat.lockedAt = null;
        seat.lockExpiresAt = null;
      }
    });

    await show.save();
    res.json({ success: true, message: 'Seats unlocked.' });
  } catch (err) { next(err); }
};

// ── POST /api/shows/:id/block-seat  (theatre owner) ──────────────────────────
exports.blockSeat = async (req, res, next) => {
  try {
    const { seatId, reason } = req.body;
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const theatre = await Theatre.findById(show.theatreId);
    if (req.user.role !== 'admin' && (!theatre || !theatre.ownerId.equals(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    const seat = show.seats.find(s => s.seatId === seatId);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });

    seat.isBlocked     = true;
    seat.blockedReason = reason || 'Blocked by theatre';
    await show.save();

    res.json({ success: true, message: `Seat ${seatId} blocked.` });
  } catch (err) { next(err); }
};

// ── POST /api/shows/:id/unblock-seat  (theatre owner) ────────────────────────
exports.unblockSeat = async (req, res, next) => {
  try {
    const { seatId } = req.body;
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

    const theatre = await Theatre.findById(show.theatreId);
    if (req.user.role !== 'admin' && (!theatre || !theatre.ownerId.equals(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    const seat = show.seats.find(s => s.seatId === seatId);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });

    seat.isBlocked     = false;
    seat.blockedReason = '';
    await show.save();

    res.json({ success: true, message: `Seat ${seatId} unblocked.` });
  } catch (err) { next(err); }
};

// ── Utility: release expired locks (called by cron) ──────────────────────────
exports.releaseExpiredLocks = async () => {
  const now = new Date();
  const result = await Show.updateMany(
    { 'seats.isLocked': true, 'seats.lockExpiresAt': { $lt: now } },
    {
      $set: {
        'seats.$[elem].isLocked':      false,
        'seats.$[elem].lockedBy':      null,
        'seats.$[elem].lockedAt':      null,
        'seats.$[elem].lockExpiresAt': null,
      },
    },
    { arrayFilters: [{ 'elem.isLocked': true, 'elem.lockExpiresAt': { $lt: now } }] }
  );
  return result.modifiedCount;
};
