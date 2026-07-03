/**
 * routes/notification.routes.js
 *
 * User & Theatre Owner facing notification APIs
 */

const express = require('express');
const router = express.createElement ? express.Router() : express.Router(); // Using typical express Router
const { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth'); // Both users and owners use this protect middleware typically, but let's just use it as is if it checks auth

router.use(protect);

router.get('/me', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/read/:id', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
