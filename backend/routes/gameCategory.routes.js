const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/admin.auth.middleware');
const {
  getCategories,
  getAllCategories,
  getGamesByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/gameCategory.controller');

// Public
router.get('/', getCategories);
router.get('/:slug/games', getGamesByCategory);

// Admin
router.get('/admin/all', protectAdmin, getAllCategories);
router.post('/', protectAdmin, createCategory);
router.put('/:id', protectAdmin, updateCategory);
router.delete('/:id', protectAdmin, deleteCategory);

module.exports = router;
