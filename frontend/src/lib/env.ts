export const env = {
  API_URL:    import.meta.env.VITE_API_URL    || 'http://localhost:3000/api/v1',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
  APP_NAME:   import.meta.env.VITE_APP_NAME   || 'USAM Hub',
};
