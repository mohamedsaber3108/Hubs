import adminApi from '../adminApi';
export const adminUsersService = {
  list: (params?: object) => adminApi.get('/users', { params }).then((r) => r.data),
  get:  (id: number) => adminApi.get(`/users/${id}`).then((r) => r.data.data.user),
  updateStatus: (id: number, status: string, reason?: string) => adminApi.patch(`/users/${id}/status`, { status, reason }),
  updateRole:   (id: number, role: string) => adminApi.patch(`/users/${id}/role`, { role }),
  forceReset:   (id: number) => adminApi.post(`/users/${id}/force-reset`),
  delete:       (id: number) => adminApi.delete(`/users/${id}`),
};
