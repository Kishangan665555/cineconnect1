/**
 * routes/upload.routes.js  –  File / base64 image upload endpoints
 * Accepts both admin JWT (type: 'admin_access') and regular user JWT.
 */

const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const jwt        = require('jsonwebtoken');
const Admin      = require('../models/Admin.model');
const User       = require('../models/User.model');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cineconnect_jwt_secret_2024';

// ── Ensure uploads directory exists ──────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Multer disk storage ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req,  file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mkv/;
  const ext  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image and video files are allowed (jpeg, jpg, png, gif, webp, mp4, webm, mkv)'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB

// ── Flexible auth: accepts BOTH admin JWT and user JWT ────────────────────────
// Admin tokens have { role: 'admin', type: 'admin_access' }
// User tokens have  { id: ..., role: 'user' | 'theatre_owner' }
const flexAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Admin token path
    if (decoded.role === 'admin' && decoded.type === 'admin_access') {
      const admin = await Admin.findById(decoded.id);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ success: false, message: 'Admin account inactive.' });
      }
      req.admin = admin;
      return next();
    }

    // User token path
    const user = await User.findById(decoded.id || decoded._id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    req.user = user;
    return next();
  } catch (_err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ── POST /api/upload/image  ───────────────────────────────────────────────────
router.post('/image', flexAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename });
});

// ── POST /api/upload/base64  ─  Accept base64 string and save as file ─────────
router.post('/base64', flexAuth, (req, res) => {
  try {
    const { base64, filename = 'image', ext = 'jpg' } = req.body;
    if (!base64) return res.status(400).json({ success: false, message: 'No base64 data provided.' });

    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const data    = matches ? matches[2] : base64;
    const buffer  = Buffer.from(data, 'base64');

    const unique   = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fname    = `${unique}-${filename}.${ext}`;
    const filePath = path.join(uploadsDir, fname);
    fs.writeFileSync(filePath, buffer);

    const url = `${req.protocol}://${req.get('host')}/uploads/${fname}`;
    res.json({ success: true, url, filename: fname });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/upload/:filename ──────────────────────────────────────────────
router.delete('/:filename', flexAuth, (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true, message: 'File deleted.' });
});

module.exports = router;
