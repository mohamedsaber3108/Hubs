import api from '@/lib/api';
import type { PaginatedResponse, LeaderboardEntry } from '@/lib/types';

export const leaderboardService = {
  list: (params?: { period?: string; community?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<LeaderboardEntry>>('/leaderboard', { params }).then((r) => r.data),
  myStats: (period = 'all_time') => api.get('/leaderboard/me', { params: { period } }).then((r) => r.data.data),
  history: (page = 1) => api.get('/leaderboard/history', { params: { page } }).then((r) => r.data),
};
