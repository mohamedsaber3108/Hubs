import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, AuthUser, UserProfile, Notification } from '@/lib/types';

export const userService = {
  getMe: () => api.get<ApiResponse<{ user: AuthUser }>>('/users/me').then((r) => r.data.data.user),

  updateMe: (data: Partial<AuthUser>) => api.put<ApiResponse<{ user: AuthUser }>>('/users/me', data).then((r) => r.data.data.user),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<ApiResponse<{ avatar_url: string }>>('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  changePassword: (current_password: string, new_password: string) =>
    api.put('/users/me/password', { current_password, new_password }),

  getProfile: (username: string) =>
    api.get<ApiResponse<{ user: UserProfile }>>(`/profile/${username}`).then((r) => r.data.data.user),

  follow: (userId: number) => api.post(`/users/${userId}/follow`),
  unfollow: (userId: number) => api.delete(`/users/${userId}/follow`),

  getNotifications: (page = 1) =>
    api.get<PaginatedResponse<Notification>>('/users/me/notifications', { params: { page, limit: 20 } }).then((r) => r.data),

  markAllNotificationsRead: () => api.delete('/users/me/notifications'),

  getSessions: () => api.get('/users/me/sessions').then((r) => r.data.data),

  revokeSession: (id: number) => api.delete(`/users/me/sessions/${id}`),

  deleteAccount: () => api.delete('/users/me'),
};
