const router = require('express').Router();
const Coupon = require('../models/Coupon.model');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/coupons
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true });
    res.json(coupons);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/coupons/all (admin)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/coupons/validate
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, amount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
    if (new Date(coupon.validTill) < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }
    if (amount < coupon.minAmount) {
      return res.status(400).json({
        message: `Minimum order amount is ₹${coupon.minAmount}`,
      });
    }
    let discount =
      coupon.discountType === 'percentage'
        ? Math.round((amount * coupon.discount) / 100)
        : coupon.discount;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    res.json({ coupon, discount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/coupons (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/coupons/:id (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/coupons/:id (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
