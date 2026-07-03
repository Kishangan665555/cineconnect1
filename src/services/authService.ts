/**
 * src/services/authService.ts
 * Authentication service — signup, login, profile, password change.
 */

import { api, setToken, clearToken, IS_LIVE } from './api';

export interface AuthUser {
  id:       string;
  name:     string;
  email:    string;
  phone?:   string;
  city?:    string;
  role:     'user' | 'admin' | 'theatre_owner';
  avatar?:  string;
  joinDate?: string;
}

export interface LoginPayload   { email: string; password: string; }
export interface SignupPayload  { name: string; email: string; password: string; phone?: string; city?: string; role?: string; }

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(payload: LoginPayload): Promise<AuthUser> {
  if (!IS_LIVE) throw new Error('Backend not configured');
  const res = await api.postPublic('/api/auth/login', payload);
  if (res.token) setToken(res.token as string);
  return res.user as AuthUser;
}

// ── Signup ────────────────────────────────────────────────────────────────────
export async function signup(payload: SignupPayload): Promise<AuthUser> {
  if (!IS_LIVE) throw new Error('Backend not configured');
  const res = await api.postPublic('/api/auth/signup', payload);
  if (res.token) setToken(res.token as string);
  return res.user as AuthUser;
}

// ── Get current user ──────────────────────────────────────────────────────────
export async function getMe(): Promise<AuthUser> {
  const res = await api.get('/api/auth/me');
  return res.user as AuthUser;
}

// ── Logout ────────────────────────────────────────────────────────────────────
export function logout(): void {
  clearToken();
}

// ── Update profile ────────────────────────────────────────────────────────────
export async function updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
  const res = await api.put('/api/auth/profile', data);
  return res.user as AuthUser;
}

// ── Change password ───────────────────────────────────────────────────────────
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.put('/api/auth/change-password', { currentPassword, newPassword });
}
