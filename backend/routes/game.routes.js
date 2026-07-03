const express = require('express');
const router = express.Router();
const {
    getAvailableGames,
    getGameById,
    submitScore,
    getLeaderboard,
    getWeeklyLeaderboard,
    createGame,
    updateGame,
    deleteGame,
    getAdminLeaderboard
} = require('../controllers/game.controller');

const { protect, authorize } = require('../middleware/auth.middleware');
const { protectAdmin } = require('../middleware/admin.auth.middleware');

// Public / Player Access
router.get('/', getAvailableGames);
router.get('/leaderboard/global', getLeaderboard);
router.get('/leaderboard/weekly', getWeeklyLeaderboard);

// Requires Authentication
router.get('/:id', protect, getGameById);
router.post('/:id/submit', protect, submitScore);

// Admin / Content Manager Access
router.get('/admin/leaderboard', protectAdmin, getAdminLeaderboard);
router.post('/admin', protectAdmin, createGame);
router.put('/admin/:id', protectAdmin, updateGame);
router.delete('/admin/:id', protectAdmin, deleteGame);

module.exports = router;
