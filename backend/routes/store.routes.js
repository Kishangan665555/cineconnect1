const express = require('express');
const router = express.Router();
const {
    getStoreItems,
    buyStoreItem,
    createStoreItem,
    deleteStoreItem
} = require('../controllers/store.controller');

const { protect, authorize } = require('../middleware/auth.middleware');
const { protectAdmin } = require('../middleware/admin.auth.middleware');

// Public / Player Access
router.get('/', getStoreItems);

// Requires Authentication
router.post('/buy/:id', protect, buyStoreItem);

// Admin Access
router.post('/admin', protectAdmin, createStoreItem);
router.delete('/admin/:id', protectAdmin, deleteStoreItem);

module.exports = router;
