/**
 * src/services/apiService.ts
 * Thin wrapper around the CineConnect backend API (MongoDB).
 * Falls back gracefully when backend is offline.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('cc_token') || '';

const getAdminToken = (): string => {
  try {
    const raw = localStorage.getItem('cc_admin_session');
    if (!raw) return '';
    const session = JSON.parse(raw);
    if (session.expiresAt < Date.now()) return '';
    return session.accessToken || '';
  } catch { return ''; }
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data: T | null; message: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers || {}),
      },
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, data: json as T, message: json.message || 'Request failed' };
    return { ok: true, data: json as T, message: '' };
  } catch {
    return { ok: false, data: null, message: 'Backend offline' };
  }
}

async function adminApiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data: T | null; message: string }> {
  try {
    const adminToken = getAdminToken();
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        ...(options.headers || {}),
      },
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, data: json as T, message: json.message || 'Request failed' };
    return { ok: true, data: json as T, message: '' };
  } catch {
    return { ok: false, data: null, message: 'Backend offline' };
  }
}

/* ─── Auth ─────────────────────────────────────────────────────────────────── */

export interface ApiUser {
  _id: string;
  id:  string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: 'user' | 'admin' | 'theatre_owner';
  avatar: string;
  username: string;
  gender: string;
  bio: string;
  movieInterests: string[];
  joinDate: string;
  bookings: string[];
}

interface AuthResponse { success: boolean; token: string; user: ApiUser; }

export async function apiRegister(payload: {
  name: string; email: string; password: string; phone: string;
  role?: string; avatar?: string; username?: string;
  gender?: string; bio?: string; movieInterests?: string[];
  acceptedTerms?: boolean;
}) {
  const r = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (r.ok && r.data?.token) {
    localStorage.setItem('cc_token', r.data.token);
    localStorage.setItem('cc_user', JSON.stringify(r.data.user));
  }
  return r;
}

export async function apiLogin(email: string, password: string, acceptedTerms?: boolean) {
  const r = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, acceptedTerms }),
  });
  if (r.ok && r.data?.token) {
    localStorage.setItem('cc_token', r.data.token);
    localStorage.setItem('cc_user', JSON.stringify(r.data.user));
  }
  return r;
}

export async function apiGetMe() {
  return apiFetch<{ success: boolean; user: ApiUser }>('/auth/me');
}

export async function apiUpdateMe(payload: Partial<ApiUser>) {
  const r = await apiFetch<{ success: boolean; user: ApiUser }>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (r.ok && r.data?.user) {
    localStorage.setItem('cc_user', JSON.stringify(r.data.user));
  }
  return r;
}

/**
 * Upload a profile photo to MongoDB via PUT /api/auth/me/avatar.
 * Accepts a File object; backend converts buffer → base64 → stores in User.avatar.
 */
export async function apiUploadAvatar(file: File): Promise<{ ok: boolean; avatar: string; message: string }> {
  try {
    const token = getToken();
    const form  = new FormData();
    form.append('avatar', file);

    const res  = await fetch(`${BASE}/auth/me/avatar`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, avatar: '', message: json.message || 'Upload failed' };

    // Keep local copy so it's available without re-login
    if (json.user) localStorage.setItem('cc_user', JSON.stringify(json.user));

    return { ok: true, avatar: json.avatar || '', message: '' };
  } catch {
    return { ok: false, avatar: '', message: 'Backend offline — avatar not saved to database.' };
  }
}

export function apiLogout() {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_user');
}

export function isBackendAvailable(): Promise<boolean> {
  return fetch(`${BASE}/health`, { method: 'GET' })
    .then(r => r.ok)
    .catch(() => false);
}

/* ─── Admin Notifications ────────────────────────────────────────────────── */

export async function apiSendNotification(payload: {
  title: string; message: string; type: string; target: string; targetEmail?: string;
}) {
  let targetRole = 'all_users';
  if (payload.target === 'theatre_owner') targetRole = 'all_theatre_owners';
  else if (payload.target === 'user') targetRole = 'all_users';
  else if (payload.target === 'all_users') targetRole = 'all_users';
  else if (payload.target === 'specific_user') targetRole = 'specific_user';

  return adminApiFetch<{ success: boolean }>('/admin/notify-all', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      message: payload.message,
      type: payload.type,
      targetRole: targetRole,
      targetEmail: payload.targetEmail
    }),
  });
}

