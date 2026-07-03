/**
 * routes/admin.notification.routes.js
 *
 * Dedicated router for admin notification actions.
 * Typically mounted at `/api/admin/notifications`.
 */

const express = require('express');
const router = express.createElement ? express.Router() : express.Router();
const { sendNotification, getAllNotifications, deleteNotification } = require('../controllers/admin.notification.controller');
const { protect, adminOnly } = require('../middleware/auth'); // Both protect and admin are required for admin routes

router.use(protect, adminOnly);

router.post('/send', sendNotification);
router.get('/', getAllNotifications);
router.delete('/:id', deleteNotification);

module.exports = router;
