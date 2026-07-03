/**
 * controllers/social.controller.js
 * Social features: show-mate discovery, conversations, messages, follow system.
 */

const Booking      = require('../models/Booking.model');
const User         = require('../models/User.model');
const Conversation = require('../models/Conversation.model');
const Message      = require('../models/Message.model');

/* ── Show-mates ─────────────────────────────────────────────────────────────── */
exports.getShowMates = async (req, res) => {
  try {
    const { showId } = req.params;
    const myId = req.user._id;
    const bookings = await Booking.find({ showId, status: 'confirmed', userId: { $ne: myId } }).select('userId').lean();
    if (!bookings.length) return res.json({ success: true, showMates: [] });
    const userIds = [...new Set(bookings.map(b => b.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds }, isPrivate: { $ne: true }, isActive: { $ne: false } })
      .select('_id name avatar city bio username joinDate followers following').lean();
    const showMates = users.map(u => ({
      id: u._id, name: u.name, avatar: u.avatar||'', city: u.city||'',
      bio: u.bio||'', username: u.username||'', joinDate: u.joinDate,
      followersCount: u.followers?.length??0, followingCount: u.following?.length??0,
    }));
    res.json({ success: true, showMates });
  } catch (err) {
    console.error('[social.getShowMates]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── User Profile (with follow state + counts) ────────────────────────────── */
exports.getUserProfile = async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const user = await User.findById(req.params.userId)
      .select('_id name avatar city bio username joinDate isPrivate followers following followRequests').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const followersCount = user.followers?.length ?? 0;
    const followingCount = user.following?.length ?? 0;
    const isFollowing    = user.followers?.some(f => f.toString() === myId) ?? false;
    const hasRequested   = user.followRequests?.some(r => r.toString() === myId) ?? false;
    const followState    = isFollowing ? 'following' : hasRequested ? 'requested' : 'none';

    if (user.isPrivate && !isFollowing && myId !== req.params.userId) {
      return res.json({ success: true, isPrivate: true, followState, user: {
        id: user._id, name: user.name, avatar: user.avatar||'', username: user.username||'',
        followersCount, followingCount,
      }});
    }
    res.json({ success: true, isPrivate: false, followState, user: {
      id: user._id, name: user.name, avatar: user.avatar||'', city: user.city||'',
      bio: user.bio||'', username: user.username||'', joinDate: user.joinDate,
      followersCount, followingCount,
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── Conversations ──────────────────────────────────────────────────────────── */
exports.getOrCreateConversation = async (req, res) => {
  try {
    const myId    = req.user._id.toString();
    const otherId = req.body.otherUserId;
    if (!otherId) return res.status(400).json({ success: false, message: 'otherUserId required' });
    const otherUser = await User.findById(otherId).select('isPrivate name avatar followers followRequests').lean();
    if (!otherUser) return res.status(404).json({ success: false, message: 'User not found' });
    if (otherUser.isPrivate) {
      const isFollower = otherUser.followers?.some(f => f.toString() === myId) ?? false;
      if (!isFollower) return res.status(403).json({ success: false, message: 'This user has a private account. Follow them to message.' });
    }
    const participants = [myId, otherId].sort();
    let conversation = await Conversation.findOne({ participants: { $all: participants, $size: 2 } }).lean();
    if (!conversation) { const doc = new Conversation({ participants }); await doc.save(); conversation = doc.toObject(); }
    res.json({ success: true, conversation: {
      id: conversation._id, participants: conversation.participants,
      lastMessage: conversation.lastMessage, lastMessageAt: conversation.lastMessageAt,
      otherUser: { id: otherUser._id, name: otherUser.name, avatar: otherUser.avatar||'' },
    }});
  } catch (err) {
    console.error('[social.getOrCreateConversation]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const myId = req.user._id;
    const conversations = await Conversation.find({ participants: myId }).sort({ lastMessageAt: -1 }).lean();
    const otherIds = conversations.map(c => c.participants.find(p => p.toString() !== myId.toString())).filter(Boolean);
    const users = await User.find({ _id: { $in: otherIds } }).select('_id name avatar isPrivate').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });
    const enriched = conversations.map(c => {
      const otherId = c.participants.find(p => p.toString() !== myId.toString());
      const other   = otherId ? userMap[otherId.toString()] : null;
      return { id: c._id, participants: c.participants, lastMessage: c.lastMessage, lastMessageAt: c.lastMessageAt,
        otherUser: other ? { id: other._id, name: other.name, avatar: other.avatar||'', isPrivate: other.isPrivate } : null };
    });
    res.json({ success: true, conversations: enriched });
  } catch (err) {
    console.error('[social.getConversations]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const convo = await Conversation.findById(id).lean();
    if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (!convo.participants.some(p => p.toString() === myId.toString()))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const total    = await Message.countDocuments({ conversationId: id });
    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mark unread messages as delivered
    await Message.updateMany(
      { conversationId: id, senderId: { $ne: myId }, status: 'sent' },
      { $set: { status: 'delivered' } }
    );

    res.json({
      success: true,
      messages: messages.map(m => ({
        id:          m._id,
        senderId:    m.senderId,
        messageType: m.messageType || 'text',
        text:        m.text        || '',
        imageUrl:    m.imageUrl    || '',
        movieData:   m.movieData   || null,
        status:      m.status      || 'sent',
        createdAt:   m.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[social.getMessages]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;
    const { text = '', messageType = 'text', imageUrl = '', movieData = null } = req.body;

    // Validation
    if (!['text', 'image', 'movie'].includes(messageType)) {
      return res.status(400).json({ success: false, message: 'Invalid messageType' });
    }
    if (messageType === 'text' && !text?.trim()) {
      return res.status(400).json({ success: false, message: 'Message text required' });
    }
    if (messageType === 'image' && !imageUrl?.trim()) {
      return res.status(400).json({ success: false, message: 'Image URL required' });
    }
    if (messageType === 'movie' && !movieData?.title) {
      return res.status(400).json({ success: false, message: 'Movie data required' });
    }

    const convo = await Conversation.findById(id);
    if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (!convo.participants.some(p => p.toString() === myId.toString()))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const msgDoc = new Message({
      conversationId: id,
      senderId:    myId,
      messageType,
      text:        messageType === 'text'  ? text.trim().slice(0, 4000) : '',
      imageUrl:    messageType === 'image' ? imageUrl.trim() : '',
      movieData:   messageType === 'movie' ? movieData : null,
      status:      'sent',
    });
    await msgDoc.save();

    // Update conversation preview
    let preview = '';
    if (messageType === 'text')  preview = text.trim().slice(0, 80);
    if (messageType === 'image') preview = '📷 Photo';
    if (messageType === 'movie') preview = `🎬 ${movieData?.title || 'Movie'}`;
    convo.lastMessage    = preview;
    convo.lastMessageAt  = new Date();
    await convo.save();

    res.status(201).json({
      success: true,
      message: {
        id:          msgDoc._id,
        senderId:    msgDoc.senderId,
        messageType: msgDoc.messageType,
        text:        msgDoc.text,
        imageUrl:    msgDoc.imageUrl,
        movieData:   msgDoc.movieData,
        status:      msgDoc.status,
        createdAt:   msgDoc.createdAt,
      },
    });
  } catch (err) {
    console.error('[social.sendMessage]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Conversation.countDocuments({ participants: req.user._id });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── Follow System ──────────────────────────────────────────────────────────── */
exports.followUser = async (req, res) => {
  try {
    const myId  = req.user._id;
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target._id.toString() === myId.toString())
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });

    const alreadyFollowing = target.followers.some(f => f.toString() === myId.toString());
    if (alreadyFollowing) return res.json({ success: true, state: 'following' });

    if (target.isPrivate) {
      const alreadyRequested = target.followRequests.some(r => r.toString() === myId.toString());
      if (!alreadyRequested) { target.followRequests.push(myId); await target.save(); }
      return res.json({ success: true, state: 'requested' });
    }

    target.followers.push(myId);
    await target.save();
    const me = await User.findById(myId);
    if (!me.following.some(f => f.toString() === target._id.toString())) {
      me.following.push(target._id); await me.save();
    }
    res.json({ success: true, state: 'following' });
  } catch (err) {
    console.error('[social.followUser]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const myId   = req.user._id;
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    target.followers      = target.followers.filter(f => f.toString() !== myId.toString());
    target.followRequests = target.followRequests.filter(r => r.toString() !== myId.toString());
    await target.save();
    const me = await User.findById(myId);
    me.following = me.following.filter(f => f.toString() !== target._id.toString());
    await me.save();
    res.json({ success: true, state: 'none' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const requesterId = req.params.userId;
    const me        = await User.findById(myId);
    const requester = await User.findById(requesterId);
    if (!me || !requester) return res.status(404).json({ success: false, message: 'User not found' });
    me.followRequests = me.followRequests.filter(r => r.toString() !== requesterId);
    if (!me.followers.some(f => f.toString() === requesterId)) me.followers.push(requesterId);
    await me.save();
    if (!requester.following.some(f => f.toString() === myId.toString())) {
      requester.following.push(myId); await requester.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.rejectFollowRequest = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ success: false, message: 'Not found' });
    me.followRequests = me.followRequests.filter(r => r.toString() !== req.params.userId);
    await me.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate('followers', '_id name avatar username bio').lean();
    res.json({ success: true, followers: (me.followers||[]).map(u => ({ id: u._id, name: u.name, avatar: u.avatar||'', username: u.username||'', bio: u.bio||'' })) });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.getFollowing = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate('following', '_id name avatar username bio').lean();
    res.json({ success: true, following: (me.following||[]).map(u => ({ id: u._id, name: u.name, avatar: u.avatar||'', username: u.username||'', bio: u.bio||'' })) });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.getFollowRequests = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate('followRequests', '_id name avatar username').lean();
    res.json({ success: true, requests: (me.followRequests||[]).map(u => ({ id: u._id, name: u.name, avatar: u.avatar||'', username: u.username||'' })) });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

/* ── Seat-mates PUBLIC (no auth) — any visitor sees who booked each seat ─── */
exports.getSeatMatesPublic = async (req, res) => {
  try {
    const { showId } = req.params;
    const bookings = await Booking.find({
      $or: [{ showId }, { showTimeId: showId }],
      status: 'confirmed',
    })
      .select('userId seats')
      .populate('userId', '_id name avatar isPrivate username')
      .lean();

    const seatMap = {};
    for (const b of bookings) {
      let user = b.userId;

      // Fallback: if populate failed (string userId from old bookings), try direct lookup
      if (!user && b.userId && typeof b.userId === 'string') {
        try {
          user = await User.findOne({
            $or: [{ _id: b.userId }, { email: b.userId }],
          }).select('_id name avatar isPrivate username').lean();
        } catch { /* ignore cast errors */ }
      }

      if (!user) continue; // truly unknown booking — skip
      const priv = !!user.isPrivate;
      for (const seatId of (Array.isArray(b.seats) ? b.seats : [])) {
        seatMap[seatId] = {
          userId:    user._id ? user._id.toString() : String(b.userId),
          name:      priv ? 'Private Account'    : (user.name || 'CineConnect User'),
          avatar:    user.avatar || '',           // always show avatar even for private accounts
          username:  priv ? '🔒 Private'         : (user.username || ''),
          isMe:      false,
          isPrivate: priv,
        };
      }
    }
    res.json({ success: true, seatMap });
  } catch (err) {
    console.error('[social.getSeatMatesPublic]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── Seat-mates AUTHENTICATED — same but marks the caller's own seats ──────── */
exports.getSeatMates = async (req, res) => {
  try {
    const { showId } = req.params;
    const myId = req.user._id.toString();
    const bookings = await Booking.find({
      $or: [{ showId }, { showTimeId: showId }],
      status: 'confirmed',
    })
      .select('userId seats')
      .populate('userId', '_id name avatar isPrivate username')
      .lean();

    const seatMap = {};
    for (const b of bookings) {
      let user = b.userId;

      // Fallback for old string userIds that couldn't be populated
      if (!user && b.userId && typeof b.userId === 'string') {
        try {
          const mongoose = require('mongoose');
          if (mongoose.Types.ObjectId.isValid(b.userId)) {
            user = await User.findById(b.userId).select('_id name avatar isPrivate username').lean();
          }
        } catch { /* ignore */ }
      }

      // Check if this booking is by the current logged-in user
      const rawId = user ? (user._id?.toString() || '') : String(b.userId || '');
      const isMe  = rawId === myId || String(b.userId) === myId;

      if (!user && !isMe) continue; // unknown user, not logged-in user
      if (!user && isMe) {
        // User IS the current user even though populate failed — use req.user
        user = req.user;
      }
      if (!user) continue;

      for (const seatId of (Array.isArray(b.seats) ? b.seats : [])) {
        const priv = !isMe && !!user.isPrivate;
        seatMap[seatId] = {
          userId:    user._id ? user._id.toString() : rawId,
          name:      priv ? 'Private Account'    : (user.name || 'CineConnect User'),
          avatar:    user.avatar || '',           // always show avatar even for private accounts
          username:  priv ? '🔒 Private'         : (user.username || ''),
          isMe,
          isPrivate: priv,
        };
      }
    }
    res.json({ success: true, seatMap });
  } catch (err) {
    console.error('[social.getSeatMates]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