export async function apiGetNotifications() {
  return adminApiFetch<{ success: boolean; notifications: any[] }>('/admin/notifications');
}

/* ─── Theatre Owner Registration ─────────────────────────────────────────── */

export async function apiTheatreOwnerRegister(payload: {
  name: string; email: string; password: string; phone: string;
  avatar?: string; theatreName: string; theatreLocation: string; theatreCity: string;
  aadhaarNumber: string; aadhaarFront?: string; aadhaarBack?: string;
  bankAccountHolder: string; bankName: string; bankAccountNumber: string; bankIfsc: string;
}) {
  const r = await apiFetch<{
    success: boolean; token: string; user: ApiUser;
    requestId: string; status: string; message: string;
  }>('/theatre-owner/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (r.ok && r.data?.token) {
    localStorage.setItem('cc_token', r.data.token);
    localStorage.setItem('cc_user', JSON.stringify(r.data.user));
  }
  return r;
}

/* ─── Admin: Theatre Owner Management ────────────────────────────────────── */

export async function apiGetTheatreOwnerRequests(status?: string, search?: string) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  const qs = params.toString();
  return adminApiFetch<{ success: boolean; requests: any[]; counts: Record<string, number> }>(
    `/admin/theatre-owners${qs ? '?' + qs : ''}`
  );
}

export async function apiGetTheatreOwnerDetail(id: string) {
  return adminApiFetch<{ success: boolean; request: any }>(`/admin/theatre-owners/${id}`);
}

export async function apiApproveTheatreOwner(id: string, note?: string) {
  return adminApiFetch<{ success: boolean; request: any; message: string }>(
    `/admin/theatre-owners/${id}/approve`,
    { method: 'PUT', body: JSON.stringify({ note: note || 'Approved' }) }
  );
}

