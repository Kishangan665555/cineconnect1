const router = require('express').Router();
const ctrl   = require('../controllers/theatre.controller');
const { protect, adminOnly, ownerOrAdmin } = require('../middleware/auth');

// Approval requests (must be before /:id routes)
router.get('/approvals',           protect, adminOnly,     ctrl.getApprovals);
router.post('/approvals',          protect, ownerOrAdmin,  ctrl.submitApproval);
router.put('/approvals/:id/review',protect, adminOnly,     ctrl.reviewApproval);

// Owner theatre
router.get('/owner/:ownerId',      protect, ownerOrAdmin,  ctrl.getOwnerTheatre);

// Theatre CRUD
router.get('/',                    ctrl.getTheatres);
router.get('/:id',                 ctrl.getTheatre);
router.post('/',                   protect, adminOnly,     ctrl.createTheatre);
router.put('/:id',                 protect, ownerOrAdmin,  ctrl.updateTheatre);
router.delete('/:id',              protect, adminOnly,     ctrl.deleteTheatre);

// Showtimes
router.post('/:id/showtimes',            protect, ownerOrAdmin, ctrl.addShowTime);
router.put('/:id/showtimes/:showId',     protect, ownerOrAdmin, ctrl.updateShowTime);
router.delete('/:id/showtimes/:showId',  protect, ownerOrAdmin, ctrl.deleteShowTime);
router.put('/:id/showtimes/:showId/cancel', protect, ownerOrAdmin, ctrl.cancelShow);

// Seat management
router.put('/:id/seats/block',     protect, ownerOrAdmin, ctrl.blockSeat);
router.put('/:id/seats/unblock',   protect, ownerOrAdmin, ctrl.unblockSeat);

// Seat view data (immersive 2D/3D/360° experience)
router.get('/:id/view-data',  ctrl.getSeatViewData);                         // public
router.put('/:id/view-data',  protect, ownerOrAdmin, ctrl.saveSeatViewData); // owner/admin

module.exports = router;
