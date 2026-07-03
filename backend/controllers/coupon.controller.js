/**
 * controllers/coupon.controller.js
 */

const Coupon = require('../models/Coupon.model');

// ── POST /api/coupons/validate ────────────────────────────────────────────────
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    const coupon = await Coupon.findOne({ code: code?.toUpperCase().trim() });

    if (!coupon)          return res.status(404).json({ success: false, message: 'Coupon not found.' });
    if (!coupon.isActive) return res.status(400).json({ success: false, message: 'Coupon is inactive.' });
    if (coupon.isExpired) return res.status(400).json({ success: false, message: 'Coupon has expired.' });
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached.' });
    }
    if (amount < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value for this coupon is ₹${coupon.minAmount}.`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.floor((amount * coupon.discount) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = Math.min(coupon.discount, amount);
    }

    res.json({
      success: true,
      message: `Coupon applied! You save ₹${discount}`,
      discount,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discount,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/coupons ──────────────────────────────────────────────────────────
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
};

// ── POST /api/coupons ─────────────────────────────────────────────────────────
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Coupon created.', data: coupon });
  } catch (err) { next(err); }
};

// ── PUT /api/coupons/:id ──────────────────────────────────────────────────────
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: 'Coupon updated.', data: coupon });
  } catch (err) { next(err); }
};

// ── DELETE /api/coupons/:id ───────────────────────────────────────────────────
exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) { next(err); }
};

// Aliases for admin route naming
exports.getCoupons = exports.getAllCoupons;
