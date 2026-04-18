import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useFeed(params?: { community?: string; type?: string; sort?: string }) {
  return useInfiniteQuery({
    queryKey: queryKeys.feed(params),
    queryFn: ({ pageParam = 1 }) => postService.list({ ...params, page: pageParam as number }),
    getNextPageParam: (last) => last.pagination.hasNext ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

export function useCreatePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed'] }); toast.success('Post shared!'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to post'),
  });
}

export function useLikePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postService.like,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useDeletePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed'] }); toast.success('Post deleted'); },
  });
}

export function useAddCommentMutation(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, parent_id }: { content: string; parent_id?: number }) =>
      postService.addComment(postId, content, parent_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.postComments(postId) }),
  });
}
