import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorService } from '@/services/mentor.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useMentors(params?: object) {
  return useInfiniteQuery({
    queryKey: queryKeys.mentors(params),
    queryFn: ({ pageParam = 1 }) => mentorService.list({ ...params, page: pageParam }),
    getNextPageParam: (l) => l.pagination.hasNext ? l.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useMentor(id: number) {
  return useQuery({ queryKey: queryKeys.mentor(id), queryFn: () => mentorService.get(id), enabled: !!id });
}

export function useRequestSessionMutation(mentorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => mentorService.requestSession(mentorId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.mentor(mentorId) }); toast.success('Session request sent!'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Request failed'),
  });
}

export function useMentorRequests(type?: string) {
  return useQuery({
    queryKey: queryKeys.mentorRequests(type),
    queryFn: () => mentorService.getRequests(type),
  });
}
