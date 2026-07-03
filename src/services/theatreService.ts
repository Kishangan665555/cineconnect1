/**
 * src/services/theatreService.ts
 * Theatre management, approval workflow, showtime CRUD.
 */

import { api } from './api';

export async function getTheatres(city?: string, type?: string) {
  const qs = new URLSearchParams();
  if (city && city !== 'All') qs.set('city', city);
  if (type && type !== 'All') qs.set('type', type);
  return api.get(`/api/theatres?${qs}`);
}

export async function getTheatre(id: string) {
  return api.get(`/api/theatres/${id}`);
}

export async function getMyTheatre() {
  return api.get('/api/theatres/owner/mine');
}

export async function getMyApprovalRequest() {
  return api.get('/api/theatres/owner/approval');
}

export async function submitApprovalRequest(theatreData: Record<string, unknown>) {
  return api.post('/api/theatres/approval-request', { theatreData });
}

export async function getApprovalRequests(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return api.get(`/api/theatres/approval-requests${qs}`);
}

export async function reviewApprovalRequest(id: string, status: 'approved' | 'rejected', adminNote = '') {
  return api.put(`/api/theatres/approval-requests/${id}/review`, { status, adminNote });
}

export async function createTheatre(data: Record<string, unknown>) {
  return api.post('/api/theatres', data);
}

export async function updateTheatre(id: string, data: Record<string, unknown>) {
  return api.put(`/api/theatres/${id}`, data);
}

export async function deleteTheatre(id: string) {
  return api.delete(`/api/theatres/${id}`);
}

export async function addShowtime(theatreId: string, data: Record<string, unknown>) {
  return api.post(`/api/theatres/${theatreId}/showtimes`, data);
}

export async function updateShowtime(theatreId: string, stId: string, data: Record<string, unknown>) {
  return api.put(`/api/theatres/${theatreId}/showtimes/${stId}`, data);
}

export async function deleteShowtime(theatreId: string, stId: string) {
  return api.delete(`/api/theatres/${theatreId}/showtimes/${stId}`);
}

// ── Show-level seat management ────────────────────────────────────────────────
export async function getShows(params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  return api.get(`/api/shows?${qs}`);
}

export async function getShow(showId: string) {
  return api.get(`/api/shows/${showId}`);
}

export async function createShow(data: Record<string, unknown>) {
  return api.post('/api/shows', data);
}

export async function lockSeats(showId: string, seatIds: string[]) {
  return api.post(`/api/shows/${showId}/lock`, { seatIds });
}

export async function unlockSeats(showId: string, seatIds: string[]) {
  return api.post(`/api/shows/${showId}/unlock`, { seatIds });
}

export async function blockSeat(showId: string, seatId: string, reason: string) {
  return api.post(`/api/shows/${showId}/block-seat`, { seatId, reason });
}

export async function unblockSeat(showId: string, seatId: string) {
  return api.post(`/api/shows/${showId}/unblock-seat`, { seatId });
}
