import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/message.service';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useConversations() {
  return useQuery({ queryKey: queryKeys.conversations(), queryFn: () => messageService.listConversations(), staleTime: 10_000 });
}

export function useMessages(conversationId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: ({ pageParam = 1 }) => messageService.getMessages(conversationId, pageParam as number),
    getNextPageParam: (l) => l.pagination.hasPrev ? l.pagination.page - 1 : undefined,
    initialPageParam: 1,
    enabled: !!conversationId,
  });
}

export function useSendMessageMutation(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => messageService.sendMessage(conversationId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages(conversationId) }),
    onError: () => toast.error('Failed to send message'),
  });
}

export function useStartConversationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ user_id, message }: { user_id: number; message: string }) => messageService.startConversation(user_id, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations() }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
}
