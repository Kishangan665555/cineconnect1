import React, { useEffect, useState, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CityModal } from './components/layout/CityModal';
// LoginModal replaced by AuthPage — no longer needed as overlay
import { Toast } from './components/ui/Toast';
import { BookTicketsModal } from './components/booking/BookTicketsModal';
import { Home } from './pages/Home';
import { Movies } from './pages/Movies';
import { MovieDetail } from './pages/MovieDetail';
import { SeatSelection } from './pages/SeatSelection';
import { Payment } from './pages/Payment';
import { MyBookings } from './pages/MyBookings';
import { SearchPage } from './pages/SearchPage';
import { Offers } from './pages/Offers';
import Admin from './pages/Admin';
import { TheatreOwner } from './pages/TheatreOwner';
import { UserDashboard } from './pages/UserDashboard';
import HowItWorks from './pages/HowItWorks';
import AuthPage from './pages/AuthPage';
import { AdminLogin } from './pages/AdminLogin';
import { UserProfilePage } from './pages/UserProfilePage';
import { Notifications } from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PlayZone from './pages/PlayZone';
import PlayZoneCategoryPage from './pages/PlayZoneCategoryPage';
import AIChatButton from './components/ai/AIChatButton';

// ── Error Boundary ──────────────────────────────────────────────────────────
interface EBState { hasError: boolean; error?: string }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, error: err.message };
  }
  handleReset = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('bms_'))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#07071a' }}>
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-black text-white mb-3">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-2">{this.state.error}</p>
            <p className="text-gray-500 text-xs mb-6">
              This usually happens due to stale cached data. Resetting will fix it.
            </p>
            <button
              onClick={this.handleReset}
              className="text-white font-bold px-8 py-3 rounded-xl transition-colors" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}
            >
              🔄 Reset & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Floating Particles ─────────────────────────────────────────────────────
const PARTICLE_COUNT = 22;
const PARTICLE_COLORS = [
  'rgba(99,102,241,0.7)',  'rgba(99,102,241,0.4)',
  'rgba(168,85,247,0.6)',  'rgba(168,85,247,0.35)',
  'rgba(236,72,153,0.5)',  'rgba(236,72,153,0.3)',
  'rgba(251,113,133,0.5)', 'rgba(251,191,36,0.4)',
  'rgba(52,211,153,0.35)', 'rgba(255,255,255,0.2)',
];

interface ParticleDef {
  id: number; left: string; size: string;
  color: string; duration: string; delay: string;
}

const Particles: React.FC = () => {
  const [particles] = useState<ParticleDef[]>(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left:     `${Math.random() * 100}%`,
      size:     `${2 + Math.random() * 4}px`,
      color:    PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      duration: `${10 + Math.random() * 20}s`,
      delay:    `${Math.random() * 15}s`,
    }))
  );
  return (
    <>
      {particles.map(p => (
        <div key={p.id} className="cc-particle" style={{
          left: p.left, width: p.size, height: p.size,
          background: p.color, animationDuration: p.duration, animationDelay: p.delay,
        }} />
      ))}
    </>
  );
};

// ── Scroll Progress Bar ───────────────────────────────────────────────────
const ScrollProgress: React.FC = () => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="cc-scroll-bar" style={{ width: `${pct}%` }} />;
};

// ── Global Back Button ─────────────────────────────────────────────────────
const BACK_BUTTON_PAGES = [
  'movie-detail', 'seat-selection', 'payment', 'my-bookings',
  'search', 'offers', 'user-dashboard', 'how-it-works', 'movies',
];

