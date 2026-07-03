const StoreItem = require('../models/StoreItem.model');
const User = require('../models/User.model');
const Coupon = require('../models/Coupon.model');
const Notification = require('../models/Notification.model');
const crypto = require('crypto');

// @route GET /api/store
exports.getStoreItems = async (req, res) => {
    try {
        const items = await StoreItem.find({ isActive: true });
        res.json({ success: true, data: items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route POST /api/store/buy/:id
exports.buyStoreItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user.id;

        const item = await StoreItem.findById(itemId);
        if (!item || !item.isActive) {
            return res.status(404).json({ success: false, message: 'Item not available' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.totalScore < item.pointCost) {
            return res.status(400).json({ success: false, message: 'Not enough points' });
        }

        // Deduct points
        user.totalScore -= item.pointCost;

        let reward = null;

        // Generate Reward
        if (item.rewardType === 'coupon') {
            const rawCode = crypto.randomBytes(4).toString('hex').toUpperCase();
            const couponCode = `STORE${rawCode}`;
            
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + 30); // 30 days expiry

            reward = await Coupon.create({
                code: couponCode,
                description: item.title,
                discountPercent: item.discountPercent || 10,
                discount: item.discountPercent || 10,
                discountType: 'percentage',
                expiresAt: expDate,
                validTill: expDate,
                isActive: true,
                usageLimit: 1
            });

            // Notify User
            await Notification.create({
                user: userId,
                title: 'Purchase Successful! 🛒',
                message: `You bought ${item.title}. Your coupon code is: ${couponCode}`,
                type: 'success'
            });
        }

        await user.save();

        res.json({
            success: true,
            message: 'Purchase successful!',
            data: {
                totalScore: user.totalScore,
                reward
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Purchase failed' });
    }
};

// ADMIN ROUTES
// @route POST /api/store/admin
exports.createStoreItem = async (req, res) => {
    try {
        const item = await StoreItem.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create item' });
    }
};

// @route DELETE /api/store/admin/:id
exports.deleteStoreItem = async (req, res) => {
    try {
        await StoreItem.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete item' });
    }
};
