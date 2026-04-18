import adminApi from '../adminApi';
export const adminDashboardService = {
  getStats:    () => adminApi.get('/dashboard/stats').then((r) => r.data.data),
  getCharts:   (period = '30d') => adminApi.get('/dashboard/charts', { params: { period } }).then((r) => r.data.data),
  getActivity: (limit = 10) => adminApi.get('/dashboard/activity', { params: { limit } }).then((r) => r.data.data.activities),
};
