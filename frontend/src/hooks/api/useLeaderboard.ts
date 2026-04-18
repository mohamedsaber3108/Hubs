import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { leaderboardService } from '@/services/leaderboard.service';
import { queryKeys } from '@/lib/queryKeys';

export function useLeaderboard(params?: { period?: string; community?: string }) {
  return useInfiniteQuery({
    queryKey: queryKeys.leaderboard(params),
    queryFn: ({ pageParam = 1 }) => leaderboardService.list({ ...params, page: pageParam, limit: 50 }),
    getNextPageParam: (l) => l.pagination.hasNext ? l.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60_000,
  });
}

export function useMyLeaderboardStats(period = 'all_time') {
  return useQuery({
    queryKey: queryKeys.myLeaderboardStats(period),
    queryFn: () => leaderboardService.myStats(period),
    staleTime: 60_000,
  });
}
