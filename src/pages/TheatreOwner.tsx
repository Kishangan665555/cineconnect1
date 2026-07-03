import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ShowTime, ShowFormat, SHOW_FORMATS, SHOW_LANGUAGES } from '../data/store';
import TicketScanner from '../components/scanner/TicketScanner';
import ShowSeatLocker from '../components/theatre/ShowSeatLocker';
import { SeatViewManager } from '../components/SeatViewManager';
import { TheatreViewData } from '../components/SeatExperienceModal';
import { apiGetTheatreBookings, apiGetTheatreSeatView, apiSaveTheatreSeatView, apiGetOwnerPayouts, apiGetTheatreOwnerEarnings } from '../services/apiService';
import {
  apiGetOwnerShows, apiCreateShow, apiUpdateShow, apiCancelShow,
  apiGetOwnerDashboard, apiGetOwnerAnalytics,
  OwnerShow, OwnerDashboardData, OwnerAnalyticsData,
} from '../services/theatreOwnerApiService';
import { TheatreMediaManager } from '../components/theatre/TheatreMediaManager';
import { Theatre3DBuilder } from '../components/theatre/Theatre3DBuilder';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Ic = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  shows: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
    </svg>
  ),
  tickets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 9a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V9z" />
      <line x1="9" y1="3" x2="9" y2="21" strokeDasharray="2 2" />
    </svg>
  ),
  scanner: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="4" height="4" rx="0.5" /><rect x="13" y="7" width="4" height="4" rx="0.5" />
      <rect x="7" y="13" width="4" height="4" rx="0.5" /><line x1="13" y1="13" x2="17" y2="17" />
    </svg>
  ),
  seat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M5 10a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4H5v-4z" />
      <path d="M4 14h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z" />
      <line x1="8" y1="8" x2="8" y2="5" /><line x1="16" y1="8" x2="16" y2="5" />
    </svg>
  ),
  theatre: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 21h18M4 21V9l8-6 8 6v12M9 21v-6h6v6" />
    </svg>
  ),
  approval: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  cancel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" /><line x1="8" y1="8" x2="16" y2="16" /><line x1="16" y1="8" x2="8" y2="16" />
    </svg>
  ),
  film: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" /><line x1="3.6" y1="9" x2="20.4" y2="9" />
      <line x1="3.6" y1="15" x2="20.4" y2="15" /><path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  ),
  screen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  rupee: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <line x1="6" y1="6" x2="18" y2="6" /><line x1="6" y1="10" x2="18" y2="10" />
      <path d="M6 14l7 6" /><path d="M6 10a6 6 0 0 0 6 4h4" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-yellow-400">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  media: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  cube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  )
};

// ─── Animated Counter Component ──────────────────────────────────────────────
const AnimCounter: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let frame = 0;
    const total = 60;
    const timer = setInterval(() => {
      frame++;
      const ease = 1 - Math.pow(1 - frame / total, 3);
      setDisplay(Math.round(ease * value));
      if (frame >= total) { setDisplay(value); clearInterval(timer); }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
};

// ─── Language gradient map — aurora themed ────────────────────────────────────
const LANG_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Hindi: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', text: '#fb923c' },
  English: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', text: '#818cf8' },
  Telugu: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', text: '#c084fc' },
  Tamil: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.35)', text: '#f472b6' },
  Malayalam: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)', text: '#34d399' },
  Kannada: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', text: '#fbbf24' },
  Bengali: { bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.35)', text: '#f472b6' },
  Marathi: { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.35)', text: '#a5b4fc' },
  Punjabi: { bg: 'rgba(45,212,191,0.12)', border: 'rgba(45,212,191,0.35)', text: '#2dd4bf' },
  Gujarati: { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', text: '#60a5fa' },
};
const getLangStyle = (l: string) => LANG_COLORS[l] ?? { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.5)' };

const FORMAT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  IMAX: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', text: '#818cf8' },
  '4DX': { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', text: '#c084fc' },
  Dolby: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', text: '#34d399' },
  '4K': { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.35)', text: '#fbbf24' },
  '3D': { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.35)', text: '#60a5fa' },
  '2D': { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.5)' },
};
const getFormatStyle = (f: string) => FORMAT_STYLES[f] ?? FORMAT_STYLES['2D'];

type Tab = 'dashboard' | 'shows' | 'tickets' | 'scanner' | 'seats' | 'theatre' | 'approval' | 'seatview' | 'payouts' | 'media' | '3dsetup';

// ─── Empty form state ─────────────────────────────────────────────────────────
const emptyShowForm = () => ({
  screenId: '',
  time: '',
  customTime: '',
  date: new Date().toISOString().split('T')[0],
  language: '',
  format: '2D' as ShowFormat,
  totalSeats: 100,
  movieId: '',
  priceNormal: 120,
  priceSilver: 180,
  priceGold: 250,
  pricePremium: 350,
});

