import api from '@/lib/api';
import type { ApiResponse, SearchResults } from '@/lib/types';

export const searchService = {
  global: (q: string, type = 'all', limit = 5) =>
    api.get<ApiResponse<SearchResults>>('/search', { params: { q, type, limit } }).then((r) => r.data.data),
};
