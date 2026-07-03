/**
 * DatabaseStatus.tsx
 *
 * Shows a live badge in Admin/TheatreOwner dashboards indicating
 * whether the app is connected to MongoDB (live) or using localStorage (demo).
 */

import { useEffect, useState } from 'react';
import { IS_LIVE, API_BASE } from '../../services/api';

interface HealthResponse {
  success: boolean;
  db:      string;
  version: string;
  uptime:  string;
}

export default function DatabaseStatus() {
  const [status,  setStatus]  = useState<'checking' | 'live' | 'offline' | 'local'>('checking');
  const [uptime,  setUptime]  = useState('');
  const [version, setVersion] = useState('');
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    if (!IS_LIVE) { setStatus('local'); return; }

    const check = async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/health`);
        const json = await res.json() as HealthResponse;
        if (json.success && json.db === 'connected') {
          setStatus('live');
          setUptime(json.uptime  || '');
          setVersion(json.version || '');
        } else {
          setStatus('offline');
        }
      } catch {
        setStatus('offline');
      }
    };

    check();
    const iv = setInterval(check, 30_000); // re-check every 30s
    return () => clearInterval(iv);
  }, []);

  const badge = {
    checking: { bg: 'bg-yellow-500/20 border-yellow-500/40', dot: 'bg-yellow-400', text: 'text-yellow-300', label: 'Connecting…' },
    live:     { bg: 'bg-green-500/20  border-green-500/40',  dot: 'bg-green-400 animate-pulse', text: 'text-green-300', label: '🍃 MongoDB Live' },
    offline:  { bg: 'bg-red-500/20    border-red-500/40',    dot: 'bg-red-400',    text: 'text-red-300',    label: 'DB Offline' },
    local:    { bg: 'bg-blue-500/20   border-blue-500/40',   dot: 'bg-blue-400',   text: 'text-blue-300',   label: '💾 localStorage' },
  }[status];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
          transition-all cursor-pointer ${badge.bg} ${badge.text}`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
        {badge.label}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/10
          bg-[#0d0d25]/95 backdrop-blur-xl p-4 z-50 shadow-2xl">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            Database Connection
          </h4>

          {status === 'live' && (
            <div className="space-y-2 text-xs">
              <Row label="Status"  value="✅ Connected to MongoDB" color="text-green-400" />
              <Row label="API URL" value={API_BASE} color="text-blue-400" />
              <Row label="Version" value={`v${version}`} />
              <Row label="Uptime"  value={uptime} />
              <p className="mt-3 text-white/50 leading-relaxed">
                All data is being read from and written to MongoDB in real-time.
              </p>
            </div>
          )}

          {status === 'offline' && (
            <div className="space-y-2 text-xs">
              <Row label="Status"  value="❌ Backend unreachable" color="text-red-400" />
              <Row label="API URL" value={API_BASE} color="text-red-300" />
              <p className="mt-3 text-white/50 leading-relaxed">
                Cannot reach the backend server. The app is using localStorage as fallback.
                Start the backend with <code className="text-yellow-300">npm run dev</code> in the <code>backend/</code> folder.
              </p>
            </div>
          )}

          {status === 'local' && (
            <div className="space-y-2 text-xs">
              <Row label="Mode"    value="localStorage (Demo)" color="text-blue-400" />
              <p className="mt-3 text-white/50 leading-relaxed">
                No backend configured. All data is stored in your browser's localStorage.
                To connect MongoDB, set <code className="text-yellow-300">VITE_API_URL=http://localhost:5000</code> in your <code>.env</code> file.
              </p>
              <div className="mt-3 p-2 rounded-lg bg-white/5 text-white/60 font-mono text-[10px] leading-relaxed">
                <div># .env (project root)</div>
                <div className="text-yellow-300">VITE_API_URL=http://localhost:5000</div>
                <div className="mt-2"># Then run:</div>
                <div className="text-green-300">cd backend && npm install</div>
                <div className="text-green-300">node scripts/seed.js</div>
                <div className="text-green-300">npm run dev</div>
              </div>
            </div>
          )}

          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color = 'text-white/70' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/40">{label}</span>
      <span className={`font-mono ${color} truncate max-w-[170px]`}>{value}</span>
    </div>
  );
}
