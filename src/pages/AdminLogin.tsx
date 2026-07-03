import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminSession {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: string;
    name: string;
    email: string;
    adminRole: 'super_admin' | 'manager' | 'moderator';
    isSuperAdmin: boolean;
    permissions: Record<string, boolean>;
  };
  expiresAt: number;
}

// ── Persist admin session to localStorage ─────────────────────────────────────
const ADMIN_SESSION_KEY = 'cc_admin_session';

export const getAdminSession = (): AdminSession | null => {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
};

export const saveAdminSession = (session: AdminSession) => {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// ── Floating particle ─────────────────────────────────────────────────────────
interface Particle { id: number; x: string; y: string; size: number; opacity: number; dur: string; delay: string; }

// ── Admin Login Page ─────────────────────────────────────────────────────────
export const AdminLogin: React.FC = () => {
  const { navigate, login } = useApp();

  // Form state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);
  const [error, setError]       = useState('');
  const [step, setStep]         = useState<'login' | 'success'>('login');

  // Backend connection state
  const [apiMode, setApiMode]   = useState<'checking' | 'online' | 'offline'>('checking');
  const [attempts, setAttempts] = useState(0);

  // Particles
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.4,
      dur: `${4 + Math.random() * 8}s`,
      delay: `${Math.random() * 6}s`,
    }))
  );

  const emailRef = useRef<HTMLInputElement>(null);

  // Check backend connectivity
  useEffect(() => {
    emailRef.current?.focus();
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) })
      .then(r => r.json())
      .then(d => setApiMode(d.status === 'ok' ? 'online' : 'offline'))
      .catch(() => setApiMode('offline'));
  }, []);

  // Already have valid session? Skip login
  useEffect(() => {
    const session = getAdminSession();
    if (session && session.accessToken && !session.accessToken.startsWith('local_')) {
      navigate('admin');
    } else if (session && session.accessToken?.startsWith('local_')) {
      // Clear stale local-mode tokens
      clearAdminSession();
    }
  }, [navigate]);

  // ── Handle login ─────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!email.trim()) { setError('Email is required'); triggerShake(); return; }
    if (!password)     { setError('Password is required'); triggerShake(); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Invalid email format'); triggerShake(); return; }

    setLoading(true);

    // ── Try backend API first ─────────────────────────────────────────────
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (apiMode !== 'offline') {
      try {
        const resp = await fetch(`${API_BASE}/api/admin/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: email.toLowerCase(), password }),
          signal:  AbortSignal.timeout(8000),
        });

        const data = await resp.json();

        if (!resp.ok) {
          setAttempts(prev => prev + 1);
          setLoading(false);
          setError(data.message || 'Login failed');
          if (resp.status === 423) setError(`Account locked. Try again later.`);
          if (resp.status === 429) setError('Too many attempts. Please wait.');
          triggerShake();
          return;
        }

        // ✅ Backend login success
        const session: AdminSession = {
          accessToken:  data.accessToken,
          refreshToken: data.refreshToken,
          admin:        data.admin,
          expiresAt:    Date.now() + 2 * 60 * 60 * 1000, // 2 hours
        };
        saveAdminSession(session);
        setStep('success');
        setTimeout(() => navigate('admin'), 1200);
        return;
      } catch {
        // Backend unreachable — fall through to local auth
      }
    }

    // ── Fallback: local admin auth (when no backend) ──────────────────────
    const ADMIN_CREDENTIALS = [
      { email: 'admin@cineconnect.com',      password: 'admin123',    name: 'Super Admin',     adminRole: 'super_admin' as const, isSuperAdmin: true  },
      { email: 'superadmin@cineconnect.com', password: 'Admin@123456', name: 'Super Admin',    adminRole: 'super_admin' as const, isSuperAdmin: true  },
      { email: 'manager@cineconnect.com',    password: 'Manager@123',  name: 'Content Manager', adminRole: 'manager' as const,    isSuperAdmin: false },
      { email: 'moderator@cineconnect.com',  password: 'Moderator@123',name: 'Moderator',       adminRole: 'moderator' as const,  isSuperAdmin: false },
    ];

    await new Promise(r => setTimeout(r, 900)); // simulate network delay

    const found = ADMIN_CREDENTIALS.find(
      c => c.email === email.toLowerCase() && c.password === password
    );

    if (!found) {
      setAttempts(prev => prev + 1);
      setLoading(false);
      setError(attempts >= 4 ? 'Too many failed attempts. Account temporarily locked.' : 'Invalid admin credentials.');
      triggerShake();
      return;
    }

    // Also authenticate via the app context (for state management)
    login(found.email, found.password);

    const session: AdminSession = {
      accessToken:  `local_admin_token_${Date.now()}`,
      refreshToken: `local_refresh_${Date.now()}`,
      admin: {
        id:           `admin_${found.email}`,
        name:         found.name,
        email:        found.email,
        adminRole:    found.adminRole,
        isSuperAdmin: found.isSuperAdmin,
        permissions: {
          manageMovies: true, manageTheatres: true, manageBookings: true,
          manageCoupons: true, manageUsers: true, manageAdmins: found.isSuperAdmin,
          viewReports: true,
        },
      },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h for local
    };
    saveAdminSession(session);
    setStep('success');
    setTimeout(() => navigate('admin'), 1200);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const fillDemo = (role: 'super' | 'manager' | 'moderator') => {
    const map = {
      super:     { e: 'superadmin@cineconnect.com', p: 'Admin@123456' },
      manager:   { e: 'manager@cineconnect.com',   p: 'Manager@123' },
      moderator: { e: 'moderator@cineconnect.com', p: 'Moderator@123' },
    };
    setEmail(map[role].e); setPassword(map[role].p); setError('');
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0a1628 0%, #050510 100%)',
    }}>
      <style>{`@keyframes successPop{0%{transform:scale(0) rotate(-180deg);opacity:0}60%{transform:scale(1.2) rotate(10deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center', animation: 'successPop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards' }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%', margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #00c853, #1b5e20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
          boxShadow: '0 0 60px rgba(0,200,83,0.6), 0 0 120px rgba(0,200,83,0.2)',
        }}>✓</div>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Access Granted</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Redirecting to Admin Dashboard…</p>
      </div>
    </div>
  );

  // ── Main Layout ───────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', overflow: 'hidden',
      background: '#05050f', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes adminShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes adminParticleFloat { 0%,100%{transform:translateY(0) scale(1);opacity:var(--op)} 50%{transform:translateY(-20px) scale(1.2);opacity:calc(var(--op)*0.6)} }
        @keyframes adminPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 20px rgba(239,68,68,0)} }
        @keyframes adminRingRotate { to { transform: rotate(360deg); } }
        @keyframes adminCardIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes adminBgShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes adminGlow { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
        .admin-input:focus { outline: none; border-color: rgba(239,68,68,0.8) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.2), inset 0 1px 2px rgba(0,0,0,0.4) !important; }
        .admin-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(239,68,68,0.5) !important; }
        .admin-btn-primary:active { transform: translateY(0); }
        .demo-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.2) !important; }
        .admin-permission:hover { border-color: rgba(239,68,68,0.4) !important; background: rgba(239,68,68,0.06) !important; }
      `}</style>

      {/* ── LEFT PANEL — Auth Form ────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '40px 48px',
        background: 'linear-gradient(180deg, #08081c 0%, #05050f 100%)',
        position: 'relative', zIndex: 2,
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Particles behind form */}
        {particles.slice(0, 12).map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x, top: p.y, width: p.size, height: p.size,
            borderRadius: '50%', background: 'rgba(239,68,68,0.6)',
            '--op': p.opacity, opacity: p.opacity,
            animation: `adminParticleFloat ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay, pointerEvents: 'none',
          } as React.CSSProperties} />
        ))}

        {/* Back to home */}
        <button
          onClick={() => navigate('home')}
          style={{
            position: 'absolute', top: 24, left: 24,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.6)',
            fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
          }}
        >
          ← Back to site
        </button>

        {/* API Status badge */}
        <div style={{
          position: 'absolute', top: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '5px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: apiMode === 'online' ? '#4ade80' : apiMode === 'offline' ? '#ef4444' : '#fbbf24',
            animation: apiMode === 'online' ? 'adminPulse 2s infinite' : 'none',
          }} />
          {apiMode === 'online' ? 'API Connected' : apiMode === 'offline' ? 'Local Mode' : 'Checking…'}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ marginBottom: 40 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24, boxShadow: '0 8px 32px rgba(239,68,68,0.4)',
              animation: 'adminPulse 3s ease-in-out infinite',
            }}>
              <div style={{ width: 32, height: 32, color: '#fff' }}><ShieldIcon /></div>
            </div>
            <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 6px', letterSpacing: -0.5 }}>
              Admin Portal
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
              CineConnect — Restricted Access
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'flex-start', gap: 10,
              animation: 'adminCardIn 0.3s ease forwards',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
              <p style={{ color: '#fca5a5', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ animation: shake ? 'adminShake 0.5s ease' : 'none' }}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  width: 18, height: 18, color: 'rgba(255,255,255,0.3)',
                }}><MailIcon /></div>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@cineconnect.com"
                  className="admin-input"
                  autoComplete="username"
                  style={{
                    width: '100%', padding: '14px 14px 14px 44px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error && !email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, color: '#fff', fontSize: 14,
                    transition: 'all 0.2s', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  width: 18, height: 18, color: 'rgba(255,255,255,0.3)',
                }}><LockIcon /></div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••••••"
                  className="admin-input"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '14px 44px 14px 44px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error && !password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, color: '#fff', fontSize: 14,
                    transition: 'all 0.2s', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    width: 20, height: 20, color: 'rgba(255,255,255,0.4)',
                    padding: 0,
                  }}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
              {attempts > 0 && (
                <p style={{ color: 'rgba(239,68,68,0.7)', fontSize: 12, margin: '8px 0 0' }}>
                  {Math.max(0, 5 - attempts)} attempt(s) remaining before lockout
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary"
              style={{
                width: '100%', padding: '16px',
                background: loading
                  ? 'rgba(239,68,68,0.4)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', borderRadius: 14, color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
                letterSpacing: 0.5,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18 }}><SpinnerIcon /></div>
                  Authenticating…
                </>
              ) : (
                <>
                  <div style={{ width: 18, height: 18 }}><ShieldIcon /></div>
                  Sign In to Admin Panel
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>DEMO CREDENTIALS</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Demo fill buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: '⚡ Super Admin', role: 'super' as const,     color: '#ef4444' },
              { label: '📋 Manager',    role: 'manager' as const,    color: '#f59e0b' },
              { label: '👁 Moderator',  role: 'moderator' as const,  color: '#6366f1' },
            ].map(({ label, role, color }) => (
              <button
                key={role}
                type="button"
                onClick={() => fillDemo(role)}
                className="demo-btn"
                style={{
                  flex: 1, padding: '9px 6px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 10, color: color, fontSize: 11.5, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Security notice */}
          <div style={{
            marginTop: 32, padding: '14px 16px',
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 12,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11.5, margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
              🔐 This is a restricted area. All login attempts are logged and monitored.
              Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Branding & Info ─────────────────────────────────────── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a20 0%, #0d0020 40%, #150010 70%, #05050f 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 40px',
      }}>
        {/* Background particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x, top: p.y, width: p.size, height: p.size,
            borderRadius: '50%', background: 'rgba(239,68,68,0.5)',
            '--op': p.opacity, opacity: p.opacity,
            animation: `adminParticleFloat ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay, pointerEvents: 'none',
          } as React.CSSProperties} />
        ))}

        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(239,68,68,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Rotating rings */}
        {[600, 400, 250].map((size, i) => (
          <div key={size} style={{
            position: 'absolute', width: size, height: size, borderRadius: '50%',
            left: '50%', top: '50%', marginLeft: -size / 2, marginTop: -size / 2,
            border: `1px solid rgba(239,68,68,${0.04 + i * 0.02})`,
            animation: `adminRingRotate ${20 + i * 10}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
          }} />
        ))}

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', filter: 'blur(60px)', animation: 'adminGlow 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(124,58,237,0.08)', filter: 'blur(50px)', animation: 'adminGlow 6s ease-in-out infinite 2s' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 520 }}>
          {/* Main logo */}
          <div style={{
            width: 100, height: 100, borderRadius: '24px',
            background: 'linear-gradient(135deg, #1a0a0a, #2d0a0a)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
            boxShadow: '0 20px 60px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <span style={{ fontSize: 48 }}>🎬</span>
          </div>

          <h1 style={{
            fontSize: 44, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
            background: 'linear-gradient(135deg, #fff 0%, #ef4444 50%, #a855f7 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            CineConnect
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', margin: '0 0 48px' }}>
            Admin Control Center
          </p>

          {/* Feature list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 40 }}>
            {[
              { icon: '🎬', title: 'Movie Management',   desc: 'Add, edit, schedule movies with trailers & cast' },
              { icon: '🏛️', title: 'Theatre Control',    desc: 'Approve theatres, manage screens & showtimes' },
              { icon: '🎟️', title: 'Booking Oversight',  desc: 'Monitor all bookings, cancel & process refunds' },
              { icon: '👥', title: 'User Management',    desc: 'Manage users, roles, and permissions' },
              { icon: '🏷️', title: 'Coupon System',      desc: 'Create & manage discount codes and offers' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Revenue charts, booking trends, top movies' },
            ].map((f, i) => (
              <div
                key={i}
                className="admin-permission"
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '16px', textAlign: 'left',
                  animation: `adminCardIn 0.5s ease forwards`, animationDelay: `${i * 0.08}s`, opacity: 0,
                  transition: 'all 0.2s', cursor: 'default',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11.5, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Role info */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '20px 24px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              Admin Roles & Access
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { role: '⚡ Super Admin', color: '#ef4444', desc: 'Full control — manage admins, all modules' },
                { role: '📋 Manager',     color: '#f59e0b', desc: 'Movies, theatres, bookings, coupons' },
                { role: '👁 Moderator',   color: '#6366f1', desc: 'View reports, review approval requests' },
              ].map(({ role, color, desc }) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: `${color}20`, border: `1px solid ${color}40`, color,
                    whiteSpace: 'nowrap',
                  }}>{role}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 32 }}>
            {[['99.9%', 'Uptime'], ['256-bit', 'Encryption'], ['JWT', 'Auth']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 18, fontWeight: 900,
                  background: 'linear-gradient(135deg, #ef4444, #f87171)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>{v}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
