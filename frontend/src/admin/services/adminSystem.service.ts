import adminApi from '../adminApi';
export const adminSystemService = {
  getHealth:     () => adminApi.get('/system/health').then((r) => r.data.data),
  pauseQueue:    (q: string) => adminApi.post(`/system/queues/${q}/pause`),
  resumeQueue:   (q: string) => adminApi.post(`/system/queues/${q}/resume`),
  cleanQueue:    (q: string) => adminApi.post(`/system/queues/${q}/clean`),
  flushCache:    () => adminApi.delete('/system/cache'),
  getMaintenance:() => adminApi.get('/system/maintenance').then((r) => r.data.data),
  setMaintenance:(enabled: boolean, message?: string) => adminApi.put('/system/maintenance', { enabled, message }),
};
