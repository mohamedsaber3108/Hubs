import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/services/group.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useGroups(params?: object) {
  return useInfiniteQuery({
    queryKey: queryKeys.groups(params),
    queryFn: ({ pageParam = 1 }) => groupService.list({ ...params, page: pageParam }),
    getNextPageParam: (l) => l.pagination.hasNext ? l.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useGroup(id: number) {
  return useQuery({ queryKey: queryKeys.group(id), queryFn: () => groupService.get(id), enabled: !!id });
}

export function useJoinGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupService.join,
    onSuccess: (data, id) => { qc.invalidateQueries({ queryKey: queryKeys.group(id) }); toast.success(data.status === 'pending' ? 'Request sent' : 'Joined group!'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
}

export function useLeaveGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupService.leave,
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: queryKeys.group(id) }); toast.success('Left group'); },
  });
}
