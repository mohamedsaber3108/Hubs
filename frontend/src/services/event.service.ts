import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Event } from '@/lib/types';

export const eventService = {
  list: (params?: object) => api.get<PaginatedResponse<Event>>('/events', { params }).then((r) => r.data),
  get: (id: number) => api.get<ApiResponse<{ event: Event; rsvp: any }>>(`/events/${id}`).then((r) => r.data.data),
  create: (data: FormData) => api.post<ApiResponse<{ event: Event }>>('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.event),
  update: (id: number, data: object) => api.put<ApiResponse<{ event: Event }>>(`/events/${id}`, data).then((r) => r.data.data.event),
  cancel: (id: number) => api.delete(`/events/${id}`),
  rsvp: (id: number, status: 'going' | 'maybe' | 'not_going') => api.post<ApiResponse<{ status: string }>>(`/events/${id}/rsvp`, { status }).then((r) => r.data.data),
  getAttendees: (id: number, status = 'going') => api.get(`/events/${id}/attendees`, { params: { status, limit: 50 } }).then((r) => r.data),
};