export async function apiRejectTheatreOwner(id: string, reason: string) {
  return adminApiFetch<{ success: boolean; request: any; message: string }>(
    `/admin/theatre-owners/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

/* ─── Admin: Payouts ─────────────────────────────────────────────────────── */

export async function apiGetAdminPayoutSummaries() {
  return adminApiFetch<{ success: boolean; summary: any[] }>('/admin/payout-summary');
}

export async function apiMarkPayoutPaid(payload: { ownerId: string; amount: number; transactionId?: string; paymentMethod?: string; adminNote?: string; }) {
  return adminApiFetch<{ success: boolean; payout: any }>('/admin/payouts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ─── Admin: Movies CRUD ─────────────────────────────────────────────────── */

export async function apiGetMovies() {
  return apiFetch<{ success: boolean; movies: any[] }>('/movies');
}

export async function apiCreateMovie(payload: any) {
  return adminApiFetch<{ success: boolean; movie: any }>('/admin/movies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateMovie(id: string, payload: any) {
  return adminApiFetch<{ success: boolean; movie: any }>(`/admin/movies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteMovie(id: string) {
  return adminApiFetch<{ success: boolean }>(`/admin/movies/${id}`, { method: 'DELETE' });
}

/* ─── Admin: Theatres CRUD ───────────────────────────────────────────────── */

export async function apiGetTheatres() {
  return apiFetch<{ success: boolean; theatres: any[] }>('/theatres');
}

export async function apiCreateTheatre(payload: any) {
  return adminApiFetch<{ success: boolean; theatre: any }>('/admin/theatres', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateTheatre(id: string, payload: any) {
  return adminApiFetch<{ success: boolean; theatre: any }>(`/admin/theatres/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteTheatre(id: string) {
  return adminApiFetch<{ success: boolean }>(`/admin/theatres/${id}`, { method: 'DELETE' });
}

/* ─── Admin: Bookings ────────────────────────────────────────────────────── */

export async function apiGetBookings() {
  return adminApiFetch<{ success: boolean; bookings: any[] }>('/admin/bookings');
}

export async function apiAdminCancelBooking(id: string) {
  return adminApiFetch<{ success: boolean }>(`/admin/bookings/${id}/cancel`, { method: 'PUT' });
}

/* ─── Admin: Users ───────────────────────────────────────────────────────── */

export async function apiGetUsers(params?: { search?: string; role?: string; status?: string }) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return adminApiFetch<{ success: boolean; users: any[] }>(`/admin/users${qs}`);
}

export async function apiUpdateUser(id: string, payload: any) {
  return adminApiFetch<{ success: boolean; user: any }>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteUser(id: string) {
  return adminApiFetch<{ success: boolean }>(`/admin/users/${id}`, { method: 'DELETE' });
}

/* ─── Admin: Coupons ─────────────────────────────────────────────────────── */

export async function apiGetCoupons() {
  return adminApiFetch<{ success: boolean; coupons: any[] }>('/admin/coupons');
}

export async function apiCreateCoupon(payload: any) {
  return adminApiFetch<{ success: boolean; coupon: any }>('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateCoupon(id: string, payload: any) {
  return adminApiFetch<{ success: boolean; coupon: any }>(`/admin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteCoupon(id: string) {
  return adminApiFetch<{ success: boolean }>(`/admin/coupons/${id}`, { method: 'DELETE' });
}

/* ─── Admin: Settings & Payouts ──────────────────────────────────────────── */

export async function apiGetSettings() {
  return adminApiFetch<{ success: boolean; settings: any }>('/admin/settings');
}

export async function apiUpdateSettings(payload: any) {
  return adminApiFetch<{ success: boolean; settings: any }>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiGetAllPayouts() {
  return adminApiFetch<{ success: boolean; payouts: any[] }>('/admin/payouts');
}

export async function apiGeneratePayout(payload: any) {
  return adminApiFetch<{ success: boolean; payout: any }>('/admin/payouts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


/* ─── Theatre Seat View Data ─────────────────────────────────────────────── */

// Get seat view data for a theatre (public — used by SeatExperienceModal)
export async function apiGetTheatreSeatView(theatreId: string) {
  return apiFetch<{ success: boolean; seatViewData: any; theatreName: string }>(
    `/theatres/${theatreId}/view-data`
  );
}

// Save seat view data to MongoDB (theatre owner — replaces localStorage)
export async function apiSaveTheatreSeatView(theatreId: string, payload: {
  view2DImage?: string;
  panoramaImage?: string;
  uploadedImages?: string[];
  seatViewMapping?: any[];
}) {
  return apiFetch<{ success: boolean; seatViewData: any }>(
    `/theatres/${theatreId}/view-data`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` },
    }
  );
}

/* ─── User Bookings ──────────────────────────────────────────────────────── */

export async function apiCreateBooking(payload: any) {
  return apiFetch<{ success: boolean; booking: any }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetUserBookings() {
  return apiFetch<{ success: boolean; bookings: any[] }>('/bookings/my');
}

export async function apiGetUserBookingsAll() {
  return apiFetch<{ success: boolean; bookings: any[] }>('/bookings/my/all');
}

export async function apiGetUserBookingsStats() {
  return apiFetch<{ success: boolean; stats: any }>('/bookings/my/stats');
}

/** User cancels their own booking — uses user JWT, calls /bookings/:id/cancel */
export async function apiCancelBooking(bookingId: string) {
  return apiFetch<{ success: boolean; booking: any }>(`/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ cancelledBy: 'user' }),
  });
}

/** Alias kept for backward-compat */
export const apiCancelUserBooking = apiCancelBooking;

/* ─── Admin: Dashboard Stats ─────────────────────────────────────────────── */

export async function apiGetDashboardStats() {
  return adminApiFetch<{ success: boolean; stats: any; recentBookings: any[] }>('/admin/stats');
}

export async function apiToggleUser(id: string) {
  return adminApiFetch<{ success: boolean; user: any }>(`/admin/users/${id}/toggle`, { method: 'PUT' });
}

export async function apiGetUserBookingHistory(userId: string) {
  return adminApiFetch<{ success: boolean; bookings: any[] }>(`/admin/users/${userId}/bookings`);
}

export async function apiGetOtherUserBookings(userId: string) {
  return apiFetch<{ success: boolean; bookings: any[] }>(`/bookings/user/${userId}`);
}

/* ─── Theatre Owner: Bookings from MongoDB ───────────────────────────────── */

export async function apiGetTheatreBookings(theatreId: string) {
  return apiFetch<{ success: boolean; bookings: any[] }>(`/bookings/theatre/${theatreId}`);
}

/* ─── Public: Theatres ─────────────────────────────────────────────────── */

export async function apiGetTheatresPublic() {
  return apiFetch<{ success: boolean; theatres: any[] }>('/theatres');
}

/* ─── Public: Coupons ──────────────────────────────────────────────────── */

export async function apiGetCouponsPublic() {
  return apiFetch<{ success: boolean; coupons: any[] }>('/coupons');
}

/* ─── Public: Shows ────────────────────────────────────────────────────── */

export async function apiGetShows(params?: { movieId?: string; theatreId?: string; date?: string; city?: string }) {
  const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return apiFetch<{ success: boolean; shows: any[] }>(`/shows${qs}`);
}

// Theatre owner: fetch shows owned by this user's theatre
export async function apiGetOwnerShows() {
  return apiFetch<{ success: boolean; shows: any[] }>('/theatre-owner/shows', {
    headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` },
  });
}

// Theatre owner / admin: create a new show
export async function apiCreateShow(payload: any) {
  return apiFetch<{ success: boolean; show: any }>('/theatre-owner/shows', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` },
  });
}

// Theatre owner / admin: update a show
export async function apiUpdateShow(showId: string, payload: any) {
  return apiFetch<{ success: boolean; show: any }>(`/theatre-owner/shows/${showId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` },
  });
}

// Theatre owner / admin: cancel/delete a show
export async function apiCancelShow(showId: string) {
  return apiFetch<{ success: boolean }>(`/theatre-owner/shows/${showId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` },
  });
}

// Theatre owner: full dashboard KPIs + recent bookings + today shows + alerts
export async function apiGetOwnerDashboard() {
  return apiFetch<{
    success: boolean; theatreName: string;
    kpis: any; recentBookings: any[]; todayShows: any[]; alerts: any[];
  }>('/theatre-owner/dashboard', {
    headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` },
  });
}

// Theatre owner: 7-day revenue chart + heatmap + demographics + booking trend
export async function apiGetOwnerAnalytics() {
  return apiFetch<{
    success: boolean; revenueChart: any[]; heatmap: any[];
    demographics: any[]; bookingTrend: any[]; peakHour: number; avgOccupancy: number;
  }>('/theatre-owner/analytics', {
    headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` },
  });
}

