import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send refresh-token cookie
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStorage = {
  get:    (): string | null      => localStorage.getItem('access_token'),
  set:    (t: string)            => localStorage.setItem('access_token', t),
  clear:  ()                     => localStorage.removeItem('access_token'),
};

// ─── Request interceptor — attach bearer token ───────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — auto refresh on 401 ─────────────────────────────
let refreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);
    if (original.url?.includes('/auth/')) return Promise.reject(error);

    if (refreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
      const newToken: string = data.data.access_token;
      tokenStorage.set(newToken);
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      tokenStorage.clear();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(error);
    } finally {
      refreshing = false;
    }
  }
);

export default api;
