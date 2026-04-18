import adminApi from '../adminApi';
export const adminLogsService = {
  list:      (p?: object) => adminApi.get('/logs', { params: p }).then((r) => r.data),
  summary:   () => adminApi.get('/logs/summary').then((r) => r.data.data),
  exportCsv: (p?: object) => adminApi.get('/logs/export', { params: p, responseType: 'blob' }).then((r) => r.data),
};
