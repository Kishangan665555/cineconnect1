/**
 * src/services/api.ts — Cine Connect API client
 *
 * All HTTP calls go through here.
 * Set VITE_API_URL in .env to enable live MongoDB backend.
 * Without VITE_API_URL the app falls back to localStorage automatically.
 */

// Vite exposes env vars via import.meta.env — declare to satisfy TS strict mode
declare const __API_URL__: string | undefined;

export const API_BASE: string = (typeof import.meta !== 'undefined' &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env?.VITE_API_URL) || '';

export const IS_LIVE: boolean = API_BASE.length > 0;

// ── JWT token helpers ─────────────────────────────────────────────────────────
const TOKEN_KEY = 'cc_jwt_token';
export const getToken   = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken   = (t: string): void  => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = (): void           => localStorage.removeItem(TOKEN_KEY);

// ── API Error ─────────────────────────────────────────────────────────────────
export class APIError extends Error {
  status: number;
  data:   unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name   = 'APIError';
    this.status = status;
    this.data   = data;
  }
}

// ── Generic response shape ────────────────────────────────────────────────────
export interface APIResponse<T = unknown> {
  success:  boolean;
  message?: string;
  data?:    T;
  token?:   string;
  user?:    unknown;
  [key: string]: unknown;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  path:    string,
  method:  string,
  body?:   unknown,
  skipAuth = false,
): Promise<APIResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);

  try {
    const res  = await fetch(`${API_BASE}${path}`, init);
    const json = (await res.json()) as APIResponse<T>;
    if (!res.ok) throw new APIError(json.message || `HTTP ${res.status}`, res.status, json);
    return json;
  } catch (err) {
    if (err instanceof APIError) throw err;
    throw new APIError((err as Error).message || 'Network error', 0);
  }
}

// ── Convenience methods ───────────────────────────────────────────────────────
export const api = {
  get:    <T = unknown>(path: string)                        => apiFetch<T>(path, 'GET'),
  post:   <T = unknown>(path: string, body?: unknown)        => apiFetch<T>(path, 'POST',   body),
  put:    <T = unknown>(path: string, body?: unknown)        => apiFetch<T>(path, 'PUT',    body),
  patch:  <T = unknown>(path: string, body?: unknown)        => apiFetch<T>(path, 'PATCH',  body),
  delete: <T = unknown>(path: string)                        => apiFetch<T>(path, 'DELETE'),
  postPublic: <T = unknown>(path: string, body?: unknown)    => apiFetch<T>(path, 'POST',   body, true),
};
