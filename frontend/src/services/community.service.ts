import api from '@/lib/api';
import type { ApiResponse, Community, RecommendationsResult } from '@/lib/types';

export const communityService = {
  list: () => api.get<ApiResponse<{ communities: Community[] }>>('/communities').then((r) => r.data.data.communities),

  get: (slug: string) => api.get<ApiResponse<{ community: Community }>>(`/communities/${slug}`).then((r) => r.data.data.community),

  // Persona-aware recommendations. Works anonymously (non-personalized) and
  // for logged-in users (ranked by their onboarding personas + membership).
  recommended: () =>
    api.get<ApiResponse<RecommendationsResult>>('/communities/recommended').then((r) => r.data.data),

  join: (slug: string) => api.post(`/communities/${slug}/join`),
  leave: (slug: string) => api.delete(`/communities/${slug}/join`),
};
