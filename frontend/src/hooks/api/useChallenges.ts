import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengeService } from '@/services/challenge.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useChallenges(params?: object) {
  return useInfiniteQuery({
    queryKey: queryKeys.challenges(params),
    queryFn: ({ pageParam = 1 }) => challengeService.list({ ...params, page: pageParam }),
    getNextPageParam: (l) => l.pagination.hasNext ? l.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useChallenge(id: number) {
  return useQuery({ queryKey: queryKeys.challenge(id), queryFn: () => challengeService.get(id), enabled: !!id });
}

export function useChallengeSubmissions(id: number, params?: object) {
  return useInfiniteQuery({
    queryKey: queryKeys.challengeSubmissions(id),
    queryFn: ({ pageParam = 1 }) => challengeService.getSubmissions(id, { ...params, page: pageParam }),
    getNextPageParam: (l) => l.pagination.hasNext ? l.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!id,
  });
}

export function useSubmitChallengeMutation(challengeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => challengeService.submit(challengeId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.challenge(challengeId) }); toast.success('Submission received!'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Submission failed'),
  });
}

export function useVoteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: challengeService.vote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
}
