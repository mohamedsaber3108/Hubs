import adminApi, { adminTokenStorage } from '../adminApi';
import type { AdminUser } from '../adminTypes';
export const adminAuthService = {
  login: async (email: string, password: string, totp_code?: string): Promise<AdminUser> => {
    const { data } = await adminApi.post<{ success: boolean; data: { access_token: string; admin: AdminUser } }>('/auth/login', { email, password, totp_code });
    adminTokenStorage.set(data.data.access_token);
    return data.data.admin;
  },
  logout: async () => { await adminApi.post('/auth/logout').catch(() => {}); adminTokenStorage.clear(); },
  me: () => adminApi.get<{ success: boolean; data: { admin: AdminUser } }>('/auth/me').then((r) => r.data.data.admin),
};
