import adminApi from '../adminApi';
export const adminSettingsService = {
  getSettings:   () => adminApi.get('/settings').then((r) => r.data.data.settings),
  updateSetting: (key: string, value: string) => adminApi.put(`/settings/${key}`, { value }),
  getFlags:      () => adminApi.get('/flags').then((r) => r.data.data.flags),
  toggleFlag:    (name: string) => adminApi.patch(`/flags/${name}/toggle`),
  getPricing:    () => adminApi.get('/pricing').then((r) => r.data.data.plans),
};
