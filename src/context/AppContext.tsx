import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Movie, Theatre, Booking, Coupon, User, Offer, Seat, ShowTime,
  TheatreApprovalRequest, ApprovalStatus,
  MOVIES, THEATRES, BOOKINGS, COUPONS, USERS, OFFERS, APPROVAL_REQUESTS, generateSeats,
} from '../data/store';
import { db, KEYS } from '../lib/db';
import {
  apiLogin, apiRegister, apiLogout, apiGetMe,
  apiDeleteMovie, apiCreateMovie, apiUpdateMovie,
  apiGetMovies,
  apiDeleteCoupon, apiCreateCoupon, apiUpdateCoupon,
  apiCancelBooking,
  apiGetTheatresPublic, apiGetCouponsPublic,
  apiCreateTheatre, apiUpdateTheatre, apiDeleteTheatre,
  apiCreateBooking,
  apiGetUserBookings,
} from '../services/apiService';

export interface BookTicketsState {
  open: boolean;
  movie: Movie | null;
}

export type Page =
  | 'auth' | 'admin-login' | 'home' | 'movies' | 'movie-detail' | 'seat-selection' | 'payment'
  | 'my-bookings' | 'search' | 'offers' | 'admin' | 'theatre-owner' | 'how-it-works'
  | 'user-dashboard' | 'user-profile' | 'notifications' | 'coming-soon' | 'forgot-password' | 'reset-password' | 'play-zone' | 'play-zone-category';

interface AppState {
  page: Page;
  pageHistory: Page[];
  selectedMovie: Movie | null;
  selectedTheatre: Theatre | null;
  selectedShowTime: string | null;
  selectedDate: string | null;
  selectedSeats: Seat[];
  currentCity: string;
  searchQuery: string;
  movies: Movie[];
  theatres: Theatre[];
  bookings: Booking[];
  coupons: Coupon[];
  users: User[];
  offers: Offer[];
  approvalRequests: TheatreApprovalRequest[];
  currentUser: User | null;
  isLoginModalOpen: boolean;
  loginMode: 'login' | 'register';
  loginRole: 'user' | 'admin' | 'theatre_owner';
  cityModalOpen: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  filterGenre: string;
  filterLanguage: string;
  filterTheatreType: string;
  movieLikes: Record<string, string[]>;
  movieDislikes: Record<string, string[]>;
  movieInterests: Record<string, string[]>;
  bookTickets: BookTicketsState;
  profileUserId: string | null;
  activeCategorySlug: string | null; // for play-zone-category page
}

