// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  apiSendNotification, apiGetNotifications,
  apiGetTheatreOwnerRequests, apiGetTheatreOwnerDetail, apiApproveTheatreOwner, apiRejectTheatreOwner,
  apiGetUsers, apiGetBookings, apiGetDashboardStats, apiUpdateUser, apiDeleteUser, apiToggleUser,
  apiAdminCancelBooking as apiCancelBooking,
  apiGetAdminPayoutSummaries, apiMarkPayoutPaid, apiGetSettings, apiUpdateSettings,
  apiGetRefunds, apiUpdateRefundStatus
} from '../services/apiService';
import AdminGameManager from '../components/admin/AdminGameManager';
import AdminSupportPanel from '../components/admin/AdminSupportPanel';

// ─── SVG ICON LIBRARY ────────────────────────────────────────────────────────
const I = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  film: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5" /></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M4 21V7l8-4 8 4v14M9 21v-4h6v4M9 9h1M14 9h1M9 13h1M14 13h1" /></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  ticket: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z" /></svg>,
  tag: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1.5" fill="currentColor" /></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" /></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  doc: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  gear: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12" /></svg>,
  upload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" /></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  chevronL: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>,
  chevronR: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,10 17,10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" /></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  trending: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" /></svg>,
  dollar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  person: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  map: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
};

type Tab = 'dashboard' | 'movies' | 'cast' | 'theatres' | 'theatre-owners' | 'payouts' | 'shows' | 'bookings' | 'refunds' | 'offers' | 'analytics' | 'users' | 'notifications' | 'reports' | 'games' | 'support' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: I.grid, color: '#00b4ff' },
  { id: 'movies', label: 'Movies', icon: I.film, color: '#f5c518' },
  { id: 'cast', label: 'Cast', icon: I.users, color: '#a855f7' },
  { id: 'theatres', label: 'Theatres', icon: I.building, color: '#00e5a0' },
  { id: 'theatre-owners', label: 'Owners', icon: I.shield, color: '#f59e0b' },
  { id: 'payouts', label: 'Payouts', icon: I.dollar, color: '#ff1450' },
  { id: 'shows', label: 'Shows', icon: I.calendar, color: '#fb923c' },
  { id: 'bookings', label: 'Bookings', icon: I.ticket, color: '#ff1450' },
  { id: 'refunds', label: 'Refunds', icon: I.wallet, color: '#f97316' },
  { id: 'offers', label: 'Offers', icon: I.tag, color: '#f5c518' },
  { id: 'analytics', label: 'Analytics', icon: I.chart, color: '#00b4ff' },
  { id: 'users', label: 'Users', icon: I.person, color: '#a855f7' },
  { id: 'notifications', label: 'Notifications', icon: I.bell, color: '#fb923c' },
  { id: 'reports', label: 'Reports', icon: I.doc, color: '#00e5a0' },
  { id: 'games', label: 'Game Hub', icon: I.star, color: '#ec4899' },
  { id: 'support', label: 'AI Support', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><circle cx="9" cy="11" r="1" fill="currentColor" /><circle cx="12" cy="11" r="1" fill="currentColor" /><circle cx="15" cy="11" r="1" fill="currentColor" /></svg>, color: '#a855f7' },
  { id: 'settings', label: 'Settings', icon: I.gear, color: '#888' },
];

const emptyMovie: Omit<Movie, 'id'> = {
  title: '', genre: [], duration: 0, language: [], releaseDate: '',
  poster: '', banner: '', trailerUrl: '',
  certificate: 'UA', description: '', rating: 0, votes: 0,
  isNowShowing: true, isTrending: false, isComingSoon: false,
  castMembers: [], cast: [], director: '', userRatings: [],
  trailers: [],
};
const emptyCoupon: Omit<Coupon, 'id'> = {
  code: '', description: '', discount: 10, discountType: 'percentage',
  maxDiscount: 200, minAmount: 200, validTill: '', isActive: true,
};

