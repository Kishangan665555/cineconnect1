/**
 * routes/social.routes.js
 * Social: show-mates, conversations, messages, follow system, seat-mates
 */
const express    = require('express');
const { protect } = require('../middleware/auth');
const c          = require('../controllers/social.controller');
const upload     = require('../middleware/upload');
const uploadCtrl = require('../controllers/upload.controller');

const router = express.Router();

/* ── PUBLIC (no token needed) ─────────────────────────────────────────────── */
// Anyone can see who booked seats — viewing profiles still needs login
router.get('/seat-mates/:showId', c.getSeatMatesPublic);

/* ── PROTECTED (JWT required) ─────────────────────────────────────────────── */
router.use(protect);

// Show-mates discovery
router.get('/show-mates/:showId',        c.getShowMates);

// User profiles
router.get('/users/:userId',             c.getUserProfile);

// Follow system
router.post  ('/follow/:userId',                    c.followUser);
router.delete('/follow/:userId',                    c.unfollowUser);
router.post  ('/follow-requests/:userId/accept',    c.acceptFollowRequest);
router.delete('/follow-requests/:userId',           c.rejectFollowRequest);
router.get   ('/followers',                         c.getFollowers);
router.get   ('/following',                         c.getFollowing);
router.get   ('/follow-requests',                   c.getFollowRequests);

// Seat-mates (auth version — returns isMe flag)
router.get('/seat-mates-auth/:showId',   c.getSeatMates);

// Image upload (for chat messages)
router.post('/upload', protect, upload.single('image'), uploadCtrl.uploadImage);

// Conversations + messages
router.get ('/conversations',            c.getConversations);
router.post('/conversations',            c.getOrCreateConversation);
router.get ('/conversations/:id/messages', c.getMessages); //include a very strong code right and impsm  lement by a kishan 
router.post('/conversations/:id/messages', c.sendMessage);

// Unread count
router.get('/unread-count',              c.getUnreadCount);

module.exports = router;
