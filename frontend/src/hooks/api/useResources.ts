import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceService } from '@/services/resource.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useResources(params?: object) {
  return useInfiniteQuery({
    queryKey: queryKeys.resources(params),
    queryFn: ({ pageParam = 1 }) => resourceService.list({ ...params, page: pageParam }),
    getNextPageParam: (l) => l.pagination.hasNext ? l.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useResource(id: number) {
  return useQuery({ queryKey: queryKeys.resource(id), queryFn: () => resourceService.get(id), enabled: !!id });
}

export function useRateResourceMutation(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rating, review }: { rating: number; review?: string }) => resourceService.rate(id, rating, review),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.resource(id) }); toast.success('Rated!'); },
  });
}
