import adminApi from '../adminApi';
export const adminContentService = {
  listPosts:       (params?: object) => adminApi.get('/content/posts', { params }).then((r) => r.data),
  pinPost:         (id: number, is_pinned: boolean) => adminApi.patch(`/content/posts/${id}/pin`, { is_pinned }),
  deletePost:      (id: number) => adminApi.delete(`/content/posts/${id}`),
  deleteComment:   (id: number) => adminApi.delete(`/content/comments/${id}`),
  listEvents:      (params?: object) => adminApi.get('/content/events', { params }).then((r) => r.data),
  deleteEvent:     (id: number) => adminApi.delete(`/content/events/${id}`),
  listResources:   (params?: object) => adminApi.get('/content/resources', { params }).then((r) => r.data),
  deleteResource:  (id: number) => adminApi.delete(`/content/resources/${id}`),
  listChallenges:  (params?: object) => adminApi.get('/content/challenges', { params }).then((r) => r.data),
  listCommunities: () => adminApi.get('/content/communities').then((r) => r.data),
  toggleCommunity: (id: number) => adminApi.patch(`/content/communities/${id}/toggle`),
};
