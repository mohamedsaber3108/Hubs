import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/event.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useEvents(params?: object) {
  return useInfiniteQuery({
    queryKey: queryKeys.events(params),
    queryFn: ({ pageParam = 1 }) => eventService.list({ ...params, page: pageParam }),
    getNextPageParam: (l) => l.pagination.hasNext ? l.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useEvent(id: number) {
  return useQuery({ queryKey: queryKeys.event(id), queryFn: () => eventService.get(id), enabled: !!id });
}

export function useRsvpMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'going' | 'maybe' | 'not_going' }) => eventService.rsvp(id, status),
    onSuccess: (data, { id }) => { qc.invalidateQueries({ queryKey: queryKeys.event(id) }); toast.success(`RSVP: ${data.status}`); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'RSVP failed'),
  });
}
