/**
 * src/services/aiService.ts
 * Frontend API helpers for AI chat & support ticket submission
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('cc_token') || '';
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Send chat message ─────────────────────────────────────────────────────────
export interface ChatResponse {
  success: boolean;
  reply: string;
  sessionId: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'angry';
  escalated: boolean;
  usingAI: boolean;
}

// ── Client-side lightweight fallback (used when backend is unreachable) ───────
function clientFallback(message: string): string {
  const m = message.toLowerCase();
  if (/recommend|suggest|what.*watch|good movie|best movie|which movie/i.test(m))
    return "🎬 I'd love to suggest movies! Tell me your favourite genre — Action, Romance, Thriller, Comedy — and I'll pick something great for you!";
  if (/cancel|refund/i.test(m))
    return "🎟️ To cancel a booking: go to **My Bookings** → select your booking → click **Cancel & Refund**. Refunds take 5–7 business days.";
  if (/payment|razorpay|upi|failed|deducted/i.test(m))
    return "💳 If your payment failed or was deducted without a booking, wait 10 minutes and check My Bookings. Still missing? Email **support@cineconnect.com** with your transaction ID.";
  if (/book|ticket|seat|show/i.test(m))
    return "🎟️ To book tickets: Browse Movies → click **Book Tickets** → pick city/theatre/date/time → select seats → pay via Razorpay. Need help with a specific step?";
  if (/login|password|forgot|sign/i.test(m))
    return "🔐 Forgot your password? Click **Forgot Password** on the login page, enter your email, and check your inbox for a reset link (valid 1 hour). Check spam if not received.";
  if (/offer|coupon|promo|discount/i.test(m))
    return "🎁 Check the **Offers** page for today's deals! Apply coupon codes at checkout in the Promo Code field.";
  if (/hi|hello|hey|namaste/i.test(m))
    return "Hey there! 👋 I'm CineConnect AI — I can help with bookings, refunds, movie recommendations, and more. What do you need today?";
  return "I'm here to help! 🎬 Ask me about **booking tickets**, **movie recommendations**, **refunds**, **offers**, or **account help**. What can I do for you?";
}

export async function apiSendChatMessage(
  message: string,
  sessionId: string | null,
  language = 'en',
  page = window.location.pathname
): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API}/ai/chat`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message, sessionId, language, page }),
      signal: AbortSignal.timeout(20000), // 20s timeout
    });

    // Parse JSON even from error responses (backend always sends JSON)
    let data: any;
    try {
      data = await res.json();
    } catch {
      // Non-JSON response (e.g. server crashed mid-send) — use client fallback
      throw new Error('non-json');
    }

    // If backend returned an error but with a reply field, still use it
    if (data?.reply) return data;

    // Backend returned error without a reply — use client fallback
    return {
      success: true,
      reply: clientFallback(message),
      sessionId: sessionId || crypto.randomUUID(),
      sentiment: 'neutral',
      escalated: false,
      usingAI: false,
    };
  } catch {
    // Complete network failure — client-side rule-based response
    return {
      success: true,
      reply: clientFallback(message),
      sessionId: sessionId || crypto.randomUUID(),
      sentiment: 'neutral',
      escalated: false,
      usingAI: false,
    };
  }
}



// ── Get AI status ─────────────────────────────────────────────────────────────
export async function apiGetAIStatus(): Promise<{ aiEnabled: boolean; mode: string }> {
  try {
    const res = await fetch(`${API}/ai/status`);
    const data = await res.json();
    return { aiEnabled: data.aiEnabled || false, mode: data.mode || 'fallback' };
  } catch {
    return { aiEnabled: false, mode: 'fallback' };
  }
}

// ── Movie recommendation card type ────────────────────────────────────────────
export interface MovieRecommendation {
  _id?: string;
  title: string;
  genre: string[];
  rating: number;
  description?: string;
  certificate?: string;
  poster?: string;
  director?: string;
  duration?: number;
  isTrending?: boolean;
  isNowShowing?: boolean;
  isComingSoon?: boolean;
  reason?: string;
}

// ── Fetch personalized movie recommendations ──────────────────────────────────
export async function apiGetMovieRecommendations(
  genres?: string[],
  limit = 6
): Promise<{ movies: MovieRecommendation[]; basedOn: string[] }> {
  try {
    const params = new URLSearchParams();
    if (genres?.length) params.set('genres', genres.join(','));
    params.set('limit', String(limit));
    const token = getToken();
    const res = await fetch(`${API}/ai/recommendations?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    return { movies: data.movies || [], basedOn: data.basedOn || [] };
  } catch {
    return { movies: [], basedOn: [] };
  }
}

// ── Parse embedded recommendation JSON from AI reply ─────────────────────────
export function parseRecommendationsFromReply(reply: string): {
  cleanText: string;
  recommendations: MovieRecommendation[];
} {
  const blockMatch = reply.match(/\[MOVIE_RECOMMENDATIONS\]([\s\S]*?)\[\/MOVIE_RECOMMENDATIONS\]/);
  if (!blockMatch) return { cleanText: reply, recommendations: [] };

  let recommendations: MovieRecommendation[] = [];
  try {
    const parsed = JSON.parse(blockMatch[1].trim());
    recommendations = parsed.movies || [];
  } catch { /* malformed JSON — ignore */ }

  const cleanText = reply.replace(/\[MOVIE_RECOMMENDATIONS\][\s\S]*?\[\/MOVIE_RECOMMENDATIONS\]/g, '').trim();
  return { cleanText, recommendations };
}


// ── Get user context ──────────────────────────────────────────────────────────
export interface UserAIContext {
  name: string;
  email: string;
  lastBooking: {
    movieTitle: string;
    theatreName: string;
    showDate: string;
    showTime: string;
    finalAmount: number;
    status: string;
  } | null;
  bookingCount: number;
  favouriteGenres: string[];
}

export async function apiGetUserAIContext(): Promise<UserAIContext | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/ai/context`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.success ? data.context : null;
  } catch {
    return null;
  }
}

// ── Submit support ticket ─────────────────────────────────────────────────────
export interface SupportTicketPayload {
  name: string;
  email: string;
  issueType: string;
  subject?: string;
  message: string;
}

export async function apiSubmitSupportTicket(
  payload: SupportTicketPayload
): Promise<{ success: boolean; message: string; ticketId?: string }> {
  try {
    const res = await fetch(`${API}/support/ticket`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...payload, page: window.location.pathname }),
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Network error. Please email support@cineconnect.com directly.' };
  }
}

// ── Admin: get support tickets ────────────────────────────────────────────────
export async function apiAdminGetSupportTickets(params?: {
  status?: string; priority?: string; issueType?: string;
  sentiment?: string; page?: number; limit?: number; search?: string;
}) {
  const token = localStorage.getItem('cc_admin_token') || '';
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
  const res = await fetch(`${API}/admin/support/tickets?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function apiAdminUpdateSupportTicket(
  id: string, update: { status?: string; adminReply?: string; priority?: string }
) {
  const token = localStorage.getItem('cc_admin_token') || '';
  const res = await fetch(`${API}/admin/support/tickets/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  return res.json();
}

export async function apiAdminGetChatSessions(params?: { page?: number; limit?: number; sentiment?: string }) {
  const token = localStorage.getItem('cc_admin_token') || '';
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
  const res = await fetch(`${API}/admin/support/chat-sessions?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
