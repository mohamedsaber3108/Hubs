import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import { queryKeys } from '@/lib/queryKeys';

export function useSearch(query: string, type = 'all', limit = 5) {
  return useQuery({
    queryKey: queryKeys.search(query, type),
    queryFn: () => searchService.global(query, type, limit),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useSearchResults(params?: { q: string; type?: string; limit?: number }) {
  return useQuery({
    queryKey: ['search', 'results', params],
    queryFn: () => searchService.global(params!.q, params?.type || 'all', params?.limit || 20),
    enabled: !!params && params.q.trim().length >= 1,
    staleTime: 30_000,
  });
}
