/**
 * controllers/notification.controller.js
 * 
 * Handles user and theatre owner fetching, reading, and deleting notifications.
 */

const Notification = require('../models/Notification.model');

// Fetch notifications for the logged-in user
// Queries based on specific logic: either directly targeted, or targetRole 'all_users' (if user) / 'all_theatre_owners' (if owner)
exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role; // 'user' or 'theatre_owner'

    const query = {
      $or: [
        { targetRole: role === 'user' ? 'all_users' : 'all_theatre_owners' },
        { targetUserId: userId }
      ]
    };

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    // Calculate unread globally for this query (mostly for badge)
    const unreadCount = await Notification.countDocuments({ ...query, readStatus: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // To prevent users from reading others targeted notifications
    if (
      notification.targetUserId && 
      notification.targetUserId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.readStatus = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read for current user
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const query = {
      $or: [
        { targetRole: role === 'user' ? 'all_users' : 'all_theatre_owners' },
        { targetUserId: userId }
      ],
      readStatus: false
    };

    const result = await Notification.updateMany(query, { $set: { readStatus: true } });

    res.json({ success: true, message: `Marked ${result.modifiedCount} notifications as read` });
  } catch (error) {
    next(error);
  }
};

// Delete a notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (
      notification.targetUserId && 
      notification.targetUserId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this notification' });
    }

    if (!notification.targetUserId) {
        return res.status(400).json({ success: false, message: 'Cannot delete global notifications' });
    }

    await notification.deleteOne();

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};
