import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService } from '@/services/community.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useCommunities() {
  return useQuery({ queryKey: queryKeys.communities(), queryFn: communityService.list, staleTime: 5 * 60_000 });
}

export function useCommunity(slug: string) {
  return useQuery({ queryKey: queryKeys.community(slug), queryFn: () => communityService.get(slug), enabled: !!slug });
}

// Persona-aware community recommendations. Shorter staleTime than the plain
// list because results depend on the viewer's personas + membership state,
// which change as they onboard and join/leave communities.
export function useRecommendedCommunities() {
  return useQuery({
    queryKey: queryKeys.recommendedCommunities(),
    queryFn: communityService.recommended,
    staleTime: 60_000,
  });
}

export function useJoinCommunityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: communityService.join,
    onSuccess: () => {
      // queryKeys.communities() is a prefix of recommendedCommunities(), so a
      // single prefix-invalidation refreshes both the list and recommendations.
      qc.invalidateQueries({ queryKey: queryKeys.communities() });
      toast.success('Joined community!');
    },
  });
}

export function useLeaveCommunityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: communityService.leave,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.communities() });
      toast.success('Left community');
    },
  });
}
