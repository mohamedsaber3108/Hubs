import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Conversation, ChatMessage } from '@/lib/types';

export const messageService = {
  listConversations: (page = 1) =>
    api.get<PaginatedResponse<Conversation>>('/messages', { params: { page } }).then((r) => r.data),
  getMessages: (conversationId: number, page = 1) =>
    api.get<PaginatedResponse<ChatMessage>>(`/messages/${conversationId}`, { params: { page } }).then((r) => r.data),
  startConversation: (user_id: number, message: string) =>
    api.post<ApiResponse<{ conversation_id: number; message: ChatMessage }>>('/messages', { user_id, message }).then((r) => r.data.data),
  sendMessage: (conversationId: number, content: string, type = 'text') =>
    api.post<ApiResponse<{ message: ChatMessage }>>(`/messages/${conversationId}`, { content, type }).then((r) => r.data.data.message),
  deleteMessage: (conversationId: number, messageId: number) => api.delete(`/messages/${conversationId}/messages/${messageId}`),
  getParticipants: (conversationId: number) => api.get(`/messages/${conversationId}/participants`).then((r) => r.data.data),
};
