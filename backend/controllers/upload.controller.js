/**
 * controllers/upload.controller.js
 * Handles image uploads for chat messages.
 * Returns a publicly accessible URL.
 */
const path = require('path');

exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Build public URL — frontend fetches from /uploads/<filename>
    const protocol = req.protocol || 'http';
    const host     = req.get('host') || 'localhost:5000';
    const url      = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ success: true, url, filename: req.file.filename });
  } catch (err) {
    console.error('[uploadImage]', err.message);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};
