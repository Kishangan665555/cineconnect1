/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  db.ts  –  Persistence layer
 *
 *  MODE 1 (default): localStorage  – works instantly, zero setup
 *  MODE 2: MongoDB via REST API     – set VITE_API_URL in .env
 *
 *  To switch to MongoDB just set:
 *    VITE_API_URL=http://localhost:5000
 *  in your .env file. The adapter will automatically use the API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PREFIX  = 'bms_';
const VERSION = 'v38'; // premium purple booking modal + spacious movie detail redesign

// ── Clear stale cache on version change ──────────────────────────────────────
(() => {
  try {
    const stored = localStorage.getItem('bms_cache_version');
    if (stored !== VERSION) {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
      localStorage.setItem('bms_cache_version', VERSION);
      console.log('[CineConnect] Cache cleared – fresh seed data loaded ✓');
    }
  } catch { /* ignore */ }
})();

// ── localStorage adapter ──────────────────────────────────────────────────────
export const db = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('[db] Could not persist:', key, e);
    }
  },

  remove(key: string): void {
    try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
  },

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};

export const KEYS = {
  MOVIES:            'movies',
  THEATRES:          'theatres',
  BOOKINGS:          'bookings',
  COUPONS:           'coupons',
  USERS:             'users',
  OFFERS:            'offers',
  APPROVAL_REQUESTS: 'approval_requests',
  MOVIE_LIKES:       'movie_likes',
  MOVIE_DISLIKES:    'movie_dislikes',
  MOVIE_INTERESTS:   'movie_interests',
} as const;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MongoDB REST API Service
 *
 *  HOW TO CONNECT YOUR MONGODB DATABASE:
 *
 *  1. Install backend dependencies:
 *     cd backend && npm install
 *
 *  2. Create backend/.env:
 *     MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cineconnect
 *     JWT_SECRET=your_super_secret_key_here
 *     PORT=5000
 *
 *  3. Start backend:
 *     cd backend && npm run dev
 *
 *  4. Create frontend .env:
 *     VITE_API_URL=http://localhost:5000
 *
 *  5. Restart frontend:
 *     npm run dev
 *
 *  The app will automatically detect VITE_API_URL and use MongoDB instead
 *  of localStorage. All data will be stored in your MongoDB database.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? '';

export const mongoApi = {
  isEnabled: () => !!API_URL,

  async get<T>(collection: string): Promise<T | null> {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/api/${collection}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('bms_token') ?? ''}` }
      });
      if (!res.ok) return null;
      return await res.json() as T;
    } catch { return null; }
  },

  async post<T>(collection: string, data: unknown): Promise<T | null> {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/api/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bms_token') ?? ''}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json() as T;
    } catch { return null; }
  },

  async put<T>(collection: string, id: string, data: unknown): Promise<T | null> {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/api/${collection}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bms_token') ?? ''}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json() as T;
    } catch { return null; }
  },

  async delete(collection: string, id: string): Promise<boolean> {
    if (!API_URL) return false;
    try {
      const res = await fetch(`${API_URL}/api/${collection}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('bms_token') ?? ''}` }
      });
      return res.ok;
    } catch { return false; }
  },

  async login(email: string, password: string): Promise<{ token: string; user: unknown } | null> {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { token: string; user: unknown };
      if (data.token) localStorage.setItem('bms_token', data.token);
      return data;
    } catch { return null; }
  },

  async register(userData: unknown): Promise<{ token: string; user: unknown } | null> {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) return null;
      const data = await res.json() as { token: string; user: unknown };
      if (data.token) localStorage.setItem('bms_token', data.token);
      return data;
    } catch { return null; }
  },
};
