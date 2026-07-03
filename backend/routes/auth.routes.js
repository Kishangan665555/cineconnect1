const router  = require('express').Router();
const multer  = require('multer');
const ctrl    = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Multer: memory storage → convert to base64 → save in MongoDB avatar field
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 },   // 2 MB max
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|jpg|png|webp)/.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only JPG / PNG / WebP images are allowed'));
  },
});

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password/:token', ctrl.resetPassword);

router.get('/me',        protect, ctrl.getMe);
router.put('/me',        protect, ctrl.updateMe);

// PUT /api/auth/me/avatar  — multipart, stores base64 in MongoDB
router.put('/me/avatar', protect, avatarUpload.single('avatar'), ctrl.updateAvatar);

module.exports = router;
