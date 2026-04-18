import adminApi from '../adminApi';
export const adminAnalyticsService = {
  users:       (p?: object) => adminApi.get('/analytics/users',       { params: p }).then((r) => r.data.data),
  content:     (p?: object) => adminApi.get('/analytics/content',     { params: p }).then((r) => r.data.data),
  communities: (p?: object) => adminApi.get('/analytics/communities', { params: p }).then((r) => r.data.data),
  engagement:  (p?: object) => adminApi.get('/analytics/engagement',  { params: p }).then((r) => r.data.data),
  revenue:     (p?: object) => adminApi.get('/analytics/revenue',     { params: p }).then((r) => r.data.data),
};
