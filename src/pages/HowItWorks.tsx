/**
 * HowItWorks.tsx
 *
 * A beautiful in-app documentation page that explains:
 * - Project architecture
 * - How to run (frontend + backend)
 * - API endpoints
 * - Database collections
 * - Default credentials
 * - How to swap localStorage → MongoDB
 */

import React, { useState } from 'react';

type Section =
  | 'overview'
  | 'run'
  | 'architecture'
  | 'api'
  | 'database'
  | 'credentials'
  | 'connect';

const tabs: { id: Section; label: string; icon: string }[] = [
  { id: 'overview',      icon: '🎬', label: 'Overview'       },
  { id: 'run',           icon: '▶️',  label: 'How to Run'    },
  { id: 'architecture',  icon: '🏗️',  label: 'Architecture'  },
  { id: 'api',           icon: '🔌',  label: 'API Endpoints' },
  { id: 'database',      icon: '🗄️',  label: 'Database'      },
  { id: 'credentials',   icon: '🔑',  label: 'Credentials'   },
  { id: 'connect',       icon: '🔗',  label: 'Connect DB'    },
];

const Code: React.FC<{ children: string; lang?: string }> = ({ children }) => (
  <pre className="bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto text-sm font-mono leading-relaxed border border-gray-700 my-3">
    <code>{children.trim()}</code>
  </pre>
);

