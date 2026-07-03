const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  uploadTheatreMedia,
  getTheatreMedia,
  save3DConfig,
  get3DConfig,
  getAdminPendingMedia,
  approveMedia
} = require('../controllers/media.controller');

// Public reads
router.get('/:theatreId/media', getTheatreMedia);
router.get('/:theatreId/3d-config', get3DConfig);

// Owner protected interactions
router.post('/upload', protect, authorize('theatre_owner', 'admin'), upload.single('mediaFile'), uploadTheatreMedia);
router.post('/save-3d-config', protect, authorize('theatre_owner', 'admin'), save3DConfig);

// Admin interactions
router.get('/admin/pending', protect, authorize('admin'), getAdminPendingMedia);
router.put('/admin/approve/:id', protect, authorize('admin'), approveMedia);

module.exports = router;
