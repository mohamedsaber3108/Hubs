import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Challenge, ChallengeSubmission } from '@/lib/types';

export const challengeService = {
  list: (params?: object) => api.get<PaginatedResponse<Challenge>>('/challenges', { params }).then((r) => r.data),
  get: (id: number) => api.get<ApiResponse<{ challenge: Challenge; my_submission: any }>>(`/challenges/${id}`).then((r) => r.data.data),
  create: (data: FormData) => api.post<ApiResponse<{ challenge: Challenge }>>('/challenges', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.challenge),
  update: (id: number, data: object) => api.put<ApiResponse<{ challenge: Challenge }>>(`/challenges/${id}`, data).then((r) => r.data.data.challenge),
  submit: (id: number, data: FormData) => api.post<ApiResponse<{ submission: ChallengeSubmission }>>(`/challenges/${id}/submit`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.submission),
  getSubmissions: (id: number, params?: object) => api.get<PaginatedResponse<ChallengeSubmission>>(`/challenges/${id}/submissions`, { params }).then((r) => r.data),
  vote: (submissionId: number) => api.post<ApiResponse<{ voted: boolean }>>(`/challenges/submissions/${submissionId}/vote`).then((r) => r.data.data),
  announceWinners: (id: number, winners: any[]) => api.post(`/challenges/${id}/winners`, { winners }),
};