const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => {
  const colors: Record<string, string> = {
    green:  'bg-green-900/50 text-green-400 border-green-700',
    blue:   'bg-blue-900/50 text-blue-400 border-blue-700',
    yellow: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
    red:    'bg-red-900/50 text-red-400 border-red-700',
    purple: 'bg-purple-900/50 text-purple-400 border-purple-700',
    orange: 'bg-orange-900/50 text-orange-400 border-orange-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono border ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="flex gap-4 mb-6">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold">
      {n}
    </div>
    <div className="flex-1">
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <div className="text-gray-300 text-sm">{children}</div>
    </div>
  </div>
);

const ApiRow: React.FC<{
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  desc: string;
  auth?: boolean;
}> = ({ method, path, desc, auth }) => {
  const colors = {
    GET:    'bg-green-900/50 text-green-400',
    POST:   'bg-blue-900/50 text-blue-400',
    PUT:    'bg-yellow-900/50 text-yellow-400',
    PATCH:  'bg-orange-900/50 text-orange-400',
    DELETE: 'bg-red-900/50 text-red-400',
  };
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-700/50">
      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-mono font-bold ${colors[method]}`}>
        {method}
      </span>
      <code className="flex-shrink-0 text-gray-300 text-xs font-mono min-w-[260px]">{path}</code>
      <span className="text-gray-400 text-xs flex-1">{desc}</span>
      {auth && <Badge color="yellow">🔒 JWT</Badge>}
    </div>
  );
};

export default function HowItWorks() {
  const [active, setActive] = useState<Section>('overview');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-orange-900 py-12 px-6 text-center">
        <div className="text-6xl mb-4">📖</div>
        <h1 className="text-4xl font-bold mb-2">How It Works</h1>
        <p className="text-red-200 text-lg max-w-2xl mx-auto">
          Complete guide to the BookMyShow Clone — architecture, setup, API reference, database schema, and how to connect your own MongoDB.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge color="blue">React 18 + TypeScript</Badge>
          <Badge color="green">Node.js + Express</Badge>
          <Badge color="yellow">MongoDB + Mongoose</Badge>
          <Badge color="purple">JWT Auth</Badge>
          <Badge color="orange">Vite + Tailwind</Badge>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
                  active === t.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {active === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🎬 Project Overview</h2>
            <p className="text-gray-300">
              This is a full-featured <strong className="text-white">BookMyShow-style movie booking platform</strong> built as a production-ready web application. It runs entirely in the browser using localStorage for data persistence, and includes a complete Node.js/Express backend that you can connect to MongoDB Atlas for real database storage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '🏠', title: 'Home Page', desc: 'Hero banner, trending movies carousel, offers slider, now showing & coming soon sections' },
                { icon: '🎬', title: 'Movie Browsing', desc: 'Filter by genre, language, format — Like ❤️ / Dislike 👎 / Interested 🔔 buttons' },
                { icon: '🎭', title: 'Movie Detail', desc: 'Full cast photos, community reactions, ratings, trailer link, related movies' },
                { icon: '🎟️', title: 'Book Tickets', desc: 'Language-first flow → Theatre list with price + format filters → Seat map → Payment' },
                { icon: '💺', title: 'Seat Selection', desc: 'Interactive seat map with Normal / Silver / Gold / Premium categories, booked/blocked states' },
                { icon: '💳', title: 'Payment', desc: 'Coupon codes, multiple payment methods, booking confirmation with PDF-style ticket' },
                { icon: '📋', title: 'My Bookings', desc: 'Full booking history, cancel tickets, post-show AI-enhanced star ratings & reviews' },
                { icon: '🔍', title: 'Search & Offers', desc: 'Real-time search across title/cast/genre, offers page with copy-code feature' },
                { icon: '👤', title: 'User Dashboard', desc: 'Membership level, stats, preferences, activity timeline' },
                { icon: '⚙️', title: 'Admin Panel', desc: 'Manage movies (with image upload), approve theatres, manage coupons, view all bookings' },
                { icon: '🏛️', title: 'Theatre Owner', desc: 'Submit approval request, manage showtimes + languages, block seats, view ticket sales' },
                { icon: '🔒', title: 'Seat Locking', desc: '5-minute seat lock during checkout to prevent double booking — cron job auto-releases' },
              ].map(f => (
                <div key={f.title} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-5">
              <h3 className="text-blue-300 font-bold mb-2">📦 Tech Stack</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Frontend Framework', 'React 18 + TypeScript'],
                  ['Build Tool', 'Vite 5'],
                  ['Styling', 'Tailwind CSS 3'],
                  ['State Management', 'React Context + useReducer'],
                  ['Persistence (default)', 'localStorage (versioned)'],
                  ['Backend', 'Node.js + Express 4'],
                  ['Database', 'MongoDB + Mongoose 8'],
                  ['Authentication', 'JWT (jsonwebtoken)'],
                  ['Password Hashing', 'bcryptjs (12 rounds)'],
                  ['File Uploads', 'multer (disk) + base64'],
                  ['Security', 'helmet + express-rate-limit'],
                  ['Scheduler', 'node-cron (seat lock cleanup)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-gray-400">{k}:</span>
                    <span className="text-white font-mono text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── How to Run ────────────────────────────────────────────────────── */}
        {active === 'run' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">▶️ How to Run the Project</h2>

            <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-sm text-yellow-300">
              <strong>Prerequisites:</strong> Node.js ≥ 18, npm ≥ 9, MongoDB (local or Atlas), Git
            </div>

            {/* Frontend */}
            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-4">🖥️ Option A — Frontend Only (no backend needed)</h3>
              <p className="text-gray-400 mb-3 text-sm">The app works fully with localStorage. No MongoDB or backend required.</p>

              <Step n={1} title="Clone & Install">
                <Code>{`git clone https://github.com/your-repo/bookmyshow-clone.git
cd bookmyshow-clone
npm install`}</Code>
              </Step>

              <Step n={2} title="Start the dev server">
                <Code>{`npm run dev`}</Code>
                Open <span className="text-green-400 font-mono">http://localhost:5173</span> in your browser.
              </Step>

              <Step n={3} title="Build for production">
                <Code>{`npm run build
npm run preview`}</Code>
              </Step>
            </div>

            <hr className="border-gray-700" />

            {/* Full-stack */}
            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-4">🚀 Option B — Full Stack (Frontend + Backend + MongoDB)</h3>

              <Step n={1} title="Install frontend dependencies">
                <Code>{`cd bookmyshow-clone
npm install`}</Code>
              </Step>

              <Step n={2} title="Install backend dependencies">
                <Code>{`cd backend
npm install`}</Code>
              </Step>

              <Step n={3} title="Configure backend environment">
                <Code>{`# backend/.env  (copy from backend/.env.example)
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/bookmyshow
# OR MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bookmyshow

JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
SEAT_LOCK_MINUTES=5
CLIENT_URL=http://localhost:5173`}</Code>
              </Step>

              <Step n={4} title="Configure frontend environment">
                <Code>{`# .env  (in project root)
VITE_API_URL=http://localhost:5000`}</Code>
                <p className="mt-1 text-yellow-400 text-xs">⚠️ Without this, the frontend uses localStorage (still works perfectly).</p>
              </Step>

              <Step n={5} title="Seed the database with demo data">
                <Code>{`cd backend
node scripts/seed.js`}</Code>
                This creates admin, theatre owner, 3 users, 4 movies, 2 theatres, shows & coupons.
              </Step>

              <Step n={6} title="Start the backend server">
                <Code>{`# Development (with auto-reload):
cd backend
npm run dev

# Production:
npm start`}</Code>
                Server starts on <span className="text-green-400 font-mono">http://localhost:5000</span>
              </Step>

              <Step n={7} title="Start the frontend (new terminal)">
                <Code>{`cd bookmyshow-clone
npm run dev`}</Code>
                Open <span className="text-green-400 font-mono">http://localhost:5173</span>
              </Step>

              <Step n={8} title="Verify everything works">
                <Code>{`curl http://localhost:5000/api/health
# Expected response:
# { "success": true, "message": "🎬 BookMyShow API is running", "db": "connected" }`}</Code>
              </Step>
            </div>

            <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
              <h4 className="text-green-300 font-bold mb-2">✅ VS Code Tip — Run both simultaneously</h4>
              <p className="text-gray-300 text-sm mb-2">Install the <strong>Split Terminal</strong> extension or just open two terminals:</p>
              <Code>{`# Terminal 1 (Backend)
cd backend && npm run dev

# Terminal 2 (Frontend)
cd .. && npm run dev`}</Code>
            </div>
          </div>
        )}

        {/* ── Architecture ──────────────────────────────────────────────────── */}
        {active === 'architecture' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🏗️ Architecture</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Frontend */}
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3">📁 Frontend Structure</h3>
                <Code>{`src/
├── App.tsx              # Router + Error Boundary
├── main.tsx             # Entry point
├── index.css            # Global styles
│
├── context/
│   └── AppContext.tsx   # Global state (useReducer)
│
├── data/
│   └── store.ts         # Seed data + data types
│
├── lib/
│   └── db.ts            # localStorage persistence layer
│
├── services/            # 🆕 Backend API layer
│   ├── api.ts           # Base fetch wrapper
│   ├── authService.ts   # Auth (signup/login/logout)
│   ├── movieService.ts  # Movie CRUD + react/rate
│   ├── bookingService.ts# Booking CRUD + cancel
│   └── theatreService.ts# Theatre + showtime + seats
│
├── components/
│   ├── auth/
│   │   └── LoginModal.tsx
│   ├── booking/
│   │   └── BookTicketsModal.tsx  # Language → Theatre → Show
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── CityModal.tsx
│   └── ui/
│       ├── Toast.tsx
│       ├── Modal.tsx
│       └── StarRating.tsx
│
└── pages/
    ├── Home.tsx          # Landing + carousels
    ├── Movies.tsx        # Movie listing + filters
    ├── MovieDetail.tsx   # Detail + cast + reactions
    ├── SeatSelection.tsx # Interactive seat map
    ├── Payment.tsx       # Checkout + coupons
    ├── MyBookings.tsx    # History + cancel + rate
    ├── Admin.tsx         # Admin dashboard
    ├── TheatreOwner.tsx  # Owner panel
    ├── SearchPage.tsx    # Search results
    ├── Offers.tsx        # Promotions
    ├── UserDashboard.tsx # User profile
    └── HowItWorks.tsx    # This page!`}</Code>
              </div>

              {/* Backend */}
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-3">📁 Backend Structure</h3>
                <Code>{`backend/
├── server.js            # Entry — Express app
│
├── config/
│   └── db.js            # MongoDB connection
│
├── models/              # Mongoose schemas
│   ├── User.model.js
│   ├── Movie.model.js
│   ├── Theatre.model.js
│   ├── Booking.model.js
│   ├── Coupon.model.js
│   └── ApprovalRequest.model.js
│
├── controllers/         # Business logic (MVC)
│   ├── auth.controller.js
│   ├── movie.controller.js
│   ├── theatre.controller.js
│   ├── booking.controller.js
│   ├── seat.controller.js
│   ├── coupon.controller.js
│   └── upload.controller.js
│
├── routes/              # Express routers
│   ├── auth.routes.js
│   ├── movie.routes.js
│   ├── theatre.routes.js
│   ├── show.routes.js
│   ├── booking.routes.js
│   ├── seat.routes.js
│   ├── coupon.routes.js
│   └── upload.routes.js
│
├── middleware/
│   ├── auth.middleware.js    # JWT protect + roles
│   ├── error.middleware.js   # Global error handler
│   └── validate.middleware.js# express-validator
│
├── scripts/
│   └── seed.js          # Database seeder
│
├── uploads/             # Uploaded images (multer)
├── .env.example         # Environment template
└── package.json`}</Code>
              </div>
            </div>

            {/* Data flow */}
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">🔄 Data Flow</h3>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex flex-col gap-2 text-sm font-mono">
                  {[
                    ['User Action', 'Click "Book Tickets"', 'orange'],
                    ['React Component', 'BookTicketsModal.tsx', 'blue'],
                    ['AppContext', 'dispatch({ type: "OPEN_BOOK_TICKETS" })', 'purple'],
                    ['Service Layer', 'theatreService.fetchTheatres(city)', 'green'],
                    ['API (if backend)', 'GET /api/theatres?city=Mumbai', 'yellow'],
                    ['MongoDB', 'Theatre.find({ city, isApproved: true })', 'red'],
                    ['Response', 'JSON → state → UI re-renders', 'green'],
                  ].map(([layer, detail, color]) => {
                    const colors: Record<string, string> = {
                      orange: 'text-orange-400', blue: 'text-blue-400', purple: 'text-purple-400',
                      green: 'text-green-400', yellow: 'text-yellow-400', red: 'text-red-400',
                    };
                    return (
                      <div key={layer} className="flex gap-3 items-start">
                        <span className={`min-w-[140px] font-bold ${colors[color]}`}>{layer}</span>
                        <span className="text-gray-300">→ {detail}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── API Endpoints ─────────────────────────────────────────────────── */}
        {active === 'api' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🔌 API Endpoints</h2>
            <p className="text-gray-400">Base URL: <code className="text-green-400">http://localhost:5000</code></p>

            {[
              {
                title: '🔐 Authentication',
                routes: [
                  { method: 'POST' as const, path: '/api/auth/signup',          desc: 'Register new user',            auth: false },
                  { method: 'POST' as const, path: '/api/auth/login',           desc: 'Login → returns JWT token',    auth: false },
                  { method: 'GET'  as const, path: '/api/auth/me',              desc: 'Get current user profile',     auth: true  },
                  { method: 'PUT'  as const, path: '/api/auth/profile',         desc: 'Update name/phone/city/avatar',auth: true  },
                  { method: 'PUT'  as const, path: '/api/auth/change-password', desc: 'Change password',              auth: true  },
                  { method: 'POST' as const, path: '/api/auth/logout',          desc: 'Logout (client clears token)', auth: true  },
                ],
              },
              {
                title: '🎬 Movies',
                routes: [
                  { method: 'GET'    as const, path: '/api/movies',             desc: 'List movies (filter: status, genre, city, search)', auth: false },
                  { method: 'GET'    as const, path: '/api/movies/:id',         desc: 'Get single movie with cast & shows',                auth: false },
                  { method: 'POST'   as const, path: '/api/movies',             desc: 'Create movie (Admin only)',                          auth: true  },
                  { method: 'PUT'    as const, path: '/api/movies/:id',         desc: 'Update movie (Admin only)',                          auth: true  },
                  { method: 'DELETE' as const, path: '/api/movies/:id',         desc: 'Delete movie (Admin only)',                          auth: true  },
                  { method: 'POST'   as const, path: '/api/movies/:id/react',   desc: 'Like / Dislike / Interested (User)',                 auth: true  },
                  { method: 'POST'   as const, path: '/api/movies/:id/rate',    desc: 'Post star rating + review',                          auth: true  },
                ],
              },
              {
                title: '🏛️ Theatres',
                routes: [
                  { method: 'GET'   as const, path: '/api/theatres',                  desc: 'List approved theatres (filter: city)',       auth: false },
                  { method: 'GET'   as const, path: '/api/theatres/:id',              desc: 'Get theatre with screens & shows',             auth: false },
                  { method: 'POST'  as const, path: '/api/theatres/request',          desc: 'Submit approval request (Theatre Owner)',      auth: true  },
                  { method: 'PATCH' as const, path: '/api/theatres/:id/approve',      desc: 'Approve theatre (Admin only)',                 auth: true  },
                  { method: 'PATCH' as const, path: '/api/theatres/:id/reject',       desc: 'Reject theatre (Admin only)',                  auth: true  },
                  { method: 'POST'  as const, path: '/api/theatres/:id/shows',        desc: 'Add showtime (Owner only)',                    auth: true  },
                  { method: 'PUT'   as const, path: '/api/theatres/:id/shows/:showId',desc: 'Edit showtime (Owner only)',                   auth: true  },
                  { method: 'DELETE'as const, path: '/api/theatres/:id/shows/:showId',desc: 'Delete showtime (Owner only)',                 auth: true  },
                ],
              },
              {
                title: '🎟️ Bookings',
                routes: [
                  { method: 'POST'  as const, path: '/api/bookings',                    desc: 'Create booking + confirm payment',           auth: true  },
                  { method: 'GET'   as const, path: '/api/bookings/user/:userId',        desc: 'Get bookings for a specific user',           auth: true  },
                  { method: 'GET'   as const, path: '/api/bookings/theatre/:theatreId',  desc: 'Get bookings for a theatre (Owner)',         auth: true  },
                  { method: 'GET'   as const, path: '/api/bookings',                     desc: 'Get all bookings (Admin only)',              auth: true  },
                  { method: 'GET'   as const, path: '/api/bookings/:id',                 desc: 'Get single booking details',                auth: true  },
                  { method: 'PATCH' as const, path: '/api/bookings/:id/cancel',          desc: 'Cancel booking + initiate refund',           auth: true  },
                ],
              },
              {
                title: '💺 Seats',
                routes: [
                  { method: 'POST' as const, path: '/api/seats/lock',    desc: 'Lock seats for 5 minutes (prevents double booking)', auth: true  },
                  { method: 'POST' as const, path: '/api/seats/release', desc: 'Release seat locks (user cancelled selection)',      auth: true  },
                  { method: 'GET'  as const, path: '/api/seats/:showId', desc: 'Get seat availability for a show',                  auth: false },
                ],
              },
              {
                title: '🎟️ Coupons',
                routes: [
                  { method: 'GET'    as const, path: '/api/coupons',        desc: 'List all active coupons',            auth: false },
                  { method: 'POST'   as const, path: '/api/coupons/apply',  desc: 'Validate and apply a coupon code',   auth: true  },
                  { method: 'POST'   as const, path: '/api/coupons',        desc: 'Create coupon (Admin only)',          auth: true  },
                  { method: 'DELETE' as const, path: '/api/coupons/:id',    desc: 'Delete coupon (Admin only)',          auth: true  },
                ],
              },
              {
                title: '📁 Uploads',
                routes: [
                  { method: 'POST'   as const, path: '/api/upload/image',      desc: 'Upload image file → returns URL',         auth: true },
                  { method: 'POST'   as const, path: '/api/upload/base64',     desc: 'Upload base64 image → returns URL',       auth: true },
                  { method: 'DELETE' as const, path: '/api/upload/:filename',  desc: 'Delete uploaded file',                    auth: true },
                ],
              },
            ].map(section => (
              <div key={section.title} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-white font-semibold mb-3">{section.title}</h3>
                <div className="space-y-1">
                  {section.routes.map(r => (
                    <ApiRow key={r.path + r.method} {...r} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Database ──────────────────────────────────────────────────────── */}
        {active === 'database' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🗄️ Database Collections</h2>

            {[
              {
                name: 'users',
                icon: '👤',
                fields: [
                  ['name', 'String', 'required, 2-80 chars'],
                  ['email', 'String', 'unique, lowercase'],
                  ['password', 'String', 'bcrypt hashed (12 rounds)'],
                  ['phone', 'String', 'Indian format (6-9XXXXXXXXX)'],
                  ['city', 'String', 'default: Mumbai'],
                  ['role', 'Enum', 'user | admin | theatre_owner'],
                  ['avatar', 'String', 'URL or base64'],
                  ['bookings', 'ObjectId[]', 'ref: Booking'],
                  ['isActive', 'Boolean', 'soft delete flag'],
                  ['joinDate', 'Date', 'auto set on create'],
                ],
              },
              {
                name: 'movies',
                icon: '🎬',
                fields: [
                  ['title', 'String', 'required'],
                  ['description', 'String', 'max 2000 chars'],
                  ['genre', 'String[]', 'Action, Drama, Comedy…'],
                  ['language', 'String[]', 'Hindi, English, Telugu…'],
                  ['duration', 'Number', 'in minutes'],
                  ['rating', 'Number', 'AI rating 0-10'],
                  ['releaseDate', 'Date', 'required'],
                  ['status', 'Enum', 'now_showing | coming_soon'],
                  ['poster', 'String', 'URL or base64'],
                  ['banner', 'String', 'URL or base64'],
                  ['director', 'String', ''],
                  ['cast', 'Object[]', '{ name, character, photo }'],
                  ['certificate', 'Enum', 'U | UA | A | S'],
                  ['format', 'String[]', '2D | 3D | IMAX | 4DX | Dolby'],
                  ['likes / dislikes / interested', 'Number', 'reaction counts'],
                  ['userRatings', 'Object[]', '{ userId, rating, review, date }'],
                ],
              },
              {
                name: 'theatres',
                icon: '🏛️',
                fields: [
                  ['name', 'String', 'required'],
                  ['owner', 'ObjectId', 'ref: User (theatre_owner)'],
                  ['city', 'String', 'required'],
                  ['address', 'String', 'full street address'],
                  ['location', 'GeoJSON Point', 'for geo-queries'],
                  ['image', 'String', 'URL or base64'],
                  ['type', 'Enum', 'PVR | INOX | Cinepolis | Standard | 4DX | IMAX'],
                  ['amenities', 'String[]', 'Parking, Food Court…'],
                  ['screens', 'Object[]', '{ name, format, rows, cols, seatCategories }'],
                  ['shows', 'Object[]', 'embedded show timings added by owner'],
                  ['isApproved', 'Boolean', 'set by admin'],
                  ['approvalStatus', 'Enum', 'pending | approved | rejected'],
                  ['adminNote', 'String', 'note from admin on approval/rejection'],
                  ['blockedSeats', 'Object[]', '{ seatId, reason, blockedAt }'],
                ],
              },
              {
                name: 'bookings',
                icon: '🎟️',
                fields: [
                  ['user', 'ObjectId', 'ref: User'],
                  ['movie', 'ObjectId', 'ref: Movie'],
                  ['theatre', 'ObjectId', 'ref: Theatre'],
                  ['showDate / showTime', 'Date/String', 'selected date & time'],
                  ['language / format', 'String', 'Hindi, 3D etc.'],
                  ['seats', 'Object[]', '{ id, row, col, category, price }'],
                  ['totalAmount', 'Number', 'before discount'],
                  ['discount', 'Number', 'coupon discount applied'],
                  ['finalAmount', 'Number', 'charged to user'],
                  ['couponCode', 'String', 'if any'],
                  ['paymentMethod', 'String', 'UPI, Card, Wallet etc.'],
                  ['paymentStatus', 'Enum', 'pending | paid | failed | refunded'],
                  ['bookingStatus', 'Enum', 'confirmed | cancelled | pending'],
                  ['cancelledAt / cancelledBy / refundAmount', 'Mixed', 'set on cancellation'],
                ],
              },
              {
                name: 'coupons',
                icon: '🎟️',
                fields: [
                  ['code', 'String', 'unique, uppercase'],
                  ['description', 'String', 'shown to user'],
                  ['discountType', 'Enum', 'percentage | flat'],
                  ['discountValue', 'Number', '% or ₹ amount'],
                  ['maxDiscount', 'Number', 'cap for percentage coupons'],
                  ['minOrderValue', 'Number', 'minimum booking amount'],
                  ['usageLimit', 'Number', 'max total uses'],
                  ['usedCount', 'Number', 'incremented on use'],
                  ['isActive', 'Boolean', 'toggle by admin'],
                  ['expiresAt', 'Date', 'auto-check on apply'],
                ],
              },
            ].map(col => (
              <div key={col.name} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gray-700 px-5 py-3 flex items-center gap-3">
                  <span className="text-2xl">{col.icon}</span>
                  <code className="text-yellow-400 font-bold text-lg">{col.name}</code>
                  <Badge color="blue">collection</Badge>
                </div>
                <div className="p-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-left">
                        <th className="pb-2 pr-4">Field</th>
                        <th className="pb-2 pr-4">Type</th>
                        <th className="pb-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {col.fields.map(([f, t, n]) => (
                        <tr key={f} className="border-t border-gray-700">
                          <td className="py-1.5 pr-4 font-mono text-green-400">{f}</td>
                          <td className="py-1.5 pr-4 font-mono text-blue-400">{t}</td>
                          <td className="py-1.5 text-gray-400">{n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Credentials ───────────────────────────────────────────────────── */}
        {active === 'credentials' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🔑 Default Credentials</h2>
            <p className="text-gray-400">These credentials work in the demo (localStorage mode). After seeding MongoDB, the same credentials work for the real backend.</p>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  role: 'Admin',
                  icon: '⚙️',
                  color: 'from-red-900 to-red-800 border-red-700',
                  email: 'admin@bms.com',
                  password: 'admin123',
                  access: [
                    'Full movie management (CRUD + image upload)',
                    'Approve / reject theatre requests',
                    'View all bookings from all users',
                    'Manage coupons',
                    'View all users',
                  ],
                },
                {
                  role: 'Theatre Owner',
                  icon: '🏛️',
                  color: 'from-blue-900 to-blue-800 border-blue-700',
                  email: 'owner@theatre.com',
                  password: 'owner123',
                  access: [
                    'Submit theatre approval request',
                    'Add/edit/delete custom showtimes',
                    'Set language & format per show',
                    'Block/unblock seats on their screen',
                    'View & cancel tickets for their theatre',
                  ],
                },
                {
                  role: 'Regular User',
                  icon: '👤',
                  color: 'from-green-900 to-green-800 border-green-700',
                  email: 'user@bms.com',
                  password: 'user123',
                  access: [
                    'Browse & search movies',
                    'Like / Dislike / Interested reactions',
                    'Book tickets (language → theatre → seats → pay)',
                    'Apply coupon codes',
                    'View & cancel own bookings',
                    'Rate & review movies post-show',
                  ],
                },
              ].map(c => (
                <div key={c.role} className={`bg-gradient-to-b ${c.color} rounded-xl border p-5`}>
                  <div className="text-3xl mb-2">{c.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{c.role}</h3>
                  <div className="bg-black/30 rounded-lg p-3 mb-3 font-mono text-sm">
                    <div className="text-gray-400">Email:</div>
                    <div className="text-green-400">{c.email}</div>
                    <div className="text-gray-400 mt-1">Password:</div>
                    <div className="text-yellow-400">{c.password}</div>
                  </div>
                  <ul className="space-y-1">
                    {c.access.map(a => (
                      <li key={a} className="text-gray-300 text-xs flex gap-2">
                        <span className="text-green-400">✓</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-5">
              <h3 className="text-yellow-300 font-bold mb-3">🎟️ Demo Coupon Codes</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { code: 'FIRST50',    type: '50% off',   max: '₹150 max', min: 'Min ₹200 order', desc: 'First booking discount' },
                  { code: 'WEEKEND100', type: 'Flat ₹100', max: 'No cap',   min: 'Min ₹300 order', desc: 'Weekend shows only'     },
                  { code: 'BLOCKBUST',  type: '20% off',   max: '₹200 max', min: 'Min ₹400 order', desc: 'Blockbuster movies'     },
                  { code: 'NEWUSER',    type: 'Flat ₹75',  max: 'No cap',   min: 'Min ₹150 order', desc: 'New user welcome'       },
                ].map(c => (
                  <div key={c.code} className="bg-black/30 rounded-lg p-3 flex gap-3">
                    <div className="bg-yellow-600 text-black font-bold px-3 py-1 rounded text-sm font-mono">
                      {c.code}
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">{c.type} — {c.desc}</div>
                      <div className="text-gray-400 text-xs">{c.max} · {c.min}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Connect DB ────────────────────────────────────────────────────── */}
        {active === 'connect' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🔗 Connecting Your Own Database</h2>
            <p className="text-gray-300">
              The app currently uses <strong className="text-yellow-400">localStorage</strong> for data persistence (versioned with <code className="text-green-400">src/lib/db.ts</code>). To switch to a real MongoDB database, follow these steps:
            </p>

            {/* Option 1: MongoDB Atlas */}
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">☁️ Option 1 — MongoDB Atlas (Cloud, Recommended)</h3>

              <Step n={1} title="Create a free Atlas account">
                Go to <span className="text-blue-400 underline">https://www.mongodb.com/atlas</span> → Sign up → Create a free M0 cluster
              </Step>

              <Step n={2} title="Get your connection string">
                <Code>{`# In Atlas: Database → Connect → Drivers → Node.js
# Copy the connection string:
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`}</Code>
              </Step>

              <Step n={3} title="Update backend/.env">
                <Code>{`MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bookmyshow?retryWrites=true&w=majority
JWT_SECRET=your_32_char_random_secret_here`}</Code>
              </Step>

              <Step n={4} title="Allow network access">
                In Atlas → Network Access → Add IP Address → <code className="text-green-400">0.0.0.0/0</code> (allow all) or your specific IP
              </Step>

              <Step n={5} title="Seed the database">
                <Code>{`cd backend
node scripts/seed.js
# ✅ Creates: 1 admin, 1 owner, 3 users, 4 movies, 2 theatres, coupons`}</Code>
              </Step>
            </div>

            {/* Option 2: Local MongoDB */}
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">💻 Option 2 — Local MongoDB</h3>

              <Step n={1} title="Install MongoDB Community Edition">
                <Code>{`# macOS:
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community

# Windows: Download from https://www.mongodb.com/try/download/community
# Ubuntu:
sudo apt-get install -y mongodb
sudo systemctl start mongod`}</Code>
              </Step>

              <Step n={2} title="Set connection string in backend/.env">
                <Code>{`MONGO_URI=mongodb://localhost:27017/bookmyshow`}</Code>
              </Step>
            </div>

            {/* Connect frontend */}
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">🔌 Connect Frontend to Your Backend</h3>

              <Step n={1} title="Create .env in project root">
                <Code>{`# .env (project root — next to package.json)
VITE_API_URL=http://localhost:5000`}</Code>
              </Step>

              <Step n={2} title="How the service layer works">
                <p className="text-gray-400 mb-2">
                  Every service in <code className="text-green-400">src/services/</code> calls the API if <code className="text-yellow-400">VITE_API_URL</code> is set, otherwise returns <code className="text-red-400">null</code> and the component falls back to localStorage state.
                </p>
                <Code>{`// Example in AppContext.tsx:
import { fetchMovies } from '../services/movieService';

const loadMovies = async () => {
  const apiMovies = await fetchMovies({ status: 'now_showing' });
  if (apiMovies) {
    // Use real MongoDB data
    dispatch({ type: 'SET_MOVIES', payload: apiMovies });
  } else {
    // Fallback: use seed data from localStorage
    dispatch({ type: 'SET_MOVIES', payload: db.get('MOVIES') });
  }
};`}</Code>
              </Step>

              <Step n={3} title="Swap db.ts for your own adapter">
                <p className="text-gray-400 mb-2">
                  <code className="text-green-400">src/lib/db.ts</code> is the single persistence adapter. Replace 3 functions to use Supabase, Firebase, or any REST API:
                </p>
                <Code>{`// src/lib/db.ts  — current (localStorage):
export const db = {
  get: (key) => JSON.parse(localStorage.getItem('bms_' + key) || 'null'),
  set: (key, val) => localStorage.setItem('bms_' + key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem('bms_' + key),
};

// ── To swap to Supabase: ──────────────────────────────
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const db = {
  get: async (table) => {
    const { data } = await supabase.from(table).select('*');
    return data;
  },
  set: async (table, row) => {
    await supabase.from(table).upsert(row);
  },
  remove: async (table, id) => {
    await supabase.from(table).delete().eq('id', id);
  },
};

// ── To swap to your Express API: ─────────────────────
export const db = {
  get: async (key) => {
    const res = await fetch(\`http://localhost:5000/api/\${key}\`);
    return res.json();
  },
  set: async (key, val) => {
    await fetch(\`http://localhost:5000/api/\${key}\`, {
      method: 'POST',
      body: JSON.stringify(val),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  remove: async (key) => {
    await fetch(\`http://localhost:5000/api/\${key}\`, { method: 'DELETE' });
  },
};`}</Code>
              </Step>
            </div>

            <div className="bg-green-900/30 border border-green-700 rounded-xl p-5">
              <h3 className="text-green-300 font-bold mb-2">✅ Verification Checklist</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                {[
                  'backend/.env file exists with MONGO_URI and JWT_SECRET',
                  'MongoDB is running (local) or Atlas cluster is active',
                  'cd backend && node scripts/seed.js completed successfully',
                  'cd backend && npm run dev shows "MongoDB connected: localhost" or Atlas host',
                  'GET http://localhost:5000/api/health returns { db: "connected" }',
                  '.env in project root has VITE_API_URL=http://localhost:5000',
                  'npm run dev in project root starts without errors',
                  'Login with admin@bms.com / admin123 works',
                ].map(item => (
                  <li key={item} className="flex gap-2">
                    <input type="checkbox" className="mt-0.5 accent-green-500" readOnly />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
