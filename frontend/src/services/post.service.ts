import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Post, PostComment } from '@/lib/types';

export const postService = {
  list: (params?: { community?: string; page?: number; limit?: number; type?: string; sort?: string }) =>
    api.get<PaginatedResponse<Post>>('/posts', { params }).then((r) => r.data),

  get: (id: number) => api.get<ApiResponse<{ post: Post }>>(`/posts/${id}`).then((r) => r.data.data.post),

  create: (data: FormData) =>
    api.post<ApiResponse<{ post: Post }>>('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.post),

  update: (id: number, data: Partial<Post>) =>
    api.put<ApiResponse<{ post: Post }>>(`/posts/${id}`, data).then((r) => r.data.data.post),

  delete: (id: number) => api.delete(`/posts/${id}`),

  like: (id: number) => api.post<ApiResponse<{ liked: boolean }>>(`/posts/${id}/like`).then((r) => r.data.data),

  getComments: (id: number, page = 1) =>
    api.get<PaginatedResponse<PostComment>>(`/posts/${id}/comments`, { params: { page } }).then((r) => r.data),

  addComment: (id: number, content: string, parent_id?: number) =>
    api.post<ApiResponse<{ comment: PostComment }>>(`/posts/${id}/comments`, { content, parent_id }).then((r) => r.data.data.comment),

  deleteComment: (postId: number, commentId: number) => api.delete(`/posts/${postId}/comments/${commentId}`),
};