const BackButton: React.FC = () => {
  const { page, goBack, pageHistory } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(BACK_BUTTON_PAGES.includes(page) && pageHistory.length > 0);
  }, [page, pageHistory]);

  if (!visible) return null;

  return (
    <button
      onClick={goBack}
      style={{
        position: 'fixed', top: 76, left: 20, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(3,3,8,0.88)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(168,85,247,0.25)',
        color: 'rgba(255,255,255,0.85)', borderRadius: 100, padding: '9px 18px',
        cursor: 'pointer', fontSize: 13, fontWeight: 700,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'all 0.25s ease',
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
      onMouseEnter={e => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.borderColor = 'rgba(168,85,247,0.6)';
        b.style.color = '#c084fc';
        b.style.transform = 'translateX(-3px)';
        b.style.boxShadow = '0 6px 24px rgba(168,85,247,0.2)';
      }}
      onMouseLeave={e => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.borderColor = 'rgba(168,85,247,0.25)';
        b.style.color = 'rgba(255,255,255,0.85)';
        b.style.transform = 'translateX(0)';
        b.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Back
    </button>
  );
};

// ── Pages without nav/footer ─────────────────────────────────────────────────
const NO_NAV_PAGES    = ['auth', 'admin-login', 'admin', 'theatre-owner', 'forgot-password', 'reset-password'];
const NO_FOOTER_PAGES = ['auth', 'admin-login', 'seat-selection', 'payment', 'admin', 'theatre-owner', 'forgot-password', 'reset-password'];

// ── Page Router ──────────────────────────────────────────────────────────────
const PageRouter: React.FC = () => {
  const { page } = useApp();
  const prevPage = useRef(page);

  useEffect(() => {
    prevPage.current = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const wrap = (el: React.ReactElement) => (
    <div className="cc-page-enter" style={{ position: 'relative', zIndex: 10 }}>{el}</div>
  );

  switch (page) {
    case 'auth':           return <AuthPage />;
    case 'admin-login':    return <AdminLogin />;
    case 'home':           return wrap(<Home />);
    case 'movies':         return wrap(<Movies />);
    case 'movie-detail':   return wrap(<MovieDetail />);
    case 'seat-selection': return wrap(<SeatSelection />);
    case 'payment':        return wrap(<Payment />);
    case 'my-bookings':    return wrap(<MyBookings />);
    case 'search':         return wrap(<SearchPage />);
    case 'offers':         return wrap(<Offers />);
    case 'admin':          return wrap(<Admin />);
    case 'theatre-owner':  return wrap(<TheatreOwner />);
    case 'user-dashboard': return wrap(<UserDashboard />);
    case 'user-profile':   return wrap(<UserProfilePage />);
    case 'how-it-works':   return wrap(<HowItWorks />);
    case 'notifications':  return wrap(<Notifications />);
    case 'forgot-password':return wrap(<ForgotPassword />);
    case 'reset-password': return wrap(<ResetPassword />);
    case 'play-zone':          return wrap(<PlayZone />);
    case 'play-zone-category':  return wrap(<PlayZoneCategoryPage />);
    case 'coming-soon':
      return wrap(
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-7xl mb-4">🚀</div>
            <h2 className="text-3xl font-black text-white mb-2">Coming Soon!</h2>
            <p className="text-gray-400 mb-6">This feature is under development.</p>
          </div>
        </div>
      );
    default: return wrap(<Home />);
  }
};

// ── App Layout ───────────────────────────────────────────────────────────────
const AppLayout: React.FC = () => {
  const { page } = useApp();
  const showNav    = !NO_NAV_PAGES.includes(page);
  const showFooter = !NO_FOOTER_PAGES.includes(page);
  const isAuth       = page === 'auth';
  const isAdminLogin = page === 'admin-login';

  if (isAuth) {
    return (
      <ErrorBoundary>
        <AuthPage />
        <Toast />
        <AIChatButton />
      </ErrorBoundary>
    );
  }

  if (isAdminLogin) {
    return (
      <ErrorBoundary>
        <AdminLogin />
        <Toast />
      </ErrorBoundary>
    );
  }

  return (
    <div className="cc-bg">
      {/* ── Premium Background Layers ── */}
      <div className="perspective-grid" />

      {/* Aurora orbs — violet/indigo/pink matching login page */}
      <div className="aurora-orb" style={{ width: 700, height: 700, top: -200, left: -150, background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)', animation: 'auroraShift 18s ease-in-out infinite alternate' }} />
      <div className="aurora-orb" style={{ width: 600, height: 600, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', animation: 'auroraShift 22s ease-in-out infinite alternate-reverse' }} />
      <div className="aurora-orb" style={{ width: 500, height: 500, top: '40%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', animation: 'auroraShift 26s ease-in-out infinite alternate' }} />
      <div className="aurora-orb" style={{ width: 300, height: 300, bottom: '20%', left: '10%', background: 'radial-gradient(circle, rgba(251,113,133,0.05) 0%, transparent 70%)', animation: 'auroraShift 30s ease-in-out infinite alternate-reverse' }} />

      <Particles />
      <ScrollProgress />

      {/* App chrome */}
      {showNav && <Navbar />}
      <BackButton />
      <main style={{ flex: 1, position: 'relative', zIndex: 10, paddingTop: showNav ? 68 : 0 }}>
        <ErrorBoundary>
          <PageRouter />
        </ErrorBoundary>
      </main>
      {showFooter && <Footer />}

      {/* Global Overlays */}
      <div style={{ position: 'relative', zIndex: 9999 }}>
        <CityModal />
        <BookTicketsModal />
        <Toast />
      </div>

      {/* AI Chat Assistant — floating, global */}
      <AIChatButton />
    </div>
  );
};

// ── Root ─────────────────────────────────────────────────────────────────────
export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