// Theatre owner: Payout history
export async function apiGetOwnerPayouts() {
  return apiFetch<{ success: boolean; payouts: any[] }>('/theatre-owner/payouts', {
    headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` },
  });
}

// Theatre owner: seat map for a specific show
export async function apiGetOwnerSeatMap(showId: string) {
  return apiFetch<{ success: boolean; rows: any[]; totalSeats: number; availableSeats: number }>(
    `/theatre-owner/seat-map/${showId}`,
    { headers: { Authorization: `Bearer ${localStorage.getItem('cc_token') ?? ''}` } }
  );
}

/* ─── Social: Privacy ───────────────────────────────────────────────────── */

export async function apiUpdatePrivacy(isPrivate: boolean) {
  const r = await apiFetch<{ success: boolean; user: ApiUser }>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify({ isPrivate }),
  });
  if (r.ok && r.data?.user) {
    localStorage.setItem('cc_user', JSON.stringify(r.data.user));
  }
  return r;
}

/* ─── Social: Show-mate Discovery ───────────────────────────────────────── */

export interface ShowMate {
  id: string;
  name: string;
  avatar: string;
  city: string;
  bio: string;
  username: string;
  joinDate: string;
}

export async function apiGetShowMates(showId: string) {
  return apiFetch<{ success: boolean; showMates: ShowMate[] }>(`/social/show-mates/${showId}`);
}

/* ─── Social: Conversations ─────────────────────────────────────────────── */

export interface ConversationSummary {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  otherUser: { id: string; name: string; avatar: string; isPrivate?: boolean } | null;
}

export async function apiGetConversations() {
  return apiFetch<{ success: boolean; conversations: ConversationSummary[] }>('/social/conversations');
}

export async function apiGetOrCreateConversation(otherUserId: string) {
  return apiFetch<{ success: boolean; conversation: ConversationSummary }>('/social/conversations', {
    method: 'POST',
    body: JSON.stringify({ otherUserId }),
  });
}

/* ─── Social: Messages ──────────────────────────────────────────────────── */

export interface MovieMessageData {
  movieId: string;
  title:   string;
  poster:  string;
  year?:   string;
  genre?:  string;
  rating?: string;
}

export interface ChatMessage {
  id:          string;
  senderId:    string;
  messageType: 'text' | 'image' | 'movie';
  text:        string;
  imageUrl:    string;
  movieData:   MovieMessageData | null;
  status:      'sent' | 'delivered' | 'seen';
  createdAt:   string;
}

export async function apiGetMessages(conversationId: string, page = 1) {
  return apiFetch<{ success: boolean; messages: ChatMessage[]; pagination: any }>(
    `/social/conversations/${conversationId}/messages?page=${page}&limit=50`
  );
}

export async function apiSendMessage(conversationId: string, text: string) {
  return apiFetch<{ success: boolean; message: ChatMessage }>(
    `/social/conversations/${conversationId}/messages`,
    { method: 'POST', body: JSON.stringify({ text, messageType: 'text' }) }
  );
}

export async function apiSendImageMessage(conversationId: string, imageUrl: string) {
  return apiFetch<{ success: boolean; message: ChatMessage }>(
    `/social/conversations/${conversationId}/messages`,
    { method: 'POST', body: JSON.stringify({ messageType: 'image', imageUrl }) }
  );
}

export async function apiSendMovieMessage(conversationId: string, movieData: MovieMessageData) {
  return apiFetch<{ success: boolean; message: ChatMessage }>(
    `/social/conversations/${conversationId}/messages`,
    { method: 'POST', body: JSON.stringify({ messageType: 'movie', movieData }) }
  );
}

/** Upload image file for chat — returns { url } */
export async function apiUploadChatImage(file: File): Promise<{ ok: boolean; url: string; message: string }> {
  const token = localStorage.getItem('cc_token') || '';
  try {
    const form = new FormData();
    form.append('image', file);
    const res  = await fetch(`${(window as any).__CC_API__ || 'http://localhost:5000/api'}/social/upload`, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    form,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, url: '', message: json.message || 'Upload failed' };
    return { ok: true, url: json.url || '', message: '' };
  } catch {
    return { ok: false, url: '', message: 'Upload failed — backend offline' };
  }
}

export async function apiGetUnreadCount() {
  return apiFetch<{ success: boolean; count: number }>('/social/unread-count');
}

/* --- Social: Follow System ------------------------------------------------ */

export type FollowState = 'none' | 'following' | 'requested';

export interface SocialUserProfile {
  id: string; name: string; avatar: string; city?: string; bio?: string;
  username: string; joinDate?: string; followersCount: number; followingCount: number;
}

export async function apiGetUserProfile(userId: string) {
  return apiFetch<{ success: boolean; user: SocialUserProfile | null; isPrivate: boolean; followState: FollowState }>(`/social/users/${userId}`);
}

export async function apiFollowUser(userId: string) {
  return apiFetch<{ success: boolean; state: FollowState }>(`/social/follow/${userId}`, { method: 'POST' });
}

export async function apiUnfollowUser(userId: string) {
  return apiFetch<{ success: boolean; state: FollowState }>(`/social/follow/${userId}`, { method: 'DELETE' });
}

export async function apiAcceptFollowRequest(userId: string) {
  return apiFetch<{ success: boolean }>(`/social/follow-requests/${userId}/accept`, { method: 'POST' });
}

export async function apiRejectFollowRequest(userId: string) {
  return apiFetch<{ success: boolean }>(`/social/follow-requests/${userId}`, { method: 'DELETE' });
}

export async function apiGetFollowers() {
  return apiFetch<{ success: boolean; followers: SocialUserProfile[] }>('/social/followers');
}

export async function apiGetFollowing() {
  return apiFetch<{ success: boolean; following: SocialUserProfile[] }>('/social/following');
}

export async function apiGetFollowRequests() {
  return apiFetch<{ success: boolean; requests: SocialUserProfile[] }>('/social/follow-requests');
}

export interface SeatMateUser {
  userId: string;
  name: string;
  avatar: string;
  username: string;
  isMe: boolean;
  isPrivate?: boolean;  // true = private account, hide Chat & block Profile navigation
}

/** Public — works without login, everyone sees booked avatars */
export async function apiGetSeatMates(showId: string) {
  return apiFetch<{ success: boolean; seatMap: Record<string, SeatMateUser> }>(`/social/seat-mates/${showId}`);
}

/** Auth — same but correctly sets isMe flag for logged-in user's own seats */
export async function apiGetSeatMatesAuth(showId: string) {
  return apiFetch<{ success: boolean; seatMap: Record<string, SeatMateUser> }>(`/social/seat-mates-auth/${showId}`);
}

export async function apiGetTheatreOwnerEarnings() {
  return apiFetch<{ success: boolean; report: any }>('/theatre-owner/earnings');
}

/* --- Additions for Refunds ---------------------------------------------- */
export async function apiCancelBookingWithRefund(bookingId: string, refundData?: { upiId?: string; bankDetails?: string; refundAmount?: number }) {
  return apiFetch<{ success: boolean; booking: any }>(`/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ cancelledBy: 'user', ...(refundData || {}) }),
  });
}