interface AppContextType extends AppState {
  navigate: (page: Page, params?: { userId?: string }) => void;
  navigateToProfile: (userId: string) => void;
  goBack: () => void;
  selectMovie: (movie: Movie) => void;
  selectTheatre: (theatre: Theatre) => void;
  selectShowTime: (showTimeId: string, date: string) => void;
  toggleSeat: (seat: Seat) => void;
  setCity: (city: string) => void;
  setSearch: (q: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, role?: string, profile?: { avatar?: string; username?: string; gender?: 'Male' | 'Female' | 'Other'; bio?: string; movieInterests?: string[] }) => Promise<boolean>;
  logout: () => void;
  openLogin: (mode?: 'login' | 'register', role?: 'user' | 'admin' | 'theatre_owner') => void;
  closeLogin: () => void;
  openCityModal: () => void;
  closeCityModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<Booking>;
  cancelBooking: (bookingId: string, cancelledBy?: 'user' | 'theatre_owner' | 'admin') => void;
  rateMovie: (movieId: string, rating: number, review: string, bookingId: string) => void;
  toggleMovieLike: (movieId: string) => void;
  toggleMovieDislike: (movieId: string) => void;
  toggleMovieInterest: (movieId: string) => void;
  openBookTickets: (movie: Movie) => void;
  closeBookTickets: () => void;
  addMovie: (movie: Omit<Movie, 'id'>) => void;
  updateMovie: (movie: Movie) => void;
  deleteMovie: (movieId: string) => void;
  addTheatre: (theatre: Omit<Theatre, 'id'>) => void;
  updateTheatre: (theatre: Theatre) => void;
  deleteTheatre: (theatreId: string) => void;
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;
  applyCoupon: (code: string, amount: number) => { discount: number; coupon: Coupon } | null;
  setFilterGenre: (g: string) => void;
  setFilterLanguage: (l: string) => void;
  setFilterTheatreType: (t: string) => void;
  getUserBookings: () => Booking[];
  getOwnerTheatres: () => Theatre[];
  submitTheatreApprovalRequest: (data: Omit<TheatreApprovalRequest, 'id' | 'status' | 'submittedAt'>) => void;
  reviewApprovalRequest: (requestId: string, status: ApprovalStatus, note?: string) => void;
  getPendingRequests: () => TheatreApprovalRequest[];
  getOwnerApprovalRequest: () => TheatreApprovalRequest | null;
  getTheatreBookings: (theatreId: string) => Booking[];
  cancelBookingByOwner: (bookingId: string) => void;
  addShowTime: (theatreId: string, showTime: Omit<ShowTime, 'id'>) => void;
  updateShowTime: (theatreId: string, showTime: ShowTime) => void;
  deleteShowTime: (theatreId: string, showTimeId: string) => void;
  endShowTime: (theatreId: string, showTimeId: string) => void;
  assignMovieToShowTime: (theatreId: string, showTimeId: string, movieId: string) => void;
  blockSeat: (theatreId: string, screenId: string, seatId: string, reason?: string) => void;
  unblockSeat: (theatreId: string, screenId: string, seatId: string) => void;
  confirmBookingSeats: (theatreId: string, screenId: string, seatIds: string[]) => void;
  resetToSeedData: () => void;
  updateCurrentUser: (patch: Partial<Record<string, any>>) => void;
  refreshUserBookings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function loadOrSeed<T>(key: string, seed: T): T {
  const stored = db.get<T>(key);
  if (stored !== null) return stored;
  db.set(key, seed);
  return seed;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialPageState = () => {
    let path = window.location.pathname.replace(/^\/|\/$/g, '');
    if (path.startsWith('reset-password/')) path = 'reset-password';
    if (!path) path = 'home';
    const validPages: Page[] = ['auth', 'admin-login', 'home', 'movies', 'movie-detail', 'seat-selection', 'payment', 'my-bookings', 'search', 'offers', 'admin', 'theatre-owner', 'how-it-works', 'user-dashboard', 'user-profile', 'notifications', 'coming-soon', 'forgot-password', 'reset-password', 'play-zone', 'play-zone-category'];
    if (!validPages.includes(path as Page)) path = 'home';

    let progress = null;
    try {
      const stored = localStorage.getItem('cc_session_state');
      if (stored) progress = JSON.parse(stored);
    } catch { /* suppress */ }

    // If there is no user token but the page is a dashboard/payment page, default to auth
    if (['payment', 'my-bookings', 'admin', 'theatre-owner', 'user-dashboard'].includes(path) && !localStorage.getItem('cc_token')) {
       path = 'auth';
    }

    return {
      page: path as Page,
      selectedMovie: progress?.selectedMovie || null,
      selectedTheatre: progress?.selectedTheatre || null,
      selectedShowTime: progress?.selectedShowTime || null,
      selectedDate: progress?.selectedDate || null,
      selectedSeats: progress?.selectedSeats || [],
      bookTickets: progress?.bookTickets || { open: false, movie: null }
    };
  };

  const [state, setState] = useState<AppState>(() => {
    const session = getInitialPageState();
    return {
      page: session.page,
      pageHistory: [session.page],
      selectedMovie: session.selectedMovie, 
      selectedTheatre: session.selectedTheatre, 
      selectedShowTime: session.selectedShowTime, 
      selectedDate: session.selectedDate, 
      selectedSeats: session.selectedSeats,
      bookTickets: session.bookTickets,

      currentCity: db.get<string>('cc_city') || 'Mumbai', searchQuery: '',
    // Server-managed data — start empty, always loaded fresh from MongoDB
    movies: [],
    theatres: [],
    bookings: [],
    coupons: [],
    users: [],
    offers: OFFERS,
    approvalRequests: [],
    currentUser: null,
    isLoginModalOpen: false, loginMode: 'login', loginRole: 'user',
    cityModalOpen: false, toast: null,
    filterGenre: '', filterLanguage: '', filterTheatreType: '',
    // Preference data — OK to keep in localStorage
    movieLikes: loadOrSeed(KEYS.MOVIE_LIKES, {}),
    movieDislikes: loadOrSeed(KEYS.MOVIE_DISLIKES, {}),
    movieInterests: loadOrSeed(KEYS.MOVIE_INTERESTS, {}),
    profileUserId: null,
    activeCategorySlug: null,
  };
});

  // ── Session Timeouts ──────────────────────────────────────────────────────────
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeout);
      // 1-hour session timeout log out
      timeout = setTimeout(() => {
        if (localStorage.getItem('cc_token')) {
          localStorage.removeItem('cc_token');
          localStorage.removeItem('cc_user');
          setState(prev => ({ ...prev, page: 'auth', currentUser: null, bookings: [] }));
          db.set('cc_toast', { message: 'Session expired due to inactivity.', type: 'info' });
        }
      }, 60 * 60 * 1000); 
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      clearTimeout(timeout);
    };
  }, []);

  // ── Sync URL Routes and Redux-Style Persist ──────────────────────────────────────────────────────────
  useEffect(() => {
    let url = `/${state.page === 'home' ? '' : state.page}`;
    
    // Preserve the reset token in the URL if it exists
    if (state.page === 'reset-password' && window.location.pathname.startsWith('/reset-password/')) {
      url = window.location.pathname;
    }

    if (window.location.pathname !== url) {
      window.history.pushState({ page: state.page }, '', url);
    }
    
    // Save form & selected seats bound directly for refresh handling
    localStorage.setItem('cc_session_state', JSON.stringify({
      selectedMovie: state.selectedMovie,
      selectedTheatre: state.selectedTheatre,
      selectedShowTime: state.selectedShowTime,
      selectedDate: state.selectedDate,
      selectedSeats: state.selectedSeats,
      bookTickets: state.bookTickets
    }));
  }, [state.page, state.selectedMovie, state.selectedTheatre, state.selectedShowTime, state.selectedDate, state.selectedSeats, state.bookTickets]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const validPages: Page[] = ['auth', 'admin-login', 'home', 'movies', 'movie-detail', 'seat-selection', 'payment', 'my-bookings', 'search', 'offers', 'admin', 'theatre-owner', 'how-it-works', 'user-dashboard', 'user-profile', 'notifications', 'coming-soon', 'forgot-password', 'reset-password'];
      let path = window.location.pathname.replace(/^\/|\/$/g, '');
      if (path.startsWith('reset-password/')) path = 'reset-password';
      if (!path) path = 'home';
      if (!validPages.includes(path as Page)) path = 'home';
      setState(prev => ({ ...prev, page: path as Page }));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Persist only preference/UI data to localStorage (NOT server data) ────
  useEffect(() => { db.set(KEYS.MOVIE_LIKES, state.movieLikes); }, [state.movieLikes]);
  useEffect(() => { db.set(KEYS.MOVIE_DISLIKES, state.movieDislikes); }, [state.movieDislikes]);
  useEffect(() => { db.set(KEYS.MOVIE_INTERESTS, state.movieInterests); }, [state.movieInterests]);
  useEffect(() => { if (state.currentCity) db.set('cc_city', state.currentCity); }, [state.currentCity]);

  // ── Load all server data from MongoDB on mount ────────────────────────────
  useEffect(() => {
    const loadFromBackend = async () => {
      // Load movies
      try {
        const moviesRes = await apiGetMovies();
        if (moviesRes.ok && moviesRes.data) {
          const raw = Array.isArray(moviesRes.data) ? moviesRes.data : (moviesRes.data as any).movies || [];
          const mapped = raw.map((m: any) => ({
            ...m, id: m._id || m.id,
            // Backend stores as 'languages', frontend expects 'language'
            language: m.language || m.languages || [],
            userRatings: m.userRatings || [], likes: m.likes || [],
            dislikes: m.dislikes || [], interests: m.interests || [],
          }));
          setState(prev => ({ ...prev, movies: mapped.length > 0 ? mapped : MOVIES }));
        } else {
          setState(prev => ({ ...prev, movies: MOVIES })); // fallback only when backend offline
        }
      } catch { setState(prev => ({ ...prev, movies: MOVIES })); }

      // Load theatres
      try {
        const theatresRes = await apiGetTheatresPublic();
        if (theatresRes.ok && theatresRes.data) {
          const raw = Array.isArray(theatresRes.data) ? theatresRes.data : (theatresRes.data as any).theatres || [];
          const mapped = raw.map((t: any) => ({
            ...t,
            id: t._id || t.id,
            screens: (t.screens || []).map((sc: any) => ({
              ...sc,
              id: sc._id || sc.id,
              // Normalize seats: MongoDB stores seatId not id → fix so toggleSeat comparison works
              seats: (sc.seats || []).map((s: any) => ({
                ...s,
                id: s.id || s.seatId || String(s._id || ''),
                seatId: s.seatId || s.id || String(s._id || ''),
              })),
            })),
            showTimes: (t.showTimes || []).map((st: any) => ({
              ...st,
              id: st._id || st.id || String(st._id || ''),
            })),
          }));
          setState(prev => ({ ...prev, theatres: mapped.length > 0 ? mapped : THEATRES }));
        } else {
          setState(prev => ({ ...prev, theatres: THEATRES }));
        }
      } catch { setState(prev => ({ ...prev, theatres: THEATRES })); }

      // Load coupons
      try {
        const couponsRes = await apiGetCouponsPublic();
        if (couponsRes.ok && couponsRes.data) {
          const raw = Array.isArray(couponsRes.data) ? couponsRes.data : (couponsRes.data as any).coupons || [];
          const mapped = raw.map((c: any) => ({ ...c, id: c._id || c.id }));
          setState(prev => ({ ...prev, coupons: mapped.length > 0 ? mapped : COUPONS }));
        } else {
          setState(prev => ({ ...prev, coupons: COUPONS }));
        }
      } catch { setState(prev => ({ ...prev, coupons: COUPONS })); }
    };

    // ── Auto-restore session from JWT (keeps user logged in after page reload) ─
    const restoreSession = async () => {
      const token = localStorage.getItem('cc_token');
      if (!token) return;
      try {
        const res = await apiGetMe();
        if (res.ok && res.data?.user) {
          const apiUser = res.data.user as any;
          const localUser: User = {
            id: apiUser._id || apiUser.id,
            name: apiUser.name, email: apiUser.email,
            password: '', phone: apiUser.phone || '',
            city: apiUser.city || 'Mumbai',
            role: apiUser.role as User['role'],
            approvalStatus: apiUser.approvalStatus,
            avatar: apiUser.avatar, username: apiUser.username,
            gender: apiUser.gender as User['gender'],
            bio: apiUser.bio, movieInterests: apiUser.movieInterests,
            joinDate: apiUser.joinDate || new Date().toISOString().split('T')[0],
            bookings: [],
            isPrivate: !!apiUser.isPrivate,
          } as any;
          // Persist refreshed user back to localStorage
          localStorage.setItem('cc_user', JSON.stringify(localUser));
          setState(prev => ({ ...prev, currentUser: localUser }));
          // NOTE: bookings are loaded by the useEffect(,[currentUser]) below
        } else {
          // Token invalid/expired — clean up
          localStorage.removeItem('cc_token');
          localStorage.removeItem('cc_user');
        }
      } catch {
        // Backend offline — try to restore from cached user object
        const cached = localStorage.getItem('cc_user');
        if (cached) {
          try {
            const u = JSON.parse(cached);
            setState(prev => ({ ...prev, currentUser: u }));
          } catch { /* ignore */ }
        }
      }
    };

    loadFromBackend();
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (partial: Partial<AppState>) => setState(prev => ({ ...prev, ...partial }));

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3500);
  }, []);

  // ── Protected pages: require login ────────────────────────────────────────
  const PROTECTED_PAGES: Page[] = [
    'my-bookings', 'seat-selection', 'payment', 'user-dashboard',
    'theatre-owner',
  ];

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = useCallback((page: Page, params?: { userId?: string; categorySlug?: string }) => {
    setState(prev => {
      let targetPage = page;
      if (PROTECTED_PAGES.includes(page) && !prev.currentUser && !localStorage.getItem('cc_token')) {
        targetPage = 'auth';
      }
      
      const url = `/${targetPage === 'home' ? '' : targetPage}`;
      if (window.location.pathname !== url) {
        window.history.pushState({ page: targetPage, params }, '', url);
      }

      return {
        ...prev,
        page: targetPage,
        profileUserId: params?.userId ?? (targetPage === 'user-profile' ? prev.profileUserId : null),
        activeCategorySlug: params?.categorySlug ?? (targetPage === 'play-zone-category' ? prev.activeCategorySlug : null),
        pageHistory: prev.page !== targetPage ? [...prev.pageHistory.slice(-19), prev.page] : prev.pageHistory,
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToProfile = useCallback((userId: string) => {
    setState(prev => {
      const url = `/user-profile`;
      if (window.location.pathname !== url) {
        window.history.pushState({ page: 'user-profile', params: { userId } }, '', url);
      }
      return {
        ...prev,
        page: 'user-profile',
        profileUserId: userId,
        pageHistory: prev.page !== 'user-profile' ? [...prev.pageHistory.slice(-19), prev.page] : prev.pageHistory,
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    window.history.back(); // let native popstate listener handle state mapping
  }, []);

  const selectMovie = useCallback((movie: Movie) => {
    set({ selectedMovie: movie, selectedTheatre: null, selectedShowTime: null, selectedDate: null, selectedSeats: [] });
    navigate('movie-detail');
  }, [navigate]);

  const selectTheatre = useCallback((theatre: Theatre) => set({ selectedTheatre: theatre }), []);

  const selectShowTime = useCallback((showTimeId: string, date: string) => {
    set({ selectedShowTime: showTimeId, selectedDate: date, selectedSeats: [] });
    navigate('seat-selection');
  }, [navigate]);

  const toggleSeat = useCallback((seat: Seat) => {
    setState(prev => {
      if (seat.isBooked) return prev;
      const exists = prev.selectedSeats.find(s => s.id === seat.id);
      if (exists) return { ...prev, selectedSeats: prev.selectedSeats.filter(s => s.id !== seat.id) };
      if (prev.selectedSeats.length >= 10) return prev;
      return { ...prev, selectedSeats: [...prev.selectedSeats, seat] };
    });
  }, []);

  // ── City ───────────────────────────────────────────────────────────────────
  const setCity = useCallback((city: string) => {
    set({ currentCity: city, cityModalOpen: false });
    showToast(`City changed to ${city}`, 'info');
  }, [showToast]);

  const setSearch = useCallback((q: string) => {
    set({ searchQuery: q });
    if (q) navigate('search');
  }, [navigate]);

  // ── Auth (async, API-first) ────────────────────────────────────────────────

  // Helper: fetch & merge this user's bookings from MongoDB into state
  const loadUserBookingsFromDB = useCallback(async () => {
    try {
      const res = await apiGetUserBookings();
      if (res.ok && res.data) {
        const raw: any[] = (res.data as any).bookings ?? (Array.isArray(res.data) ? res.data : []);
        const mapped: Booking[] = raw.map((b: any) => {
          // Backend populates movieId/theatreId as full objects — extract fields safely
          const movieObj    = typeof b.movieId   === 'object' && b.movieId   !== null ? b.movieId   : null;
          const theatreObj  = typeof b.theatreId === 'object' && b.theatreId !== null ? b.theatreId : null;
          const userObj     = typeof b.userId    === 'object' && b.userId    !== null ? b.userId    : null;
          const showObj     = typeof b.showId    === 'object' && b.showId    !== null ? b.showId    : null;

          return {
            id:           b._id || b.id,
            userId:       userObj?._id   || userObj?.id   || b.userId   || '',
            movieId:      movieObj?._id  || movieObj?.id  || b.movieId  || '',
            theatreId:    theatreObj?._id || theatreObj?.id || b.theatreId || '',
            showId:       showObj?._id   || showObj?.id   || b.showId   || '',
            showTimeId:   b.showTimeId   || showObj?._id  || showObj?.id || b.showId || '',
            // Prefer top-level snapshot strings (saved at booking time), fallback to populated obj
            movieTitle:   b.movieTitle   || movieObj?.title   || '',
            theatreName:  b.theatreName  || theatreObj?.name  || '',
            moviePoster:  b.moviePoster  || movieObj?.poster  || '',
            showDate:     b.showDate     || '',
            showTime:     b.showTime     || '',
            showLanguage: b.showLanguage || '',
            showFormat:   b.showFormat   || '2D',
            seats:        Array.isArray(b.seats) ? b.seats : [],
            // Fix: normalize seatDetails so both 'seatId' (DB field) and 'id' (UI field) are available
            seatDetails:  Array.isArray(b.seatDetails)
              ? b.seatDetails.map((sd: any) => ({
                  ...sd,
                  id:     sd.id     || sd.seatId || '',  // UI uses .id
                  seatId: sd.seatId || sd.id     || '',  // DB stores .seatId
                }))
              : [],
            totalAmount:  b.totalAmount  || 0,
            discount:     b.discount     || 0,
            finalAmount:  b.finalAmount  || b.totalAmount || 0,
            couponCode:   b.couponCode   || '',
            paymentMethod: b.paymentMethod || 'online',
            transactionId: b.transactionId || b.razorpayPaymentId || '',
            status:       b.status       || 'confirmed',
            bookingDate:  b.createdAt    || b.bookingDate || '',
            hasRated:     b.hasRated     ?? false,
            ticketCode:   b.ticketCode   || '',
            // Extra fields for optional features
            cancelledAt:  b.cancelledAt,
            cancelledBy:  b.cancelledBy,
            refundAmount: b.refundAmount,
          } as Booking;
        });
        setState(prev => {
          const currentUserId = prev.currentUser?.id;
          if (!currentUserId) return prev;
          const cuid = String(currentUserId);
          // Keep local bookings that aren't yet in DB (backend may have had a transient error)
          const localOnly = prev.bookings.filter(b => {
            const buid = String(b.userId);
            if (buid !== cuid) return false; // not this user's booking
            // Keep it only if DB doesn't already have it (avoid duplicates)
            return !mapped.some(m => m.id === b.id || m.id === (b as any)._id);
          });
          const otherBookings = prev.bookings.filter(b => String(b.userId) !== cuid);
          // Merge: DB results take priority, local-only bookings fill the gap
          return { ...prev, bookings: [...otherBookings, ...mapped, ...localOnly] };
        });
      }
    } catch { /* backend offline — use whatever is in state */ }
  }, []);

  const login = useCallback(async (email: string, password: string, acceptedTerms?: boolean): Promise<boolean> => {
    try {
      const res = await apiLogin(email, password, acceptedTerms);
      if (res.ok && res.data?.user) {
        const apiUser = res.data.user;
        const localUser: User = {
          id: apiUser._id || apiUser.id,
          name: apiUser.name, email: apiUser.email,
          password: '', phone: apiUser.phone || '',
          city: apiUser.city || 'Mumbai',
          role: apiUser.role as User['role'],
          approvalStatus: (apiUser as any).approvalStatus,
          avatar: apiUser.avatar, username: apiUser.username,
          gender: apiUser.gender as User['gender'],
          bio: apiUser.bio, movieInterests: apiUser.movieInterests,
          joinDate: apiUser.joinDate || new Date().toISOString().split('T')[0],
          bookings: [],
          isPrivate: !!(apiUser as any).isPrivate,
        } as any;
        // Merge into local users array so it's available
        setState(prev => {
          const filtered = prev.users.filter(u => u.email !== email);
          const updatedUsers = [...filtered, localUser];
          db.set(KEYS.USERS, updatedUsers);
          return { ...prev, currentUser: localUser, users: updatedUsers, isLoginModalOpen: false, pageHistory: [] };
        });
        showToast(`Welcome back, ${localUser.name}! 🎬`, 'success');
        // ── Immediately load this user's real bookings from MongoDB ──────────
        // Run async, no await — so login is fast; bookings populate in background
        setTimeout(() => loadUserBookingsFromDB(), 100);
        if (localUser.role === 'admin') navigate('admin');
        else if (localUser.role === 'theatre_owner') {
          const approvalStatus = (localUser as any).approvalStatus;
          if (approvalStatus === 'approved') navigate('theatre-owner');
        } else navigate('user-dashboard');
        return true;
      } else if (res.message === 'Backend offline') {
        // Fallback: local check when backend is offline
        const latestUsers = db.get<User[]>(KEYS.USERS) ?? state.users;
        const user = latestUsers.find(u => u.email === email && u.password === password);
        if (user) {
          set({ currentUser: user, isLoginModalOpen: false, users: latestUsers, pageHistory: [] });
          showToast(`Welcome back, ${user.name}! 🎬`, 'success');
          if (user.role === 'admin') navigate('admin');
          else if (user.role === 'theatre_owner') navigate('theatre-owner');
          else navigate('user-dashboard');
          return true;
        } else {
          showToast('Invalid email or password', 'error');
          return false;
        }
      } else {
        const data = res.data as any;
        const code = data?.code;
        if (code === 'PENDING_APPROVAL') {
          showToast('⏳ Your account is under verification. Please wait 24–48 hours for admin approval.', 'info');
        } else if (code === 'REJECTED') {
          showToast('❌ Your registration was not approved. Please contact support.', 'error');
        } else {
          showToast(res.message || 'Invalid email or password', 'error');
        }
        return false;
      }
    } catch {
      showToast('Login failed. Please try again.', 'error');
      return false;
    }
  }, [state.users, showToast, navigate, loadUserBookingsFromDB]);

  const register = useCallback(async (
    name: string, email: string, password: string, phone: string,
    role = 'user',
    profile?: { avatar?: string; username?: string; gender?: 'Male' | 'Female' | 'Other'; bio?: string; movieInterests?: string[]; acceptedTerms?: boolean }
  ): Promise<boolean> => {
    try {
      const res = await apiRegister({
        name, email, password, phone, role,
        avatar: profile?.avatar,
        username: profile?.username,
        gender: profile?.gender,
        bio: profile?.bio,
        movieInterests: profile?.movieInterests,
        acceptedTerms: profile?.acceptedTerms,
      });
      if (res.ok && res.data?.user) {
        const dbUser = res.data.user;
        const newUser: User = {
          id: dbUser._id || dbUser.id,
          name: dbUser.name, email: dbUser.email,
          password: '', phone: dbUser.phone || phone,
          city: dbUser.city || state.currentCity,
          role: dbUser.role as User['role'],
          avatar: dbUser.avatar, username: dbUser.username,
          gender: dbUser.gender as User['gender'],
          bio: dbUser.bio, movieInterests: dbUser.movieInterests,
          joinDate: dbUser.joinDate || new Date().toISOString().split('T')[0],
          bookings: [],
          isPrivate: !!(dbUser as any).isPrivate,
        } as any;
        setState(prev => {
          const filtered = prev.users.filter(u => u.email !== email);
          const updatedUsers = [...filtered, newUser];
          db.set(KEYS.USERS, updatedUsers);
          return { ...prev, users: updatedUsers, currentUser: newUser, isLoginModalOpen: false, pageHistory: [] };
        });
        showToast(`Welcome to CineConnect, ${name}! 🎉`, 'success');
        // New user has no bookings yet — clear any stale seed bookings for this user
        setState(prev => ({
          ...prev,
          bookings: prev.bookings.filter(b => b.userId !== (dbUser._id || dbUser.id)),
        }));
        if (role === 'admin') navigate('admin');
        else if (role === 'theatre_owner') navigate('theatre-owner');
        else navigate('user-dashboard');
        return true;
      } else if (res.message === 'Backend offline') {
        const latestUsers = db.get<User[]>(KEYS.USERS) ?? state.users;
        if (latestUsers.find(u => u.email === email)) {
          showToast('Email already registered', 'error');
          return false;
        }
        const newUser: User = {
          id: `user_${Date.now()}`, name, email, password, phone,
          city: state.currentCity, role: role as User['role'],
          joinDate: new Date().toISOString().split('T')[0], bookings: [],
          ...(profile?.avatar && { avatar: profile.avatar }),
          ...(profile?.username && { username: profile.username }),
          ...(profile?.gender && { gender: profile.gender }),
          ...(profile?.bio && { bio: profile.bio }),
          ...(profile?.movieInterests && { movieInterests: profile.movieInterests }),
        };
        const updated = [...latestUsers, newUser];
        db.set(KEYS.USERS, updated);
        setState(prev => ({ ...prev, users: updated, currentUser: newUser, isLoginModalOpen: false, pageHistory: [] }));
        showToast(`Welcome to CineConnect, ${name}! 🎉 (offline mode)`, 'success');
        if (role === 'admin') navigate('admin');
        else if (role === 'theatre_owner') navigate('theatre-owner');
        else navigate('user-dashboard');
        return true;
      } else {
        showToast(res.message || 'Registration failed. Email may already be in use.', 'error');
        return false;
      }
    } catch {
      showToast('Registration failed. Please try again.', 'error');
      return false;
    }
  }, [state.users, state.currentCity, showToast, navigate]);

  const logout = useCallback(() => {
    apiLogout(); // clear JWT + user from localStorage
    localStorage.removeItem('cc_user');
    setState(prev => ({
      ...prev,
      currentUser: null,
      bookings: [], // clear user bookings from state
      pageHistory: [],
    }));
    navigate('auth');
    showToast('Logged out successfully. See you next time! 👋', 'info');
  }, [navigate, showToast]);

  // openLogin now redirects to the auth page instead of opening a modal
  const openLogin = useCallback((_mode: 'login' | 'register' = 'login', _role: 'user' | 'admin' | 'theatre_owner' = 'user') => {
    setState(prev => ({
      ...prev,
      page: 'auth',
      isLoginModalOpen: false,
      pageHistory: prev.page !== 'auth' ? [...prev.pageHistory.slice(-19), prev.page] : prev.pageHistory,
    }));
  }, []);

  const closeLogin = useCallback(() => set({ isLoginModalOpen: false }), []);
  const openCityModal = useCallback(() => set({ cityModalOpen: true }), []);
  const closeCityModal = useCallback(() => set({ cityModalOpen: false }), []);
  const setFilterGenre = useCallback((g: string) => set({ filterGenre: g }), []);
  const setFilterLanguage = useCallback((l: string) => set({ filterLanguage: l }), []);
  const setFilterTheatreType = useCallback((t: string) => set({ filterTheatreType: t }), []);

  // ── Book Tickets Modal ─────────────────────────────────────────────────────
  const openBookTickets = useCallback((movie: Movie) => {
    set({ bookTickets: { open: true, movie }, selectedMovie: movie });
  }, []);

  const closeBookTickets = useCallback(() => {
    set({ bookTickets: { open: false, movie: null } });
  }, []);

  // ── Bookings ───────────────────────────────────────────────────────────────
  const addBooking = useCallback(async (booking: Omit<Booking, 'id'>): Promise<Booking> => {
    const newBooking: Booking = { ...booking, id: `b_${Date.now()}` };

    // Optimistically add to state immediately so UI is responsive
    setState(prev => ({
      ...prev,
      bookings: [...prev.bookings.filter(b => b.id !== newBooking.id), newBooking],
      currentUser: prev.currentUser?.id === booking.userId
        ? { ...prev.currentUser, bookings: [...(prev.currentUser.bookings || []), newBooking.id] }
        : prev.currentUser,
    }));

    // Try to persist to backend
    try {
      const res = await apiCreateBooking(booking);
      if (res.ok && res.data) {
        const saved = (res.data as any).booking || res.data;
        // Upgrade the optimistic booking with real DB fields
        const backendBooking: Booking = {
          ...newBooking,
          id:          saved._id         || saved.id         || newBooking.id,
          ticketCode:  saved.ticketCode  || newBooking.ticketCode  || '',
          moviePoster: saved.moviePoster || saved.movieId?.poster  || newBooking.moviePoster || '',
          seatDetails: Array.isArray(saved.seatDetails)
            ? saved.seatDetails.map((sd: any) => ({ ...sd, id: sd.id || sd.seatId || '', seatId: sd.seatId || sd.id || '' }))
            : newBooking.seatDetails || [],
        };
        // Replace optimistic entry with real backend entry
        setState(prev => ({
          ...prev,
          bookings: [...prev.bookings.filter(b => b.id !== newBooking.id), backendBooking],
          currentUser: prev.currentUser?.id === booking.userId
            ? { ...prev.currentUser, bookings: [...(prev.currentUser.bookings || []).filter((id: string) => id !== newBooking.id), backendBooking.id] }
            : prev.currentUser,
        }));
        // Signal all dashboards + refresh from DB
        try { localStorage.setItem('cc_booking_ts', String(Date.now())); } catch { /* ignore */ }
        loadUserBookingsFromDB();
        return backendBooking;
      } else {
        // Backend returned an error — show toast AND log so developer can debug
        const errMsg = (res.data as any)?.message || res.message || 'Booking save failed';
        console.error('[addBooking] Backend rejected booking:', errMsg, res.data);
        showToast(`⚠️ Booking saved locally only — ${errMsg}. Try again or check network.`, 'error');
        // Keep the optimistic booking in state for this session
        loadUserBookingsFromDB();
        return newBooking;
      }
    } catch (err: any) {
      console.error('[addBooking] Network/exception error:', err);
      showToast('⚠️ Could not reach server. Booking saved locally only.', 'error');
      return newBooking;
    }
  }, [loadUserBookingsFromDB, showToast]);

  const cancelBooking = useCallback(async (bookingId: string, cancelledBy: 'user' | 'theatre_owner' | 'admin' = 'user') => {
    // Try backend first
    try { await apiCancelBooking(bookingId); } catch { /* fallback to local */ }
    setState(prev => {
      const booking = prev.bookings.find(b => b.id === bookingId);
      if (!booking) return prev;
      const refundAmount = cancelledBy === 'user'
        ? Math.floor(booking.finalAmount * 0.8)
        : booking.finalAmount;
      return {
        ...prev,
        bookings: prev.bookings.map(b =>
          b.id === bookingId
            ? { ...b, status: 'cancelled', cancelledAt: new Date().toISOString().split('T')[0], cancelledBy, refundAmount }
            : b
        ),
      };
    });
    showToast('Booking cancelled. Refund will be processed in 5-7 business days.', 'info');
  }, [showToast]);

  // ── Ratings ────────────────────────────────────────────────────────────────
  const rateMovie = useCallback((movieId: string, rating: number, review: string, bookingId: string) => {
    setState(prev => {
      const user = prev.currentUser;
      if (!user) return prev;
      const movie = prev.movies.find(m => m.id === movieId);
      if (!movie) return prev;
      const existingRatings = (movie.userRatings || []).filter(r => r.userId !== user.id);
      const newRating = { userId: user.id, userName: user.name, rating, review, date: new Date().toISOString().split('T')[0] };
      const allRatings = [...existingRatings, newRating];
      const avgRating = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
      const newRatingVal = parseFloat(avgRating.toFixed(1));
      const updatedMovie = { ...movie, userRatings: allRatings, votes: movie.votes + 1, rating: newRatingVal };
      return {
        ...prev,
        movies: prev.movies.map(m => m.id === movieId ? updatedMovie : m),
        bookings: prev.bookings.map(b => b.id === bookingId ? { ...b, hasRated: true } : b),
        selectedMovie: prev.selectedMovie?.id === movieId ? updatedMovie : prev.selectedMovie,
      };
    });
    showToast('Rating submitted! Thank you for your review.', 'success');
  }, [showToast]);

  // ── Likes / Dislikes / Interests ───────────────────────────────────────────
  const toggleMovieLike = useCallback((movieId: string) => {
    setState(prev => {
      if (!prev.currentUser) {
        showToast('Sign in to like movies', 'info');
        return { ...prev, isLoginModalOpen: true };
      }
      const uid = prev.currentUser.id;
      // Remove dislike if present — can't like & dislike simultaneously
      const currentDislikes = prev.movieDislikes[movieId] || [];
      const newDislikes = { ...prev.movieDislikes, [movieId]: currentDislikes.filter(id => id !== uid) };
      const current = prev.movieLikes[movieId] || [];
      const isLiked = current.includes(uid);
      const updated = isLiked ? current.filter(id => id !== uid) : [...current, uid];
      const newLikes = { ...prev.movieLikes, [movieId]: updated };
      db.set(KEYS.MOVIE_LIKES, newLikes);
      db.set(KEYS.MOVIE_DISLIKES, newDislikes);
      showToast(isLiked ? 'Removed from likes' : '❤️ Added to your likes!', 'info');
      return { ...prev, movieLikes: newLikes, movieDislikes: newDislikes };
    });
  }, [showToast]);

  const toggleMovieDislike = useCallback((movieId: string) => {
    setState(prev => {
      if (!prev.currentUser) {
        showToast('Sign in to react to movies', 'info');
        return { ...prev, isLoginModalOpen: true };
      }
      const uid = prev.currentUser.id;
      // Remove like if present — can't like & dislike simultaneously
      const currentLikes = prev.movieLikes[movieId] || [];
      const newLikes = { ...prev.movieLikes, [movieId]: currentLikes.filter(id => id !== uid) };
      const current = prev.movieDislikes[movieId] || [];
      const isDisliked = current.includes(uid);
      const updated = isDisliked ? current.filter(id => id !== uid) : [...current, uid];
      const newDislikes = { ...prev.movieDislikes, [movieId]: updated };
      db.set(KEYS.MOVIE_LIKES, newLikes);
      db.set(KEYS.MOVIE_DISLIKES, newDislikes);
      showToast(isDisliked ? 'Removed dislike' : '👎 Disliked', 'info');
      return { ...prev, movieLikes: newLikes, movieDislikes: newDislikes };
    });
  }, [showToast]);

  const toggleMovieInterest = useCallback((movieId: string) => {
    setState(prev => {
      if (!prev.currentUser) {
        showToast('Sign in to mark interest', 'info');
        return { ...prev, isLoginModalOpen: true };
      }
      const uid = prev.currentUser.id;
      const current = prev.movieInterests[movieId] || [];
      const isInterested = current.includes(uid);
      const updated = isInterested ? current.filter(id => id !== uid) : [...current, uid];
      const newInterests = { ...prev.movieInterests, [movieId]: updated };
      db.set(KEYS.MOVIE_INTERESTS, newInterests);
      showToast(isInterested ? 'Removed interest' : "🔔 You're interested! We'll notify you.", 'info');
      return { ...prev, movieInterests: newInterests };
    });
  }, [showToast]);

  // ── Movie CRUD (persist to backend) ────────────────────────────────────────
  const addMovie = useCallback(async (movie: Omit<Movie, 'id'>) => {
    const newMovie: Movie = { ...movie, id: `m_${Date.now()}`, userRatings: movie.userRatings || [] };
    // Try backend first
    try {
      const res = await apiCreateMovie(movie);
      if (res.ok && res.data) {
        const saved = res.data as any;
        const savedMovieObj = saved.movie || saved;
        const backendMovie: Movie = { ...newMovie, id: savedMovieObj._id || savedMovieObj.id || newMovie.id };
        setState(prev => ({ ...prev, movies: [...prev.movies, backendMovie] }));
        showToast('Movie added & saved to database', 'success');
        return;
      }
    } catch { /* fallback to local */ }
    setState(prev => ({ ...prev, movies: [...prev.movies, newMovie] }));
    showToast('Movie added (local only)', 'success');
  }, [showToast]);

  const updateMovie = useCallback(async (movie: Movie) => {
    // Try backend first
    try {
      const res = await apiUpdateMovie(movie.id, movie);
      if (res.ok) {
        setState(prev => ({
          ...prev,
          movies: prev.movies.map(m => m.id === movie.id ? movie : m),
          selectedMovie: prev.selectedMovie?.id === movie.id ? movie : prev.selectedMovie,
        }));
        showToast('Movie updated & saved to database', 'success');
        return;
      }
    } catch { /* fallback to local */ }
    setState(prev => ({
      ...prev,
      movies: prev.movies.map(m => m.id === movie.id ? movie : m),
      selectedMovie: prev.selectedMovie?.id === movie.id ? movie : prev.selectedMovie,
    }));
    showToast('Movie updated (local only)', 'success');
  }, [showToast]);

  const deleteMovie = useCallback(async (movieId: string) => {
    // Try backend first
    try {
      const res = await apiDeleteMovie(movieId);
      if (res.ok) {
        setState(prev => ({ ...prev, movies: prev.movies.filter(m => m.id !== movieId) }));
        showToast('Movie deleted from database', 'info');
        return;
      }
    } catch { /* fallback to local */ }
    setState(prev => ({ ...prev, movies: prev.movies.filter(m => m.id !== movieId) }));
    showToast('Movie deleted (local only)', 'info');
  }, [showToast]);

  // ── Theatre CRUD (persist to backend) ───────────────────────────────────────
  const addTheatre = useCallback(async (theatre: Omit<Theatre, 'id'>) => {
    const newTheatre: Theatre = {
      ...theatre, id: `t_${Date.now()}`,
      screens: theatre.screens.map((s, i) => ({ ...s, id: `s_new_${i}_${Date.now()}`, seats: generateSeats(s.rows, s.cols) })),
    };
    // Try backend first
    try {
      const res = await apiCreateTheatre(theatre);
      if (res.ok && res.data) {
        const saved = res.data as any;
        const savedTheatreObj = saved.theatre || saved;
        const backendTheatre: Theatre = { ...newTheatre, id: savedTheatreObj._id || savedTheatreObj.id || newTheatre.id };
        setState(prev => ({ ...prev, theatres: [...prev.theatres, backendTheatre] }));
        showToast('Theatre added & saved to database', 'success');
        return;
      }
    } catch { /* fallback to local */ }
    setState(prev => ({ ...prev, theatres: [...prev.theatres, newTheatre] }));
    showToast('Theatre added (local only)', 'success');
  }, [showToast]);

  const updateTheatre = useCallback(async (theatre: Theatre) => {
    try {
      const res = await apiUpdateTheatre(theatre.id, theatre);
      if (res.ok) {
        setState(prev => ({ ...prev, theatres: prev.theatres.map(t => t.id === theatre.id ? theatre : t) }));
        showToast('Theatre updated & saved to database', 'success');
        return;
      }
    } catch { /* fallback to local */ }
    setState(prev => ({ ...prev, theatres: prev.theatres.map(t => t.id === theatre.id ? theatre : t) }));
    showToast('Theatre updated (local only)', 'success');
  }, [showToast]);

  const deleteTheatre = useCallback(async (theatreId: string) => {
    try {
      const res = await apiDeleteTheatre(theatreId);
      if (res.ok) {
        setState(prev => ({ ...prev, theatres: prev.theatres.filter(t => t.id !== theatreId) }));
        showToast('Theatre deleted from database', 'info');
        return;
      }
    } catch { /* fallback to local */ }
    setState(prev => ({ ...prev, theatres: prev.theatres.filter(t => t.id !== theatreId) }));
    showToast('Theatre deleted (local only)', 'info');
  }, [showToast]);

  // ── Coupon CRUD (persist to backend) ────────────────────────────────────────
  const addCoupon = useCallback(async (coupon: Omit<Coupon, 'id'>) => {
    const newCoupon: Coupon = { ...coupon, id: `c_${Date.now()}` };
    try {
      const res = await apiCreateCoupon(coupon);
      if (res.ok && res.data) {
        const saved = res.data as any;
        const backendCoupon: Coupon = { ...newCoupon, id: saved._id || saved.id || newCoupon.id };
        setState(prev => ({ ...prev, coupons: [...prev.coupons, backendCoupon] }));
        showToast('Coupon added & saved to database', 'success');
        return;
      }
    } catch { /* fallback */ }
    setState(prev => ({ ...prev, coupons: [...prev.coupons, newCoupon] }));
    showToast('Coupon added (local only)', 'success');
  }, [showToast]);

  const updateCoupon = useCallback(async (coupon: Coupon) => {
    try {
      const res = await apiUpdateCoupon(coupon.id, coupon);
      if (res.ok) {
        setState(prev => ({ ...prev, coupons: prev.coupons.map(c => c.id === coupon.id ? coupon : c) }));
        showToast('Coupon updated & saved', 'success');
        return;
      }
    } catch { /* fallback */ }
    setState(prev => ({ ...prev, coupons: prev.coupons.map(c => c.id === coupon.id ? coupon : c) }));
    showToast('Coupon updated (local only)', 'success');
  }, [showToast]);

  const deleteCoupon = useCallback(async (couponId: string) => {
    try {
      const res = await apiDeleteCoupon(couponId);
      if (res.ok) {
        setState(prev => ({ ...prev, coupons: prev.coupons.filter(c => c.id !== couponId) }));
        showToast('Coupon deleted from database', 'info');
        return;
      }
    } catch { /* fallback */ }
    setState(prev => ({ ...prev, coupons: prev.coupons.filter(c => c.id !== couponId) }));
    showToast('Coupon deleted (local only)', 'info');
  }, [showToast]);

  const applyCoupon = useCallback((code: string, amount: number): { discount: number; coupon: Coupon } | null => {
    const coupon = state.coupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.isActive);
    if (!coupon || amount < coupon.minAmount) return null;
    let discount = coupon.discountType === 'percentage'
      ? Math.floor((amount * coupon.discount) / 100)
      : coupon.discount;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    return { discount, coupon };
  }, [state.coupons]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getUserBookings = useCallback((): Booking[] => {
    if (!state.currentUser) return [];
    const uid = state.currentUser.id;
    return state.bookings.filter(b => {
      const rawId = b.userId as any;
      const bUid = typeof rawId === 'object' ? (rawId?._id || rawId?.id || rawId) : rawId;
      return String(bUid) === uid || bUid === uid;
    });
  }, [state.bookings, state.currentUser]);

  // Auto-load bookings from MongoDB whenever currentUser changes (login, session restore)
  useEffect(() => {
    if (state.currentUser?.id) {
      loadUserBookingsFromDB();
    }
  }, [state.currentUser?.id, loadUserBookingsFromDB]);

  // Real-time polling: keep user bookings fresh every 30s while logged in
  useEffect(() => {
    if (!state.currentUser?.id) return;
    const poll = setInterval(() => loadUserBookingsFromDB(), 30000);
    return () => clearInterval(poll);
  }, [state.currentUser?.id, loadUserBookingsFromDB]);

  // Expose so UserDashboard / MyBookings / TheatreOwner can manually trigger a refresh
  const refreshUserBookings = useCallback(async () => { await loadUserBookingsFromDB(); }, [loadUserBookingsFromDB]);

  const getOwnerTheatres = useCallback((): Theatre[] => {
    if (!state.currentUser) return [];
    return state.theatres.filter(t => t.ownerId === state.currentUser!.id);
  }, [state.theatres, state.currentUser]);

  // ── Approval System ────────────────────────────────────────────────────────
  const submitTheatreApprovalRequest = useCallback((data: Omit<TheatreApprovalRequest, 'id' | 'status' | 'submittedAt'>) => {
    const newRequest: TheatreApprovalRequest = {
      ...data, id: `req_${Date.now()}`, status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
    };
    setState(prev => ({ ...prev, approvalRequests: [...prev.approvalRequests, newRequest] }));
    showToast('Theatre approval request submitted! Admin will review shortly.', 'success');
  }, [showToast]);

  const reviewApprovalRequest = useCallback((requestId: string, status: ApprovalStatus, note?: string) => {
    setState(prev => {
      const request = prev.approvalRequests.find(r => r.id === requestId);
      if (!request) return prev;
      const updatedRequests = prev.approvalRequests.map(r =>
        r.id === requestId
          ? { ...r, status, reviewedAt: new Date().toISOString().split('T')[0], adminNote: note }
          : r
      );
      let updatedTheatres = prev.theatres;
      if (status === 'approved') {
        const newTheatre: Theatre = {
          ...request.theatreData, id: `t_${Date.now()}`,
          approvalStatus: 'approved', isActive: true, showTimes: [],
          screens: request.theatreData.screens.map((s, i) => ({
            ...s, id: `s_${i}_${Date.now()}`, seats: generateSeats(s.rows, s.cols),
          })),
        };
        updatedTheatres = [...prev.theatres, newTheatre];
      }
      return { ...prev, approvalRequests: updatedRequests, theatres: updatedTheatres };
    });
    showToast(
      status === 'approved' ? 'Theatre approved and listed!' : 'Theatre request rejected.',
      status === 'approved' ? 'success' : 'error'
    );
  }, [showToast]);

  const getPendingRequests = useCallback((): TheatreApprovalRequest[] =>
    state.approvalRequests.filter(r => r.status === 'pending'),
    [state.approvalRequests]);

  const getOwnerApprovalRequest = useCallback((): TheatreApprovalRequest | null => {
    if (!state.currentUser) return null;
    const requests = state.approvalRequests
      .filter(r => r.ownerId === state.currentUser!.id)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    return requests[0] || null;
  }, [state.approvalRequests, state.currentUser]);

  // ── Theatre Owner Ticket Management ───────────────────────────────────────
  const getTheatreBookings = useCallback((theatreId: string): Booking[] =>
    state.bookings.filter(b => b.theatreId === theatreId),
    [state.bookings]);

  const cancelBookingByOwner = useCallback((bookingId: string) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b =>
        b.id === bookingId
          ? { ...b, status: 'cancelled', cancelledAt: new Date().toISOString().split('T')[0], cancelledBy: 'theatre_owner', refundAmount: b.finalAmount }
          : b
      ),
    }));
    showToast('Booking cancelled. Full refund initiated to customer.', 'info');
  }, [showToast]);

  // ── Showtime Management ────────────────────────────────────────────────────
  const addShowTime = useCallback((theatreId: string, showTime: Omit<ShowTime, 'id'>) => {
    const newST: ShowTime = { ...showTime, id: `st_${Date.now()}_${Math.random().toString(36).slice(2)}`, isOwnerManaged: true };
    setState(prev => ({
      ...prev,
      theatres: prev.theatres.map(t =>
        t.id === theatreId ? { ...t, showTimes: [...t.showTimes, newST] } : t
      ),
    }));
    showToast('Showtime added!', 'success');
  }, [showToast]);

  const updateShowTime = useCallback((theatreId: string, showTime: ShowTime) => {
    setState(prev => ({
      ...prev,
      theatres: prev.theatres.map(t =>
        t.id === theatreId
          ? { ...t, showTimes: t.showTimes.map(st => st.id === showTime.id ? showTime : st) }
          : t
      ),
    }));
    showToast('Showtime updated!', 'success');
  }, [showToast]);

  const deleteShowTime = useCallback((theatreId: string, showTimeId: string) => {
    setState(prev => ({
      ...prev,
      theatres: prev.theatres.map(t =>
        t.id === theatreId
          ? { ...t, showTimes: t.showTimes.filter(st => st.id !== showTimeId) }
          : t
      ),
    }));
    showToast('Showtime deleted', 'info');
  }, [showToast]);

  const endShowTime = useCallback((theatreId: string, showTimeId: string) => {
    setState(prev => ({
      ...prev,
      theatres: prev.theatres.map(t =>
        t.id !== theatreId ? t : {
          ...t,
          showTimes: t.showTimes.map(st =>
            st.id !== showTimeId ? st : {
              ...st, isEnded: true, endedAt: new Date().toISOString(),
            }
          ),
        }
      ),
    }));
    showToast('Show ended. Attendees can now rate this movie.', 'success');
  }, [showToast]);

  const assignMovieToShowTime = useCallback((theatreId: string, showTimeId: string, movieId: string) => {
    setState(prev => ({
      ...prev,
      theatres: prev.theatres.map(t =>
        t.id === theatreId
          ? { ...t, showTimes: t.showTimes.map(st => st.id === showTimeId ? { ...st, movieId: movieId || undefined } : st) }
          : t
      ),
    }));
    showToast(movieId ? 'Movie assigned to showtime!' : 'Movie removed from showtime', 'success');
  }, [showToast]);

  // ── Seat Blocking (Theatre Owner) ─────────────────────────────────────────
  const blockSeat = useCallback((theatreId: string, screenId: string, seatId: string, reason = 'Blocked by owner') => {
    setState(prev => ({
      ...prev,
      theatres: prev.theatres.map(t =>
        t.id !== theatreId ? t : {
          ...t,
          screens: t.screens.map(sc =>
            sc.id !== screenId ? sc : {
              ...sc,
              seats: sc.seats.map(s =>
                s.id !== seatId ? s : { ...s, isBlocked: true, blockedReason: reason }
              ),
            }
          ),
        }
      ),
    }));
    showToast(`Seat ${seatId} blocked`, 'info');
  }, [showToast]);

  const unblockSeat = useCallback((theatreId: string, screenId: string, seatId: string) => {
    setState(prev => ({
      ...prev,
      theatres: prev.theatres.map(t =>
        t.id !== theatreId ? t : {
          ...t,
          screens: t.screens.map(sc =>
            sc.id !== screenId ? sc : {
              ...sc,
              seats: sc.seats.map(s =>
                s.id !== seatId ? s : { ...s, isBlocked: false, blockedReason: undefined }
              ),
            }
          ),
        }
      ),
    }));
    showToast(`Seat ${seatId} unblocked`, 'success');
  }, [showToast]);

  // ── Confirm Booking: mark seats as isBooked in theatre screen ─────────────
  const confirmBookingSeats = useCallback((theatreId: string, screenId: string, seatIds: string[]) => {
    setState(prev => ({
      ...prev,
      theatres: prev.theatres.map(t =>
        t.id !== theatreId ? t : {
          ...t,
          screens: t.screens.map(sc =>
            sc.id !== screenId ? sc : {
              ...sc,
              seats: sc.seats.map(s =>
                seatIds.includes(s.id) ? { ...s, isBooked: true } : s
              ),
            }
          ),
        }
      ),
    }));
  }, []);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetToSeedData = useCallback(() => {
    db.clear();
    setState(prev => ({
      ...prev,
      movies: MOVIES, theatres: THEATRES, bookings: BOOKINGS,
      coupons: COUPONS, users: USERS, offers: OFFERS,
      approvalRequests: APPROVAL_REQUESTS,
      movieLikes: {}, movieDislikes: {}, movieInterests: {}, currentUser: null,
      bookTickets: { open: false, movie: null },
    }));
    showToast('Data reset to defaults', 'info');
    navigate('auth');
  }, [showToast, navigate]);
  // ── Update current user (patch any fields — also syncs localStorage cache) ──
  const updateCurrentUser = useCallback((patch: Partial<Record<string, any>>) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const updated = { ...prev.currentUser, ...patch };
      // Keep localStorage user cache in sync so page reload restores the right user
      try { localStorage.setItem('cc_user', JSON.stringify(updated)); } catch { /* ignore */ }
      return { ...prev, currentUser: updated as any };
    });
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      navigate, navigateToProfile, goBack, selectMovie, selectTheatre, selectShowTime, toggleSeat,
      setCity, setSearch, login, register, logout, openLogin, closeLogin,
      openCityModal, closeCityModal, showToast,
      openBookTickets, closeBookTickets,
      addBooking, cancelBooking, rateMovie,
      toggleMovieLike, toggleMovieDislike, toggleMovieInterest,
      addMovie, updateMovie, deleteMovie,
      addTheatre, updateTheatre, deleteTheatre,
      addCoupon, updateCoupon, deleteCoupon, applyCoupon,
      setFilterGenre, setFilterLanguage, setFilterTheatreType,
      getUserBookings, getOwnerTheatres,
      submitTheatreApprovalRequest, reviewApprovalRequest, getPendingRequests, getOwnerApprovalRequest,
      getTheatreBookings, cancelBookingByOwner,
      addShowTime, updateShowTime, deleteShowTime, endShowTime, assignMovieToShowTime,
      blockSeat, unblockSeat, confirmBookingSeats,
      resetToSeedData,
      updateCurrentUser,
      refreshUserBookings,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
