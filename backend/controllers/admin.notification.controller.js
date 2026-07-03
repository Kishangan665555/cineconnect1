/**
 * controllers/admin.notification.controller.js
 *
 * Handles admin creating, sending, and managing notifications globally.
 */

const Notification = require('../models/Notification.model');
const { getIO } = require('../socket');
const User = require('../models/User.model');

// Send a new notification
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetRole, targetUserId, targetEmail, actionLink } = req.body;

    let finalTargetUserId = targetUserId || null;

    if (targetRole === 'specific_user' && targetEmail) {
      const user = await User.findOne({ email: targetEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: `User with email ${targetEmail} not found` });
      }
      finalTargetUserId = user._id;
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      senderRole: 'admin',
      targetRole,
      targetUserId: finalTargetUserId,
      actionLink: actionLink || null,
      deliveredAt: new Date()
    });

    const io = getIO();

    // Emit live via socket based on target
    if (targetRole === 'all_users') {
      io.to('role:user').emit('new_notification', notification);
    } else if (targetRole === 'all_theatre_owners') {
      io.to('role:theatre_owner').emit('new_notification', notification);
    } else if (targetRole === 'specific_user' && finalTargetUserId) {
      io.to(finalTargetUserId.toString()).emit('new_notification', notification);
    } else if (targetRole === 'specific_theatre_owner' && finalTargetUserId) {
      io.to(finalTargetUserId.toString()).emit('new_notification', notification);
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all notifications (Admin History)
exports.getAllNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.targetRole) query.targetRole = req.query.targetRole;

    const notifications = await Notification.find(query)
      .populate('targetUserId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
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

// Delete notification (Admin can delete any)
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.deleteOne();

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};
