/**
 * controllers/theatreOwner.controller.js
 *
 * Handles 3-step theatre owner registration, status check,
 * and full dashboard / analytics API for the premium dashboard.
 *
 * Fixed:
 *  - Added Show model import and queries
 *  - Fixed getOwnerShows to use Show collection (subdocument populate was broken)
 *  - Added createShow, updateShow, deleteShow, cancelShow
 */

const jwt     = require('jsonwebtoken');
const User    = require('../models/User.model');
const Theatre = require('../models/Theatre.model');
const Booking = require('../models/Booking.model');
const Show    = require('../models/Show.model');
const TheatreOwnerRequest = require('../models/TheatreOwnerRequest.model');
const Notification = require('../models/Notification.model');
const { notifyUser } = require('../socket');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'cineconnect_secret_key', { expiresIn: '30d' });

/**
 * POST /api/theatre-owner/register
 * Accepts all 3-step data in one payload, creates User + TheatreOwnerRequest
 */
exports.register = async (req, res) => {
  try {
    const {
      // Step 1
      name, email, password, phone,
      // Step 2
      avatar, theatreName, theatreLocation, theatreCity,
      aadhaarNumber, aadhaarFront, aadhaarBack,
      // Step 3
      bankAccountHolder, bankName, bankAccountNumber, bankIfsc,
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (!theatreName || !theatreLocation || !theatreCity) {
      return res.status(400).json({ success: false, message: 'Theatre name, location and city are required' });
    }
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ success: false, message: 'Valid 12-digit Aadhaar number is required' });
    }
    if (!bankAccountHolder || !bankName || !bankAccountNumber || !bankIfsc) {
      return res.status(400).json({ success: false, message: 'All bank details are required' });
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid IFSC code format' });
    }

    // ── Check for existing user ─────────────────────────────────────────────
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // ── Create user account with pending approval ───────────────────────────
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'theatre_owner',
      approvalStatus: 'pending',
      avatar: avatar || '',
      city: theatreCity,
    });

    // ── Create registration request ─────────────────────────────────────────
    const request = await TheatreOwnerRequest.create({
      userId: user._id,
      name,
      email,
      phone,
      avatar: avatar || '',
      theatreName,
      theatreLocation,
      theatreCity,
      aadhaarNumber,
      aadhaarFront: aadhaarFront || '',
      aadhaarBack:  aadhaarBack  || '',
      bankAccountHolder,
      bankName,
      bankAccountNumber,
      bankIfsc: bankIfsc.toUpperCase(),
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted. Your account is under verification.',
      token: signToken(user._id),
      user: user.toJSON(),
      requestId: request._id,
      status: 'pending',
    });
  } catch (err) {
    console.error('[TheatreOwner] Registration error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/theatre-owner/status
 * Returns approval status of the logged-in theatre owner
 */
exports.getStatus = async (req, res) => {
  try {
    const request = await TheatreOwnerRequest.findOne({ userId: req.user._id })
      .sort({ submittedAt: -1 });

    if (!request) {
      return res.status(404).json({ success: false, message: 'No registration request found' });
    }

    res.json({
      success: true,
      status: request.status,
      adminNote: request.adminNote || '',
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/theatre-owners
 * Admin: List all theatre owner requests with optional status filter
 */
exports.getAllRequests = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { theatreName: new RegExp(search, 'i') },
      ];
    }

    const requests = await TheatreOwnerRequest.find(filter)
      .sort({ submittedAt: -1 })
      .select('-aadhaarFront -aadhaarBack'); // Don't send large images in list

    const counts = {
      all:      await TheatreOwnerRequest.countDocuments(),
      pending:  await TheatreOwnerRequest.countDocuments({ status: 'pending' }),
      approved: await TheatreOwnerRequest.countDocuments({ status: 'approved' }),
      rejected: await TheatreOwnerRequest.countDocuments({ status: 'rejected' }),
    };

    res.json({ success: true, requests, counts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/theatre-owners/:id
 * Admin: Get full details of a request (including images)
 */
exports.getRequestDetail = async (req, res) => {
  try {
    const request = await TheatreOwnerRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/admin/theatre-owners/:id/approve
 * Admin: Approve a theatre owner request
 */
exports.approveRequest = async (req, res) => {
  try {
    const request = await TheatreOwnerRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Request already approved' });
    }

    // Update request
    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.admin?._id || null;
    request.adminNote = req.body.note || 'Approved';
    await request.save();

    // Update user approval status
    await User.findByIdAndUpdate(request.userId, {
      $set: { approvalStatus: 'approved' },
    });

    // ── Auto-create Theatre document if it doesn't exist yet ─────────────
    const existing = await Theatre.findOne({ ownerId: request.userId });
    if (!existing) {
      // Build a default screen with seats
      const rows = 10, cols = 15;
      const seats = [];
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let r = 0; r < rows; r++) {
        const rowLetter = rowLetters[r];
        let cat = 'normal';
        if      (r >= Math.floor(rows * 0.75)) cat = 'premium';
        else if (r >= Math.floor(rows * 0.50)) cat = 'gold';
        else if (r >= Math.floor(rows * 0.25)) cat = 'silver';
        const price = { normal: 120, silver: 180, gold: 250, premium: 350 }[cat];
        for (let c = 1; c <= cols; c++) {
          seats.push({ seatId: `${rowLetter}${c}`, row: rowLetter, col: c, category: cat, price, isBooked: false, isBlocked: false });
        }
      }
      await Theatre.create({
        name:           request.theatreName,
        location:       request.theatreLocation,
        city:           request.theatreCity,
        ownerId:        request.userId,
        approvalStatus: 'approved',
        isActive:       true,
        type:           'Standard',
        amenities:      ['Parking', 'Food Court', 'AC'],
        screens: [{
          name: 'Screen 1',
          rows, cols,
          seats,
        }],
        showTimes: [],
      });
    } else {
      // Theatre exists but may not be active — mark it approved/active
      await Theatre.findByIdAndUpdate(existing._id, {
        $set: { approvalStatus: 'approved', isActive: true },
      });
    }

    // ── Generate System Notification for Theatre Owner ────────────
    try {
      const ownerNotificationMsg = `Congratulations! Your theatre owner registration for ${request.theatreName} has been approved. You can now manage your theatre dashboard.`;
      const ownerDbNotification = await Notification.create({
        title: 'Registration Approved',
        message: ownerNotificationMsg,
        type: 'alert',
        senderRole: 'system',
        targetRole: 'specific_user',
        targetUserId: request.userId,
        actionLink: '/owner',
        deliveredAt: new Date()
      });
      notifyUser(request.userId.toString(), ownerDbNotification);
    } catch(e) { console.warn('Failed to send owner approval notification', e); }

    res.json({ success: true, message: 'Theatre owner approved successfully', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * PUT /api/admin/theatre-owners/:id/reject
 * Admin: Reject a theatre owner request with reason
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await TheatreOwnerRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = 'rejected';
    request.adminNote = reason || 'Rejected by admin';
    request.reviewedAt = new Date();
    request.reviewedBy = req.admin?._id || null;
    await request.save();

    // Update user approval status
    await User.findByIdAndUpdate(request.userId, {
      $set: { approvalStatus: 'rejected' },
    });

    // Generate Rejection Notification for Theatre Owner
    try {
      const dbNotification = await Notification.create({
        title: 'Registration Rejected',
        message: `Your theatre owner registration was rejected. Reason: ${reason || 'Rejected by admin'}`,
        type: 'alert',
        senderRole: 'system',
        targetRole: 'specific_user',
        targetUserId: request.userId,
        actionLink: null,
        deliveredAt: new Date()
      });
      notifyUser(request.userId.toString(), dbNotification);
    } catch(e) { console.warn('Failed to send owner rejection notification', e); }

    res.json({ success: true, message: 'Theatre owner request rejected', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PREMIUM DASHBOARD APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/theatre-owner/dashboard
 * Returns KPIs, today's shows, recent bookings, and smart alerts
 * for the authenticated theatre owner's theatre.
 */
exports.getDashboard = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({ ownerId: req.user._id, approvalStatus: 'approved' });
    if (!theatre) {
      return res.json({
        success: true,
        kpis: { totalRevenue: 0, totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0,
          todayRevenue: 0, todayBookings: 0, activeShows: 0, totalScreens: 0, occupancyRate: 0, weeklyRevenue: 0 },
        recentBookings: [],
        todayShows: [],
        alerts: [{ id: 'no_theatre', type: 'info', title: 'No Theatre Listed',
          message: 'Your theatre listing is under review.', timestamp: new Date().toISOString() }],
      });
    }

    const theatreId = theatre._id;
    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr  = new Date().toISOString().split('T')[0];
    const weekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Parallel aggregations — query Show collection for real show data
    const [allBookings, todayBookings, weeklyRevResult, allShows] = await Promise.all([
      Booking.find({ theatreId }).sort({ createdAt: -1 }).limit(100).lean(),
      Booking.find({ theatreId, createdAt: { $gte: today } }).lean(),
      Booking.aggregate([
        { $match: { theatreId, status: 'confirmed', createdAt: { $gte: weekAgo } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
      Show.find({ theatreId, isActive: true })
        .populate('movieId', 'title poster')
        .sort({ date: 1, time: 1 })
        .lean(),
    ]);

    const confirmed    = allBookings.filter(b => b.status === 'confirmed');
    const cancelled    = allBookings.filter(b => b.status === 'cancelled');
    const totalRevenue = confirmed.reduce((s, b) => s + (b.finalAmount || 0), 0);
    const todayRev     = todayBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.finalAmount || 0), 0);
    const weekRev      = weeklyRevResult[0]?.total || 0;

    // Use Show collection for today's shows & active count
    const todayShows  = allShows.filter(s => s.date === todayStr && !s.isCancelled);
    const activeShows = allShows.filter(s => !s.isCancelled).length;

    // Occupancy rate from Show collection
    const totalCapacity = allShows.reduce((s, sh) => s + (sh.totalSeats || 0), 0);
    const totalBooked   = allShows.reduce((s, sh) => s + ((sh.totalSeats || 0) - (sh.availableSeats || 0)), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    // Smart alerts
    const alerts = [];
    if (todayShows.some(s => s.totalSeats > 0 && ((s.totalSeats - s.availableSeats) / s.totalSeats) < 0.25)) {
      const lowCount = todayShows.filter(s => s.totalSeats > 0 && ((s.totalSeats - s.availableSeats) / s.totalSeats) < 0.25).length;
      alerts.push({ id: 'low_occ', type: 'warning', title: 'Low Occupancy Alert',
        message: `${lowCount} show(s) today are less than 25% full.`,
        timestamp: new Date().toISOString() });
    }
    const soldOutShows = todayShows.filter(s => s.availableSeats === 0);
    if (soldOutShows.length) {
      alerts.push({ id: 'sold_out', type: 'success', title: 'Shows Sold Out! 🎉',
        message: `${soldOutShows.length} show(s) today are completely sold out.`,
        timestamp: new Date().toISOString() });
    }
    if (cancelled.length > confirmed.length * 0.3 && confirmed.length > 0) {
      alerts.push({ id: 'high_cancel', type: 'danger', title: 'High Cancellation Rate',
        message: `Cancellation rate is above 30%. Review your refund policy.`,
        timestamp: new Date().toISOString() });
    }
    if (theatre.screens.some(sc => sc.seats.some(s => s.isBlocked))) {
      const blockedCount = theatre.screens.reduce((count, sc) =>
        count + sc.seats.filter(s => s.isBlocked).length, 0);
      alerts.push({ id: 'blocked_seats', type: 'info', title: 'Blocked Seats',
        message: `${blockedCount} seat(s) are currently blocked across your screens.`,
        timestamp: new Date().toISOString() });
    }

    res.json({
      success: true,
      theatreName: theatre.name,
      kpis: {
        totalRevenue, weeklyRevenue: weekRev,
        totalBookings:   allBookings.length,
        confirmedBookings: confirmed.length,
        cancelledBookings: cancelled.length,
        todayRevenue: todayRev,
        todayBookings: todayBookings.length,
        activeShows, totalScreens: theatre.screens.length,
        occupancyRate,
      },
      recentBookings: allBookings.slice(0, 8),
      todayShows:     todayShows.slice(0, 10).map(s => ({
        ...s,
        movieTitle: s.movieTitle || s.movieId?.title || '',
        moviePoster: s.movieId?.poster || '',
        _id: String(s._id),
      })),
      alerts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * GET /api/theatre-owner/analytics
 * Returns 7-day revenue chart, hourly booking heatmap, demographic breakdown.
 */
exports.getAnalytics = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({ ownerId: req.user._id, approvalStatus: 'approved' });
    if (!theatre) return res.json({ success: true, revenueChart: [], heatmap: [], demographics: [], bookingTrend: [], peakHour: 0, avgOccupancy: 0 });

    const theatreId = theatre._id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      theatreId,
      createdAt: { $gte: sevenDaysAgo },
    }).lean();

    // 7-day revenue chart
    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const revenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayBookings = bookings.filter(b => b.createdAt.toISOString?.()?.split('T')[0] === dateStr || String(b.createdAt).split('T')[0] === dateStr);
      const revenue = dayBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.finalAmount || 0), 0);
      revenueChart.push({ label: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1], value: revenue, date: dateStr });
    }

    // Hourly heatmap (day 0-6, hour 0-23)
    const heatmap = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmap.push({ day, hour, count: 0 });
      }
    }
    bookings.forEach(b => {
      const d = new Date(b.createdAt);
      const day = d.getDay();
      const hour = d.getHours();
      const entry = heatmap.find(h => h.day === day && h.hour === hour);
      if (entry) entry.count++;
    });

    const peakEntry = heatmap.reduce((max, e) => e.count > max.count ? e : max, { count: 0, hour: 18 });

    // Demographics (payment method as proxy for customer type)
    const methodCounts = {};
    bookings.forEach(b => {
      const m = b.paymentMethod || 'Unknown';
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    });
    const DEMO_COLORS = ['#FFD700', '#C0152A', '#6B21FF', '#22d3ee', '#34d399', '#fb923c'];
    const demographics = Object.entries(methodCounts).map(([label, count], i) => ({
      label, count, color: DEMO_COLORS[i % DEMO_COLORS.length],
    }));

    // Booking trend (confirmed vs cancelled per day)
    const bookingTrend = revenueChart.map(({ label, date }) => {
      const dayB = bookings.filter(b => String(b.createdAt).split('T')[0] === date);
      return {
        label,
        confirmed: dayB.filter(b => b.status === 'confirmed').length,
        cancelled: dayB.filter(b => b.status === 'cancelled').length,
      };
    });

    // Avg occupancy
    const totalCap = theatre.showTimes.reduce((s, sh) => s + (sh.totalSeats || 0), 0);
    const bookedSt = theatre.showTimes.reduce((s, sh) => s + ((sh.totalSeats || 0) - (sh.availableSeats || 0)), 0);
    const avgOccupancy = totalCap > 0 ? Math.round((bookedSt / totalCap) * 100) : 0;

    res.json({ success: true, revenueChart, heatmap, demographics, bookingTrend, peakHour: peakEntry.hour, avgOccupancy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/theatre-owner/seat-map/:showId
 * Returns color-coded seat map for a given show.
 */
exports.getSeatMap = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({ ownerId: req.user._id, approvalStatus: 'approved' });
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });

    const show = theatre.showTimes.id(req.params.showId);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });

    // Build booked seat IDs from bookings
    const bookings = await Booking.find({
      theatreId: theatre._id,
      showId: String(show._id),
      status: 'confirmed',
    }).lean();
    const bookedSeats = new Set(bookings.flatMap(b => b.seats || []));

    // Use first screen that matches show, or screen 0
    const screen = theatre.screens[0];
    if (!screen) return res.json({ success: true, rows: [], totalSeats: 0, availableSeats: 0 });

    const rowMap = {};
    screen.seats.forEach(seat => {
      if (!rowMap[seat.row]) rowMap[seat.row] = [];
      rowMap[seat.row].push({
        seatId: seat.seatId,
        label: seat.seatId,
        category: seat.category || 'normal',
        status: seat.isBlocked ? 'blocked' : bookedSeats.has(seat.seatId) ? 'booked' : 'available',
        row: seat.row,
        col: seat.col,
      });
    });

    const rows = Object.entries(rowMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([rowLabel, seats]) => ({ rowLabel, seats: seats.sort((a, b) => a.col - b.col) }));

    res.json({
      success: true,
      showId: req.params.showId,
      totalSeats: show.totalSeats,
      availableSeats: show.availableSeats,
      rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/theatre-owner/shows
 * Returns the owner's shows with optional filters.
 * FIX: query Show model directly (subdocument .populate doesn't work on embedded arrays)
 */
exports.getOwnerShows = async (req, res) => {
  try {
    let theatre = await Theatre.findOne({ ownerId: req.user._id });

    // Auto-create theatre for already-approved owners who have none
    if (!theatre && req.user.approvalStatus === 'approved') {
      const request = await TheatreOwnerRequest.findOne({ userId: req.user._id, status: 'approved' }).sort({ submittedAt: -1 });
      if (request) {
        const rows = 10, cols = 15;
        const seats = [];
        const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < rows; r++) {
          const rowLetter = rowLetters[r];
          let cat = 'normal';
          if      (r >= Math.floor(rows * 0.75)) cat = 'premium';
          else if (r >= Math.floor(rows * 0.50)) cat = 'gold';
          else if (r >= Math.floor(rows * 0.25)) cat = 'silver';
          const price = { normal: 120, silver: 180, gold: 250, premium: 350 }[cat];
          for (let c = 1; c <= cols; c++) {
            seats.push({ seatId: `${rowLetter}${c}`, row: rowLetter, col: c, category: cat, price, isBooked: false, isBlocked: false });
          }
        }
        theatre = await Theatre.create({
          name:           request.theatreName,
          location:       request.theatreLocation,
          city:           request.theatreCity,
          ownerId:        req.user._id,
          approvalStatus: 'approved',
          isActive:       true,
          type:           'Standard',
          amenities:      ['Parking', 'Food Court', 'AC'],
          screens: [{ name: 'Screen 1', rows, cols, seats }],
          showTimes: [],
        });
      }
    }

    if (!theatre) return res.json({ success: true, shows: [] });

    let shows = await Show.find({ theatreId: theatre._id, isActive: true })
      .populate('movieId', 'title poster rating genre')
      .sort({ date: 1, time: 1 });

    if (req.query.date)    shows = shows.filter(s => s.date === req.query.date);
    if (req.query.movieId) shows = shows.filter(s => String(s.movieId?._id || s.movieId) === req.query.movieId);

    res.json({ success: true, shows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * GET /api/theatre-owner/bookings
 * Returns bookings for the owner's theatre with optional filters.
 */
exports.getOwnerBookings = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({ ownerId: req.user._id, approvalStatus: 'approved' });
    if (!theatre) return res.json({ success: true, bookings: [], total: 0, page: 1 });

    const { status, search, page = 1 } = req.query;
    const filter = { theatreId: theatre._id };
    if (status && status !== 'all') filter.status = status;

    let query = Booking.find(filter).sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);
    const limit = 20;
    const skip  = (Number(page) - 1) * limit;

    let bookings = await query.skip(skip).limit(limit).lean();

    if (search) {
      const q = search.toLowerCase();
      bookings = bookings.filter(b =>
        b.movieTitle?.toLowerCase().includes(q) ||
        b.ticketCode?.toLowerCase().includes(q) ||
        b.seats?.join(',').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, bookings, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  SHOW CRUD  (Theatre Owner)
// ─────────────────────────────────────────────────────────────────────────────

const _ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const _PRICING     = { normal: 120, silver: 180, gold: 250, premium: 350 };

function generateShowSeats(rows, cols, priceOverrides) {
  const seats = [];
  const overrides = priceOverrides || {};
  for (let r = 0; r < rows; r++) {
    const rowLetter = _ROW_LETTERS[r] || String(r);
    let cat = 'normal';
    if      (r >= Math.floor(rows * 0.75)) cat = 'premium';
    else if (r >= Math.floor(rows * 0.50)) cat = 'gold';
    else if (r >= Math.floor(rows * 0.25)) cat = 'silver';
    const price = overrides[cat] || _PRICING[cat];
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


/**
 * POST /api/theatre-owner/shows
 * Theatre owner creates a new show in their theatre.
 */
exports.createShow = async (req, res) => {
  try {
    let theatre = await Theatre.findOne({ ownerId: req.user._id });

    // Auto-create theatre for already-approved owners who have none
    if (!theatre && req.user.approvalStatus === 'approved') {
      const request = await TheatreOwnerRequest.findOne({ userId: req.user._id, status: 'approved' }).sort({ submittedAt: -1 });
      if (request) {
        const rows = 10, cols = 15;
        const seats = [];
        const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < rows; r++) {
          const rowLetter = rowLetters[r];
          let cat = 'normal';
          if      (r >= Math.floor(rows * 0.75)) cat = 'premium';
          else if (r >= Math.floor(rows * 0.50)) cat = 'gold';
          else if (r >= Math.floor(rows * 0.25)) cat = 'silver';
          const price = _PRICING[cat];
          for (let c = 1; c <= cols; c++) {
            seats.push({ seatId: `${rowLetter}${c}`, row: rowLetter, col: c, category: cat, price, isBooked: false, isBlocked: false });
          }
        }
        theatre = await Theatre.create({
          name:           request.theatreName,
          location:       request.theatreLocation,
          city:           request.theatreCity,
          ownerId:        req.user._id,
          approvalStatus: 'approved',
          isActive:       true,
          type:           'Standard',
          amenities:      ['Parking', 'Food Court', 'AC'],
          screens: [{ name: 'Screen 1', rows, cols, seats }],
          showTimes: [],
        });
      }
    }

    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found. Your account may not be approved yet.' });


    const {
      movieId, screenId, screenName,
      date, time, language, format,
      totalSeats, priceNormal, priceSilver, priceGold, pricePremium,
      customTime,
    } = req.body;

    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Date and time are required' });
    }
    if (!language) {
      return res.status(400).json({ success: false, message: 'Language is required' });
    }

    const prices = {
      normal:  priceNormal  || 120,
      silver:  priceSilver  || 180,
      gold:    priceGold    || 250,
      premium: pricePremium || 350,
    };

    // Find screen
    const screen = screenId
      ? theatre.screens.id(screenId)
      : theatre.screens[0];

    const rows = screen?.rows || 10;
    const cols = screen?.cols || (totalSeats ? Math.ceil(totalSeats / rows) : 20);
    const seats = generateShowSeats(rows, cols, prices);
    const resolvedTotal = totalSeats || seats.length;

    const Movie = require('../models/Movie.model');
    let movieTitle = '';
    if (movieId) {
      const movieDoc = await Movie.findById(movieId).select('title');
      if (movieDoc) movieTitle = movieDoc.title;
    }

    const show = await Show.create({
      movieId:     movieId  || null,
      theatreId:   theatre._id,
      movieTitle,
      theatreName: theatre.name,
      screenName:  screenName || screen?.name || 'Screen 1',
      date,
      time:        customTime || time,
      language,
      format:      format || '2D',
      prices,
      seats,
      totalSeats:     resolvedTotal,
      availableSeats: resolvedTotal,
      isOwnerManaged: true,
    });

    // Also add to Theatre.showTimes for dashboard KPIs
    theatre.showTimes.push({
      time: customTime || time,
      date,
      language,
      format: format || '2D',
      totalSeats: resolvedTotal,
      availableSeats: resolvedTotal,
      movieId: movieId || null,
      isOwnerManaged: true,
      priceOverride: {
        normal:  prices.normal,
        silver:  prices.silver,
        gold:    prices.gold,
        premium: prices.premium,
      },
    });
    await theatre.save();

    const populated = await Show.findById(show._id).populate('movieId', 'title poster rating');
    res.status(201).json({ success: true, message: 'Show created', show: populated });
  } catch (err) {
    console.error('[createShow]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/theatre-owner/shows/:id
 * Theatre owner updates a show.
 */
exports.updateShow = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({ ownerId: req.user._id });
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });

    const show = await Show.findOne({ _id: req.params.id, theatreId: theatre._id });
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });

    const {
      movieId, date, time, customTime, language, format,
      priceNormal, priceSilver, priceGold, pricePremium,
      totalSeats,
    } = req.body;

    // Update Show document
    if (movieId  !== undefined) show.movieId   = movieId;
    if (date)                   show.date       = date;
    if (time || customTime)     show.time       = customTime || time;
    if (language)               show.language   = language;
    if (format)                 show.format     = format;
    if (priceNormal)  show.prices.normal  = priceNormal;
    if (priceSilver)  show.prices.silver  = priceSilver;
    if (priceGold)    show.prices.gold    = priceGold;
    if (pricePremium) show.prices.premium = pricePremium;
    if (totalSeats)   show.totalSeats     = totalSeats;

    await show.save();

    const populated = await Show.findById(show._id).populate('movieId', 'title poster rating');
    res.json({ success: true, message: 'Show updated', show: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/theatre-owner/shows/:id
 * Soft-delete (marks isActive = false).
 */
exports.deleteShow = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({ ownerId: req.user._id });
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });

    const show = await Show.findOneAndUpdate(
      { _id: req.params.id, theatreId: theatre._id },
      { isActive: false },
      { new: true }
    );
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });

    res.json({ success: true, message: 'Show deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/theatre-owner/shows/:id/cancel
 * Marks a show as cancelled (isActive:false + isCancelled:true).
 */
exports.cancelShow = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({ ownerId: req.user._id });
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });

    const show = await Show.findOneAndUpdate(
      { _id: req.params.id, theatreId: theatre._id },
      { isActive: false, isCancelled: true },
      { new: true }
    );
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });

    res.json({ success: true, message: 'Show cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
