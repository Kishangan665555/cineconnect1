/**
 * controllers/user.controller.js
 * User management controller (admin use)
 */
const User = require('../models/User.model');
const Booking = require('../models/Booking.model');

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const filter = { role: { $ne: 'admin' } };
    if (role && role !== 'all') filter.role = role;
    if (status === 'active')   filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id  — update user fields
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, city, role, isActive, bio, username } = req.body;
    const allowed = {};
    if (name     !== undefined) allowed.name     = name;
    if (email    !== undefined) allowed.email    = email;
    if (phone    !== undefined) allowed.phone    = phone;
    if (city     !== undefined) allowed.city     = city;
    if (role     !== undefined) allowed.role     = role;
    if (isActive !== undefined) allowed.isActive = isActive;
    if (bio      !== undefined) allowed.bio      = bio;
    if (username !== undefined) allowed.username = username;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: allowed },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id/toggle — toggle active status
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id  (public user profile)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users/:id/bookings  — user's booking history for admin view
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.id })
      .populate('movieId', 'title poster')
      .populate('theatreId', 'name location city')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
