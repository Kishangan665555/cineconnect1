/**
 * ═══════════════════════════════════════════════════════════════
 *  CineConnect Database Seed Script
 *  Run: node scripts/seed.js
 * ═══════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User    = require('../models/User.model');
const Movie   = require('../models/Movie.model');
const Theatre = require('../models/Theatre.model');
const Booking = require('../models/Booking.model');
const Coupon  = require('../models/Coupon.model');

// ── Build dynamic dates ───────────────────────────────────────────────────────
const buildDates = (n = 7) => {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
};

const DATES = buildDates(7);
const TIMES = ['09:30 AM', '12:00 PM', '03:00 PM', '06:30 PM', '09:30 PM', '11:59 PM'];

function makeShows(type, movieId) {
  const shows = [];
  const langFmt = {
    IMAX:     [['Hindi','IMAX'],['English','IMAX'],['Telugu','IMAX']],
    PVR:      [['Hindi','3D'],['English','2D'],['Tamil','2D'],['Kannada','3D']],
    Standard: [['Hindi','2D'],['Telugu','2D'],['Kannada','2D'],['Tamil','3D'],['English','2D']],
    '4DX':    [['Hindi','4DX'],['English','4DX'],['Telugu','4DX']],
  };
  const sets = langFmt[type] || langFmt.Standard;
  const prices = {
    IMAX:     { normal:300, silver:400, gold:500, premium:700 },
    '4DX':    { normal:400, silver:500, gold:600, premium:800 },
    Standard: { normal:120, silver:180, gold:250, premium:350 },
    PVR:      { normal:150, silver:220, gold:300, premium:450 },
  };
  DATES.forEach((date, di) => {
    TIMES.forEach((time, ti) => {
      const [lang, fmt] = sets[ti % sets.length];
      const total  = 80 + Math.floor(Math.random() * 80);
      const booked = Math.floor(Math.random() * total * 0.4);
      shows.push({
        showId: `st_${type}_${date}_${ti}_${Math.random().toString(36).substr(2,4)}`,
        time, date, language: lang, format: fmt,
        availableSeats: total - booked, totalSeats: total,
        priceOverride: prices[type] || prices.Standard,
        movieId, isOwnerManaged: false, isEnded: false,
      });
    });
  });
  return shows;
}

function makeSeats(rows, cols) {
  const seats = [];
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cats = { normal: 120, silver: 180, gold: 250, premium: 350 };
  for (let r = 0; r < rows; r++) {
    const row = rowLetters[r] || String(r);
    let cat = 'normal';
    if      (r >= Math.floor(rows * 0.7)) cat = 'premium';
    else if (r >= Math.floor(rows * 0.4)) cat = 'gold';
    else if (r >= 2)                      cat = 'silver';
    for (let c = 1; c <= cols; c++) {
      seats.push({
        seatId: `${row}${c}`, row, col: c, category: cat,
        isBooked: Math.random() < 0.15, isBlocked: false,
        price: cats[cat],
      });
    }
  }
  return seats;
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Booking.deleteMany({}),
      Coupon.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Users ──────────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('user123', 12);
    const adminHash    = await bcrypt.hash('admin123', 12);
    const ownerHash    = await bcrypt.hash('owner123', 12);

    const users = await User.insertMany([
      { name: 'Admin User',      email: 'admin@cineconnect.com',  password: adminHash, phone: '9000000001', city: 'Mumbai',    role: 'admin',         joinDate: DATES[0] },
      { name: 'Theatre Owner 1', email: 'owner1@theatre.com',     password: ownerHash, phone: '9000000002', city: 'Lucknow',   role: 'theatre_owner', joinDate: DATES[0] },
      { name: 'Theatre Owner 2', email: 'owner2@theatre.com',     password: ownerHash, phone: '9000000003', city: 'Mumbai',    role: 'theatre_owner', joinDate: DATES[0] },
      { name: 'Rahul Sharma',    email: 'rahul@example.com',      password: passwordHash, phone: '9000000010', city: 'Mumbai', role: 'user',          joinDate: DATES[0] },
      { name: 'Priya Singh',     email: 'priya@example.com',      password: passwordHash, phone: '9000000011', city: 'Delhi',  role: 'user',          joinDate: DATES[0] },
      { name: 'Amit Kumar',      email: 'amit@example.com',       password: passwordHash, phone: '9000000012', city: 'Bengaluru', role: 'user',        joinDate: DATES[0] },
    ]);
    console.log(`👥 Created ${users.length} users`);

    // ── Movies ─────────────────────────────────────────────────────────────────
    const movies = await Movie.insertMany([
      {
        title: 'Kalki 2898 AD', genre: ['Action','Sci-Fi','Drama'],
        languages: ['Telugu','Hindi','Tamil'], duration: 181, rating: 8.4, votes: 245600,
        releaseDate: '2024-06-27', isNowShowing: true, isTrending: true,
        poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=560&fit=crop',
        banner: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1200&h=450&fit=crop',
        description: 'In a dystopian future, a warrior rises to fulfil an ancient prophecy.',
        cast: ['Prabhas','Deepika Padukone','Amitabh Bachchan'],
        castMembers: [
          { name: 'Prabhas',          role: 'Kalki',     image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
          { name: 'Deepika Padukone', role: 'Sumathi',   image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
          { name: 'Amitabh Bachchan', role: 'Ashwatthama', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
        ],
        director: 'Nag Ashwin', certificate: 'UA',
        trailerUrl: 'https://www.youtube.com/watch?v=sOEg_YZQsTI',
        userRatings: [],
      },
      {
        title: 'Stree 2', genre: ['Horror','Comedy','Thriller'],
        languages: ['Hindi'], duration: 150, rating: 8.8, votes: 312000,
        releaseDate: '2024-08-15', isNowShowing: true, isTrending: true,
        poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=560&fit=crop',
        banner: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&h=450&fit=crop',
        description: 'The terror of Stree returns to Chanderi with new victims in mind.',
        cast: ['Rajkummar Rao','Shraddha Kapoor','Pankaj Tripathi'],
        castMembers: [
          { name: 'Rajkummar Rao',   role: 'Vicky', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
          { name: 'Shraddha Kapoor', role: 'Stree', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
        ],
        director: 'Amar Kaushik', certificate: 'UA',
        trailerUrl: 'https://www.youtube.com/watch?v=uTFRiKk_t-o',
        userRatings: [],
      },
      {
        title: 'Pushpa 2: The Rule', genre: ['Action','Crime','Drama'],
        languages: ['Telugu','Hindi'], duration: 190, rating: 7.9, votes: 198000,
        releaseDate: '2024-12-05', isNowShowing: true, isTrending: true,
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=560&fit=crop',
        banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=450&fit=crop',
        description: 'Pushpa Raj expands his red sandalwood smuggling empire.',
        cast: ['Allu Arjun','Rashmika Mandanna','Fahadh Faasil'],
        castMembers: [
          { name: 'Allu Arjun',        role: 'Pushpa Raj', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
          { name: 'Rashmika Mandanna', role: 'Srivalli',   image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
        ],
        director: 'Sukumar', certificate: 'A',
        trailerUrl: 'https://www.youtube.com/watch?v=lyNVVNpWfKs',
        userRatings: [],
      },
      {
        title: 'Fighter', genre: ['Action','Drama'],
        languages: ['Hindi'], duration: 166, rating: 6.8, votes: 89000,
        releaseDate: '2025-06-25', isComingSoon: true,
        poster: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=560&fit=crop',
        banner: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1200&h=450&fit=crop',
        description: "India's first aerial action franchise.",
        cast: ['Hrithik Roshan','Deepika Padukone'], castMembers: [],
        director: 'Siddharth Anand', certificate: 'UA', userRatings: [],
      },
    ]);
    console.log(`🎬 Created ${movies.length} movies`);

    const m1id = movies[0]._id.toString();
    const m2id = movies[1]._id.toString();
    const m3id = movies[2]._id.toString();

    // ── Theatres ───────────────────────────────────────────────────────────────
    const theatres = await Theatre.insertMany([
      {
        name: 'PVR IMAX Cinemas', location: 'Phoenix Palassio Mall, Lucknow', city: 'Lucknow',
        image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&h=300&fit=crop',
        type: 'IMAX',
        amenities: ['Parking','Food Court','IMAX Screen','Dolby Atmos','Recliner Seats'],
        screens: [
          { screenId: 's1', name: 'Screen 1 – IMAX', rows: 14, cols: 20, seats: makeSeats(14, 20) },
          { screenId: 's2', name: 'Screen 2',         rows: 10, cols: 16, seats: makeSeats(10, 16) },
        ],
        showTimes: makeShows('IMAX', m1id),
        ownerId: users[1]._id.toString(), ownerName: 'Theatre Owner 1',
        approvalStatus: 'approved', isActive: true,
      },
      {
        name: 'Carnival Cinemas', location: 'Andheri West, Mumbai', city: 'Mumbai',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=300&fit=crop',
        type: 'Standard',
        amenities: ['Parking','Food Court','3D Screen'],
        screens: [
          { screenId: 's1', name: 'Screen 1', rows: 12, cols: 18, seats: makeSeats(12, 18) },
          { screenId: 's2', name: 'Screen 2', rows: 10, cols: 15, seats: makeSeats(10, 15) },
        ],
        showTimes: makeShows('Standard', m2id),
        ownerId: users[2]._id.toString(), ownerName: 'Theatre Owner 2',
        approvalStatus: 'approved', isActive: true,
      },
      {
        name: 'INOX Megaplex', location: 'Lulu Mall, Lucknow', city: 'Lucknow',
        image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=300&fit=crop',
        type: 'PVR',
        amenities: ['Parking','Food Court','Dolby','4K Laser'],
        screens: [
          { screenId: 's1', name: 'Screen 1', rows: 12, cols: 18, seats: makeSeats(12, 18) },
        ],
        showTimes: makeShows('PVR', m3id),
        ownerId: users[1]._id.toString(), ownerName: 'Theatre Owner 1',
        approvalStatus: 'approved', isActive: true,
      },
    ]);
    console.log(`🏛️  Created ${theatres.length} theatres`);

    // ── Coupons ────────────────────────────────────────────────────────────────
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const validTill = futureDate.toISOString().split('T')[0];

    await Coupon.insertMany([
      { code: 'FIRST50',  discount: 50, discountType: 'percentage', maxDiscount: 100, minAmount: 200, validTill, isActive: true, description: '50% off on your first booking' },
      { code: 'FLAT100',  discount: 100, discountType: 'flat', minAmount: 500, validTill, isActive: true, description: 'Flat ₹100 off on orders above ₹500' },
      { code: 'WEEKEND20',discount: 20, discountType: 'percentage', maxDiscount: 150, minAmount: 300, validTill, isActive: true, description: '20% off on weekend bookings' },
      { code: 'PREMIUM30', discount: 30, discountType: 'percentage', maxDiscount: 200, minAmount: 400, validTill, isActive: true, description: '30% off on premium seats' },
    ]);
    console.log('🎁 Created 4 coupons');

    // ── Sample Bookings ────────────────────────────────────────────────────────
    const showId = theatres[0].showTimes[0]?.showId || `show_${Date.now()}`;
    await Booking.create({
      userId:      users[3]._id,
      movieId:     movies[0]._id,
      theatreId:   theatres[0]._id,
      showId,                          // required field
      showTimeId:  showId,             // alias kept for compat
      seats:       ['G5','G6'],
      seatDetails: [
        { seatId: 'G5', row: 'G', col: 5, category: 'gold' },
        { seatId: 'G6', row: 'G', col: 6, category: 'gold' },
      ],
      totalAmount:   500, discount: 0, finalAmount: 500,
      paymentMethod: 'UPI',
      status:        'confirmed',
      bookingDate:   DATES[0], showDate: DATES[1],
      showTime:      '06:30 PM',
      movieTitle:    movies[0].title,
      theatreName:   theatres[0].name,
      hasRated:      false,
    });
    console.log('🎟️  Created 1 sample booking');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('  Admin:         admin@cineconnect.com  / admin123');
    console.log('  Theatre Owner: owner1@theatre.com     / owner123');
    console.log('  User:          rahul@example.com      / user123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
