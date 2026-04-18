// Legacy compatibility shim — all auth logic is now in AuthContext
export { AuthProvider as UserProvider, useAuth as useUser } from './AuthContext';
export type { } from './AuthContext';
