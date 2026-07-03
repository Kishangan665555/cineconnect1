/**
 * src/services/theatreOwnerApiService.ts
 * Typed API wrappers for the Theatre Owner Dashboard.
 * Falls back gracefully when backend is offline.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('cc_token') || '';

async function ownerApiFetch<T>(
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

/* ─── Dashboard Overview ─────────────────────────────────────────────────── */

export interface OwnerDashboardData {
  success: boolean;
  kpis: {
    totalRevenue: number;
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    todayRevenue: number;
    todayBookings: number;
    activeShows: number;
    totalScreens: number;
    occupancyRate: number;
    weeklyRevenue: number;
  };
  recentBookings: OwnerBooking[];
  todayShows: OwnerShow[];
  alerts: OwnerAlert[];
}

export interface OwnerBooking {
  _id: string;
  bookingId: string;
  movieTitle: string;
  seats: string[];
  totalAmount: number;
  finalAmount: number;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: string;
  showDate?: string;
  showTime?: string;
  userId?: string;
  customerName?: string;
}

export interface OwnerShow {
  _id?: string;
  id: string;
  movieId: string;
  movieTitle?: string;
  moviePoster?: string;
  time: string;
  date: string;
  language: string;
  format: string;
  totalSeats: number;
  availableSeats: number;
  isEnded: boolean;
  screenId?: string;
  screenName?: string;
  bookingPercentage?: number;
  status?: 'live' | 'upcoming' | 'sold_out' | 'ended';
  priceOverride?: { normal: number; silver: number; gold: number; premium: number };
}

export interface OwnerAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  message: string;
  timestamp: string;
}

export async function apiGetOwnerDashboard() {
  return ownerApiFetch<OwnerDashboardData>('/theatre-owner/dashboard');
}

/* ─── Analytics ──────────────────────────────────────────────────────────── */

export interface OwnerAnalyticsData {
  success: boolean;
  revenueChart: { label: string; value: number; date: string }[];      // 7 days
  heatmap: { day: number; hour: number; count: number }[];              // bookings by day+hour
  demographics: { label: string; count: number; color: string }[];
  bookingTrend: { label: string; confirmed: number; cancelled: number }[];
  peakHour: number;
  avgOccupancy: number;
}

export async function apiGetOwnerAnalytics() {
  return ownerApiFetch<OwnerAnalyticsData>('/theatre-owner/analytics');
}

/* ─── Seat Map ───────────────────────────────────────────────────────────── */

export interface SeatMapData {
  success: boolean;
  showId: string;
  totalSeats: number;
  availableSeats: number;
  rows: SeatRow[];
}

export interface SeatRow {
  rowLabel: string;
  seats: SeatInfo[];
}

export interface SeatInfo {
  seatId: string;
  label: string;
  category: 'normal' | 'silver' | 'gold' | 'premium';
  status: 'available' | 'booked' | 'blocked' | 'vip';
  row: number;
  col: number;
}

export async function apiGetOwnerSeatMap(showId: string) {
  return ownerApiFetch<SeatMapData>(`/theatre-owner/seat-map/${showId}`);
}

/* ─── Shows (Owner's theatre) ────────────────────────────────────────────── */

export async function apiGetOwnerShows(filters?: {
  date?: string;
  movieId?: string;
  screenId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.date) params.set('date', filters.date);
  if (filters?.movieId) params.set('movieId', filters.movieId);
  if (filters?.screenId) params.set('screenId', filters.screenId);
  const qs = params.toString();
  return ownerApiFetch<{ success: boolean; shows: OwnerShow[] }>(
    `/theatre-owner/shows${qs ? '?' + qs : ''}`
  );
}

