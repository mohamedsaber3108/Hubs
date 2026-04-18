import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Mentor, MentorRequest } from '@/lib/types';

export const mentorService = {
  list: (params?: object) => api.get<PaginatedResponse<Mentor>>('/mentors', { params }).then((r) => r.data),
  get: (id: number) => api.get<ApiResponse<{ mentor: Mentor; my_request: MentorRequest | null }>>(`/mentors/${id}`).then((r) => r.data.data),
  become: (data: object) => api.post<ApiResponse<{ mentor: Mentor }>>('/mentors', data).then((r) => r.data.data.mentor),
  updateProfile: (data: FormData) => api.put('/mentors/me', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  requestSession: (id: number, data: object) => api.post<ApiResponse<{ session: MentorRequest }>>(`/mentors/${id}/request`, data).then((r) => r.data.data.session),
  getRequests: (type?: string) => api.get<PaginatedResponse<MentorRequest>>('/mentors/requests', { params: { type } }).then((r) => r.data),
  updateRequest: (id: number, data: object) => api.patch<ApiResponse<{ request: MentorRequest }>>(`/mentors/requests/${id}`, data).then((r) => r.data.data.request),
};
