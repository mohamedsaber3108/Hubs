import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Resource } from '@/lib/types';

export const resourceService = {
  list: (params?: object) => api.get<PaginatedResponse<Resource>>('/resources', { params }).then((r) => r.data),
  get: (id: number) => api.get<ApiResponse<{ resource: Resource; my_rating: number | null }>>(`/resources/${id}`).then((r) => r.data.data),
  create: (data: FormData) => api.post<ApiResponse<{ resource: Resource }>>('/resources', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.resource),
  update: (id: number, data: object) => api.put<ApiResponse<{ resource: Resource }>>(`/resources/${id}`, data).then((r) => r.data.data.resource),
  delete: (id: number) => api.delete(`/resources/${id}`),
  download: (id: number) => api.post<ApiResponse<{ url: string }>>(`/resources/${id}/download`).then((r) => r.data.data.url),
  rate: (id: number, rating: number, review?: string) => api.post(`/resources/${id}/rate`, { rating, review }),
};
