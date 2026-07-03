/**
 * src/services/bookingService.ts
 * Booking creation, retrieval, cancellation.
 */

import { api } from './api';

export interface CreateBookingPayload {
  movieId:      string;
  theatreId:    string;
  showId:       string;
  movieTitle:   string;
  theatreName:  string;
  showDate:     string;
  showTime:     string;
  showLanguage: string;
  showFormat:   string;
  seats:        string[];
  seatDetails:  { seatId: string; row: string; col: number; category: string }[];
  totalAmount:  number;
  discount:     number;
  finalAmount:  number;
  couponCode?:  string;
  paymentMethod: string;
  transactionId?: string;
}

export async function createBooking(payload: CreateBookingPayload) {
  return api.post('/api/bookings', payload);
}

export async function getMyBookings() {
  return api.get('/api/bookings/my');
}

export async function getBooking(id: string) {
  return api.get(`/api/bookings/${id}`);
}

export async function cancelBooking(id: string) {
  return api.patch(`/api/bookings/${id}/cancel`);
}

export async function getTheatreBookings(theatreId: string) {
  return api.get(`/api/bookings/theatre/${theatreId}`);
}

export async function getAllBookings(page = 1, limit = 20, status?: string) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) qs.set('status', status);
  return api.get(`/api/bookings?${qs}`);
}

export async function validateCoupon(code: string, amount: number) {
  return api.post('/api/coupons/validate', { code, amount });
}
