const Theatre = require('../models/Theatre.model');
const ApprovalRequest = require('../models/ApprovalRequest');

// GET /api/theatres
exports.getTheatres = async (req, res) => {
  try {
    const { city, status, type } = req.query;
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (status) filter.approvalStatus = status;
    if (type) filter.type = type;
    const theatres = await Theatre.find(filter);
    res.json(theatres);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/theatres/:id
exports.getTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    res.json(theatre);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/theatres/owner/:ownerId
exports.getOwnerTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({ ownerId: req.params.ownerId });
    res.json(theatre || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/theatres  (approved by admin, direct creation)
exports.createTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.create(req.body);
    res.status(201).json(theatre);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/theatres/:id
exports.updateTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    res.json(theatre);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/theatres/:id
exports.deleteTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findByIdAndDelete(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    res.json({ message: 'Theatre deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Showtimes ─────────────────────────────────────────────────────────────────

// POST /api/theatres/:id/showtimes
exports.addShowTime = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    const show = { showId: `st_${Date.now()}`, ...req.body };
    theatre.showTimes.push(show);
    await theatre.save();
    res.status(201).json(theatre);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/theatres/:id/showtimes/:showId
exports.updateShowTime = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    const idx = theatre.showTimes.findIndex(s => s.showId === req.params.showId);
    if (idx === -1) return res.status(404).json({ message: 'Showtime not found' });
    Object.assign(theatre.showTimes[idx], req.body);
    await theatre.save();
    res.json(theatre);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/theatres/:id/showtimes/:showId
exports.deleteShowTime = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    theatre.showTimes = theatre.showTimes.filter(s => s.showId !== req.params.showId);
    await theatre.save();
    res.json(theatre);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/theatres/:id/showtimes/:showId/cancel
exports.cancelShow = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    const show = theatre.showTimes.find(s => s.showId === req.params.showId);
    if (!show) return res.status(404).json({ message: 'Showtime not found' });
    show.isCancelled = true;
    show.cancelledAt = new Date().toISOString();
    await theatre.save();
    res.json(theatre);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Seat management ───────────────────────────────────────────────────────────

// PUT /api/theatres/:id/seats/block
exports.blockSeat = async (req, res) => {
  try {
    const { screenId, seatId, reason } = req.body;
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    const screen = theatre.screens.find(s => s.screenId === screenId);
    if (!screen) return res.status(404).json({ message: 'Screen not found' });
    const seat = screen.seats.find(s => s.seatId === seatId);
    if (!seat) return res.status(404).json({ message: 'Seat not found' });
    seat.isBlocked = true;
    seat.blockedReason = reason || 'Blocked by owner';
    await theatre.save();
    res.json(theatre);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/theatres/:id/seats/unblock
exports.unblockSeat = async (req, res) => {
  try {
    const { screenId, seatId } = req.body;
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
    const screen = theatre.screens.find(s => s.screenId === screenId);
    if (!screen) return res.status(404).json({ message: 'Screen not found' });
    const seat = screen.seats.find(s => s.seatId === seatId);
    if (!seat) return res.status(404).json({ message: 'Seat not found' });
    seat.isBlocked = false;
    seat.blockedReason = '';
    await theatre.save();
    res.json(theatre);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Approval Requests ────────────────────────────────────────────────────────

// GET /api/theatres/approvals
exports.getApprovals = async (req, res) => {
  try {
    const requests = await ApprovalRequest.find().sort({ submittedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/theatres/approvals
exports.submitApproval = async (req, res) => {
  try {
    const request = await ApprovalRequest.create(req.body);
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/theatres/approvals/:id/review  (admin only)
exports.reviewApproval = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const request = await ApprovalRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, reviewedAt: new Date().toISOString() },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // If approved, create the theatre automatically
    if (status === 'approved') {
      await Theatre.create({
        ...request.theatreData,
        approvalStatus: 'approved',
        isActive: true,
        ownerId: request.ownerId,
        ownerName: request.ownerName,
      });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ── Seat View Data (immersive seat experience) ────────────────────────────────

// GET /api/theatres/:id/view-data  — public, used by SeatExperienceModal on booking page
exports.getSeatViewData = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id).select('seatViewData name');
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });
    res.json({ success: true, seatViewData: theatre.seatViewData || null, theatreName: theatre.name });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/theatres/:id/view-data  — protected, theatre owner or admin only
exports.saveSeatViewData = async (req, res) => {
  try {
    const { view2DImage, panoramaImage, uploadedImages, seatViewMapping } = req.body;
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ success: false, message: 'Theatre not found' });

    // Only the owner or admin can update
    const isOwner = String(theatre.ownerId) === String(req.user?._id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    theatre.seatViewData = {
      view2DImage:    view2DImage    || theatre.seatViewData?.view2DImage    || '',
      panoramaImage:  panoramaImage  || theatre.seatViewData?.panoramaImage  || '',
      uploadedImages: uploadedImages || theatre.seatViewData?.uploadedImages || [],
      seatViewMapping: seatViewMapping || theatre.seatViewData?.seatViewMapping || [],
      updatedAt: new Date(),
    };

    await theatre.save();
    res.json({ success: true, seatViewData: theatre.seatViewData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
