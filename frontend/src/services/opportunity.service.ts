import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Opportunity } from '@/lib/types';

export const opportunityService = {
  list: (params?: object) => api.get<PaginatedResponse<Opportunity>>('/opportunities', { params }).then((r) => r.data),
  get: (id: number) => api.get<ApiResponse<{ opportunity: Opportunity; applied: boolean; saved: boolean; application: any }>>(`/opportunities/${id}`).then((r) => r.data.data),
  create: (data: object) => api.post<ApiResponse<{ opportunity: Opportunity }>>('/opportunities', data).then((r) => r.data.data.opportunity),
  update: (id: number, data: object) => api.put<ApiResponse<{ opportunity: Opportunity }>>(`/opportunities/${id}`, data).then((r) => r.data.data.opportunity),
  close: (id: number) => api.delete(`/opportunities/${id}`),
  apply: (id: number, data: FormData) => api.post<ApiResponse<{ application: any }>>(`/opportunities/${id}/apply`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.application),
  getApplications: (id: number, params?: object) => api.get(`/opportunities/${id}/applications`, { params }).then((r) => r.data),
  updateApplication: (oppId: number, appId: number, data: object) => api.patch(`/opportunities/${oppId}/applications/${appId}`, data),
  toggleSave: (id: number) => api.post<ApiResponse<{ saved: boolean }>>(`/opportunities/${id}/save`).then((r) => r.data.data),
};
