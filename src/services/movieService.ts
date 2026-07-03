/**
 * src/services/movieService.ts
 * Movie CRUD + engagement (like/dislike/interest/rate).
 */

import { api } from './api';

export interface MovieFilters {
  isNowShowing?: boolean;
  isComingSoon?:  boolean;
  isTrending?:    boolean;
  genre?:         string;
  language?:      string;
  q?:             string;
  page?:          number;
  limit?:         number;
}

export async function getMovies(filters: MovieFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return api.get(`/api/movies${qs ? '?' + qs : ''}`);
}

export async function getMovie(id: string) {
  return api.get(`/api/movies/${id}`);
}

export async function createMovie(data: Record<string, unknown>) {
  return api.post('/api/movies', data);
}

export async function updateMovie(id: string, data: Record<string, unknown>) {
  return api.put(`/api/movies/${id}`, data);
}

export async function deleteMovie(id: string) {
  return api.delete(`/api/movies/${id}`);
}

export async function toggleLike(id: string) {
  return api.post(`/api/movies/${id}/like`);
}

export async function toggleDislike(id: string) {
  return api.post(`/api/movies/${id}/dislike`);
}

export async function toggleInterest(id: string) {
  return api.post(`/api/movies/${id}/interest`);
}

export async function rateMovie(id: string, rating: number, review = '') {
  return api.post(`/api/movies/${id}/rate`, { rating, review });
}
