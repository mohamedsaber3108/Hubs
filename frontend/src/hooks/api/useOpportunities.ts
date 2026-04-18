import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunityService } from '@/services/opportunity.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useOpportunities(params?: object) {
  return useInfiniteQuery({
    queryKey: queryKeys.opportunities(params),
    queryFn: ({ pageParam = 1 }) => opportunityService.list({ ...params, page: pageParam }),
    getNextPageParam: (l) => l.pagination.hasNext ? l.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useOpportunity(id: number) {
  return useQuery({ queryKey: queryKeys.opportunity(id), queryFn: () => opportunityService.get(id), enabled: !!id });
}

export function useApplyMutation(opportunityId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => opportunityService.apply(opportunityId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.opportunity(opportunityId) }); toast.success('Application submitted!'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Application failed'),
  });
}

export function useSaveOpportunityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: opportunityService.toggleSave,
    onSuccess: (data, id) => { qc.invalidateQueries({ queryKey: queryKeys.opportunity(id) }); toast.success(data.saved ? 'Saved!' : 'Removed from saved'); },
  });
}
