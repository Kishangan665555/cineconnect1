/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CineConnect Backend Server
 *  Node.js + Express + MongoDB (Mongoose)
 *
 *  HOW TO RUN:
 *  1. cd backend
 *  2. npm install
 *  3. Copy .env.example to .env and fill in your MongoDB URI
 *  4. node scripts/seed.js          (seed demo data + create default super admin)
 *  5. npm run dev                   (start with nodemon)
 *
 *  DEFAULT SUPER ADMIN:
 *    Email:    superadmin@cineconnect.com
 *    Password: Admin@123456
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookies = require('cookie-parser');

dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, etc.) and any localhost port
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === (process.env.FRONTEND_URL || '')) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origin not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookies());

// ── Static file serving (uploaded chat images) ────────────────────────────────
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Security headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── Database Connection ────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGO_URI not set in .env file');
      process.exit(1);
    }
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,   // Fail fast if MongoDB is unreachable
      socketTimeoutMS: 10000,
    });
    console.log('✅ MongoDB Connected:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('');
    console.error('   💡 FIX: Update MONGO_URI in backend/.env with your MongoDB Atlas URI:');
    console.error('      MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/cineconnect');
    console.error('');
    console.error('   Or install & start local MongoDB:');
    console.error('      https://www.mongodb.com/try/download/community');
    console.error('');
    process.exit(1);
  }
};

// ── User-facing Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/theatre-owner', require('./routes/theatreOwner.routes'));
app.use('/api/movies', require('./routes/movie.routes'));
app.use('/api/theatres', require('./routes/theatre.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/shows', require('./routes/show.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/social', require('./routes/social.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/media', require('./routes/media.routes'));
app.use('/api/games', require('./routes/game.routes'));
app.use('/api/game-categories', require('./routes/gameCategory.routes'));
app.use('/api/store', require('./routes/store.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/ai',      require('./routes/ai.routes'));
app.use('/api/support', require('./routes/support.routes'));
// ── Admin-only Routes (separate auth system) ───────────────────────────────────
app.use('/api/admin/auth', require('./routes/admin.auth.routes'));
app.use('/api/admin/notifications', require('./routes/admin.notification.routes'));
app.use('/api/admin', require('./routes/admin.dashboard.routes'));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      adminAuth: true,
      userAuth: true,
      razorpay: !!process.env.RAZORPAY_KEY_ID,
      seatLocking: true,
      aiChat: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
      aiMode: (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') ? 'gemini' : 'fallback',
    },
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const http = require('http');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  // Create HTTP server instead of using app.listen directly
  const server = http.createServer(app);
  
  // Initialize Socket.IO
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`\n🚀 CineConnect API running on http://localhost:${PORT}`);
    console.log(`📊 Health:       http://localhost:${PORT}/api/health`);
    console.log(`🔐 Admin Auth:   http://localhost:${PORT}/api/admin/auth/login`);
    console.log(`🎬 Movies API:   http://localhost:${PORT}/api/movies`);
    console.log(`🗄️  Database:    ${process.env.MONGO_URI?.split('@')[1] || 'localhost'}\n`);
  });
});