export default function Admin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = useApp();
  const { navigate, addMovie, updateMovie, deleteMovie,
    addCoupon, updateCoupon, deleteCoupon,
    cancelBooking, logout, resetToSeedData,
    addShowTime, updateShowTime, deleteShowTime, endShowTime,
    reviewApprovalRequest,
  } = ctx;
  const state = ctx;

  // Derived helpers
  const allShows: any[] = (state.theatres ?? []).flatMap((t: any) =>
    (t.showTimes ?? []).map((s: any) => ({ ...s, _theatreId: t.id, _theatreName: t.name }))
  );
  const approveTheatreRequest = (id: string) => reviewApprovalRequest(id, 'approved');
  const rejectTheatreRequest = (id: string, note?: string) => reviewApprovalRequest(id, 'rejected', note);

  const [tab, setTab] = useState<Tab>(() => {
    try {
      const stored = localStorage.getItem('cc_admin_tab');
      if (stored) return stored as Tab;
    } catch { /* suppress */ }
    return 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('cc_admin_tab', tab);
  }, [tab]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [clock, setClock] = useState(new Date()); // kept for initial render only
  const clockRef = useRef<HTMLSpanElement>(null);
  const [newMovieId, setNewMovieId] = useState<string | null>(null);

  // Movie state
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [movieForm, setMovieForm] = useState<any>(emptyMovie);
  const [movieSearch, setMovieSearch] = useState('');
  const [castForm, setCastForm] = useState({ name: '', role: '', image: '' });
  const [trailerForm, setTrailerForm] = useState({ title: '', url: '', duration: '', image: '' });

  // Cast state
  const [castMovieId, setCastMovieId] = useState('');
  const [castSearch, setCastSearch] = useState('');

  // Theatre state
  const [reviewRequest, setReviewRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [theatreSearch, setTheatreSearch] = useState('');

  // Show state
  const [showForm, setShowForm] = useState({
    movieId: '', theatreId: '', screenId: '', city: '', date: new Date().toISOString().split('T')[0], time: '', language: 'Hindi',
    format: '2D', totalSeats: 100, prices: { normal: 150, silver: 250, gold: 350, premium: 500 }
  });
  const [showsFilter, setShowsFilter] = useState('');

  // Booking state
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'pending'>('all');
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  // Coupon state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState<Omit<Coupon, 'id'>>(emptyCoupon);

  // User state
  const [userSearch, setUserSearch] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Notification state
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'movie', target: 'all', targetEmail: '' });
  const [sentNotifs, setSentNotifs] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // More Options toggle for movie modal
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Report state
  const [reportType, setReportType] = useState('revenue');
  const [reportRange, setReportRange] = useState('week');

  // Theatre Owner Management state
  const [toRequests, setToRequests] = useState<any[]>([]);
  const [toCounts, setToCounts] = useState<Record<string, number>>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [toFilter, setToFilter] = useState('all');
  const [toSearch, setToSearch] = useState('');
  const [toDetail, setToDetail] = useState<any>(null);
  const [toRejectReason, setToRejectReason] = useState('');
  const [toLoading, setToLoading] = useState(false);

  // AdminDB state — real data from MongoDB
  const [adminUsers, setAdminUsers]       = useState<any[]>([]);
  const [adminBookings, setAdminBookings] = useState<any[]>([]);
  const [adminStats, setAdminStats]       = useState<any>(null);
  const [adminDataLoading, setAdminDataLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    siteName: 'CineConnect', currency: 'INR', timezone: 'Asia/Kolkata',
    maintenance: false, razorpayKey: 'rzp_live_xxxxx', upiEnabled: true,
    netBankingEnabled: true, emailFrom: 'noreply@cineconnect.com',
    smtpHost: 'smtp.gmail.com', smtpPort: '587',
    sessionTimeout: 30, twoFA: false, ipLogging: true,
    adminCommissionPercentage: 5,
  });

  // Payouts state
  const [adminPayouts, setAdminPayouts] = useState<any[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState<any>(null);
  const [payoutExpandedRows, setPayoutExpandedRows] = useState<Record<string, boolean>>({});

  const loadPayouts = useCallback(() => {
    setPayoutLoading(true);
    apiGetAdminPayoutSummaries().then(res => {
      if (res.ok && res.data) setAdminPayouts(res.data.summary || []);
      setPayoutLoading(false);
    }).catch(() => setPayoutLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'notifications') {
      const fetchAdminHistory = async () => {
        try {
          const res = await apiGetNotifications();
          if (res.ok && res.data) {
            // map them to the shape we need: id, target, type, title, message, sentAt
            setSentNotifs(res.data.data.map((n: any) => ({
              id: n._id,
              target: n.targetRole === 'specific_user' ? `[User] ${n.targetUserId?.email || 'Specific'}` : n.targetRole === 'specific_theatre_owner' ? `[Owner] ${n.targetUserId?.email || 'Specific'}` : n.targetRole,
              type: n.type,
              title: n.title,
              message: n.message,
              sentAt: n.createdAt
            })));
          }
        } catch (e) {}
      };
      fetchAdminHistory();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'payouts') loadPayouts();
  }, [tab, loadPayouts]);

  // Refunds state
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);

  const loadRefunds = useCallback(async () => {
    setLoadingRefunds(true);
    try {
      const res = await apiGetRefunds();
      if (res.ok && res.data) setRefunds(res.data.refunds || []);
    } catch {}
    setLoadingRefunds(false);
  }, []);

  useEffect(() => {
    if (tab === 'refunds') loadRefunds();
  }, [tab, loadRefunds]);

  const posterRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const castPhotoRef = useRef<HTMLInputElement>(null);
  const trailerImgRef = useRef<HTMLInputElement>(null);

  // Admin session guard — redirect to admin-login if no valid session
  useEffect(() => {
    const raw = localStorage.getItem('cc_admin_session');
    if (!raw) { navigate('admin-login'); return; }
    try {
      const session = JSON.parse(raw);
      if (!session.accessToken || session.expiresAt < Date.now()) {
        localStorage.removeItem('cc_admin_session');
        navigate('admin-login');
      }
    } catch { navigate('admin-login'); }
  }, [navigate]);

  useEffect(() => {
    // Write clock directly to DOM — avoids re-render every second which was
    // causing the scroll container to remount and reset scrollTop to 0.
    const fmt = () => {
      const now = new Date();
      if (clockRef.current) {
        clockRef.current.textContent =
          now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) +
          ' · ' +
          now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }
    };
    fmt();
    const t = setInterval(fmt, 1000);
    return () => clearInterval(t);
  }, []);

  // Load previously sent notifications from backend on mount
  useEffect(() => {
    apiGetNotifications().then(res => {
      if (res.ok && res.data?.notifications) {
        setSentNotifs(res.data.notifications.map((n: any) => ({
          id: n._id || n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          target: n.target,
          sentAt: n.sentAt || n.createdAt,
        })));
      }
    }).catch(() => {});
  }, []);

  // ─── Load all admin data from MongoDB on mount ───────────────────────
  const loadAdminData = useCallback(async () => {
    setAdminDataLoading(true);
    try {
      const [usersRes, bookingsRes, statsRes, settingsRes] = await Promise.all([
        apiGetUsers(),
        apiGetBookings(),
        apiGetDashboardStats(),
        apiGetSettings(),
      ]);
      if (usersRes.ok && usersRes.data?.users)     setAdminUsers(usersRes.data.users);
      if (bookingsRes.ok && bookingsRes.data?.bookings) setAdminBookings(bookingsRes.data.bookings);
      if (statsRes.ok && statsRes.data?.stats)     setAdminStats(statsRes.data.stats);
      if (settingsRes.ok && settingsRes.data?.settings) {
        setSettings(p => ({ ...p, adminCommissionPercentage: settingsRes.data.settings.adminCommissionPercentage ?? 5 }));
      }
    } catch { /* silent — fallback to ctx state */ }
    setAdminDataLoading(false);
  }, []);

  useEffect(() => {
    loadAdminData();
    // Regular poll every 30 s
    const poll = setInterval(() => loadAdminData(), 30000);

    // Instant refresh when a booking is created anywhere in this session
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cc_booking_ts') loadAdminData();
    };
    window.addEventListener('storage', onStorage);

    // Refresh when admin switches back to this tab
    const onVisible = () => { if (document.visibilityState === 'visible') loadAdminData(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(poll);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadAdminData]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Computed stats — use real DB data when available, fallback to ctx state
  const today = new Date().toISOString().split('T')[0];
  const effectiveBookings = adminBookings.length > 0 ? adminBookings : state.bookings;
  const effectiveUsers = adminUsers.length > 0 ? adminUsers : state.users;
  const todayBookings = effectiveBookings.filter((b: any) => (b.bookingDate || b.createdAt || '')?.startsWith(today));
  const totalRevenue = adminStats?.totalRevenue ?? effectiveBookings.filter((b: any) => b.status === 'confirmed').reduce((s: number, b: any) => s + (b.totalAmount || b.finalAmount || 0), 0);
  const confirmedBookings = effectiveBookings.filter((b: any) => b.status === 'confirmed');
  const pendingRequests: any[] = (state.approvalRequests ?? []).filter((r: any) => r.status === 'pending');
  const owners = effectiveUsers.filter((u: any) => u.role === 'theatre_owner');
  const activeMovies = state.movies.filter((m: any) => m.isNowShowing);

  // ── File helpers ────────────────────────────────────────────────
  const readFile = (file: File): Promise<string> =>
    new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.readAsDataURL(file); });

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setMovieForm(p => ({ ...p, poster: URL.createObjectURL(f) }));
    const b64 = await readFile(f);
    setMovieForm(p => ({ ...p, poster: b64 }));
  };
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const b64 = await readFile(f);
    setMovieForm(p => ({ ...p, banner: b64 }));
  };
  const handleCastPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const b64 = await readFile(f);
    setCastForm(p => ({ ...p, image: b64 }));
  };

  // ── Movie helpers ───────────────────────────────────────────────
  const openAddMovie = () => {
    setEditingMovie(null);
    setMovieForm(emptyMovie);
    setShowMovieModal(true);
  };
  const openEditMovie = (m: Movie) => {
    setEditingMovie(m);
    const lang = Array.isArray(m.language) ? m.language[0] : m.language;
    setMovieForm({
      title: m.title, genre: m.genre, duration: m.duration,
      language: lang,
      releaseDate: m.releaseDate, poster: m.poster, banner: m.banner ?? '',
      trailerUrl: m.trailerUrl ?? '', certificate: m.certificate ?? 'UA',
      description: m.description ?? '', rating: m.rating,
      isNowShowing: m.isNowShowing, isTrending: m.isTrending, isComingSoon: m.isComingSoon,
      castMembers: m.castMembers ?? [], director: m.director ?? '',
      trailers: m.trailers ?? [],
    });
    setShowMovieModal(true);
  };
  const saveMovie = () => {
    if (!movieForm.title.trim()) { showToast('Title is required', 'error'); return; }
    // Normalise language: always store as array
    const finalForm = {
      ...movieForm,
      language: Array.isArray(movieForm.language)
        ? movieForm.language
        : movieForm.language ? [movieForm.language] : ['Hindi'],
      // Sync legacy `cast` string array from castMembers for backward compat
      cast: (movieForm.castMembers ?? []).map((c: any) => c.name),
    };
    if (editingMovie) {
      updateMovie({ ...editingMovie, ...finalForm });
      showToast(`"${finalForm.title}" updated — Live on homepage! ✅`);
    } else {
      const id = `m${Date.now()}`;
      addMovie({ ...finalForm, id } as Movie);
      setNewMovieId(id);
      setTimeout(() => setNewMovieId(null), 8000);
      showToast(`"${finalForm.title}" added — Now live on homepage! 🎬`);
    }
    setShowMovieModal(false);
    setShowMoreOptions(false);
  };
  const addCastMember = () => {
    if (!castForm.name.trim()) return;
    setMovieForm(p => ({
      ...p,
      castMembers: [...(p.castMembers ?? []), { id: `c${Date.now()}`, ...castForm }],
    }));
    setCastForm({ name: '', role: '', image: '' });
  };
  const removeCastMember = (id: string) => {
    setMovieForm(p => ({ ...p, castMembers: (p.castMembers ?? []).filter(c => c.id !== id) }));
  };

  // ── Coupon helpers ──────────────────────────────────────────────
  const openAddCoupon = () => {
    setEditingCoupon(null);
    setCouponForm(emptyCoupon);
    setShowCouponModal(true);
  };
  const saveCoupon = () => {
    if (!couponForm.code.trim()) { showToast('Code is required', 'error'); return; }
    if (editingCoupon) {
      updateCoupon({ ...editingCoupon, ...couponForm });
      showToast('Coupon updated');
    } else {
      addCoupon({ ...couponForm, id: `coup${Date.now()}` } as Coupon);
      showToast('Coupon created & live on homepage!');
    }
    setShowCouponModal(false);
  };

  // ── Show helpers ────────────────────────────────────────────────
  const handleAddShow = () => {
    if (!showForm.movieId || !showForm.theatreId) { showToast('Select movie and theatre', 'error'); return; }
    if (!showForm.time) { showToast('Select a show time', 'error'); return; }
    if (!showForm.date) { showToast('Select a date', 'error'); return; }
    // Validate date is today or future
    if (showForm.date < today) { showToast('Date cannot be in the past', 'error'); return; }
    const showTimeObj = {
      movieId: showForm.movieId,
      screenId: showForm.screenId || 'sc1',
      date: showForm.date,
      time: showForm.time,
      language: showForm.language,
      format: showForm.format as any,
      totalSeats: showForm.totalSeats,
      availableSeats: showForm.totalSeats,
      priceOverride: showForm.prices,
      isEnded: false,
    };
    addShowTime(showForm.theatreId, showTimeObj);
    showToast('Show scheduled successfully! ✅');
    // Reset time so next add needs explicit selection, keep date as today
    setShowForm(p => ({ ...p, movieId: '', screenId: '', date: today, time: '' }));
  };

  // ── Filtered data ───────────────────────────────────────────────
  const filteredMovies = state.movies.filter(m => m.title.toLowerCase().includes(movieSearch.toLowerCase()));
  const filteredBookings = effectiveBookings.filter((b: any) => {
    const q = bookingSearch.toLowerCase();
    const matchQ = (b._id || b.id || '').toLowerCase().includes(q) ||
      (b.movieTitle || b.movieId?.title || '').toLowerCase().includes(q) ||
      (b.userId?.name || b.userEmail || '').toLowerCase().includes(q);
    const matchF = bookingFilter === 'all' || b.status === bookingFilter;
    return matchQ && matchF;
  });
  const filteredUsers = effectiveUsers.filter((u: any) => {
    const q = userSearch.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  // ── Sparkline generator ─────────────────────────────────────────
  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '80px', height: '36px' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  };

  // ── Revenue Chart ───────────────────────────────────────────────
  const RevenueChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [42000, 58000, 35000, 72000, 89000, 95000, 110000];
    const max = Math.max(...data);
    const pts = data.map((v, i) => `${16 + (i * (568 / 6))},${180 - (v / max) * 150}`).join(' ');
    return (
      <svg viewBox="0 0 600 200" style={{ width: '100%', height: '180px' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00b4ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00b4ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1="0" y1={30 + i * 37.5} x2="600" y2={30 + i * 37.5}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        <polyline points={pts.replace(/(\d+),(\d+)/g, '$1,$2 ')}
          fill="url(#chartGrad)" stroke="none" />
        <polyline points={pts} fill="none" stroke="#00b4ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <g key={i}>
            <circle cx={16 + (i * (568 / 6))} cy={180 - (v / max) * 150} r="4" fill="#00b4ff" />
            <text x={16 + (i * (568 / 6))} y="198" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">{days[i]}</text>
          </g>
        ))}
      </svg>
    );
  };

  // ── Revenue Donut ───────────────────────────────────────────────
  const DonutChart = () => {
    const segs = [
      { label: 'Online', val: 65, color: '#00b4ff' },
      { label: 'Counter', val: 25, color: '#f5c518' },
      { label: 'App', val: 10, color: '#00e5a0' },
    ];
    let cum = 0;
    const r = 70, cx = 90, cy = 90;
    const paths = segs.map(s => {
      const start = (cum / 100) * Math.PI * 2 - Math.PI / 2;
      cum += s.val;
      const end = (cum / 100) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      const lg = s.val > 50 ? 1 : 0;
      return { ...s, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} Z` };
    });
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <svg viewBox="0 0 180 180" style={{ width: '140px', height: '140px', flexShrink: 0 }}>
          {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity="0.85" />)}
          <circle cx={cx} cy={cy} r="45" fill="#0a0a1a" />
          <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="13" fontWeight="700">₹{(totalRevenue / 100000).toFixed(1)}L</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Revenue</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paths.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{p.label}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{p.val}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Common styles ───────────────────────────────────────────────
  const card = {
    background: 'linear-gradient(145deg, rgba(8,8,30,0.92) 0%, rgba(4,4,18,0.95) 100%)',
    border: '1px solid rgba(0,229,255,0.12)',
    borderRadius: '24px',
    padding: '28px',
    backdropFilter: 'blur(60px) saturate(2) brightness(1.08)',
    boxShadow: [
      '0 8px 60px rgba(0,0,0,0.8)',
      'inset 0 1px 0 rgba(255,255,255,0.10)',
      'inset 0 -1px 0 rgba(0,229,255,0.06)',
      '0 0 0 1px rgba(0,229,255,0.04)',
    ].join(','),
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.45s cubic-bezier(0.34,1.4,0.64,1)',
  } as React.CSSProperties;

  // Premium section header helper
  const sectionHeader = (title: string, subtitle?: string, color = '#00E5FF') => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: `linear-gradient(180deg,${color},${color}44)`, boxShadow: `0 0 12px ${color}60` }} />
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'white', letterSpacing: '-0.3px', textShadow: `0 0 30px ${color}30` }}>{title}</h2>
          {subtitle && <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'rgba(255,255,255,0.38)', fontWeight: '500', letterSpacing: '0.3px' }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ height: '1px', background: `linear-gradient(90deg,${color}30,transparent)`, marginTop: '16px' }} />
    </div>
  );

  const btn = (color = '#00E5FF', outline = false) => ({
    background: outline
      ? `linear-gradient(135deg,${color}08,${color}04)`
      : `linear-gradient(135deg,${color} 0%,${color === '#00E5FF' ? '#7B61FF' : color}cc 100%)`,
    border: `1px solid ${color}${outline ? '40' : '80'}`,
    borderRadius: '14px',
    color: outline ? color : 'white',
    padding: '10px 20px',
    fontSize: '0.83rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
    boxShadow: outline
      ? `0 0 20px ${color}18, inset 0 0 12px ${color}06, 0 2px 8px rgba(0,0,0,0.3)`
      : `0 4px 28px ${color}55, 0 0 0 1px ${color}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
    letterSpacing: '0.4px',
    textShadow: outline ? 'none' : '0 1px 6px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(8px)',
  } as React.CSSProperties);

  const input = {
    width: '100%',
    background: 'rgba(0,229,255,0.04)',
    border: '1px solid rgba(0,229,255,0.16)',
    borderRadius: '14px',
    padding: '12px 18px',
    color: 'white',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    colorScheme: 'dark',
    transition: 'border-color 0.25s, box-shadow 0.25s',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(4px)',
  };

  const label = {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: 'rgba(0,229,255,0.65)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
    display: 'block',
    textShadow: '0 0 16px rgba(0,229,255,0.4)',
  };

  const pill = (color: string, bg?: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
    color,
    background: bg ?? `linear-gradient(135deg,${color}20,${color}0a)`,
    border: `1px solid ${color}45`,
    boxShadow: `0 0 16px ${color}28, inset 0 1px 0 ${color}15`,
    letterSpacing: '0.4px',
    backdropFilter: 'blur(4px)',
  } as React.CSSProperties);

  // ── SIDEBAR ─────────────────────────────────────────────────────
  const Sidebar = ({ mobile = false }) => (
    <div style={{
      width: mobile ? '100%' : sidebarOpen ? '248px' : '76px',
      background: 'rgba(5,5,20,0.92)',
      borderRight: '1px solid rgba(0,229,255,0.08)',
      display: 'flex', flexDirection: 'column',
      height: mobile ? 'auto' : '100vh',
      transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
      overflowX: 'hidden',
      overflowY: 'visible',
      flexShrink: 0,
      backdropFilter: 'blur(40px) saturate(1.4)',
      boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
      position: 'relative',
    }}>
      {/* Sidebar glow accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,#00E5FF,#7B61FF,transparent)', opacity:0.7 }} />

      {/* Logo */}
      {!mobile && (
        <div style={{ padding: '22px 16px 18px', borderBottom: '1px solid rgba(0,229,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg,#00E5FF,#7B61FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(0,229,255,0.5), 0 0 48px rgba(123,97,255,0.2)',
              fontSize: '18px', fontWeight: '900', color: '#030308',
              animation: 'logoPulse 3s ease-in-out infinite',
            }}>C</div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '1rem', fontWeight: '800', background: 'linear-gradient(90deg,#00E5FF,#7B61FF,#FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px' }}>CineConnect</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(0,229,255,0.45)', letterSpacing: '2px', fontWeight: '700' }}>SUPER ADMIN</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nav items */}
      <div
        className="admin-sidebar-nav"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: mobile ? 'row' : 'column',
          gap: '3px',
          overscrollBehavior: 'contain',
        }}>
        {TABS.map((t, idx) => {
          const active = tab === t.id;
          const pending = t.id === 'theatres' && pendingRequests.length > 0;
          const showSep = !mobile && (idx === 4 || idx === 8 || idx === 10);
          return (
            <React.Fragment key={t.id}>
              {showSep && <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(0,229,255,0.12),transparent)', margin: '6px 8px' }} />}
              <button onClick={() => { setTab(t.id); setMobileSidebar(false); }}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: mobile ? '0' : sidebarOpen ? '12px' : '0',
                  justifyContent: (mobile || !sidebarOpen) ? 'center' : 'flex-start',
                  padding: mobile ? '10px 14px' : '11px 12px',
                  borderRadius: '12px',
                  background: active ? `linear-gradient(135deg,${t.color}20,${t.color}08)` : 'transparent',
                  border: 'none',
                  borderLeft: active && !mobile ? `3px solid ${t.color}` : '3px solid transparent',
                  color: active ? t.color : 'rgba(255,255,255,0.38)',
                  cursor: 'pointer', width: '100%', transition: 'all 0.25s cubic-bezier(0.34,1.4,0.64,1)',
                  position: 'relative',
                  boxShadow: active ? `0 0 20px ${t.color}18, inset 0 0 20px ${t.color}06` : 'none',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.transform = 'translateX(3px)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; e.currentTarget.style.transform = 'translateX(0)'; }}}
              >
                {/* Icon in glowing circle */}
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: active ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                  border: active ? `1px solid ${t.color}44` : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: active ? `0 0 14px ${t.color}30` : 'none',
                  transition: 'all 0.25s',
                }}>
                  <span style={{ color: active ? t.color : 'rgba(255,255,255,0.38)' }}>{t.icon}</span>
                </div>
                {!mobile && sidebarOpen && <span style={{ fontSize: '0.85rem', fontWeight: active ? '700' : '500', whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>{t.label}</span>}
                {mobile && <span style={{ fontSize: '0.58rem', fontWeight: '600', marginTop: '2px', display: 'block' }}>{t.label.slice(0, 5)}</span>}
                {pending && (
                  <span style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#FFD700', boxShadow: '0 0 8px #FFD700',
                    animation: 'ping 1.5s infinite',
                  }} />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom actions */}
      {!mobile && sidebarOpen && (
        <div style={{ padding: '12px', borderTop: '1px solid rgba(0,229,255,0.07)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button onClick={() => navigate('home')} style={{ ...btn('#00e5a0', true), width: '100%', justifyContent: 'center' }}>
            {I.home} View Site
          </button>
          <button onClick={() => { resetToSeedData(); showToast('Data reset', 'info'); }} style={{ ...btn('#FFD700', true), width: '100%', justifyContent: 'center' }}>
            {I.refresh} Reset Data
          </button>
          <button onClick={() => { localStorage.removeItem('cc_admin_session'); logout(); navigate('auth'); }} style={{ ...btn('#ff1450', true), width: '100%', justifyContent: 'center' }}>
            {I.logout} Logout
          </button>
        </div>
      )}
    </div>
  );



  // ── HEADER ──────────────────────────────────────────────────────
  const Header = () => (
    <div style={{
      height: '64px', background: 'rgba(5,5,20,0.92)', backdropFilter: 'blur(40px) saturate(1.5)',
      borderBottom: '1px solid rgba(0,229,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
    }}>
      {/* Animated gradient bottom border */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,#00E5FF,#7B61FF,#FFD700,transparent)', animation:'gradFlow 4s linear infinite', backgroundSize:'200%' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '10px', padding: '7px 9px', color: 'rgba(0,229,255,0.8)', cursor: 'pointer' }}>
          {I.menu}
        </button>
        <button onClick={() => setMobileSidebar(p => !p)} className="admin-mobile-menu" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '10px', padding: '7px 9px', color: 'rgba(0,229,255,0.8)', cursor: 'pointer' }}>
          {I.menu}
        </button>
        <div>
          <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'white', letterSpacing: '-0.3px' }}>{TABS.find(t => t.id === tab)?.label}</div>
          <span
            ref={clockRef}
            style={{ fontSize: '0.7rem', color: 'rgba(0,229,255,0.45)', fontWeight: '600', letterSpacing: '0.5px' }}
          >
            {clock.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {pendingRequests.length > 0 && (
          <button onClick={() => setTab('theatres')} style={{ ...btn('#FFD700'), padding: '7px 14px', fontSize: '0.75rem' }}>
            🔔 {pendingRequests.length} Pending
          </button>
        )}
        {/* System Online */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: '20px', padding: '5px 12px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00e5a0', boxShadow: '0 0 10px #00e5a0, 0 0 20px #00e5a040', animation: 'ping 2s infinite' }} />
          <span style={{ fontSize: '0.72rem', color: '#00e5a0', fontWeight: '700', letterSpacing: '0.5px' }}>SYSTEM ONLINE</span>
        </div>
        {/* Notification bell */}
        <div style={{ position:'relative', width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.15)', borderRadius:'10px', cursor:'pointer', color:'rgba(0,229,255,0.8)' }}>
          {I.bell}
          {pendingRequests.length > 0 && <div style={{ position:'absolute', top:'6px', right:'6px', width:'7px', height:'7px', borderRadius:'50%', background:'#FFD700', boxShadow:'0 0 8px #FFD700', animation:'ping 2s infinite' }} />}
        </div>
        {/* Avatar with glowing ring */}
        <div style={{ position:'relative' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#00E5FF,#7B61FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900', color: '#030308', boxShadow: '0 0 0 2px #7B61FF, 0 0 20px rgba(123,97,255,0.5)', animation: 'avatarGlow 3s ease-in-out infinite' }}>A</div>
        </div>
      </div>
    </div>
  );

  // ── TOAST ───────────────────────────────────────────────────────
  const Toast = () => toast ? (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      background: toast.type === 'success' ? 'rgba(0,229,160,0.15)' : toast.type === 'error' ? 'rgba(255,20,80,0.15)' : 'rgba(0,180,255,0.15)',
      border: `1px solid ${toast.type === 'success' ? '#00e5a0' : toast.type === 'error' ? '#ff1450' : '#00b4ff'}44`,
      borderRadius: '12px', padding: '14px 20px', color: 'white',
      backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      fontSize: '0.88rem', fontWeight: '600', maxWidth: '320px',
      animation: 'slideIn 0.3s ease',
    }}>
      {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'} {toast.msg}
    </div>
  ) : null;

  // ═══════════════════════════════════════════════════════════════
  // TAB RENDERERS
  // ═══════════════════════════════════════════════════════════════

  // ── DASHBOARD ──────────────────────────────────────────────────
  const DashboardTab = () => {
    const kpis = [
      { label: 'Today\'s Bookings', val: todayBookings.length, sub: `+${Math.floor(Math.random() * 5) + 1} this hour`, color: '#00b4ff', data: [10, 15, 8, 20, 12, 18, todayBookings.length] },
      { label: 'Total Revenue', val: `₹${(totalRevenue / 1000).toFixed(0)}K`, sub: 'All confirmed', color: '#f5c518', data: [30, 45, 28, 60, 75, 85, totalRevenue / 1000] },
      { label: 'Active Movies', val: activeMovies.length, sub: 'Now showing', color: '#a855f7', data: [5, 6, 5, 7, 6, 7, activeMovies.length] },
      { label: 'Running Shows', val: allShows.filter((s: any) => !s.isEnded).length, sub: 'Across all theatres', color: '#00e5a0', data: [20, 25, 18, 30, 22, 28, allShows.length] },
      { label: 'Active Users', val: state.users.filter(u => u.role === 'user').length, sub: 'Registered', color: '#fb923c', data: [100, 120, 95, 140, 130, 150, state.users.length] },
      { label: 'Theatre Owners', val: owners.length, sub: `${pendingRequests.length} pending`, color: '#ff1450', data: [2, 3, 2, 4, 3, 4, owners.length] },
    ];
    const topMovies = [...state.movies].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5);
    const recentActivity = state.bookings.slice(-8).reverse().map(b => ({
      msg: `Booking #${b.id.slice(-6)} — ${state.movies.find(m => m.id === b.movieId)?.title ?? 'Unknown'}`,
      time: b.bookingDate?.split('T')[0] ?? today,
      color: b.status === 'confirmed' ? '#00e5a0' : b.status === 'cancelled' ? '#ff1450' : '#f5c518',
    }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeInUp 0.5s ease' }}>

        {/* ── LIVE SYNC BANNER ── */}
        <div style={{
          background: 'linear-gradient(135deg,rgba(0,229,160,0.09),rgba(0,229,255,0.05))',
          border: '1px solid rgba(0,229,160,0.28)',
          borderRadius: '18px', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 0 60px rgba(0,229,160,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
          animation: 'slideIn 0.4s ease',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'#00e5a0', boxShadow:'0 0 16px #00e5a0, 0 0 32px rgba(0,229,160,0.5)', animation:'ping 1.5s infinite' }} />
            <div style={{ position:'absolute', inset:'-6px', borderRadius:'50%', border:'1px solid rgba(0,229,160,0.2)', animation:'aiRing 2s linear infinite' }} />
          </div>
          <div style={{ flex:1 }}>
            <span style={{ color: '#00e5a0', fontSize: '0.88rem', fontWeight: '800', letterSpacing: '0.8px' }}>⚡ LIVE SYNC ACTIVE</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginLeft:'12px' }}>All changes reflect instantly on the user-facing homepage.</span>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            {[{label:'API',color:'#00e5a0'},{label:'DB',color:'#00E5FF'},{label:'CDN',color:'#7B61FF'}].map(s=>(
              <div key={s.label} style={{ padding:'4px 10px', borderRadius:'20px', background:`${s.color}15`, border:`1px solid ${s.color}40`, fontSize:'0.68rem', fontWeight:'800', color:s.color, letterSpacing:'0.5px' }}>
                <span style={{marginRight:'4px',display:'inline-block',width:'6px',height:'6px',borderRadius:'50%',background:s.color,boxShadow:`0 0 6px ${s.color}`,verticalAlign:'middle'}}></span>{s.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(248px,1fr))', gap: '20px' }}>
          {kpis.map((k, i) => (
            <div key={i} className="kpi-card" style={{
              background: `linear-gradient(145deg, rgba(8,8,30,0.92), rgba(4,4,18,0.96))`,
              border: `1px solid ${k.color}22`,
              borderRadius: '24px', padding: '24px',
              backdropFilter: 'blur(60px) saturate(2)',
              boxShadow: `0 8px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${k.color}08`,
              position: 'relative', overflow: 'hidden',
              transition: 'all 0.45s cubic-bezier(0.34,1.4,0.64,1)',
              cursor: 'default', animationDelay: `${i * 70}ms`,
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.025)';
                e.currentTarget.style.borderColor = `${k.color}55`;
                e.currentTarget.style.boxShadow = `0 24px 70px rgba(0,0,0,0.8), 0 0 50px ${k.color}18, inset 0 1px 0 rgba(255,255,255,0.12)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = `${k.color}22`;
                e.currentTarget.style.boxShadow = `0 8px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${k.color}08`;
              }}>
              {/* Animated top bar */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,transparent,${k.color},${k.color}99,transparent)`, animation:'gradFlow 3s linear infinite', backgroundSize:'200%' }} />
              {/* Corner glow */}
              <div style={{ position:'absolute', top:'-30%', right:'-10%', width:'60%', height:'60%', borderRadius:'50%', background:`radial-gradient(circle,${k.color}12,transparent 70%)`, pointerEvents:'none' }} />
              {/* Index badge */}
              <div style={{ position:'absolute', top:'16px', right:'16px', width:'24px', height:'24px', borderRadius:'8px', background:`${k.color}18`, border:`1px solid ${k.color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.68rem', fontWeight:'800', color:k.color }}>{i+1}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: `${k.color}99`, fontWeight: '800', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '14px', textShadow:`0 0 10px ${k.color}40` }}>{k.label}</div>
                  <div className="kpi-icon" style={{ width:'48px', height:'48px', borderRadius:'14px', background:`linear-gradient(135deg,${k.color}28,${k.color}0c)`, border:`1px solid ${k.color}33`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px', boxShadow:`0 0 20px ${k.color}18, inset 0 1px 0 ${k.color}20`, transition:'transform 0.35s' }}>
                    <span style={{ color: k.color, fontSize:'1.1rem' }}>{I.trending}</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', lineHeight: 1, letterSpacing:'-1px', textShadow: `0 0 40px ${k.color}50` }}>{k.val}</div>
                  <div style={{ fontSize: '0.74rem', color: k.color, marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700', textShadow:`0 0 10px ${k.color}40` }}>
                    {I.trending} {k.sub}
                  </div>
                </div>
                <div style={{ marginTop:'4px' }}><Sparkline data={k.data} color={k.color} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '22px' }}>
          <div style={{ ...card, borderColor:'rgba(0,180,255,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'white', letterSpacing:'-0.2px' }}>📈 Booking Trends</h3>
                <div style={{ fontSize:'0.72rem', color:'rgba(0,180,255,0.6)', marginTop:'3px', fontWeight:'600' }}>Revenue + seats across last 7 days</div>
              </div>
              <span style={pill('#00b4ff')}>Last 7 Days</span>
            </div>
            <RevenueChart />
          </div>
          <div style={{ ...card, borderColor:'rgba(245,197,24,0.18)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(245,197,24,0.15)', border:'1px solid rgba(245,197,24,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', boxShadow:'0 0 14px rgba(245,197,24,0.2)' }}>💰</div>
              <div><div style={{ fontWeight:'800', color:'white', fontSize:'1rem' }}>Revenue Split</div><div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.35)'}}>By category</div></div>
            </div>
            <DonutChart />
            <div style={{ marginTop: '16px', padding: '14px 16px', background: 'linear-gradient(135deg,rgba(245,197,24,0.08),rgba(245,197,24,0.04))', borderRadius: '14px', border:'1px solid rgba(245,197,24,0.2)' }}>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase' }}>Total Revenue</div>
              <div style={{ fontSize: '1.65rem', fontWeight: '900', color: '#f5c518', textShadow:'0 0 30px rgba(245,197,24,0.5)', letterSpacing:'-0.5px', marginTop:'4px' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* ── TOP MOVIES + LIVE FEED ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
          {/* Top Movies */}
          <div style={{ ...card, borderColor:'rgba(245,197,24,0.14)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'11px', background:'linear-gradient(135deg,rgba(245,197,24,0.25),rgba(245,197,24,0.1))', border:'1px solid rgba(245,197,24,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', boxShadow:'0 0 16px rgba(245,197,24,0.2)' }}>🏆</div>
              <div><div style={{ fontWeight:'800', color:'white', fontSize:'1rem' }}>Top Performing Movies</div><div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.35)'}}>By rating & bookings</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topMovies.map((m, i) => {
                const rankColors = ['#f5c518','#C0C0C0','#CD7F32','rgba(255,255,255,0.25)','rgba(255,255,255,0.15)'];
                const rankColor = rankColors[i] ?? 'rgba(255,255,255,0.15)';
                const bookCount = state.bookings.filter(b => b.movieId === m.id).length;
                return (
                  <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 14px', background:'rgba(255,255,255,0.03)', borderRadius:'14px', border:`1px solid ${rankColor}15`, transition:'all 0.25s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:`linear-gradient(135deg,${rankColor}40,${rankColor}18)`, border:`1px solid ${rankColor}60`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'0.85rem', color: i < 3 ? '#030308' : 'rgba(255,255,255,0.4)', flexShrink:0, boxShadow:`0 0 10px ${rankColor}40` }}>{i+1}</div>
                    <img src={m.poster} alt={m.title} style={{ width:'38px', height:'52px', objectFit:'cover', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.5)', flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight:'700', fontSize:'0.88rem', color:'white', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.title}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'5px' }}>
                        <span style={pill('#f5c518')}>{I.star} {m.rating}</span>
                        <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', fontWeight:'600' }}>{bookCount} bookings</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div style={{ ...card, borderColor:'rgba(0,229,255,0.14)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ position:'relative', width:'38px', height:'38px', borderRadius:'11px', background:'linear-gradient(135deg,rgba(0,229,255,0.2),rgba(0,229,255,0.08))', border:'1px solid rgba(0,229,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', boxShadow:'0 0 16px rgba(0,229,255,0.2)' }}>
                ⚡
                <div style={{ position:'absolute', top:'4px', right:'4px', width:'7px', height:'7px', borderRadius:'50%', background:'#00e5a0', boxShadow:'0 0 6px #00e5a0', animation:'ping 1.5s infinite' }} />
              </div>
              <div><div style={{ fontWeight:'800', color:'white', fontSize:'1rem' }}>Live Activity Feed</div><div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.35)'}}>Recent transactions</div></div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:'300px', overflowY:'auto', overscrollBehavior:'contain' }}>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'10px 12px', background:'rgba(255,255,255,0.025)', borderRadius:'12px', border:`1px solid ${a.color}12`, transition:'all 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background=`${a.color}08`}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}>
                  <div style={{ position:'relative', flexShrink:0, paddingTop:'3px' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:a.color, boxShadow:`0 0 8px ${a.color}, 0 0 16px ${a.color}50` }} />
                    {i < recentActivity.length-1 && <div style={{ position:'absolute', left:'4px', top:'14px', width:'1px', height:'20px', background:`linear-gradient(${a.color}40,transparent)` }} />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.85)', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.msg}</div>
                    <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', marginTop:'3px', fontWeight:'500' }}>{a.time}</div>
                  </div>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:a.color, flexShrink:0, marginTop:'6px', opacity:0.6 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUICK STAT PILLS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(185px,1fr))', gap: '16px' }}>
          {[
            { label: 'Avg Occupancy', val: '74%', color: '#00E5FF', icon: '🪑', sub: 'Per show' },
            { label: 'Confirmed', val: confirmedBookings.length, color: '#00e5a0', icon: '✅', sub: 'Bookings' },
            { label: 'Cancelled', val: state.bookings.filter(b => b.status === 'cancelled').length, color: '#ff1450', icon: '❌', sub: 'Refunded' },
            { label: 'Total Shows', val: allShows.length, color: '#FFD700', icon: '🎬', sub: 'Scheduled' },
            { label: 'Active Coupons', val: state.coupons.filter(c => c.isActive).length, color: '#7B61FF', icon: '🎁', sub: 'Running' },
          ].map((s, i) => (
            <div key={i} className="admin-stat-card" style={{
              background: `linear-gradient(145deg,rgba(8,8,30,0.92),rgba(4,4,18,0.96))`,
              border: `1px solid ${s.color}20`,
              borderRadius: '20px', padding: '22px 16px',
              textAlign: 'center', cursor: 'default',
              backdropFilter: 'blur(40px) saturate(1.8)',
              boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${s.color}08`,
              position: 'relative', overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.34,1.4,0.64,1)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'; e.currentTarget.style.borderColor = `${s.color}50`; e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.7),0 0 40px ${s.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = `${s.color}20`; e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${s.color}08`; }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${s.color},transparent)` }} />
              <div style={{ width:'52px', height:'52px', borderRadius:'16px', background:`linear-gradient(135deg,${s.color}30,${s.color}0c)`, border:`1px solid ${s.color}38`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:'1.5rem', boxShadow:`0 0 20px ${s.color}22, inset 0 1px 0 ${s.color}25` }}>{s.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: s.color, textShadow: `0 0 30px ${s.color}70`, letterSpacing:'-0.5px' }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: 'white', marginTop: '6px', fontWeight: '700', letterSpacing: '0.2px' }}>{s.label}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '3px', fontWeight: '500' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* NEW PREMIUM CARDS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          {/* System Health */}
          <div style={{ ...card, borderColor: 'rgba(0,229,160,0.2)', background: 'rgba(0,229,160,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(0,229,160,0.15)', border:'1px solid rgba(0,229,160,0.3)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(0,229,160,0.2)' }}>⚡</div>
              <div><div style={{ fontWeight:'800', fontSize:'0.95rem', color:'white' }}>System Health</div><div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)' }}>Real-time monitoring</div></div>
            </div>
            {[{ label:'API Server', val:'99.9%', status:'Online', color:'#00e5a0' },{ label:'Database', val:'12ms', status:'Fast', color:'#00E5FF' },{ label:'CDN Latency', val:'8ms', status:'Optimal', color:'#7B61FF' }].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', marginBottom:'8px', border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.7)', fontWeight:'600' }}>{item.label}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'0.8rem', fontWeight:'800', color:item.color }}>{item.val}</span>
                  <span style={{ ...pill(item.color), fontSize:'0.65rem', padding:'2px 8px' }}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ ...card, borderColor: 'rgba(123,97,255,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(123,97,255,0.15)', border:'1px solid rgba(123,97,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(123,97,255,0.2)' }}>🚀</div>
              <div><div style={{ fontWeight:'800', fontSize:'0.95rem', color:'white' }}>Quick Actions</div><div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)' }}>Shortcuts</div></div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {[{ label:'Add Movie', icon:'🎬', color:'#00E5FF', action: () => { setTab('movies'); } },{ label:'Add Theatre', icon:'🏟️', color:'#7B61FF', action: () => setTab('theatres') },{ label:'Send Notification', icon:'🔔', color:'#FFD700', action: () => setTab('notifications') },].map((a, i) => (
                <button key={i} onClick={a.action} style={{ ...btn(a.color, true), width:'100%', justifyContent:'flex-start', gap:'10px', padding:'11px 14px', fontSize:'0.85rem' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${a.color}15`; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <span style={{ fontSize:'1rem' }}>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div style={{ ...card, borderColor: 'rgba(255,215,0,0.15)', background: 'rgba(255,215,0,0.02)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,215,0,0.12)', border:'1px solid rgba(255,215,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(255,215,0,0.15)' }}>🤖</div>
              <div><div style={{ fontWeight:'800', fontSize:'0.95rem', color:'white' }}>AI Insights</div><div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)' }}>Smart analytics</div></div>
            </div>
            {[
              { icon:'⏰', label:'Peak Traffic', val:'8 PM – 11 PM', color:'#FFD700' },
              { icon:'🏆', label:'Top Movie', val: [...state.movies].sort((a,b)=>(b.rating||0)-(a.rating||0))[0]?.title?.slice(0,14) || 'N/A', color:'#00E5FF' },
              { icon:'⚠️', label:'Drop Alert', val: todayBookings.length < 5 ? 'Low bookings today' : 'Bookings on track', color: todayBookings.length < 5 ? '#ff6b6b' : '#00e5a0' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', marginBottom:'8px', border:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:'1rem' }}>{item.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', fontWeight:'600' }}>{item.label}</div>
                  <div style={{ fontSize:'0.82rem', color:item.color, fontWeight:'700' }}>{item.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── MOVIES TAB ──────────────────────────────────────────────────
  const MoviesTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Live sync banner */}
      <div style={{ background: 'rgba(0,229,160,0.07)', border: '1px solid rgba(0,229,160,0.25)', borderRadius: '14px', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 0 30px rgba(0,229,160,0.05)' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5a0', boxShadow: '0 0 10px #00e5a0,0 0 20px rgba(0,229,160,0.4)', animation: 'ping 1.5s infinite', flexShrink: 0 }} />
        <span style={{ color: '#00e5a0', fontSize: '0.83rem', fontWeight: '700', letterSpacing: '0.3px' }}>⚡ LIVE SYNC ACTIVE</span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>Movies added here appear instantly on user homepage — no refresh needed.</span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>{I.search}</span>
          <input placeholder="Search movies…" value={movieSearch} onChange={e => setMovieSearch(e.target.value)}
            style={{ ...input, paddingLeft: '38px' }} />
        </div>
        <button onClick={openAddMovie} style={btn('#00b4ff')}>
          {I.plus} Add Movie
        </button>
      </div>

      {/* Movie table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,229,255,0.04)', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
              {['#', 'Poster', 'Title', 'Genre', 'Rating', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(0,229,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMovies.map((m, i) => (
              <tr key={m.id} className="admin-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', position: 'relative' }}>
                <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{i + 1}</td>
                <td style={{ padding: '8px 16px' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={m.poster} alt={m.title} style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48"><rect fill="%23111" width="36" height="48"/></svg>' }} />
                    {m.id === newMovieId && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#00e5a0', borderRadius: '50%', width: '10px', height: '10px', animation: 'ping 1s infinite' }} />}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'white' }}>{m.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{m.duration} min · {m.language}</div>
                  {m.id === newMovieId && <span style={{ ...pill('#00e5a0'), fontSize: '0.65rem', marginTop: '4px', display: 'inline-flex' }}>✨ JUST ADDED</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {(m.genre ?? []).slice(0, 2).map(g => <span key={g} style={pill('#a855f7')}>{g}</span>)}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...pill('#f5c518'), display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{I.star} {m.rating}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={m.isNowShowing ? pill('#00e5a0') : m.isComingSoon ? pill('#00b4ff') : pill('#f5c518')}>
                    {m.isNowShowing ? 'Now Showing' : m.isComingSoon ? 'Coming Soon' : 'Trending'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEditMovie(m)} style={{ ...btn('#00b4ff', true), padding: '5px 10px' }}>{I.edit} Edit</button>
                    <button onClick={() => { if (window.confirm(`Delete "${m.title}"?`)) { deleteMovie(m.id); showToast('Movie deleted'); } }} style={{ ...btn('#ff1450', true), padding: '5px 10px' }}>{I.trash}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMovies.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No movies found. <button onClick={openAddMovie} style={{ ...btn('#00b4ff'), display: 'inline-flex' }}>Add one →</button></div>
        )}
      </div>
    </div>
  );

  // ── CAST TAB ────────────────────────────────────────────────────
  const CastTab = () => {
    const movie = state.movies.find(m => m.id === castMovieId);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: 'white' }}>🎭 Select Movie to Manage Cast</h3>
          <select value={castMovieId} onChange={e => setCastMovieId(e.target.value)} style={{ ...input, width: '100%' }}>
            <option value="">-- Select a Movie --</option>
            {state.movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>

        {movie && (
          <>
            {/* Add cast form */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: 'white' }}>➕ Add Cast Member to "{movie.title}"</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <span style={label}>Actor Name *</span>
                  <input placeholder="e.g. Prabhas" value={castForm.name} onChange={e => setCastForm(p => ({ ...p, name: e.target.value }))} style={input} />
                </div>
                <div>
                  <span style={label}>Character / Role *</span>
                  <input placeholder="e.g. Kalki" value={castForm.role} onChange={e => setCastForm(p => ({ ...p, role: e.target.value }))} style={input} />
                </div>
                <div>
                  <span style={label}>Photo</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={() => castPhotoRef.current?.click()} style={{ ...btn('#a855f7', true), padding: '10px 14px' }}>
                      {I.upload} Upload
                    </button>
                    <input ref={castPhotoRef} type="file" accept="image/*" onChange={handleCastPhotoUpload} style={{ display: 'none' }} />
                    {castForm.image && (
                      <img src={castForm.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #a855f7' }} />
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => {
                if (!castForm.name.trim()) { showToast('Name required', 'error'); return; }
                const updatedCast = [...(movie.castMembers ?? []), { id: `c${Date.now()}`, name: castForm.name, role: castForm.role, image: castForm.image }];
                updateMovie({ ...movie, castMembers: updatedCast });
                setCastForm({ name: '', role: '', image: '' });
                showToast(`${castForm.name} added to cast — visible on movie detail page!`);
              }} style={{ ...btn('#a855f7'), marginTop: '16px' }}>
                {I.plus} Add to Cast
              </button>
            </div>

            {/* Cast grid */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: 'white' }}>
                Current Cast ({(movie.castMembers ?? []).length} members)
                <span style={{ ...pill('#a855f7'), marginLeft: '10px', fontSize: '0.7rem' }}>Auto-visible on movie page</span>
              </h3>
              {(movie.castMembers ?? []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No cast members yet. Add some above.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '16px' }}>
                  {(movie.castMembers ?? []).map(c => (
                    <div key={c.id} style={{
                      ...card, padding: '16px', textAlign: 'center',
                      border: '1px solid rgba(168,85,247,0.2)',
                      transition: 'all 0.3s', position: 'relative',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                      <button onClick={() => {
                        const updatedCast = (movie.castMembers ?? []).filter(x => x.id !== c.id);
                        updateMovie({ ...movie, castMembers: updatedCast });
                        showToast(`${c.name} removed from cast`);
                      }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(255,20,80,0.15)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: '#ff1450', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {I.x}
                      </button>
                      {c.image ? (
                        <img src={c.image} alt={c.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(168,85,247,0.5)', marginBottom: '10px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'white' }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(168,85,247,0.8)', marginTop: '3px' }}>{c.role}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // ── THEATRES TAB ────────────────────────────────────────────────
  const TheatresTab = () => {
    const approvedTheatres = state.theatres ?? [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontWeight: '700', color: 'white' }}>⏳ Pending Approval Requests</h3>
              <span style={{ ...pill('#f5c518'), animation: 'ping 2s infinite' }}>{pendingRequests.length} pending</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingRequests.map((r: any) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: 'rgba(245,197,24,0.06)',
                  border: '1px solid rgba(245,197,24,0.2)', borderRadius: '12px', flexWrap: 'wrap', gap: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {r.theatreData?.image ? (
                      <img src={r.theatreData.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(245,197,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🏛️</div>
                    )}
                    <div>
                      <div style={{ fontWeight: '700', color: 'white' }}>{r.theatreData?.name ?? 'Unknown Theatre'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{r.theatreData?.city} · {r.theatreData?.screens?.length ?? 0} screens · Submitted {r.submittedAt?.split('T')[0]}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setReviewRequest(r); setAdminNote(''); }} style={btn('#00b4ff', true)}>{I.eye} Review</button>
                    <button onClick={() => { approveTheatreRequest(r.id); showToast(`${r.theatreData?.name} approved! Now live.`); }} style={btn('#00e5a0')}>{I.check} Approve</button>
                    <button onClick={() => { rejectTheatreRequest(r.id, 'Rejected by admin'); showToast('Request rejected', 'error'); }} style={btn('#ff1450', true)}>{I.x} Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved theatres */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'white' }}>✅ Approved Theatres ({approvedTheatres.length})</h3>
            <input placeholder="Search theatres…" value={theatreSearch} onChange={e => setTheatreSearch(e.target.value)} style={{ ...input, width: '200px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
            {approvedTheatres.filter(t => t.name.toLowerCase().includes(theatreSearch.toLowerCase())).map(t => (
              <div key={t.id} style={{
                background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.15)',
                borderRadius: '12px', overflow: 'hidden', transition: 'all 0.3s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                {t.image && <img src={t.image} alt={t.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                <div style={{ padding: '14px' }}>
                  <div style={{ fontWeight: '700', color: 'white', marginBottom: '4px' }}>{t.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
                    {I.map} {t.location} · {t.city}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={pill('#00b4ff')}>{t.screens?.length ?? 0} screens</span>
                    <span style={pill('#00e5a0')}>{state.bookings.filter(b => b.theatreId === t.id).length} bookings</span>
                    {t.amenities?.includes('IMAX') && <span style={pill('#f5c518')}>IMAX</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {approvedTheatres.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No approved theatres yet.</div>}
        </div>

        {/* Past decisions */}
        {(state.approvalRequests ?? []).filter((r: any) => r.status !== 'pending').length > 0 && (
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: 'white' }}>📋 Past Decisions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(state.approvalRequests ?? []).filter((r: any) => r.status !== 'pending').map((r: any) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ color: 'white', fontSize: '0.85rem' }}>{r.theatreData?.name}</span>
                  <span style={r.status === 'approved' ? pill('#00e5a0') : pill('#ff1450')}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── THEATRE OWNERS TAB ─────────────────────────────────────────
  const loadTheatreOwners = async () => {
    setToLoading(true);
    try {
      const res = await apiGetTheatreOwnerRequests(toFilter, toSearch);
      if (res.ok && res.data) {
        setToRequests(res.data.requests || []);
        setToCounts(res.data.counts || { all: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch { /* ignore */ }
    setToLoading(false);
  };

  const handleToApprove = async (id: string) => {
    const res = await apiApproveTheatreOwner(id);
    if (res.ok) { showToast('Theatre owner approved! ✅'); loadTheatreOwners(); setToDetail(null); }
    else showToast(res.message || 'Failed to approve', 'error');
  };

  const handleToReject = async (id: string) => {
    if (!toRejectReason.trim()) { showToast('Please provide a reason for rejection', 'error'); return; }
    const res = await apiRejectTheatreOwner(id, toRejectReason);
    if (res.ok) { showToast('Request rejected', 'info'); loadTheatreOwners(); setToDetail(null); setToRejectReason(''); }
    else showToast(res.message || 'Failed to reject', 'error');
  };

  const openToDetail = async (id: string) => {
    const res = await apiGetTheatreOwnerDetail(id);
    if (res.ok && res.data?.request) setToDetail(res.data.request);
    else showToast('Failed to load details', 'error');
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { if (tab === 'theatre-owners') loadTheatreOwners(); }, [tab, toFilter, toSearch]);

  const TheatreOwnersTab = () => {
    const statusColor: Record<string, string> = { pending: '#f59e0b', approved: '#00e5a0', rejected: '#ff1450' };
    const filters = [
      { key: 'all', label: 'All', count: toCounts.all },
      { key: 'pending', label: 'Pending', count: toCounts.pending },
      { key: 'approved', label: 'Approved', count: toCounts.approved },
      { key: 'rejected', label: 'Rejected', count: toCounts.rejected },
    ];

    const handleExportCSV = () => {
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Theatre', 'City', 'Status', 'Submitted Date'];
      const rows = toRequests.map((r: any) => [
        r._id || r.id,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        r.email,
        r.phone,
        `"${(r.theatreName || '').replace(/"/g, '""')}"`,
        r.theatreCity,
        r.status,
        r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-IN') : 'N/A'
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TheatreOwners_Requests_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>🏢 Theatre Owner Registrations</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>Manage theatre owner applications and approvals</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {toCounts.pending > 0 && (
              <span style={{ ...pill('#f59e0b'), fontSize: '0.8rem', padding: '5px 14px', animation: 'ping 2s infinite' }}>
                🔔 {toCounts.pending} Pending
              </span>
            )}
            <button onClick={handleExportCSV} style={{ ...btn('#f5c518', true), padding: '8px 14px', fontSize: '0.8rem' }}>
              {I.download} Export CSV
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setToFilter(f.key)}
              style={{
                padding: '8px 18px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                background: toFilter === f.key ? `${statusColor[f.key] || '#00b4ff'}22` : 'rgba(255,255,255,0.03)',
                border: toFilter === f.key ? `1px solid ${statusColor[f.key] || '#00b4ff'}55` : '1px solid rgba(255,255,255,0.07)',
                color: toFilter === f.key ? (statusColor[f.key] || '#00b4ff') : 'rgba(255,255,255,0.5)',
              }}
            >
              {f.label}
              <span style={{
                padding: '1px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
                background: toFilter === f.key ? `${statusColor[f.key] || '#00b4ff'}33` : 'rgba(255,255,255,0.06)',
                color: toFilter === f.key ? (statusColor[f.key] || '#00b4ff') : 'rgba(255,255,255,0.35)',
              }}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>{I.search}</span>
          <input placeholder="Search by name, email or theatre..." value={toSearch} onChange={e => setToSearch(e.target.value)}
            style={{ ...input, paddingLeft: '38px' }} />
        </div>

        {/* Loading */}
        {toLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px', animation: 'ping 1s infinite' }}>⏳</div>
            Loading theatre owner requests...
          </div>
        )}

        {/* Table */}
        {!toLoading && (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['#', 'Owner', 'Theatre', 'City', 'Status', 'Submitted', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toRequests.map((r: any, i: number) => (
                  <tr key={r._id || r.id || i} className="admin-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>{(r.name || '?')[0]}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'white', fontSize: '0.85rem' }}>{r.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{r.theatreName}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{r.theatreCity}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={pill(statusColor[r.status] || '#888')}>
                        {r.status === 'pending' ? '⏳' : r.status === 'approved' ? '✅' : '❌'} {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openToDetail(r._id || r.id)} style={{ ...btn('#00b4ff', true), padding: '5px 10px', fontSize: '0.75rem' }}>{I.eye} View</button>
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => handleToApprove(r._id || r.id)} style={{ ...btn('#00e5a0'), padding: '5px 10px', fontSize: '0.75rem' }}>{I.check}</button>
                            <button onClick={() => openToDetail(r._id || r.id)} style={{ ...btn('#ff1450', true), padding: '5px 10px', fontSize: '0.75rem' }}>{I.x}</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {toRequests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏢</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>No {toFilter !== 'all' ? toFilter : ''} registrations found</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Theatre owner registrations will appear here</div>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {toDetail && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }} onClick={() => { setToDetail(null); setToRejectReason(''); }}>
            <div style={{ ...card, width: '100%', maxWidth: '640px', background: 'rgba(8,8,28,0.98)', border: '1px solid rgba(245,158,11,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {toDetail.avatar ? (
                    <img src={toDetail.avatar} alt="Profile" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(245,158,11,0.4)' }} />
                  ) : (
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800, color: '#f59e0b' }}>{(toDetail.name || '?')[0]}</div>
                  )}
                  <div>
                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 800 }}>{toDetail.name}</h2>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{toDetail.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={pill(statusColor[toDetail.status] || '#888')}>{toDetail.status}</span>
                  <button onClick={() => { setToDetail(null); setToRejectReason(''); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 32, height: 32, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.x}</button>
                </div>
              </div>
              {/* Document Grids */}
              <h4 style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:1, margin:'0 0 10px' }}>Business Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Email', val: toDetail.email },
                  { label: 'Phone', val: toDetail.phone },
                  { label: 'Theatre', val: toDetail.theatreName },
                  { label: 'Location', val: (toDetail.theatreCity || '') + ' - ' + (toDetail.theatreLocation || '') },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                    <div style={{ fontWeight: '700', color: 'white', fontSize: '0.88rem' }}>{f.val || '—'}</div>
                  </div>
                ))}
              </div>

              <h4 style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:1, margin:'0 0 10px' }}>Compliance Documents</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Aadhaar', val: toDetail.aadhaarNumber },
                  { label: 'PAN Number', val: toDetail.panNumber },
                  { label: 'GST Number', val: toDetail.gstNumber },
                  { label: 'License Number', val: toDetail.licenseNumber },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                    <div style={{ fontWeight: '700', color: 'white', fontSize: '0.88rem' }}>{f.val || '—'}</div>
                  </div>
                ))}
              </div>

              <h4 style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:1, margin:'0 0 10px' }}>Bank Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Account Holder', val: toDetail.bankAccountHolder },
                  { label: 'Bank Name', val: toDetail.bankName },
                  { label: 'Account Number', val: toDetail.bankAccountNumber },
                  { label: 'IFSC Code', val: toDetail.bankIfsc },
                  { label: 'Branch', val: toDetail.bankBranch },
                  { label: 'UPI ID', val: toDetail.upiId },
                  { label: 'Submitted Date', val: toDetail.submittedAt ? new Date(toDetail.submittedAt).toLocaleDateString('en-IN') : '—' },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                    <div style={{ fontWeight: '700', color: 'white', fontSize: '0.88rem' }}>{f.val || '—'}</div>
                  </div>
                ))}
              </div>
              {toDetail.status === 'pending' && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={label}>Rejection Reason (required to reject)</span>
                    <textarea placeholder="Reason for rejection..." value={toRejectReason} onChange={e => setToRejectReason(e.target.value)}
                      style={{ ...input, minHeight: '60px', resize: 'vertical' } as React.CSSProperties} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setToDetail(null); setToRejectReason(''); }} style={{ ...btn('rgba(255,255,255,0.1)', true), flex: 1, justifyContent: 'center' }}>Close</button>
                    <button onClick={() => handleToReject(toDetail._id || toDetail.id)} style={{ ...btn('#ff1450', true), flex: 1, justifyContent: 'center' }}>{I.x} Reject</button>
                    <button onClick={() => handleToApprove(toDetail._id || toDetail.id)} style={{ ...btn('#00e5a0'), flex: 2, justifyContent: 'center' }}>{I.check} Approve</button>
                  </div>
                </div>
              )}
              {toDetail.status !== 'pending' && (
                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <button onClick={() => { setToDetail(null); setToRejectReason(''); }} style={{ ...btn('#00b4ff', true), flex: 1, justifyContent: 'center' }}>Close</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── SHOWS TAB ───────────────────────────────────────────────────
  const ShowsTab = () => {
    const allCities = [...new Set((state.theatres ?? []).map((t: any) => t.city).filter(Boolean))];
    const filteredTheatres = showForm.city
      ? (state.theatres ?? []).filter((t: any) => t.city === showForm.city)
      : (state.theatres ?? []);
    const theatre = state.theatres?.find((t: any) => t.id === showForm.theatreId);
    const TIMES = ['09:00 AM', '11:00 AM', '12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM', '08:00 PM', '09:30 PM', '11:00 PM'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Add show form */}
        <div style={card}>
          <h3 style={{ margin: '0 0 20px', fontWeight: '700', color: 'white' }}>📅 Schedule New Show</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px' }}>
            <div>
              <span style={label}>Movie *</span>
              <select value={showForm.movieId} onChange={e => setShowForm(p => ({ ...p, movieId: e.target.value }))} style={input}>
                <option value="">Select Movie</option>
                {state.movies.filter((m: any) => m.isNowShowing).map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>City</span>
              <select value={showForm.city} onChange={e => setShowForm(p => ({ ...p, city: e.target.value, theatreId: '', screenId: '' }))} style={input}>
                <option value="">All Cities</option>
                {allCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>Theatre *</span>
              <select value={showForm.theatreId} onChange={e => setShowForm(p => ({ ...p, theatreId: e.target.value, screenId: '' }))} style={input}>
                <option value="">Select Theatre</option>
                {filteredTheatres.map((t: any) => <option key={t.id} value={t.id}>{t.name} — {t.city}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>Screen</span>
              <select value={showForm.screenId} onChange={e => setShowForm(p => ({ ...p, screenId: e.target.value }))} style={input}>
                <option value="">Select Screen (optional)</option>
                {(theatre?.screens ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>Date</span>
              <input type="date" value={showForm.date} min={today} onChange={e => setShowForm(p => ({ ...p, date: e.target.value }))} style={input} />
            </div>
            <div>
              <span style={label}>Language</span>
              <select value={showForm.language} onChange={e => setShowForm(p => ({ ...p, language: e.target.value }))} style={input}>
                {['Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Bengali', 'Punjabi'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>Format</span>
              <select value={showForm.format} onChange={e => setShowForm(p => ({ ...p, format: e.target.value }))} style={input}>
                {['2D', '3D', 'IMAX', '4DX', 'Dolby', '4K'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <span style={label}>Show Time *</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {TIMES.map(t => (
                <button key={t} onClick={() => setShowForm(p => ({ ...p, time: t }))} style={{
                  ...btn(showForm.time === t ? '#fb923c' : 'rgba(255,255,255,0.1)', showForm.time !== t),
                  padding: '6px 12px', fontSize: '0.78rem',
                  background: showForm.time === t ? 'linear-gradient(135deg,#fb923c,#f59e0b)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${showForm.time === t ? '#fb923c44' : 'rgba(255,255,255,0.1)'}`,
                }}>{t}</button>
              ))}
            </div>
          </div>
          {/* Ticket prices */}
          <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {(['normal', 'silver', 'gold', 'premium'] as const).map(cat => (
              <div key={cat}>
                <span style={label}>₹ {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                <input type="number" value={showForm.prices[cat]} onChange={e => setShowForm(p => ({ ...p, prices: { ...p.prices, [cat]: Number(e.target.value) } }))} style={input} />
              </div>
            ))}
          </div>
          <button onClick={handleAddShow} style={{ ...btn('#fb923c'), marginTop: '16px', padding: '12px 28px', fontSize: '0.95rem' }}>
            {I.plus} Schedule Show
          </button>
        </div>

        {/* Shows list */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'white' }}>All Scheduled Shows ({allShows.length})</h3>
            <input placeholder="Filter by movie…" value={showsFilter} onChange={e => setShowsFilter(e.target.value)} style={{ ...input, width: '200px' }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Movie', 'Theatre', 'Date', 'Time', 'Lang', 'Format', 'Seats', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allShows.filter(s => {
                  const m = state.movies.find((x: any) => x.id === s.movieId);
                  return !showsFilter || m?.title.toLowerCase().includes(showsFilter.toLowerCase());
                }).slice(0, 30).map((s: any) => {
                  const m = state.movies.find((x: any) => x.id === s.movieId);
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.83rem', color: 'white' }}>{m?.title ?? '—'}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{s._theatreName ?? '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{s.date || 'Any'}</td>
                      <td style={{ padding: '10px 14px' }}><span style={pill('#fb923c')}>{s.time}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={pill('#00b4ff')}>{s.language}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={pill('#a855f7')}>{s.format}</span></td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{s.availableSeats ?? '—'}/{s.totalSeats ?? '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={s.isEnded ? pill('#ff1450') : pill('#00e5a0')}>{s.isEnded ? 'Ended' : 'Live'}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {!s.isEnded && (
                          <button onClick={() => {
                            endShowTime(s._theatreId, s.id);
                            showToast('Show ended', 'info');
                          }} style={{ ...btn('#ff1450', true), padding: '4px 8px', fontSize: '0.72rem' }}>End</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {allShows.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No shows scheduled yet. Add one above.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── BOOKINGS TAB ────────────────────────────────────────────────
  const BookingsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '14px' }}>
        {[
          { label: 'Total', val: state.bookings.length, color: '#00b4ff' },
          { label: 'Confirmed', val: confirmedBookings.length, color: '#00e5a0' },
          { label: 'Cancelled', val: state.bookings.filter(b => b.status === 'cancelled').length, color: '#ff1450' },
          { label: 'Revenue', val: `₹${(totalRevenue / 1000).toFixed(0)}K`, color: '#f5c518' },
        ].map((s, i) => (
          <div key={i} style={{ ...card, textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>{I.search}</span>
          <input placeholder="Search bookings…" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} style={{ ...input, paddingLeft: '38px' }} />
        </div>
        {(['all', 'confirmed', 'cancelled', 'pending'] as const).map(f => (
          <button key={f} onClick={() => setBookingFilter(f)} style={{
            ...btn(bookingFilter === f ? '#00b4ff' : 'rgba(255,255,255,0.1)', bookingFilter !== f),
            padding: '8px 14px', textTransform: 'capitalize', fontSize: '0.8rem',
            background: bookingFilter === f ? 'linear-gradient(135deg,#00b4ff,#0080cc)' : 'rgba(255,255,255,0.05)',
          }}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['Booking ID', 'User', 'Movie', 'Theatre', 'Date', 'Seats', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.slice(0, 25).map(b => {
                const m = state.movies.find(x => x.id === b.movieId);
                const u = state.users.find(x => x.id === b.userId);
                const th = state.theatres?.find(x => x.id === b.theatreId);
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{b.id.slice(-10).toUpperCase()}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.83rem', color: 'white' }}>{u?.name ?? 'Guest'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.83rem', color: 'white' }}>{m?.title ?? '—'}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{th?.name ?? '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{b.bookingDate?.split('T')[0]}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{b.seats?.length ?? 0} seats</td>
                    <td style={{ padding: '12px 14px' }}><span style={{ color: '#f5c518', fontWeight: '700', fontSize: '0.85rem' }}>₹{b.totalAmount}</span></td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={b.status === 'confirmed' ? pill('#00e5a0') : b.status === 'cancelled' ? pill('#ff1450') : pill('#f5c518')}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {b.status === 'confirmed' && (
                        <button onClick={() => setCancelBookingId(b.id)} style={{ ...btn('#ff1450', true), padding: '4px 8px', fontSize: '0.72rem' }}>
                          Cancel+Refund
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredBookings.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No bookings found.</div>}
      </div>
    </div>
  );

  // ── OFFERS TAB ──────────────────────────────────────────────────
  const OffersTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={openAddCoupon} style={btn('#f5c518')}>{I.plus} Create Coupon</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
        {state.coupons.map(c => (
          <div key={c.id} style={{
            ...card,
            background: `linear-gradient(135deg,rgba(245,197,24,0.06),rgba(0,0,0,0))`,
            border: `1px solid rgba(245,197,24,0.15)`,
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.3s',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#f5c518,#fb923c)' }} />
            <div style={{ position: 'absolute', top: '12px', right: '12px', opacity: 0.08, fontSize: '4rem', fontWeight: '900', color: '#f5c518' }}>%</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1.1rem', color: '#f5c518', letterSpacing: '2px', background: 'rgba(245,197,24,0.1)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>{c.code}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>{c.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f5c518' }}>{c.discount}%</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>OFF</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={pill('#00b4ff')}>Max ₹{c.maxDiscount}</span>
              <span style={pill('#a855f7')}>Min ₹{c.minAmount}</span>
              <span style={pill(c.isActive ? '#00e5a0' : '#ff1450')}>{c.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                <span>Usage: {(c as any).usedCount ?? 0}/{(c as any).usageLimit ?? '∞'}</span>
                <span>Expires: {c.validTill}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '4px' }}>
                <div style={{ background: 'linear-gradient(90deg,#f5c518,#fb923c)', height: '4px', borderRadius: '4px', width: `${Math.min(((c as any).usedCount ?? 0) / ((c as any).usageLimit || 1) * 100, 100)}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditingCoupon(c); setCouponForm({ ...c }); setShowCouponModal(true); }} style={{ ...btn('#00b4ff', true), flex: 1, justifyContent: 'center' }}>{I.edit} Edit</button>
              <button onClick={() => { updateCoupon({ ...c, isActive: !c.isActive }); showToast(c.isActive ? 'Coupon deactivated' : 'Coupon activated'); }} style={{ ...btn(c.isActive ? '#f5c518' : '#00e5a0', true), flex: 1, justifyContent: 'center' }}>
                {c.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => { if (window.confirm('Delete?')) { deleteCoupon(c.id); showToast('Coupon deleted'); } }} style={{ ...btn('#ff1450', true), padding: '8px 10px' }}>{I.trash}</button>
            </div>
          </div>
        ))}
      </div>
      {state.coupons.length === 0 && <div style={{ ...card, textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>No coupons yet. Create one above.</div>}
    </div>
  );

  // ── ANALYTICS TAB ───────────────────────────────────────────────
  const AnalyticsTab = () => {
    const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow'];
    const cityData = cities.map(c => ({ city: c, val: Math.floor(Math.random() * 100) + 20 }));
    const maxCity = Math.max(...cityData.map(c => c.val));
    const hours = Array.from({ length: 12 }, (_, i) => ({ h: `${i * 2}:00`, val: Math.floor(Math.random() * 80) + 10 }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Revenue chart */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'white' }}>📈 7-Day Revenue Trend</h3>
            <span style={pill('#00b4ff')}>This Week</span>
          </div>
          <RevenueChart />
        </div>

        {/* City + Peak time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: 'white' }}>🗺️ City-wise Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cityData.sort((a, b) => b.val - a.val).map((c, i) => (
                <div key={c.city}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{c.city}</span>
                    <span style={{ color: '#00b4ff', fontWeight: '700' }}>{c.val}K</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '8px' }}>
                    <div style={{
                      background: `linear-gradient(90deg,#00b4ff,${i < 2 ? '#f5c518' : '#00e5a0'})`,
                      height: '8px', borderRadius: '6px',
                      width: `${(c.val / maxCity) * 100}%`,
                      transition: 'width 1s ease',
                      boxShadow: `0 0 8px rgba(0,180,255,0.4)`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontWeight: '700', color: 'white' }}>⏰ Peak Booking Hours</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
              {hours.map(h => (
                <div key={h.h} style={{ textAlign: 'center' }}>
                  <div style={{
                    height: `${(h.val / 100) * 80}px`, minHeight: '8px',
                    background: `linear-gradient(to top,#00b4ff,#a855f7)`,
                    borderRadius: '4px 4px 0 0',
                    opacity: 0.6 + h.val / 200,
                    boxShadow: '0 0 6px rgba(0,180,255,0.3)',
                    marginBottom: '4px',
                  }} />
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>{h.h}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '16px' }}>
          {[
            { label: 'Monthly Revenue', val: `₹${(totalRevenue * 4 / 1000).toFixed(0)}K`, color: '#f5c518', icon: '💰' },
            { label: 'Monthly Bookings', val: state.bookings.length * 4, color: '#00b4ff', icon: '🎟️' },
            { label: 'Avg Ticket Price', val: `₹${state.bookings.length > 0 ? (totalRevenue / state.bookings.length).toFixed(0) : 0}`, color: '#00e5a0', icon: '💳' },
            { label: 'Most Booked', val: state.movies[0]?.title?.split(' ')[0] ?? '—', color: '#a855f7', icon: '🎬' },
          ].map((s, i) => (
            <div key={i} style={{ ...card, padding: '20px' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── USERS TAB ───────────────────────────────────────────────────
  const UsersTab = () => {
    const handleExportCSV = () => {
      const headers = ['ID', 'Name', 'Email', 'Role', 'Bookings', 'Spent', 'Status', 'Registered'];
      const rows = filteredUsers.map(u => {
        const uBookings = state.bookings.filter(b => b.userId === u.id);
        const spent = uBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.totalAmount, 0);
        return [
          u.id || u._id,
          `"${(u.name || '').replace(/"/g, '""')}"`,
          u.email,
          u.role,
          uBookings.length,
          spent,
          blockedUsers.has(u.id) ? 'Blocked' : 'Active',
          new Date(u.createdAt || Date.now()).toLocaleDateString('en-IN')
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CineConnect_Users_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>{I.search}</span>
            <input placeholder="Search users by name or email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ ...input, paddingLeft: '38px', width: '100%' }} />
          </div>
          <button onClick={handleExportCSV} style={{ ...btn('#00e5a0', true), padding: '10px 18px' }}>
            {I.download} Export CSV
          </button>
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['User', 'Email', 'Role', 'Bookings', 'Spent', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const userBookings = state.bookings.filter(b => b.userId === u.id);
                const spent = userBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.totalAmount, 0);
                const isBlocked = blockedUsers.has(u.id);
                const roleColor = u.role === 'admin' ? '#ff1450' : u.role === 'theatre_owner' ? '#f5c518' : '#00b4ff';
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: isBlocked ? 0.5 : 1 }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: `linear-gradient(135deg,${roleColor},${roleColor}88)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '800', fontSize: '0.9rem', color: 'white',
                          boxShadow: `0 0 10px ${roleColor}44`, flexShrink: 0, overflow: 'hidden'
                        }}>
                          {u.profilePic ? <img src={u.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white' }}>{u.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}><span style={pill(roleColor)}>{u.role.replace('_', ' ')}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{userBookings.length}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ color: '#f5c518', fontWeight: '700', fontSize: '0.85rem' }}>₹{spent}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={isBlocked ? pill('#ff1450') : pill('#00e5a0')}>{isBlocked ? 'Blocked' : 'Active'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setSelectedUser({ ...u, userBookings, spent, isBlocked, roleColor })} style={{ ...btn('#00b4ff', true), padding: '5px 10px', fontSize: '0.75rem' }}>
                          {I.eye} View
                        </button>
                        {u.role !== 'admin' && (
                          <button onClick={() => {
                            setBlockedUsers(p => { const n = new Set(p); isBlocked ? n.delete(u.id) : n.add(u.id); return n; });
                            showToast(isBlocked ? `${u.name} unblocked` : `${u.name} blocked`, isBlocked ? 'success' : 'error');
                          }} style={{ ...btn(isBlocked ? '#00e5a0' : '#ff1450', true), padding: '5px 10px', fontSize: '0.75rem' }}>
                            {isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected User Modal */}
        {selectedUser && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }} onClick={() => setSelectedUser(null)}>
            <div style={{ ...card, width: '100%', maxWidth: '800px', background: 'rgba(8,8,28,0.98)', border: '1px solid rgba(0,180,255,0.2)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: `linear-gradient(135deg,${selectedUser.roleColor},${selectedUser.roleColor}55)`,
                    border: `2px solid ${selectedUser.roleColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.5rem', fontWeight: '800', color: 'white', overflow: 'hidden'
                  }}>
                    {(selectedUser.avatar || selectedUser.profilePic) ? <img src={selectedUser.avatar || selectedUser.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>{selectedUser.name}</h2>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '4px' }}>{selectedUser.email}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <span style={pill(selectedUser.roleColor)}>{selectedUser.role.replace('_', ' ')}</span>
                      <span style={selectedUser.isBlocked ? pill('#ff1450') : pill('#00e5a0')}>{selectedUser.isBlocked ? 'Blocked' : 'Active'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 32, height: 32, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.x}</button>
              </div>

              {/* Full Registration Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Phone Number', val: selectedUser.phone },
                  { label: 'Date of Birth', val: selectedUser.dob },
                  { label: 'Gender', val: selectedUser.gender },
                  { label: 'Address', val: selectedUser.address },
                  { label: 'City / State / PIN', val: [selectedUser.city, selectedUser.state, selectedUser.pincode].filter(Boolean).join(', ') },
                  { label: 'Registration Date', val: new Date(selectedUser.createdAt || Date.now()).toLocaleDateString('en-IN') },
                  { label: 'Last Login', val: selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('en-IN') : 'N/A' },
                  { label: 'Total Spent', val: `₹${selectedUser.spent}` },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                    <div style={{ fontWeight: '700', color: 'white', fontSize: '0.85rem', marginTop: '4px' }}>{f.val || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Booking History Table */}
              <div style={{ flex: 1, minHeight: '300px' }}>
                <h3 style={{ marginTop: 0, color: 'white', fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>🎟️ Booking History ({selectedUser.userBookings.length})</h3>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {['Date', 'Movie', 'Theatre', 'Amount', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.userBookings.length > 0 ? selectedUser.userBookings.map((b: any) => {
                        const m = state.movies.find((x: any) => x.id === b.movieId);
                        const th = state.theatres?.find((x: any) => x.id === b.theatreId);
                        return (
                          <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{b.bookingDate?.split('T')[0]}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>{m?.title || '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{th?.name || '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#f5c518', fontWeight: 700 }}>₹{b.totalAmount}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={b.status === 'confirmed' ? pill('#00e5a0') : b.status === 'cancelled' ? pill('#ff1450') : pill('#f5c518', 'transparent')}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>No bookings yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  // ── REPORTS TAB ─────────────────────────────────────────────────
  const ReportsTab = () => {
    const types = ['revenue', 'bookings', 'users'];
    const ranges = ['today', 'week', 'month'];
    const reportData = filteredBookings.slice(0, 10);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Controls */}
        <div style={{ ...card, display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {types.map(t => (
              <button key={t} onClick={() => setReportType(t)} style={{
                ...btn(reportType === t ? '#00b4ff' : 'rgba(255,255,255,0.1)', reportType !== t),
                background: reportType === t ? 'linear-gradient(135deg,#00b4ff,#0080cc)' : 'rgba(255,255,255,0.05)',
                padding: '8px 16px', textTransform: 'capitalize',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {ranges.map(r => (
              <button key={r} onClick={() => setReportRange(r)} style={{
                ...btn(reportRange === r ? '#f5c518' : 'rgba(255,255,255,0.1)', reportRange !== r),
                background: reportRange === r ? 'linear-gradient(135deg,#f5c518,#fb923c)' : 'rgba(255,255,255,0.05)',
                padding: '8px 14px', textTransform: 'capitalize',
                color: reportRange === r ? '#030308' : 'rgba(255,255,255,0.7)',
              }}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
            ))}
          </div>
          <button onClick={() => showToast('Report exported as CSV!', 'info')} style={{ ...btn('#00e5a0', true), marginLeft: 'auto' }}>
            {I.download} Export CSV
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '14px' }}>
          {[
            { label: 'Total Revenue', val: `₹${(totalRevenue / 1000).toFixed(0)}K`, color: '#f5c518' },
            { label: 'Total Bookings', val: state.bookings.length, color: '#00b4ff' },
            { label: 'Confirmed', val: confirmedBookings.length, color: '#00e5a0' },
            { label: 'Cancelled', val: state.bookings.filter(b => b.status === 'cancelled').length, color: '#ff1450' },
          ].map((s, i) => (
            <div key={i} style={{ ...card, textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Report table */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'white', fontWeight: '700' }}>
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — {reportRange.charAt(0).toUpperCase() + reportRange.slice(1)}
            </h3>
            <span style={pill('#00b4ff')}>{reportData.length} records</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Booking ID', 'Movie', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{b.id.slice(-10).toUpperCase()}</td>
                    <td style={{ padding: '10px 16px', fontSize: '0.83rem', color: 'white' }}>{state.movies.find(m => m.id === b.movieId)?.title ?? '—'}</td>
                    <td style={{ padding: '10px 16px' }}><span style={{ color: '#f5c518', fontWeight: '700' }}>₹{b.totalAmount}</span></td>
                    <td style={{ padding: '10px 16px' }}><span style={b.status === 'confirmed' ? pill('#00e5a0') : b.status === 'cancelled' ? pill('#ff1450') : pill('#f5c518')}>{b.status}</span></td>
                    <td style={{ padding: '10px 16px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{b.bookingDate?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── PAYOUTS TAB ──────────────────────────────────────────────────
  const PayoutsTab = () => {

    const completePayout = async (e: React.FormEvent) => {
       e.preventDefault();
       if (!payoutForm) return;
       const res = await apiMarkPayoutPaid({
          ownerId: payoutForm.ownerId,
          amount: Number(payoutForm.amount),
          transactionId: payoutForm.transactionId,
          paymentMethod: payoutForm.paymentMethod,
          adminNote: payoutForm.adminNote,
       });

       if (res.ok) {
           showToast('Payout specifically marked as paid! ✅');
           setPayoutForm(null);
           loadPayouts();
       } else {
           showToast(res.message || 'Error processing payout', 'error');
       }
    };

    const toggleRow = (id: string) => setPayoutExpandedRows(p => ({...p, [id]: !p[id]}));

    const totalPlatformGross = adminPayouts.reduce((sum, o) => sum + o.totalGross, 0);
    const totalPlatformComm = adminPayouts.reduce((sum, o) => sum + o.totalAdminCommission, 0);
    const totalSettled = adminPayouts.reduce((sum, o) => sum + o.alreadyPaid, 0);
    const totalPending = adminPayouts.reduce((sum, o) => sum + o.pendingBalance, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>💳 Theatre Payout Management</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>Real-time aggregated earnings and commission settlements</p>
          </div>
          <button onClick={loadPayouts} style={{ ...btn('rgba(255,255,255,0.1)'), padding: '6px 12px' }}>🔄 Refresh</button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ ...card, padding: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Total Gross Sales</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: 4 }}>₹{totalPlatformGross.toLocaleString()}</div>
            </div>
            <div style={{ ...card, padding: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Total Commission</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ff1450', marginTop: 4 }}>₹{totalPlatformComm.toLocaleString()}</div>
            </div>
            <div style={{ ...card, padding: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Total Amount Settled</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00e5a0', marginTop: 4 }}>₹{totalSettled.toLocaleString()}</div>
            </div>
            <div style={{ ...card, padding: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Total Outstanding Pend.</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f5c518', marginTop: 4 }}>₹{totalPending.toLocaleString()}</div>
            </div>
        </div>

        {payoutLoading ? (
           <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>⏳ Loading full payout summaries...</div>
        ) : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Theatre Owner', 'Gross Revenue', 'Admin Comm', 'Net Payable', 'Already Paid', 'Pending Balance', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminPayouts.length > 0 ? adminPayouts.map((o, i) => {
                  const expanded = payoutExpandedRows[o.ownerId];
                  return (
                    <React.Fragment key={o.ownerId || i}>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: expanded ? 'rgba(255,255,255,0.02)' : 'none' }} onClick={() => toggleRow(o.ownerId)}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <div style={{ width:32, height:32, borderRadius:'50%', background:'#333', overflow:'hidden', flexShrink:0 }}>
                               <img src={o.ownerAvatar || 'https://ui-avatars.com/api/?name=' + o.ownerName} alt="." style={{width:'100%', height:'100%', objectFit:'cover'}} onError={e=>{ (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + o.ownerName; }} />
                           </div>
                           <div>
                             <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>{o.ownerName} <span style={{color:'rgba(255,255,255,0.3)',fontSize:'0.7rem'}}>{expanded?'▼':'▶'}</span></div>
                             <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{o.theatreName}</div>
                           </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>₹{o.totalGross.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#ff1450', fontWeight: 700 }}>₹{o.totalAdminCommission.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#00e5a0', fontWeight: 700 }}>₹{o.totalNetPayable.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>₹{o.alreadyPaid.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#f5c518', fontWeight: 800 }}>₹{o.pendingBalance.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                         {o.pendingBalance > 0 ? (
                            <button onClick={() => setPayoutForm({ ownerId: o.ownerId, amount: o.pendingBalance, bank: o.bankDetails })} style={{ ...btn('#f5c518', true), padding:'6px 12px', fontSize:'0.75rem' }}>Mark Paid</button>
                         ) : (
                            <span style={pill('#00e5a0')}>Settled</span>
                         )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <td colSpan={7} style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', gap: '24px' }}>
                            {/* Bank Details section */}
                            <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Bank Details</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'white' }}><span style={{color:'rgba(255,255,255,0.4)'}}>Holder:</span> {o.bankDetails?.holder || 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'white' }}><span style={{color:'rgba(255,255,255,0.4)'}}>Bank:</span> {o.bankDetails?.bank || 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'white' }}><span style={{color:'rgba(255,255,255,0.4)'}}>A/C No:</span> {o.bankDetails?.account || 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'white' }}><span style={{color:'rgba(255,255,255,0.4)'}}>IFSC:</span> {o.bankDetails?.ifsc || 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'white' }}><span style={{color:'rgba(255,255,255,0.4)'}}>Branch:</span> {o.bankDetails?.branch || 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#00e5a0' }}><span style={{color:'rgba(255,255,255,0.4)'}}>UPI:</span> {o.bankDetails?.upi || 'N/A'}</div>
                                </div>
                            </div>
                            {/* Show Wise Breakdown */}
                            <div style={{ flex: 2 }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Show Breakdown</h4>
                                <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '6px', textAlign: 'left', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Movie</th>
                                                <th style={{ padding: '6px', textAlign: 'left', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Date & Time</th>
                                                <th style={{ padding: '6px', textAlign: 'right', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Gross</th>
                                                <th style={{ padding: '6px', textAlign: 'right', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Comm</th>
                                                <th style={{ padding: '6px', textAlign: 'right', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Net</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {o.showWiseReport?.map((s: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td style={{ padding: '6px', fontSize: '0.75rem', color: 'white', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.movieName}</td>
                                                    <td style={{ padding: '6px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{s.date} {s.time}</td>
                                                    <td style={{ padding: '6px', fontSize: '0.75rem', color: 'white', textAlign: 'right' }}>₹{s.grossAmount}</td>
                                                    <td style={{ padding: '6px', fontSize: '0.75rem', color: '#ff1450', textAlign: 'right' }}>-₹{s.commission}</td>
                                                    <td style={{ padding: '6px', fontSize: '0.75rem', color: '#00e5a0', textAlign: 'right', fontWeight: 'bold' }}>₹{s.netEarnings}</td>
                                                </tr>
                                            ))}
                                            {(!o.showWiseReport || o.showWiseReport.length === 0) && (
                                                <tr><td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>No show data available</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  )
                }) : (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No approved theatre owners found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payout Processing Modal */}
        {payoutForm && (
           <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={(e) => { if (e.target === e.currentTarget) setPayoutForm(null) }}>
              <div style={{ background:'#1a1a2e', padding:'24px', borderRadius:'20px', width:'90%', maxWidth:'400px', border:'1px solid rgba(255,255,255,0.1)' }}>
                 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                    <h3 style={{ margin: 0, color:'white', fontSize:'1.2rem' }}>💸 Process Payout</h3>
                    <button onClick={() => setPayoutForm(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
                 </div>
                 <div>
                    <div style={{ background:'rgba(255,255,255,0.03)', padding:'14px', borderRadius:'10px', marginBottom:'16px' }}>
                       <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.5)', marginBottom:4 }}>Bank Details</div>
                       <div style={{ fontSize:'0.85rem', color:'white', fontWeight:600 }}>{payoutForm.bank?.bank || 'N/A'} - {payoutForm.bank?.branch || ''}</div>
                       <div style={{ fontSize:'0.85rem', color:'white' }}>A/C: {payoutForm.bank?.account || 'N/A'} | IFSC: {payoutForm.bank?.ifsc || 'N/A'}</div>
                       <div style={{ fontSize:'0.85rem', color:'white' }}>Holder: {payoutForm.bank?.holder || 'N/A'}</div>
                       {payoutForm.bank?.upi && <div style={{ fontSize:'0.8rem', color:'#00e5a0', marginTop:4 }}>UPI: {payoutForm.bank.upi}</div>}
                    </div>
                    <form onSubmit={completePayout}>
                        <div style={{ marginBottom: '12px' }}>
                          <span style={label}>Amount to Pay (₹)</span>
                          <input type="number" required value={payoutForm.amount} onChange={e => setPayoutForm({ ...payoutForm, amount: Number(e.target.value) })} style={input} max={payoutForm.amount} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <span style={label}>Payment Method</span>
                          <select value={payoutForm.paymentMethod || 'Bank Transfer'} onChange={e => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })} style={input}>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="UPI">UPI</option>
                              <option value="Razorpay">Razorpay Checkout</option>
                              <option value="Cash">Cash</option>
                          </select>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <span style={label}>Transaction ID (Optional)</span>
                          <input type="text" placeholder="e.g. UTR / UPI Ref" value={payoutForm.transactionId || ''} onChange={e => setPayoutForm({ ...payoutForm, transactionId: e.target.value })} style={input} />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <span style={label}>Admin Notes</span>
                          <input type="text" placeholder="Monthly settlement..." value={payoutForm.adminNote || ''} onChange={e => setPayoutForm({ ...payoutForm, adminNote: e.target.value })} style={input} />
                        </div>
                        <button type="submit" style={{ ...btn('#f5c518'), width: '100%', justifyContent: 'center' }}>Confirm Payment of ₹{payoutForm.amount}</button>
                    </form>
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  };

  // ── SETTINGS TAB ────────────────────────────────────────────────
  const SettingsTab = () => {
    const handleSaveSettings = async () => {
       const res = await apiUpdateSettings({ adminCommissionPercentage: settings.adminCommissionPercentage });
       if (res.ok) {
           showToast('Platform settings saved globally! ✅');
       } else {
           showToast('Failed to save settings: ' + res.message, 'error');
           // Revert back local state from API on failure
           const fresh = await apiGetSettings();
           if (fresh.ok && fresh.data?.settings) {
               setSettings(p => ({ ...p, adminCommissionPercentage: fresh.data.settings.adminCommissionPercentage }));
           }
       }
    };

    return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Platform */}
      <div style={card}>
        <h3 style={{ margin: '0 0 20px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>{I.gear} Platform Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { key: 'siteName', label: 'Site Name', type: 'text' },
            { key: 'currency', label: 'Currency', type: 'text' },
            { key: 'timezone', label: 'Timezone', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <span style={label}>{f.label}</span>
              <input type={f.type} value={(settings as any)[f.key]} onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))} style={input} />
            </div>
          ))}
          <div>
            <span style={label}>Admin Commission Percentage (%)</span>
            <input type="number" min="0" max="100" value={settings.adminCommissionPercentage} onChange={e => setSettings(p => ({ ...p, adminCommissionPercentage: Number(e.target.value) }))} style={input} />
            <div style={{ fontSize: '0.7rem', color: '#ff1450', marginTop: '4px' }}>* Non-retroactive. Adjusting this will affect all new bookings moving forward.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,20,80,0.06)', borderRadius: '10px', border: '1px solid rgba(255,20,80,0.15)' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white' }}>Maintenance Mode</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Disable user access temporarily</div>
            </div>
            <button onClick={() => setSettings(p => ({ ...p, maintenance: !p.maintenance }))} style={{
              width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: settings.maintenance ? '#ff1450' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s', position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'all 0.3s', left: settings.maintenance ? '23px' : '3px' }} />
            </button>
          </div>
          <button onClick={handleSaveSettings} style={{ ...btn('#00b4ff'), justifyContent: 'center', padding: '12px' }}>
            {I.check} Save Settings
          </button>
        </div>
      </div>

      {/* Payment */}
      <div style={card}>
        <h3 style={{ margin: '0 0 20px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>{I.dollar} Payment Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <span style={label}>Razorpay Key</span>
            <input value={settings.razorpayKey} onChange={e => setSettings(p => ({ ...p, razorpayKey: e.target.value }))} style={input} />
          </div>
          {[
            { key: 'upiEnabled', label: 'UPI Payments' },
            { key: 'netBankingEnabled', label: 'Net Banking' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{f.label}</span>
              <button onClick={() => setSettings(p => ({ ...p, [f.key]: !(p as any)[f.key] }))} style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: (settings as any)[f.key] ? '#00e5a0' : 'rgba(255,255,255,0.1)',
                position: 'relative', transition: 'all 0.3s',
              }}>
                <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'all 0.3s', left: (settings as any)[f.key] ? '23px' : '3px' }} />
              </button>
            </div>
          ))}
          <button onClick={() => showToast('Payment settings saved!')} style={{ ...btn('#f5c518'), justifyContent: 'center', padding: '12px', color: '#030308' }}>
            {I.check} Save Settings
          </button>
        </div>
      </div>

      {/* Security */}
      <div style={card}>
        <h3 style={{ margin: '0 0 20px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>{I.shield} Security Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <span style={label}>Session Timeout (minutes)</span>
            <input type="number" value={settings.sessionTimeout} onChange={e => setSettings(p => ({ ...p, sessionTimeout: Number(e.target.value) }))} style={input} />
          </div>
          {[
            { key: 'twoFA', label: 'Two-Factor Authentication', color: '#00e5a0' },
            { key: 'ipLogging', label: 'IP Address Logging', color: '#00b4ff' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{f.label}</span>
              <button onClick={() => setSettings(p => ({ ...p, [f.key]: !(p as any)[f.key] }))} style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: (settings as any)[f.key] ? f.color : 'rgba(255,255,255,0.1)',
                position: 'relative', transition: 'all 0.3s',
              }}>
                <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'all 0.3s', left: (settings as any)[f.key] ? '23px' : '3px' }} />
              </button>
            </div>
          ))}
          <button onClick={() => showToast('Security settings saved!')} style={{ ...btn('#ff1450'), justifyContent: 'center', padding: '12px' }}>
            {I.shield} Save Security
          </button>
        </div>
      </div>

      {/* Email */}
      <div style={card}>
        <h3 style={{ margin: '0 0 20px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>{I.send} Email Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { key: 'emailFrom', label: 'From Email', placeholder: 'noreply@cineconnect.com' },
            { key: 'smtpHost', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
            { key: 'smtpPort', label: 'SMTP Port', placeholder: '587' },
          ].map(f => (
            <div key={f.key}>
              <span style={label}>{f.label}</span>
              <input placeholder={f.placeholder} value={(settings as any)[f.key]} onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))} style={input} />
            </div>
          ))}
          <button onClick={() => showToast('Email settings saved!')} style={{ ...btn('#a855f7'), justifyContent: 'center', padding: '12px' }}>
            {I.check} Save Email Config
          </button>
        </div>
      </div>
    </div>
    );
  };

// ── REFUNDS TAB ───────────────────────────────────────────────────
  const RefundsTab = () => {

    const processRefund = async (id: string, status: string) => {
      if (status === 'rejected' && (!adminNote || adminNote.trim() === '')) {
        alert('Please enter an admin note before rejecting.');
        return;
      }
      const res = await apiUpdateRefundStatus(id, status, adminNote);
      if (res.ok) {
        showToast('Refund status updated!', 'success');
        setAdminNote('');
        loadRefunds();
      } else {
        showToast(res.message || 'Failed to update refund', 'error');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Manage Refunds</h2>
        {loadingRefunds ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>Loading refunds...</div>
        ) : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Date', 'User', 'Amount', 'Payment Info', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {refunds.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{r.userId?.name || 'Unknown'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)' }}>{r.userId?.email || ''}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#f5c518', fontWeight: 'bold' }}>
                      ₹{r.amount}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                      {r.upiId ? (
                        <div><span style={{color: 'rgba(255,255,255,0.5)'}}>UPI: </span>{r.upiId}</div>
                      ) : null}
                      {r.bankDetails ? (
                        <div><span style={{color: 'rgba(255,255,255,0.5)'}}>Bank: </span>{r.bankDetails}</div>
                      ) : null}
                      {!r.upiId && !r.bankDetails && <span style={{ color: 'rgba(255,255,255,0.3)' }}>No details provided</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={pill(r.status === 'success' ? '#00e5a0' : r.status === 'rejected' ? '#ff1450' : '#f5c518')}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input 
                            placeholder="Admin note (required for reject)" 
                            value={adminNote} 
                            onChange={(e) => setAdminNote(e.target.value)}
                            style={{ ...input, padding: '6px', fontSize: '0.75rem' }}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => processRefund(r._id, 'success')} style={{ ...btn('#00e5a0', true), padding: '6px 12px', fontSize: '0.75rem' }}>
                              Approve
                            </button>
                            <button onClick={() => processRefund(r._id, 'rejected')} style={{ ...btn('#ff1450', true), padding: '6px 12px', fontSize: '0.75rem' }}>
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {refunds.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No refunds found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ── NOTIFICATIONS TAB ───────────────────────────────────────────
  const NotificationsTab = () => {
    const handleSendNotification = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!notifForm.title.trim() || !notifForm.message.trim()) {
        showToast('Title and message are required', 'error');
        return;
      }
      setNotifLoading(true);
      try {
        const res = await apiSendNotification(notifForm);
        if (res.ok) {
          showToast('Notification broadcasted successfully! 🚀', 'success');
          // Add to local sent notifications list
          setSentNotifs(prev => [{
            id: Date.now().toString(), // temporary ID
            ...notifForm,
            sentAt: new Date().toISOString()
          }, ...prev]);
          setNotifForm({ title: '', message: '', type: 'info', target: 'all', targetEmail: '' });
        } else {
          showToast(res.message || 'Failed to send notification', 'error');
        }
      } catch (err) {
        showToast('An error occurred', 'error');
      } finally {
        setNotifLoading(false);
      }
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        <div style={card}>
          {sectionHeader('Compose Broadcast', 'Send a real-time notification', '#a855f7')}
          <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={label}>Target Audience</span>
              <select value={notifForm.target} onChange={e => setNotifForm(p => ({ ...p, target: e.target.value }))} style={input}>
                <option value="all">All Users & Owners</option>
                <option value="user">Users Only</option>
                <option value="theatre_owner">Theatre Owners Only</option>
                <option value="specific_user">Specific User</option>
              </select>
            </div>
            {notifForm.target === 'specific_user' && (
              <div>
                <span style={label}>Target User Email</span>
                <input type="email" placeholder="E.g. member@cineconnect.com" value={notifForm.targetEmail || ''} onChange={e => setNotifForm(p => ({ ...p, targetEmail: e.target.value }))} style={input} required />
              </div>
            )}
            <div>
              <span style={label}>Notification Type</span>
              <select value={notifForm.type} onChange={e => setNotifForm(p => ({ ...p, type: e.target.value }))} style={input}>
                <option value="info">Info (Default)</option>
                <option value="success">Success / Highlight</option>
                <option value="warning">Warning / Alert</option>
                <option value="alert">Critical Alert</option>
              </select>
            </div>
            <div>
              <span style={label}>Title</span>
              <input type="text" placeholder="E.g. System Maintenance" value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))} style={input} required />
            </div>
            <div>
              <span style={label}>Message</span>
              <textarea placeholder="Write your message here..." value={notifForm.message} onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))} style={{ ...input, height: '100px', resize: 'vertical' }} required />
            </div>
            <button type="submit" disabled={notifLoading} style={{ ...btn('#a855f7'), justifyContent: 'center', marginTop: '8px' }}>
              {notifLoading ? 'Broadcasting...' : 'Broadcast Notification'}
            </button>
          </form>
        </div>

        <div style={{ ...card, padding: 0 }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {sectionHeader('Recent Broadcasts', 'History of sent system notifications', '#a855f7')}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Date', 'Target', 'Type', 'Title', 'Message'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sentNotifs.length > 0 ? sentNotifs.map((n, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      {new Date(n.sentAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={pill('#00e5a0')}>{n.target.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={pill(n.type === 'alert' ? '#ff1450' : n.type === 'warning' ? '#f5c518' : '#00b4ff')}>
                        {n.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontWeight: 600 }}>{n.title}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.message}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                      No recent broadcasts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────
  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return DashboardTab();
      case 'movies': return MoviesTab();
      case 'cast': return CastTab();
      case 'theatres': return TheatresTab();
      case 'theatre-owners': return TheatreOwnersTab();
      case 'payouts': return PayoutsTab();
      case 'shows': return ShowsTab();
      case 'bookings': return BookingsTab();
      case 'refunds': return RefundsTab();
      case 'offers': return OffersTab();
      case 'analytics': return AnalyticsTab();
      case 'users': return UsersTab();
      case 'notifications': return NotificationsTab();
      case 'reports': return ReportsTab();
      case 'games': return <AdminGameManager />;
      case 'support': return <AdminSupportPanel />;
      case 'settings': return SettingsTab();
    }
  };

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(160deg,#030310 0%,#07071a 40%,#040410 100%)',
      color: 'white',
      fontFamily: '"Inter","Poppins","Segoe UI",sans-serif',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── AURORA BASE ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background: [
          'radial-gradient(ellipse 130% 90% at 75% 5%,  rgba(123,97,255,0.28) 0%, transparent 52%)',
          'radial-gradient(ellipse 90%  100% at 5%  92%, rgba(0,229,255,0.18)  0%, transparent 52%)',
          'radial-gradient(ellipse 70%  60%  at 50% 50%, rgba(0,0,40,0.7)     0%, transparent 70%)',
          'radial-gradient(ellipse 50%  40%  at 25% 30%, rgba(255,20,80,0.06)  0%, transparent 55%)',
        ].join(','),
        animation: 'auroraPulse 18s ease-in-out infinite',
      }} />

      {/* ── NEON GRID ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage: [
          'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
        ].join(','),
        backgroundSize: '56px 56px',
        animation: 'gridPulse 10s ease-in-out infinite',
      }} />

      {/* ── LARGE GLOW ORBS ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20%', left:'2%',   width:'55%', height:'65%', borderRadius:'50%', background:'radial-gradient(circle,rgba(123,97,255,0.13),transparent 68%)', filter:'blur(2px)', animation:'orbDrift1 28s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'-15%', right:'2%', width:'50%', height:'60%', borderRadius:'50%', background:'radial-gradient(circle,rgba(0,229,255,0.10),transparent 68%)', filter:'blur(2px)', animation:'orbDrift2 35s ease-in-out infinite' }} />
        <div style={{ position:'absolute', top:'35%', left:'28%',  width:'44%', height:'44%', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,215,0,0.05),transparent 68%)',   filter:'blur(3px)', animation:'orbDrift1 45s ease-in-out infinite reverse' }} />
        <div style={{ position:'absolute', top:'10%', right:'20%',  width:'30%', height:'30%', borderRadius:'50%', background:'radial-gradient(circle,rgba(0,229,160,0.06),transparent 68%)', filter:'blur(2px)', animation:'orbDrift2 38s ease-in-out infinite 6s' }} />
      </div>

      {/* ── FLOATING MICRO-PARTICLES ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        {[...Array(12)].map((_,i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${2+i%3}px`, height: `${2+i%3}px`,
            borderRadius: '50%',
            background: i%3===0 ? 'rgba(0,229,255,0.6)' : i%3===1 ? 'rgba(123,97,255,0.5)' : 'rgba(255,215,0,0.4)',
            left:  `${(i*83+13)%100}%`,
            top:   `${(i*67+7)%100}%`,
            boxShadow: i%3===0 ? '0 0 6px rgba(0,229,255,0.8)' : i%3===1 ? '0 0 6px rgba(123,97,255,0.8)' : '0 0 6px rgba(255,215,0,0.8)',
            animation: `particleFloat${(i%3)+1} ${14+i*3}s ease-in-out infinite ${i*1.5}s`,
          }} />
        ))}
      </div>

      {/* ── CINEMATIC LIGHT STREAKS ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'12%', left:'-25%', width:'90%', height:'1.5px', background:'linear-gradient(90deg,transparent,rgba(0,229,255,0.35),rgba(123,97,255,0.25),transparent)', animation:'streakAdmin1 14s ease-in-out infinite', transform:'rotate(-7deg)', filter:'blur(0.6px)' }} />
        <div style={{ position:'absolute', top:'48%', right:'-25%', width:'75%', height:'1px',   background:'linear-gradient(90deg,transparent,rgba(123,97,255,0.28),rgba(0,229,255,0.2),transparent)', animation:'streakAdmin2 20s ease-in-out infinite 5s', transform:'rotate(-4deg)', filter:'blur(0.4px)' }} />
        <div style={{ position:'absolute', top:'78%', left:'-12%',  width:'55%', height:'1px',   background:'linear-gradient(90deg,transparent,rgba(255,215,0,0.18),transparent)', animation:'streakAdmin1 26s ease-in-out infinite 10s', transform:'rotate(-2deg)' }} />
        <div style={{ position:'absolute', top:'65%', left:'60%',   width:'40%', height:'0.8px', background:'linear-gradient(90deg,transparent,rgba(0,229,160,0.2),transparent)', animation:'streakAdmin2 22s ease-in-out infinite 3s', transform:'rotate(3deg)' }} />
      </div>

      {/* ── SCANLINE OVERLAY (subtle CRT atmosphere) ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        mixBlendMode: 'overlay',
      }} />

      {/* ── AI SIGNATURE ORB (bottom-right) ── */}
      <div style={{ position:'fixed', bottom:'28px', right:'28px', zIndex:5, pointerEvents:'none' }}>
        <div style={{ width:'88px', height:'88px', borderRadius:'50%', background:'radial-gradient(circle,rgba(0,229,255,0.4),rgba(123,97,255,0.25),transparent 70%)', animation:'aiOrb 4s ease-in-out infinite', boxShadow:'0 0 50px rgba(0,229,255,0.35),0 0 100px rgba(123,97,255,0.18)' }} />
        <div style={{ position:'absolute', inset:'-12px', borderRadius:'50%', border:'1px solid rgba(0,229,255,0.25)', animation:'aiRing 4s linear infinite' }} />
        <div style={{ position:'absolute', inset:'-26px', borderRadius:'50%', border:'1px dashed rgba(123,97,255,0.18)', animation:'aiRing 9s linear infinite reverse' }} />
        <div style={{ position:'absolute', inset:'-40px', borderRadius:'50%', border:'1px dashed rgba(0,229,255,0.08)', animation:'aiRing 16s linear infinite' }} />
        <div style={{ position:'absolute', inset:'22px', borderRadius:'50%', background:'rgba(0,229,255,0.7)', boxShadow:'0 0 24px rgba(0,229,255,0.9)' }} />
      </div>

      {/* Desktop Sidebar */}
      <div className="admin-desktop-sidebar" style={{ position: 'relative', flexShrink: 0, height: '100vh', zIndex: 50 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileSidebar(false)}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(5,5,20,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: '60vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <Header />
        <div
          className="admin-scroll-area"
          style={{
            flex: 1,
            overflowY: 'scroll',
            overflowX: 'hidden',
            padding: '28px 32px 80px',
            maxWidth: '100%',
            minHeight: 0,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          {renderTab()}
        </div>
      </div>

      {/* Movie Modal */}
      {showMovieModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowMovieModal(false)}>
          <div style={{ ...card, width: '100%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(8,8,28,0.98)', border: '1px solid rgba(0,180,255,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 style={{ margin: 0, background: 'linear-gradient(90deg,#00b4ff,#f5c518)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>
                {editingMovie ? '✏️ Edit Movie' : '🎬 Add New Movie'}
              </h2>
              <button onClick={() => setShowMovieModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.x}</button>
            </div>

            {/* Poster & Banner uploads */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <span style={label}>Movie Poster</span>
                <div onClick={() => posterRef.current?.click()} style={{
                  border: '2px dashed rgba(0,180,255,0.3)', borderRadius: '12px',
                  height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', gap: '8px', position: 'relative', overflow: 'hidden',
                  background: 'rgba(0,180,255,0.04)', transition: 'all 0.3s',
                }}>
                  {movieForm.poster ? (
                    <img src={movieForm.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <><span style={{ color: '#00b4ff', fontSize: '1.5rem' }}>{I.upload}</span><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Click to upload poster</span></>
                  )}
                </div>
                <input ref={posterRef} type="file" accept="image/*" onChange={handlePosterUpload} style={{ display: 'none' }} />
              </div>
              <div>
                <span style={label}>Hero Banner</span>
                <div onClick={() => bannerRef.current?.click()} style={{
                  border: '2px dashed rgba(245,197,24,0.3)', borderRadius: '12px',
                  height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', gap: '8px', position: 'relative', overflow: 'hidden',
                  background: 'rgba(245,197,24,0.04)', transition: 'all 0.3s',
                }}>
                  {movieForm.banner ? (
                    <img src={movieForm.banner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <><span style={{ color: '#f5c518', fontSize: '1.5rem' }}>{I.upload}</span><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Click to upload banner</span></>
                  )}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
              </div>
            </div>

            {/* Movie fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <span style={label}>Movie Title *</span>
                <input placeholder="e.g. Kalki 2898 AD" value={movieForm.title} onChange={e => setMovieForm(p => ({ ...p, title: e.target.value }))} style={input} />
              </div>
              <div>
                <span style={label}>Duration (minutes)</span>
                <input type="number" value={movieForm.duration} onChange={e => setMovieForm(p => ({ ...p, duration: Number(e.target.value) }))} style={input} />
              </div>
              <div>
                <span style={label}>Rating (0–10)</span>
                <input type="number" min="0" max="10" step="0.1" value={movieForm.rating} onChange={e => setMovieForm(p => ({ ...p, rating: Number(e.target.value) }))} style={input} />
              </div>
              <div>
                <span style={label}>Language</span>
                <select value={movieForm.language} onChange={e => setMovieForm(p => ({ ...p, language: e.target.value }))} style={input}>
                  {['Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Bengali'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <span style={label}>Certificate</span>
                <select value={movieForm.certificate} onChange={e => setMovieForm(p => ({ ...p, certificate: e.target.value }))} style={input}>
                  {['U', 'UA', 'A', 'S'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <span style={label}>Description</span>
                <textarea placeholder="Movie description…" value={movieForm.description ?? ''} onChange={e => setMovieForm(p => ({ ...p, description: e.target.value }))} style={{ ...input, minHeight: '80px', resize: 'vertical' } as React.CSSProperties} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <span style={label}>Genres (comma separated)</span>
                <input placeholder="Action, Drama, Sci-Fi" value={(movieForm.genre ?? []).join(', ')} onChange={e => setMovieForm(p => ({ ...p, genre: e.target.value.split(',').map(g => g.trim()).filter(Boolean) }))} style={input} />
              </div>
            </div>

            {/* ── More Options Toggle ── */}
            <button onClick={() => setShowMoreOptions(p => !p)} style={{
              marginTop: '16px', width: '100%', padding: '10px', borderRadius: '10px',
              background: showMoreOptions ? 'rgba(0,180,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showMoreOptions ? 'rgba(0,180,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
              color: showMoreOptions ? '#00b4ff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.3s',
            }}>
              {showMoreOptions ? '▲ Hide More Options' : '▼ More Options (Director, Trailer, Release Date)'}
            </button>

            {showMoreOptions && (
              <div style={{
                marginTop: '12px', padding: '16px', borderRadius: '12px',
                background: 'rgba(0,180,255,0.04)', border: '1px solid rgba(0,180,255,0.12)',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
                animation: 'slideIn 0.2s ease',
              }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <span style={label}>Director</span>
                  <input placeholder="e.g. Nag Ashwin" value={movieForm.director ?? ''} onChange={e => setMovieForm(p => ({ ...p, director: e.target.value }))} style={input} />
                </div>
                <div>
                  <span style={label}>Release Date</span>
                  <input type="date" value={movieForm.releaseDate} onChange={e => setMovieForm(p => ({ ...p, releaseDate: e.target.value }))} style={{ ...input, colorScheme: 'dark' }} />
                </div>
                <div>
                  <span style={label}>Trailer URL (YouTube)</span>
                  <input placeholder="https://youtube.com/watch?v=…" value={movieForm.trailerUrl ?? ''} onChange={e => setMovieForm(p => ({ ...p, trailerUrl: e.target.value }))} style={input} />
                </div>
              </div>
            )}

            <div style={{ /* dummy to close the grid that was open before */ display: 'none' }}>
            </div>

            {/* Status flags */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '16px' }}>
              {[
                { key: 'isNowShowing', label: 'Now Showing', color: '#00e5a0' },
                { key: 'isTrending', label: 'Trending', color: '#f5c518' },
                { key: 'isComingSoon', label: 'Coming Soon', color: '#00b4ff' },
              ].map(f => (
                <button key={f.key} onClick={() => setMovieForm(p => ({ ...p, [f.key]: !(p as any)[f.key] }))} style={{
                  padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem',
                  background: (movieForm as any)[f.key] ? `${f.color}22` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${(movieForm as any)[f.key] ? f.color : 'rgba(255,255,255,0.1)'}`,
                  color: (movieForm as any)[f.key] ? f.color : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s',
                }}>{f.label} {(movieForm as any)[f.key] ? '✓' : ''}</button>
              ))}
            </div>

            {/* Inline cast */}
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(168,85,247,0.06)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.15)' }}>
              <h4 style={{ margin: '0 0 14px', color: '#a855f7', fontWeight: '700' }}>🎭 Cast Members ({(movieForm.castMembers ?? []).length})</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '10px', alignItems: 'end', marginBottom: '10px' }}>
                <div>
                  <span style={label}>Actor Name</span>
                  <input placeholder="Name" value={castForm.name} onChange={e => setCastForm(p => ({ ...p, name: e.target.value }))} style={input} />
                </div>
                <div>
                  <span style={label}>Character</span>
                  <input placeholder="Role" value={castForm.role} onChange={e => setCastForm(p => ({ ...p, role: e.target.value }))} style={input} />
                </div>
                <div>
                  <span style={label}>Photo</span>
                  <button onClick={() => castPhotoRef.current?.click()} style={{ ...btn('#a855f7', true), width: '100%', justifyContent: 'center' }}>
                    {castForm.image ? '✓ Set' : `${I.upload} Upload`}
                  </button>
                  <input ref={castPhotoRef} type="file" accept="image/*" onChange={handleCastPhotoUpload} style={{ display: 'none' }} />
                </div>
                <button onClick={addCastMember} style={{ ...btn('#a855f7'), height: '38px', padding: '0 12px' }}>{I.plus}</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(movieForm.castMembers ?? []).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '20px' }}>
                    {c.image && <img src={c.image} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                    <span style={{ fontSize: '0.78rem', color: '#a855f7', fontWeight: '600' }}>{c.name}</span>
                    <button onClick={() => removeCastMember(c.id)} style={{ background: 'none', border: 'none', color: 'rgba(168,85,247,0.6)', cursor: 'pointer', padding: 0, display: 'flex' }}>{I.x}</button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Trailers Management (Premium) ── */}
            <div style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(229,9,20,0.2)', position: 'relative' }}>
              {/* Background Hero — Movie poster or banner */}
              <div style={{ position: 'relative', minHeight: '160px', overflow: 'hidden' }}>
                {(movieForm.poster || movieForm.banner) ? (
                  <img src={movieForm.banner || movieForm.poster} alt="" style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                    filter: 'brightness(0.25) blur(2px) saturate(1.3)',
                  }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : null}
                {/* Red gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(229,9,20,0.15), rgba(0,0,0,0.7) 60%, rgba(229,9,20,0.08))' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,25,0.95) 0%, transparent 60%)' }} />

                {/* Header content */}
                <div style={{ position: 'relative', padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #E50914, #B20710)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(229,9,20,0.4)',
                  }}>
                    <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '17px solid white', marginLeft: 4, filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                      🎬 Movie Trailers
                    </h4>
                    <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '500' }}>
                      {(movieForm.trailers ?? []).length} trailer{(movieForm.trailers ?? []).length !== 1 ? 's' : ''} added · YouTube links supported
                    </p>
                  </div>
                  <div style={{
                    padding: '6px 14px', borderRadius: '20px',
                    background: (movieForm.trailers ?? []).length > 0 ? 'rgba(229,9,20,0.2)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${(movieForm.trailers ?? []).length > 0 ? 'rgba(229,9,20,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: (movieForm.trailers ?? []).length > 0 ? '#E50914' : 'rgba(255,255,255,0.4)',
                    fontSize: '0.78rem', fontWeight: '700',
                  }}>
                    {(movieForm.trailers ?? []).length} / ∞
                  </div>
                </div>

                {/* Add trailer form — Glass panel */}
                <div style={{ position: 'relative', margin: '0 12px 16px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 80px', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <span style={{ ...label, fontSize: '0.68rem' }}>TRAILER TITLE</span>
                      <input placeholder="e.g. Official Trailer" value={trailerForm.title} onChange={e => setTrailerForm(p => ({ ...p, title: e.target.value }))} style={{ ...input, background: 'rgba(255,255,255,0.08)', fontSize: '0.82rem', padding: '9px 12px' }} />
                    </div>
                    <div>
                      <span style={{ ...label, fontSize: '0.68rem' }}>YOUTUBE URL</span>
                      <input placeholder="https://youtube.com/watch?v=…" value={trailerForm.url} onChange={e => setTrailerForm(p => ({ ...p, url: e.target.value }))} style={{ ...input, background: 'rgba(255,255,255,0.08)', fontSize: '0.82rem', padding: '9px 12px' }} />
                    </div>
                    <div>
                      <span style={{ ...label, fontSize: '0.68rem' }}>DURATION</span>
                      <input placeholder="2:30" value={trailerForm.duration} onChange={e => setTrailerForm(p => ({ ...p, duration: e.target.value }))} style={{ ...input, background: 'rgba(255,255,255,0.08)', fontSize: '0.82rem', padding: '9px 12px' }} />
                    </div>
                  </div>
                  {/* Image upload row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ ...label, fontSize: '0.68rem' }}>THUMBNAIL IMAGE (optional)</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => trailerImgRef.current?.click()} style={{
                          ...btn('#E50914', true), padding: '7px 14px', fontSize: '0.78rem',
                          background: trailerForm.image ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.05)',
                          borderColor: trailerForm.image ? 'rgba(229,9,20,0.4)' : 'rgba(255,255,255,0.1)',
                          color: trailerForm.image ? '#E50914' : 'rgba(255,255,255,0.5)',
                        }}>
                          {trailerForm.image ? '✓ Image Set' : `${I.upload} Upload Image`}
                        </button>
                        <input ref={trailerImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const b64 = await readFile(f);
                          setTrailerForm(p => ({ ...p, image: b64 }));
                        }} />
                        {trailerForm.image && (
                          <div style={{ position: 'relative', width: '48px', height: '28px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(229,9,20,0.3)' }}>
                            <img src={trailerForm.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button onClick={() => setTrailerForm(p => ({ ...p, image: '' }))} style={{ position: 'absolute', top: -2, right: -2, width: '14px', height: '14px', borderRadius: '50%', background: '#E50914', border: 'none', color: 'white', fontSize: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => {
                      if (!trailerForm.title.trim() || !trailerForm.url.trim()) return;
                      setMovieForm(p => ({
                        ...p,
                        trailers: [...(p.trailers ?? []), { id: `trl${Date.now()}`, ...trailerForm }],
                      }));
                      setTrailerForm({ title: '', url: '', duration: '', image: '' });
                    }} style={{
                      ...btn('#E50914'), height: '38px', padding: '0 20px', marginTop: '14px',
                      background: 'linear-gradient(135deg, #E50914, #B20710)',
                      boxShadow: '0 4px 16px rgba(229,9,20,0.4)',
                      borderRadius: '10px', fontWeight: '700',
                    }}>{I.plus} Add Trailer</button>
                  </div>
                </div>
              </div>

              {/* Trailer list cards */}
              <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(10,10,25,0.95)' }}>
                {(movieForm.trailers ?? []).map((t: any, idx: number) => {
                  // Extract YouTube thumbnail
                  let ytThumb = '';
                  try {
                    const u = new URL(t.url);
                    let vid = '';
                    if (u.hostname === 'youtu.be') vid = u.pathname.split('/').filter(Boolean)[0] ?? '';
                    else if (u.hostname.includes('youtube.com')) { vid = u.searchParams.get('v') ?? ''; if (!vid) { const p = u.pathname.split('/').filter(Boolean); if (p[0] === 'embed' || p[0] === 'shorts') vid = p[1] ?? ''; } }
                    if (vid) ytThumb = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                  } catch { /* ignore */ }

                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(229,9,20,0.15)',
                      borderRadius: '12px', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,9,20,0.08)'; e.currentTarget.style.borderColor = 'rgba(229,9,20,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(229,9,20,0.15)'; }}
                    >
                      {/* Thumbnail preview — prefer custom image */}
                      <div style={{ width: '72px', height: '42px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#111' }}>
                        {(t.image || ytThumb) ? (
                          <img src={t.image || ytThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#0a0a1a)', color: 'rgba(255,255,255,0.2)', fontSize: '18px' }}>🎬</div>
                        )}
                        {/* Mini play overlay */}
                        <div style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(0,0,0,0.35)',
                        }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(229,9,20,0.85)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid white', marginLeft: 1.5 }} />
                          </div>
                        </div>
                      </div>

                      {/* Index number */}
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                        background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: '800', color: '#E50914',
                      }}>{idx + 1}</div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(229,9,20,0.8)', fontWeight: '600', background: 'rgba(229,9,20,0.1)', padding: '1px 8px', borderRadius: '6px', border: '1px solid rgba(229,9,20,0.2)' }}>🕐 {t.duration || 'N/A'}</span>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.url.length > 35 ? t.url.slice(0, 35) + '…' : t.url}</span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button onClick={() => setMovieForm(p => ({ ...p, trailers: (p.trailers ?? []).filter((tr: any) => tr.id !== t.id) }))} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                        display: 'flex', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(229,9,20,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229,9,20,0.5)'; (e.currentTarget as HTMLElement).style.color = '#E50914'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                      >{I.trash}</button>
                    </div>
                  );
                })}
                {(movieForm.trailers ?? []).length === 0 && (
                  <div style={{
                    padding: '24px', textAlign: 'center', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(229,9,20,0.15)',
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}>🎬</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: '600' }}>No trailers added yet</div>
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '4px' }}>Add YouTube trailer URLs above to show on movie detail page</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setShowMovieModal(false)} style={{ ...btn('rgba(255,255,255,0.1)', true), flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={saveMovie} style={{ ...btn('#00b4ff'), flex: 2, justifyContent: 'center', padding: '12px' }}>
                {I.check} {editingMovie ? 'Update Movie' : 'Add Movie → Live on Homepage'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowCouponModal(false)}>
          <div style={{ ...card, width: '100%', maxWidth: '480px', background: 'rgba(8,8,28,0.98)', border: '1px solid rgba(245,197,24,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#f5c518', fontWeight: '800' }}>{editingCoupon ? '✏️ Edit Coupon' : '🎁 New Coupon'}</h2>
              <button onClick={() => setShowCouponModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.x}</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'code', label: 'Coupon Code', placeholder: 'e.g. SAVE50' },
                { key: 'description', label: 'Description', placeholder: 'Short description' },
              ].map(f => (
                <div key={f.key}>
                  <span style={label}>{f.label}</span>
                  <input placeholder={f.placeholder} value={(couponForm as any)[f.key]} onChange={e => setCouponForm(p => ({ ...p, [f.key]: e.target.value }))} style={input} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { key: 'discount', label: 'Discount %', type: 'number' },
                  { key: 'maxDiscount', label: 'Max Discount ₹', type: 'number' },
                  { key: 'minAmount', label: 'Min Booking ₹', type: 'number' },
                  { key: 'usageLimit', label: 'Usage Limit', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <span style={label}>{f.label}</span>
                    <input type={f.type} value={(couponForm as any)[f.key]} onChange={e => setCouponForm(p => ({ ...p, [f.key]: Number(e.target.value) }))} style={input} />
                  </div>
                ))}
              </div>
              <div>
                <span style={label}>Expiry Date</span>
                <input type="date" value={couponForm.validTill} onChange={e => setCouponForm(p => ({ ...p, validTill: e.target.value }))} style={input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowCouponModal(false)} style={{ ...btn('rgba(255,255,255,0.1)', true), flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={saveCoupon} style={{ ...btn('#f5c518'), flex: 2, justifyContent: 'center', padding: '12px', color: '#030308' }}>{I.check} Save Coupon</button>
            </div>
          </div>
        </div>
      )}

      {/* Theatre Review Modal */}
      {reviewRequest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setReviewRequest(null)}>
          <div style={{ ...card, width: '100%', maxWidth: '560px', background: 'rgba(8,8,28,0.98)', border: '1px solid rgba(245,197,24,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', color: '#f5c518', fontWeight: '800' }}>🏛️ Theatre Review</h2>
            {reviewRequest.theatreData?.image && (
              <img src={reviewRequest.theatreData.image} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '16px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Theatre Name', val: reviewRequest.theatreData?.name },
                { label: 'City', val: reviewRequest.theatreData?.city },
                { label: 'Location', val: reviewRequest.theatreData?.location },
                { label: 'Screens', val: reviewRequest.theatreData?.screens?.length ?? 0 },
                { label: 'Submitted', val: reviewRequest.submittedAt?.split('T')[0] },
                { label: 'Owner ID', val: reviewRequest.ownerId?.slice(-8) },
              ].map((f, i) => (
                <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                  <div style={{ fontWeight: '700', color: 'white' }}>{f.val ?? '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={label}>Admin Note (optional)</span>
              <textarea placeholder="Leave a note for the theatre owner…" value={adminNote} onChange={e => setAdminNote(e.target.value)} style={{ ...input, minHeight: '80px', resize: 'vertical' } as React.CSSProperties} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setReviewRequest(null)} style={{ ...btn('rgba(255,255,255,0.1)', true), flex: 1, justifyContent: 'center' }}>Close</button>
              <button onClick={() => { rejectTheatreRequest(reviewRequest.id, adminNote || 'Rejected'); setReviewRequest(null); showToast('Rejected', 'error'); }} style={{ ...btn('#ff1450', true), flex: 1, justifyContent: 'center' }}>{I.x} Reject</button>
              <button onClick={() => { approveTheatreRequest(reviewRequest.id); setReviewRequest(null); showToast('Theatre approved! Now live.'); }} style={{ ...btn('#00e5a0'), flex: 2, justifyContent: 'center' }}>{I.check} Approve & List</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelBookingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setCancelBookingId(null)}>
          <div style={{ ...card, width: '100%', maxWidth: '400px', background: 'rgba(8,8,28,0.98)', border: '1px solid rgba(255,20,80,0.2)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', color: 'white' }}>Cancel Booking?</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0 0 20px' }}>Booking #{cancelBookingId.slice(-8).toUpperCase()} will be cancelled and refunded.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCancelBookingId(null)} style={{ ...btn('rgba(255,255,255,0.1)', true), flex: 1, justifyContent: 'center' }}>Keep</button>
              <button onClick={() => { cancelBooking(cancelBookingId); setCancelBookingId(null); showToast('Booking cancelled & refund processed'); }} style={{ ...btn('#ff1450'), flex: 1, justifyContent: 'center' }}>Cancel & Refund</button>
            </div>
          </div>
        </div>
      )}

      <Toast />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        /* ── LOCK BODY / HTML SCROLL (prevents jump-to-top) ── */
        html, body { overflow: hidden !important; height: 100% !important; margin: 0; padding: 0; }

        /* ── BASE LAYOUT ── */
        .admin-desktop-sidebar { display: flex; }
        .admin-mobile-menu { display: none !important; }

        /* ── SCROLL AREA (key fix: overscroll-behavior stops bounce-back) ── */
        .admin-scroll-area {
          overscroll-behavior: contain !important;
          overscroll-behavior-y: contain !important;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
          scroll-behavior: smooth;
        }
        .admin-scroll-area::-webkit-scrollbar { width: 5px; }
        .admin-scroll-area::-webkit-scrollbar-track { background: rgba(0,229,255,0.03); }
        .admin-scroll-area::-webkit-scrollbar-thumb { background: linear-gradient(180deg,rgba(0,229,255,0.4),rgba(123,97,255,0.4)); border-radius: 5px; }
        .admin-scroll-area::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,rgba(0,229,255,0.7),rgba(123,97,255,0.7)); }

        @media (max-width: 768px) {
          .admin-desktop-sidebar { display: none !important; }
          .admin-mobile-menu { display: flex !important; }
        }
        /* ── SIDEBAR NAV SCROLL ── */
        .admin-sidebar-nav { }
        .admin-sidebar-nav::-webkit-scrollbar { width: 3px; }
        .admin-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .admin-sidebar-nav::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(0,229,255,0.3), rgba(123,97,255,0.3));
          border-radius: 3px;
        }


        .admin-row { transition: background 0.2s, box-shadow 0.2s; }
        .admin-row:hover {
          background: rgba(0,229,255,0.05) !important;
          box-shadow: inset 0 0 0 1px rgba(0,229,255,0.1), inset 4px 0 0 rgba(0,229,255,0.35);
        }

        /* ── FORM ELEMENTS ── */
        select option  { background: #080820; color: #fff; }
        select optgroup{ background: #080820; color: #fff; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.6) sepia(1) saturate(3) hue-rotate(170deg); }
        input:focus, select:focus, textarea:focus {
          border-color: rgba(0,229,255,0.45) !important;
          box-shadow: 0 0 0 3px rgba(0,229,255,0.12), inset 0 2px 8px rgba(0,0,0,0.3) !important;
        }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar       { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,229,255,0.03); }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(0,229,255,0.35), rgba(123,97,255,0.35)); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,rgba(0,229,255,0.6),rgba(123,97,255,0.6)); }

        /* ────────────── KEYFRAMES ────────────── */

        /* Background & mood */
        @keyframes auroraPulse {
          0%,100% { opacity:1; transform:scale(1)    rotate(0deg);  }
          33%     { opacity:0.85; transform:scale(1.04) rotate(0.5deg); }
          66%     { opacity:0.9;  transform:scale(0.97) rotate(-0.3deg);}
        }
        @keyframes gridPulse {
          0%,100% { opacity:0.7; }
          50%     { opacity:1.2; }
        }
        @keyframes orbDrift1 {
          0%,100% { transform:translate(0,0) scale(1); }
          25%     { transform:translate(5%,4%)  scale(1.04); }
          50%     { transform:translate(2%,8%)  scale(0.97); }
          75%     { transform:translate(-3%,3%) scale(1.02); }
        }
        @keyframes orbDrift2 {
          0%,100% { transform:translate(0,0)   scale(1); }
          25%     { transform:translate(-4%,-5%) scale(1.03); }
          50%     { transform:translate(4%,-2%)  scale(0.96); }
          75%     { transform:translate(2%,-7%)  scale(1.05); }
        }
        @keyframes streakAdmin1 {
          0%,100% { transform:translateX(-35%) rotate(-7deg); opacity:0.2; }
          50%     { transform:translateX(25%)  rotate(-7deg); opacity:1;   }
        }
        @keyframes streakAdmin2 {
          0%,100% { transform:translateX(25%)  rotate(-4deg); opacity:0.2; }
          50%     { transform:translateX(-15%) rotate(-4deg); opacity:0.85; }
        }

        /* Particles */
        @keyframes particleFloat1 {
          0%,100% { transform:translate(0,0)    opacity:0.6; }
          33%     { transform:translate(30px,-50px) opacity:1; }
          66%     { transform:translate(-20px,30px) opacity:0.4; }
        }
        @keyframes particleFloat2 {
          0%,100% { transform:translate(0,0)       opacity:0.5; }
          33%     { transform:translate(-40px,-30px) opacity:0.9; }
          66%     { transform:translate(25px,45px)   opacity:0.3; }
        }
        @keyframes particleFloat3 {
          0%,100% { transform:translate(0,0)    opacity:0.4; }
          33%     { transform:translate(20px,60px) opacity:0.8; }
          66%     { transform:translate(-35px,-20px) opacity:0.6; }
        }

        /* UI elements */
        @keyframes ping {
          0%,100% { opacity:1; transform:scale(1);   }
          50%     { opacity:0.5; transform:scale(1.25); }
        }
        @keyframes slideIn {
          from { opacity:0; transform:translateY(-14px); }
          to   { opacity:1; transform:translateY(0);     }
        }
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes gradFlow {
          0%   { background-position: 0%   50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes aiOrb {
          0%,100% { transform:scale(1);    opacity:0.8; }
          50%     { transform:scale(1.18); opacity:1;   }
        }
        @keyframes aiRing    { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
        @keyframes logoPulse {
          0%,100% { box-shadow:0 0 24px rgba(0,229,255,0.55), 0 0 48px rgba(123,97,255,0.25); }
          50%     { box-shadow:0 0 44px rgba(0,229,255,0.9),  0 0 90px rgba(123,97,255,0.5);  }
        }
        @keyframes avatarGlow {
          0%,100% { box-shadow:0 0 0 2px #7B61FF, 0 0 22px rgba(123,97,255,0.55); }
          50%     { box-shadow:0 0 0 3px #00E5FF, 0 0 34px rgba(0,229,255,0.7);   }
        }
        @keyframes neonBorder {
          0%,100% { border-color: rgba(0,229,255,0.25); box-shadow: 0 0 10px rgba(0,229,255,0.1); }
          50%     { border-color: rgba(0,229,255,0.55); box-shadow: 0 0 28px rgba(0,229,255,0.25); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        /* ── KPI & STAT CARD INTERACTIONS ── */
        .kpi-card {
          animation: fadeInUp 0.5s ease both;
        }
        .kpi-card:hover { transform: translateY(-8px) scale(1.025) !important; }
        .kpi-card:hover .kpi-icon { transform: scale(1.15) rotate(6deg); }
        .admin-stat-card:hover { transform: translateY(-6px) scale(1.03) !important; }

        /* ── BUTTON HOVER GLOW ── */
        button:not([disabled]):hover { filter: brightness(1.12); }

        /* ── SECTION HEADER SHIMMER ── */
        .section-title-shimmer {
          background: linear-gradient(90deg, white 25%, rgba(0,229,255,0.9) 50%, white 75%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
