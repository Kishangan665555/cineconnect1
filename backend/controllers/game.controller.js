const Game = require('../models/Game.model');
const UserScore = require('../models/UserScore.model');
const User = require('../models/User.model');
const Coupon = require('../models/Coupon.model');
const Notification = require('../models/Notification.model');
const crypto = require('crypto');

// Utility to get current weekly cycle string
const getWeeklyCycle = () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
};

// @route GET /api/games
exports.getAvailableGames = async (req, res) => {
    try {
        const games = await Game.find({ isActive: true }).select('-questions.correctAnswer'); 
        // We hide the answers so players can't inspect the payload and cheat!
        res.json({ success: true, count: games.length, data: games });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route GET /api/games/:id
exports.getGameById = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).select('-questions.correctAnswer');
        if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
        res.json({ success: true, data: game });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route POST /api/games/:id/submit
exports.submitScore = async (req, res) => {
    try {
        const { score, timeSpent, answers } = req.body;
        const gameId = req.params.id;
        const userId = req.user.id;

        const game = await Game.findById(gameId);
        if (!game) return res.status(404).json({ success: false, message: 'Game not found' });

        // Server-Side Anti-Cheat Validation
        // Re-calculate the score here based on actual questions (comparing client 'answers' array against server 'correctAnswer' array)
        let actualScore = 0;
        let correctCount = 0;

        game.questions.forEach((q, index) => {
            if (answers && answers[index] && answers[index].toLowerCase() === q.correctAnswer.toLowerCase()) {
                actualScore += q.points;
                correctCount++;
            }
        });

        const accuracy = (correctCount / game.questions.length) * 100;
        
        // Bonus for speed if timeSpent is extremely low (but valid)
        let speedBonus = 0;
        if (accuracy > 50 && timeSpent < game.timeLimit * 0.5 && timeSpent > 5) {
            speedBonus = Math.floor(game.rewardPoints * 0.2); // 20% bonus
        }

        const totalEarnedScore = actualScore + speedBonus;

        // Verify if client injected a crazy score
        if (score > totalEarnedScore + 50) {
            return res.status(403).json({ success: false, message: 'Suspicious activity detected. Score mismatch.' });
        }

        // Setup Player Streak
        const user = await User.findById(userId);
        let streakMultiplier = 1;
        
        const now = new Date();
        if (user.lastPlayedAt) {
            const hoursSinceLastPlay = Math.abs(now - user.lastPlayedAt) / 36e5;
            if (hoursSinceLastPlay <= 48) {
                user.playStreak += 1;
            } else {
                user.playStreak = 1; // reset
            }
        } else {
            user.playStreak = 1;
        }
        
        if (user.playStreak > 5) streakMultiplier = 1.5;
        if (user.playStreak > 10) streakMultiplier = 2.0;

        const finalScore = Math.floor(totalEarnedScore * streakMultiplier);

        // Record to UserScore
        const userScore = await UserScore.create({
            user: userId,
            game: gameId,
            score: finalScore,
            accuracy,
            speedBonus,
            streakMultiplier,
            timeSpent,
            weeklyCycle: getWeeklyCycle()
        });

        // Update User metrics
        user.totalScore += finalScore;
        user.lastPlayedAt = now;

        // Setup automated reward logic
        let rewardGenerated = null;
        if (finalScore >= 200 && Math.random() < 0.3) {
            // 30% chance for a top score to yield a coupon dynamically!
            const rawCode = crypto.randomBytes(4).toString('hex').toUpperCase();
            const couponCode = `PLAY${rawCode}`;
            
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + 7);

            const coupon = await Coupon.create({
                code: couponCode,
                discountPercent: 15,
                expiresAt: expDate,
                isActive: true,
                usageLimit: 1
            });
            rewardGenerated = coupon;

            // Notify User
            await Notification.create({
                user: userId,
                title: 'Play Zone Reward! 🎉',
                message: `You won a 15% discount coupon for your top score! Code: ${couponCode}`,
                type: 'success'
            });
        }

        await user.save();

        res.json({ 
            success: true, 
            message: 'Score submitted securely!',
            data: {
                finalScore,
                accuracy,
                streakMultiplier,
                totalUserScore: user.totalScore,
                reward: rewardGenerated
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error parsing game flow' });
    }
};

// @route GET /api/games/leaderboard/global
exports.getLeaderboard = async (req, res) => {
    try {
        const scores = await UserScore.aggregate([
            { $group: { _id: "$user", totalScore: { $sum: "$score" } } },
            { $sort: { totalScore: -1 } },
            { $limit: 50 },
            { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails'
            }},
            { $unwind: "$userDetails" },
            { $project: {
                _id: 1,
                totalScore: 1,
                username: "$userDetails.username",
                name: "$userDetails.name",
                avatar: "$userDetails.avatar"
            }}
        ]);

        res.json({ success: true, data: scores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
    }
};

// @route GET /api/games/leaderboard/weekly
exports.getWeeklyLeaderboard = async (req, res) => {
    try {
        const weeklyCycle = getWeeklyCycle();
        const scores = await UserScore.aggregate([
            { $match: { weeklyCycle } },
            { $group: { _id: "$user", weeklyScore: { $sum: "$score" } } },
            { $sort: { weeklyScore: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails'
            }},
            { $unwind: "$userDetails" },
            { $project: {
                _id: 1,
                weeklyScore: 1,
                username: "$userDetails.username",
                name: "$userDetails.name",
                avatar: "$userDetails.avatar"
            }}
        ]);

        res.json({ success: true, cycle: weeklyCycle, data: scores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch weekly leaderboard' });
    }
};

// @route GET /api/games/admin/leaderboard
exports.getAdminLeaderboard = async (req, res) => {
    try {
        const scores = await UserScore.aggregate([
            { $group: {
                _id: "$user",
                totalScore: { $sum: "$score" }
            }},
            { $sort: { totalScore: -1 } },
            { $limit: 100 },
            { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails'
            }},
            { $unwind: "$userDetails" },
            { $project: {
                _id: 1,
                totalScore: 1,
                username: "$userDetails.username",
                name: "$userDetails.name",
                email: "$userDetails.email",
                avatar: "$userDetails.avatar"
            }}
        ]);
        res.json({ success: true, data: scores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch admin leaderboard' });
    }
};

// ADMIN ROUTES
// @route POST /api/games/admin
exports.createGame = async (req, res) => {
    try {
        const game = await Game.create(req.body);
        res.status(201).json({ success: true, data: game });
    } catch (error) {
        console.error('Game Creation Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create game' });
    }
};

// @route PUT /api/games/admin/:id
exports.updateGame = async (req, res) => {
    try {
        const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: game });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update game' });
    }
};

// @route DELETE /api/games/admin/:id
exports.deleteGame = async (req, res) => {
    try {
        await Game.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete game' });
    }
};
