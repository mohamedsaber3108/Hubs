import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Group, Post } from '@/lib/types';

export const groupService = {
  list: (params?: object) => api.get<PaginatedResponse<Group>>('/groups', { params }).then((r) => r.data),
  get: (id: number) => api.get<ApiResponse<{ group: Group; membership: any }>>(`/groups/${id}`).then((r) => r.data.data),
  create: (data: FormData) => api.post<ApiResponse<{ group: Group }>>('/groups', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.group),
  update: (id: number, data: FormData) => api.put<ApiResponse<{ group: Group }>>(`/groups/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.group),
  delete: (id: number) => api.delete(`/groups/${id}`),
  join: (id: number) => api.post<ApiResponse<{ status: string }>>(`/groups/${id}/join`).then((r) => r.data.data),
  leave: (id: number) => api.delete(`/groups/${id}/join`),
  getMembers: (id: number, status = 'approved') => api.get(`/groups/${id}/members`, { params: { status, limit: 50 } }).then((r) => r.data),
  updateMember: (groupId: number, userId: number, data: object) => api.patch(`/groups/${groupId}/members/${userId}`, data),
  removeMember: (groupId: number, userId: number) => api.delete(`/groups/${groupId}/members/${userId}`),
  getPosts: (id: number, page = 1) => api.get<PaginatedResponse<Post>>(`/groups/${id}/posts`, { params: { page } }).then((r) => r.data),
};