export async function apiCreateShow(payload: {
  movieId?: string;
  screenId?: string;
  screenName?: string;
  date: string;
  time: string;
  customTime?: string;
  language: string;
  format: string;
  totalSeats: number;
  priceNormal: number;
  priceSilver: number;
  priceGold: number;
  pricePremium: number;
}) {
  return ownerApiFetch<{ success: boolean; show: OwnerShow & { _id: string } }>(
    '/theatre-owner/shows',
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export async function apiUpdateShow(id: string, payload: Partial<{
  movieId: string;
  date: string;
  time: string;
  customTime: string;
  language: string;
  format: string;
  totalSeats: number;
  priceNormal: number;
  priceSilver: number;
  priceGold: number;
  pricePremium: number;
}>) {
  return ownerApiFetch<{ success: boolean; show: OwnerShow }>(
    `/theatre-owner/shows/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
}

export async function apiDeleteShow(id: string) {
  return ownerApiFetch<{ success: boolean }>(
    `/theatre-owner/shows/${id}`,
    { method: 'DELETE' }
  );
}

export async function apiCancelShow(id: string) {
  return ownerApiFetch<{ success: boolean }>(
    `/theatre-owner/shows/${id}/cancel`,
    { method: 'POST' }
  );
}

/* ─── Bookings (Owner's theatre) ─────────────────────────────────────────── */

export async function apiGetOwnerBookings(filters?: {
  status?: string;
  search?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  const qs = params.toString();
  return ownerApiFetch<{
    success: boolean;
    bookings: OwnerBooking[];
    total: number;
    page: number;
  }>(`/theatre-owner/bookings${qs ? '?' + qs : ''}`);
}

/* ─── Staff (placeholder — extendable) ──────────────────────────────────── */

export interface StaffMember {
  id: string;
  name: string;
  role: 'Manager' | 'Cashier' | 'Security' | 'Usher' | 'Projectionist';
  shift: 'Morning' | 'Evening' | 'Night';
  status: 'active' | 'on_leave' | 'off_duty';
  performance: number; // 0-100
  joinDate: string;
  avatar?: string;
}

// Stub — returns demo staff until real staff model is added to backend
export async function apiGetOwnerStaff(): Promise<{ ok: boolean; data: StaffMember[] | null; message: string }> {
  return {
    ok: true,
    message: '',
    data: [
      { id: '1', name: 'Arjun Sharma',   role: 'Manager',       shift: 'Morning', status: 'active',   performance: 94, joinDate: '2024-01-15' },
      { id: '2', name: 'Priya Mehta',    role: 'Cashier',       shift: 'Evening', status: 'active',   performance: 87, joinDate: '2024-03-20' },
      { id: '3', name: 'Rahul Singh',    role: 'Security',      shift: 'Night',   status: 'active',   performance: 91, joinDate: '2024-02-10' },
      { id: '4', name: 'Anjali Verma',   role: 'Usher',         shift: 'Evening', status: 'on_leave', performance: 78, joinDate: '2024-04-01' },
      { id: '5', name: 'Vikram Patel',   role: 'Projectionist', shift: 'Morning', status: 'active',   performance: 98, joinDate: '2023-11-05' },
      { id: '6', name: 'Sneha Kapoor',   role: 'Cashier',       shift: 'Morning', status: 'off_duty', performance: 82, joinDate: '2024-05-12' },
    ],
  };
}

/* ─── Media & 3D Config ──────────────────────────────────────────────────── */

export async function apiUploadTheatreMedia(
  theatreId: string,
  section: string,
  type: 'screenView' | 'panoramaView',
  file: File
) {
  const formData = new FormData();
  formData.append('theatreId', theatreId);
  formData.append('section', section);
  formData.append('type', type);
  formData.append('mediaFile', file);

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/media/upload`, {
      method: 'POST',
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: formData,
    });
    return { ok: res.ok, data: await res.json() as any };
  } catch {
    return { ok: false, data: null };
  }
}

export async function apiSave3DConfig(theatreId: string, configData: any) {
  return ownerApiFetch<any>('/media/save-3d-config', {
    method: 'POST',
    body: JSON.stringify({ theatreId, configData })
  });
}

export async function apiGetTheatreMedia(theatreId: string) {
  return ownerApiFetch<any>(`/media/${theatreId}/media`, { method: 'GET' });
}

export async function apiGet3DConfig(theatreId: string) {
  return ownerApiFetch<any>(`/media/${theatreId}/3d-config`, { method: 'GET' });
}

// ─── Admin Media Approvals ─────────────────────────────────────────

export async function apiGetAdminPendingMedia() {
  return ownerApiFetch<any>('/media/admin/pending', { method: 'GET' });
}

export async function apiApproveMedia(id: string, status: 'approved' | 'rejected') {
  return ownerApiFetch<any>(`/media/admin/approve/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

