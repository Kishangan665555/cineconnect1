# 🎬 BookMyShow Clone — Full Stack Movie Booking Platform

A production-ready, feature-rich movie booking platform built with **React 18 + TypeScript** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## ✨ Features

### 👤 User Features
- 🏠 Home page with hero banner, trending carousel, offers slider, now showing & coming soon sections
- 🎬 Movie browsing with genre/language/format filters
- ❤️ Like / 👎 Dislike / 🔔 Interested reactions on movies
- 🌐 Language-first booking flow → Theatre list with price filter
- 💺 Interactive seat map (Normal / Silver / Gold / Premium categories)
- 💳 Payment with coupon codes & multiple payment methods
- 📋 Booking history with cancellation and post-show ratings
- 🔍 Real-time search across movies, cast, genre, director


- 👤 User dashboard with membership level & activity
- 🧊 2D & 3D Seat Visualization
🖥️ 2D theatre map for quick selection
🎮 Immersive 3D cinema hall view
🎥 Realistic seating arrangement like a real theatre
🔄 Rotate / zoom / explore seats in 3D mode
🎬 Screen positioning with correct viewing angles

👥 Community & Social Features
💬 Real-time messaging between users
🎉 Movie discussion rooms / chat groups
👤 User profiles and activity feed
⭐ Share seat selection and movie experience

### ⚙️ Admin Features
- 🎬 Full movie CRUD with image upload (poster + banner + cast photos)
- 🏛️ Theatre approval workflow (review → approve/reject with note)
- 🎟️ Coupon management (percentage & flat discount types)
- 📊 View all bookings, users, and revenue stats

### 🏛️ Theatre Owner Features
- 📋 Submit approval request with full theatre details
- 🕐 Custom showtime management (date, time, language, format, prices)
- 💺 Seat blocking panel (block individual seats with reasons)
- 🎟️ View & cancel tickets for their theatre
- 📊 Revenue and booking stats

### 🔧 Technical Features
- 🔒 JWT authentication with role-based access (user / admin / theatre_owner)
- 🔐 5-minute seat locking during checkout (auto-released by cron job)
- 🗄️ localStorage persistence (versioned, swap to MongoDB in 3 lines)
- 📁 Base64 image uploads (no server needed for images in local mode)
- ⚠️ Error boundary with graceful recovery
- 📱 Fully responsive design

---

## 🚀 Quick Start

### Option A — Frontend Only (No Backend)
```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Option B — Full Stack (Frontend + Backend + MongoDB)

#### 1. Install dependencies
```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

#### 2. Configure backend environment
```bash
# Create backend/.env
cp backend/.env.example backend/.env
# Then edit backend/.env:
```
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/bookmyshow
JWT_SECRET=your_super_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d
SEAT_LOCK_MINUTES=5
CLIENT_URL=http://localhost:5173
```

#### 3. Configure frontend environment
```bash
# Create .env in project root
echo "VITE_API_URL=http://localhost:5000" > .env
```

#### 4. Seed the database
```bash
cd backend
node scripts/seed.js
```

#### 5. Start both servers
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@bookmyshow.com | admin123 |
| **Theatre Owner 1** | owner1@theatre.com | owner123 |
| **Theatre Owner 2** | owner2@theatre.com | owner123 |
| **User** | rahul@example.com | user123 |

### 🎟️ Demo Coupon Codes
| Code | Discount | Min Order |
|------|----------|-----------|
| `FIRST50` | 50% off (max ₹150) | ₹200 |
| `WEEKEND100` | Flat ₹100 off | ₹300 |
| `PAYTM200` | Flat ₹200 off | ₹500 |
| `IMAX20` | 20% off (max ₹300) | ₹400 |

---

## 🏗️ Project Structure

```
bookmyshow-clone/
├── src/                          # Frontend (React + TypeScript)
│   ├── App.tsx                   # Root + Error Boundary + Router
│   ├── context/AppContext.tsx    # Global state (useReducer)
│   ├── data/store.ts             # Types + seed data
│   ├── lib/db.ts                 # localStorage persistence adapter
│   ├── services/                 # Backend API service layer
│   │   ├── api.ts                # Base fetch wrapper
│   │   ├── authService.ts        # Auth operations
│   │   ├── movieService.ts       # Movie CRUD + reactions
│   │   ├── bookingService.ts     # Booking operations
│   │   └── theatreService.ts     # Theatre + seats
│   ├── components/
│   │   ├── auth/LoginModal.tsx
│   │   ├── booking/BookTicketsModal.tsx
│   │   ├── layout/ (Navbar, Footer, CityModal)
│   │   └── ui/ (Toast, Modal, StarRating)
│   └── pages/
│       ├── Home.tsx, Movies.tsx, MovieDetail.tsx
│       ├── SeatSelection.tsx, Payment.tsx
│       ├── MyBookings.tsx, UserDashboard.tsx
│       ├── Admin.tsx, TheatreOwner.tsx
│       ├── SearchPage.tsx, Offers.tsx
│       └── HowItWorks.tsx
│
└── backend/                      # Backend (Node.js + Express)
    ├── server.js                 # Entry point
    ├── config/db.js              # MongoDB connection
    ├── models/                   # Mongoose schemas
    │   ├── User.model.js
    │   ├── Movie.model.js
    │   ├── Theatre.model.js
    │   ├── Booking.model.js
    │   ├── Coupon.model.js
    │   └── ApprovalRequest.model.js
    ├── controllers/              # Business logic (MVC)
    │   ├── auth.controller.js
    │   ├── movie.controller.js
    │   ├── theatre.controller.js
    │   ├── booking.controller.js
    │   ├── seat.controller.js
    │   └── coupon.controller.js
    ├── routes/                   # Express routers
    ├── middleware/               # JWT auth, error handling, validation
    └── scripts/seed.js          # Database seeder
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user 🔒 |
| PUT | `/api/auth/profile` | Update profile 🔒 |

