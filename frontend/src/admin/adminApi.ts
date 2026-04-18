import axios, { type InternalAxiosRequestConfig } from 'axios';

const BASE = (import.meta.env.VITE_API_URL || '/api/v1') + '/admin';

const adminApi = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const adminTokenStorage = {
  get:   (): string | null => localStorage.getItem('admin_access_token'),
  set:   (t: string)       => localStorage.setItem('admin_access_token', t),
  clear: ()                => localStorage.removeItem('admin_access_token'),
};

adminApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = adminTokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      adminTokenStorage.clear();
      window.dispatchEvent(new Event('admin:logout'));
    }
    return Promise.reject(err);
  }
);

export default adminApi;
