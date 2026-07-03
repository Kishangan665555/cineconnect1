const Refund = require('../models/Refund.model');
const Booking = require('../models/Booking.model');
const Notification = require('../models/Notification.model');

// Custom notification utility for consistent error handling here
const createRefundNotif = async (userId, title, message) => {
  try {
    await Notification.create({ userId, title, message, type: 'system', target: 'specific_user', isRead: false });
  } catch(e) { console.warn('Notification failed:', e.message); }
}

exports.getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find().populate('userId', 'name email').populate('bookingId').sort('-createdAt');
    res.json({ success: true, refunds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRefundStatus = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const refund = await Refund.findByIdAndUpdate(req.params.id, { status, adminResponse }, { new: true });
    
    if (!refund) return res.status(404).json({ success: false, message: 'Refund not found' });

    // Sync status with Booking
    const booking = await Booking.findById(refund.bookingId);
    if (booking) {
      booking.refundStatus = status;
      await booking.save();
    }

    if (status === 'success') {
      await createRefundNotif(refund.userId, 'Refund Processed', `Your refund of ₹${refund.amount} has been successfully processed.`);
    } else if (status === 'rejected') {
      await createRefundNotif(refund.userId, 'Refund Rejected', `Your refund request of ₹${refund.amount} was rejected. Note: ${adminResponse || 'No reason provided'}`);
    }

    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