const PRESET_TIMES = [
  '09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM',
  '04:30 PM', '06:00 PM', '07:30 PM', '09:00 PM', '10:30 PM', '11:59 PM',
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const TheatreOwner: React.FC = () => {
  const {
    currentUser, movies, theatres, bookings, approvalRequests,
    navigate, logout, updateTheatre, updateShowTime, addShowTime,
    submitTheatreApprovalRequest, cancelBooking, showToast,
  } = useApp();

  const [tab, setTab] = useState<Tab>(() => {
    try {
      const stored = localStorage.getItem('cc_owner_tab');
      if (stored) return stored as Tab;
    } catch { /* suppress */ }
    return 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('cc_owner_tab', tab);
  }, [tab]);
  // ─── Backend shows from MongoDB (source of truth for persisted data) ─────
  const [backendShows, setBackendShows] = useState<OwnerShow[]>([]);
  const [_showsLoading, setShowsLoading] = useState(false);
  const [showForm, setShowForm] = useState(emptyShowForm());
  const [addShowModal, setAddShowModal] = useState(false);
  const [editShow, setEditShow] = useState<ShowTime | null>(null);
  const [cancelShowId, setCancelShowId] = useState<string | null>(null);
  const [lockShow, setLockShow] = useState<ShowTime | null>(null);
  const [cancelTicketId, setCancelTicketId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [movieFilter, setMovieFilter] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'available' | 'booked' | 'blocked'>('all');
  const [seatSearch, setSeatSearch] = useState('');
  const [blockModal, setBlockModal] = useState<{ seatId: string; category: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [approvalForm, setApprovalForm] = useState({
    name: '', location: '', city: '', type: 'Standard' as any,
    image: '', amenities: [] as string[], rows: 10, cols: 15,
    description: '',
  });
  const [approvalSubmitted, setApprovalSubmitted] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  // ─── Backend dashboard data (KPIs, today shows, alerts, analytics) ────────
  const [dashData, setDashData] = useState<OwnerDashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<OwnerAnalyticsData | null>(null);
  const [_analyticsLoading, setAnalyticsLoading] = useState(false);

  // ─── Payouts & Earnings ──────────────────────────────────────────────────
  const [ownerPayouts, setOwnerPayouts] = useState<any[]>([]);
  const [ownerEarnings, setOwnerEarnings] = useState<any>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (tab === 'payouts' && currentUser?.id) {
       setPayoutLoading(true);
       apiGetOwnerPayouts().then(res => {
          if (res.ok && res.data) setOwnerPayouts(res.data.payouts || []);
       }).catch(() => {});
       apiGetTheatreOwnerEarnings().then(res => {
          if (res.ok && res.data) setOwnerEarnings(res.data.report || null);
       }).catch(() => {}).finally(() => setPayoutLoading(false));
    }
  }, [tab, currentUser?.id]);

  // Fetch dashboard KPIs from backend
  const reloadDashboard = useCallback(async () => {
    setDashLoading(true);
    try {
      const res = await apiGetOwnerDashboard();
      if (res.ok && res.data) setDashData(res.data);
    } catch { /* silent */ }
    finally { setDashLoading(false); }
  }, []);

  // Fetch analytics from backend
  const reloadAnalytics = useCallback(async () => {
    if (analyticsData) return; // Only load once per session
    setAnalyticsLoading(true);
    try {
      const res = await apiGetOwnerAnalytics();
      if (res.ok && res.data) setAnalyticsData(res.data);
    } catch { /* silent */ }
    finally { setAnalyticsLoading(false); }
  }, [analyticsData]);

  // ─── Backend theatre fallback (for owners whose Theatre was just auto-created) ──
  const [backendTheatre, setBackendTheatre] = useState<any>(null);

  // ─── Derived data (declared BEFORE useEffect) ─────────────────────────────
  // myTheatre: first check AppContext (fast), then fall back to backendTheatre (from API)
  const myTheatre = useMemo(
    () =>
      theatres.find(t => t.ownerId === currentUser?.id && t.approvalStatus === 'approved')
      ?? backendTheatre ?? null,
    [theatres, currentUser, backendTheatre]
  );
  const myRequest = useMemo(
    () => approvalRequests.find(r => r.ownerId === currentUser?.id),
    [approvalRequests, currentUser]
  );
  // Merge backend shows (MongoDB) with local shows; backend takes priority
  const allShows = useMemo(() => {
    if (backendShows.length > 0) {
      // Map backend OwnerShow → ShowTime-compatible shape
      return backendShows.map(s => ({
        id: (s as any)._id || s.id,
        time: s.time,
        date: s.date,
        language: s.language,
        format: s.format as any,
        totalSeats: s.totalSeats,
        availableSeats: s.availableSeats,
        movieId: s.movieId || undefined,
        isOwnerManaged: true,
        isEnded: s.isEnded || false,
        screenId: (s as any).screenId,
        screenName: s.screenName,
        priceOverride: s.priceOverride,
        // Extra display data
        _movieTitle: s.movieTitle,
        _moviePoster: s.moviePoster,
      } as any));
    }
    return myTheatre?.showTimes ?? [];
  }, [backendShows, myTheatre]);

  // ── DB bookings from MongoDB ─────────────────────────────────────────
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [_bookingsLoading, setBookingsLoading] = useState(false);

  // ── Seat View Data from MongoDB ──────────────────────────────────────
  const [dbSeatViewData, setDbSeatViewData] = useState<TheatreViewData | null>(null);

  // Load seat view data from MongoDB when theatre resolves
  useEffect(() => {
    if (!myTheatre) return;
    const tid = (myTheatre as any)._id || myTheatre.id;
    apiGetTheatreSeatView(tid).then(res => {
      if (res.ok && res.data?.seatViewData) {
        setDbSeatViewData({ ...res.data.seatViewData, theatreId: tid });
      } else {
        // Fallback: try localStorage
        try {
          const raw = localStorage.getItem(`cc_view_${tid}`);
          if (raw) setDbSeatViewData(JSON.parse(raw));
        } catch { /* ignore */ }
      }
    }).catch(() => {
      try {
        const raw = localStorage.getItem(`cc_view_${(myTheatre as any)._id || myTheatre.id}`);
        if (raw) setDbSeatViewData(JSON.parse(raw));
      } catch { /* ignore */ }
    });
  }, [myTheatre?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reload shows from backend ──────────────────────────────────────────
  const reloadShows = useCallback(() => {
    if (!myTheatre) return;
    setShowsLoading(true);
    apiGetOwnerShows()
      .then(res => {
        if (res.ok && res.data?.shows) {
          setBackendShows(res.data.shows.map((s: any) => ({
            ...s,
            id: s._id || s.id,
            movieId: s.movieId?._id || s.movieId?.id || s.movieId || '',
            movieTitle: s.movieTitle || s.movieId?.title || '',
            moviePoster: s.movieId?.poster || '',
          })));
        }
      })
      .catch(() => { })
      .finally(() => setShowsLoading(false));
  }, [myTheatre?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch this theatre's bookings from MongoDB — initial load + real-time poll every 20s
  const loadTheatreBookings = useCallback(() => {
    if (!myTheatre) return;
    const theatreId = (myTheatre as any)._id || myTheatre.id;
    if (!theatreId) return;
    setBookingsLoading(true);
    apiGetTheatreBookings(theatreId)
      .then(res => {
        if (res.ok && res.data) {
          const raw: any[] = (res.data as any).bookings ?? (Array.isArray(res.data) ? res.data : []);
          setDbBookings(raw.map((b: any) => ({
            id: b._id || b.id,
            userId: b.userId?._id || b.userId?.id || b.userId || '',
            userName: b.userId?.name || b.userName || '',
            userAvatar: b.userId?.avatar || b.userAvatar || '',
            theatreId: b.theatreId?._id || b.theatreId?.id || b.theatreId || '',
            movieId: b.movieId?._id || b.movieId?.id || b.movieId || '',
            movieTitle: b.movieTitle || b.movieId?.title || '',
            moviePoster: b.moviePoster || b.movieId?.poster || '',
            theatreName: b.theatreName || b.theatreId?.name || '',
            showDate: b.showDate || '',
            showTime: b.showTime || '',
            seats: b.seats || [],
            seatDetails: b.seatDetails || [],
            totalAmount: b.totalAmount || 0,
            finalAmount: b.finalAmount || b.totalAmount || 0,
            discount: b.discount || 0,
            status: b.status || 'confirmed',
            bookingDate: b.createdAt || b.bookingDate || '',
            ticketCode: b.ticketCode || '',
            paymentMethod: b.paymentMethod || 'online',
          })));
        }
      })
      .catch(() => { })
      .finally(() => setBookingsLoading(false));
  }, [myTheatre?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load + real-time polling every 20s + instant refresh on new booking signal
  useEffect(() => {
    if (!currentUser) return;

    // Always load dashboard from backend (it auto-creates theatre if needed)
    reloadDashboard();

    // If theatre not in AppContext yet, fetch from backend
    if (!theatres.find(t => t.ownerId === currentUser.id && t.approvalStatus === 'approved')) {
      // Trigger getOwnerShows which auto-creates the Theatre document
      apiGetOwnerShows().then(res => {
        if (res.ok && (res.data as any)?.theatre) {
          setBackendTheatre((res.data as any).theatre);
        }
      }).catch(() => {});
    }
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!myTheatre) return;
    loadTheatreBookings();
    reloadShows();
    const poll = setInterval(() => {
      loadTheatreBookings();
      reloadShows();
      reloadDashboard(); // keep KPIs live
    }, 30000);

    // Instant refresh when AppContext broadcasts a new booking
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cc_booking_ts') { loadTheatreBookings(); reloadDashboard(); }
    };
    window.addEventListener('storage', onStorage);

    // Refresh when owner switches back to the tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') { loadTheatreBookings(); reloadDashboard(); }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(poll);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [myTheatre?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load analytics when user opens dashboard tab
  useEffect(() => {
    if (tab === 'dashboard' && myTheatre) reloadAnalytics();
  }, [tab, myTheatre?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefer live MongoDB bookings; fall back to AppContext bookings
  const myBookings = useMemo(
    () => dbBookings.length > 0
      ? dbBookings
      : bookings.filter(b => {
        const tid = (myTheatre as any)?._id || myTheatre?.id;
        return b.theatreId === tid || b.theatreId === myTheatre?.id;
      }),
    [dbBookings, bookings, myTheatre]
  );
  const today = new Date().toISOString().split('T')[0];
  const todayShows = allShows.filter((s: any) => s.date === today && !s.isEnded);

  // Prefer backend KPIs (accurate), fall back to locally computed
  const totalRevenue   = dashData?.kpis.totalRevenue   ?? myBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.finalAmount, 0);
  const confirmedCount = dashData?.kpis.confirmedBookings ?? myBookings.filter(b => b.status === 'confirmed').length;
  const cancelledCount = dashData?.kpis.cancelledBookings ?? myBookings.filter(b => b.status === 'cancelled').length;
  const blockedSeats = myTheatre?.screens.flatMap((sc: any) => sc.seats.filter((s: any) => s.isBlocked)) ?? [];

  // Filtered showtimes
  const filteredShows = useMemo(() => {
    return allShows.filter((s: any) => {
      if (dateFilter && s.date !== dateFilter) return false;
      if (movieFilter && s.movieId !== movieFilter) return false;
      return true;
    });
  }, [allShows, dateFilter, movieFilter]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return myBookings.filter(b => {
      if (ticketFilter !== 'all' && b.status !== ticketFilter) return false;
      if (ticketSearch) {
        const q = ticketSearch.toLowerCase();
        if (!b.id.toLowerCase().includes(q) && !b.movieTitle.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [myBookings, ticketFilter, ticketSearch]);

  // Group shows by screen
  const showsByScreen = useMemo(() => {
    if (!myTheatre) return [];
    return myTheatre.screens.map((sc: any) => ({
      screen: sc,
      shows: filteredShows.filter((s: any) => s.screenId === sc.id || !s.screenId),
    }));
  }, [myTheatre, filteredShows]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const openAddShow = (screenId: string) => {
    setShowForm({ ...emptyShowForm(), screenId });
    setEditShow(null);
    setAddShowModal(true);
  };

  const openEditShow = (show: ShowTime) => {
    setShowForm({
      screenId: (show as any).screenId ?? '',
      time: show.time,
      customTime: show.time,
      date: show.date,
      language: show.language,
      format: show.format,
      totalSeats: show.totalSeats,
      movieId: show.movieId ?? '',
      priceNormal: show.priceOverride?.normal ?? 120,
      priceSilver: show.priceOverride?.silver ?? 180,
      priceGold: show.priceOverride?.gold ?? 250,
      pricePremium: show.priceOverride?.premium ?? 350,
    });
    setEditShow(show);
    setAddShowModal(true);
  };

  const handleSaveShow = async () => {
    if (!myTheatre) return;
    const time = showForm.customTime || showForm.time;
    if (!time || !showForm.language || !showForm.date || !showForm.screenId) {
      alert('Please fill: Screen, Date, Time, and Language');
      return;
    }
    const screenObj = myTheatre.screens.find((sc: any) => sc.id === showForm.screenId);
    const apiPayload = {
      movieId: showForm.movieId || undefined,
      screenId: showForm.screenId,
      screenName: screenObj?.name || 'Screen 1',
      date: showForm.date,
      time,
      customTime: showForm.customTime || undefined,
      language: showForm.language,
      format: showForm.format,
      totalSeats: showForm.totalSeats,
      priceNormal: showForm.priceNormal,
      priceSilver: showForm.priceSilver,
      priceGold: showForm.priceGold,
      pricePremium: showForm.pricePremium,
    };

    const showData = {
      time,
      date: showForm.date,
      language: showForm.language,
      format: showForm.format,
      totalSeats: showForm.totalSeats,
      availableSeats: showForm.totalSeats,
      movieId: showForm.movieId || undefined,
      isOwnerManaged: true,
      screenId: showForm.screenId,
      priceOverride: {
        normal: showForm.priceNormal,
        silver: showForm.priceSilver,
        gold: showForm.priceGold,
        premium: showForm.pricePremium,
      },
    } as any;

    // Try backend first
    if (editShow) {
      const showId = (editShow as any)._id || editShow.id;
      if (showId && !showId.startsWith('ow_') && !showId.startsWith('st_')) {
        // Real MongoDB ObjectId — update via API
        const res = await apiUpdateShow(showId, apiPayload);
        if (res.ok) {
          showToast('Show updated & saved to database ✓', 'success');
          reloadShows();
        } else {
          showToast(res.message || 'Failed to update show', 'error');
        }
      }
      updateShowTime(myTheatre.id, { ...editShow, ...showData });
    } else {
      const res = await apiCreateShow(apiPayload);
      if (res.ok && res.data?.show) {
        showToast('Show created & saved to database ✓', 'success');
        reloadShows();
        // Also keep local state in sync
        const s = res.data.show as any;
        addShowTime(myTheatre.id, {
          id: s._id || s.id || `ow_${Date.now()}`,
          ...showData,
        });
      } else {
        showToast(res.message || 'Show saved locally only (backend unreachable)', 'info');
        addShowTime(myTheatre.id, { id: `ow_${Date.now()}`, ...showData });
      }
    }
    setAddShowModal(false);
    setShowForm(emptyShowForm());
    setEditShow(null);
  };

  const handleCancelShow = async (showId: string) => {
    if (!myTheatre) return;
    const show = allShows.find((s: any) => s.id === showId);
    // Try backend cancel if it's a real MongoDB id
    if (showId && !showId.startsWith('ow_') && !showId.startsWith('st_')) {
      const res = await apiCancelShow(showId);
      if (res.ok) {
        showToast('Show cancelled in database', 'info');
        reloadShows();
      }
    }
    if (show) {
      updateShowTime(myTheatre.id, { ...show, isEnded: true, endedAt: new Date().toISOString() });
    }
    setCancelShowId(null);
  };

  const handleCancelTicket = (bookingId: string) => {
    cancelBooking(bookingId, 'theatre_owner');
    setCancelTicketId(null);
  };

  const handleBlockSeat = (screenId: string, seatId: string) => {
    if (!myTheatre || !blockReason) return;
    const updated = {
      ...myTheatre,
      screens: myTheatre.screens.map((sc: any) =>
        sc.id !== screenId ? sc : {
          ...sc,
          seats: sc.seats.map((s: any) =>
            s.id !== seatId ? s : { ...s, isBlocked: true, blockedReason: blockReason }
          ),
        }
      ),
    };
    updateTheatre(updated);
    setBlockModal(null);
    setBlockReason('');
  };

  const handleUnblockSeat = (screenId: string, seatId: string) => {
    if (!myTheatre) return;
    const updated = {
      ...myTheatre,
      screens: myTheatre.screens.map((sc: any) =>
        sc.id !== screenId ? sc : {
          ...sc,
          seats: sc.seats.map((s: any) =>
            s.id !== seatId ? s : { ...s, isBlocked: false, blockedReason: undefined }
          ),
        }
      ),
    };
    updateTheatre(updated);
  };

  const handleApprovalImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setApprovalForm(f => ({ ...f, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmitApproval = () => {
    if (!currentUser || !approvalForm.name || !approvalForm.location || !approvalForm.city) {
      alert('Please fill all required fields');
      return;
    }
    submitTheatreApprovalRequest({
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerEmail: currentUser.email,
      theatreData: {
        name: approvalForm.name,
        location: approvalForm.location,
        city: approvalForm.city,
        image: approvalForm.image,
        type: approvalForm.type,
        amenities: approvalForm.amenities,
        screens: [{ id: `sc_${Date.now()}`, name: 'Screen 1', rows: approvalForm.rows, cols: approvalForm.cols, seats: [] }],
        showTimes: [],
        ownerId: currentUser.id,
        ownerName: currentUser.name,
      },
    });
    setApprovalSubmitted(true);
  };

  if (!currentUser || currentUser.role !== 'theatre_owner') {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Access Denied</p>
          <button onClick={() => navigate('home')} className="px-4 py-2 bg-red-600 rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  // ─── NAV TABS ────────────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number; color: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Ic.dashboard, color: 'text-indigo-400' },
    { id: 'shows', label: 'Shows', icon: Ic.shows, badge: todayShows.length, color: 'text-blue-400' },
    { id: 'tickets', label: 'Tickets', icon: Ic.tickets, badge: confirmedCount, color: 'text-green-400' },
    { id: 'scanner', label: 'Scanner', icon: Ic.scanner, color: 'text-cyan-400' },
    { id: 'seats', label: 'Seats', icon: Ic.seat, badge: blockedSeats.length || undefined, color: 'text-orange-400' },
    { id: 'theatre', label: 'Theatre', icon: Ic.theatre, color: 'text-purple-400' },
    ...(myTheatre ? [{ id: 'payouts' as Tab, label: 'Payouts', icon: Ic.rupee, color: 'text-emerald-400' }] : []),
    ...(myTheatre ? [{ id: 'media' as Tab, label: 'Media', icon: Ic.media, color: 'text-pink-400' }] : []),
    ...(myTheatre ? [{ id: '3dsetup' as Tab, label: '3D Setup', icon: Ic.cube, color: 'text-rose-400' }] : []),
    ...(myTheatre ? [{ id: 'seatview' as Tab, label: '👁 Views', icon: Ic.globe, color: 'text-fuchsia-400' }] : []),
    ...(!myTheatre ? [{ id: 'approval' as Tab, label: 'Get Listed', icon: Ic.approval, color: 'text-yellow-400' }] : []),
  ];

  // ─── RENDER ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="to-dash text-white">
      {/* ── Cinematic Background ────────────────────────────────────── */}
      <div className="to-cinema-bg" aria-hidden="true">
        <div className="to-cinema-orb to-orb-1" />
        <div className="to-cinema-orb to-orb-2" />
        <div className="to-cinema-orb to-orb-3" />
        <div className="to-grid-overlay" />
      </div>
      {/* ── Floating Action Button ────────────────────────────────────── */}
      {myTheatre && tab !== 'scanner' && (
        <button className="to-fab" title="Add New Show"
          onClick={() => { setTab('shows'); setTimeout(() => myTheatre.screens[0] && openAddShow(myTheatre.screens[0].id), 150); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <div className="to-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Owner info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="to-avatar">{currentUser.name[0]}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold text-sm truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>{currentUser.name}</span>
                {myTheatre && (
                  <span className="to-status-badge">
                    <span className="pulse-dot" />
                    {myTheatre.name}
                  </span>
                )}
                {myRequest?.status === 'pending' && (
                  <span className="to-pending-badge to-pill" style={{ fontSize: 11 }}>⏳ Pending Review</span>
                )}
              </div>
              <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 12 }}>{currentUser.email}</p>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => navigate('home')} className="to-nav-btn">
              {Ic.home}<span className="hidden sm:inline">Home</span>
            </button>
            <button onClick={logout} className="to-nav-btn logout-btn">
              {Ic.logout}<span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="to-tabs">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`to-tab ${tab === t.id ? 'active' : ''}`}>
                <span className="tab-icon" style={tab === t.id ? { color: t.color.includes('indigo') ? '#818cf8' : t.color.includes('blue') ? '#60a5fa' : t.color.includes('green') ? '#34d399' : t.color.includes('cyan') ? '#22d3ee' : t.color.includes('orange') ? '#fb923c' : t.color.includes('purple') ? '#c084fc' : t.color.includes('yellow') ? '#fbbf24' : '#c084fc' } : {}}>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && <span className="to-tab-badge">{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="space-y-6" style={{ animation: 'slideIn 0.5s ease both' }}>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { label: 'Total Revenue',  numVal: totalRevenue,   isRevenue: true, icon: Ic.revenue, kpi: 'kpi-emerald', ico: 'icon-emerald', sub: `${confirmedCount} bookings`, spark: [40, 65, 45, 80, 60, 90, 75] },
                { label: 'Confirmed',      numVal: confirmedCount, icon: Ic.check,   kpi: 'kpi-indigo',  ico: 'icon-indigo',  sub: 'Active tickets', spark: [30, 55, 70, 45, 80, 65, 90] },
                { label: 'Pending Payout', numVal: totalRevenue * 0.95, isRevenue: true, icon: Ic.rupee, kpi: 'kpi-pink', ico: 'icon-pink', sub: 'Est. Platform Payout', spark: [20, 40, 30, 55, 35, 45, 30] },
                { label: 'Active Shows',   numVal: dashData?.kpis.activeShows ?? allShows.filter((s: any) => !s.isEnded).length, icon: Ic.shows, kpi: 'kpi-violet', ico: 'icon-violet', sub: `${dashData?.kpis.totalScreens ?? myTheatre?.screens.length ?? 0} screens`, spark: [50, 60, 70, 55, 75, 80, 85] },
                { label: 'Weekly Revenue', numVal: dashData?.kpis.weeklyRevenue ?? 0, isRevenue: true, icon: Ic.revenue, kpi: 'kpi-emerald', ico: 'icon-emerald', sub: 'Last 7 days', spark: [30, 50, 45, 70, 55, 85, 75] },
                { label: 'Today Revenue',  numVal: dashData?.kpis.todayRevenue  ?? 0, isRevenue: true, icon: Ic.revenue, kpi: 'kpi-indigo',  ico: 'icon-indigo',  sub: `${dashData?.kpis.todayBookings ?? 0} today`, spark: [10, 40, 25, 60, 35, 70, 50] },
                { label: 'Occupancy %',    numVal: dashData?.kpis.occupancyRate ?? 0, suf: '%', icon: Ic.seat, kpi: 'kpi-pink', ico: 'icon-pink', sub: 'Across all shows', spark: [55, 60, 65, 70, 68, 75, 72] },
                { label: 'Monthly Earnings', numVal: (dashData?.kpis.weeklyRevenue ?? 0) * 4.2, isRevenue: true, icon: Ic.rupee, kpi: 'kpi-emerald', ico: 'icon-emerald', sub: 'Est. This Month', spark: [30, 50, 45, 70, 55, 85, 75] },
              ] as Array<{ label: string; numVal: number; isRevenue?: boolean; suf?: string; icon: React.ReactNode; kpi: string; ico: string; sub: string; spark: number[] }>).map((k, i) => (
                <div key={i} className={`to-kpi-card ${k.kpi}`} style={{ animation: `kpiEntry 0.6s ease both`, animationDelay: `${i * 0.08}s` }}>
                  <div className={`to-kpi-icon ${k.ico}`} style={{ width: 46, height: 46, borderRadius: 16, marginBottom: 16 }}>{k.icon}</div>
                  <p className="to-kpi-label">{k.label}</p>
                  <p className="to-kpi-value" style={{ marginTop: 6, fontSize: '2rem' }}>
                    {k.isRevenue ? <>&#8377;<AnimCounter value={k.numVal} /></> : <AnimCounter value={k.numVal} />}{k.suf ?? ''}
                  </p>
                  <p className="to-kpi-sub">{k.sub}</p>
                  <div className="to-kpi-sparkline">
                    {k.spark.map((h, j) => <div key={j} className="to-spark-bar" style={{ height: `${h}%`, animationDelay: `${j * 0.06}s` }} />)}
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Alerts from backend */}
            {(dashData?.alerts?.length ?? 0) > 0 && dashData!.alerts.map(alert => (
              <div key={alert.id} className="to-alert" style={{
                borderColor: alert.type === 'warning' ? 'rgba(251,191,36,0.3)' : alert.type === 'danger' ? 'rgba(239,68,68,0.3)' : alert.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(96,165,250,0.3)',
                background: alert.type === 'warning' ? 'rgba(251,191,36,0.07)' : alert.type === 'danger' ? 'rgba(239,68,68,0.07)' : alert.type === 'success' ? 'rgba(52,211,153,0.07)' : 'rgba(96,165,250,0.07)',
              }}>
                <div style={{ color: alert.type === 'warning' ? '#fbbf24' : alert.type === 'danger' ? '#ef4444' : alert.type === 'success' ? '#34d399' : '#60a5fa' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{alert.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{alert.message}</div>
                </div>
              </div>
            ))}
            {/* Blocked seats alert */}
            {blockedSeats.length > 0 && (
              <div className="to-alert">
                <div className="flex items-center gap-2" style={{ color: '#fbbf24' }}>
                  {Ic.warning}
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                    {blockedSeats.length} seat{blockedSeats.length !== 1 ? 's' : ''} currently blocked
                  </span>
                </div>
                <button onClick={() => setTab('seats')} className="to-btn-warn">Manage →</button>
              </div>
            )}

            {/* AI Insights Card */}
            <div className="to-ai-card" style={{ animation: 'slideIn 0.6s ease both', animationDelay: '0.45s' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="to-ai-pulse" />
                <span style={{ color: '#c084fc', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Outfit',sans-serif" }}>AI Insights</span>
                <span style={{ marginLeft: 'auto', color: 'rgba(241,245,249,0.25)', fontSize: 10 }}>Live analysis</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: '📈', title: 'Peak Hours', value: dashData ? `${dashData.kpis.todayBookings > 0 ? '6PM–9PM' : 'N/A'}` : '6PM– 9PM', hint: 'Highest booking window' },
                  { icon: '🎯', title: 'Occupancy Rate', value: `${dashData?.kpis.occupancyRate ?? (allShows.filter((s: any) => !s.isEnded).length > 0 ? Math.round(allShows.filter((s: any) => !s.isEnded).reduce((a: number, s: any) => a + ((s.totalSeats - s.availableSeats) / Math.max(s.totalSeats, 1) * 100), 0) / allShows.filter((s: any) => !s.isEnded).length) : 0)}%`, hint: 'Across active shows' },
                  { icon: '💰', title: 'Avg Ticket Value', value: confirmedCount > 0 ? `₹${Math.round(totalRevenue / confirmedCount)}` : 'N/A', hint: 'Per confirmed booking' },
                ].map((ins, i) => (
                  <div key={i} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 14, padding: '14px 16px' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 16 }}>{ins.icon}</span>
                      <span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ins.title}</span>
                    </div>
                    <p style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>{ins.value}</p>
                    <p style={{ color: 'rgba(241,245,249,0.3)', fontSize: 11, marginTop: 2 }}>{ins.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Shows */}
            <div className="to-glass-panel">
              <div className="to-panel-header">
                <div className="flex items-center gap-2">
                  <span style={{ color: '#818cf8' }}>{Ic.shows}</span>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Today's Shows</h3>
                  <span className="to-pill to-pill-scheduled">{todayShows.length} active</span>
                </div>
                {myTheatre && (
                  <button onClick={() => setTab('shows')} style={{ fontSize: 12, fontWeight: 700, color: '#c084fc', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>View all →</button>
                )}
              </div>
              {todayShows.length === 0 ? (
                <div className="to-empty">
                  <div className="to-empty-icon">🎬</div>
                  <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 13 }}>No shows scheduled for today</p>
                  {myTheatre && (
                    <button onClick={() => { setTab('shows'); }} style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: '#c084fc', background: 'none', border: 'none', cursor: 'pointer' }}>Add a show →</button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="to-table">
                    <thead>
                      <tr>
                        {['Time', 'Movie', 'Language', 'Format', 'Screen', 'Seats', 'Status'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {todayShows.slice(0, 8).map((s: any) => {
                        const mov = movies.find(m => m.id === s.movieId || (m as any)._id === s.movieId);
                        const movieTitle = mov?.title || (s as any)._movieTitle || '';
                        const moviePoster = mov?.poster || (s as any)._moviePoster || '';
                        const fillPct = s.totalSeats > 0 ? ((s.totalSeats - s.availableSeats) / s.totalSeats) * 100 : 0;
                        const screenName = myTheatre?.screens.find((sc: any) => sc.id === (s as any).screenId)?.name ?? 'General';
                        const ls = getLangStyle(s.language);
                        const fs = getFormatStyle(s.format);
                        return (
                          <tr key={s.id}>
                            <td><span className={`to-time-chip ${!s.isEnded ? 'to-time-live' : 'to-time-normal'}`}>{s.time}</span></td>
                            <td>
                              {mov ? (
                                <div className="flex items-center gap-2">
                                  {moviePoster && <img src={moviePoster} alt="" style={{ width: 28, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                                  <span style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600, maxWidth: 100 }} className="truncate">{movieTitle}</span>
                                </div>
                              ) : movieTitle ? (
                                <span style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600 }}>{movieTitle}</span>
                              ) : (
                                <span style={{ color: 'rgba(241,245,249,0.25)', fontSize: 12, fontStyle: 'italic' }}>Unassigned</span>
                              )}
                            </td>
                            <td><span className="to-pill" style={{ background: ls.bg, border: `1px solid ${ls.border}`, color: ls.text }}>{s.language}</span></td>
                            <td><span className="to-pill" style={{ background: fs.bg, border: `1px solid ${fs.border}`, color: fs.text }}>{s.format}</span></td>
                            <td><span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 12 }}>{screenName}</span></td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="to-progress">
                                  <div className={`to-progress-fill ${fillPct > 80 ? 'fill-danger' : fillPct > 50 ? 'fill-warn' : 'fill-good'}`} style={{ width: `${fillPct}%` }} />
                                </div>
                                <span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 12 }}>{s.availableSeats}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`to-pill ${s.isEnded ? 'to-pill-ended' : 'to-pill-live'}`}>
                                {s.isEnded ? 'Ended' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Bookings — prefer dashData then dbBookings */}
            {(() => {
              const recentList = (dashData?.recentBookings?.length ?? 0) > 0
                ? dashData!.recentBookings
                : myBookings.slice(0, 6);
              return (
                <div className="to-glass-panel">
                  <div className="to-panel-header">
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#34d399' }}>{Ic.tickets}</span>
                      <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Recent Bookings</h3>
                      {dashLoading && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', animation: 'pulse 1.5s infinite' }}>syncing…</span>}
                    </div>
                    <button onClick={() => setTab('tickets')} style={{ fontSize: 12, fontWeight: 700, color: '#c084fc', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>View all →</button>
                  </div>
                  {recentList.length === 0 ? (
                    <div className="to-empty" style={{ padding: 40 }}>
                      <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 13 }}>No bookings yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="to-table">
                        <thead><tr>{['Booking ID', 'Movie', 'Seats', 'Amount', 'Date', 'Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {recentList.slice(0, 6).map((b: any) => (
                            <tr key={b._id || b.id}>
                              <td><span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(241,245,249,0.5)' }}>{(b.ticketCode || b._id || b.id || '').toString().slice(-8).toUpperCase()}</span></td>
                              <td><span style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600 }}>{b.movieTitle || '—'}</span></td>
                              <td><span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 12 }}>{Array.isArray(b.seats) ? b.seats.join(', ') : b.seats || '—'}</span></td>
                              <td><span style={{ color: '#34d399', fontSize: 12, fontWeight: 800 }}>₹{b.finalAmount || b.totalAmount || 0}</span></td>
                              <td><span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 11 }}>{(b.showDate || b.createdAt || '').toString().slice(0, 10)}</span></td>
                              <td>
                                <span className={`to-pill ${b.status === 'confirmed' ? 'to-pill-confirmed' : b.status === 'cancelled' ? 'to-pill-cancelled' : 'to-pill-pending'}`}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Earnings & Payouts Tab */}
        {tab === 'payouts' && (
          <div className="space-y-6" style={{ animation: 'slideIn 0.5s ease both' }}>
            {/* KPI Cards for Earnings */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: "Total Lifetime Gross", val: ownerEarnings?.totalGrossRevenue || 0, color: 'text-white' },
                { title: "Admin Commission (5%)", val: ownerEarnings?.adminCommissionDeducted || 0, color: 'text-red-400' },
                { title: "Total Valid Net Earnings", val: ownerEarnings?.netAmountReceivable || 0, color: 'text-emerald-400' },
                { title: "Amount Settled Already", val: ownerEarnings?.alreadyPaid || 0, color: 'text-cyan-400' },
              ].map((kpi, i) => (
                <div key={i} className="to-glass-panel" style={{ padding: '20px' }}>
                   <div style={{ color: 'rgba(241,245,249,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.title}</div>
                   <div className={`mt-2 text-2xl font-black ${kpi.color}`}>₹{kpi.val.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Floating Action Banner */}
            <div className="to-glass-panel" style={{ background: 'rgba(245, 197, 24, 0.05)', borderColor: 'rgba(245, 197, 24, 0.3)' }}>
               <div className="flex justify-between items-center px-4 py-2">
                 <div>
                    <h3 className="text-yellow-400 font-bold text-lg">Pending Ledger Balance</h3>
                    <p className="text-xs text-white/50">Subject to confirmation by CineConnect Admins</p>
                 </div>
                 <div className="text-3xl font-black text-yellow-400">₹{(ownerEarnings?.pendingPayout || 0).toLocaleString()}</div>
               </div>
            </div>

            {/* Show-wise Revenue Breakdown */}
            <div className="to-glass-panel">
               <div className="to-panel-header" style={{ marginBottom: 16 }}>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem' }}>📊 Lifetime Show-wise Revenue Status</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="to-table">
                   <thead>
                     <tr>
                       <th>Show Date / Time</th>
                       <th>Movie</th>
                       <th>Tickets Sold</th>
                       <th>Gross Sales</th>
                       <th>Ticket Price</th>
                       <th>Net Earnings</th>
                     </tr>
                   </thead>
                   <tbody>
                      {(ownerEarnings?.showWiseReport || []).length > 0 ? (ownerEarnings?.showWiseReport || []).map((sw: any, i: number) => (
                         <tr key={i}>
                           <td><span style={{ color: 'rgba(241,245,249,0.6)', fontSize: 13 }}>{sw.date} {sw.time}</span></td>
                           <td><span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{sw.movieName}</span></td>
                           <td><span style={{ color: '#fff', fontSize: 13 }}>{sw.seatsSold}</span></td>
                           <td><span style={{ color: 'rgba(241,245,249,0.7)', fontSize: 13 }}>₹{sw.grossAmount.toLocaleString()}</span></td>
                           <td><span style={{ color: '#60a5fa', fontSize: 13 }}>₹{sw.ticketPrice ? sw.ticketPrice.toFixed(0) : 0}</span></td>
                           <td><span style={{ color: '#34d399', fontSize: 13, fontWeight: 700 }}>₹{sw.netEarnings.toLocaleString()}</span></td>
                         </tr>
                      )) : (
                         <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No recent shows data found.</td></tr>
                      )}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Payout History Ledger */}
            <div className="to-glass-panel">
              <div className="to-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#34d399' }}>{Ic.rupee}</span>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Settlement Ledger (Payouts from Admin)</h3>
                </div>
                <button className="to-btn-primary" style={{ padding: '6px 14px', fontSize: 13, minHeight: 32 }}>Export CSV</button>
              </div>

              {payoutLoading ? (
                 <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>⏳ Loading payouts...</div>
              ) : ownerPayouts.length === 0 ? (
                 <div className="to-empty" style={{ padding: 40 }}>
                   <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 13 }}>No payouts recorded yet.</p>
                 </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="to-table">
                    <thead>
                      <tr>
                        {['Settlement Date', 'Ledger ID', 'Transferred Amount', 'Status', 'Reference ID'].map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ownerPayouts.map(p => (
                        <tr key={p._id || p.id}>
                          <td><span style={{ color: 'rgba(241,245,249,0.6)', fontSize: 13 }}>{(p.payoutDate || p.createdAt)?.split('T')[0]}</span></td>
                          <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#60a5fa' }}>{(p._id || p.id).slice(-10).toUpperCase()}</span></td>
                          <td><span style={{ color: '#34d399', fontSize: 14, fontWeight: 800 }}>₹{p.amountPaid || p.amount}</span></td>
                          <td>
                            <span className={`to-pill ${p.status === 'completed' ? 'to-pill-confirmed' : p.status === 'failed' ? 'to-pill-cancelled' : 'to-pill-pending'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td><span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 12 }}>{p.transactionId || p.transactionReference || 'N/A'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shows Tab */}
        {tab === 'shows' && (
          <div className="space-y-6" style={{ animation: 'slideIn 0.5s ease both' }}>
            {!myTheatre ? (
              <div className="to-glass-panel text-center" style={{ padding: '60px 24px' }}>
                <div className="to-empty-icon">🏛️</div>
                <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 20, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>No Theatre Yet</h3>
                <p style={{ color: 'rgba(241,245,249,0.4)', fontSize: 14, marginBottom: 16 }}>Get your theatre listed first</p>
                <button onClick={() => setTab('approval')} className="to-btn-primary">Request Listing →</button>
              </div>
            ) : (
              <>
                <div className="to-glass-panel">
                  <div className="flex flex-wrap gap-3 items-center" style={{ padding: '16px 20px' }}>
                    <div className="flex items-center gap-2" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 14, padding: '8px 14px' }}>
                      <span style={{ color: 'rgba(168,85,247,0.6)' }}>{Ic.clock}</span>
                      <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(241,245,249,0.8)', fontSize: 13, outline: 'none' }} />
                    </div>
                    <select value={movieFilter} onChange={e => setMovieFilter(e.target.value)} className="to-input" style={{ width: 'auto', padding: '8px 14px' }}>
                      <option value="">All Movies</option>
                      {movies.filter(m => m.isNowShowing).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                    {(dateFilter || movieFilter) && <button onClick={() => { setDateFilter(''); setMovieFilter(''); }} className="to-btn-ghost">✕ Clear</button>}
                    <div className="ml-auto"><span style={{ color: 'rgba(241,245,249,0.35)', fontSize: 13 }}>{filteredShows.length} shows</span></div>
                  </div>
                </div>
                {showsByScreen.map(({ screen, shows }: { screen: any; shows: any[] }) => (
                  <div key={screen.id} className="to-glass-panel">
                    <div className="to-panel-header" style={{ background: 'rgba(99,102,241,0.03)' }}>
                      <div className="to-screen-header">
                        <div className="to-screen-icon">{Ic.screen}</div>
                        <div>
                          <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>{screen.name}</h3>
                          <p style={{ color: 'rgba(241,245,249,0.3)', fontSize: 11 }}>{screen.rows} rows × {screen.cols} cols · {screen.seats.length} seats</p>
                        </div>
                      </div>
                      <button onClick={() => openAddShow(screen.id)} className="to-btn-primary">{Ic.plus} Add Show</button>
                    </div>
                    {shows.length === 0 ? (
                      <div className="to-empty" style={{ padding: 40 }}>
                        <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 13, marginBottom: 12 }}>No shows for this screen</p>
                        <button onClick={() => openAddShow(screen.id)} style={{ fontSize: 12, fontWeight: 700, color: '#c084fc', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add first show →</button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="to-table">
                          <thead><tr>
                            <th style={{ width: 100 }}>Time</th><th>Date</th><th>Movie</th>
                            <th>Language</th><th>Format</th><th>Seats</th><th>Prices</th><th>Sales & Net</th><th>Status</th><th>Action</th>
                          </tr></thead>
                          <tbody>
                            {shows.map((s: any) => {
                              const mov = movies.find(m => m.id === s.movieId || (m as any)._id === s.movieId);
                              const movieTitle = mov?.title || (s as any)._movieTitle || '';
                              const moviePoster = mov?.poster || (s as any)._moviePoster || '';
                              const fillPct = s.totalSeats > 0 ? ((s.totalSeats - s.availableSeats) / s.totalSeats) * 100 : 0;
                              const isToday = s.date === today;
                              const ls = getLangStyle(s.language);
                              const fs = getFormatStyle(s.format);
                              const sBkings = myBookings.filter(b => b.status === 'confirmed' && b.showDate === s.date && b.showTime === s.time);
                              const sSales = sBkings.reduce((sum, b) => sum + (b.finalAmount || b.totalAmount || 0), 0);
                              const sNet = sSales * 0.95; // Rough estimate if not populated from backend
                              
                              return (
                                <tr key={s.id} style={s.isEnded ? { opacity: 0.45 } : {}}>
                                  <td><span className={`to-time-chip ${isToday && !s.isEnded ? 'to-time-live' : 'to-time-normal'}`}>{s.time}</span></td>
                                  <td style={{ fontSize: 12 }}>
                                    {s.date === today ? <span style={{ color: '#34d399', fontWeight: 700 }}>Today</span> : <span style={{ color: 'rgba(241,245,249,0.4)' }}>{s.date}</span>}
                                  </td>
                                  <td>
                                    {(mov || movieTitle) ? (
                                      <div className="flex items-center gap-2">
                                        {moviePoster && <img src={moviePoster} alt="" style={{ width: 28, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                                        <div>
                                          <p style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 700, maxWidth: 120 }} className="truncate">{movieTitle}</p>
                                          {mov?.rating !== undefined && <div className="flex items-center gap-0.5" style={{ marginTop: 2 }}>{Ic.star}<span style={{ color: 'rgba(241,245,249,0.3)', fontSize: 10 }}>{mov.rating}</span></div>}
                                        </div>
                                      </div>
                                    ) : <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.25)', fontStyle: 'italic' }}>Not assigned</span>}
                                  </td>
                                  <td><span className="to-pill" style={{ background: ls.bg, border: `1px solid ${ls.border}`, color: ls.text }}>{s.language}</span></td>
                                  <td><span className="to-pill" style={{ background: fs.bg, border: `1px solid ${fs.border}`, color: fs.text }}>{s.format}</span></td>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      <div className="to-progress"><div className={`to-progress-fill ${fillPct > 80 ? 'fill-danger' : fillPct > 50 ? 'fill-warn' : 'fill-good'}`} style={{ width: `${fillPct}%` }} /></div>
                                      <span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 12, whiteSpace: 'nowrap' }}>{s.availableSeats}/{s.totalSeats}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <span style={{ color: 'rgba(241,245,249,0.3)', fontSize: 10 }}>N:₹{s.priceOverride?.normal ?? 120} S:₹{s.priceOverride?.silver ?? 180}</span>
                                      <span style={{ color: 'rgba(241,245,249,0.3)', fontSize: 10 }}>G:₹{s.priceOverride?.gold ?? 250} P:₹{s.priceOverride?.premium ?? 350}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{ color: '#00e5a0', fontWeight: 'bold', fontSize: 12 }}>₹{sSales}</div>
                                    <div style={{ fontSize: '10px', color: '#f5c518' }}>Net: ₹{Math.round(sNet)}</div>
                                  </td>
                                  <td>
                                    <span className={`to-pill ${s.isEnded ? 'to-pill-ended' : isToday ? 'to-pill-live stat-running' : 'to-pill-scheduled stat-upcoming'}`} style={{ border: '1px solid' }}>
                                      {s.isEnded ? 'Ended' : isToday ? '● Live' : 'Scheduled'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-1.5">
                                      {!s.isEnded && (
                                        <>
                                          <button onClick={() => openEditShow(s)} className="to-btn-ghost">{Ic.edit} Edit</button>
                                          <button onClick={() => setLockShow(s)} className="to-btn-warn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Lock
                                          </button>
                                          <button onClick={() => setCancelShowId(s.id)} className="to-btn-danger">{Ic.cancel} Cancel</button>
                                        </>
                                      )}
                                      {s.isEnded && <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.2)', fontStyle: 'italic' }}>Ended</span>}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}


        {tab === 'tickets' && (
          <div className="space-y-6" style={{ animation: 'slideIn 0.5s ease both' }}>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Bookings', numVal: myBookings.length, kpi: 'kpi-indigo', ico: 'icon-indigo', icon: Ic.tickets, spark: [60, 70, 55, 80, 65, 90, 75], accent: '#818cf8' },
                { label: 'Confirmed', numVal: confirmedCount, kpi: 'kpi-emerald', ico: 'icon-emerald', icon: Ic.check, spark: [30, 55, 70, 45, 80, 65, 90], accent: '#34d399' },
                { label: 'Cancelled', numVal: cancelledCount, kpi: 'kpi-pink', ico: 'icon-pink', icon: Ic.cancel, spark: [20, 40, 30, 55, 35, 45, 30], accent: '#f472b6' },
              ].map((s, i) => (
                <div key={i} className={`to-kpi-card ${s.kpi}`} style={{ animation: `kpiEntry 0.5s ease both`, animationDelay: `${i * 0.1}s`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)`, opacity: 0.7 }} />
                  <div className={`to-kpi-icon ${s.ico}`} style={{ width: 42, height: 42, borderRadius: 14, marginBottom: 14 }}>{s.icon}</div>
                  <p className="to-kpi-value" style={{ fontSize: '2rem', color: s.accent }}><AnimCounter value={s.numVal} /></p>
                  <p className="to-kpi-label" style={{ marginTop: 4 }}>{s.label}</p>
                  <div className="to-kpi-sparkline">{s.spark.map((h, j) => <div key={j} className="to-spark-bar" style={{ height: `${h}%`, animationDelay: `${j * 0.05}s` }} />)}</div>
                </div>
              ))}
            </div>

            {/* ── Revenue Summary Banner ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 50%, rgba(52,211,153,0.08) 100%)',
              border: '1px solid rgba(168,85,247,0.22)',
              borderRadius: 20,
              padding: '18px 24px',
              display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(168,85,247,0.07)', pointerEvents: 'none' }} />
              <div>
                <p style={{ color: 'rgba(241,245,249,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Revenue</p>
                <p style={{ color: '#34d399', fontWeight: 900, fontSize: '1.9rem', fontFamily: "'Outfit',sans-serif", lineHeight: 1.1 }}>₹<AnimCounter value={totalRevenue} /></p>
              </div>
              <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              {[
                { label: 'Avg. Ticket', val: confirmedCount > 0 ? `₹${Math.round(totalRevenue / confirmedCount)}` : '—', color: '#818cf8' },
                { label: 'Seat Yield', val: myBookings.length > 0 ? `${Math.round((confirmedCount / myBookings.length) * 100)}%` : '—', color: '#22d3ee' },
                { label: 'Pending Refund', val: `₹${myBookings.filter(b => b.status === 'cancelled').reduce((s, b) => s + (b.refundAmount ?? b.finalAmount), 0)}`, color: '#f472b6' },
              ].map(item => (
                <div key={item.label}>
                  <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ color: item.color, fontWeight: 800, fontSize: 17, fontFamily: "'Outfit',sans-serif" }}>{item.val}</p>
                </div>
              ))}
            </div>

            {/* ── Search / Filter Bar ── */}
            <div className="to-glass-panel" style={{ padding: '16px 20px' }}>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-52">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(168,85,247,0.55)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  </span>
                  <input type="text" placeholder="Search by movie title or booking ID…" value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)} className="to-input" style={{ paddingLeft: 38, borderRadius: 14 }} />
                </div>
                <div className="flex gap-2" style={{ flexShrink: 0 }}>
                  {(['all', 'confirmed', 'cancelled'] as const).map(f => (
                    <button key={f} onClick={() => setTicketFilter(f)} style={{
                      padding: '8px 18px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                      background: ticketFilter === f ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.04)',
                      color: ticketFilter === f ? '#fff' : 'rgba(241,245,249,0.45)',
                      border: ticketFilter === f ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: ticketFilter === f ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
                      cursor: 'pointer', transition: 'all 0.25s ease', textTransform: 'capitalize',
                    }}>{f}</button>
                  ))}
                </div>
                <span style={{ color: 'rgba(241,245,249,0.3)', fontSize: 12, marginLeft: 'auto' }}>{filteredTickets.length} result{filteredTickets.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* ── Ticket Cards ── */}
            {filteredTickets.length === 0 ? (
              <div className="to-glass-panel">
                <div className="to-empty" style={{ padding: 60 }}>
                  <div className="to-empty-icon" style={{ fontSize: 48 }}>🎟️</div>
                  <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 14 }}>No tickets match your filter</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredTickets.map((b, idx) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isCancelled = b.status === 'cancelled';
                  const statusColor = isConfirmed ? '#34d399' : isCancelled ? '#f472b6' : '#fbbf24';
                  const statusBg = isConfirmed ? 'rgba(52,211,153,0.10)' : isCancelled ? 'rgba(244,114,182,0.10)' : 'rgba(251,191,36,0.10)';
                  const statusBorder = isConfirmed ? 'rgba(52,211,153,0.30)' : isCancelled ? 'rgba(244,114,182,0.30)' : 'rgba(251,191,36,0.30)';
                  const statusLabel = isConfirmed ? '✔ Confirmed' : isCancelled ? '✕ Cancelled' : '⏳ Pending';
                  return (
                    <div key={b.id} style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 20,
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      animation: 'kpiEntry 0.45s ease both',
                      animationDelay: `${idx * 0.04}s`,
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(99,102,241,0.18)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                    >
                      <div style={{ height: 2, background: `linear-gradient(90deg,${statusColor}55,${statusColor},${statusColor}55)` }} />
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>

                        {/* LEFT – Movie + ID */}
                        <div style={{ flex: '1 1 220px', padding: '18px 22px', borderRight: '1px dashed rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(241,245,249,0.35)', letterSpacing: '0.05em' }}>BKG-{b.id.slice(0, 10).toUpperCase()}</span>
                          </div>
                          <p style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15, fontFamily: "'Outfit',sans-serif", lineHeight: 1.2 }}>{b.movieTitle}</p>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                            <span style={{ fontSize: 11, color: 'rgba(241,245,249,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                              {b.showDate}
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(241,245,249,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                              {b.showTime}
                            </span>
                          </div>
                        </div>

                        {/* MIDDLE – Seats */}
                        <div style={{ flex: '1 1 180px', padding: '18px 22px', borderRight: '1px dashed rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                          <p style={{ color: 'rgba(241,245,249,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seats</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {b.seats.map((s: string) => (
                              <span key={s} style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', padding: '3px 8px', borderRadius: 6 }}>{s}</span>
                            ))}
                          </div>
                          <p style={{ color: 'rgba(241,245,249,0.25)', fontSize: 10 }}>{b.seats.length} seat{b.seats.length !== 1 ? 's' : ''}</p>
                        </div>

                        {/* RIGHT – Amount + Status */}
                        <div style={{ flex: '0 1 200px', padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                          <div>
                            <p style={{ color: 'rgba(241,245,249,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Amount</p>
                            <p style={{ color: '#34d399', fontWeight: 900, fontSize: 22, fontFamily: "'Outfit',sans-serif", lineHeight: 1.1 }}>₹{b.finalAmount}</p>
                            {b.discount > 0 && (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                                <span style={{ color: 'rgba(241,245,249,0.25)', fontSize: 10, textDecoration: 'line-through' }}>₹{b.totalAmount}</span>
                                <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700, background: 'rgba(52,211,153,0.1)', padding: '1px 6px', borderRadius: 100 }}>-{Math.round(b.discount / (b.totalAmount || 1) * 100)}%</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 11, height: 11, color: 'rgba(241,245,249,0.3)' }}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                              <span style={{ color: 'rgba(241,245,249,0.35)', fontSize: 10 }}>{b.paymentMethod || 'Online'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800, background: statusBg, border: `1px solid ${statusBorder}`, color: statusColor, letterSpacing: '0.04em' }}>{statusLabel}</span>
                            {isCancelled && b.cancelledAt && (
                              <p style={{ color: 'rgba(241,245,249,0.25)', fontSize: 10 }}>Refund: ₹{b.refundAmount ?? b.finalAmount}</p>
                            )}
                            {isConfirmed && (
                              <button onClick={() => setCancelTicketId(b.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.25)', color: '#f472b6', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,114,182,0.18)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,114,182,0.08)'; }}
                              >{Ic.cancel} Cancel Ticket</button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ SCANNER ════════════════════ */}
        {tab === 'scanner' && (
          <div style={{ animation: 'slideIn 0.5s ease both' }}>
            <div className="to-glass-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg,#22d3ee,#6366f1,#a855f7)', boxShadow: '0 0 14px rgba(34,211,238,0.5)' }} />
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 16, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>{Ic.scanner}</div>
                <div>
                  <p style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15, fontFamily: "'Outfit',sans-serif" }}>Ticket Scanner</p>
                  <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 12 }}>Scan QR codes to validate entry at the gate</p>
                </div>
              </div>
            </div>
            <TicketScanner bookings={myBookings} theatreId={myTheatre?.id} onCancelTicket={id => cancelBooking(id, 'theatre_owner')} />
          </div>
        )}

        {/* ════════════════════ SEAT MANAGER ════════════════════ */}
        {tab === 'seats' && (
          <div className="space-y-5" style={{ animation: 'slideIn 0.5s ease both' }}>
            {!myTheatre ? (
              <div className="to-glass-panel text-center" style={{ padding: '60px 24px' }}>
                <div className="to-empty-icon">🏛️</div>
                <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 13 }}>No theatre yet</p>
              </div>
            ) : (
              myTheatre.screens.map((sc: any) => {
                const filteredSeats = sc.seats.filter((s: any) => {
                  if (seatSearch && !s.id.toLowerCase().includes(seatSearch.toLowerCase())) return false;
                  if (blockedFilter === 'available' && (s.isBooked || s.isBlocked)) return false;
                  if (blockedFilter === 'booked' && !s.isBooked) return false;
                  if (blockedFilter === 'blocked' && !s.isBlocked) return false;
                  return true;
                });
                const blockedInScreen = sc.seats.filter((s: any) => s.isBlocked);
                return (
                  <div key={sc.id} className="to-glass-panel overflow-hidden">
                    <div className="to-panel-header" style={{ background: 'rgba(168,85,247,0.03)' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 38, height: 38, borderRadius: 14, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>{Ic.seat}</div>
                        <div>
                          <h3 style={{ color: '#f1f5f9', fontWeight: 800 }}>{sc.name}</h3>
                          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                            <span style={{ color: '#fb923c', fontSize: 11 }}>{sc.seats.filter((s: any) => s.isBlocked).length} blocked</span>
                            <span style={{ color: 'rgba(241,245,249,0.25)', fontSize: 11 }}>·</span>
                            <span style={{ color: '#f87171', fontSize: 11 }}>{sc.seats.filter((s: any) => s.isBooked).length} booked</span>
                            <span style={{ color: 'rgba(241,245,249,0.25)', fontSize: 11 }}>·</span>
                            <span style={{ color: '#34d399', fontSize: 11 }}>{sc.seats.filter((s: any) => !s.isBooked && !s.isBlocked).length} available</span>
                          </div>
                        </div>
                      </div>
                      {blockedInScreen.length > 0 && (
                        <button onClick={() => { const u = { ...myTheatre, screens: myTheatre.screens.map((s: any) => s.id !== sc.id ? s : { ...s, seats: s.seats.map((seat: any) => ({ ...seat, isBlocked: false, blockedReason: undefined })) }) }; updateTheatre(u); }} className="to-btn-warn">
                          Unblock all ({blockedInScreen.length})
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input type="text" placeholder="Search seat…" value={seatSearch} onChange={e => setSeatSearch(e.target.value)} className="to-input" style={{ width: 130, padding: '7px 12px', fontSize: 12 }} />
                      <div className="flex gap-1.5">
                        {(['all', 'available', 'booked', 'blocked'] as const).map(f => (
                          <button key={f} onClick={() => setBlockedFilter(f)}
                            className={`text-xs px-3 py-1.5 rounded-full font-bold capitalize transition-all ${blockedFilter === f ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'to-btn-ghost'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {filteredSeats.map((seat: any) => (
                          <button key={seat.id}
                            onClick={() => { if (seat.isBlocked) { handleUnblockSeat(sc.id, seat.id); } else if (!seat.isBooked) { setBlockModal({ seatId: seat.id, category: seat.category }); setBlockReason(''); } }}
                            title={seat.isBlocked ? `Unblock: ${seat.blockedReason}` : seat.isBooked ? 'Booked' : `Block ${seat.id}`}
                            style={{
                              width: 34, height: 28, borderRadius: 6, fontSize: 9, fontWeight: 700, transition: 'all 0.2s ease',
                              background: seat.isBlocked ? 'rgba(251,146,60,0.22)' : seat.isBooked ? 'rgba(107,114,128,0.2)' : 'rgba(99,102,241,0.07)',
                              border: seat.isBlocked ? '1px solid rgba(251,146,60,0.5)' : seat.isBooked ? '1px solid rgba(107,114,128,0.2)' : '1px solid rgba(99,102,241,0.2)',
                              color: seat.isBlocked ? '#fb923c' : seat.isBooked ? '#6b7280' : 'rgba(241,245,249,0.45)',
                              cursor: seat.isBooked ? 'not-allowed' : 'pointer',
                            }}>{seat.isBlocked ? '🚫' : seat.isBooked ? '×' : seat.id}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: 'rgba(241,245,249,0.35)' }}>
                        {[{ c: 'rgba(99,102,241,0.12)', b: 'rgba(99,102,241,0.28)', l: 'Available' }, { c: 'rgba(107,114,128,0.2)', b: 'rgba(107,114,128,0.2)', l: 'Booked' }, { c: 'rgba(251,146,60,0.22)', b: 'rgba(251,146,60,0.5)', l: 'Blocked' }].map(leg => (
                          <span key={leg.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 14, height: 14, borderRadius: 4, background: leg.c, border: `1px solid ${leg.b}`, display: 'inline-block' }} />
                            {leg.l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ════════════════════ THEATRE INFO ════════════════════ */}
        {tab === 'theatre' && (
          <div className="max-w-2xl space-y-5" style={{ animation: 'slideIn 0.5s ease both' }}>
            {myTheatre ? (
              <div className="to-glass-panel overflow-hidden">
                <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)', boxShadow: '0 0 14px rgba(168,85,247,0.5)' }} />
                {myTheatre.image && (
                  <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                    <img src={myTheatre.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,2,15,0.85), transparent)' }} />
                  </div>
                )}
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 22, fontFamily: "'Outfit',sans-serif" }}>{myTheatre.name}</h2>
                      <p style={{ color: 'rgba(241,245,249,0.4)', fontSize: 13, marginTop: 6 }}>📍 {myTheatre.location}, {myTheatre.city}</p>
                    </div>
                    <span className="stat-running" style={{ border: '1px solid', borderRadius: 100, padding: '6px 14px', fontSize: 11, fontWeight: 800 }}>✔ Approved</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Type', value: myTheatre.type },
                      { label: 'Active Shows', value: allShows.filter((s: any) => !s.isEnded).length },
                      { label: 'Total Screens', value: myTheatre.screens.length },
                      { label: 'Total Seats', value: myTheatre.screens.reduce((a: number, sc: any) => a + sc.seats.length, 0) },
                    ].map(info => (
                      <div key={info.label} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 14, padding: '14px 16px' }}>
                        <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>{info.label}</p>
                        <p style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 20, fontFamily: "'Outfit',sans-serif" }}>{info.value}</p>
                      </div>
                    ))}
                  </div>
                  {myTheatre.amenities.length > 0 && (
                    <div>
                      <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 10 }}>Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {myTheatre.amenities.map((a: string) => (
                          <span key={a} style={{ fontSize: 12, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc', padding: '5px 12px', borderRadius: 100, fontWeight: 600 }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 10 }}>Screens</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {myTheatre.screens.map((sc: any, i: number) => (
                        <div key={sc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(168,85,247,0.1)', borderRadius: 14, padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: `rgba(${i % 2 === 0 ? '99,102,241' : '168,85,247'},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i % 2 === 0 ? '#818cf8' : '#c084fc', fontSize: 13, fontWeight: 800 }}>{i + 1}</div>
                            <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{sc.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(241,245,249,0.35)', fontSize: 12 }}>
                            <span>{sc.rows}×{sc.cols}</span>
                            <span className="stat-upcoming" style={{ border: '1px solid', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontWeight: 700 }}>{sc.seats.length} seats</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="to-glass-panel text-center" style={{ padding: '60px 24px' }}>
                <div className="to-empty-icon">🏛️</div>
                <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>No Theatre Listed</h3>
                <p style={{ color: 'rgba(241,245,249,0.4)', fontSize: 14, marginBottom: 16 }}>Submit an approval request to get your theatre listed</p>
                <button onClick={() => setTab('approval')} className="to-btn-primary">Request Listing →</button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ SEAT VIEW MANAGEMENT ════════════════════ */}
        {tab === 'seatview' && (
          <div style={{ animation: 'slideIn 0.5s ease both', maxWidth: 720 }}>
            {!myTheatre ? (
              <div className="to-glass-panel text-center" style={{ padding: '60px 24px' }}>
                <div className="to-empty-icon">🏛️</div>
                <p style={{ color: 'rgba(241,245,249,0.4)', fontSize: 14, marginBottom: 16 }}>Get your theatre listed first</p>
                <button onClick={() => setTab('approval')} className="to-btn-primary">Request Listing →</button>
              </div>
            ) : (
              <SeatViewManager
                theatreId={(myTheatre as any)._id || myTheatre.id}
                theatreName={myTheatre.name}
                rows={myTheatre.screens[0]?.rows ?? 10}
                initial={dbSeatViewData ?? undefined}
                onSave={async (data: TheatreViewData) => {
                  // Save to MongoDB permanently
                  const tid = (myTheatre as any)._id || myTheatre.id;
                  try {
                    const res = await apiSaveTheatreSeatView(tid, {
                      view2DImage: data.view2DImage,
                      panoramaImage: data.panoramaImage,
                      uploadedImages: data.uploadedImages,
                      seatViewMapping: data.seatViewMapping,
                    });
                    if (res.ok && res.data?.seatViewData) {
                      setDbSeatViewData(res.data.seatViewData);
                    }
                  } catch { /* fallback to localStorage */ }
                  // Also keep localStorage as offline fallback
                  try { localStorage.setItem(`cc_view_${tid}`, JSON.stringify(data)); } catch { }
                }}
              />
            )}
          </div>
        )}


        {/* ════════════════════ APPROVAL ════════════════════ */}

        {tab === 'approval' && !myTheatre && (
          <div className="max-w-2xl mx-auto">
            {myRequest ? (
              <div style={{
                background: 'rgba(7,2,20,0.6)', backdropFilter: 'blur(24px)',
                border: '1px solid ' + (myRequest.status === 'pending' ? 'rgba(245,158,11,0.35)' : myRequest.status === 'approved' ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'),
                borderRadius: 24, overflow: 'hidden',
              }}>
                <div style={{ height: 3, background: myRequest.status === 'pending' ? 'linear-gradient(90deg,#f59e0b,#fb923c)' : myRequest.status === 'approved' ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#f87171,#ef4444)' }} />
                <div style={{ padding: '40px 32px', textAlign: 'center' }}>
                  <div style={{
                    width: 92, height: 92, borderRadius: '50%', margin: '0 auto 20px',
                    background: myRequest.status === 'pending' ? 'rgba(245,158,11,0.08)' : myRequest.status === 'approved' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                    border: '2px solid ' + (myRequest.status === 'pending' ? 'rgba(245,158,11,0.35)' : myRequest.status === 'approved' ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                    animation: 'fabPulse 2.5s ease-in-out infinite',
                  }}>
                    {myRequest.status === 'pending' ? '⏳' : myRequest.status === 'approved' ? '✅' : '❌'}
                  </div>
                  <h3 style={{
                    fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 26,
                    color: myRequest.status === 'pending' ? '#f59e0b' : myRequest.status === 'approved' ? '#34d399' : '#f87171',
                    marginBottom: 10,
                  }}>
                    {myRequest.status === 'pending' ? 'Under Review' : myRequest.status === 'approved' ? 'Approved! 🎉' : 'Rejected'}
                  </h3>
                  <p style={{ color: 'rgba(241,245,249,0.45)', fontSize: 14, lineHeight: 1.7, maxWidth: 380, margin: '0 auto 24px' }}>
                    {myRequest.status === 'pending' ? "Your request is being reviewed by our admin team. You'll be notified within 24–48 hours." :
                      myRequest.status === 'approved' ? 'Your theatre has been listed successfully! You can now manage shows.' :
                        'Your request was rejected. Please contact support for details.'}
                  </p>
                  {myRequest.adminNote && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 18px', fontSize: 13, color: 'rgba(241,245,249,0.5)', fontStyle: 'italic', marginBottom: 24 }}>
                      "{myRequest.adminNote}"
                    </div>
                  )}
                  <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 16, padding: '18px 20px', textAlign: 'left' }}>
                    <p style={{ color: 'rgba(241,245,249,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 14 }}>Request Details</p>
                    {[
                      ['🏛️ Theatre', myRequest.theatreData.name],
                      ['📍 Location', myRequest.theatreData.location],
                      ['🏙️ City', myRequest.theatreData.city],
                      ['🎭 Type', myRequest.theatreData.type],
                      ['📅 Submitted', myRequest.submittedAt],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 12 }}>{k}</span>
                        <span style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : approvalSubmitted ? (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 24, padding: '48px 32px', textAlign: 'center', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#f59e0b,#fb923c)' }} />
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px', animation: 'fabPulse 2s ease-in-out infinite' }}>⏳</div>
                <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 24, color: '#f59e0b', marginBottom: 10 }}>Request Submitted!</h3>
                <p style={{ color: 'rgba(241,245,249,0.45)', fontSize: 14 }}>Our admin team will review your request within 24–48 hours.</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(7,2,20,0.55)', backdropFilter: 'blur(28px)', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 0 60px rgba(99,102,241,0.08), 0 24px 80px rgba(0,0,0,0.5)' }}>
                {/* Rainbow top bar */}
                <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#f59e0b)', boxShadow: '0 0 20px rgba(168,85,247,0.6)' }} />

                {/* Header */}
                <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,102,241,0.04)', display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 18, background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(168,85,247,0.18))', border: '1px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>🏛️</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 22, color: '#f1f5f9', marginBottom: 4, letterSpacing: '-0.3px' }}>List Your Theatre</h2>
                    <p style={{ color: 'rgba(241,245,249,0.4)', fontSize: 13 }}>Fill in the details below. Admin will review and approve within 24–48 hrs.</p>
                  </div>
                  <div style={{ padding: '6px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 100, fontSize: 11, color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>✦ FREE LISTING</div>
                </div>

                <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Text inputs */}
                  {([
                    { label: 'Theatre Name', key: 'name', placeholder: 'e.g. Galaxy Multiplex', icon: '🏛️' },
                    { label: 'Location / Area', key: 'location', placeholder: 'e.g. Main Street, Andheri West', icon: '📍' },
                    { label: 'City', key: 'city', placeholder: 'e.g. Mumbai', icon: '🏙️' },
                  ] as { label: string; key: string; placeholder: string; icon: string }[]).map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>
                        {f.label} <span style={{ color: '#a855f7' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', zIndex: 1 }}>{f.icon}</span>
                        <input
                          type="text"
                          placeholder={f.placeholder}
                          value={(approvalForm as any)[f.key]}
                          onChange={e => setApprovalForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 13, paddingBottom: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 14, color: 'rgba(241,245,249,0.9)', fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' as const, transition: 'all 0.25s' }}
                          onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; e.target.style.background = 'rgba(168,85,247,0.05)'; }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(168,85,247,0.15)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Theatre Type + Rows + Cols */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Theatre Type</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={approvalForm.type}
                          onChange={e => setApprovalForm(p => ({ ...p, type: e.target.value as any }))}
                          style={{ width: '100%', padding: '13px 38px 13px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 14, color: 'rgba(241,245,249,0.9)', fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none', cursor: 'pointer', appearance: 'none' as any, boxSizing: 'border-box' as const }}
                          onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(168,85,247,0.15)'; e.target.style.boxShadow = 'none'; }}
                        >
                          {['Standard', 'IMAX', 'PVR', '4DX'].map(t => <option key={t} value={t} style={{ background: '#0a0015' }}>{t}</option>)}
                        </select>
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(241,245,249,0.3)', pointerEvents: 'none', fontSize: 12 }}>▼</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Screen Rows</label>
                      <input type="number" min={5} max={26} value={approvalForm.rows}
                        onChange={e => setApprovalForm(p => ({ ...p, rows: +e.target.value }))}
                        style={{ width: '100%', padding: '13px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 14, color: 'rgba(241,245,249,0.9)', fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' as const, textAlign: 'center' as const, transition: 'all 0.25s' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(168,85,247,0.15)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Seats / Row</label>
                      <input type="number" min={5} max={30} value={approvalForm.cols}
                        onChange={e => setApprovalForm(p => ({ ...p, cols: +e.target.value }))}
                        style={{ width: '100%', padding: '13px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 14, color: 'rgba(241,245,249,0.9)', fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' as const, textAlign: 'center' as const, transition: 'all 0.25s' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(168,85,247,0.15)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {/* Seat capacity preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💺</div>
                    <div>
                      <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Total Capacity</p>
                      <p style={{ color: '#818cf8', fontWeight: 900, fontSize: 22, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
                        {approvalForm.rows * approvalForm.cols} <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(241,245,249,0.35)' }}>seats</span>
                      </p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['Normal', 'Silver', 'Gold', 'Premium'].map(c => (
                        <span key={c} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 100, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)', color: '#c084fc', fontWeight: 600 }}>{c}</span>
                      ))}
                    </div>
                  </div>

                  {/* Image upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Theatre Image <span style={{ color: 'rgba(241,245,249,0.2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <div
                      onClick={() => imageRef.current?.click()}
                      style={{ border: '2px dashed rgba(168,85,247,0.25)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s', background: 'rgba(168,85,247,0.03)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.55)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(168,85,247,0.07)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.25)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(168,85,247,0.03)'; }}
                    >
                      {approvalForm.image ? (
                        <div style={{ position: 'relative' }}>
                          <img src={approvalForm.image} alt="" style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(7,2,20,0.75) 0%,transparent 55%)', display: 'flex', alignItems: 'flex-end', padding: 16 }}>
                            <span style={{ fontSize: 11, color: 'rgba(241,245,249,0.85)', background: 'rgba(0,0,0,0.55)', padding: '4px 14px', borderRadius: 100, backdropFilter: 'blur(8px)' }}>🔄 Click to change</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>🖼️</div>
                          <p style={{ color: 'rgba(241,245,249,0.65)', fontSize: 14, fontWeight: 600, marginBottom: 5 }}>Drag & drop or click to upload</p>
                          <p style={{ color: 'rgba(241,245,249,0.25)', fontSize: 12 }}>PNG, JPG, WEBP · Max 10 MB · Recommended 1280×720</p>
                        </div>
                      )}
                    </div>
                    <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleApprovalImage} />
                  </div>

                  {/* Trust badges */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {([
                      { icon: '🔒', text: 'Secure submission' },
                      { icon: '⚡', text: '24–48h review' },
                      { icon: '✅', text: 'Free to list' },
                      { icon: '📞', text: 'Dedicated support' },
                    ] as { icon: string; text: string }[]).map(b => (
                      <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.13)', borderRadius: 100, fontSize: 11, color: 'rgba(241,245,249,0.45)', fontWeight: 600 }}>
                        <span>{b.icon}</span>{b.text}
                      </div>
                    ))}
                  </div>

                  {/* Submit CTA */}
                  <button
                    onClick={handleSubmitApproval}
                    style={{ width: '100%', padding: '17px', background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#ec4899 100%)', border: 'none', borderRadius: 16, color: 'white', fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 800, cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 6px 0 rgba(60,20,100,0.55), 0 0 40px rgba(168,85,247,0.35)', transition: 'all 0.3s ease', letterSpacing: '0.3px' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px) scale(1.01)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 0 rgba(60,20,100,0.55), 0 0 60px rgba(168,85,247,0.55)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 0 rgba(60,20,100,0.55), 0 0 40px rgba(168,85,247,0.35)'; }}
                    onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px) scale(0.99)'; }}
                    onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px) scale(1.01)'; }}
                  >
                    <span style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)', transform: 'skewX(-22deg)', animation: 'shimmer 2.5s ease-in-out infinite', pointerEvents: 'none' }} />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.1),transparent)', borderRadius: '16px 16px 0 0', pointerEvents: 'none' }} />
                    🚀  Submit for Approval
                  </button>

                </div>
              </div>
            )}
          </div>
        )}

        {/* MEDIA MANAGER */}
        {tab === 'media' && myTheatre && (
          <div style={{ animation: 'slideIn 0.4s ease both' }}>
            <TheatreMediaManager theatreId={(myTheatre as any)._id || myTheatre.id} />
          </div>
        )}

        {/* 3D BUILDER */}
        {tab === '3dsetup' && myTheatre && (
          <div style={{ animation: 'slideIn 0.4s ease both' }}>
            <Theatre3DBuilder theatreId={(myTheatre as any)._id || myTheatre.id} />
          </div>
        )}

      </div>

      {/* ════════════ ADD / EDIT SHOW MODAL ════════════ */}
      {addShowModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md" onClick={() => setAddShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div style={{
              width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto',
              background: 'linear-gradient(160deg,#0d0d22 0%,#111128 60%,#0a0a1e 100%)',
              border: '1px solid rgba(168,85,247,0.25)', borderRadius: 24,
              boxShadow: '0 32px 80px rgba(0,0,0,0.9),0 0 60px rgba(99,102,241,0.08)',
              fontFamily: "'Outfit',sans-serif",
              animation: 'kpiEntry 0.35s cubic-bezier(0.34,1.3,0.64,1) both',
            }}>
              {/* Gradient top bar */}
              <div style={{ height: 3, borderRadius: '24px 24px 0 0', background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#6366f1)' }} />

              {/* Header */}
              <div style={{ padding: '22px 28px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(168,85,247,0.2))', border: '1px solid rgba(168,85,247,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>🎬</div>
                  <div>
                    <h3 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 18, margin: 0 }}>{editShow ? '✏️ Edit Show' : '🎬 Create New Show'}</h3>
                    <p style={{ color: 'rgba(168,85,247,0.7)', fontSize: 12, margin: 0, fontWeight: 600, marginTop: 2 }}>
                      {myTheatre?.screens.find((s: any) => s.id === showForm.screenId)?.name ?? 'Configure your show details'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setAddShowModal(false)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              {/* Progress strip */}
              <div style={{ display: 'flex', gap: 4, padding: '14px 28px 0' }}>
                {[
                  { label: 'Screen', done: !!showForm.screenId && !!showForm.date },
                  { label: 'Time', done: !!(showForm.time || showForm.customTime) },
                  { label: 'Lang', done: !!showForm.language },
                  { label: 'Movie', done: true },
                  { label: 'Seats', done: showForm.totalSeats > 0 },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', height: 3, borderRadius: 3, background: s.done ? 'linear-gradient(90deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.08)', boxShadow: s.done ? '0 0 6px rgba(168,85,247,0.5)' : 'none' }} />
                    <span style={{ fontSize: 9, color: s.done ? '#a78bfa' : '#475569', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '18px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Section 1: Screen & Date */}
                <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 12 }}>🖥</span>
                    <span style={{ color: '#818cf8', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 1 — Screen &amp; Date</span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Screen *</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {myTheatre?.screens.map((sc: any) => (
                        <button key={sc.id} onClick={() => setShowForm(f => ({ ...f, screenId: sc.id }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: `1px solid ${showForm.screenId === sc.id ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`, background: showForm.screenId === sc.id ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)', color: showForm.screenId === sc.id ? '#818cf8' : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: showForm.screenId === sc.id ? '0 0 14px rgba(99,102,241,0.25)' : 'none', fontFamily: "'Outfit',sans-serif" }}>
                          <span style={{ color: showForm.screenId === sc.id ? '#818cf8' : '#475569' }}>{Ic.screen}</span>
                          <div><div style={{ fontSize: 13 }}>{sc.name}</div><div style={{ fontSize: 10, color: '#475569' }}>{sc.seats.length} seats</div></div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Show Date *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>📅</span>
                      <input type="date" value={showForm.date} min={today}
                        onChange={e => setShowForm(f => ({ ...f, date: e.target.value }))}
                        style={{ width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 11, paddingBottom: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Show Time */}
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 12 }}>⏰</span>
                    <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 2 — Show Time</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                    {PRESET_TIMES.map(t => (
                      <button key={t} onClick={() => setShowForm(f => ({ ...f, time: t, customTime: t }))}
                        style={{ padding: '8px 14px', borderRadius: 100, border: `1px solid ${showForm.time === t ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.08)'}`, background: showForm.time === t ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)', color: showForm.time === t ? '#60a5fa' : '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', boxShadow: showForm.time === t ? '0 0 12px rgba(59,130,246,0.3)' : 'none', fontFamily: "'Outfit',sans-serif" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>🕐</span>
                    <input type="text" placeholder="Or type custom time e.g. 07:45 PM" value={showForm.customTime}
                      onChange={e => setShowForm(f => ({ ...f, customTime: e.target.value, time: e.target.value }))}
                      style={{ width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, color: '#f1f5f9', fontSize: 13, outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Section 3: Language & Format */}
                <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 12 }}>🌐</span>
                    <span style={{ color: '#34d399', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 3 — Language &amp; Format</span>
                  </div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Language *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                    {SHOW_LANGUAGES.map(lang => {
                      const ls = getLangStyle(lang); const active = showForm.language === lang;
                      return (
                        <button key={lang} onClick={() => setShowForm(f => ({ ...f, language: lang }))}
                          style={{ padding: '7px 16px', borderRadius: 100, border: `1px solid ${active ? ls.border : 'rgba(255,255,255,0.07)'}`, background: active ? ls.bg : 'rgba(255,255,255,0.02)', color: active ? ls.text : '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', boxShadow: active ? `0 0 12px ${ls.bg}` : 'none', fontFamily: "'Outfit',sans-serif" }}>
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Format</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {SHOW_FORMATS.map(fmt => {
                      const fmtIcons: Record<string, string> = { '2D': '📺', '3D': '🥽', 'IMAX': '🎯', 'Dolby': '🔊', '4DX': '💫', '4K': '✨' };
                      const fs = getFormatStyle(fmt); const active = showForm.format === fmt;
                      return (
                        <button key={fmt} onClick={() => setShowForm(f => ({ ...f, format: fmt }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 100, border: `1px solid ${active ? fs.border : 'rgba(255,255,255,0.07)'}`, background: active ? fs.bg : 'rgba(255,255,255,0.02)', color: active ? fs.text : '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', boxShadow: active ? `0 0 12px ${fs.bg}` : 'none', fontFamily: "'Outfit',sans-serif" }}>
                          <span style={{ fontSize: 13 }}>{fmtIcons[fmt] ?? '🎬'}</span>{fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Movie */}
                <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.14)', borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 12 }}>🎥</span>
                    <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 4 — Movie</span>
                    <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 11 }}>Optional</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 8, maxHeight: 190, overflowY: 'auto' }}>
                    <button onClick={() => setShowForm(f => ({ ...f, movieId: '' }))}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 12, border: `1px solid ${!showForm.movieId ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.07)'}`, background: !showForm.movieId ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)', color: !showForm.movieId ? '#fbbf24' : '#475569', cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Outfit',sans-serif" }}>
                      <span style={{ fontSize: 24 }}>🚫</span>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>No Movie</span>
                    </button>
                    {movies.filter(m => m.isNowShowing).map(m => (
                      <button key={m.id} onClick={() => setShowForm(f => ({ ...f, movieId: m.id }))}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 8, borderRadius: 12, border: `1px solid ${showForm.movieId === m.id ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.07)'}`, background: showForm.movieId === m.id ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: showForm.movieId === m.id ? '0 0 14px rgba(245,158,11,0.25)' : 'none', fontFamily: "'Outfit',sans-serif" }}>
                        <img src={m.poster} alt={m.title} style={{ width: '100%', height: 68, objectFit: 'cover', borderRadius: 8 }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: showForm.movieId === m.id ? '#fbbf24' : '#64748b', textAlign: 'center', lineHeight: 1.3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 5: Seats & Pricing */}
                <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)', borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 12 }}>🪑</span>
                    <span style={{ color: '#f87171', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 5 — Seats &amp; Pricing</span>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Seats</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>🪑</span>
                      <input type="number" min={10} max={500} value={showForm.totalSeats}
                        onChange={e => setShowForm(f => ({ ...f, totalSeats: +e.target.value }))}
                        style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: "'Outfit',sans-serif" }}
                      />
                    </div>
                  </div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Seat Prices (₹)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {([
                      { label: 'Normal', key: 'priceNormal', icon: '⬜', color: '#94a3b8', glow: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.2)' },
                      { label: 'Silver', key: 'priceSilver', icon: '🔷', color: '#38bdf8', glow: 'rgba(56,189,248,0.06)', border: 'rgba(56,189,248,0.2)' },
                      { label: 'Gold', key: 'priceGold', icon: '🏅', color: '#fbbf24', glow: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)' },
                      { label: 'Premium', key: 'pricePremium', icon: '💎', color: '#c084fc', glow: 'rgba(192,132,252,0.06)', border: 'rgba(192,132,252,0.2)' },
                    ] as const).map(p => (
                      <div key={p.key} style={{ background: p.glow, border: `1px solid ${p.border}`, borderRadius: 12, padding: '12px 14px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: p.color, fontSize: 10, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          <span style={{ fontSize: 13 }}>{p.icon}</span> {p.label}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#64748b', fontSize: 16, fontWeight: 700 }}>₹</span>
                          <input type="number" min={50} value={(showForm as any)[p.key]}
                            onChange={e => setShowForm(f => ({ ...f, [p.key]: +e.target.value }))}
                            style={{ flex: 1, background: 'transparent', border: 'none', color: '#f1f5f9', fontSize: 18, fontWeight: 800, outline: 'none', fontFamily: "'Outfit',sans-serif" }}
                          />
                        </div>
                        <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 8 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, ((showForm as any)[p.key] / 1000) * 100)}%`, background: `linear-gradient(90deg,${p.color}88,${p.color})`, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                  <button onClick={() => setAddShowModal(false)}
                    style={{ flex: 1, padding: '13px 0', borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                    ✕ Cancel
                  </button>
                  <button onClick={handleSaveShow}
                    style={{ flex: 2, padding: '13px 0', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)', border: 'none', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", boxShadow: '0 6px 24px rgba(99,102,241,0.4)' }}>
                    {editShow ? '✏️ Update Show' : '🚀 Launch Show'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════ CANCEL SHOW CONFIRM ════════════ */}
      {cancelShowId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setCancelShowId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f25] border border-red-500/25 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
                {Ic.cancel}
              </div>
              <h3 className="text-white font-bold text-lg text-center mb-2">Cancel Show?</h3>
              <p className="text-gray-400 text-sm text-center mb-6">This show will be marked as cancelled. All tickets for this show should be refunded.</p>
              <div className="flex gap-3">
                <button onClick={() => setCancelShowId(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-gray-400 hover:text-white text-sm font-semibold transition-all">Keep</button>
                <button onClick={() => handleCancelShow(cancelShowId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all">Cancel Show</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════ CANCEL TICKET CONFIRM ════════════ */}
      {cancelTicketId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setCancelTicketId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f25] border border-red-500/25 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
                {Ic.tickets}
              </div>
              <h3 className="text-white font-bold text-lg text-center mb-2">Cancel Ticket?</h3>
              <p className="text-gray-400 text-sm text-center mb-2">
                Booking ID: <span className="text-white font-mono font-bold">BMS-{cancelTicketId.slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="text-gray-500 text-xs text-center mb-6">Full refund will be initiated to the customer's payment method.</p>
              <div className="flex gap-3">
                <button onClick={() => setCancelTicketId(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-gray-400 hover:text-white text-sm font-semibold transition-all">Keep</button>
                <button onClick={() => handleCancelTicket(cancelTicketId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all">Cancel & Refund</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════ SHOW SEAT LOCKER ════════════ */}
      {lockShow && myTheatre && (
        <ShowSeatLocker
          show={lockShow}
          theatre={myTheatre}
          onClose={() => setLockShow(null)}
        />
      )}

      {/* ════════════ BLOCK SEAT MODAL ════════════ */}
      {blockModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setBlockModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f25] border border-orange-500/25 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-4">
                🚫
              </div>
              <h3 className="text-white font-bold text-lg text-center mb-1">Block Seat {blockModal.seatId}</h3>
              <p className="text-gray-400 text-xs text-center mb-4 capitalize">{blockModal.category} category</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['Maintenance', 'Reserved - VIP', 'Reserved - Press', 'Damaged Seat', 'Social Distancing', 'Staff Reserved'].map(r => (
                  <button key={r} onClick={() => setBlockReason(r)}
                    className={`text-xs py-2 px-3 rounded-lg border text-left transition-all ${blockReason === r ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}>{r}</button>
                ))}
              </div>
              <input type="text" placeholder="Or type a custom reason…" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setBlockModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-gray-400 text-sm font-semibold">Cancel</button>
                <button
                  onClick={() => {
                    const sc = myTheatre?.screens.find((s: any) => s.seats.some((seat: any) => seat.id === blockModal.seatId));
                    if (sc) handleBlockSeat(sc.id, blockModal.seatId);
                  }}
                  disabled={!blockReason}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-sm font-bold transition-all">
                  Block Seat
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