export async function apiGetRefunds() {
  return adminApiFetch<{ success: boolean; refunds: any[] }>('/admin/refunds');
}

export async function apiUpdateRefundStatus(refundId: string, status: string, adminResponse: string = '') {
  return adminApiFetch<{ success: boolean; refund: any }>(`/admin/refunds/${refundId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, adminResponse }),
  });
}

/* --- Additions for Play Zone --------------------------------------------- */
export async function apiGetGames() {
  return apiFetch<{ success: boolean; data: any[] }>('/games', { method: 'GET' });
}

// Game Categories
export async function apiGetGameCategories() {
  return apiFetch<{ success: boolean; data: any[] }>('/game-categories');
}

export async function apiGetGamesByCategory(slug: string) {
  return apiFetch<{ success: boolean; data: any[] }>(`/game-categories/${slug}/games`);
}

export async function apiGetAllGameCategories() {
  return adminApiFetch<{ success: boolean; data: any[] }>('/game-categories/admin/all');
}

export async function apiCreateGameCategory(data: any) {
  return adminApiFetch<{ success: boolean; data: any }>('/game-categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateGameCategory(id: string, data: any) {
  return adminApiFetch<{ success: boolean; data: any }>(`/game-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteGameCategory(id: string) {
  return adminApiFetch<{ success: boolean }>(`/game-categories/${id}`, { method: 'DELETE' });
}


export async function apiSubmitGameScore(gameId: string, scoreData: { score: number; timeSpent: number; answers: string[] }) {
  return apiFetch<{ success: boolean; data: any; message: string }>(`/games/${gameId}/submit`, {
    method: 'POST',
    body: JSON.stringify(scoreData),
  });
}

export async function apiGetLeaderboard() {
  return apiFetch<{ success: boolean; data: any[] }>('/games/leaderboard/global', { method: 'GET' });
}

export async function apiGetAdminLeaderboard() {
  return adminApiFetch<{ success: boolean; data: any[] }>('/games/admin/leaderboard', { method: 'GET' });
}

export async function apiCreateGame(data: any) {
  return adminApiFetch<{ success: boolean; data: any; message: string }>('/games/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateGame(gameId: string, data: any) {
  return adminApiFetch<{ success: boolean; data: any; message: string }>(`/games/admin/${gameId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteGame(gameId: string) {
  return adminApiFetch<{ success: boolean; message: string }>(`/games/admin/${gameId}`, {
    method: 'DELETE',
  });
}

export async function apiGetStoreItems() {
  return apiFetch<{ success: boolean; data: any[] }>('/store', { method: 'GET' });
}

export async function apiBuyStoreItem(itemId: string) {
  return apiFetch<{ success: boolean; message: string; data: any }>(`/store/buy/${itemId}`, { method: 'POST' });
}

export async function apiUploadGameMedia(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  
  // Read admin token from cc_admin_session (matches getAdminToken() helper)
  let token = '';
  try {
    const raw = localStorage.getItem('cc_admin_session');
    if (raw) {
      const session = JSON.parse(raw);
      if (session.expiresAt > Date.now()) token = session.accessToken || '';
    }
  } catch { /* ignore */ }

  const res = await fetch(`${BASE}/upload/image`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData
  });
  
  const json = await res.json();
  if (!res.ok) return { ok: false, data: null, message: json.message || 'Upload failed' };
  return { ok: true, data: json, message: '' };
}
