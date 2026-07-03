import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const Step: React.FC<{
  num: number; title: string; children: React.ReactNode; done?: boolean;
}> = ({ num, title, children, done }) => (
  <div className="relative pl-12 pb-8">
    {/* Connector line */}
    <div className="absolute left-4 top-8 bottom-0 w-px bg-white/10" />
    {/* Circle */}
    <div className={`absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 ${
      done
        ? 'bg-green-500 border-green-400 text-white'
        : 'bg-[#e53935]/20 border-[#e53935]/60 text-[#e53935]'
    }`}>
      {done ? '✓' : num}
    </div>
    <div className="ml-2">
      <h3 className="text-white font-bold text-base mb-2">{title}</h3>
      <div className="text-gray-400 text-sm space-y-2">{children}</div>
    </div>
  </div>
);

const Code: React.FC<{ children: string; label?: string }> = ({ children, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="mt-2">
      {label && <p className="text-gray-500 text-xs mb-1">{label}</p>}
      <div className="relative group">
        <pre className="bg-black/60 border border-white/10 rounded-xl p-4 text-green-400 text-xs font-mono overflow-x-auto leading-relaxed">
          {children}
        </pre>
        <button
          onClick={copy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-white text-[10px] px-2 py-1 rounded-lg"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
    {children}
  </span>
);

export const MongoSetup: React.FC = () => {
  const { navigate } = useApp();
  const [activeTab, setActiveTab] = useState<'atlas' | 'local' | 'env'>('atlas');

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <button
            onClick={() => navigate('home')}
            className="text-gray-500 hover:text-white text-sm mb-6 inline-flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </button>

          <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-sm font-bold">MongoDB Integration Guide</span>
          </div>

          <h1 className="text-4xl font-black text-white mb-3">
            Connect Your{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              MongoDB Database
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Follow these steps to connect CineConnect to your own MongoDB database.
            All data will be stored persistently in the cloud.
          </p>
        </div>

        {/* Architecture overview */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: '⚛️', label: 'React Frontend', sub: 'Vite + TypeScript', color: 'from-blue-600/20 to-blue-700/20 border-blue-500/30' },
            { icon: '⚡', label: 'Node.js API', sub: 'Express + JWT', color: 'from-yellow-600/20 to-yellow-700/20 border-yellow-500/30' },
            { icon: '🍃', label: 'MongoDB Atlas', sub: 'Cloud Database', color: 'from-green-600/20 to-green-700/20 border-green-500/30' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div className={`bg-gradient-to-br ${item.color} border rounded-2xl p-4 text-center`}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-white font-bold text-sm">{item.label}</p>
                <p className="text-gray-500 text-xs">{item.sub}</p>
              </div>
              {i < 2 && (
                <div className="flex items-center justify-center" style={{ gridColumn: 'span 0' }}>
                  {/* arrow between cards — handled by grid gap */}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mb-10 text-gray-600 text-sm">
          <span>Browser</span>
          <span>──►</span>
          <span className="text-blue-400">:5173</span>
          <span>──►</span>
          <span className="text-yellow-400">:5000 API</span>
          <span>──►</span>
          <span className="text-green-400">MongoDB Atlas</span>
        </div>

        {/* Credentials */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5 mb-8">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#e53935]/20 flex items-center justify-center text-[#e53935] text-xs">🔑</span>
            Default Login Credentials (after seeding)
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { role: 'Admin',          email: 'admin@cineconnect.com', pw: 'admin123',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
              { role: 'Theatre Owner',  email: 'owner1@theatre.com',    pw: 'owner123',  color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
              { role: 'User',           email: 'rahul@example.com',     pw: 'user123',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
            ].map(u => (
              <div key={u.role} className={`border rounded-xl p-3 ${u.bg}`}>
                <p className={`font-bold text-xs mb-1 ${u.color}`}>{u.role}</p>
                <p className="text-gray-300 text-xs font-mono">{u.email}</p>
                <p className="text-gray-500 text-xs font-mono">{u.pw}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MongoDB Connection Tab */}
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mb-8">
          <div className="flex border-b border-white/10">
            {(['atlas', 'local', 'env'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'text-white bg-white/8 border-b-2 border-[#e53935]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'atlas' ? '☁️ MongoDB Atlas' : tab === 'local' ? '💻 Local MongoDB' : '⚙️ .env Setup'}
              </button>
            ))}
          </div>
          <div className="p-5">
            {activeTab === 'atlas' && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">MongoDB Atlas is the easiest way — free tier available (512MB).</p>
                <Step num={1} title="Create free MongoDB Atlas account">
                  <p>Go to <a href="https://mongodb.com/atlas" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">mongodb.com/atlas</a> → Sign up for free</p>
                  <p>Create a new cluster (free M0 tier)</p>
                </Step>
                <Step num={2} title="Get your connection string">
                  <p>In Atlas dashboard: <strong className="text-white">Connect → Connect your application</strong></p>
                  <p>Copy the connection string — looks like:</p>
                  <Code>mongodb+srv://username:password@cluster0.abc12.mongodb.net/cineconnect?retryWrites=true&w=majority</Code>
                </Step>
                <Step num={3} title="Whitelist your IP">
                  <p>In Atlas: <strong className="text-white">Security → Network Access → Add IP Address</strong></p>
                  <p>Add <code className="text-green-400">0.0.0.0/0</code> for development (allow from anywhere)</p>
                </Step>
                <Step num={4} title="Create database user">
                  <p>In Atlas: <strong className="text-white">Security → Database Access → Add New Database User</strong></p>
                  <p>Set username and password (same ones in your connection string)</p>
                </Step>
              </div>
            )}
            {activeTab === 'local' && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Run MongoDB locally for development.</p>
                <Step num={1} title="Install MongoDB Community Edition">
                  <Code label="macOS (Homebrew)">brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0</Code>
                  <Code label="Windows">
{`# Download from: https://www.mongodb.com/try/download/community
# Run the installer, select "Complete" setup
# MongoDB runs as a Windows Service automatically`}
                  </Code>
                  <Code label="Ubuntu/Debian">sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod</Code>
                </Step>
                <Step num={2} title="Your local connection string">
                  <Code>mongodb://localhost:27017/cineconnect</Code>
                </Step>
                <Step num={3} title="Verify MongoDB is running">
                  <Code>mongosh
# Should see: Connecting to: mongodb://localhost:27017
# Type: show dbs</Code>
                </Step>
              </div>
            )}
            {activeTab === 'env' && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Create these environment files to connect everything.</p>
                <Code label="1. Create: backend/.env">{`# MongoDB connection
MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/cineconnect

# JWT Secret (make it random & long)
JWT_SECRET=your_super_secret_key_here_64_chars_minimum

# Server port
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173`}</Code>

                <Code label="2. Create: .env (project root, for Vite)">{`# Backend API URL - remove to use localStorage only
VITE_API_URL=http://localhost:5000`}</Code>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-300">
                  ⚠️ Never commit .env files to git. Add them to .gitignore
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Run commands */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8">
          <h2 className="text-white font-bold mb-4">🚀 Run the Full Stack App</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Terminal 1 — Backend</p>
              <Code>{`cd backend
npm install
node scripts/seed.js
npm run dev
# ✅ API running on :5000`}</Code>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Terminal 2 — Frontend</p>
              <Code>{`# In project root
npm install
npm run dev
# ✅ App running on :5173`}</Code>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8">
          <h2 className="text-white font-bold mb-4">📡 API Endpoints</h2>
          <div className="space-y-2">
            {[
              { method: 'POST', path: '/api/auth/register',           desc: 'Register new user' },
              { method: 'POST', path: '/api/auth/login',              desc: 'Login & get JWT token' },
              { method: 'GET',  path: '/api/movies',                  desc: 'List all movies' },
              { method: 'POST', path: '/api/movies',                  desc: 'Add movie (admin)' },
              { method: 'POST', path: '/api/movies/:id/rate',         desc: 'Rate a movie' },
              { method: 'GET',  path: '/api/theatres',                desc: 'List all theatres' },
              { method: 'POST', path: '/api/theatres/approvals',      desc: 'Submit theatre approval' },
              { method: 'PUT',  path: '/api/theatres/approvals/:id/review', desc: 'Review request (admin)' },
              { method: 'POST', path: '/api/theatres/:id/showtimes',  desc: 'Add showtime (owner)' },
              { method: 'GET',  path: '/api/bookings/user/:userId',   desc: 'Get user bookings' },
              { method: 'POST', path: '/api/bookings',                desc: 'Create booking' },
              { method: 'PUT',  path: '/api/bookings/:id/cancel',     desc: 'Cancel booking' },
              { method: 'GET',  path: '/api/bookings/verify/:id',     desc: 'Verify ticket (QR scan)' },
              { method: 'POST', path: '/api/coupons/validate',        desc: 'Validate coupon code' },
              { method: 'GET',  path: '/api/health',                  desc: 'Server health check' },
            ].map((ep, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5">
                <Badge color={
                  ep.method === 'GET'    ? 'bg-green-500/20 text-green-400' :
                  ep.method === 'POST'   ? 'bg-blue-500/20  text-blue-400' :
                  ep.method === 'PUT'    ? 'bg-yellow-500/20 text-yellow-400' :
                                           'bg-red-500/20   text-red-400'
                }>
                  {ep.method}
                </Badge>
                <code className="text-gray-300 text-xs font-mono flex-1">{ep.path}</code>
                <span className="text-gray-600 text-xs hidden sm:block">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8">
          <h2 className="text-white font-bold mb-4">🗄️ MongoDB Collections</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: 'users',            fields: 'name, email, password (hashed), role, city, bookings[]',         color: 'border-blue-500/30' },
              { name: 'movies',           fields: 'title, genre, castMembers[], trailerUrl, userRatings[], likes[]', color: 'border-purple-500/30' },
              { name: 'theatres',         fields: 'name, city, screens[], showTimes[], approvalStatus',             color: 'border-orange-500/30' },
              { name: 'bookings',         fields: 'bookingId, userId, seats[], status, qrData',                     color: 'border-green-500/30' },
              { name: 'coupons',          fields: 'code, discount, discountType, validTill',                        color: 'border-yellow-500/30' },
              { name: 'approvalrequests', fields: 'ownerId, theatreData, status, adminNote',                        color: 'border-red-500/30' },
            ].map(c => (
              <div key={c.name} className={`border ${c.color} bg-white/3 rounded-xl p-3`}>
                <p className="text-white font-bold text-sm font-mono mb-1">{c.name}</p>
                <p className="text-gray-500 text-xs">{c.fields}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Swap guide */}
        <div className="bg-gradient-to-br from-[#e53935]/10 to-pink-600/10 border border-[#e53935]/30 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-3">🔄 Switching from localStorage → MongoDB</h2>
          <p className="text-gray-400 text-sm mb-3">
            The app uses <strong className="text-white">localStorage by default</strong> (zero setup).
            Setting <code className="text-green-400">VITE_API_URL</code> in .env switches it to MongoDB automatically.
          </p>
          <Code>{`# .env (project root)
# Without this line → uses localStorage (default)
# With this line → uses MongoDB via your backend API
VITE_API_URL=http://localhost:5000`}</Code>
          <p className="text-gray-500 text-xs mt-3">
            The <code className="text-green-400">src/lib/db.ts</code> file has the full adapter code.
            Swap <code className="text-green-400">mongoApi.get/post/put/delete</code> to point at any database
            (Supabase, Firebase, PlanetScale — same 4 functions).
          </p>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('home')}
            className="bg-gradient-to-r from-[#e53935] to-pink-600 hover:from-[#c62828] hover:to-pink-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-[#e53935]/30"
          >
            ← Back to CineConnect
          </button>
        </div>
      </div>
    </div>
  );
};