### Movies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies` | List movies (filter: status, genre, city) |
| GET | `/api/movies/:id` | Get movie details |
| POST | `/api/movies` | Create movie (Admin) 🔒 |
| PUT | `/api/movies/:id` | Update movie (Admin) 🔒 |
| DELETE | `/api/movies/:id` | Delete movie (Admin) 🔒 |
| POST | `/api/movies/:id/react` | Like/Dislike/Interested 🔒 |
| POST | `/api/movies/:id/rate` | Rate + review 🔒 |

### Theatres
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/theatres` | List approved theatres |
| POST | `/api/theatres/request` | Submit approval request 🔒 |
| PATCH | `/api/theatres/:id/approve` | Approve (Admin) 🔒 |
| PATCH | `/api/theatres/:id/reject` | Reject (Admin) 🔒 |
| POST | `/api/theatres/:id/shows` | Add showtime (Owner) 🔒 |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking 🔒 |
| GET | `/api/bookings/user/:id` | User's bookings 🔒 |
| GET | `/api/bookings` | All bookings (Admin) 🔒 |
| PATCH | `/api/bookings/:id/cancel` | Cancel + refund 🔒 |

### Seats
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seats/lock` | Lock seats (5 min) 🔒 |
| POST | `/api/seats/release` | Release locks 🔒 |
| GET | `/api/seats/:showId` | Seat availability |

---

## 🗄️ Connecting Your Database

### MongoDB Atlas (Cloud)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/bookmyshow`
3. Add to `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/bookmyshow
   ```
4. Run seeder: `cd backend && node scripts/seed.js`

### Local MongoDB
```bash
# macOS
brew install mongodb-community && brew services start mongodb-community

# Ubuntu
sudo apt-get install mongodb && sudo systemctl start mongod

# Windows: Download from mongodb.com/try/download/community
```

### Swap localStorage → Real DB
Edit `src/lib/db.ts` — replace 3 functions:
```typescript
// Current (localStorage):
export const db = {
  get: (key) => JSON.parse(localStorage.getItem('bms_' + key) || 'null'),
  set: (key, val) => localStorage.setItem('bms_' + key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem('bms_' + key),
};

// Switch to your Express API:
export const db = {
  get: async (key) => (await fetch(`/api/${key}`)).json(),
  set: async (key, val) => fetch(`/api/${key}`, { method: 'POST', body: JSON.stringify(val) }),
  remove: async (key) => fetch(`/api/${key}`, { method: 'DELETE' }),
};
```

---

## 🛠️ VS Code Setup

### Recommended Extensions
- **ESLint** — `dbaeumer.vscode-eslint`
- **Tailwind CSS IntelliSense** — `bradlc.vscode-tailwindcss`
- **TypeScript Hero** — auto-imports
- **REST Client** — test API endpoints in VS Code

### Run Both Servers (Split Terminal)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2 (Ctrl+Shift+5 to split)
npm run dev
```

---

## 🏥 Health Check

```bash
curl http://localhost:5000/api/health
# Response:
# { "success": true, "message": "🎬 BookMyShow API is running", "db": "connected" }
```

---

## 📦 Scripts

```bash
# Frontend
npm run dev       # Start dev server (port 5173)
npm run build     # Production build
npm run preview   # Preview production build

# Backend
cd backend
npm run dev       # Start with nodemon (auto-reload)
npm start         # Production start
node scripts/seed.js  # Seed database
```

---

## 🔐 Security Features

- **Helmet.js** — HTTP security headers
- **Rate Limiting** — 500 req/15min global, 20 req/15min on auth routes
- **JWT** — Stateless authentication with 7-day expiry
- **bcryptjs** — Password hashing (12 salt rounds)
- **express-validator** — Input sanitization and validation
- **CORS** — Configured for specific origins only

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

> 💡 **Tip:** Open the app and click **📖 Docs** in the navbar to see the interactive documentation page with a step-by-step setup guide!
