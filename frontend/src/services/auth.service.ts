import api, { tokenStorage } from '@/lib/api';
import type { ApiResponse, AuthUser, LoginResponse } from '@/lib/types';

export const authService = {
  register: (data: { first_name: string; last_name: string; username: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: AuthUser }>>('/auth/register', data),

  login: async (data: { email: string; password: string; remember_me?: boolean }): Promise<AuthUser> => {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    tokenStorage.set(res.data.data.access_token);
    return res.data.data.user;
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => {});
    tokenStorage.clear();
  },

  getMe: () => api.get<ApiResponse<{ user: AuthUser }>>('/users/me').then((r) => r.data.data.user),

  // SEC-03: after an OAuth redirect the access token is NOT in the URL. The
  // backend set an httpOnly refresh cookie; exchange it for an access token
  // here (withCredentials sends the cookie), store it, then load the profile.
  exchangeOAuth: async (): Promise<AuthUser> => {
    const res = await api.post<ApiResponse<{ access_token: string }>>('/auth/refresh-token', {});
    tokenStorage.set(res.data.data.access_token);
    return api.get<ApiResponse<{ user: AuthUser }>>('/users/me').then((r) => r.data.data.user);
  },

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),

  oauthUrl: (provider: 'google' | 'github' | 'linkedin' | 'facebook') =>
    `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/${provider}`,
};
